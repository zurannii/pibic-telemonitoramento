import type { TelegramSettings } from "../shared/types";

function readEnvValue(name: string) {
  return process.env[name]?.trim() ?? "";
}

function readEnvBoolean(name: string) {
  const value = readEnvValue(name).toLowerCase();
  return value === "true" || value === "1" || value === "yes" || value === "on";
}

function normalizePublicUrl(value: string) {
  const normalized = value.trim().replace(/\/$/, "");
  if (!normalized) return "";
  return /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
}

export function resolvePublicAppUrl(request: Request) {
  const configuredUrl = normalizePublicUrl(readEnvValue("APP_URL"));
  if (configuredUrl) return configuredUrl;

  const productionUrl = normalizePublicUrl(readEnvValue("VERCEL_PROJECT_PRODUCTION_URL"));
  if (productionUrl) return productionUrl;

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (forwardedHost) {
    const forwardedProtocol =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
    return `${forwardedProtocol}://${forwardedHost}`;
  }

  return new URL(request.url).origin;
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
