import { hashPassword, toPublicUser } from "@/lib/server/auth";
import { fail, ok, readString, requireUser } from "@/lib/server/api";
import { findUserByEmail, readDb, updateDb } from "@/lib/server/db";
import { createId, nowIso } from "@/lib/server/utils";

export const runtime = "nodejs";

export async function GET() {
  const { user, response } = await requireUser();
  if (!user) {
    return response;
  }

  const db = await readDb();
  return ok({ users: db.users.map((item) => toPublicUser(item)) });
}

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) {
    return response;
  }

  const body = await request.json().catch(() => null);
  const name = readString(body?.name);
  const email = readString(body?.email).toLowerCase();
  const password = readString(body?.password) || "demo123";
  const specialty = readString(body?.specialty) || "Equipe Clínica";
  const role = readString(body?.role) || "professional";

  if (!name || !email) {
    return fail(400, "Preencha nome e email.");
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return fail(409, "Já existe um usuário com esse email.");
  }

  const createdUser = await updateDb(async (db) => {
    const now = nowIso();
    const nextUser = {
      id: createId("user"),
      name,
      email,
      passwordHash: await hashPassword(password),
      role: role === "admin" || role === "viewer" ? role : "professional",
      specialty,
      createdAt: now,
      updatedAt: now
    } as const;

    db.users.push(nextUser);
    return nextUser;
  });

  return ok({ user: toPublicUser(createdUser) });
}
