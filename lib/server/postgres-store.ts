import type {
  AlertRecord,
  DatabaseShape,
  MessageLogRecord,
  PatientRecord,
  QuestionRecord,
  ScheduleRecord,
  UserRecord
} from "../shared/types";
import { Prisma } from "../../generated/prisma/client";
import { getPrisma } from "./prisma";
import { clone, nowIso } from "./utils";

type DatabaseClient = Prisma.TransactionClient | ReturnType<typeof getPrisma>;
type Identified = { id: string };

function toIso(value: Date | null) {
  return value?.toISOString() ?? null;
}

function toDate(value: string | null) {
  return value ? new Date(value) : null;
}

function changedRecords<T extends Identified>(before: T[], after: T[]) {
  const previous = new Map(before.map((record) => [record.id, JSON.stringify(record)]));
  return after.filter((record) => previous.get(record.id) !== JSON.stringify(record));
}

function removedIds<T extends Identified>(before: T[], after: T[]) {
  const currentIds = new Set(after.map((record) => record.id));
  return before.filter((record) => !currentIds.has(record.id)).map((record) => record.id);
}

export async function readPostgresDatabase(client: DatabaseClient = getPrisma()): Promise<DatabaseShape> {
  const [meta, users, patients, questions, schedules, messages, alerts, whatsapp, telegram] =
    await Promise.all([
      client.appMeta.findUnique({ where: { id: "app" } }),
      client.user.findMany(),
      client.patient.findMany(),
      client.question.findMany(),
      client.schedule.findMany(),
      client.message.findMany(),
      client.alert.findMany(),
      client.whatsAppSettings.findUnique({ where: { id: "default" } }),
      client.telegramSettings.findUnique({ where: { id: "default" } })
    ]);

  const now = nowIso();
  return {
    meta: {
      version: meta?.version ?? 2,
      createdAt: meta?.createdAt.toISOString() ?? now,
      updatedAt: meta?.updatedAt.toISOString() ?? now
    },
    users: users.map(
      (user): UserRecord => ({
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role as UserRecord["role"],
        specialty: user.specialty,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      })
    ),
    patients: patients.map(
      (patient): PatientRecord => ({
        id: patient.id,
        name: patient.name,
        age: patient.age,
        phone: patient.phone,
        condition: patient.condition,
        notes: patient.notes,
        responsibleUserId: patient.responsibleUserId,
        preferredResponseFormat:
          patient.preferredResponseFormat as PatientRecord["preferredResponseFormat"],
        requiresAudioMessages: patient.requiresAudioMessages,
        preferredChannel: patient.preferredChannel as PatientRecord["preferredChannel"],
        contactWindowStart: patient.contactWindowStart,
        contactWindowEnd: patient.contactWindowEnd,
        telegramChatId: patient.telegramChatId,
        telegramUsername: patient.telegramUsername,
        telegramLinkToken: patient.telegramLinkToken,
        telegramLinkedAt: toIso(patient.telegramLinkedAt),
        status: patient.status as PatientRecord["status"],
        createdAt: patient.createdAt.toISOString(),
        updatedAt: patient.updatedAt.toISOString()
      })
    ),
    questions: questions.map(
      (question): QuestionRecord => ({
        id: question.id,
        title: question.title,
        text: question.text,
        simpleText: question.simpleText,
        theme: question.theme,
        responseType: question.responseType as QuestionRecord["responseType"],
        defaultTimes: question.defaultTimes,
        isActive: question.isActive,
        createdByUserId: question.createdByUserId,
        createdAt: question.createdAt.toISOString(),
        updatedAt: question.updatedAt.toISOString()
      })
    ),
    schedules: schedules.map(
      (schedule): ScheduleRecord => ({
        id: schedule.id,
        patientId: schedule.patientId,
        questionId: schedule.questionId,
        label: schedule.label,
        time: schedule.time,
        timezone: schedule.timezone,
        daysOfWeek: schedule.daysOfWeek,
        active: schedule.active,
        lastDispatchKey: schedule.lastDispatchKey,
        createdByUserId: schedule.createdByUserId,
        createdAt: schedule.createdAt.toISOString(),
        updatedAt: schedule.updatedAt.toISOString()
      })
    ),
    messages: messages.map((message): MessageLogRecord => {
      const metadata =
        message.metadata && typeof message.metadata === "object" && !Array.isArray(message.metadata)
          ? (message.metadata as Record<string, unknown>)
          : undefined;

      return {
        id: message.id,
        patientId: message.patientId,
        questionId: message.questionId,
        scheduleId: message.scheduleId,
        channel: message.channel as MessageLogRecord["channel"],
        direction: message.direction as MessageLogRecord["direction"],
        type: message.type as MessageLogRecord["type"],
        body: message.body,
        status: message.status as MessageLogRecord["status"],
        providerMessageId: message.providerMessageId,
        whatsappMessageId: message.whatsappMessageId,
        telegramMessageId: message.telegramMessageId,
        sentAt: toIso(message.sentAt),
        receivedAt: toIso(message.receivedAt),
        replyToMessageId: message.replyToMessageId,
        errorMessage: message.errorMessage,
        ...(metadata ? { metadata } : {})
      };
    }),
    alerts: alerts.map(
      (alert): AlertRecord => ({
        id: alert.id,
        patientId: alert.patientId,
        level: alert.level as AlertRecord["level"],
        title: alert.title,
        description: alert.description,
        type: alert.type as AlertRecord["type"],
        status: alert.status as AlertRecord["status"],
        createdAt: alert.createdAt.toISOString(),
        resolvedAt: toIso(alert.resolvedAt),
        assignedToUserId: alert.assignedToUserId,
        sourceMessageId: alert.sourceMessageId
      })
    ),
    whatsapp: {
      enabled: whatsapp?.enabled ?? false,
      accessToken: whatsapp?.accessToken ?? "",
      phoneNumberId: whatsapp?.phoneNumberId ?? "",
      businessAccountId: whatsapp?.businessAccountId ?? "",
      verifyToken: whatsapp?.verifyToken ?? "",
      appSecret: whatsapp?.appSecret ?? "",
      apiVersion: whatsapp?.apiVersion ?? "v23.0",
      updatedAt: toIso(whatsapp?.updatedAt ?? null)
    },
    telegram: {
      enabled: telegram?.enabled ?? false,
      botToken: telegram?.botToken ?? "",
      botUsername: telegram?.botUsername ?? "",
      webhookSecret: telegram?.webhookSecret ?? "",
      updatedAt: toIso(telegram?.updatedAt ?? null)
    }
  };
}

async function syncPostgresDatabase(
  client: Prisma.TransactionClient,
  before: DatabaseShape,
  after: DatabaseShape
) {
  const removedAlertIds = removedIds(before.alerts, after.alerts);
  const removedMessageIds = removedIds(before.messages, after.messages);
  const removedScheduleIds = removedIds(before.schedules, after.schedules);
  const removedPatientIds = removedIds(before.patients, after.patients);
  const removedQuestionIds = removedIds(before.questions, after.questions);
  const removedUserIds = removedIds(before.users, after.users);

  if (removedAlertIds.length) await client.alert.deleteMany({ where: { id: { in: removedAlertIds } } });
  if (removedMessageIds.length) await client.message.deleteMany({ where: { id: { in: removedMessageIds } } });
  if (removedScheduleIds.length) await client.schedule.deleteMany({ where: { id: { in: removedScheduleIds } } });
  if (removedPatientIds.length) await client.patient.deleteMany({ where: { id: { in: removedPatientIds } } });
  if (removedQuestionIds.length) await client.question.deleteMany({ where: { id: { in: removedQuestionIds } } });
  if (removedUserIds.length) await client.user.deleteMany({ where: { id: { in: removedUserIds } } });

  for (const user of changedRecords(before.users, after.users)) {
    const data = {
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      specialty: user.specialty,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt)
    };
    await client.user.upsert({ where: { id: user.id }, create: { id: user.id, ...data }, update: data });
  }

  for (const patient of changedRecords(before.patients, after.patients)) {
    const data = {
      name: patient.name,
      age: patient.age,
      phone: patient.phone,
      condition: patient.condition,
      notes: patient.notes,
      responsibleUserId: patient.responsibleUserId,
      preferredResponseFormat: patient.preferredResponseFormat,
      requiresAudioMessages: patient.requiresAudioMessages,
      preferredChannel: patient.preferredChannel,
      contactWindowStart: patient.contactWindowStart,
      contactWindowEnd: patient.contactWindowEnd,
      telegramChatId: patient.telegramChatId,
      telegramUsername: patient.telegramUsername,
      telegramLinkToken: patient.telegramLinkToken,
      telegramLinkedAt: toDate(patient.telegramLinkedAt),
      status: patient.status,
      createdAt: new Date(patient.createdAt),
      updatedAt: new Date(patient.updatedAt)
    };
    await client.patient.upsert({
      where: { id: patient.id },
      create: { id: patient.id, ...data },
      update: data
    });
  }

  for (const question of changedRecords(before.questions, after.questions)) {
    const data = {
      title: question.title,
      text: question.text,
      simpleText: question.simpleText,
      theme: question.theme,
      responseType: question.responseType,
      defaultTimes: question.defaultTimes,
      isActive: question.isActive,
      createdByUserId: question.createdByUserId,
      createdAt: new Date(question.createdAt),
      updatedAt: new Date(question.updatedAt)
    };
    await client.question.upsert({
      where: { id: question.id },
      create: { id: question.id, ...data },
      update: data
    });
  }

  for (const schedule of changedRecords(before.schedules, after.schedules)) {
    const data = {
      patientId: schedule.patientId,
      questionId: schedule.questionId,
      label: schedule.label,
      time: schedule.time,
      timezone: schedule.timezone,
      daysOfWeek: schedule.daysOfWeek,
      active: schedule.active,
      lastDispatchKey: schedule.lastDispatchKey,
      createdByUserId: schedule.createdByUserId,
      createdAt: new Date(schedule.createdAt),
      updatedAt: new Date(schedule.updatedAt)
    };
    await client.schedule.upsert({
      where: { id: schedule.id },
      create: { id: schedule.id, ...data },
      update: data
    });
  }

  for (const message of changedRecords(before.messages, after.messages)) {
    const data = {
      patientId: message.patientId,
      questionId: message.questionId,
      scheduleId: message.scheduleId,
      channel: message.channel,
      direction: message.direction,
      type: message.type,
      body: message.body,
      status: message.status,
      providerMessageId: message.providerMessageId,
      whatsappMessageId: message.whatsappMessageId,
      telegramMessageId: message.telegramMessageId,
      sentAt: toDate(message.sentAt),
      receivedAt: toDate(message.receivedAt),
      replyToMessageId: message.replyToMessageId,
      errorMessage: message.errorMessage,
      metadata: message.metadata
        ? (message.metadata as Prisma.InputJsonValue)
        : Prisma.DbNull
    };
    await client.message.upsert({
      where: { id: message.id },
      create: { id: message.id, ...data },
      update: data
    });
  }

  for (const alert of changedRecords(before.alerts, after.alerts)) {
    const data = {
      patientId: alert.patientId,
      level: alert.level,
      title: alert.title,
      description: alert.description,
      type: alert.type,
      status: alert.status,
      createdAt: new Date(alert.createdAt),
      resolvedAt: toDate(alert.resolvedAt),
      assignedToUserId: alert.assignedToUserId,
      sourceMessageId: alert.sourceMessageId
    };
    await client.alert.upsert({
      where: { id: alert.id },
      create: { id: alert.id, ...data },
      update: data
    });
  }

  await client.appMeta.upsert({
    where: { id: "app" },
    create: {
      id: "app",
      version: after.meta.version,
      createdAt: new Date(after.meta.createdAt),
      updatedAt: new Date(after.meta.updatedAt)
    },
    update: {
      version: after.meta.version,
      updatedAt: new Date(after.meta.updatedAt)
    }
  });

  await client.whatsAppSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...after.whatsapp, updatedAt: toDate(after.whatsapp.updatedAt) },
    update: { ...after.whatsapp, updatedAt: toDate(after.whatsapp.updatedAt) }
  });

  await client.telegramSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...after.telegram, updatedAt: toDate(after.telegram.updatedAt) },
    update: { ...after.telegram, updatedAt: toDate(after.telegram.updatedAt) }
  });
}

async function withLockedTransaction<T>(
  operation: (client: Prisma.TransactionClient) => Promise<T>
) {
  return getPrisma().$transaction(
    async (client) => {
      await client.$executeRaw`SELECT pg_advisory_xact_lock(7465366)`;
      return operation(client);
    },
    { maxWait: 10_000, timeout: 30_000 }
  );
}

export async function updatePostgresDatabase<T>(
  updater: (database: DatabaseShape) => Promise<T> | T
) {
  return withLockedTransaction(async (client) => {
    const before = await readPostgresDatabase(client);
    const workingCopy = clone(before);
    workingCopy.meta.updatedAt = nowIso();
    const result = await updater(workingCopy);
    await syncPostgresDatabase(client, before, workingCopy);
    return result;
  });
}

export async function writePostgresDatabase(database: DatabaseShape) {
  await withLockedTransaction(async (client) => {
    const before = await readPostgresDatabase(client);
    await syncPostgresDatabase(client, before, database);
  });
}
