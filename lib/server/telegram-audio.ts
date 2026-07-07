import {
  downloadTelegramFile,
  sendTelegramChatAction,
  type TelegramFileAttachment
} from "./telegram";
import type { TelegramSettings } from "../shared/types";
import { transcribeAudio } from "./transcription";

const CHAT_ACTION_REFRESH_MS = 4_000;

export type TelegramAudioMessage = {
  audio?: TelegramFileAttachment;
  voice?: TelegramFileAttachment;
};

export function getTelegramAudioAttachment(message: TelegramAudioMessage) {
  return message.voice ?? message.audio ?? null;
}

async function withTypingAction<T>(
  settings: TelegramSettings,
  chatId: string,
  operation: () => Promise<T>
): Promise<T> {
  let actionFailed = !(await sendTelegramChatAction(settings, chatId, "typing"));
  const interval = setInterval(() => {
    if (actionFailed) return;

    void sendTelegramChatAction(settings, chatId, "typing").then((sent) => {
      actionFailed = !sent;
    });
  }, CHAT_ACTION_REFRESH_MS);

  try {
    return await operation();
  } finally {
    clearInterval(interval);
  }
}

export async function transcribeTelegramAudio(
  settings: TelegramSettings,
  chatId: string,
  message: TelegramAudioMessage
): Promise<string> {
  const attachment = getTelegramAudioAttachment(message);
  if (!attachment) {
    throw new Error("A mensagem do Telegram nao contem audio.");
  }

  return withTypingAction(settings, chatId, async () => {
    const downloadedFile = await downloadTelegramFile(settings, attachment);
    return transcribeAudio({
      bytes: downloadedFile.bytes,
      fileName: attachment.file_name ?? downloadedFile.filePath,
      mimeType: attachment.mime_type
    });
  });
}
