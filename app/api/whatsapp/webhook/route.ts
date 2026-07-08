import crypto from "node:crypto";

import { fail, ok } from "@/lib/server/api";
import { matchPatientByPhone, readDb, updateDb } from "@/lib/server/db";
import {
  INBOUND_MESSAGE_CONFIRMATION,
  registerInboundMessage,
  sendMessageToPatientChannel
} from "@/lib/server/messaging";

export const runtime = "nodejs";

function verifyMetaSignature(rawBody: string, signatureHeader: string | null, appSecret: string) {
  if (!appSecret) {
    return true;
  }

  if (!signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const signature = signatureHeader.slice("sha256=".length);
  const digest = crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

  if (signature.length !== digest.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

function extractMessageBody(message: Record<string, unknown>) {
  const text = message.text as { body?: unknown } | undefined;
  if (typeof text?.body === "string" && text.body.trim()) {
    return text.body.trim();
  }

  if (message.audio || message.voice) {
    return "[Áudio recebido pelo WhatsApp]";
  }

  return "[Mensagem recebida pelo WhatsApp]";
}

function extractMessages(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return [] as Array<Record<string, unknown>>;
  }

  const entries = Array.isArray((payload as { entry?: unknown }).entry)
    ? ((payload as { entry?: unknown }).entry as unknown[])
    : [];

  const messages: Array<Record<string, unknown>> = [];
  for (const entry of entries) {
    const changes = Array.isArray((entry as { changes?: unknown }).changes)
      ? ((entry as { changes?: unknown }).changes as unknown[])
      : [];

    for (const change of changes) {
      const value = (change as { value?: unknown }).value as
        | {
            messages?: unknown;
          }
        | undefined;

      if (!value || !Array.isArray(value.messages)) {
        continue;
      }

      for (const message of value.messages) {
        if (message && typeof message === "object") {
          messages.push(message as Record<string, unknown>);
        }
      }
    }
  }

  return messages;
}

export async function GET(request: Request) {
  const db = await readDb();
  const url = new URL(request.url);

  const mode = url.searchParams.get("hub.mode");
  const verifyToken = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && verifyToken && verifyToken === db.whatsapp.verifyToken && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      }
    });
  }

  if (!mode && !verifyToken && !challenge) {
    return ok({ status: "WhatsApp Webhook is Active" });
  }

  return fail(403, "Webhook do WhatsApp rejeitado.");
}

export async function POST(request: Request) {
  const db = await readDb();
  const rawBody = await request.text();

  if (!verifyMetaSignature(rawBody, request.headers.get("x-hub-signature-256"), db.whatsapp.appSecret)) {
    return fail(403, "Assinatura do webhook do WhatsApp invalida.");
  }

  let payload: unknown = null;
  try {
    payload = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    return fail(400, "Payload do WhatsApp invalido.");
  }

  const messages = extractMessages(payload);

  if (!messages.length) {
    return ok({ received: true });
  }

  const patientIdsToConfirm = await updateDb((currentDb) => {
    const patientIds: string[] = [];

    for (const message of messages) {
      const fromPhone = typeof message.from === "string" ? message.from : "";
      if (!fromPhone) {
        continue;
      }

      const patient = matchPatientByPhone(currentDb, fromPhone);
      if (!patient) {
        continue;
      }

      const providerMessageId = typeof message.id === "string" ? message.id : null;
      const text = extractMessageBody(message);
      const messageType = message.audio || message.voice ? "audio" : "text";
      const previousMessageCount = currentDb.messages.length;

      registerInboundMessage(currentDb, patient, {
        body: text,
        channel: "whatsapp",
        metadata: message,
        providerMessageId,
        type: messageType
      });

      if (currentDb.messages.length > previousMessageCount) {
        patientIds.push(patient.id);
      }
    }

    return patientIds;
  });

  if (patientIdsToConfirm.length) {
    const currentDb = await readDb();
    for (const patientId of patientIdsToConfirm) {
      const patient = currentDb.patients.find((item) => item.id === patientId);
      if (!patient) continue;

      const confirmation = await sendMessageToPatientChannel(
        currentDb,
        patient,
        INBOUND_MESSAGE_CONFIRMATION,
        "whatsapp"
      );
      if (!confirmation.ok) {
        console.error("Falha ao confirmar o recebimento da mensagem no WhatsApp.", {
          error: confirmation.error,
          patientId
        });
      }
    }
  }

  return ok({ received: true });
}
