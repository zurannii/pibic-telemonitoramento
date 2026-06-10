import { createSession, toPublicUser, verifyPassword } from "@/lib/server/auth";
import { fail, ok, readString } from "@/lib/server/api";
import { findUserByEmail } from "@/lib/server/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = readString(body?.email).toLowerCase();
  const password = readString(body?.password);

  if (!email || !password) {
    return fail(400, "Informe email e senha.");
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return fail(401, "Email ou senha inválidos.");
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    return fail(401, "Email ou senha inválidos.");
  }

  await createSession(user.id);
  return ok({ user: toPublicUser(user) });
}
