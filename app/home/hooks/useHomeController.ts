"use client";

import { useEffect, useState } from "react";

import type { BootstrapPayload, PatientDetails, PublicUser } from "@/lib/shared/types";
import type { ToastItem } from "../components/ToastStack";
import type { PatientProfileTab, QuestionView, ScreenId } from "../types";

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

export function useHomeController() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>("overview");
  const [activePatientProfileTab, setActivePatientProfileTab] = useState<PatientProfileTab>("summary");
  const [bootstrap, setBootstrap] = useState<BootstrapPayload | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [working, setWorking] = useState(false);
  const [questionView, setQuestionView] = useState<QuestionView>("create");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
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

  const loadInitialState = async () => {
    setLoadError(null);
    setLoadingSession(true);

    try {
      const session = await apiRequest<{ user: PublicUser | null }>("/api/auth/session", {
        cache: "no-store"
      });

      if (session.user) {
        await loadBootstrap();
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Nao foi possivel carregar a plataforma.");
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    void loadInitialState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const withFeedback = async <T>(action: () => Promise<T>, successMessage?: string) => {
    setWorking(true);
    try {
      const result = await action();
      if (successMessage) {
        addToast("success", successMessage);
      }
      return result;
    } catch (error) {
      addToast("error", error instanceof Error ? error.message : "Nao foi possivel concluir a acao.");
      return undefined;
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
    }, "Usuario criado com sucesso.");
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
    }, "Sessao encerrada.");
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
      description: "Tem certeza? Isso remove tambem alertas, historico e agendamentos desse paciente.",
      actionLabel: "Excluir paciente",
      onConfirm: () => {
        closeConfirm();
        void withFeedback(async () => {
          await apiRequest(`/api/patients/${patientId}`, {
            method: "DELETE",
            body: JSON.stringify({})
          });
          await refreshData();
        }, "Paciente excluido.");
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
      description: "Tem certeza? Os agendamentos ligados a essa pergunta tambem serao removidos.",
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
      description: "Esse alerta sera marcado como resolvido e sai da fila principal.",
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
      description: "Essa pessoa perdera acesso ao sistema. Voce quer continuar?",
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
    }, "Configuracao do WhatsApp salva.");
  };

  const handleSaveTelegram = async (payload: {
    enabled: boolean;
    botToken: string;
    botUsername: string;
    webhookSecret: string;
  }) => {
    const result = await withFeedback(async () => {
      const response = await apiRequest<{ success: boolean; webhookRegistered: boolean; warning: string | null }>(
        "/api/telegram/settings",
        {
          method: "PATCH",
          body: JSON.stringify(payload)
        }
      );
      await refreshData();
      return response;
    });

    if (!result) {
      return;
    }

    if (result?.warning) {
      addToast("error", result.warning);
    } else {
      addToast("success", "Configuracao do Telegram salva.");
    }
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
      description: "Esse horario deixara de enviar mensagens automaticamente.",
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

  return {
    activePatientProfileTab,
    activeScreen,
    askConfirmation,
    bootstrap,
    closeConfirm,
    confirm,
    confirmDeletePatient,
    confirmDeleteQuestion,
    confirmDeleteSchedule,
    confirmDeleteUser,
    confirmResolveAlert,
    handleAddSchedule,
    handleCreatePatient,
    handleCreateQuestion,
    handleCreateUser,
    handleLogin,
    handleLogout,
    handleRegister,
    handleSaveTelegram,
    handleSaveWhatsApp,
    handleSendTest,
    loadError,
    loadingSession,
    openPatientProfile,
    patientDetails,
    questionView,
    refreshData,
    retryInitialLoad: loadInitialState,
    selectScreen,
    setActivePatientProfileTab,
    setQuestionView,
    toasts,
    working
  };
}
