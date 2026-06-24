import { fail, ok, requireUser } from "@/lib/server/api";
import { readDb } from "@/lib/server/db";
import { getTelegramDiagnostics } from "@/lib/server/telegram";
import { resolveTelegramSettings } from "@/lib/server/telegram-config";

export const runtime = "nodejs";

export async function GET() {
  const { user, response } = await requireUser();
  if (!user) return response;

  const database = await readDb();
  const settings = resolveTelegramSettings(database.telegram);
  if (!settings.botToken) {
    return fail(400, "Bot Token nao configurado.");
  }

  return ok(await getTelegramDiagnostics(settings));
}
