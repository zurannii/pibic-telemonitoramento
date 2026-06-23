import { fail, ok, readBoolean, readString, requireUser } from "@/lib/server/api";
import { readDb, updateDb } from "@/lib/server/db";
import { registerTelegramWebhook } from "@/lib/server/telegram";
import { maskSecret, nowIso } from "@/lib/server/utils";

export const runtime = "nodejs";

export async function GET() {
  const { user, response } = await requireUser();
  if (!user) return response;

  const db = await readDb();
  return ok({
    settings: {
      enabled: db.telegram.enabled,
      botToken: maskSecret(db.telegram.botToken),
      botUsername: db.telegram.botUsername,
      webhookSecret: maskSecret(db.telegram.webhookSecret),
      updatedAt: db.telegram.updatedAt
    }
  });
}

export async function PATCH(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const body = await request.json().catch(() => null);
  
  // Extrai a URL base do request para informar ao Telegram onde o webhook deve bater
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host");
  const baseUrl = `${protocol}://${host}`;

  let webhookRegistered = false;

  await updateDb(async (db) => {
    const enabled = body?.enabled !== undefined ? readBoolean(body.enabled) : db.telegram.enabled;
    const botToken = readString(body?.botToken) || db.telegram.botToken;
    const botUsername = readString(body?.botUsername);
    const webhookSecret = readString(body?.webhookSecret) || db.telegram.webhookSecret;

    db.telegram.enabled = enabled;
    if (botToken && body?.botToken) db.telegram.botToken = botToken;
    if (botUsername) db.telegram.botUsername = botUsername.replace(/^@/, "");
    if (webhookSecret && body?.webhookSecret) db.telegram.webhookSecret = webhookSecret;
    db.telegram.updatedAt = nowIso();

    // Se estiver ativando ou trocando o token, registra o webhook no Telegram
    if (enabled && botToken) {
      const webhookUrl = `${baseUrl}/api/telegram/webhook`;
      webhookRegistered = await registerTelegramWebhook(botToken, webhookUrl, webhookSecret);
    }
  });

  if (!webhookRegistered && body?.enabled) {
    return fail(400, "Configuração salva, mas o Telegram recusou o Webhook. Verifique o Token.");
  }

  return ok({ success: true, webhookRegistered });
}