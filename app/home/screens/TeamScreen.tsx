"use client";

import { useState } from "react";
import styles from "../../page.module.css";
import type { PatientListItem, PublicUser } from "@/lib/shared/types";
import { badgeTone, cn } from "../utils";
import { Icon } from "../components/Icon";

type TeamScreenProps = {
  currentUser: PublicUser;
  onCreateUser: (payload: {
    name: string;
    email: string;
    specialty: string;
    role: string;
    password: string;
  }) => Promise<void>;
  onDeleteUser: (userId: string) => void;
  onSaveTelegram: (payload: {
    enabled: boolean;
    botToken: string;
    botUsername: string;
    webhookSecret: string;
  }) => Promise<void>;
  onSaveWhatsApp: (payload: {
    enabled: boolean;
    accessToken: string;
    phoneNumberId: string;
    businessAccountId: string;
    verifyToken: string;
    appSecret: string;
    apiVersion: string;
  }) => Promise<void>;
  patients: PatientListItem[];
  telegramInfo: {
    enabled: boolean;
    botUsername: string | null;
    botTokenConfigured: boolean;
    webhookSecretConfigured: boolean;
    updatedAt: string | null;
  };
  users: PublicUser[];
  whatsappInfo: {
    enabled: boolean;
    phoneNumberIdConfigured: boolean;
    verifyTokenConfigured: boolean;
    updatedAt: string | null;
  };
};

export function TeamScreen({
  currentUser,
  onCreateUser,
  onDeleteUser,
  onSaveTelegram,
  onSaveWhatsApp,
  patients,
  telegramInfo,
  users,
  whatsappInfo
}: TeamScreenProps) {
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    specialty: "",
    role: "professional",
    password: "demo123"
  });
  const [whatsAppForm, setWhatsAppForm] = useState({
    enabled: whatsappInfo.enabled,
    accessToken: "",
    phoneNumberId: "",
    businessAccountId: "",
    verifyToken: "",
    appSecret: "",
    apiVersion: "v23.0"
  });
  const [telegramForm, setTelegramForm] = useState({
    enabled: telegramInfo.enabled,
    botToken: "",
    botUsername: telegramInfo.botUsername ?? "",
    webhookSecret: ""
  });
  const [busyUser, setBusyUser] = useState(false);
  const [busyWhatsApp, setBusyWhatsApp] = useState(false);
  const [busyTelegram, setBusyTelegram] = useState(false);

  const saveUser = async () => {
    setBusyUser(true);
    try {
      await onCreateUser(userForm);
      setUserForm({
        name: "",
        email: "",
        specialty: "",
        role: "professional",
        password: "demo123"
      });
    } finally {
      setBusyUser(false);
    }
  };

  const saveWhatsApp = async () => {
    setBusyWhatsApp(true);
    try {
      await onSaveWhatsApp(whatsAppForm);
    } finally {
      setBusyWhatsApp(false);
    }
  };

  const saveTelegram = async () => {
    setBusyTelegram(true);
    try {
      await onSaveTelegram(telegramForm);
    } finally {
      setBusyTelegram(false);
    }
  };

  return (
    <section className={styles.screen}>
      <div className={styles.pageHead}>
        <div className={styles.pageHeading}>
          <h1>Configuracoes da Equipe</h1>
          <p>Gerencie profissionais e as integracoes de WhatsApp e Telegram no mesmo fluxo.</p>
        </div>
      </div>

      <section className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <strong>{users.length}</strong>
          <small>Total de Profissionais</small>
        </article>
        <article className={styles.summaryCard}>
          <strong>{patients.length}</strong>
          <small>Pacientes Ativos</small>
        </article>
        <article className={styles.summaryCard}>
          <strong>{whatsappInfo.enabled ? "On" : "Off"}</strong>
          <small>WhatsApp</small>
        </article>
        <article className={styles.summaryCard}>
          <strong>{telegramInfo.enabled ? "On" : "Off"}</strong>
          <small>Telegram</small>
        </article>
      </section>

      <div className={styles.contentGrid}>
        <section className={cn(styles.panel, styles.formPanel)}>
          <h2>Adicionar Profissional</h2>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Nome</span>
              <input
                onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))}
                value={userForm.name}
              />
            </label>
            <label className={styles.field}>
              <span>Email</span>
              <input
                onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
                value={userForm.email}
              />
            </label>
            <label className={styles.field}>
              <span>Especialidade</span>
              <input
                onChange={(event) => setUserForm((current) => ({ ...current, specialty: event.target.value }))}
                value={userForm.specialty}
              />
            </label>
            <label className={styles.field}>
              <span>Perfil</span>
              <select
                onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value }))}
                value={userForm.role}
              >
                <option value="professional">Profissional</option>
                <option value="viewer">Visualizador</option>
                <option value="admin">Administrador</option>
              </select>
            </label>
          </div>
          <button className={styles.primaryButton} disabled={busyUser} onClick={saveUser} type="button">
            {busyUser ? "Salvando..." : "Adicionar profissional"}
          </button>
        </section>

        <section className={cn(styles.panel, styles.formPanel)}>
          <h2>Integracao com WhatsApp</h2>
          <p className={styles.infoText}>
            Status atual: {whatsappInfo.enabled ? "ativado" : "desativado"}.
            Phone Number ID configurado: {whatsappInfo.phoneNumberIdConfigured ? "sim" : "nao"}.
          </p>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Access Token</span>
              <input
                onChange={(event) => setWhatsAppForm((current) => ({ ...current, accessToken: event.target.value }))}
                value={whatsAppForm.accessToken}
              />
            </label>
            <label className={styles.field}>
              <span>Phone Number ID</span>
              <input
                onChange={(event) => setWhatsAppForm((current) => ({ ...current, phoneNumberId: event.target.value }))}
                value={whatsAppForm.phoneNumberId}
              />
            </label>
            <label className={styles.field}>
              <span>Business Account ID</span>
              <input
                onChange={(event) =>
                  setWhatsAppForm((current) => ({ ...current, businessAccountId: event.target.value }))
                }
                value={whatsAppForm.businessAccountId}
              />
            </label>
            <label className={styles.field}>
              <span>Verify Token</span>
              <input
                onChange={(event) => setWhatsAppForm((current) => ({ ...current, verifyToken: event.target.value }))}
                value={whatsAppForm.verifyToken}
              />
            </label>
            <label className={styles.field}>
              <span>App Secret</span>
              <input
                onChange={(event) => setWhatsAppForm((current) => ({ ...current, appSecret: event.target.value }))}
                value={whatsAppForm.appSecret}
              />
            </label>
            <label className={styles.field}>
              <span>Versao da API</span>
              <input
                onChange={(event) => setWhatsAppForm((current) => ({ ...current, apiVersion: event.target.value }))}
                value={whatsAppForm.apiVersion}
              />
            </label>
          </div>
          <label className={styles.toggleRow}>
            <input
              checked={whatsAppForm.enabled}
              onChange={(event) => setWhatsAppForm((current) => ({ ...current, enabled: event.target.checked }))}
              type="checkbox"
            />
            <span>Ativar integracao</span>
          </label>
          <button className={styles.primaryButton} disabled={busyWhatsApp} onClick={saveWhatsApp} type="button">
            {busyWhatsApp ? "Salvando..." : "Salvar integracao"}
          </button>
        </section>
      </div>

      <div className={styles.contentGrid}>
        <section className={cn(styles.panel, styles.formPanel)}>
          <h2>Integracao com Telegram</h2>
          <p className={styles.infoText}>
            Status atual: {telegramInfo.enabled ? "ativado" : "desativado"}.
            Bot token configurado: {telegramInfo.botTokenConfigured ? "sim" : "nao"}.
          </p>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Bot Token</span>
              <input
                onChange={(event) => setTelegramForm((current) => ({ ...current, botToken: event.target.value }))}
                value={telegramForm.botToken}
              />
            </label>
            <label className={styles.field}>
              <span>Bot Username</span>
              <input
                onChange={(event) => setTelegramForm((current) => ({ ...current, botUsername: event.target.value }))}
                placeholder="@seu_bot"
                value={telegramForm.botUsername}
              />
            </label>
            <label className={styles.field}>
              <span>Webhook Secret</span>
              <input
                onChange={(event) => setTelegramForm((current) => ({ ...current, webhookSecret: event.target.value }))}
                value={telegramForm.webhookSecret}
              />
            </label>
          </div>
          <label className={styles.toggleRow}>
            <input
              checked={telegramForm.enabled}
              onChange={(event) => setTelegramForm((current) => ({ ...current, enabled: event.target.checked }))}
              type="checkbox"
            />
            <span>Ativar integracao</span>
          </label>
          <button className={styles.primaryButton} disabled={busyTelegram} onClick={saveTelegram} type="button">
            {busyTelegram ? "Salvando..." : "Salvar Telegram"}
          </button>
        </section>

        <section className={cn(styles.panel, styles.formPanel)}>
          <h2>Estado da Sessao</h2>
          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <Icon name="team" className={styles.buttonIcon} />
              <span>Usuario conectado: {currentUser.name}</span>
            </div>
            <div className={styles.infoRow}>
              <Icon name="clock" className={styles.buttonIcon} />
              <span>Webhook secret no Telegram: {telegramInfo.webhookSecretConfigured ? "configurado" : "pendente"}</span>
            </div>
          </div>
        </section>
      </div>

      <article className={cn(styles.panel, styles.tablePanel)}>
        <h2>Profissionais da Equipe</h2>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Especialidade</th>
              <th>Funcao</th>
              <th>Email</th>
              <th>Status</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td data-label="Nome">{user.name}</td>
                <td data-label="Especialidade">{user.specialty}</td>
                <td data-label="Funcao">{user.role}</td>
                <td data-label="Email">{user.email}</td>
                <td data-label="Status">
                  <span className={cn(styles.badge, badgeTone("Ativo"))}>Ativo</span>
                </td>
                <td data-label="Acoes">
                  {user.id !== currentUser.id ? (
                    <button className={styles.tableButton} onClick={() => onDeleteUser(user.id)} type="button">
                      Excluir
                    </button>
                  ) : (
                    <span className={styles.inlineMuted}>Usuario atual</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      <section className={cn(styles.panel, styles.webhookPanel)}>
        <h2>Como conectar os webhooks</h2>
        <div className={styles.infoList}>
          <div className={styles.infoRow}>
            <Icon name="team" className={styles.buttonIcon} />
            <span>WhatsApp: `https://seu-dominio/api/whatsapp/webhook` com o verify token salvo acima.</span>
          </div>
          <div className={styles.infoRow}>
            <Icon name="clock" className={styles.buttonIcon} />
            <span>Telegram: `https://seu-dominio/api/telegram/webhook` com o secret token opcional.</span>
          </div>
          <div className={styles.infoRow}>
            <Icon name="clock" className={styles.buttonIcon} />
            <span>Os envios agendados continuam disparando enquanto o servidor estiver rodando.</span>
          </div>
        </div>
      </section>
    </section>
  );
}
