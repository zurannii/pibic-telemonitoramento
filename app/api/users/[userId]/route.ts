import { fail, ok, readString, requireUser } from "@/lib/server/api";
import { updateDb } from "@/lib/server/db";
import { nowIso } from "@/lib/server/utils";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { user, response } = await requireUser();
  if (!user) {
    return response;
  }

  const { userId } = await context.params;
  const body = await request.json().catch(() => null);

  const updatedUser = await updateDb((db) => {
    const current = db.users.find((item) => item.id === userId);
    if (!current) {
      return null;
    }

    const name = readString(body?.name);
    const specialty = readString(body?.specialty);
    const role = readString(body?.role);

    if (name) current.name = name;
    if (specialty) current.specialty = specialty;
    if (role === "admin" || role === "professional" || role === "viewer") current.role = role;
    current.updatedAt = nowIso();

    return current;
  });

  if (!updatedUser) {
    return fail(404, "Profissional não encontrado.");
  }

  return ok({ success: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { user, response } = await requireUser();
  if (!user) {
    return response;
  }

  const { userId } = await context.params;
  if (userId === user.id) {
    return fail(400, "Você não pode excluir o usuário que está logado.");
  }

  const deleted = await updateDb((db) => {
    const exists = db.users.some((item) => item.id === userId);
    if (!exists) {
      return false;
    }

    db.users = db.users.filter((item) => item.id !== userId);

    for (const patient of db.patients) {
      if (patient.responsibleUserId === userId) {
        patient.responsibleUserId = null;
      }
    }

    for (const alert of db.alerts) {
      if (alert.assignedToUserId === userId) {
        alert.assignedToUserId = null;
      }
    }

    return true;
  });

  if (!deleted) {
    return fail(404, "Profissional não encontrado.");
  }

  return ok({ success: true });
}
