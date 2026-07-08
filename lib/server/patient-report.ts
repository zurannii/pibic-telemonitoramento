import type {
  DatabaseShape,
  MessageLogRecord,
  PatientReport,
  PatientReportTimelineItem,
  PatientStatus
} from "../shared/types";
import { nowIso } from "./utils";

const WORSENING_PATTERN = /\bpior(?:a|ou)?\b|\bforte\b|\bintens[ao]\b|\baument(?:ou|ando|o)\b/gi;
const IMPROVEMENT_PATTERN = /\bmelhor(?:a|ou)?\b|\balivi(?:ou|o)\b|\breduzi(?:u|do)\b/gi;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(value));
}

function statusLabel(status: PatientStatus) {
  if (status === "critical") return "crítico";
  if (status === "attention") return "em atenção";
  return "estável";
}

function normalizeResponse(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function isReportableResponse(message: MessageLogRecord) {
  const body = message.body.trim();
  return !/^\[(?:Telegram iniciado|Mensagem recebida|Audio recebido)/i.test(body);
}

function responseExcerpt(value: string, maximumLength = 280) {
  const normalized = normalizeResponse(value);
  return normalized.length <= maximumLength
    ? normalized
    : `${normalized.slice(0, maximumLength - 3).trimEnd()}...`;
}

function inferTheme(configuredTheme: string | undefined, response: string) {
  if (configuredTheme) return configuredTheme;

  const normalized = response.toLowerCase();
  if (/\bdor\b|\bdolor/.test(normalized)) return "Dor";
  if (/\bsono\b|\bdorm|\bacordei/.test(normalized)) return "Sono";
  if (/\bmedica|\bremedio|\bremédio/.test(normalized)) return "Medicação";
  if (/\bcaminh|\bexerc|\batividade/.test(normalized)) return "Atividade física";
  if (/\bhumor\b|\bansios|\btrist|\bfeliz/.test(normalized)) return "Humor";
  return "Relato geral";
}

function countMatches(value: string, pattern: RegExp) {
  return value.match(pattern)?.length ?? 0;
}

function extractPainLevel(message: MessageLogRecord, theme: string, question: string) {
  const searchable = `${theme} ${question} ${message.body}`.toLowerCase();
  const hasPainContext = /\bdor\b|\bdolor/.test(searchable);
  const scoreMatch = message.body.match(/\b(10|[0-9])\s*(?:\/|de)\s*10\b/i);
  const degreeMatch = message.body.match(
    /\b(?:grau|nivel|nível|nota|intensidade)\s*(?:de\s*)?(10|[0-9])\b/i
  );
  const barePainScore = hasPainContext
    ? message.body.match(/^\s*(10|[0-9])(?:\s*[-.,]|\s*$)/)
    : null;

  if (!hasPainContext && !scoreMatch) return null;

  const rawLevel = scoreMatch?.[1] ?? degreeMatch?.[1] ?? barePainScore?.[1];
  if (!rawLevel) return null;

  const level = Number(rawLevel);
  return Number.isInteger(level) && level >= 0 && level <= 10 ? level : null;
}

function buildTimeline(db: DatabaseShape, patientId: string): PatientReportTimelineItem[] {
  const questions = new Map(db.questions.map((question) => [question.id, question]));

  return db.messages
    .filter(
      (message) =>
        message.patientId === patientId &&
        message.direction === "inbound" &&
        Boolean(message.receivedAt) &&
        isReportableResponse(message)
    )
    .sort((first, second) => (first.receivedAt ?? "").localeCompare(second.receivedAt ?? ""))
    .map((message) => {
      const question = message.questionId ? questions.get(message.questionId) : null;
      const response = normalizeResponse(message.body);
      return {
        id: message.id,
        reportedAt: message.receivedAt ?? nowIso(),
        channel: message.channel,
        type: message.type,
        question: question?.simpleText || question?.text || "Relato espontâneo",
        theme: inferTheme(question?.theme, response),
        response
      };
    });
}

function buildNarrative(
  patientName: string,
  timeline: PatientReportTimelineItem[],
  painHistory: PatientReport["painHistory"],
  themes: PatientReport["themes"]
) {
  if (!timeline.length) {
    return `${patientName} ainda não possui respostas registradas para consolidação.`;
  }

  const start = formatDate(timeline[0].reportedAt);
  const end = formatDate(timeline[timeline.length - 1].reportedAt);
  const introduction = `${patientName} enviou ${timeline.length} resposta(s) entre ${start} e ${end}.`;
  const painSummary = painHistory.length
    ? ` Foram identificados ${painHistory.length} relato(s) com intensidade de dor mensurável, variando de ${Math.min(...painHistory.map((item) => item.level))}/10 a ${Math.max(...painHistory.map((item) => item.level))}/10.`
    : " Não houve intensidade de dor expressa em escala numérica nas respostas.";
  const themeSummary = themes.length
    ? ` Os temas mais frequentes foram ${themes
        .slice(0, 3)
        .map((theme) => `${theme.name} (${theme.count})`)
        .join(", ")}.`
    : "";
  const chronologicalNarrative = timeline
    .map(
      (item) =>
        `Em ${formatDate(item.reportedAt)}, ao responder sobre ${item.theme.toLowerCase()}, relatou: "${responseExcerpt(item.response)}".`
    )
    .join(" ");

  return `${introduction}${painSummary}${themeSummary} ${chronologicalNarrative}`;
}

export function buildPatientReport(db: DatabaseShape, patientId: string): PatientReport | null {
  const patient = db.patients.find((item) => item.id === patientId);
  if (!patient) return null;

  const responsible = db.users.find((user) => user.id === patient.responsibleUserId) ?? null;
  const timeline = buildTimeline(db, patientId);
  const themeCounts = new Map<string, number>();
  for (const item of timeline) {
    themeCounts.set(item.theme, (themeCounts.get(item.theme) ?? 0) + 1);
  }
  const themes = [...themeCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((first, second) => second.count - first.count || first.name.localeCompare(second.name));

  const patientMessages = db.messages.filter(
    (message) =>
      message.patientId === patientId &&
      message.direction === "inbound" &&
      isReportableResponse(message)
  );
  const timelineById = new Map(timeline.map((item) => [item.id, item]));
  const painHistory = patientMessages.flatMap((message) => {
    const timelineItem = timelineById.get(message.id);
    if (!timelineItem) return [];

    const level = extractPainLevel(message, timelineItem.theme, timelineItem.question);
    return level === null
      ? []
      : [{ reportedAt: timelineItem.reportedAt, level, response: timelineItem.response }];
  });

  const painLevels = painHistory.map((item) => item.level);
  const averagePain = painLevels.length
    ? Math.round((painLevels.reduce((total, level) => total + level, 0) / painLevels.length) * 10) / 10
    : null;
  const maximumPain = painLevels.length ? Math.max(...painLevels) : null;
  const allResponses = timeline.map((item) => item.response).join(" ");
  const worseningMentions = countMatches(allResponses, WORSENING_PATTERN);
  const improvementMentions = countMatches(allResponses, IMPROVEMENT_PATTERN);
  const activeAlerts = db.alerts.filter(
    (alert) => alert.patientId === patientId && alert.status === "active"
  );

  const analysis: string[] = [
    `O quadro operacional atual está classificado como ${statusLabel(patient.status)} e possui ${activeAlerts.length} alerta(s) ativo(s).`
  ];

  if (averagePain !== null && maximumPain !== null) {
    analysis.push(
      `A intensidade média de dor registrada foi ${averagePain}/10, com maior valor de ${maximumPain}/10.`
    );

    if (painHistory.length >= 2) {
      const firstLevel = painHistory[0].level;
      const lastLevel = painHistory[painHistory.length - 1].level;
      const trend = lastLevel > firstLevel ? "aumento" : lastLevel < firstLevel ? "redução" : "estabilidade";
      analysis.push(
        `A comparação entre o primeiro e o último registro numérico sugere ${trend} da intensidade relatada (${firstLevel}/10 para ${lastLevel}/10).`
      );
    }

    if (maximumPain >= 8) {
      analysis.push(
        "Há pelo menos um relato de dor em intensidade alta (8/10 ou superior), que merece revisão da equipe responsável."
      );
    }
  } else {
    analysis.push("As respostas ainda não permitem calcular uma evolução numérica da dor.");
  }

  if (worseningMentions || improvementMentions) {
    analysis.push(
      `Foram encontradas ${worseningMentions} menção(ões) associada(s) a piora e ${improvementMentions} associada(s) a melhora.`
    );
  }

  if (activeAlerts.length) {
    analysis.push(
      `Alertas em aberto: ${activeAlerts.map((alert) => alert.title).join("; ")}.`
    );
  }

  return {
    generatedAt: nowIso(),
    patient: {
      id: patient.id,
      name: patient.name,
      age: patient.age,
      condition: patient.condition,
      responsibleName: responsible?.name ?? null,
      status: patient.status
    },
    period: {
      start: timeline[0]?.reportedAt ?? null,
      end: timeline[timeline.length - 1]?.reportedAt ?? null
    },
    metrics: {
      responseCount: timeline.length,
      audioResponseCount: timeline.filter((item) => item.type === "audio").length,
      averagePain,
      maximumPain,
      worseningMentions,
      activeAlertCount: activeAlerts.length
    },
    narrative: buildNarrative(patient.name, timeline, painHistory, themes),
    analysis,
    themes,
    painHistory,
    timeline,
    reviewNotice:
      "Síntese automática baseada exclusivamente nas respostas registradas. Deve ser revisada e interpretada por profissional de saúde qualificado e não constitui diagnóstico."
  };
}
