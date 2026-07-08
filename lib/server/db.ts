import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import type {
  AlertListItem,
  AlertRecord,
  BootstrapPayload,
  DashboardSummary,
  DatabaseShape,
  MessageLogRecord,
  PatientDetails,
  PatientListItem,
  PatientRecord,
  PublicUser,
  QuestionRecord,
  ScheduleRecord,
  TelegramSettings,
  UserRecord
} from "../shared/types";
import { toPublicUser } from "./public";
import { hasPostgresDatabase } from "./prisma";
import {
  readPostgresDatabase,
  updatePostgresDatabase,
  writePostgresDatabase
} from "./postgres-store";
import { resolveTelegramSettings } from "./telegram-config";
import { clone, createId, nowIso, normalizePhone } from "./utils";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "app-db.json");
const IS_VERCEL = process.env.VERCEL === "1";
const RUNTIME_DB_DIR = IS_VERCEL ? "/tmp" : DB_DIR;
const RUNTIME_DB_PATH = IS_VERCEL ? "/tmp/app-db.json" : DB_PATH;

let dbCache: DatabaseShape | null = null;
let writeQueue: Promise<unknown> = Promise.resolve();

function createTelegramLinkToken() {
  return createId("tglink");
}

function readOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeTelegramSettings(value: unknown): TelegramSettings {
  const source = typeof value === "object" && value ? (value as Partial<TelegramSettings>) : {};
  return {
    enabled: source.enabled === true,
    botToken: typeof source.botToken === "string" ? source.botToken : "",
    botUsername: typeof source.botUsername === "string" ? source.botUsername : "",
    webhookSecret: typeof source.webhookSecret === "string" ? source.webhookSecret : "",
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : null
  };
}

function normalizeDbShape(value: DatabaseShape): DatabaseShape {
  const now = nowIso();
  const meta = typeof value.meta === "object" && value.meta ? value.meta : { version: 1, createdAt: now, updatedAt: now };

  return {
    ...value,
    meta: {
      ...meta,
      version: Math.max(2, Number(meta.version) || 1)
    },
    patients: Array.isArray(value.patients)
      ? value.patients.map((patient) => ({
          ...patient,
          preferredChannel: patient.preferredChannel === "telegram" ? "telegram" : "whatsapp",
          requiresAudioMessages: patient.requiresAudioMessages === true,
          telegramChatId: readOptionalString(patient.telegramChatId),
          telegramUsername: readOptionalString(patient.telegramUsername),
          telegramLinkToken: readOptionalString(patient.telegramLinkToken) ?? createTelegramLinkToken(),
          telegramLinkedAt:
            readOptionalString(patient.telegramLinkedAt) ??
            (readOptionalString(patient.telegramChatId) ? readOptionalString(patient.updatedAt) ?? now : null)
        }))
      : [],
    messages: Array.isArray(value.messages)
      ? value.messages.map((message) => {
          const inferredChannel =
            message.channel === "telegram" || message.telegramMessageId ? "telegram" : "whatsapp";
          const providerMessageId =
            readOptionalString(message.providerMessageId) ??
            readOptionalString(
              inferredChannel === "telegram" ? message.telegramMessageId : message.whatsappMessageId
            );

          return {
            ...message,
            channel: inferredChannel,
            providerMessageId,
            whatsappMessageId:
              inferredChannel === "whatsapp"
                ? readOptionalString(message.whatsappMessageId) ?? providerMessageId
                : readOptionalString(message.whatsappMessageId),
            telegramMessageId:
              inferredChannel === "telegram"
                ? readOptionalString(message.telegramMessageId) ?? providerMessageId
                : readOptionalString(message.telegramMessageId)
          };
        })
      : [],
    whatsapp: {
      enabled: value.whatsapp?.enabled === true,
      accessToken: typeof value.whatsapp?.accessToken === "string" ? value.whatsapp.accessToken : "",
      phoneNumberId: typeof value.whatsapp?.phoneNumberId === "string" ? value.whatsapp.phoneNumberId : "",
      businessAccountId:
        typeof value.whatsapp?.businessAccountId === "string" ? value.whatsapp.businessAccountId : "",
      verifyToken: typeof value.whatsapp?.verifyToken === "string" ? value.whatsapp.verifyToken : "",
      appSecret: typeof value.whatsapp?.appSecret === "string" ? value.whatsapp.appSecret : "",
      apiVersion: typeof value.whatsapp?.apiVersion === "string" ? value.whatsapp.apiVersion : "v23.0",
      updatedAt: typeof value.whatsapp?.updatedAt === "string" ? value.whatsapp.updatedAt : null
    },
    telegram: normalizeTelegramSettings(value.telegram)
  };
}

async function seedPasswordHash(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result as Buffer);
    });
  });

  return `${salt}:${derivedKey.toString("hex")}`;
}

async function buildSeedDatabase() {
  const now = nowIso();
  const adminId = createId("user");
  const professionalId = createId("user");
  const patientAId = createId("patient");
  const patientBId = createId("patient");
  const questionPainId = createId("question");
  const questionSleepId = createId("question");
  const scheduleAId = createId("schedule");
  const scheduleBId = createId("schedule");
  const outboundId = createId("message");
  const inboundId = createId("message");
  const alertId = createId("alert");

  return {
    meta: {
      version: 1,
      createdAt: now,
      updatedAt: now
    },
    users: [
      {
        id: adminId,
        name: "Dr. Silva",
        email: "demo@telemonitor.com",
        passwordHash: await seedPasswordHash("demo123"),
        role: "admin",
        specialty: "Medicina da Dor",
        createdAt: now,
        updatedAt: now
      },
      {
        id: professionalId,
        name: "Dra. Costa",
        email: "fisio@telemonitor.com",
        passwordHash: await seedPasswordHash("demo123"),
        role: "professional",
        specialty: "Fisioterapia",
        createdAt: now,
        updatedAt: now
      }
    ] satisfies UserRecord[],
    patients: [
      {
        id: patientAId,
        name: "Paciente A",
        age: 58,
        phone: "5511999991111",
        condition: "Dor crônica lombar",
        notes: "Paciente com piora noturna recorrente.",
        responsibleUserId: adminId,
        preferredResponseFormat: "text",
        requiresAudioMessages: false,
        preferredChannel: "whatsapp",
        contactWindowStart: "09:00",
        contactWindowEnd: "21:00",
        telegramChatId: null,
        telegramUsername: null,
        telegramLinkToken: createTelegramLinkToken(),
        telegramLinkedAt: null,
        status: "critical",
        createdAt: now,
        updatedAt: now
      },
      {
        id: patientBId,
        name: "Paciente B",
        age: 47,
        phone: "5511999992222",
        condition: "Pós-operatório de ombro",
        notes: "Boa adesão geral, precisa seguir atividade física.",
        responsibleUserId: professionalId,
        preferredResponseFormat: "buttons",
        requiresAudioMessages: false,
        preferredChannel: "whatsapp",
        contactWindowStart: "08:00",
        contactWindowEnd: "20:00",
        telegramChatId: null,
        telegramUsername: null,
        telegramLinkToken: createTelegramLinkToken(),
        telegramLinkedAt: null,
        status: "attention",
        createdAt: now,
        updatedAt: now
      }
    ] satisfies PatientRecord[],
    questions: [
      {
        id: questionPainId,
        title: "Dor atual",
        text: "Como está sua dor agora, em uma escala de 0 a 10?",
        simpleText: "Me diga sua dor agora de 0 a 10.",
        theme: "Dor",
        responseType: "scale",
        defaultTimes: ["09:00", "21:00"],
        isActive: true,
        createdByUserId: adminId,
        createdAt: now,
        updatedAt: now
      },
      {
        id: questionSleepId,
        title: "Sono",
        text: "Como foi seu sono na última noite?",
        simpleText: "Como você dormiu hoje?",
        theme: "Sono",
        responseType: "text",
        defaultTimes: ["09:00"],
        isActive: true,
        createdByUserId: professionalId,
        createdAt: now,
        updatedAt: now
      }
    ] satisfies QuestionRecord[],
    schedules: [
      {
        id: scheduleAId,
        patientId: patientAId,
        questionId: questionPainId,
        label: "Dor - manhã",
        time: "09:00",
        timezone: "America/Sao_Paulo",
        daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
        active: true,
        lastDispatchKey: null,
        createdByUserId: adminId,
        createdAt: now,
        updatedAt: now
      },
      {
        id: scheduleBId,
        patientId: patientBId,
        questionId: questionSleepId,
        label: "Sono - manhã",
        time: "09:00",
        timezone: "America/Sao_Paulo",
        daysOfWeek: [1, 2, 3, 4, 5],
        active: true,
        lastDispatchKey: null,
        createdByUserId: professionalId,
        createdAt: now,
        updatedAt: now
      }
    ] satisfies ScheduleRecord[],
    messages: [
      {
        id: outboundId,
        patientId: patientAId,
        questionId: questionPainId,
        scheduleId: scheduleAId,
        channel: "whatsapp",
        direction: "outbound",
        type: "text",
        body: "Como está sua dor agora, em uma escala de 0 a 10?",
        status: "answered",
        providerMessageId: "demo-outbound-1",
        whatsappMessageId: "demo-outbound-1",
        telegramMessageId: null,
        sentAt: now,
        receivedAt: null,
        replyToMessageId: null,
        errorMessage: null
      },
      {
        id: inboundId,
        patientId: patientAId,
        questionId: questionPainId,
        scheduleId: scheduleAId,
        channel: "whatsapp",
        direction: "inbound",
        type: "text",
        body: "8/10 - piorou à noite",
        status: "received",
        providerMessageId: "demo-inbound-1",
        whatsappMessageId: "demo-inbound-1",
        telegramMessageId: null,
        sentAt: null,
        receivedAt: now,
        replyToMessageId: outboundId,
        errorMessage: null
      }
    ] satisfies MessageLogRecord[],
    alerts: [
      {
        id: alertId,
        patientId: patientAId,
        level: "high",
        title: "Dor alta relatada",
        description: "Última resposta do paciente indicou dor 8/10.",
        type: "manual",
        status: "active",
        createdAt: now,
        resolvedAt: null,
        assignedToUserId: adminId,
        sourceMessageId: inboundId
      }
    ] satisfies AlertRecord[],
    whatsapp: {
      enabled: false,
      accessToken: "",
      phoneNumberId: "",
      businessAccountId: "",
      verifyToken: "",
      appSecret: "",
      apiVersion: "v23.0",
      updatedAt: null
    },
    telegram: {
      enabled: false,
      botToken: "",
      botUsername: "",
      webhookSecret: "",
      updatedAt: null
    }
  } satisfies DatabaseShape;
}

async function ensureDbExists() {
  await fs.mkdir(RUNTIME_DB_DIR, { recursive: true });

  try {
    await fs.access(RUNTIME_DB_PATH);
  } catch {
    try {
      const snapshot = await fs.readFile(DB_PATH, "utf8");
      await fs.writeFile(RUNTIME_DB_PATH, snapshot, "utf8");
      return;
    } catch {
      const seed = await buildSeedDatabase();
      await fs.writeFile(RUNTIME_DB_PATH, JSON.stringify(seed, null, 2), "utf8");
    }
  }
}

export async function readDb() {
  if (hasPostgresDatabase()) {
    return normalizeDbShape(await readPostgresDatabase());
  }

  if (dbCache) {
    return clone(dbCache);
  }

  await ensureDbExists();
  const contents = await fs.readFile(RUNTIME_DB_PATH, "utf8");
  dbCache = normalizeDbShape(JSON.parse(contents) as DatabaseShape);
  return clone(dbCache);
}

export async function writeDb(nextDb: DatabaseShape) {
  const normalized = normalizeDbShape(nextDb);

  if (hasPostgresDatabase()) {
    await writePostgresDatabase(normalized);
    return;
  }

  dbCache = clone(normalized);
  await fs.writeFile(RUNTIME_DB_PATH, JSON.stringify(normalized, null, 2), "utf8");
}

export async function updateDb<T>(updater: (db: DatabaseShape) => Promise<T> | T) {
  if (hasPostgresDatabase()) {
    return updatePostgresDatabase(updater);
  }

  const job = writeQueue.then(async () => {
    const db = await readDb();
    db.meta.updatedAt = nowIso();
    const result = await updater(db);
    await writeDb(db);
    return result;
  });

  writeQueue = job.then(() => undefined);
  return job;
}

export async function findUserByEmail(email: string) {
  const db = await readDb();
  return db.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function findUserById(userId: string) {
  const db = await readDb();
  return db.users.find((user) => user.id === userId) ?? null;
}

export async function buildPatientList(db?: DatabaseShape): Promise<PatientListItem[]> {
  const source = db ?? (await readDb());

  return source.patients
    .map((patient) => {
      const responsible = source.users.find((user) => user.id === patient.responsibleUserId) ?? null;
      const lastInbound = source.messages
        .filter((message) => message.patientId === patient.id && message.direction === "inbound")
        .sort((a, b) => (b.receivedAt ?? "").localeCompare(a.receivedAt ?? ""))[0];

      return {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        phone: patient.phone,
        condition: patient.condition,
        status: patient.status,
        lastResponseAt: lastInbound?.receivedAt ?? null,
        responsibleName: responsible?.name ?? null,
        preferredResponseFormat: patient.preferredResponseFormat,
        requiresAudioMessages: patient.requiresAudioMessages,
        preferredChannel: patient.preferredChannel,
        telegramLinkedAt: patient.telegramLinkedAt
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function buildAlertList(db?: DatabaseShape): Promise<AlertListItem[]> {
  const source = db ?? (await readDb());

  return source.alerts
    .map((alert) => {
      const patient = source.patients.find((item) => item.id === alert.patientId);
      const assignedTo = source.users.find((item) => item.id === alert.assignedToUserId);

      return {
        id: alert.id,
        patientId: alert.patientId,
        patientName: patient?.name ?? "Paciente removido",
        title: alert.title,
        description: alert.description,
        level: alert.level,
        status: alert.status,
        createdAt: alert.createdAt,
        assignedToName: assignedTo?.name ?? null
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function buildDashboardSummary(db?: DatabaseShape): Promise<DashboardSummary> {
  const source = db ?? (await readDb());
  const todayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());

  const responsesToday = source.messages.filter((message) => {
    if (message.direction !== "inbound" || !message.receivedAt) {
      return false;
    }

    return (
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(new Date(message.receivedAt)) === todayKey
    );
  }).length;

  const recentAlerts = (await buildAlertList(source))
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      patientId: item.patientId,
      patientName: item.patientName,
      title: item.title,
      level: item.level,
      createdAt: item.createdAt
    }));

  const priorityPatients = (await buildPatientList(source))
    .filter((patient) => patient.status !== "stable")
    .slice(0, 4)
    .map((patient) => ({
      id: patient.id,
      name: patient.name,
      status: patient.status,
      lastMessageAt: patient.lastResponseAt,
      responsibleName: patient.responsibleName
    }));

  return {
    totalPatients: source.patients.length,
    responsesToday,
    noResponseAlerts: source.alerts.filter(
      (alert) => alert.status === "active" && alert.type === "no-response"
    ).length,
    activeAlerts: source.alerts.filter((alert) => alert.status === "active").length,
    scheduledMessages: source.schedules.filter((schedule) => schedule.active).length,
    recentAlerts,
    priorityPatients
  };
}

export async function buildPatientDetails(patientId: string, db?: DatabaseShape): Promise<PatientDetails | null> {
  const source = db ?? (await readDb());
  const patient = source.patients.find((item) => item.id === patientId);
  if (!patient) {
    return null;
  }

  return {
    patient,
    responsibleUser: patient.responsibleUserId
      ? (() => {
          const responsible = source.users.find((user) => user.id === patient.responsibleUserId);
          return responsible ? toPublicUser(responsible) : null;
        })()
      : null,
    schedules: source.schedules
      .filter((schedule) => schedule.patientId === patientId)
      .map((schedule) => ({
        ...schedule,
        question: source.questions.find((question) => question.id === schedule.questionId) ?? null
      }))
      .sort((a, b) => a.time.localeCompare(b.time)),
    messages: source.messages
      .filter((message) => message.patientId === patientId)
      .sort((a, b) => {
        const first = a.receivedAt ?? a.sentAt ?? "";
        const second = b.receivedAt ?? b.sentAt ?? "";
        return second.localeCompare(first);
      }),
    alerts: (await buildAlertList(source)).filter((alert) => alert.patientId === patientId)
  };
}

export async function buildBootstrapPayload(currentUser: UserRecord): Promise<BootstrapPayload> {
  const db = await readDb();
  const telegramSettings = resolveTelegramSettings(db.telegram);
  return {
    currentUser: toPublicUser(currentUser),
    dashboard: await buildDashboardSummary(db),
    patients: await buildPatientList(db),
    alerts: await buildAlertList(db),
    questions: db.questions.filter((question) => question.isActive),
    users: db.users.map((user) => toPublicUser(user)),
    whatsapp: {
      enabled: db.whatsapp.enabled,
      phoneNumberIdConfigured: Boolean(db.whatsapp.phoneNumberId),
      verifyTokenConfigured: Boolean(db.whatsapp.verifyToken),
      updatedAt: db.whatsapp.updatedAt
    },
    telegram: {
      enabled: telegramSettings.enabled,
      botUsername: telegramSettings.botUsername || null,
      botTokenConfigured: Boolean(telegramSettings.botToken),
      webhookSecretConfigured: Boolean(telegramSettings.webhookSecret),
      updatedAt: db.telegram.updatedAt
    }
  };
}

export function updatePatientStatusFromAlerts(patient: PatientRecord, alerts: AlertRecord[]) {
  const activeAlerts = alerts.filter((alert) => alert.patientId === patient.id && alert.status === "active");

  if (activeAlerts.some((alert) => alert.level === "high")) {
    patient.status = "critical";
    return;
  }

  if (activeAlerts.some((alert) => alert.level === "medium")) {
    patient.status = "attention";
    return;
  }

  patient.status = "stable";
}

export function matchPatientByPhone(db: DatabaseShape, phone: string) {
  const normalized = normalizePhone(phone);
  return db.patients.find((patient) => normalizePhone(patient.phone) === normalized) ?? null;
}

export function matchPatientByTelegramChatId(db: DatabaseShape, chatId: string) {
  return db.patients.find((patient) => patient.telegramChatId === chatId) ?? null;
}

export function matchPatientByTelegramLinkToken(db: DatabaseShape, token: string) {
  return db.patients.find((patient) => patient.telegramLinkToken === token) ?? null;
}
