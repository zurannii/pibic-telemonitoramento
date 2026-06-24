import type { TelegramSettings } from "../shared/types";

export type TelegramApiResponse<T = unknown> = {
  ok: boolean;
  description?: string;
  result?: T;
};

export type SendTelegramResult = {
  ok: boolean;
  messageId: string | null;
  error: string | null;
};

export type TelegramDiagnostics = {
  botUsername: string | null;
  lastErrorDate: string | null;
  lastErrorMessage: string | null;
  ok: boolean;
  pendingUpdateCount: number;
  webhookUrl: string | null;
};

export function isTelegramConfigured(settings: TelegramSettings): boolean {
  return Boolean(settings.enabled && settings.botToken);
}

/**
 * Registra o Webhook no Telegram automaticamente para receber mensagens.
 */
export async function registerTelegramWebhook(
  botToken: string,
  webhookUrl: string,
  webhookSecret?: string
): Promise<boolean> {
  if (!botToken || !webhookUrl) return false;

  try {
    const url = new URL(`https://api.telegram.org/bot${botToken}/setWebhook`);
    url.searchParams.append("url", webhookUrl);
    if (webhookSecret) {
      url.searchParams.append("secret_token", webhookSecret);
    }

    const response = await fetch(url.toString(), { method: "POST" });
    const data = (await response.json()) as TelegramApiResponse;
    
    return data.ok;
  } catch (error) {
    console.error("Erro ao registrar webhook do Telegram:", error);
    return false;
  }
}

export async function getTelegramDiagnostics(
  settings: TelegramSettings
): Promise<TelegramDiagnostics> {
  if (!settings.botToken) {
    return {
      botUsername: null,
      lastErrorDate: null,
      lastErrorMessage: "Bot Token nao configurado.",
      ok: false,
      pendingUpdateCount: 0,
      webhookUrl: null
    };
  }

  try {
    const apiBase = `https://api.telegram.org/bot${settings.botToken}`;
    const [botResponse, webhookResponse] = await Promise.all([
      fetch(`${apiBase}/getMe`, { cache: "no-store" }),
      fetch(`${apiBase}/getWebhookInfo`, { cache: "no-store" })
    ]);
    const bot = (await botResponse.json()) as TelegramApiResponse<{ username?: string }>;
    const webhook = (await webhookResponse.json()) as TelegramApiResponse<{
      last_error_date?: number;
      last_error_message?: string;
      pending_update_count?: number;
      url?: string;
    }>;
    const lastErrorDate = webhook.result?.last_error_date
      ? new Date(webhook.result.last_error_date * 1000).toISOString()
      : null;

    return {
      botUsername: bot.result?.username ?? null,
      lastErrorDate,
      lastErrorMessage: webhook.result?.last_error_message ?? webhook.description ?? null,
      ok: Boolean(bot.ok && webhook.ok),
      pendingUpdateCount: webhook.result?.pending_update_count ?? 0,
      webhookUrl: webhook.result?.url || null
    };
  } catch (error) {
    return {
      botUsername: null,
      lastErrorDate: null,
      lastErrorMessage: error instanceof Error ? error.message : "Falha ao consultar o Telegram.",
      ok: false,
      pendingUpdateCount: 0,
      webhookUrl: null
    };
  }
}

/**
 * Envia uma mensagem de texto para um chat específico.
 */
export async function sendTelegramTextMessage(
  settings: TelegramSettings,
  chatId: string,
  body: string
): Promise<SendTelegramResult> {
  if (!isTelegramConfigured(settings)) {
    return { ok: false, messageId: null, error: "A integração com o Telegram está desativada ou incompleta." };
  }

  if (!chatId) {
    return { ok: false, messageId: null, error: "Paciente ainda não vinculou o Telegram (aguardando /start)." };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${settings.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: body })
    });

    const payload = (await response.json()) as TelegramApiResponse<{ message_id: number }>;

    if (!response.ok || !payload.ok) {
      return { ok: false, messageId: null, error: payload.description ?? "Falha na API do Telegram." };
    }

    return { ok: true, messageId: String(payload.result?.message_id), error: null };
  } catch (error) {
    return {
      ok: false,
      messageId: null,
      error: error instanceof Error ? error.message : "Erro interno ao conectar com o Telegram."
    };
  }
}
