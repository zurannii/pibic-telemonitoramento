import { fail, ok, readBoolean, readString, requireUser } from "@/lib/server/api";
import { buildPatientDetails, updateDb } from "@/lib/server/db";
import { nowIso, normalizePhone } from "@/lib/server/utils";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    patientId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { user, response } = await requireUser();
  if (!user) {
    return response;
  }

  const { patientId } = await context.params;
  const details = await buildPatientDetails(patientId);
  if (!details) {
    return fail(404, "Paciente não encontrado.");
  }

  return ok(details);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { user, response } = await requireUser();
  if (!user) {
    return response;
  }

  const { patientId } = await context.params;
  const body = await request.json().catch(() => null);

  const updatedPatient = await updateDb((db) => {
    const patient = db.patients.find((item) => item.id === patientId);
    if (!patient) {
      return null;
    }

    const name = readString(body?.name);
    const condition = readString(body?.condition);
    const phone = readString(body?.phone);
    const notes = readString(body?.notes);
    const contactWindowStart = readString(body?.contactWindowStart);
    const contactWindowEnd = readString(body?.contactWindowEnd);
    const responsibleUserId = readString(body?.responsibleUserId);
    const preferredChannel = readString(body?.preferredChannel);
    const telegramChatId = readString(body?.telegramChatId);
    const telegramUsername = readString(body?.telegramUsername);

    if (name) patient.name = name;
    if (condition) patient.condition = condition;
    if (phone) patient.phone = normalizePhone(phone);
    if (notes !== undefined) patient.notes = notes;
    if (contactWindowStart) patient.contactWindowStart = contactWindowStart;
    if (contactWindowEnd) patient.contactWindowEnd = contactWindowEnd;
    if (responsibleUserId !== undefined) patient.responsibleUserId = responsibleUserId || null;
    if (body?.age !== undefined && !Number.isNaN(Number(body.age))) patient.age = Number(body.age);
    if (body?.preferredResponseFormat) patient.preferredResponseFormat = body.preferredResponseFormat;
    if (body?.requiresAudioMessages !== undefined) {
      patient.requiresAudioMessages = readBoolean(body.requiresAudioMessages);
      if (patient.requiresAudioMessages) patient.preferredResponseFormat = "audio";
    }
    if (preferredChannel === "telegram" || preferredChannel === "whatsapp") patient.preferredChannel = preferredChannel;
    if (body?.telegramChatId !== undefined) {
      patient.telegramChatId = telegramChatId || null;
      if (telegramChatId) {
        patient.telegramLinkedAt = patient.telegramLinkedAt ?? nowIso();
        patient.preferredChannel = "telegram";
      }
    }
    if (body?.telegramUsername !== undefined) patient.telegramUsername = telegramUsername || null;
    patient.updatedAt = nowIso();

    return patient;
  });

  if (!updatedPatient) {
    return fail(404, "Paciente não encontrado.");
  }

  return ok({ patient: updatedPatient });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { user, response } = await requireUser();
  if (!user) {
    return response;
  }

  const { patientId } = await context.params;

  const deleted = await updateDb((db) => {
    const existing = db.patients.find((item) => item.id === patientId);
    if (!existing) {
      return false;
    }

    db.patients = db.patients.filter((item) => item.id !== patientId);
    db.schedules = db.schedules.filter((item) => item.patientId !== patientId);
    db.messages = db.messages.filter((item) => item.patientId !== patientId);
    db.alerts = db.alerts.filter((item) => item.patientId !== patientId);
    return true;
  });

  if (!deleted) {
    return fail(404, "Paciente não encontrado.");
  }

  return ok({ success: true });
}
