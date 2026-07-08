import { RequestTimeoutError, fetchWithTimeout } from "./http";

const OPENAI_SPEECH_URL = "https://api.openai.com/v1/audio/speech";
const DEFAULT_TTS_MODEL = "tts-1-hd";
const DEFAULT_TTS_VOICE = "nova";
const DEFAULT_TTS_TIMEOUT_MS = 60_000;
const MAX_TTS_INPUT_LENGTH = 4_096;

export type SpeechSynthesisErrorCode =
  | "generation-failed"
  | "invalid-input"
  | "not-configured"
  | "timeout";

export class SpeechSynthesisError extends Error {
  constructor(
    public readonly code: SpeechSynthesisErrorCode,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "SpeechSynthesisError";
  }
}

export type SynthesizedSpeech = {
  bytes: ArrayBuffer;
  fileName: string;
  mimeType: "audio/mpeg";
};

type OpenAiErrorResponse = {
  error?: { message?: string } | string;
};

function readPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function readOpenAiError(response: Response) {
  const payload = (await response.json().catch(() => null)) as OpenAiErrorResponse | null;
  if (typeof payload?.error === "string") return payload.error;
  return payload?.error?.message || `A OpenAI respondeu com HTTP ${response.status}.`;
}

export async function synthesizeSpeech(text: string): Promise<SynthesizedSpeech> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new SpeechSynthesisError(
      "not-configured",
      "A chave da API de sintese de voz nao esta configurada."
    );
  }

  const input = text.trim();
  if (!input || input.length > MAX_TTS_INPUT_LENGTH) {
    throw new SpeechSynthesisError(
      "invalid-input",
      input
        ? `A mensagem excede o limite de ${MAX_TTS_INPUT_LENGTH} caracteres para sintese de voz.`
        : "A mensagem para sintese de voz esta vazia."
    );
  }

  const timeoutMs = readPositiveInteger(
    process.env.OPENAI_TTS_TIMEOUT_MS,
    DEFAULT_TTS_TIMEOUT_MS
  );

  try {
    const response = await fetchWithTimeout(
      OPENAI_SPEECH_URL,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.OPENAI_TTS_MODEL?.trim() || DEFAULT_TTS_MODEL,
          input,
          voice: process.env.OPENAI_TTS_VOICE?.trim() || DEFAULT_TTS_VOICE,
          response_format: "mp3",
          speed: 0.95
        })
      },
      timeoutMs
    );

    if (!response.ok) {
      throw new SpeechSynthesisError("generation-failed", await readOpenAiError(response));
    }

    const bytes = await response.arrayBuffer();
    if (!bytes.byteLength) {
      throw new SpeechSynthesisError(
        "generation-failed",
        "A OpenAI retornou um arquivo de audio vazio."
      );
    }

    return {
      bytes,
      fileName: "mensagem.mp3",
      mimeType: "audio/mpeg"
    };
  } catch (error) {
    if (error instanceof SpeechSynthesisError) throw error;

    if (error instanceof RequestTimeoutError) {
      throw new SpeechSynthesisError("timeout", "A geracao do audio excedeu o tempo limite.", {
        cause: error
      });
    }

    throw new SpeechSynthesisError("generation-failed", "Falha ao gerar o audio da mensagem.", {
      cause: error
    });
  }
}
