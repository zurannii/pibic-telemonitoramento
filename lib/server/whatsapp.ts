import type { WhatsAppSettings } from "../shared/types";

export type SendWhatsAppResult = {
  ok: boolean;
  messageId: string | null;
  error: string | null;
};

export function isWhatsAppConfigured(settings: WhatsAppSettings) {
  return Boolean(
    settings.enabled &&
      settings.accessToken &&
      settings.phoneNumberId &&
      settings.verifyToken
  );
}

export async function sendWhatsAppTextMessage(
  settings: WhatsAppSettings,
  to: string,
  body: string
): Promise<SendWhatsAppResult> {
  if (!isWhatsAppConfigured(settings)) {
    return {
      ok: false,
      messageId: null,
      error: "Integração do WhatsApp ainda não foi configurada."
    };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${settings.apiVersion}/${settings.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${settings.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: {
            body
          }
        })
      }
    );

    const payload = (await response.json()) as {
      error?: { message?: string };
      messages?: Array<{ id?: string }>;
    };

    if (!response.ok) {
      return {
        ok: false,
        messageId: null,
        error: payload.error?.message ?? "Falha ao enviar mensagem pelo WhatsApp."
      };
    }

    return {
      ok: true,
      messageId: payload.messages?.[0]?.id ?? null,
      error: null
    };
  } catch (error) {
    return {
      ok: false,
      messageId: null,
      error: error instanceof Error ? error.message : "Erro inesperado ao falar com a API do WhatsApp."
    };
  }
}
