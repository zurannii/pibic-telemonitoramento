import type {
  AlertRecord,
  DatabaseShape,
  MessageLogRecord,
  MessagingChannel,
  PatientRecord
} from "../shared/types";
import { updatePatientStatusFromAlerts } from "./db";
import {
  isTelegramConfigured,
  sendTelegramTextMessage,
  sendTelegramVoiceMessage
} from "./telegram";
import { resolveTelegramSettings } from "./telegram-config";
import { synthesizeSpeech } from "./text-to-speech";
import { createId, normalizePhone, nowIso } from "./utils";
import {
  isWhatsAppConfigured,
  sendWhatsAppAudioMessage,
  sendWhatsAppTextMessage
} from "./whatsapp";

export type SendChannelResult = {
  ok: boolean;
  channel: MessagingChannel;
  messageType: "text" | "audio";
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

export async function sendMessageToPatientChannel(
  db: DatabaseShape,
  patient: PatientRecord,
  body: string,
  preferredChannel?: string | null
): Promise<SendChannelResult> {
  const channel = resolvePatientChannel(patient, preferredChannel);
  const messageType = patient.requiresAudioMessages ? "audio" : "text";
  const telegramSettings = resolveTelegramSettings(db.telegram);

  if (channel === "telegram" && !patient.telegramChatId) {
    return {
      ok: false,
      channel,
      messageType,
      messageId: null,
      error: "Paciente ainda nao vinculou o Telegram (aguardando /start)."
    };
  }

  const targetPhone = channel === "whatsapp" ? normalizePhone(patient.phone) : null;
  if (channel === "whatsapp" && !targetPhone) {
    return {
      ok: false,
      channel,
      messageType,
      messageId: null,
      error: "Paciente nao possui numero de WhatsApp valido."
    };
  }

  if (channel === "telegram" && !isTelegramConfigured(telegramSettings)) {
    return {
      ok: false,
      channel,
      messageType,
      messageId: null,
      error: "A integracao com o Telegram esta desativada ou incompleta."
    };
  }

  if (channel === "whatsapp" && !isWhatsAppConfigured(db.whatsapp)) {
    return {
      ok: false,
      channel,
      messageType,
      messageId: null,
      error: "Integracao do WhatsApp ainda nao foi configurada."
    };
  }

  if (patient.requiresAudioMessages) {
    try {
      const audio = await synthesizeSpeech(body);
      const result =
        channel === "telegram"
          ? await sendTelegramVoiceMessage(
              telegramSettings,
              patient.telegramChatId ?? "",
              audio
            )
          : await sendWhatsAppAudioMessage(db.whatsapp, targetPhone ?? "", audio);

      return { channel, messageType, ...result };
    } catch (error) {
      console.error("Falha ao gerar mensagem de audio assistido.", {
        error: error instanceof Error ? error.message : "Erro desconhecido.",
        patientId: patient.id,
        channel
      });

      return {
        ok: false,
        channel,
        messageType,
        messageId: null,
        error: error instanceof Error ? error.message : "Nao foi possivel gerar o audio da mensagem."
      };
    }
  }

  if (channel === "telegram") {
    const result = await sendTelegramTextMessage(
      telegramSettings,
      patient.telegramChatId ?? "",
      body
    );
    return {
      channel,
      messageType,
      ...result
    };
  }

  const result = await sendWhatsAppTextMessage(db.whatsapp, targetPhone ?? "", body);
  return {
    channel,
    messageType,
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
