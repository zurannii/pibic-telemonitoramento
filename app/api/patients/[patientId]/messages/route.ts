import { fail, ok, readString, requireUser } from "@/lib/server/api";
import { readDb, updateDb } from "@/lib/server/db";
import {
  buildChannelMessageFields,
  createDeliveryAlert,
  sendMessageToPatientChannel
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
  const requestedMessageType = readString(body?.messageType) || "automatic";

  if (!new Set(["automatic", "text", "audio"]).has(requestedMessageType)) {
    return fail(400, "Escolha um formato de mensagem valido.");
  }

  const preferredMessageType =
    requestedMessageType === "text" || requestedMessageType === "audio"
      ? requestedMessageType
      : null;

  const snapshot = await readDb();
  const patient = snapshot.patients.find((item) => item.id === patientId);
  if (!patient) {
    return fail(404, "Paciente nao encontrado.");
  }

  const question = questionId
    ? snapshot.questions.find((item) => item.id === questionId) ?? null
    : null;
  const messageBody = customText || question?.simpleText || question?.text;

  if (!messageBody) {
    return fail(400, "Escolha uma pergunta ou digite uma mensagem.");
  }

  // A chamada aos provedores fica fora da transacao do PostgreSQL. TTS pode
  // demorar dezenas de segundos e nao deve manter o banco bloqueado.
  const sendResult = await sendMessageToPatientChannel(
    snapshot,
    patient,
    messageBody,
    preferredChannel,
    preferredMessageType
  );

  const message = await updateDb((db) => {
    const currentPatient = db.patients.find((item) => item.id === patientId);
    if (!currentPatient) return null;

    const persistedQuestionId = question?.id && db.questions.some((item) => item.id === question.id)
      ? question.id
      : null;
    const message = {
      id: createId("message"),
      patientId: currentPatient.id,
      questionId: persistedQuestionId,
      scheduleId: null,
      direction: "outbound" as const,
      type: sendResult.messageType,
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

    return message;
  });

  if (!message) {
    return fail(409, "O paciente foi removido durante o envio da mensagem.");
  }

  if (!sendResult.ok) {
    return fail(
      502,
      sendResult.error ?? "Nao foi possivel enviar a mensagem ao paciente."
    );
  }

  return ok({ sendResult, message });
}
