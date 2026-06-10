import { fail, ok } from "@/lib/server/api";
import { matchPatientByPhone, readDb, updateDb } from "@/lib/server/db";
import { registerInboundMessage } from "@/lib/server/messaging";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const db = await readDb();
  if (mode === "subscribe" && token && token === db.whatsapp.verifyToken) {
    return new Response(challenge ?? "ok", { status: 200 });
  }

  return fail(403, "Falha na validacao do webhook do WhatsApp.");
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload) {
    return fail(400, "Payload invalido.");
  }

  await updateDb((db) => {
    const entries = Array.isArray(payload.entry) ? payload.entry : [];

    for (const entry of entries) {
      const changes = Array.isArray(entry.changes) ? entry.changes : [];

      for (const change of changes) {
        const value = change.value ?? {};
        const messages = Array.isArray(value.messages) ? value.messages : [];
        const statuses = Array.isArray(value.statuses) ? value.statuses : [];

        for (const status of statuses) {
          const current = db.messages.find(
            (message) => message.channel === "whatsapp" && message.providerMessageId === status.id
          );
          if (current) {
            current.status =
              status.status === "delivered" || status.status === "read"
                ? status.status
                : current.status;
          }
        }

        for (const message of messages) {
          const patient = matchPatientByPhone(db, message.from ?? "");
          if (!patient) {
            continue;
          }

          const body =
            message.text?.body ??
            (message.type === "audio" ? "[Audio recebido pelo WhatsApp]" : "[Mensagem recebida]");

          registerInboundMessage(db, patient, {
            body,
            channel: "whatsapp",
            metadata: message,
            providerMessageId: message.id ?? null,
            type: message.type === "audio" ? "audio" : "text"
          });
        }
      }
    }
  });

  return ok({ received: true });
}
