import { ok, readBoolean, readString, requireUser } from "@/lib/server/api";
import { readDb, updateDb } from "@/lib/server/db";
import { registerTelegramWebhook } from "@/lib/server/telegram";
import { resolvePublicAppUrl, resolveTelegramSettings } from "@/lib/server/telegram-config";
import { maskSecret, nowIso } from "@/lib/server/utils";

export const runtime = "nodejs";

export async function GET() {
  const { user, response } = await requireUser();
  if (!user) return response;

  const db = await readDb();
  const settings = resolveTelegramSettings(db.telegram);
  return ok({
    settings: {
      enabled: settings.enabled,
      botToken: maskSecret(settings.botToken),
      botUsername: settings.botUsername,
      webhookSecret: maskSecret(settings.webhookSecret),
      updatedAt: db.telegram.updatedAt
    }
  });
}

export async function PATCH(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const body = await request.json().catch(() => null);
  const baseUrl = resolvePublicAppUrl(request);

  let pendingWebhookRegistration = false;
  let targetBotToken = "";
  let targetWebhookSecret = "";

  await updateDb((db) => {
    const resolved = resolveTelegramSettings(db.telegram);
    const enabled = body?.enabled !== undefined ? readBoolean(body.enabled) : resolved.enabled;
    const botToken = readString(body?.botToken).trim() || resolved.botToken;
    const botUsername = readString(body?.botUsername).trim() || resolved.botUsername;
    const webhookSecret = readString(body?.webhookSecret).trim() || resolved.webhookSecret;

    db.telegram.enabled = enabled;
    if (botToken && body?.botToken) db.telegram.botToken = botToken;
    if (body?.botUsername && botUsername) db.telegram.botUsername = botUsername.replace(/^@/, "");
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
