import { getSessionUser, toPublicUser } from "@/lib/server/auth";
import { ok } from "@/lib/server/api";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  return ok({ user: user ? toPublicUser(user) : null });
}
