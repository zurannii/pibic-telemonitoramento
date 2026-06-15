import { fail, ok, readBoolean, readString, requireUser } from "@/lib/server/api";
import { readDb, updateDb } from "@/lib/server/db";
import { resolveTelegramSettings } from "@/lib/server/telegram-config";
import { maskSecret, nowIso } from "@/lib/server/utils";

export const runtime = "nodejs";

export async function GET() {
  const { user, response } = await requireUser();
  if (!user) {
    return response;
  }

  const db = await readDb();
  const telegramSettings = resolveTelegramSettings(db.telegram);
  return ok({
    settings: {
      enabled: telegramSettings.enabled,
      botToken: maskSecret(telegramSettings.botToken),
      botUsername: telegramSettings.botUsername,
      webhookSecret: maskSecret(telegramSettings.webhookSecret),
      updatedAt: db.telegram.updatedAt
    }
  });
}

export async function PATCH(request: Request) {
  const { user, response } = await requireUser();
  if (!user) {
    return response;
  }

  const body = await request.json().catch(() => null);

  await updateDb((db) => {
    const enabled = body?.enabled !== undefined ? readBoolean(body.enabled) : db.telegram.enabled;
    const botToken = readString(body?.botToken);
    const botUsername = readString(body?.botUsername);
    const webhookSecret = readString(body?.webhookSecret);

    db.telegram.enabled = enabled;
    if (botToken) db.telegram.botToken = botToken;
    if (botUsername) db.telegram.botUsername = botUsername.replace(/^@/, "");
    if (webhookSecret) db.telegram.webhookSecret = webhookSecret;
    db.telegram.updatedAt = nowIso();
  });

  return ok({ success: true });
}
