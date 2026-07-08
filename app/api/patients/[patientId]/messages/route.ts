import { fail, ok, readString, requireUser } from "@/lib/server/api";
import { updateDb } from "@/lib/server/db";
import {
  buildChannelMessageFields,
  createDeliveryAlert,
  sendTextToPatientChannel
} from "@/lib/server/messaging";
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
  const customText = readString(body?.text);
  const preferredChannel = readString(body?.channel) || null;

  const result = await updateDb(async (db) => {
    const patient = db.patients.find((item) => item.id === patientId);
    if (!patient) {
      return { kind: "missing-patient" as const };
    }

    const question = questionId
      ? db.questions.find((item) => item.id === questionId) ?? null
      : null;
    const messageBody = customText || question?.simpleText || question?.text;

    if (!messageBody) {
      return { kind: "missing-message" as const };
    }

    const sendResult = await sendTextToPatientChannel(
      db,
      patient,
      messageBody,
      preferredChannel
    );
    const message = {
      id: createId("message"),
      patientId: patient.id,
      questionId: question?.id ?? null,
      scheduleId: null,
      direction: "outbound" as const,
      type: "text" as const,
      body: messageBody,
      status: sendResult.ok ? ("sent" as const) : ("failed" as const),
      sentAt: sendResult.ok ? nowIso() : null,
      receivedAt: null,
      replyToMessageId: null,
      errorMessage: sendResult.error,
      ...buildChannelMessageFields(sendResult.channel, sendResult.messageId)
    };

    db.messages.push(message);

    if (!sendResult.ok) {
      db.alerts.push(
        createDeliveryAlert(
          patient.id,
          sendResult.channel,
          sendResult.error ?? "Nao foi possivel enviar a mensagem ao paciente.",
          user.id,
          message.id
        )
      );
    }

    return {
      kind: "done" as const,
      sendResult,
      message
    };
  });

  if (result.kind === "missing-patient") {
    return fail(404, "Paciente nao encontrado.");
  }

  if (result.kind === "missing-message") {
    return fail(400, "Escolha uma pergunta ou digite uma mensagem.");
  }

  return ok(result);
}
