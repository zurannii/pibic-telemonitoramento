import type { IconName, ScreenId } from "./types";

export const navItems: Array<{
  id: Exclude<ScreenId, "patient-create">;
  label: string;
  icon: IconName;
}> = [
  { id: "overview", label: "Visão Geral", icon: "overview" },
  { id: "patients", label: "Pacientes", icon: "patients" },
  { id: "alerts", label: "Alertas", icon: "alerts" },
  { id: "questions", label: "Perguntas", icon: "questions" },
  { id: "reports", label: "Relatórios", icon: "reports" },
  { id: "team", label: "Equipe", icon: "team" }
];

export const overviewStats = [
  { value: "42", label: "Pacientes Ativos", icon: "patients" as const, tone: "soft" },
  { value: "28", label: "Respostas Hoje", icon: "questions" as const, tone: "soft" },
  { value: "5", label: "Sem Resposta", icon: "clock" as const, tone: "soft" },
  { value: "3", label: "Alertas de Piora", icon: "alerts" as const, tone: "dark" },
  { value: "7", label: "Condutas Pendentes", icon: "reports" as const, tone: "mid" }
];

export const recentAlerts = [
  { name: "Paciente A", detail: "Dor intensa relatada (8/10)", time: "Há 1h", tone: "default" },
  { name: "Paciente B", detail: "Sem resposta há 3 dias", time: "Há 2h", tone: "muted" },
  { name: "Paciente C", detail: "Piora no sono", time: "Há 4h", tone: "soft" }
];

export const priorityPatients = [
  { name: "Paciente A, 58 anos", detail: "Última resposta: Há 1h", score: "Dor: 8/10", tone: "default" },
  { name: "Paciente D, 45 anos", detail: "Última resposta: Há 3h", score: "Dor: 6/10", tone: "muted" },
  { name: "Paciente E, 62 anos", detail: "Última resposta: Há 5h", score: "Dor: 7/10", tone: "soft" }
];

export const weeklyOverview = [
  { label: "Seg", value: "64%" },
  { label: "Ter", value: "56%" },
  { label: "Qua", value: "70%" },
  { label: "Qui", value: "60%" },
  { label: "Sex", value: "76%" },
  { label: "Sáb", value: "56%" },
  { label: "Dom", value: "52%" }
];

export const patientRows = [
  ["Paciente A", "55", "Há 6 horas", "8/10", "Alerta", "Dr. Silva"],
  ["Paciente B", "49", "Há 3 dias", "-", "Sem Resposta", "Dra. Santos"],
  ["Paciente C", "62", "Há 2 horas", "4/10", "Estável", "Dr. Silva"],
  ["Paciente D", "71", "Há 12 horas", "7/10", "Atenção", "Dra. Costa"],
  ["Paciente E", "47", "Há 4 dias", "9/10", "Crítico", "Dr. Santos"],
  ["Paciente F", "55", "Há 1h", "3/10", "Estável", "Dra. Simões"]
] as const;

export const alertSummaries = [
  { value: "3", label: "Críticos" },
  { value: "1", label: "Sem Resposta" },
  { value: "2", label: "Alerta Intermediário" },
  { value: "4", label: "Pendentes de ação" }
];

export const alertRecords = [
  {
    title: "Paciente A, 58 anos",
    description: "Dor intensa e piora no sono",
    badges: ["Dor 8/10", "Sem Resposta"],
    meta: "Última resposta há 1h • Responsável: Dr. Silva"
  },
  {
    title: "Paciente B, 45 anos",
    description: "Sem resposta há mais de 24h.",
    badges: ["Sem Resposta", "Atribuído"],
    meta: "Última resposta há 2 dias • Responsável: Dra. Santos"
  },
  {
    title: "Paciente C, 62 anos",
    description: "Paciente relatou dor intensa e piora do sono.",
    badges: ["Dor 7/10", "Ação Pendente"],
    meta: "Última resposta há 4h • Responsável: Dr. Costa"
  },
  {
    title: "Paciente D, 47 anos",
    description: "Atividade foi reduzida e houve menos respostas.",
    badges: ["Intermediário", "Em Observação"],
    meta: "Última resposta há 7h • Responsável: Fisioterapeuta Ana"
  }
];

export const reportCards = [
  {
    title: "Relatório Geral",
    description: "Visão completa do bloco de pacientes."
  },
  {
    title: "Relatório por Profissional",
    description: "Acompanhamento por equipe responsável."
  },
  {
    title: "Relatório de Atividade",
    description: "Total de respostas e engajamento."
  }
];

export const reportStatus = [
  { label: "Estável", total: "28", value: "78%" },
  { label: "Atenção", total: "10", value: "42%" },
  { label: "Crítico", total: "3", value: "20%" },
  { label: "Sem Resposta", total: "1", value: "12%" }
];

export const reportWeekly = [
  { label: "Sem 1", value: "64%" },
  { label: "Sem 2", value: "72%" },
  { label: "Sem 3", value: "68%" },
  { label: "Sem 4", value: "74%" },
  { label: "Sem 5", value: "58%" }
];

export const teamRows = [
  ["Dr. Silva", "Medicina da Dor", "Coordenador", "42", "Ativo"],
  ["Dra. Santos", "Fisioterapia", "Profissional", "12", "Ativo"],
  ["Dra. Costa", "Fisioterapia", "Profissional", "11", "Ativo"],
  ["Psicóloga Maria", "Psicologia Clínica", "Profissional", "10", "Ativo"],
  ["Fisioterapeuta Ana", "Fisioterapia", "Profissional", "10", "Ativo"]
] as const;

export const permissions = [
  {
    name: "Dr. Silva",
    role: "Membro da Equipe",
    badges: ["Ver Pacientes", "Editar Profissional", "Gerenciar Equipe"]
  },
  {
    name: "Dra. Santos",
    role: "Profissional",
    badges: ["Visualizar", "Editar", "Adicionar Relatório"]
  },
  {
    name: "Dra. Costa",
    role: "Profissional",
    badges: ["Visualizar", "Editar", "Adicionar Relatório"]
  }
];

export const roles = [
  {
    title: "Coordenador",
    description: "Gerencia equipe, define fluxos e aprova permissões de profissionais."
  },
  {
    title: "Profissional",
    description: "Visualiza pacientes atribuídos, registra condutas e acompanha respostas."
  },
  {
    title: "Visualizador",
    description: "Consulta dados de pacientes e indicadores, sem poder realizar alterações."
  }
];

export const questionSuggestions = [
  {
    title: "Pergunta Sugestiva",
    description: "Você percebe dor ao girar o braço sobre a cabeça?",
    badges: ["Dor no Movimento", "Braço Direito"],
    note: "Justificativa: paciente referiu desconforto ao elevar o membro nas respostas anteriores."
  },
  {
    title: "Pergunta Sugestiva",
    description: "Em quais momentos do dia a dor fica mais intensa?",
    badges: ["Frequência", "Observação"],
    note: "Justificativa: a dor foi relatada em dias consecutivos e com intensidade alta."
  },
  {
    title: "Pergunta Sugestiva",
    description: "Você acordou durante a noite por causa do desconforto?",
    badges: ["Sono", "Impacto Clínico"],
    note: "Justificativa: houve queda de atividade e resposta de sono pior em duas semanas."
  }
];
