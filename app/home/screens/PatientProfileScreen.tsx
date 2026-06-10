"use client";

import { useMemo, useState } from "react";
import styles from "../../page.module.css";
import type { PatientDetails, PublicUser, QuestionRecord } from "@/lib/shared/types";
import type { PatientProfileTab } from "../types";
import { badgeTone, cn } from "../utils";
import { Icon } from "../components/Icon";

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
  onSendTest: (patientId: string, questionId: string, channel?: "whatsapp" | "telegram") => Promise<void>;
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

const tabs: Array<{ id: PatientProfileTab; label: string }> = [
  { id: "summary", label: "Resumo" },
  { id: "responses", label: "Respostas" },
  { id: "plan", label: "Plano" },
  { id: "team", label: "Equipe" },
  { id: "reports", label: "Relatorios" },
  { id: "conduct", label: "Alertas" }
];

function statusLabel(status: PatientDetails["patient"]["status"]) {
  if (status === "critical") return "Critico";
  if (status === "attention") return "Atencao";
  return "Estavel";
}

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
  onSelectTab,
  onSendTest,
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

  return (
    <section className={styles.profileScreen}>
      <button className={styles.profileBackButton} onClick={onBack} type="button">
        <Icon name="arrow-left" className={styles.profileBackIcon} />
        Voltar para lista
      </button>

      <section className={styles.profileHeaderCard}>
        <div className={styles.profileHeaderMain}>
          <span className={styles.profileAvatar} aria-hidden="true" />
          <div className={styles.profileIdentity}>
            <h1>{details.patient.name}</h1>
            <p>{details.patient.age} anos • {details.patient.condition}</p>
            <div className={styles.profileStatusRow}>
              <span className={cn(styles.badge, badgeTone(statusLabel(details.patient.status)))}>
                {statusLabel(details.patient.status)}
              </span>
              <span>Responsavel: {responsibleName}</span>
            </div>
          </div>
        </div>

        <div className={styles.profileCareTeam}>
          <span>Canal preferido</span>
          <strong>{channelLabel(details.patient.preferredChannel)}</strong>
          <small>WhatsApp: {details.patient.phone}</small>
          <small>
            Telegram: {details.patient.telegramChatId ? `chat ${details.patient.telegramChatId}` : "aguardando /start"}
          </small>
        </div>
      </section>

      <section className={styles.profileWorkspace}>
        <div className={styles.profileTabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={cn(styles.profileTab, activeTab === tab.id && styles.profileTabActive)}
              onClick={() => onSelectTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.profileWorkspaceBody}>
          {activeTab === "summary" && (
            <>
              <section className={styles.profileSummaryAiCard}>
                <div className={styles.profileSummaryAiHeader}>
                  <span className={styles.profileSummaryAiIcon}>
                    <Icon name="idea" />
                  </span>
                  <div>
                    <h2>Resumo operacional</h2>
                    <p>Mostra se o paciente esta ativo, vinculado ao canal certo e com rotinas funcionando.</p>
                  </div>
                </div>

                <div className={styles.profileMetricGrid}>
                  <article className={styles.profileMetricCard}>
                    <strong>{details.schedules.length}</strong>
                    <small>Rotinas ativas</small>
                  </article>
                  <article className={styles.profileMetricCard}>
                    <strong>{responseCount}</strong>
                    <small>Respostas recebidas</small>
                  </article>
                  <article className={styles.profileMetricCard}>
                    <strong>{activeAlertCount}</strong>
                    <small>Alertas ativos</small>
                  </article>
                  <article className={styles.profileMetricCard}>
                    <strong>{details.patient.preferredResponseFormat}</strong>
                    <small>Formato preferido</small>
                  </article>
                </div>
              </section>

              <section className={styles.profileSectionCard}>
                <h2>Vinculo com Telegram</h2>
                <div className={styles.profilePlanMeta}>
                  <div>
                    <span>Status</span>
                    <p>{details.patient.telegramLinkedAt ? "Vinculado" : "Aguardando /start"}</p>
                  </div>
                  <div>
                    <span>Token de vinculo</span>
                    <p>{details.patient.telegramLinkToken}</p>
                  </div>
                  <div>
                    <span>Link</span>
                    <p>{telegramLink ?? "Configure o bot username para gerar o link."}</p>
                  </div>
                </div>
              </section>

              <section className={styles.profileSectionCard}>
                <h2>Ultimas mensagens</h2>
                <div className={styles.profileRecentResponses}>
                  {details.messages.slice(0, 5).map((message) => (
                    <article key={message.id} className={styles.profileRecentResponseCard}>
                      <div className={styles.profileRecentResponseLine} />
                      <div className={styles.profileRecentResponseContent}>
                        <small>
                          {message.direction === "outbound" ? "Enviada" : "Recebida"} • {message.channel} •{" "}
                          {new Date(message.receivedAt ?? message.sentAt ?? Date.now()).toLocaleString("pt-BR")}
                        </small>
                        <p>{message.body}</p>
                        <strong>{message.status}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}

          {activeTab === "responses" && (
            <section className={styles.profileSectionCard}>
              <h2>Historico de Respostas</h2>
              <div className={styles.profileResponseCards}>
                {details.messages.map((message) => (
                  <article key={message.id} className={styles.profileResponseCard}>
                    <div className={styles.profileResponseHeader}>
                      <span className={styles.profileResponseHeaderIcon}>
                        <Icon
                          name={message.type === "audio" ? "microphone" : "questions"}
                          className={styles.profileResponseRecordIcon}
                        />
                      </span>
                      <div className={styles.profileResponseMeta}>
                        <strong>
                          {message.direction === "outbound" ? "Mensagem enviada" : "Resposta recebida"}
                        </strong>
                        <div className={styles.profileResponseHeaderBadges}>
                          <span className={styles.profileResponseTypeBadge}>{message.type}</span>
                          <span className={styles.profileResponseTypeBadge}>{message.status}</span>
                          <span className={styles.profileResponseTypeBadge}>{message.channel}</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.profileResponseTextBlock}>
                      <small>Conteudo</small>
                      <p>{message.body}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeTab === "plan" && (
            <>
              <section className={styles.profileSectionCard}>
                <div className={styles.profileCardToolbar}>
                  <h2>Agendamentos ativos</h2>
                </div>
                <div className={styles.profilePlanList}>
                  {details.schedules.map((schedule) => (
                    <article key={schedule.id} className={styles.profilePlanCard}>
                      <div className={styles.profilePlanCardHead}>
                        <div>
                          <strong>{schedule.label}</strong>
                          <div className={styles.profileInlineBadges}>
                            <span className={styles.profileTextBadge}>{schedule.time}</span>
                            <span className={styles.profileTextBadge}>
                              {schedule.question?.title ?? "Pergunta removida"}
                            </span>
                            <span className={styles.profileTextBadge}>
                              {channelLabel(details.patient.preferredChannel)}
                            </span>
                          </div>
                        </div>

                        <div className={styles.profileActionButtons}>
                          <button
                            className={styles.tableButton}
                            onClick={() => onSendTest(details.patient.id, schedule.questionId)}
                            type="button"
                          >
                            Enviar teste
                          </button>
                          <button
                            className={styles.tableButton}
                            onClick={() => onSendTest(details.patient.id, schedule.questionId, "telegram")}
                            type="button"
                          >
                            Teste Telegram
                          </button>
                          <button
                            className={styles.tableButton}
                            onClick={() => onDeleteSchedule(details.patient.id, schedule.id)}
                            type="button"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                      <div className={styles.profilePlanMeta}>
                        <div>
                          <span>Dias</span>
                          <p>{schedule.daysOfWeek.join(", ")}</p>
                        </div>
                        <div>
                          <span>Timezone</span>
                          <p>{schedule.timezone}</p>
                        </div>
                        <div>
                          <span>Status</span>
                          <p>{schedule.active ? "Ativo" : "Pausado"}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className={styles.profileSectionCard}>
                <h3>Criar novo agendamento</h3>
                <div className={styles.profileInfoGrid}>
                  <label className={styles.field}>
                    <span>Pergunta</span>
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
                  </label>
                  <label className={styles.field}>
                    <span>Rotulo</span>
                    <input
                      onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
                      value={form.label}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Horario</span>
                    <input
                      onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}
                      type="time"
                      value={form.time}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Timezone</span>
                    <input
                      onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))}
                      value={form.timezone}
                    />
                  </label>
                </div>
                <button className={styles.primaryButton} disabled={busy} onClick={handleAddSchedule} type="button">
                  {busy ? "Salvando..." : "Adicionar agendamento"}
                </button>
              </section>
            </>
          )}

          {activeTab === "team" && (
            <section className={styles.profileSectionCard}>
              <h2>Equipe ligada ao paciente</h2>
              <div className={styles.profileTeamGrid}>
                {(teamMembers.length ? teamMembers : users.slice(0, 1)).map((member) => (
                  <article key={member.id} className={styles.profileTeamCard}>
                    <div className={styles.profileTeamCardTop}>
                      <span className={styles.profileAvatar} aria-hidden="true" />
                      <div className={styles.profileTeamIdentity}>
                        <strong>{member.name}</strong>
                        <small>{member.specialty}</small>
                        <span className={styles.profileResponseTypeBadge}>{member.role}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeTab === "reports" && (
            <section className={styles.profileSectionCard}>
              <h2>Resumo para apresentacao</h2>
              <p>
                Este paciente tem {details.schedules.length} rotina(s) ativa(s), {responseCount} resposta(s)
                recebida(s) e {activeAlertCount} alerta(s) aberto(s).
              </p>
            </section>
          )}

          {activeTab === "conduct" && (
            <section className={styles.profileSectionCard}>
              <h2>Alertas do paciente</h2>
              <div className={styles.profileAlertsList}>
                {details.alerts.map((alert) => (
                  <article key={alert.id} className={styles.profileAlertCard}>
                    <div className={styles.profileAlertLine} />
                    <div className={styles.profileAlertContent}>
                      <strong>{alert.title}</strong>
                      <p>{alert.description}</p>
                    </div>
                    {alert.status === "active" ? (
                      <button className={styles.tableButton} onClick={() => onResolveAlert(alert.id)} type="button">
                        Resolver
                      </button>
                    ) : (
                      <span className={styles.profileResponseTypeBadge}>Resolvido</span>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </section>
  );
}
