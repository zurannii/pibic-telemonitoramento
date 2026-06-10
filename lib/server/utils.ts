import crypto from "node:crypto";

export function nowIso() {
  return new Date().toISOString();
}

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export function maskSecret(value: string) {
  if (!value) {
    return "";
  }

  if (value.length <= 6) {
    return "*".repeat(value.length);
  }

  return `${value.slice(0, 3)}${"*".repeat(Math.max(0, value.length - 6))}${value.slice(-3)}`;
}

export function parseCommaTimes(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => /^\d{2}:\d{2}$/.test(item));
}

export function formatBrazilDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6
};

export function getLocalScheduleSnapshot(date: Date, timezone: string) {
  const timeFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short"
  });

  return {
    time: timeFormatter.format(date),
    dateKey: dateFormatter.format(date),
    weekday: WEEKDAY_MAP[weekdayFormatter.format(date)] ?? 0
  };
}
