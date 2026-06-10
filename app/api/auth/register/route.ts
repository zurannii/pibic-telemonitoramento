import { createSession, hashPassword, toPublicUser } from "@/lib/server/auth";
import { fail, ok, readString } from "@/lib/server/api";
import { findUserByEmail, updateDb } from "@/lib/server/db";
import { createId, nowIso } from "@/lib/server/utils";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = readString(body?.name);
  const email = readString(body?.email).toLowerCase();
  const password = readString(body?.password);
  const specialty = readString(body?.specialty);

  if (!name || !email || !password) {
    return fail(400, "Preencha nome, email e senha.");
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return fail(409, "Já existe um usuário com esse email.");
  }

  const user = await updateDb(async (db) => {
    const now = nowIso();
    const nextUser = {
      id: createId("user"),
      name,
      email,
      passwordHash: await hashPassword(password),
      role: db.users.length === 0 ? "admin" : "professional",
      specialty: specialty || "Equipe Clínica",
      createdAt: now,
      updatedAt: now
    } as const;

    db.users.push(nextUser);
    return nextUser;
  });

  await createSession(user.id);
  return ok({ user: toPublicUser(user) });
}
