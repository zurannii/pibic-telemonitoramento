"use client";

import { useEffect, useState } from "react";

import type {
  BootstrapPayload,
  OutboundMessageFormat,
  PatientDetails,
  PatientReport,
  PublicUser
} from "@/lib/shared/types";
import type { ToastItem } from "../components/ToastStack";
import type { PatientProfileTab, QuestionView, ScreenId } from "../types";

const LIVE_REFRESH_INTERVAL_MS = 5_000;
const NAVIGATION_STORAGE_KEY = "telemonitor_navigation";

const SCREEN_IDS: ScreenId[] = [
  "overview",
  "patients",
  "patient-create",
  "patient-profile",
  "alerts",
  "questions",
  "reports",
  "team"
];

const PATIENT_PROFILE_TABS: PatientProfileTab[] = [
  "summary",
  "responses",
  "graphs",
  "plan",
  "team",
  "reports",
  "conduct"
];

type StoredNavigation = {
  patientId: string | null;
  patientProfileTab: PatientProfileTab;
  screen: ScreenId;
};

function readStoredNavigation(): StoredNavigation | null {
  try {
    const stored = window.localStorage.getItem(NAVIGATION_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as Partial<StoredNavigation>;
    if (!parsed.screen || !SCREEN_IDS.includes(parsed.screen)) return null;

    return {
      screen: parsed.screen,
      patientId: typeof parsed.patientId === "string" ? parsed.patientId : null,
      patientProfileTab:
        parsed.patientProfileTab && PATIENT_PROFILE_TABS.includes(parsed.patientProfileTab)
          ? parsed.patientProfileTab
          : "summary"
    };
  } catch {
    return null;
  }
}

function storeNavigation(navigation: StoredNavigation) {
  try {
    window.localStorage.setItem(NAVIGATION_STORAGE_KEY, JSON.stringify(navigation));
  } catch {
    // A navegacao continua funcional mesmo se o navegador bloquear armazenamento local.
  }
}

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
        storeNavigation({ screen: "patients", patientId: null, patientProfileTab: "summary" });
      }
    }
  };

  const loadInitialState = async () => {
    setLoadError(null);
    setLoadingSession(true);

    try {
      const storedNavigation = readStoredNavigation();
      const session = await apiRequest<{ user: PublicUser | null }>("/api/auth/session", {
        cache: "no-store"
      });

      if (session.user) {
        const nextBootstrap = await loadBootstrap();
        if (
          storedNavigation?.screen === "patient-profile" &&
          storedNavigation.patientId &&
          nextBootstrap.patients.some((patient) => patient.id === storedNavigation.patientId)
        ) {
          await loadPatientDetails(storedNavigation.patientId);
          setActivePatientProfileTab(storedNavigation.patientProfileTab);
          setActiveScreen("patient-profile");
        } else if (storedNavigation) {
          const restoredScreen =
            storedNavigation.screen === "patient-profile" ? "patients" : storedNavigation.screen;
          setActiveScreen(restoredScreen);
          setActivePatientProfileTab(storedNavigation.patientProfileTab);
        }
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

  useEffect(() => {
    if (!bootstrap || working) return;

    let refreshInProgress = false;

    const refreshLiveData = async () => {
      if (refreshInProgress || document.visibilityState !== "visible") return;

      refreshInProgress = true;
      try {
        const nextBootstrap = await apiRequest<BootstrapPayload>("/api/bootstrap", {
          cache: "no-store"
        });
        setBootstrap(nextBootstrap);

        if (selectedPatientId) {
          const stillExists = nextBootstrap.patients.some(
            (patient) => patient.id === selectedPatientId
          );
          if (stillExists) {
            const details = await apiRequest<PatientDetails>(
              `/api/patients/${selectedPatientId}`,
              { cache: "no-store" }
            );
            setPatientDetails(details);
          } else {
            setPatientDetails(null);
            setSelectedPatientId(null);
            setActiveScreen("patients");
            storeNavigation({ screen: "patients", patientId: null, patientProfileTab: "summary" });
          }
        }
      } catch {
        // Mantem os ultimos dados validos; a proxima rodada tenta novamente.
      } finally {
        refreshInProgress = false;
      }
    };

    const interval = window.setInterval(() => {
      void refreshLiveData();
    }, LIVE_REFRESH_INTERVAL_MS);
    window.addEventListener("focus", refreshLiveData);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshLiveData);
    };
  }, [bootstrap?.currentUser.id, selectedPatientId, working]);

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
      window.localStorage.removeItem(NAVIGATION_STORAGE_KEY);
    }, "Sessao encerrada.");
  };

  const selectScreen = (screen: ScreenId) => {
    setActiveScreen(screen);
    storeNavigation({
      screen,
      patientId: screen === "patient-profile" ? selectedPatientId : null,
      patientProfileTab: activePatientProfileTab
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectPatientProfileTab = (tab: PatientProfileTab) => {
    setActivePatientProfileTab(tab);
    storeNavigation({ screen: "patient-profile", patientId: selectedPatientId, patientProfileTab: tab });
  };

  const openPatientProfile = async (patientId: string) => {
    await withFeedback(async () => {
      await loadPatientDetails(patientId);
      setActivePatientProfileTab("summary");
      setActiveScreen("patient-profile");
      storeNavigation({ screen: "patient-profile", patientId, patientProfileTab: "summary" });
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
    requiresAudioMessages: boolean;
    preferredChannel: "whatsapp" | "telegram";
    contactWindowStart: string;
    contactWindowEnd: string;
    notes: string;
  }) => {
    await withFeedback(async () => {
      const result = await apiRequest<{ patient: { id: string } }>("/api/patients", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      await loadBootstrap();
      await loadPatientDetails(result.patient.id);
      setActivePatientProfileTab("summary");
      setActiveScreen("patient-profile");
      storeNavigation({
        screen: "patient-profile",
        patientId: result.patient.id,
        patientProfileTab: "summary"
      });
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

  const handleSendMessage = async (
    patientId: string,
    payload: {
      questionId?: string;
      text?: string;
      channel?: "whatsapp" | "telegram";
      messageType?: OutboundMessageFormat;
    }
  ) => {
    await withFeedback(async () => {
      await apiRequest(`/api/patients/${patientId}/messages`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      await refreshData();
    }, "Mensagem enviada ao paciente.");
  };

  const generatePatientReport = async (patientId: string) => {
    return withFeedback(
      () =>
        apiRequest<PatientReport>(`/api/reports/patients/${patientId}`, {
          cache: "no-store"
        }),
      "Relatorio atualizado."
    );
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
    generatePatientReport,
    handleAddSchedule,
    handleCreatePatient,
    handleCreateQuestion,
    handleCreateUser,
    handleLogin,
    handleLogout,
    handleRegister,
    handleSaveTelegram,
    handleSaveWhatsApp,
    handleSendMessage,
    loadError,
    loadingSession,
    openPatientProfile,
    patientDetails,
    questionView,
    refreshData,
    retryInitialLoad: loadInitialState,
    selectScreen,
    setActivePatientProfileTab: selectPatientProfileTab,
    setQuestionView,
    toasts,
    working
  };
}
