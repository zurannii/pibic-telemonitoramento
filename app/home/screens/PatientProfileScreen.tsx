"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  PatientDetails,
  PatientReport,
  OutboundMessageFormat,
  PublicUser,
  QuestionRecord
} from "@/lib/shared/types";
import type { IconName, PatientProfileTab } from "../types";
import { cn, displayLabel } from "../utils";
import { Icon } from "../components/Icon";
import {
  AlertLevelTag,
  AlertStatusTag,
  Avatar,
  BackLink,
  Card,
  EmptyState,
  Field,
  IconChip,
  Kpi,
  MessageStatusTag,
  PatientStatusTag,
  Tag,
  formatDateTime,
  roleLabel,
  timeAgo,
  ui,
  weekdayLabels
} from "../components/ui";
import { ReportsScreen } from "./ReportsScreen";

type PatientProfileScreenProps = {
  details: PatientDetails;
  onAddSchedule: (payload: {
    patientId: string;
    questionId: string;
    label: string;
    time: string;
    timezone: string;
    daysOfWeek: number[];
  }) => Promise<void>;
  onBack: () => void;
  onDeleteSchedule: (patientId: string, scheduleId: string) => void;
  onResolveAlert: (alertId: string) => void;
  onGenerateReport: (patientId: string) => Promise<PatientReport | undefined>;
  onSendMessage: (
    patientId: string,
    payload: {
      questionId?: string;
      text?: string;
      channel?: "whatsapp" | "telegram";
      messageType?: OutboundMessageFormat;
    }
  ) => Promise<void>;
  onSelectTab: (tab: PatientProfileTab) => void;
  questions: QuestionRecord[];
  activeTab: PatientProfileTab;
  telegramInfo: {
    enabled: boolean;
    botUsername: string | null;
    botTokenConfigured: boolean;
    webhookSecretConfigured: boolean;
    updatedAt: string | null;
  };
  users: PublicUser[];
};

const tabs: Array<{ id: PatientProfileTab; label: string; icon: IconName }> = [
  { id: "summary", label: "Resumo", icon: "overview" },
  { id: "responses", label: "Respostas", icon: "questions" },
  { id: "plan", label: "Plano de monitoramento", icon: "calendar" },
  { id: "team", label: "Equipe", icon: "patients" },
  { id: "reports", label: "Relatórios", icon: "reports" },
  { id: "conduct", label: "Alertas", icon: "alerts" }
];

function channelLabel(channel: PatientDetails["patient"]["preferredChannel"]) {
  return channel === "telegram" ? "Telegram" : "WhatsApp";
}

export function PatientProfileScreen({
  activeTab,
  details,
  onAddSchedule,
  onBack,
  onDeleteSchedule,
  onResolveAlert,
  onGenerateReport,
  onSelectTab,
  onSendMessage,
  questions,
  telegramInfo,
  users
}: PatientProfileScreenProps) {
  const [form, setForm] = useState({
    questionId: questions[0]?.id ?? "",
    label: "",
    time: "09:00",
    timezone: "America/Sao_Paulo",
    daysOfWeek: [1, 2, 3, 4, 5] as number[]
  });
  const [busy, setBusy] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageForm, setMessageForm] = useState<{
    questionId: string;
    text: string;
    channel: "whatsapp" | "telegram";
    messageType: OutboundMessageFormat;
  }>({
    questionId: questions[0]?.id ?? "",
    text: "",
    channel: details.patient.preferredChannel,
    messageType: "automatic"
  });

  useEffect(() => {
    setMessageForm({
      questionId: questions[0]?.id ?? "",
      text: "",
      channel: details.patient.preferredChannel,
      messageType: "automatic"
    });
  }, [details.patient.id, details.patient.preferredChannel]);

  const responseCount = details.messages.filter((message) => message.direction === "inbound").length;
  const activeAlertCount = details.alerts.filter((alert) => alert.status === "active").length;
  const responsibleName = details.responsibleUser?.name ?? "Sem profissional definido";
  const telegramLink = telegramInfo.botUsername
    ? `https://t.me/${telegramInfo.botUsername.replace(/^@/, "")}?start=${details.patient.telegramLinkToken}`
    : null;

  const teamMembers = useMemo(() => {
    return users.filter((user) => user.id === details.patient.responsibleUserId);
  }, [details.patient.responsibleUserId, users]);

  const handleAddSchedule = async () => {
    setBusy(true);
    try {
      await onAddSchedule({
        patientId: details.patient.id,
        questionId: form.questionId,
        label: form.label,
        time: form.time,
        timezone: form.timezone,
        daysOfWeek: form.daysOfWeek
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSendMessage = async () => {
    setSendingMessage(true);
    try {
      await onSendMessage(details.patient.id, {
        questionId: messageForm.questionId || undefined,
        text: messageForm.text || undefined,
        channel: messageForm.channel,
        messageType: messageForm.messageType
      });
      setMessageForm((current) => ({ ...current, text: "" }));
    } finally {
      setSendingMessage(false);
    }
  };

  const lastInboundAt = details.messages
    .filter((message) => message.direction === "inbound")
    .map((message) => message.receivedAt ?? message.sentAt)
    .filter((value): value is string => Boolean(value))
    .sort((first, second) => new Date(second).getTime() - new Date(first).getTime())[0] ?? null;
  const activeAlerts = details.alerts.filter((alert) => alert.status === "active");
  const isTelegram = details.patient.preferredChannel === "telegram";
  const messageDate = (message: PatientDetails["messages"][number]) =>
    message.receivedAt ?? message.sentAt ?? null;

  const renderMessage = (message: PatientDetails["messages"][number]) => {
    const inbound = message.direction === "inbound";
    return (
      <div className={ui.listItem} key={message.id} style={{ alignItems: "flex-start" }}>
        <IconChip
          icon={message.type === "audio" ? "microphone" : inbound ? "questions" : "send"}
          tone={inbound ? "blue" : "gray"}
        />
        <div className={ui.messageBody}>
          <div className={ui.messageHead}>
            <strong>{inbound ? "Resposta do paciente" : "Mensagem enviada"}</strong>
            <span className={ui.pill}>{displayLabel(message.channel)}</span>
            {message.type === "audio" ? (
              <span className={ui.pill}>
                <Icon name="microphone" />
                Áudio
              </span>
            ) : null}
            <MessageStatusTag status={message.status} />
            <span className={ui.messageTime}>
              <Icon name="clock" />
              {formatDateTime(messageDate(message))}
            </span>
          </div>
          <div
            className={cn(
              ui.bubble,
              !inbound && ui.bubbleOut,
              message.status === "failed" && ui.bubbleError
            )}
          >
            {message.body || "—"}
          </div>
          {message.status === "failed" && message.errorMessage ? (
            <span className={cn(ui.small, ui.muted)}>Motivo: {message.errorMessage}</span>
          ) : null}
        </div>
      </div>
    );
  };

  const renderAlert = (alert: PatientDetails["alerts"][number]) => (
    <article className={cn(ui.alertCard, alert.status === "resolved" && ui.alertResolved)} key={alert.id}>
      <span
        className={cn(
          ui.alertBar,
          alert.status === "resolved"
            ? ui.alertBarDone
            : alert.level === "high"
              ? ui.alertBarHigh
              : alert.level === "low" && ui.alertBarLow
        )}
      />
      <div className={ui.listMain}>
        <div className={ui.tagRow}>
          <AlertStatusTag status={alert.status} />
          <AlertLevelTag level={alert.level} />
        </div>
        <h3 className={ui.alertTitle}>{alert.title}</h3>
        <span className={ui.listMeta}>{alert.description}</span>
        <div className={ui.metaRow}>
          <span>
            <Icon name="calendar" />
            {formatDateTime(alert.createdAt)}
          </span>
        </div>
      </div>
      {alert.status === "active" ? (
        <button className={cn(ui.btn, ui.btnPrimary)} onClick={() => onResolveAlert(alert.id)} type="button">
          <Icon name="check" />
          Resolver
        </button>
      ) : null}
    </article>
  );

  return (
    <>
      <BackLink label="Voltar para lista de pacientes" onClick={onBack} />

      <section className={ui.patientHeader}>
        <div className={ui.patientTop}>
          <div className={ui.patientRow}>
            <Avatar name={details.patient.name} size="lg" />
            <div className={ui.patientIdentity}>
              <h1 className={ui.patientName}>
                {details.patient.name}
                <PatientStatusTag status={details.patient.status} />
                {details.patient.requiresAudioMessages ? (
                  <Tag icon="volume" tone="purple">
                    Mensagens em áudio
                  </Tag>
                ) : null}
              </h1>
              <p className={ui.patientMeta}>
                {details.patient.age} anos · {details.patient.condition}
              </p>
            </div>
            <button className={cn(ui.btn, ui.btnPrimary)} onClick={() => onSelectTab("responses")} type="button">
              <Icon name="send" />
              Enviar mensagem
            </button>
          </div>

          <div className={ui.facts}>
            <div className={ui.fact}>
              <IconChip icon="clock" />
              <div className={ui.factText}>
                <small>Última resposta</small>
                <strong>{timeAgo(lastInboundAt)}</strong>
              </div>
            </div>
            <div className={ui.fact}>
              <IconChip icon="user" />
              <div className={ui.factText}>
                <small>Responsável</small>
                <strong>{responsibleName}</strong>
              </div>
            </div>
            <div className={ui.fact}>
              <IconChip icon={isTelegram ? "send" : "phone"} />
              <div className={ui.factText}>
                <small>Canal preferido</small>
                <strong>
                  {channelLabel(details.patient.preferredChannel)}
                  {isTelegram ? (details.patient.telegramChatId ? " · vinculado" : " · aguardando /start") : ""}
                </strong>
              </div>
            </div>
            <div className={ui.fact}>
              <IconChip icon="phone" />
              <div className={ui.factText}>
                <small>Telefone</small>
                <strong>{details.patient.phone}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className={cn(ui.tabs, ui.patientTabs)} role="tablist" aria-label="Seções do paciente">
          {tabs.map((tab) => (
            <button
              aria-selected={activeTab === tab.id}
              className={cn(ui.tab, activeTab === tab.id && ui.tabActive)}
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              role="tab"
              type="button"
            >
              <Icon name={tab.icon} />
              {tab.label}
              {tab.id === "conduct" && activeAlertCount > 0 ? (
                <span className={ui.navCount}>{activeAlertCount}</span>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "summary" && (
        <div className={ui.split}>
          <div className={ui.stack}>
            <Card
              icon="idea"
              subtitle="Mostra se o paciente está ativo, vinculado ao canal certo e com rotinas funcionando"
              title="Resumo do acompanhamento"
              variant="soft"
            >
              <div className={cn(ui.kpiRow, ui.kpiRowCompact)}>
                <Kpi icon="calendar" label="Rotinas ativas" tone="amber" value={details.schedules.length} />
                <Kpi icon="questions" label="Respostas recebidas" value={responseCount} />
                <Kpi icon="alerts" label="Alertas ativos" tone="red" value={activeAlertCount} />
                <Kpi
                  icon={details.patient.preferredResponseFormat === "audio" ? "microphone" : "text"}
                  label="Formato preferido"
                  tone="purple"
                  value={<span style={{ fontSize: 22 }}>{displayLabel(details.patient.preferredResponseFormat)}</span>}
                />
              </div>
            </Card>

            <Card
              actions={
                <button
                  className={cn(ui.btn, ui.btnGhost, ui.btnSm)}
                  onClick={() => onSelectTab("responses")}
                  type="button"
                >
                  Ver todas
                  <Icon name="chevron-right" />
                </button>
              }
              icon="questions"
              title="Últimas mensagens"
            >
              {details.messages.length ? (
                <div className={ui.list}>{details.messages.slice(0, 5).map(renderMessage)}</div>
              ) : (
                <EmptyState icon="questions" title="Nenhuma mensagem trocada ainda" />
              )}
            </Card>
          </div>

          <div className={ui.stack}>
            <Card
              actions={
                <Tag tone={details.patient.telegramLinkedAt ? "success" : "warning"}>
                  {details.patient.telegramLinkedAt ? "Vinculado" : "Aguardando /start"}
                </Tag>
              }
              icon="send"
              title="Vínculo com Telegram"
            >
              <div className={ui.info}>
                <span>Token de vínculo</span>
                <span className={ui.code}>{details.patient.telegramLinkToken}</span>
              </div>
              <div className={ui.info}>
                <span>Link para o paciente</span>
                {telegramLink ? (
                  <a className={ui.code} href={telegramLink} rel="noreferrer" target="_blank">
                    {telegramLink}
                  </a>
                ) : (
                  <span className={cn(ui.small, ui.muted)}>Configure o username do bot na tela Equipe para gerar o link.</span>
                )}
              </div>
            </Card>

            <Card
              actions={
                details.alerts.length ? (
                  <button
                    className={cn(ui.btn, ui.btnGhost, ui.btnSm)}
                    onClick={() => onSelectTab("conduct")}
                    type="button"
                  >
                    Ver todos
                    <Icon name="chevron-right" />
                  </button>
                ) : null
              }
              icon="alerts"
              title="Alertas ativos"
            >
              {activeAlerts.length ? (
                <div className={ui.list}>
                  {activeAlerts.slice(0, 3).map((alert) => (
                    <div className={ui.listItem} key={alert.id} style={{ alignItems: "flex-start" }}>
                      <div className={ui.listMain}>
                        <div className={ui.listTitle}>
                          {alert.title}
                          <AlertLevelTag level={alert.level} />
                        </div>
                        <span className={ui.listMeta}>{alert.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon="check" title="Nenhum alerta ativo" />
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === "responses" && (
        <div className={ui.split}>
          <Card icon="questions" subtitle="Mensagens enviadas e respostas recebidas" title="Histórico de mensagens">
            {details.messages.length ? (
              <div className={ui.list}>{details.messages.map(renderMessage)}</div>
            ) : (
              <EmptyState icon="questions" title="Nenhuma mensagem trocada ainda" />
            )}
          </Card>

          <Card
            icon="send"
            subtitle={
              details.patient.requiresAudioMessages
                ? "As perguntas e mensagens são convertidas automaticamente em áudio antes do envio."
                : "Envie uma pergunta cadastrada ou escreva uma mensagem personalizada."
            }
            title="Enviar mensagem"
          >
            <Field label="Pergunta">
              <select
                onChange={(event) => setMessageForm((current) => ({ ...current, questionId: event.target.value }))}
                value={messageForm.questionId}
              >
                <option value="">Somente texto personalizado</option>
                {questions.map((question) => (
                  <option key={question.id} value={question.id}>
                    {question.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Canal">
              <select
                onChange={(event) =>
                  setMessageForm((current) => ({
                    ...current,
                    channel: event.target.value as "whatsapp" | "telegram"
                  }))
                }
                value={messageForm.channel}
              >
                <option value="telegram">Telegram</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </Field>
            <Field label="Formato do envio">
              <select
                onChange={(event) =>
                  setMessageForm((current) => ({
                    ...current,
                    messageType: event.target.value as OutboundMessageFormat
                  }))
                }
                value={messageForm.messageType}
              >
                <option value="automatic">
                  {details.patient.requiresAudioMessages
                    ? "Automático (áudio assistido)"
                    : "Automático (preferência do paciente)"}
                </option>
                <option value="text">Mensagem de texto</option>
                <option value="audio">Mensagem de áudio</option>
              </select>
            </Field>
            <Field hint="Se preenchida, substitui o texto da pergunta selecionada." label="Mensagem personalizada (opcional)">
              <textarea
                onChange={(event) => setMessageForm((current) => ({ ...current, text: event.target.value }))}
                rows={4}
                value={messageForm.text}
              />
            </Field>
            <button
              className={cn(ui.btn, ui.btnPrimary, ui.btnBlock)}
              disabled={sendingMessage || (!messageForm.questionId && !messageForm.text.trim())}
              onClick={handleSendMessage}
              type="button"
            >
              <Icon name="send" />
              {sendingMessage ? "Enviando..." : "Enviar mensagem"}
            </button>
          </Card>
        </div>
      )}

      {activeTab === "plan" && (
        <div className={ui.splitLeft}>
          <div className={ui.stack}>
            <Card icon="settings" title="Configurações gerais">
              <div className={ui.stackSm}>
                <div className={ui.info}>
                  <span>Canal de comunicação</span>
                  <strong>{channelLabel(details.patient.preferredChannel)}</strong>
                </div>
                <hr className={ui.divider} />
                <div className={ui.info}>
                  <span>Formato preferencial</span>
                  <strong>{displayLabel(details.patient.preferredResponseFormat)}</strong>
                </div>
                <hr className={ui.divider} />
                <div className={ui.info}>
                  <span>Acessibilidade de leitura</span>
                  <strong>{details.patient.requiresAudioMessages ? "Mensagens em áudio" : "Mensagens em texto"}</strong>
                </div>
                <hr className={ui.divider} />
                <div className={ui.info}>
                  <span>Melhor horário</span>
                  <strong>
                    {details.patient.contactWindowStart} – {details.patient.contactWindowEnd}
                  </strong>
                </div>
                <hr className={ui.divider} />
                <div className={ui.info}>
                  <span>Profissional responsável</span>
                  <strong>{responsibleName}</strong>
                </div>
              </div>
            </Card>

            <Card icon="plus" subtitle="A rotina envia a pergunta automaticamente" title="Novo agendamento">
              <Field label="Pergunta">
                <select
                  onChange={(event) => setForm((current) => ({ ...current, questionId: event.target.value }))}
                  value={form.questionId}
                >
                  {questions.map((question) => (
                    <option key={question.id} value={question.id}>
                      {question.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Rótulo">
                <input
                  onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
                  placeholder="Ex.: Dor — manhã"
                  value={form.label}
                />
              </Field>
              <div className={ui.fieldGrid}>
                <Field label="Horário">
                  <input
                    onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}
                    type="time"
                    value={form.time}
                  />
                </Field>
                <Field label="Fuso horário">
                  <input
                    onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))}
                    value={form.timezone}
                  />
                </Field>
              </div>
              <span className={ui.hint}>
                Dias: {form.daysOfWeek.map((day) => weekdayLabels[day]).join(", ")}
              </span>
              <button
                className={cn(ui.btn, ui.btnPrimary, ui.btnBlock)}
                disabled={busy}
                onClick={handleAddSchedule}
                type="button"
              >
                <Icon name="plus" />
                {busy ? "Salvando..." : "Adicionar agendamento"}
              </button>
            </Card>
          </div>

          <Card icon="calendar" subtitle={`${details.schedules.length} rotina(s) configurada(s)`} title="Rotinas agendadas">
            {details.schedules.length ? (
              <div className={ui.stackSm}>
                {details.schedules.map((schedule) => (
                  <article className={ui.softBox} key={schedule.id} style={{ background: "#fff" }}>
                    <div className={ui.stackSm}>
                      <div className={ui.cardHead}>
                        <div className={ui.tagRow}>
                          <strong style={{ fontSize: 16 }}>{schedule.label || schedule.question?.title || "Rotina"}</strong>
                          {schedule.active ? (
                            <Tag icon="play" tone="success">
                              Ativa
                            </Tag>
                          ) : (
                            <Tag icon="pause" tone="neutral">
                              Pausada
                            </Tag>
                          )}
                        </div>
                        <button
                          aria-label="Remover rotina"
                          className={cn(ui.btn, ui.btnDanger, ui.btnIcon)}
                          onClick={() => onDeleteSchedule(details.patient.id, schedule.id)}
                          title="Remover rotina"
                          type="button"
                        >
                          <Icon name="trash" />
                        </button>
                      </div>
                      <span className={ui.listMeta}>
                        Pergunta: {schedule.question?.title ?? "Pergunta removida"}
                      </span>
                      <div className={ui.metaRow}>
                        <span>
                          <Icon name="clock" />
                          {schedule.time}
                        </span>
                        <span>
                          <Icon name="calendar" />
                          {schedule.daysOfWeek.map((day) => weekdayLabels[day]).join(", ")}
                        </span>
                        <span>{schedule.timezone}</span>
                      </div>
                      <div className={ui.actions}>
                        <button
                          className={cn(ui.btn, ui.btnSecondary, ui.btnSm)}
                          onClick={() => onSendMessage(details.patient.id, { questionId: schedule.questionId })}
                          type="button"
                        >
                          <Icon name="send" />
                          Enviar agora
                        </button>
                        <button
                          className={cn(ui.btn, ui.btnSecondary, ui.btnSm)}
                          onClick={() =>
                            onSendMessage(details.patient.id, {
                              questionId: schedule.questionId,
                              channel: "telegram"
                            })
                          }
                          type="button"
                        >
                          Enviar no Telegram
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                description="Crie um agendamento para enviar perguntas automaticamente."
                icon="calendar"
                title="Nenhuma rotina agendada"
              />
            )}
          </Card>
        </div>
      )}

      {activeTab === "team" && (
        <Card icon="patients" subtitle="Profissionais responsáveis pelo acompanhamento deste paciente" title="Equipe do paciente">
          <div className={ui.kpiRow}>
            {(teamMembers.length ? teamMembers : users.slice(0, 1)).map((member) => (
              <article className={ui.kpi} key={member.id}>
                <div className={ui.cellUser}>
                  <Avatar name={member.name} />
                  <div>
                    <strong>{member.name}</strong>
                    <small>{member.specialty || "Especialidade não informada"}</small>
                  </div>
                </div>
                <div className={ui.tagRow}>
                  <Tag icon="check" tone="info">
                    Responsável principal
                  </Tag>
                  <span className={ui.pill}>{roleLabel[member.role] ?? member.role}</span>
                </div>
                <span className={cn(ui.small, ui.muted)}>{member.email}</span>
              </article>
            ))}
          </div>
        </Card>
      )}

      {activeTab === "reports" && (
        <ReportsScreen embeddedPatientId={details.patient.id} onGenerateReport={onGenerateReport} />
      )}

      {activeTab === "conduct" && (
        <div className={ui.stackSm}>
          {details.alerts.length ? (
            details.alerts.map(renderAlert)
          ) : (
            <Card>
              <EmptyState icon="check" title="Nenhum alerta para este paciente" />
            </Card>
          )}
        </div>
      )}
    </>
  );
}
