export type UserRole = "admin" | "professional" | "viewer";

export type AlertLevel = "low" | "medium" | "high";
export type AlertStatus = "active" | "resolved";
export type PatientStatus = "stable" | "attention" | "critical";
export type ResponseFormat = "text" | "buttons" | "audio";
export type QuestionResponseType = "yes-no" | "scale" | "multiple-choice" | "text" | "audio";
export type MessageDirection = "outbound" | "inbound";
export type MessagingChannel = "whatsapp" | "telegram";
export type MessageStatus =
  | "scheduled"
  | "sent"
  | "delivered"
  | "read"
  | "received"
  | "answered"
  | "failed";

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  specialty: string;
  createdAt: string;
  updatedAt: string;
};

export type PatientRecord = {
  id: string;
  name: string;
  age: number;
  phone: string;
  condition: string;
  notes: string;
  responsibleUserId: string | null;
  preferredResponseFormat: ResponseFormat;
  preferredChannel: MessagingChannel;
  contactWindowStart: string;
  contactWindowEnd: string;
  telegramChatId: string | null;
  telegramUsername: string | null;
  telegramLinkToken: string;
  telegramLinkedAt: string | null;
  status: PatientStatus;
  createdAt: string;
  updatedAt: string;
};

export type QuestionRecord = {
  id: string;
  title: string;
  text: string;
  simpleText: string;
  theme: string;
  responseType: QuestionResponseType;
  defaultTimes: string[];
  isActive: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type ScheduleRecord = {
  id: string;
  patientId: string;
  questionId: string;
  label: string;
  time: string;
  timezone: string;
  daysOfWeek: number[];
  active: boolean;
  lastDispatchKey: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type MessageLogRecord = {
  id: string;
  patientId: string;
  questionId: string | null;
  scheduleId: string | null;
  channel: MessagingChannel;
  direction: MessageDirection;
  type: "text" | "audio";
  body: string;
  status: MessageStatus;
  providerMessageId: string | null;
  whatsappMessageId: string | null;
  telegramMessageId: string | null;
  sentAt: string | null;
  receivedAt: string | null;
  replyToMessageId: string | null;
  errorMessage: string | null;
  metadata?: Record<string, unknown>;
};

export type AlertRecord = {
  id: string;
  patientId: string;
  level: AlertLevel;
  title: string;
  description: string;
  type: "no-response" | "delivery" | "manual";
  status: AlertStatus;
  createdAt: string;
  resolvedAt: string | null;
  assignedToUserId: string | null;
  sourceMessageId: string | null;
};

export type WhatsAppSettings = {
  enabled: boolean;
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  verifyToken: string;
  appSecret: string;
  apiVersion: string;
  updatedAt: string | null;
};

export type TelegramSettings = {
  enabled: boolean;
  botToken: string;
  botUsername: string;
  webhookSecret: string;
  updatedAt: string | null;
};

export type AppMeta = {
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type DatabaseShape = {
  meta: AppMeta;
  users: UserRecord[];
  patients: PatientRecord[];
  questions: QuestionRecord[];
  schedules: ScheduleRecord[];
  messages: MessageLogRecord[];
  alerts: AlertRecord[];
  whatsapp: WhatsAppSettings;
  telegram: TelegramSettings;
};

export type PublicUser = Omit<UserRecord, "passwordHash">;

export type DashboardSummary = {
  totalPatients: number;
  responsesToday: number;
  noResponseAlerts: number;
  activeAlerts: number;
  scheduledMessages: number;
  recentAlerts: Array<{
    id: string;
    patientId: string;
    patientName: string;
    title: string;
    level: AlertLevel;
    createdAt: string;
  }>;
  priorityPatients: Array<{
    id: string;
    name: string;
    status: PatientStatus;
    lastMessageAt: string | null;
    responsibleName: string | null;
  }>;
};

export type BootstrapPayload = {
  currentUser: PublicUser;
  dashboard: DashboardSummary;
  patients: PatientListItem[];
  alerts: AlertListItem[];
  questions: QuestionRecord[];
  users: PublicUser[];
  whatsapp: {
    enabled: boolean;
    phoneNumberIdConfigured: boolean;
    verifyTokenConfigured: boolean;
    updatedAt: string | null;
  };
  telegram: {
    enabled: boolean;
    botUsername: string | null;
    botTokenConfigured: boolean;
    webhookSecretConfigured: boolean;
    updatedAt: string | null;
  };
};

export type PatientListItem = {
  id: string;
  name: string;
  age: number;
  phone: string;
  condition: string;
  status: PatientStatus;
  lastResponseAt: string | null;
  responsibleName: string | null;
  preferredResponseFormat: ResponseFormat;
  preferredChannel: MessagingChannel;
  telegramLinkedAt: string | null;
};

export type AlertListItem = {
  id: string;
  patientId: string;
  patientName: string;
  title: string;
  description: string;
  level: AlertLevel;
  status: AlertStatus;
  createdAt: string;
  assignedToName: string | null;
};

export type PatientDetails = {
  patient: PatientRecord;
  responsibleUser: PublicUser | null;
  schedules: Array<ScheduleRecord & { question: QuestionRecord | null }>;
  messages: MessageLogRecord[];
  alerts: AlertListItem[];
};
