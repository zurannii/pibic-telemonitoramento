import type { DatabaseShape, MessageLogRecord, ScheduleRecord } from "../shared/types";
import { readDb, updateDb, updatePatientStatusFromAlerts } from "./db";
import { buildChannelMessageFields, createDeliveryAlert, sendTextToPatientChannel } from "./messaging";
import { createId, getLocalScheduleSnapshot, nowIso } from "./utils";

declare global {
  // eslint-disable-next-line no-var
  var __telemonitor_scheduler_started__: boolean | undefined;
  // eslint-disable-next-line no-var
  var __telemonitor_scheduler_busy__: boolean | undefined;
}

function ensureNoResponseAlert(db: DatabaseShape, outboundMessage: MessageLogRecord) {
  const alreadyExists = db.alerts.some(
    (alert) =>
      alert.type === "no-response" &&
      alert.status === "active" &&
      alert.sourceMessageId === outboundMessage.id
  );

  if (alreadyExists) {
    return;
  }

  db.alerts.push({
    id: createId("alert"),
    patientId: outboundMessage.patientId,
    level: "medium",
    title: "Paciente sem responder",
    description: "A mensagem enviada ha mais de 24 horas ainda nao teve resposta.",
    type: "no-response",
    status: "active",
    createdAt: nowIso(),
    resolvedAt: null,
    assignedToUserId: null,
    sourceMessageId: outboundMessage.id
  });
}

function syncAlerts(db: DatabaseShape) {
  const now = Date.now();
  const pendingOutboundMessages = db.messages.filter(
    (message) =>
      message.direction === "outbound" &&
      (message.status === "sent" || message.status === "delivered" || message.status === "read")
  );

  for (const outbound of pendingOutboundMessages) {
    const wasAnswered = db.messages.some(
      (message) => message.direction === "inbound" && message.replyToMessageId === outbound.id
    );

    if (wasAnswered || !outbound.sentAt) {
      continue;
    }

    const elapsedHours = (now - new Date(outbound.sentAt).getTime()) / (1000 * 60 * 60);
    if (elapsedHours >= 24) {
      ensureNoResponseAlert(db, outbound);
    }
  }

  for (const patient of db.patients) {
    updatePatientStatusFromAlerts(patient, db.alerts);
  }
}

function isScheduleDue(schedule: ScheduleRecord) {
  if (!schedule.active) {
    return false;
  }

  const snapshot = getLocalScheduleSnapshot(new Date(), schedule.timezone);
  if (!schedule.daysOfWeek.includes(snapshot.weekday)) {
    return false;
  }

  if (snapshot.time < schedule.time) {
    return false;
  }

  const dispatchKey = `${snapshot.dateKey}@${schedule.time}`;
  return schedule.lastDispatchKey !== dispatchKey;
}

async function processDueSchedules() {
  const db = await readDb();
  const dueSchedules = db.schedules.filter((schedule) => isScheduleDue(schedule));

  if (!dueSchedules.length) {
    await updateDb((currentDb) => {
      syncAlerts(currentDb);
    });
    return;
  }

  const now = nowIso();
  const results: Array<{
    scheduleId: string;
    patientId?: string;
    questionId?: string | null;
    body?: string;
    channel?: "whatsapp" | "telegram";
    sentAt?: string;
    ok: boolean;
    messageId: string | null;
    error: string | null;
  }> = [];

  for (const schedule of dueSchedules) {
    const patient = db.patients.find((item) => item.id === schedule.patientId);
    const question = db.questions.find((item) => item.id === schedule.questionId);

    if (!patient || !question) {
      results.push({
        scheduleId: schedule.id,
        ok: false,
        messageId: null,
        error: "Paciente ou pergunta nao encontrados."
      });
      continue;
    }

    const body = question.simpleText || question.text;
    const result = await sendTextToPatientChannel(db, patient, body);

    results.push({
      scheduleId: schedule.id,
      patientId: patient.id,
      questionId: question.id,
      body,
      sentAt: now,
      ...result
    });
  }

  await updateDb((currentDb) => {
    for (const result of results) {
      const schedule = currentDb.schedules.find((item) => item.id === result.scheduleId);
      if (!schedule) {
        continue;
      }

      const snapshot = getLocalScheduleSnapshot(new Date(), schedule.timezone);
      schedule.lastDispatchKey = `${snapshot.dateKey}@${schedule.time}`;
      schedule.updatedAt = nowIso();

      if (result.ok && result.patientId) {
        currentDb.messages.push({
          id: createId("message"),
          patientId: result.patientId,
          questionId: result.questionId ?? null,
          scheduleId: schedule.id,
          direction: "outbound",
          type: "text",
          body: result.body ?? "",
          status: "sent",
          sentAt: result.sentAt ?? nowIso(),
          receivedAt: null,
          replyToMessageId: null,
          errorMessage: null,
          ...buildChannelMessageFields(result.channel ?? "whatsapp", result.messageId)
        });
        continue;
      }

      const failedMessageId = createId("message");
      currentDb.messages.push({
        id: failedMessageId,
        patientId: result.patientId ?? schedule.patientId,
        questionId: result.questionId ?? schedule.questionId,
        scheduleId: schedule.id,
        direction: "outbound",
        type: "text",
        body: result.body ?? "",
        status: "failed",
        sentAt: null,
        receivedAt: null,
        replyToMessageId: null,
        errorMessage: result.error,
        ...buildChannelMessageFields(result.channel ?? "whatsapp", null)
      });

      currentDb.alerts.push(
        createDeliveryAlert(
          schedule.patientId,
          result.channel ?? "whatsapp",
          result.error ?? "A mensagem agendada nao foi enviada.",
          null,
          failedMessageId
        )
      );
    }

    syncAlerts(currentDb);
  });
}

export function ensureSchedulerStarted() {
  if (typeof window !== "undefined") {
    return;
  }

  if (global.__telemonitor_scheduler_started__) {
    return;
  }

  global.__telemonitor_scheduler_started__ = true;

  void processDueSchedules();

  setInterval(async () => {
    if (global.__telemonitor_scheduler_busy__) {
      return;
    }

    global.__telemonitor_scheduler_busy__ = true;

    try {
      await processDueSchedules();
    } finally {
      global.__telemonitor_scheduler_busy__ = false;
    }
  }, 30_000);
}
