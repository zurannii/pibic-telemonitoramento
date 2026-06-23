import { fail, ok } from "@/lib/server/api";
import { matchPatientByTelegramChatId, matchPatientByTelegramLinkToken, readDb, updateDb } from "@/lib/server/db";
import { registerInboundMessage } from "@/lib/server/messaging";
import { nowIso } from "@/lib/server/utils";

export const runtime = "nodejs";

// Extrai o payload do comando /start
function extractStartToken(text: string): string | null {
  const match = text.trim().match(/^\/start(?:@\w+)?(?:\s+(.+))?$/i);
  return match?.[1]?.trim() || null;
}

export async function GET() {
  return ok({ status: "Telegram Webhook is Active" });
}

export async function POST(request: Request) {
  const db = await readDb();
  
  // Segurança: Valida o Secret Token do Webhook
  const secretHeader = request.headers.get("x-telegram-bot-api-secret-token");
  if (db.telegram.webhookSecret && secretHeader !== db.telegram.webhookSecret) {
    return fail(403, "Acesso Negado: Token de webhook inválido.");
  }

  const payload = await request.json().catch(() => null);
  if (!payload?.message?.chat?.id) return ok({ received: true }); // Ignora atualizações irrelevantes

  await updateDb((currentDb) => {
    const message = payload.message;
    const chatId = String(message.chat.id);
    const text = typeof message.text === "string" ? message.text.trim() : "";
    const username = message.from?.username || message.chat.username || null;
    const startToken = extractStartToken(text);

    // Identificação do Paciente
    let patient = matchPatientByTelegramChatId(currentDb, chatId);

    if (!patient && startToken) {
      patient = matchPatientByTelegramLinkToken(currentDb, startToken);
      if (patient) {
        // Vincula o paciente ao chat do Telegram
        patient.telegramChatId = chatId;
        patient.telegramUsername = username;
        patient.telegramLinkedAt = nowIso();
        patient.preferredChannel = "telegram";
        patient.updatedAt = nowIso();
      }
    }

    if (!patient) return; // Paciente desconhecido, encerra o fluxo

    // Tratamento de mensagens de sistema vs mensagens de rotina
    if (text.startsWith("/start")) {
      registerInboundMessage(currentDb, patient, {
        body: startToken ? "✅ *Telegram vinculado com sucesso!*" : "Iniciou o bot.",
        channel: "telegram",
        metadata: message,
        providerMessageId: String(message.message_id),
        type: "text",
        allowReplyAssociation: false,
      });
      return;
    }

    // Registra mensagens comuns
    const isAudio = Boolean(message.voice || message.audio);
    registerInboundMessage(currentDb, patient, {
      body: isAudio ? "[Áudio Recebido]" : (text || "[Mídia Recebida]"),
      channel: "telegram",
      metadata: message,
      providerMessageId: String(message.message_id),
      type: isAudio ? "audio" : "text"
    });
  });

  return ok({ received: true });
}