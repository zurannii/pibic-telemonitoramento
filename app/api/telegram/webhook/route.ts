import { fail, ok } from "@/lib/server/api";
import {
  matchPatientByTelegramChatId,
  matchPatientByTelegramLinkToken,
  readDb,
  updateDb
} from "@/lib/server/db";
import { registerInboundMessage } from "@/lib/server/messaging";
import { transcribeTelegramAudio, type TelegramAudioMessage } from "@/lib/server/telegram-audio";
import {
  sendTelegramTextMessage,
  type TelegramFileAttachment
} from "@/lib/server/telegram";
import { resolveTelegramSettings } from "@/lib/server/telegram-config";
import { nowIso } from "@/lib/server/utils";

export const runtime = "nodejs";

const AUDIO_TRANSCRIPTION_ERROR_MESSAGE =
  "Não foi possível compreender o áudio. Por favor, tente novamente.";

type TelegramWebhookMessage = TelegramAudioMessage & {
  message_id?: number;
  text?: string;
  chat: { id: number | string; username?: string };
  from?: { username?: string };
};

type ParsedTelegramMessage = {
  message: TelegramWebhookMessage;
  metadata: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readAudioAttachment(value: unknown): TelegramFileAttachment | undefined {
  if (!isRecord(value)) return undefined;

  return {
    file_id: typeof value.file_id === "string" ? value.file_id : "",
    file_name: typeof value.file_name === "string" ? value.file_name : undefined,
    file_size: typeof value.file_size === "number" ? value.file_size : undefined,
    file_unique_id: typeof value.file_unique_id === "string" ? value.file_unique_id : undefined,
    mime_type: typeof value.mime_type === "string" ? value.mime_type : undefined
  };
}

function parseTelegramMessage(payload: unknown): ParsedTelegramMessage | null {
  if (!isRecord(payload) || !isRecord(payload.message)) {
    return null;
  }

  const rawMessage = payload.message;
  if (!isRecord(rawMessage.chat)) {
    return null;
  }

  const rawChat = rawMessage.chat;
  if (typeof rawChat.id !== "number" && typeof rawChat.id !== "string") {
    return null;
  }

  const rawFrom = isRecord(rawMessage.from) ? rawMessage.from : null;
  return {
    metadata: rawMessage,
    message: {
      message_id: typeof rawMessage.message_id === "number" ? rawMessage.message_id : undefined,
      text: typeof rawMessage.text === "string" ? rawMessage.text : undefined,
      voice: readAudioAttachment(rawMessage.voice),
      audio: readAudioAttachment(rawMessage.audio),
      chat: {
        id: rawChat.id,
        username: typeof rawChat.username === "string" ? rawChat.username : undefined
      },
      from: rawFrom
        ? {
            username: typeof rawFrom.username === "string" ? rawFrom.username : undefined
          }
        : undefined
    }
  };
}

function parseStartToken(text: string) {
  const match = text.trim().match(/^\/start(?:@\w+)?(?:\s+(.+))?$/i);
  return match?.[1]?.trim() || null;
}

function isDuplicateMessage(
  messages: Array<{ channel: string; direction: string; providerMessageId: string | null }>,
  providerMessageId: string | null
) {
  return Boolean(
    providerMessageId &&
      messages.some(
        (message) =>
          message.channel === "telegram" &&
          message.direction === "inbound" &&
          message.providerMessageId === providerMessageId
      )
  );
}

export async function GET() {
  return ok({ ok: true });
}

export async function POST(request: Request) {
  const db = await readDb();
  const telegramSettings = resolveTelegramSettings(db.telegram);
  const secretHeader = request.headers.get("x-telegram-bot-api-secret-token");
  if (telegramSettings.webhookSecret && secretHeader !== telegramSettings.webhookSecret) {
    return fail(403, "Webhook do Telegram rejeitado por token invalido.");
  }

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return fail(400, "Payload invalido.");
  }

  const parsed = parseTelegramMessage(payload);
  if (!parsed) {
    return ok({ received: true });
  }

  const { message, metadata } = parsed;
  const chatId = String(message.chat.id);
  const text = message.text?.trim() ?? "";
  const startToken = text ? parseStartToken(text) : null;
  const username = message.from?.username || message.chat.username || null;
  const providerMessageId = message.message_id ? String(message.message_id) : null;

  if (text.startsWith("/start")) {
    const result = await updateDb((currentDb) => {
      let patient = matchPatientByTelegramChatId(currentDb, chatId);

      if (!patient && startToken) {
        patient = matchPatientByTelegramLinkToken(currentDb, startToken);
        if (patient) {
          patient.telegramChatId = chatId;
          patient.telegramUsername = username;
          patient.telegramLinkedAt = nowIso();
          patient.preferredChannel = "telegram";
          patient.updatedAt = nowIso();
        }
      }

      if (!patient) {
        console.warn("Webhook do Telegram recebeu mensagem sem paciente correspondente.", {
          hasStartToken: Boolean(startToken)
        });
        return null;
      }

      registerInboundMessage(currentDb, patient, {
        body: startToken ? "[Telegram iniciado com token de vinculo]" : "[Telegram iniciado]",
        channel: "telegram",
        metadata,
        providerMessageId,
        type: "text",
        allowReplyAssociation: false,
        replyToMessageId: null
      });

      return { patientName: patient.name };
    });

    if (result) {
      await sendTelegramTextMessage(
        telegramSettings,
        chatId,
        `Vinculo realizado com sucesso para ${result.patientName}.`
      );
    }

    return ok({ received: true });
  }

  const patient = matchPatientByTelegramChatId(db, chatId);
  if (!patient) {
    console.warn("Webhook do Telegram recebeu mensagem sem paciente correspondente.", {
      hasStartToken: false
    });
    return ok({ received: true });
  }

  if (isDuplicateMessage(db.messages, providerMessageId)) {
    return ok({ received: true });
  }

  const isAudio = Boolean(message.voice || message.audio);
  let messageBody = text || "[Mensagem recebida]";

  if (isAudio) {
    try {
      messageBody = await transcribeTelegramAudio(telegramSettings, chatId, message);
    } catch (error) {
      console.error("Falha ao processar audio recebido pelo Telegram.", {
        error: error instanceof Error ? error.message : "Erro desconhecido.",
        providerMessageId
      });

      const notification = await sendTelegramTextMessage(
        telegramSettings,
        chatId,
        AUDIO_TRANSCRIPTION_ERROR_MESSAGE
      );
      if (!notification.ok) {
        console.error("Falha ao notificar usuario sobre erro na transcricao do Telegram.", {
          error: notification.error,
          providerMessageId
        });
      }

      return ok({ received: true });
    }
  }

  await updateDb((currentDb) => {
    const currentPatient = currentDb.patients.find((item) => item.id === patient.id);
    if (!currentPatient) return;

    registerInboundMessage(currentDb, currentPatient, {
      body: messageBody,
      channel: "telegram",
      metadata,
      providerMessageId,
      type: isAudio ? "audio" : "text"
    });
  });

  return ok({ received: true });
}
