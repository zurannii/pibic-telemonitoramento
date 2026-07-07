import { RequestTimeoutError, fetchWithTimeout } from "./http";

const GROQ_TRANSCRIPTION_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_TRANSCRIPTION_MODEL = "whisper-large-v3";
const DEFAULT_TRANSCRIPTION_TIMEOUT_MS = 60_000;
const MAX_TRANSCRIPTION_FILE_SIZE = 20 * 1024 * 1024;

const FORMAT_ALIASES: Record<string, SupportedAudioFormat> = {
  oga: "ogg"
};

const MIME_FORMATS: Record<string, SupportedAudioFormat> = {
  "application/ogg": "ogg",
  "audio/flac": "flac",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/webm": "webm",
  "audio/x-flac": "flac",
  "audio/x-m4a": "m4a",
  "audio/x-wav": "wav",
  "video/mp4": "mp4",
  "video/webm": "webm"
};

const FORMAT_MIME_TYPES: Record<SupportedAudioFormat, string> = {
  flac: "audio/flac",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  mpeg: "audio/mpeg",
  mpga: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
  webm: "audio/webm"
};

type SupportedAudioFormat =
  | "flac"
  | "mp3"
  | "mp4"
  | "mpeg"
  | "mpga"
  | "m4a"
  | "ogg"
  | "wav"
  | "webm";

export type TranscriptionErrorCode =
  | "invalid-file"
  | "not-configured"
  | "timeout"
  | "transcription-failed"
  | "unsupported-format";

export class TranscriptionError extends Error {
  constructor(
    public readonly code: TranscriptionErrorCode,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "TranscriptionError";
  }
}

export type AudioTranscriptionInput = {
  bytes: ArrayBuffer;
  fileName?: string | null;
  mimeType?: string | null;
};

type GroqTranscriptionResponse = {
  error?: { message?: string } | string;
  text?: string;
};

function readPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getFileExtension(fileName?: string | null) {
  const match = fileName?.trim().toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? null;
}

function isSupportedAudioFormat(value: string): value is SupportedAudioFormat {
  return value in FORMAT_MIME_TYPES;
}

function resolveAudioFormat(input: AudioTranscriptionInput): SupportedAudioFormat {
  const extension = getFileExtension(input.fileName);
  if (extension) {
    const normalizedExtension = FORMAT_ALIASES[extension] ?? extension;
    if (isSupportedAudioFormat(normalizedExtension)) {
      return normalizedExtension;
    }
  }

  const normalizedMimeType = input.mimeType?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  const formatFromMime = MIME_FORMATS[normalizedMimeType];
  if (formatFromMime) {
    return formatFromMime;
  }

  throw new TranscriptionError(
    "unsupported-format",
    "O formato do arquivo de audio nao e suportado para transcricao."
  );
}

function buildUploadFileName(fileName: string | null | undefined, format: SupportedAudioFormat) {
  const originalBaseName = fileName?.split(/[\\/]/).pop()?.trim() || "audio";
  const safeBaseName = originalBaseName
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 100) || "audio";

  return `${safeBaseName}.${format}`;
}

async function readGroqError(response: Response) {
  const payload = (await response.json().catch(() => null)) as GroqTranscriptionResponse | null;
  if (typeof payload?.error === "string") {
    return payload.error;
  }

  return payload?.error?.message || `A Groq respondeu com HTTP ${response.status}.`;
}

export async function transcribeAudio(input: AudioTranscriptionInput): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new TranscriptionError(
      "not-configured",
      "A chave da API de transcricao nao esta configurada."
    );
  }

  if (!input.bytes.byteLength || input.bytes.byteLength > MAX_TRANSCRIPTION_FILE_SIZE) {
    throw new TranscriptionError(
      "invalid-file",
      input.bytes.byteLength
        ? "O arquivo de audio excede o limite de 20 MB do Telegram."
        : "O arquivo de audio esta vazio ou corrompido."
    );
  }

  const format = resolveAudioFormat(input);
  const fileName = buildUploadFileName(input.fileName, format);
  const form = new FormData();
  form.append("file", new Blob([input.bytes], { type: FORMAT_MIME_TYPES[format] }), fileName);
  form.append("model", GROQ_TRANSCRIPTION_MODEL);
  form.append("response_format", "json");
  form.append("language", "pt");
  form.append("temperature", "0");

  const timeoutMs = readPositiveInteger(
    process.env.GROQ_TRANSCRIPTION_TIMEOUT_MS,
    DEFAULT_TRANSCRIPTION_TIMEOUT_MS
  );

  try {
    const response = await fetchWithTimeout(
      GROQ_TRANSCRIPTION_URL,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`
        },
        body: form
      },
      timeoutMs
    );

    if (!response.ok) {
      throw new TranscriptionError("transcription-failed", await readGroqError(response));
    }

    const payload = (await response.json().catch(() => null)) as GroqTranscriptionResponse | null;
    const text = payload?.text?.trim();
    if (!text) {
      throw new TranscriptionError(
        "transcription-failed",
        "A Groq nao retornou texto para o arquivo de audio."
      );
    }

    return text;
  } catch (error) {
    if (error instanceof TranscriptionError) {
      throw error;
    }

    if (error instanceof RequestTimeoutError) {
      throw new TranscriptionError("timeout", "A transcricao excedeu o tempo limite.", {
        cause: error
      });
    }

    throw new TranscriptionError("transcription-failed", "Falha ao transcrever o arquivo de audio.", {
      cause: error
    });
  }
}
