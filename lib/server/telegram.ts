import type { TelegramSettings } from "../shared/types";

export type SendTelegramResult = {
  ok: boolean;
  messageId: string | null;
  error: string | null;
};

export function isTelegramConfigured(settings: TelegramSettings) {
  return Boolean(settings.enabled && settings.botToken);
}

export async function sendTelegramTextMessage(
  settings: TelegramSettings,
  chatId: string,
  body: string
): Promise<SendTelegramResult> {
  if (!isTelegramConfigured(settings)) {
    return {
      ok: false,
      messageId: null,
      error: "Integracao do Telegram ainda nao foi configurada."
    };
  }

  if (!chatId) {
    return {
      ok: false,
      messageId: null,
      error: "Paciente ainda nao vinculou o Telegram a este acompanhamento."
    };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${settings.botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: body
      })
    });

    const payload = (await response.json()) as {
      ok?: boolean;
      description?: string;
      result?: {
        message_id?: number;
      };
    };

    if (!response.ok || payload.ok === false) {
      return {
        ok: false,
        messageId: null,
        error: payload.description ?? "Falha ao enviar mensagem pelo Telegram."
      };
    }

    return {
      ok: true,
      messageId: payload.result?.message_id ? String(payload.result.message_id) : null,
      error: null
    };
  } catch (error) {
    return {
      ok: false,
      messageId: null,
      error: error instanceof Error ? error.message : "Erro inesperado ao falar com a API do Telegram."
    };
  }
}
