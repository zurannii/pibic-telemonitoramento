"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import type { BootstrapPayload, PatientDetails, PublicUser } from "@/lib/shared/types";
import { Sidebar } from "./home/components/Sidebar";
import { Topbar } from "./home/components/Topbar";
import { AlertsScreen } from "./home/screens/AlertsScreen";
import { OverviewScreen } from "./home/screens/OverviewScreen";
import { PatientCreateScreen } from "./home/screens/PatientCreateScreen";
import { PatientProfileScreen } from "./home/screens/PatientProfileScreen";
import { PatientsScreen } from "./home/screens/PatientsScreen";
import { QuestionsScreen } from "./home/screens/QuestionsScreen";
import { ReportsScreen } from "./home/screens/ReportsScreen";
import { TeamScreen } from "./home/screens/TeamScreen";
import type { PatientProfileTab, QuestionView, ScreenId } from "./home/types";
import { AuthPanel } from "./home/components/AuthPanel";
import { ConfirmModal } from "./home/components/ConfirmModal";
import { ToastStack, type ToastItem } from "./home/components/ToastStack";

type ConfirmState = {
  actionLabel?: string;
  description: string;
  onConfirm: () => void;
  open: boolean;
  title: string;
};

async function apiRequest<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Ocorreu um erro inesperado.");
  }

  return data;
}

export default function Home() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>("overview");
  const [activePatientProfileTab, setActivePatientProfileTab] = useState<PatientProfileTab>("summary");
  const [bootstrap, setBootstrap] = useState<BootstrapPayload | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [working, setWorking] = useState(false);
  const [questionView, setQuestionView] = useState<QuestionView>("create");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => undefined
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (tone: ToastItem["tone"], message: string) => {
    const toast = {
      id: crypto.randomUUID(),
      tone,
      message
    };

    setToasts((current) => [...current, toast]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toast.id));
    }, 4000);
  };

  const closeConfirm = () => {
    setConfirm((current) => ({ ...current, open: false }));
  };

  const askConfirmation = (payload: Omit<ConfirmState, "open">) => {
    setConfirm({
      ...payload,
      open: true
    });
  };

  const loadBootstrap = async () => {
    const payload = await apiRequest<BootstrapPayload>("/api/bootstrap", {
      cache: "no-store"
    });
    setBootstrap(payload);
    return payload;
  };

  const loadPatientDetails = async (patientId: string) => {
    const details = await apiRequest<PatientDetails>(`/api/patients/${patientId}`, {
      cache: "no-store"
    });
    setPatientDetails(details);
    setSelectedPatientId(patientId);
    return details;
  };

  const refreshData = async () => {
    const nextBootstrap = await loadBootstrap();
    if (selectedPatientId) {
      const stillExists = nextBootstrap.patients.some((patient) => patient.id === selectedPatientId);
      if (stillExists) {
        await loadPatientDetails(selectedPatientId);
      } else {
        setPatientDetails(null);
        setSelectedPatientId(null);
        setActiveScreen("patients");
      }
    }
  };

  useEffect(() => {
    const start = async () => {
      try {
        const session = await apiRequest<{ user: PublicUser | null }>("/api/auth/session", {
          cache: "no-store"
        });

        if (session.user) {
          await loadBootstrap();
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingSession(false);
      }
    };

    void start();
  }, []);

  const withFeedback = async (action: () => Promise<void>, successMessage: string) => {
    setWorking(true);
    try {
      await action();
      addToast("success", successMessage);
    } catch (error) {
      addToast("error", error instanceof Error ? error.message : "Não foi possível concluir a ação.");
    } finally {
      setWorking(false);
    }
  };

  const handleLogin = async (payload: { email: string; password: string }) => {
    await withFeedback(async () => {
      await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      await loadBootstrap();
    }, "Login realizado com sucesso.");
  };

  const handleRegister = async (payload: {
    name: string;
    email: string;
    password: string;
    specialty: string;
  }) => {
    await withFeedback(async () => {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      await loadBootstrap();
    }, "Usuário criado com sucesso.");
  };

  const handleLogout = async () => {
    await withFeedback(async () => {
      await apiRequest("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({})
      });
      setBootstrap(null);
      setPatientDetails(null);
      setSelectedPatientId(null);
      setActiveScreen("overview");
    }, "Sessão encerrada.");
  };

  const selectScreen = (screen: ScreenId) => {
    setActiveScreen(screen);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openPatientProfile = async (patientId: string) => {
    await withFeedback(async () => {
      await loadPatientDetails(patientId);
      setActivePatientProfileTab("summary");
      setActiveScreen("patient-profile");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, "Perfil do paciente carregado.");
  };

  const handleCreatePatient = async (payload: {
    name: string;
    age: string;
    phone: string;
    condition: string;
    responsibleUserId: string;
    preferredResponseFormat: "text" | "audio" | "buttons";
    preferredChannel: "whatsapp" | "telegram";
    contactWindowStart: string;
    contactWindowEnd: string;
    notes: string;
  }) => {
    await withFeedback(async () => {
      await apiRequest("/api/patients", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      await refreshData();
      setActiveScreen("patients");
    }, "Paciente criado com sucesso.");
  };

  const confirmDeletePatient = (patientId: string) => {
    askConfirmation({
      title: "Excluir paciente",
      description: "Tem certeza? Isso remove também alertas, histórico e agendamentos desse paciente.",
      actionLabel: "Excluir paciente",
      onConfirm: () => {
        closeConfirm();
        void withFeedback(async () => {
          await apiRequest(`/api/patients/${patientId}`, {
            method: "DELETE",
            body: JSON.stringify({})
          });
          await refreshData();
        }, "Paciente excluído.");
      }
    });
  };

  const handleCreateQuestion = async (payload: {
    title: string;
    text: string;
    simpleText: string;
    theme: string;
    responseType: string;
    defaultTimes: string;
  }) => {
    await withFeedback(async () => {
      await apiRequest("/api/questions", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      await refreshData();
      setQuestionView("library");
    }, "Pergunta criada.");
  };

  const confirmDeleteQuestion = (questionId: string) => {
    askConfirmation({
      title: "Excluir pergunta",
      description: "Tem certeza? Os agendamentos ligados a essa pergunta também serão removidos.",
      actionLabel: "Excluir pergunta",
      onConfirm: () => {
        closeConfirm();
        void withFeedback(async () => {
          await apiRequest(`/api/questions/${questionId}`, {
            method: "DELETE",
            body: JSON.stringify({})
          });
          await refreshData();
        }, "Pergunta removida.");
      }
    });
  };

  const confirmResolveAlert = (alertId: string) => {
    askConfirmation({
      title: "Resolver alerta",
      description: "Esse alerta será marcado como resolvido e sai da fila principal.",
      actionLabel: "Resolver alerta",
      onConfirm: () => {
        closeConfirm();
        void withFeedback(async () => {
          await apiRequest(`/api/alerts/${alertId}`, {
            method: "PATCH",
            body: JSON.stringify({ status: "resolved" })
          });
          await refreshData();
        }, "Alerta resolvido.");
      }
    });
  };

  const handleCreateUser = async (payload: {
    name: string;
    email: string;
    specialty: string;
    role: string;
    password: string;
  }) => {
    await withFeedback(async () => {
      await apiRequest("/api/users", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      await refreshData();
    }, "Profissional adicionado.");
  };

  const confirmDeleteUser = (userId: string) => {
    askConfirmation({
      title: "Excluir profissional",
      description: "Essa pessoa perderá acesso ao sistema. Você quer continuar?",
      actionLabel: "Excluir profissional",
      onConfirm: () => {
        closeConfirm();
        void withFeedback(async () => {
          await apiRequest(`/api/users/${userId}`, {
            method: "DELETE",
            body: JSON.stringify({})
          });
          await refreshData();
        }, "Profissional removido.");
      }
    });
  };

  const handleSaveWhatsApp = async (payload: {
    enabled: boolean;
    accessToken: string;
    phoneNumberId: string;
    businessAccountId: string;
    verifyToken: string;
    appSecret: string;
    apiVersion: string;
  }) => {
    await withFeedback(async () => {
      await apiRequest("/api/whatsapp/settings", {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
      await refreshData();
    }, "Configuração do WhatsApp salva.");
  };

  const handleSaveTelegram = async (payload: {
    enabled: boolean;
    botToken: string;
    botUsername: string;
    webhookSecret: string;
  }) => {
    await withFeedback(async () => {
      await apiRequest("/api/telegram/settings", {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
      await refreshData();
    }, "Configuracao do Telegram salva.");
  };

  const handleAddSchedule = async (payload: {
    patientId: string;
    questionId: string;
    label: string;
    time: string;
    timezone: string;
    daysOfWeek: number[];
  }) => {
    await withFeedback(async () => {
      await apiRequest(`/api/patients/${payload.patientId}/schedules`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      await refreshData();
    }, "Agendamento criado.");
  };

  const confirmDeleteSchedule = (patientId: string, scheduleId: string) => {
    askConfirmation({
      title: "Remover agendamento",
      description: "Esse horário deixará de enviar mensagens automaticamente.",
      actionLabel: "Remover agendamento",
      onConfirm: () => {
        closeConfirm();
        void withFeedback(async () => {
          await apiRequest(`/api/patients/${patientId}/schedules`, {
            method: "DELETE",
            body: JSON.stringify({ scheduleId })
          });
          await refreshData();
        }, "Agendamento removido.");
      }
    });
  };

  const handleSendTest = async (patientId: string, questionId: string, channel?: "whatsapp" | "telegram") => {
    await withFeedback(async () => {
      await apiRequest(`/api/patients/${patientId}/send-test`, {
        method: "POST",
        body: JSON.stringify({ questionId, channel })
      });
      await refreshData();
    }, "Mensagem de teste enviada.");
  };

  if (loadingSession) {
    return <main className={styles.loadingScreen}>Carregando plataforma...</main>;
  }

  if (!bootstrap) {
    return (
      <>
        <AuthPanel busy={working} onLogin={handleLogin} onRegister={handleRegister} />
        <ToastStack items={toasts} />
      </>
    );
  }

  const activeNav =
    activeScreen === "patient-create" || activeScreen === "patient-profile" ? "patients" : activeScreen;
  const isPatientProfile = activeScreen === "patient-profile";

  const renderScreen = () => {
    switch (activeScreen) {
      case "overview":
        return (
          <OverviewScreen
            dashboard={bootstrap.dashboard}
            onOpenPatient={openPatientProfile}
          />
        );
      case "patients":
        return (
          <PatientsScreen
            onDeletePatient={confirmDeletePatient}
            onOpenPatientProfile={openPatientProfile}
            patients={bootstrap.patients}
            selectScreen={selectScreen}
          />
        );
      case "patient-create":
        return (
          <PatientCreateScreen
            onSubmit={handleCreatePatient}
            professionals={bootstrap.users}
            selectScreen={selectScreen}
          />
        );
      case "patient-profile":
        return patientDetails ? (
          <PatientProfileScreen
            activeTab={activePatientProfileTab}
            details={patientDetails}
            onAddSchedule={handleAddSchedule}
            onBack={() => selectScreen("patients")}
            onDeleteSchedule={confirmDeleteSchedule}
            onResolveAlert={confirmResolveAlert}
            onSelectTab={setActivePatientProfileTab}
            onSendTest={handleSendTest}
            questions={bootstrap.questions}
            telegramInfo={bootstrap.telegram}
            users={bootstrap.users}
          />
        ) : (
          <main className={styles.loadingScreen}>Carregando perfil do paciente...</main>
        );
      case "alerts":
        return (
          <AlertsScreen
            alerts={bootstrap.alerts}
            onResolveAlert={confirmResolveAlert}
            onViewPatient={openPatientProfile}
          />
        );
      case "questions":
        return (
          <QuestionsScreen
            onCreateQuestion={handleCreateQuestion}
            onDeleteQuestion={confirmDeleteQuestion}
            questionView={questionView}
            questions={bootstrap.questions}
            setQuestionView={setQuestionView}
          />
        );
      case "reports":
        return <ReportsScreen dashboard={bootstrap.dashboard} patients={bootstrap.patients} />;
      case "team":
        return (
          <TeamScreen
            currentUser={bootstrap.currentUser}
            onCreateUser={handleCreateUser}
            onDeleteUser={confirmDeleteUser}
            onSaveTelegram={handleSaveTelegram}
            onSaveWhatsApp={handleSaveWhatsApp}
            patients={bootstrap.patients}
            telegramInfo={bootstrap.telegram}
            users={bootstrap.users}
            whatsappInfo={bootstrap.whatsapp}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className={`${styles.appShell} ${isPatientProfile ? styles.appShellSingle : ""}`}>
        {!isPatientProfile && <Sidebar activeNav={activeNav} onSelectScreen={selectScreen} />}

        <main className={styles.dashboard}>
          <Topbar onLogout={handleLogout} userName={bootstrap.currentUser.name} />
          <div className={styles.screenStack}>
            {renderScreen()}
          </div>
        </main>
      </div>

      <ConfirmModal
        actionLabel={confirm.actionLabel}
        description={confirm.description}
        onCancel={closeConfirm}
        onConfirm={confirm.onConfirm}
        open={confirm.open}
        title={confirm.title}
      />
      <ToastStack items={toasts} />
    </>
  );
}
