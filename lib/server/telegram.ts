import type { TelegramSettings } from "../shared/types";
import { RequestTimeoutError, fetchWithTimeout } from "./http";

const TELEGRAM_REQUEST_TIMEOUT_MS = 15_000;
const TELEGRAM_MAX_DOWNLOAD_SIZE = 20 * 1024 * 1024;

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

export type TelegramVoiceInput = {
  bytes: ArrayBuffer;
  fileName: string;
  mimeType: string;
};

export type TelegramFileAttachment = {
  file_id: string;
  file_name?: string;
  file_size?: number;
  file_unique_id?: string;
  mime_type?: string;
};

export type DownloadedTelegramFile = {
  bytes: ArrayBuffer;
  filePath: string;
};

export type TelegramFileDownloadErrorCode =
  | "download-failed"
  | "file-too-large"
  | "invalid-file"
  | "timeout";

export class TelegramFileDownloadError extends Error {
  constructor(
    public readonly code: TelegramFileDownloadErrorCode,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "TelegramFileDownloadError";
  }
}

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

async function readResponseBytes(response: Response, maxBytes: number, timeoutMs: number) {
  if (!response.body) {
    throw new TelegramFileDownloadError("invalid-file", "O Telegram retornou um arquivo vazio.");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    void reader.cancel();
  }, timeoutMs);

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new TelegramFileDownloadError(
          "file-too-large",
          "O arquivo excede o limite de download de 20 MB do Telegram."
        );
      }

      chunks.push(value);
    }
  } catch (error) {
    if (timedOut) {
      throw new RequestTimeoutError(timeoutMs);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (timedOut) {
    throw new RequestTimeoutError(timeoutMs);
  }

  if (!totalBytes) {
    throw new TelegramFileDownloadError("invalid-file", "O arquivo recebido esta vazio ou corrompido.");
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return bytes.buffer;
}

export async function downloadTelegramFile(
  settings: TelegramSettings,
  attachment: TelegramFileAttachment
): Promise<DownloadedTelegramFile> {
  if (!isTelegramConfigured(settings)) {
    throw new TelegramFileDownloadError(
      "download-failed",
      "A integracao com o Telegram esta desativada ou incompleta."
    );
  }

  if (!attachment.file_id) {
    throw new TelegramFileDownloadError("invalid-file", "O audio nao possui um identificador valido.");
  }

  if (attachment.file_size && attachment.file_size > TELEGRAM_MAX_DOWNLOAD_SIZE) {
    throw new TelegramFileDownloadError(
      "file-too-large",
      "O arquivo excede o limite de download de 20 MB do Telegram."
    );
  }

  try {
    const fileInfoResponse = await fetchWithTimeout(
      `https://api.telegram.org/bot${settings.botToken}/getFile?file_id=${encodeURIComponent(attachment.file_id)}`,
      { method: "GET", cache: "no-store" },
      TELEGRAM_REQUEST_TIMEOUT_MS
    );
    const fileInfo = (await fileInfoResponse.json().catch(() => null)) as
      | TelegramApiResponse<{ file_path?: string; file_size?: number }>
      | null;
    const filePath = fileInfo?.result?.file_path;

    if (!fileInfoResponse.ok || !fileInfo?.ok || !filePath) {
      throw new TelegramFileDownloadError(
        "download-failed",
        fileInfo?.description ?? "O Telegram nao retornou o caminho do arquivo."
      );
    }

    if (fileInfo.result?.file_size && fileInfo.result.file_size > TELEGRAM_MAX_DOWNLOAD_SIZE) {
      throw new TelegramFileDownloadError(
        "file-too-large",
        "O arquivo excede o limite de download de 20 MB do Telegram."
      );
    }

    const fileResponse = await fetchWithTimeout(
      `https://api.telegram.org/file/bot${settings.botToken}/${filePath}`,
      { method: "GET", cache: "no-store" },
      TELEGRAM_REQUEST_TIMEOUT_MS
    );

    if (!fileResponse.ok) {
      throw new TelegramFileDownloadError(
        "download-failed",
        `O download do Telegram respondeu com HTTP ${fileResponse.status}.`
      );
    }

    return {
      bytes: await readResponseBytes(
        fileResponse,
        TELEGRAM_MAX_DOWNLOAD_SIZE,
        TELEGRAM_REQUEST_TIMEOUT_MS
      ),
      filePath
    };
  } catch (error) {
    if (error instanceof TelegramFileDownloadError) {
      throw error;
    }

    if (error instanceof RequestTimeoutError) {
      throw new TelegramFileDownloadError("timeout", "O download do audio excedeu o tempo limite.", {
        cause: error
      });
    }

    throw new TelegramFileDownloadError("download-failed", "Falha ao baixar o audio do Telegram.", {
      cause: error
    });
  }
}

export async function sendTelegramChatAction(
  settings: TelegramSettings,
  chatId: string,
  action: "typing"
): Promise<boolean> {
  if (!isTelegramConfigured(settings) || !chatId) return false;

  try {
    const response = await fetchWithTimeout(
      `https://api.telegram.org/bot${settings.botToken}/sendChatAction`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, action })
      },
      TELEGRAM_REQUEST_TIMEOUT_MS
    );
    const payload = (await response.json().catch(() => null)) as TelegramApiResponse | null;
    return Boolean(response.ok && payload?.ok);
  } catch {
    return false;
  }
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

export async function sendTelegramVoiceMessage(
  settings: TelegramSettings,
  chatId: string,
  audio: TelegramVoiceInput
): Promise<SendTelegramResult> {
  if (!isTelegramConfigured(settings)) {
    return {
      ok: false,
      messageId: null,
      error: "A integracao com o Telegram esta desativada ou incompleta."
    };
  }

  if (!chatId) {
    return {
      ok: false,
      messageId: null,
      error: "Paciente ainda nao vinculou o Telegram (aguardando /start)."
    };
  }

  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("voice", new Blob([audio.bytes], { type: audio.mimeType }), audio.fileName);

  try {
    const response = await fetchWithTimeout(
      `https://api.telegram.org/bot${settings.botToken}/sendVoice`,
      { method: "POST", body: form },
      TELEGRAM_REQUEST_TIMEOUT_MS
    );
    const payload = (await response.json().catch(() => null)) as
      | TelegramApiResponse<{ message_id: number }>
      | null;

    if (!response.ok || !payload?.ok) {
      return {
        ok: false,
        messageId: null,
        error: payload?.description ?? "Falha ao enviar audio pela API do Telegram."
      };
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
