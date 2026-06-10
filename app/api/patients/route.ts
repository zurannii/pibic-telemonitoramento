import { ok, fail, readString, requireUser } from "@/lib/server/api";
import { buildPatientList, updateDb } from "@/lib/server/db";
import { createId, nowIso, normalizePhone } from "@/lib/server/utils";

export const runtime = "nodejs";

export async function GET() {
  const { user, response } = await requireUser();
  if (!user) {
    return response;
  }

  return ok({ patients: await buildPatientList() });
}

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) {
    return response;
  }

  const body = await request.json().catch(() => null);
  const name = readString(body?.name);
  const age = Number(body?.age);
  const phone = normalizePhone(readString(body?.phone));
  const condition = readString(body?.condition);
  const notes = readString(body?.notes);
  const preferredResponseFormat =
    readString(body?.preferredResponseFormat) || "text";
  const preferredChannel = readString(body?.preferredChannel) === "telegram" ? "telegram" : "whatsapp";
  const responsibleUserId = readString(body?.responsibleUserId) || null;
  const contactWindowStart = readString(body?.contactWindowStart) || "09:00";
  const contactWindowEnd = readString(body?.contactWindowEnd) || "21:00";

  if (!name || !phone || !condition || Number.isNaN(age)) {
    return fail(400, "Preencha nome, idade, telefone e condição principal.");
  }

  const patient = await updateDb((db) => {
    const now = nowIso();
    const nextPatient = {
      id: createId("patient"),
      name,
      age,
      phone,
      condition,
      notes,
      responsibleUserId,
      preferredResponseFormat:
        preferredResponseFormat === "audio" || preferredResponseFormat === "buttons"
          ? preferredResponseFormat
          : "text",
      preferredChannel,
      contactWindowStart,
      contactWindowEnd,
      telegramChatId: null,
      telegramUsername: null,
      telegramLinkToken: createId("tglink"),
      telegramLinkedAt: null,
      status: "stable",
      createdAt: now,
      updatedAt: now
    } as const;

    db.patients.push(nextPatient);
    return nextPatient;
  });

  return ok({ patient });
}
