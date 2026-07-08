import { RequestTimeoutError, fetchWithTimeout } from "./http";

const ELEVENLABS_SPEECH_URL = "https://api.elevenlabs.io/v1/text-to-speech";
const DEFAULT_TTS_MODEL = "eleven_flash_v2_5";
const DEFAULT_TTS_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";
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

type ElevenLabsErrorResponse = {
  detail?:
    | string
    | {
        message?: string;
        status?: string;
      };
};

function readPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function readElevenLabsError(response: Response) {
  const payload = (await response.json().catch(() => null)) as ElevenLabsErrorResponse | null;
  const status = typeof payload?.detail === "object" ? payload.detail.status : null;
  const providerMessage =
    typeof payload?.detail === "string" ? payload.detail : payload?.detail?.message;

  if (status === "quota_exceeded" || response.status === 402) {
    return "Os creditos gratuitos mensais do ElevenLabs terminaram.";
  }
  if (response.status === 401) {
    return "A chave ELEVENLABS_API_KEY e invalida ou foi desativada.";
  }
  if (response.status === 403) {
    return "A chave do ElevenLabs nao possui permissao para gerar audio.";
  }
  if (response.status === 429) {
    return "O limite temporario do plano gratuito do ElevenLabs foi atingido. Tente novamente mais tarde.";
  }

  return providerMessage || `O ElevenLabs respondeu com HTTP ${response.status}.`;
}

export async function synthesizeSpeech(text: string): Promise<SynthesizedSpeech> {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    throw new SpeechSynthesisError(
      "not-configured",
      "A chave ELEVENLABS_API_KEY nao esta configurada."
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

  const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim() || DEFAULT_TTS_VOICE_ID;
  const timeoutMs = readPositiveInteger(
    process.env.ELEVENLABS_TTS_TIMEOUT_MS,
    DEFAULT_TTS_TIMEOUT_MS
  );

  try {
    const response = await fetchWithTimeout(
      `${ELEVENLABS_SPEECH_URL}/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey
        },
        body: JSON.stringify({
          text: input,
          model_id: process.env.ELEVENLABS_TTS_MODEL?.trim() || DEFAULT_TTS_MODEL,
          language_code: "pt",
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.75,
            style: 0.15,
            use_speaker_boost: true
          }
        })
      },
      timeoutMs
    );

    if (!response.ok) {
      throw new SpeechSynthesisError("generation-failed", await readElevenLabsError(response));
    }

    const bytes = await response.arrayBuffer();
    if (!bytes.byteLength) {
      throw new SpeechSynthesisError(
        "generation-failed",
        "O ElevenLabs retornou um arquivo de audio vazio."
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
