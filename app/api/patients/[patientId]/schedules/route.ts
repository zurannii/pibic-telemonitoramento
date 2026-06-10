import { fail, ok, readBoolean, readString, requireUser } from "@/lib/server/api";
import { buildPatientDetails, updateDb } from "@/lib/server/db";
import { createId, nowIso } from "@/lib/server/utils";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    patientId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { user, response } = await requireUser();
  if (!user) {
    return response;
  }

  const { patientId } = await context.params;
  const body = await request.json().catch(() => null);
  const questionId = readString(body?.questionId);
  const label = readString(body?.label);
  const time = readString(body?.time);
  const timezone = readString(body?.timezone) || "America/Sao_Paulo";
  const daysOfWeek = Array.isArray(body?.daysOfWeek)
    ? (body.daysOfWeek as unknown[]).map(Number).filter((value: number) => value >= 0 && value <= 6)
    : [1, 2, 3, 4, 5];

  if (!questionId || !time) {
    return fail(400, "Escolha uma pergunta e um horário.");
  }

  const schedule = await updateDb((db) => {
    const patient = db.patients.find((item) => item.id === patientId);
    const question = db.questions.find((item) => item.id === questionId);
    if (!patient || !question) {
      return null;
    }

    const now = nowIso();
    const nextSchedule = {
      id: createId("schedule"),
      patientId,
      questionId,
      label: label || question.title,
      time,
      timezone,
      daysOfWeek,
      active: true,
      lastDispatchKey: null,
      createdByUserId: user.id,
      createdAt: now,
      updatedAt: now
    } as const;

    db.schedules.push(nextSchedule);
    return nextSchedule;
  });

  if (!schedule) {
    return fail(404, "Paciente ou pergunta não encontrados.");
  }

  return ok({ schedule, details: await buildPatientDetails(patientId) });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { user, response } = await requireUser();
  if (!user) {
    return response;
  }

  const { patientId } = await context.params;
  const body = await request.json().catch(() => null);
  const scheduleId = readString(body?.scheduleId);

  if (!scheduleId) {
    return fail(400, "Informe qual agendamento você quer atualizar.");
  }

  const schedule = await updateDb((db) => {
    const current = db.schedules.find((item) => item.id === scheduleId && item.patientId === patientId);
    if (!current) {
      return null;
    }

    const label = readString(body?.label);
    const time = readString(body?.time);
    const timezone = readString(body?.timezone);
    const daysOfWeek = Array.isArray(body?.daysOfWeek)
      ? (body.daysOfWeek as unknown[]).map(Number).filter((value: number) => value >= 0 && value <= 6)
      : null;

    if (label) current.label = label;
    if (time) current.time = time;
    if (timezone) current.timezone = timezone;
    if (daysOfWeek) current.daysOfWeek = daysOfWeek;
    if (body?.active !== undefined) current.active = readBoolean(body.active);
    current.updatedAt = nowIso();

    return current;
  });

  if (!schedule) {
    return fail(404, "Agendamento não encontrado.");
  }

  return ok({ schedule, details: await buildPatientDetails(patientId) });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { user, response } = await requireUser();
  if (!user) {
    return response;
  }

  const { patientId } = await context.params;
  const body = await request.json().catch(() => null);
  const scheduleId = readString(body?.scheduleId);

  if (!scheduleId) {
    return fail(400, "Informe qual agendamento você quer remover.");
  }

  const deleted = await updateDb((db) => {
    const exists = db.schedules.some((item) => item.id === scheduleId && item.patientId === patientId);
    if (!exists) {
      return false;
    }

    db.schedules = db.schedules.filter((item) => item.id !== scheduleId);
    return true;
  });

  if (!deleted) {
    return fail(404, "Agendamento não encontrado.");
  }

  return ok({ success: true, details: await buildPatientDetails(patientId) });
}
