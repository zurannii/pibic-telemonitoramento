import { fail, ok } from "@/lib/server/api";
import { matchPatientByTelegramChatId, matchPatientByTelegramLinkToken, readDb, updateDb } from "@/lib/server/db";
import { registerInboundMessage } from "@/lib/server/messaging";
import { nowIso } from "@/lib/server/utils";

export const runtime = "nodejs";

function parseStartToken(text: string) {
  const match = text.trim().match(/^\/start(?:@\w+)?(?:\s+(.+))?$/i);
  return match?.[1]?.trim() || null;
}

function getMessageText(message: Record<string, unknown>) {
  if (typeof message.text === "string" && message.text.trim()) {
    return message.text.trim();
  }

  if (message.voice || message.audio) {
    return "[Audio recebido pelo Telegram]";
  }

  return "[Mensagem recebida]";
}

export async function GET() {
  return ok({ ok: true });
}

export async function POST(request: Request) {
  const db = await readDb();
  const secretHeader = request.headers.get("x-telegram-bot-api-secret-token");
  if (db.telegram.webhookSecret && secretHeader !== db.telegram.webhookSecret) {
    return fail(403, "Webhook do Telegram rejeitado por token invalido.");
  }

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return fail(400, "Payload invalido.");
  }

  await updateDb((currentDb) => {
    const update = payload as {
      message?: {
        message_id?: number;
        text?: string;
        voice?: unknown;
        audio?: unknown;
        chat?: { id?: number | string; username?: string };
        from?: { username?: string };
      };
    };

    const message = update.message;
    if (!message?.chat?.id) {
      return;
    }

    const chatId = String(message.chat.id);
    const text = typeof message.text === "string" ? message.text.trim() : "";
    const startToken = text ? parseStartToken(text) : null;
    const username =
      (typeof message.from?.username === "string" && message.from.username) ||
      (typeof message.chat.username === "string" && message.chat.username) ||
      null;

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
      return;
    }

    if (text.startsWith("/start")) {
      registerInboundMessage(currentDb, patient, {
        body: startToken ? "[Telegram iniciado com token de vinculo]" : "[Telegram iniciado]",
        channel: "telegram",
        metadata: message as unknown as Record<string, unknown>,
        providerMessageId: message.message_id ? String(message.message_id) : null,
        type: "text",
        allowReplyAssociation: false,
        replyToMessageId: null
      });
      return;
    }

    registerInboundMessage(currentDb, patient, {
      body: getMessageText(message as unknown as Record<string, unknown>),
      channel: "telegram",
      metadata: message as unknown as Record<string, unknown>,
      providerMessageId: message.message_id ? String(message.message_id) : null,
      type: message.voice || message.audio ? "audio" : "text"
    });
  });

  return ok({ received: true });
}
