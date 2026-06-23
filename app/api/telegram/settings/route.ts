import { ok, readBoolean, readString, requireUser } from "@/lib/server/api";
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
  const baseUrl = new URL(request.url).origin;

  let pendingWebhookRegistration = false;
  let targetBotToken = "";
  let targetWebhookSecret = "";

  await updateDb((db) => {
    const enabled = body?.enabled !== undefined ? readBoolean(body.enabled) : db.telegram.enabled;
    const botToken = readString(body?.botToken).trim() || db.telegram.botToken;
    const botUsername = readString(body?.botUsername).trim();
    const webhookSecret = readString(body?.webhookSecret).trim() || db.telegram.webhookSecret;

    db.telegram.enabled = enabled;
    if (botToken && body?.botToken) db.telegram.botToken = botToken;
    if (botUsername) db.telegram.botUsername = botUsername.replace(/^@/, "");
    if (webhookSecret && body?.webhookSecret) db.telegram.webhookSecret = webhookSecret;
    db.telegram.updatedAt = nowIso();

    if (enabled && botToken) {
      pendingWebhookRegistration = true;
      targetBotToken = botToken;
      targetWebhookSecret = webhookSecret;
    }
  });

  let webhookRegistered = false;
  let warning: string | null = null;

  if (pendingWebhookRegistration) {
    const webhookUrl = `${baseUrl}/api/telegram/webhook`;
    webhookRegistered = await registerTelegramWebhook(targetBotToken, webhookUrl, targetWebhookSecret);

    if (!webhookRegistered) {
      warning =
        "Configurações salvas, mas o Telegram não confirmou o webhook. Verifique a URL HTTPS pública e tente novamente.";
    }
  }

  return ok({
    success: true,
    webhookRegistered,
    warning
  });
}
