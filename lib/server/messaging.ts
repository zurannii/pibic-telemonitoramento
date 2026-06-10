import type {
  AlertRecord,
  DatabaseShape,
  MessageLogRecord,
  MessagingChannel,
  PatientRecord
} from "../shared/types";
import { updatePatientStatusFromAlerts } from "./db";
import { sendTelegramTextMessage } from "./telegram";
import { createId, normalizePhone, nowIso } from "./utils";
import { sendWhatsAppTextMessage } from "./whatsapp";

export type SendChannelResult = {
  ok: boolean;
  channel: MessagingChannel;
  messageId: string | null;
  error: string | null;
};

const PENDING_OUTBOUND_STATUSES = new Set(["sent", "delivered", "read"]);

export function getChannelLabel(channel: MessagingChannel) {
  return channel === "telegram" ? "Telegram" : "WhatsApp";
}

export function resolvePatientChannel(
  patient: PatientRecord,
  preferredChannel?: string | null
): MessagingChannel {
  if (preferredChannel === "telegram") {
    return "telegram";
  }

  if (preferredChannel === "whatsapp") {
    return "whatsapp";
  }

  return patient.preferredChannel === "telegram" ? "telegram" : "whatsapp";
}

export function buildChannelMessageFields(channel: MessagingChannel, providerMessageId: string | null) {
  return {
    channel,
    providerMessageId,
    whatsappMessageId: channel === "whatsapp" ? providerMessageId : null,
    telegramMessageId: channel === "telegram" ? providerMessageId : null
  };
}

export async function sendTextToPatientChannel(
  db: DatabaseShape,
  patient: PatientRecord,
  body: string,
  preferredChannel?: string | null
): Promise<SendChannelResult> {
  const channel = resolvePatientChannel(patient, preferredChannel);

  if (channel === "telegram") {
    const result = await sendTelegramTextMessage(db.telegram, patient.telegramChatId ?? "", body);
    return {
      channel,
      ...result
    };
  }

  const targetPhone = normalizePhone(patient.phone);
  if (!targetPhone) {
    return {
      ok: false,
      channel,
      messageId: null,
      error: "Paciente nao possui numero de WhatsApp valido."
    };
  }

  const result = await sendWhatsAppTextMessage(db.whatsapp, targetPhone, body);
  return {
    channel,
    ...result
  };
}

export function getLatestPendingOutboundMessage(
  db: DatabaseShape,
  patientId: string,
  channel: MessagingChannel
) {
  return [...db.messages]
    .filter(
      (item) =>
        item.patientId === patientId &&
        item.channel === channel &&
        item.direction === "outbound" &&
        PENDING_OUTBOUND_STATUSES.has(item.status)
    )
    .sort((a, b) => (b.sentAt ?? "").localeCompare(a.sentAt ?? ""))[0];
}

export function textIndicatesWorsening(body: string) {
  return /pior|piorou|forte|muita dor|8\/10|9\/10|10\/10/i.test(body);
}

export function createDeliveryAlert(
  patientId: string,
  channel: MessagingChannel,
  description: string,
  assignedToUserId: string | null,
  sourceMessageId: string | null
): AlertRecord {
  return {
    id: createId("alert"),
    patientId,
    level: "high",
    title: `Falha no envio via ${getChannelLabel(channel)}`,
    description,
    type: "delivery",
    status: "active",
    createdAt: nowIso(),
    resolvedAt: null,
    assignedToUserId,
    sourceMessageId
  };
}

export function registerInboundMessage(
  db: DatabaseShape,
  patient: PatientRecord,
  payload: {
    body: string;
    channel: MessagingChannel;
    metadata?: Record<string, unknown>;
    providerMessageId: string | null;
    receivedAt?: string;
    replyToMessageId?: string | null;
    type: "text" | "audio";
    allowReplyAssociation?: boolean;
  }
) {
  if (payload.providerMessageId) {
    const existing = db.messages.find(
      (message) =>
        message.direction === "inbound" &&
        message.channel === payload.channel &&
        message.providerMessageId === payload.providerMessageId
    );

    if (existing) {
      return existing;
    }
  }

  const latestPendingOutbound =
    payload.allowReplyAssociation === false
      ? null
      : getLatestPendingOutboundMessage(db, patient.id, payload.channel);

  const inbound: MessageLogRecord = {
    id: createId("message"),
    patientId: patient.id,
    questionId: latestPendingOutbound?.questionId ?? null,
    scheduleId: latestPendingOutbound?.scheduleId ?? null,
    direction: "inbound",
    type: payload.type,
    body: payload.body,
    status: "received",
    sentAt: null,
    receivedAt: payload.receivedAt ?? nowIso(),
    replyToMessageId: payload.replyToMessageId ?? latestPendingOutbound?.id ?? null,
    errorMessage: null,
    metadata: payload.metadata,
    ...buildChannelMessageFields(payload.channel, payload.providerMessageId)
  };

  db.messages.push(inbound);

  if (latestPendingOutbound) {
    latestPendingOutbound.status = "answered";
  }

  if (textIndicatesWorsening(payload.body)) {
    db.alerts.push({
      id: createId("alert"),
      patientId: patient.id,
      level: "high",
      title: "Resposta sugere piora",
      description: `Paciente respondeu: "${payload.body}"`,
      type: "manual",
      status: "active",
      createdAt: nowIso(),
      resolvedAt: null,
      assignedToUserId: patient.responsibleUserId,
      sourceMessageId: inbound.id
    });
  }

  updatePatientStatusFromAlerts(patient, db.alerts);
  return inbound;
}
