import type { WhatsAppSettings } from "../shared/types";
import { fetchWithTimeout } from "./http";

const WHATSAPP_REQUEST_TIMEOUT_MS = 30_000;

export type SendWhatsAppResult = {
  ok: boolean;
  messageId: string | null;
  error: string | null;
};

export type WhatsAppAudioInput = {
  bytes: ArrayBuffer;
  fileName: string;
  mimeType: string;
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

export async function sendWhatsAppAudioMessage(
  settings: WhatsAppSettings,
  to: string,
  audio: WhatsAppAudioInput
): Promise<SendWhatsAppResult> {
  if (!isWhatsAppConfigured(settings)) {
    return {
      ok: false,
      messageId: null,
      error: "Integracao do WhatsApp ainda nao foi configurada."
    };
  }

  try {
    const form = new FormData();
    form.append("messaging_product", "whatsapp");
    form.append("file", new Blob([audio.bytes], { type: audio.mimeType }), audio.fileName);

    const uploadResponse = await fetchWithTimeout(
      `https://graph.facebook.com/${settings.apiVersion}/${settings.phoneNumberId}/media`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${settings.accessToken}` },
        body: form
      },
      WHATSAPP_REQUEST_TIMEOUT_MS
    );
    const uploadPayload = (await uploadResponse.json().catch(() => null)) as
      | { id?: string; error?: { message?: string } }
      | null;

    if (!uploadResponse.ok || !uploadPayload?.id) {
      return {
        ok: false,
        messageId: null,
        error: uploadPayload?.error?.message ?? "Falha ao carregar o audio no WhatsApp."
      };
    }

    const sendResponse = await fetchWithTimeout(
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
          type: "audio",
          audio: { id: uploadPayload.id }
        })
      },
      WHATSAPP_REQUEST_TIMEOUT_MS
    );
    const sendPayload = (await sendResponse.json().catch(() => null)) as
      | { error?: { message?: string }; messages?: Array<{ id?: string }> }
      | null;

    if (!sendResponse.ok) {
      return {
        ok: false,
        messageId: null,
        error: sendPayload?.error?.message ?? "Falha ao enviar audio pelo WhatsApp."
      };
    }

    return {
      ok: true,
      messageId: sendPayload?.messages?.[0]?.id ?? null,
      error: null
    };
  } catch (error) {
    return {
      ok: false,
      messageId: null,
      error: error instanceof Error ? error.message : "Erro inesperado ao enviar audio pelo WhatsApp."
    };
  }
}
