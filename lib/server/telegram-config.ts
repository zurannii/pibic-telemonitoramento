import type { TelegramSettings } from "../shared/types";

function readEnvValue(name: string) {
  return process.env[name]?.trim() ?? "";
}

function readEnvBoolean(name: string) {
  const value = readEnvValue(name).toLowerCase();
  return value === "true" || value === "1" || value === "yes" || value === "on";
}

export function getTelegramEnvDefaults() {
  return {
    enabled: readEnvBoolean("TELEGRAM_ENABLED"),
    botToken: readEnvValue("TELEGRAM_BOT_TOKEN"),
    botUsername: readEnvValue("TELEGRAM_BOT_USERNAME"),
    webhookSecret: readEnvValue("TELEGRAM_WEBHOOK_SECRET")
  };
}

export function resolveTelegramSettings(settings: TelegramSettings): TelegramSettings {
  const env = getTelegramEnvDefaults();

  return {
    ...settings,
    enabled: settings.enabled || env.enabled,
    botToken: env.botToken || settings.botToken,
    botUsername: env.botUsername || settings.botUsername,
    webhookSecret: env.webhookSecret || settings.webhookSecret
  };
}
