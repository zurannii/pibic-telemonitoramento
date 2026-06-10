import { clearSession } from "@/lib/server/auth";
import { ok } from "@/lib/server/api";

export const runtime = "nodejs";

export async function POST() {
  await clearSession();
  return ok({ success: true });
}
