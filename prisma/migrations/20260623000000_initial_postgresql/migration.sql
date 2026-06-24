CREATE TABLE "AppMeta" (
    "id" TEXT NOT NULL DEFAULT 'app',
    "version" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppMeta_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "responsibleUserId" TEXT,
    "preferredResponseFormat" TEXT NOT NULL,
    "preferredChannel" TEXT NOT NULL,
    "contactWindowStart" TEXT NOT NULL,
    "contactWindowEnd" TEXT NOT NULL,
    "telegramChatId" TEXT,
    "telegramUsername" TEXT,
    "telegramLinkToken" TEXT NOT NULL,
    "telegramLinkedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "simpleText" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "responseType" TEXT NOT NULL,
    "defaultTimes" TEXT[] NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "daysOfWeek" INTEGER[] NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastDispatchKey" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "questionId" TEXT,
    "scheduleId" TEXT,
    "channel" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "whatsappMessageId" TEXT,
    "telegramMessageId" TEXT,
    "sentAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "replyToMessageId" TEXT,
    "errorMessage" TEXT,
    "metadata" JSONB,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "assignedToUserId" TEXT,
    "sourceMessageId" TEXT,
    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WhatsAppSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "accessToken" TEXT NOT NULL DEFAULT '',
    "phoneNumberId" TEXT NOT NULL DEFAULT '',
    "businessAccountId" TEXT NOT NULL DEFAULT '',
    "verifyToken" TEXT NOT NULL DEFAULT '',
    "appSecret" TEXT NOT NULL DEFAULT '',
    "apiVersion" TEXT NOT NULL DEFAULT 'v23.0',
    "updatedAt" TIMESTAMP(3),
    CONSTRAINT "WhatsAppSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TelegramSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "botToken" TEXT NOT NULL DEFAULT '',
    "botUsername" TEXT NOT NULL DEFAULT '',
    "webhookSecret" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3),
    CONSTRAINT "TelegramSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Patient_telegramChatId_key" ON "Patient"("telegramChatId");
CREATE UNIQUE INDEX "Patient_telegramLinkToken_key" ON "Patient"("telegramLinkToken");
CREATE INDEX "Patient_phone_idx" ON "Patient"("phone");
CREATE INDEX "Patient_responsibleUserId_idx" ON "Patient"("responsibleUserId");
CREATE INDEX "Patient_status_idx" ON "Patient"("status");
CREATE INDEX "Question_isActive_idx" ON "Question"("isActive");
CREATE INDEX "Question_createdByUserId_idx" ON "Question"("createdByUserId");
CREATE INDEX "Schedule_patientId_idx" ON "Schedule"("patientId");
CREATE INDEX "Schedule_questionId_idx" ON "Schedule"("questionId");
CREATE INDEX "Schedule_active_idx" ON "Schedule"("active");
CREATE UNIQUE INDEX "Message_channel_providerMessageId_key" ON "Message"("channel", "providerMessageId");
CREATE INDEX "Message_patientId_direction_idx" ON "Message"("patientId", "direction");
CREATE INDEX "Message_status_idx" ON "Message"("status");
CREATE INDEX "Message_sentAt_idx" ON "Message"("sentAt");
CREATE INDEX "Message_receivedAt_idx" ON "Message"("receivedAt");
CREATE INDEX "Alert_patientId_status_idx" ON "Alert"("patientId", "status");
CREATE INDEX "Alert_assignedToUserId_idx" ON "Alert"("assignedToUserId");
CREATE INDEX "Alert_sourceMessageId_idx" ON "Alert"("sourceMessageId");

ALTER TABLE "Patient" ADD CONSTRAINT "Patient_responsibleUserId_fkey"
    FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_scheduleId_fkey"
    FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
