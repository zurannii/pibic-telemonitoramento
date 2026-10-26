"use client";

import { useState } from "react";
import type { PatientListItem, PublicUser } from "@/lib/shared/types";
import { cn } from "../utils";
import { Icon } from "../components/Icon";
import { Avatar, Card, Field, IconChip, Kpi, Note, PageHeader, Tag, roleLabel, ui } from "../components/ui";

const ROLE_DESCRIPTIONS = [
  {
    id: "admin",
    icon: "shield" as const,
    access: "Coordenação",
    description: "Pensado para quem coordena a equipe, os pacientes e as integrações."
  },
  {
    id: "professional",
    icon: "user" as const,
    access: "Acompanhamento",
    description: "Pensado para quem acompanha pacientes, envia mensagens e trata alertas."
  },
  {
    id: "viewer",
    icon: "eye" as const,
    access: "Consulta",
    description: "Pensado para quem apenas consulta dados e indicadores."
  }
];

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

  const scrollToForm = () => {
    document.getElementById("add-professional")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <PageHeader
        actions={
          <button className={cn(ui.btn, ui.btnPrimary)} onClick={scrollToForm} type="button">
            <Icon name="plus" />
            Adicionar profissional
          </button>
        }
        subtitle="Gerencie os profissionais, as permissões e as integrações de mensagens"
        title="Equipe"
      />

      <section aria-label="Resumo da equipe" className={ui.kpiRow}>
        <Kpi icon="patients" inline label="Profissionais" value={users.length} />
        <Kpi icon="user" inline label="Pacientes ativos" value={patients.length} />
        <Kpi
          icon="send"
          inline
          label="Telegram"
          tone={telegramInfo.enabled ? "green" : "gray"}
          value={telegramInfo.enabled ? "Ativo" : "Inativo"}
        />
        <Kpi
          icon="phone"
          inline
          label="WhatsApp"
          tone={whatsappInfo.enabled ? "green" : "gray"}
          value={whatsappInfo.enabled ? "Ativo" : "Inativo"}
        />
      </section>

      <Card className={ui.onlyDesktop} variant="flush">
        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>Profissional</th>
                <th>Especialidade</th>
                <th>Função</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className={ui.cellUser}>
                      <Avatar name={user.name} size="sm" />
                      <div>
                        <strong>{user.name}</strong>
                        <small>{user.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>{user.specialty || "Não informada"}</td>
                  <td>
                    <Tag icon={user.role === "admin" ? "shield" : user.role === "viewer" ? "eye" : "user"} tone={user.role === "admin" ? "info" : "neutral"}>
                      {roleLabel[user.role] ?? user.role}
                    </Tag>
                  </td>
                  <td>
                    <Tag icon="check" tone="success">
                      Ativo
                    </Tag>
                  </td>
                  <td>
                    {user.id !== currentUser.id ? (
                      <button
                        className={cn(ui.btn, ui.btnDanger, ui.btnSm)}
                        onClick={() => onDeleteUser(user.id)}
                        type="button"
                      >
                        <Icon name="trash" />
                        Excluir
                      </button>
                    ) : (
                      <span className={cn(ui.small, ui.muted)}>Você</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <section aria-label="Profissionais da equipe" className={cn(ui.onlyMobile, ui.stackSm)} style={{ flexDirection: "column" }}>
        {users.map((user) => (
          <Card key={user.id}>
            <div className={ui.cellUser}>
              <Avatar name={user.name} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>{user.name}</strong>
                <small>{user.specialty || "Especialidade não informada"}</small>
              </div>
              <Tag tone={user.role === "admin" ? "info" : "neutral"}>{roleLabel[user.role] ?? user.role}</Tag>
            </div>
            <span className={cn(ui.small, ui.muted)}>{user.email}</span>
            {user.id !== currentUser.id ? (
              <button className={cn(ui.btn, ui.btnDanger)} onClick={() => onDeleteUser(user.id)} type="button">
                Excluir profissional
              </button>
            ) : (
              <span className={cn(ui.small, ui.muted)}>Esta é a sua conta</span>
            )}
          </Card>
        ))}
      </section>

      <div className={ui.row}>
        <div id="add-professional">
          <Card icon="plus" subtitle="O profissional recebe acesso com a senha inicial definida pela equipe" title="Adicionar profissional">
            <div className={ui.fieldGrid}>
              <Field label="Nome" required>
                <input
                  onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ex.: Dra. Costa"
                  value={userForm.name}
                />
              </Field>
              <Field label="E-mail" required>
                <input
                  onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="nome@clinica.com"
                  type="email"
                  value={userForm.email}
                />
              </Field>
              <Field label="Especialidade">
                <input
                  onChange={(event) => setUserForm((current) => ({ ...current, specialty: event.target.value }))}
                  placeholder="Ex.: Fisioterapia"
                  value={userForm.specialty}
                />
              </Field>
              <Field label="Perfil">
                <select
                  onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value }))}
                  value={userForm.role}
                >
                  <option value="professional">Profissional</option>
                  <option value="viewer">Visualizador</option>
                  <option value="admin">Administrador</option>
                </select>
              </Field>
            </div>
            <div className={ui.formBar}>
              <button className={cn(ui.btn, ui.btnPrimary)} disabled={busyUser} onClick={saveUser} type="button">
                <Icon name="plus" />
                {busyUser ? "Salvando..." : "Adicionar profissional"}
              </button>
            </div>
          </Card>
        </div>

        <Card icon="shield" subtitle="Perfil registrado para cada profissional" title="Perfis de acesso">
          <div className={ui.list}>
            {ROLE_DESCRIPTIONS.map((role) => (
              <div className={ui.listItem} key={role.id} style={{ alignItems: "flex-start" }}>
                <IconChip icon={role.icon} tone={role.id === "admin" ? "blue" : "gray"} />
                <div className={ui.listMain}>
                  <div className={ui.listTitle}>
                    {roleLabel[role.id]}
                    <Tag tone={role.id === "admin" ? "info" : "neutral"}>{role.access}</Tag>
                  </div>
                  <span className={ui.listMeta}>{role.description}</span>
                </div>
              </div>
            ))}
          </div>
          <Note warning>
            Por enquanto o perfil é apenas informativo: a plataforma ainda não restringe ações por perfil.
          </Note>
        </Card>
      </div>

      <div className={ui.row}>
        <Card
          actions={<Tag tone={telegramInfo.enabled ? "success" : "neutral"}>{telegramInfo.enabled ? "Ativo" : "Inativo"}</Tag>}
          icon="send"
          subtitle={`Bot token ${telegramInfo.botTokenConfigured ? "configurado" : "não configurado"} · Webhook secret ${telegramInfo.webhookSecretConfigured ? "configurado" : "pendente"}`}
          title="Integração com Telegram"
        >
          <div className={ui.fieldGrid}>
            <Field label="Bot Token">
              <input
                onChange={(event) => setTelegramForm((current) => ({ ...current, botToken: event.target.value }))}
                placeholder={telegramInfo.botTokenConfigured ? "•••••• (já configurado)" : ""}
                value={telegramForm.botToken}
              />
            </Field>
            <Field label="Bot Username">
              <input
                onChange={(event) => setTelegramForm((current) => ({ ...current, botUsername: event.target.value }))}
                placeholder="@seu_bot"
                value={telegramForm.botUsername}
              />
            </Field>
            <Field className={ui.spanAll} label="Webhook Secret">
              <input
                onChange={(event) => setTelegramForm((current) => ({ ...current, webhookSecret: event.target.value }))}
                value={telegramForm.webhookSecret}
              />
            </Field>
          </div>
          <label className={ui.switchRow}>
            <span className={ui.switchText}>
              <strong>Ativar integração</strong>
              <small>Envio e recebimento de mensagens pelo bot</small>
            </span>
            <input
              checked={telegramForm.enabled}
              onChange={(event) => setTelegramForm((current) => ({ ...current, enabled: event.target.checked }))}
              type="checkbox"
            />
          </label>
          <div className={ui.formBar}>
            <button className={cn(ui.btn, ui.btnPrimary)} disabled={busyTelegram} onClick={saveTelegram} type="button">
              {busyTelegram ? "Salvando..." : "Salvar Telegram"}
            </button>
          </div>
        </Card>

        <Card
          actions={<Tag tone={whatsappInfo.enabled ? "success" : "neutral"}>{whatsappInfo.enabled ? "Ativo" : "Inativo"}</Tag>}
          icon="phone"
          subtitle={`Phone Number ID ${whatsappInfo.phoneNumberIdConfigured ? "configurado" : "não configurado"}`}
          title="Integração com WhatsApp"
        >
          <div className={ui.fieldGrid}>
            <Field label="Access Token">
              <input
                onChange={(event) => setWhatsAppForm((current) => ({ ...current, accessToken: event.target.value }))}
                value={whatsAppForm.accessToken}
              />
            </Field>
            <Field label="Phone Number ID">
              <input
                onChange={(event) => setWhatsAppForm((current) => ({ ...current, phoneNumberId: event.target.value }))}
                value={whatsAppForm.phoneNumberId}
              />
            </Field>
            <Field label="Business Account ID">
              <input
                onChange={(event) =>
                  setWhatsAppForm((current) => ({ ...current, businessAccountId: event.target.value }))
                }
                value={whatsAppForm.businessAccountId}
              />
            </Field>
            <Field label="Verify Token">
              <input
                onChange={(event) => setWhatsAppForm((current) => ({ ...current, verifyToken: event.target.value }))}
                value={whatsAppForm.verifyToken}
              />
            </Field>
            <Field label="App Secret">
              <input
                onChange={(event) => setWhatsAppForm((current) => ({ ...current, appSecret: event.target.value }))}
                value={whatsAppForm.appSecret}
              />
            </Field>
            <Field label="Versão da API">
              <input
                onChange={(event) => setWhatsAppForm((current) => ({ ...current, apiVersion: event.target.value }))}
                value={whatsAppForm.apiVersion}
              />
            </Field>
          </div>
          <label className={ui.switchRow}>
            <span className={ui.switchText}>
              <strong>Ativar integração</strong>
              <small>WhatsApp Cloud API da Meta</small>
            </span>
            <input
              checked={whatsAppForm.enabled}
              onChange={(event) => setWhatsAppForm((current) => ({ ...current, enabled: event.target.checked }))}
              type="checkbox"
            />
          </label>
          <div className={ui.formBar}>
            <button className={cn(ui.btn, ui.btnPrimary)} disabled={busyWhatsApp} onClick={saveWhatsApp} type="button">
              {busyWhatsApp ? "Salvando..." : "Salvar WhatsApp"}
            </button>
          </div>
        </Card>
      </div>

      <div className={ui.row}>
        <Card icon="user" title="Estado da sessão">
          <div className={ui.infoGrid}>
            <div className={ui.info}>
              <span>Usuário conectado</span>
              <strong>{currentUser.name}</strong>
            </div>
            <div className={ui.info}>
              <span>Webhook secret do Telegram</span>
              <strong>{telegramInfo.webhookSecretConfigured ? "Configurado" : "Pendente"}</strong>
            </div>
          </div>
        </Card>

        <Card icon="link" title="Como conectar os webhooks">
          <ul className={ui.bullets}>
            <li>
              Telegram: <span className={ui.code}>https://seu-dominio/api/telegram/webhook</span> (registrado ao salvar a integração).
            </li>
            <li>
              WhatsApp: <span className={ui.code}>https://seu-dominio/api/whatsapp/webhook</span> com o verify token salvo acima.
            </li>
            <li>Os envios agendados continuam disparando enquanto o servidor estiver rodando.</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
