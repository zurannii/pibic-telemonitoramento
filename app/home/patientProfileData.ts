import type { PatientProfileTab } from "./types";

export const patientProfileTabs: Array<{ id: PatientProfileTab; label: string }> = [
  { id: "summary", label: "Resumo" },
  { id: "responses", label: "Respostas" },
  { id: "graphs", label: "Gráficos" },
  { id: "plan", label: "Plano de Monitoramento" },
  { id: "team", label: "Equipe" },
  { id: "reports", label: "Relatórios" },
  { id: "conduct", label: "Condutas" }
];

export const patientProfiles = {
  "Paciente A": {
    name: "Paciente A",
    age: "58 anos",
    condition: "Dor crônica",
    status: "Crítico",
    lastResponse: "Há 1h",
    careTeamLabel: "Equipe Responsável",
    careTeam: "Dr. Silva, Dra. Costa",
    summary: {
      weeklyTitle: "Resumo Semanal (06/05 - 13/05)",
      weeklyPoints: [
        "Paciente relatou dor intensa (7-8/10) em 5 dos últimos 7 dias, principalmente no período noturno",
        "Qualidade do sono afetada em 4 dias, com despertares noturnos frequentes",
        "Aderência à medicação: 6 de 7 dias com registro correto",
        "Atividade física reduzida nos últimos 3 dias"
      ],
      identifiedPattern:
        "Piora consistente da dor no período noturno (após 22h) com impacto direto na qualidade do sono. Possível relação com redução de atividade física nos últimos dias.",
      metrics: [
        { value: "7.2/10", label: "Dor Média da Semana", icon: "overview" as const },
        { value: "18", label: "Registros Enviados", icon: "reports" as const },
        { value: "0", label: "Dias Sem Resposta", icon: "clock" as const },
        { value: "22h-02h", label: "Horário de Piora", icon: "alerts" as const }
      ],
      painEvolution: [
        { label: "06/05", value: "6/10", height: 70 },
        { label: "07/05", value: "7/10", height: 78 },
        { label: "08/05", value: "8/10", height: 86 },
        { label: "09/05", value: "7/10", height: 79 },
        { label: "10/05", value: "8/10", height: 86 },
        { label: "11/05", value: "7/10", height: 79 },
        { label: "12/05", value: "8/10", height: 86 }
      ],
      recentResponses: [
        {
          time: "Hoje, 14:30",
          question: "Como está sua dor agora?",
          answer: "8/10 - Forte",
          type: "button"
        },
        {
          time: "Hoje, 09:15",
          question: "Como foi seu sono?",
          answer: "Ruim, acordei várias vezes",
          type: "text"
        },
        {
          time: "Ontem, 21:00",
          question: "Tomou a medicação?",
          answer: "Sim",
          type: "button"
        }
      ],
      alerts: [
        {
          title: "Dor intensa persistente",
          detail: "Dor acima de 7/10 por 5 dias consecutivos",
          level: "Alta"
        },
        {
          title: "Sono afetado",
          detail: "Qualidade do sono comprometida nos últimos 4 dias",
          level: "Média"
        }
      ]
    },
    responses: {
      filters: ["Todos", "Dor", "Sono", "Alimentação", "Humor", "Atividade Física", "Medicação"],
      records: [
        {
          date: "13/05/2026 às 14:30",
          type: "button",
          category: "Dor",
          question: "Como está sua dor agora?",
          answer: "8/10 - Forte"
        },
        {
          date: "13/05/2026 às 09:15",
          type: "text",
          category: "Sono",
          question: "Como foi seu sono?",
          answer: "Não consegui dormir direito, acordei umas 4 vezes com dor nas costas"
        },
        {
          date: "12/05/2026 às 21:00",
          type: "button",
          category: "Medicação",
          question: "Você tomou a medicação hoje?",
          answer: "Sim"
        },
        {
          date: "12/05/2026 às 15:45",
          type: "audio",
          category: "Humor",
          question: "Como você está se sentindo hoje?",
          answer: "[Áudio - 00:42]",
          transcript:
            "\"Hoje estou me sentindo um pouco melhor de manhã, mas à tarde a dor voltou com força. Consegui fazer algumas caminhadas, mas tive que parar porque ficou muito desconfortável.\""
        },
        {
          date: "12/05/2026 às 10:30",
          type: "button",
          category: "Atividade Física",
          question: "Fez atividade física hoje?",
          answer: "Sim, caminhada leve"
        },
        {
          date: "11/05/2026 às 20:15",
          type: "text",
          category: "Alimentação",
          question: "O que você comeu hoje?",
          answer: "Café da manhã: pão com café. Almoço: arroz, feijão e frango. Jantar: sopa de legumes."
        }
      ]
    },
    graphs: {
      painLast30Days: [
        52, 60, 52, 68, 60, 76, 68, 60, 68, 76,
        68, 60, 68, 76, 76, 68, 76, 68, 60, 68,
        76, 68, 76, 68, 60, 68, 76, 68, 76, 76
      ],
      weeklyResponses: [
        { label: "Sem. 1", total: "18", height: 88 },
        { label: "Sem. 2", total: "21", height: 104 },
        { label: "Sem. 3", total: "19", height: 94 },
        { label: "Sem. 4", total: "22", height: 108 }
      ],
      missingDays: [
        { label: "Há 4 sem", value: "", height: 6 },
        { label: "", value: "1", height: 34 },
        { label: "", value: "", height: 6 },
        { label: "", value: "", height: 6 },
        { label: "", value: "2", height: 64 },
        { label: "", value: "1", height: 34 },
        { label: "", value: "", height: 6 },
        { label: "Hoje", value: "", height: 6 }
      ],
      sleepImpact: [
        { label: "Bom", percentage: "35%", width: 35, tone: "light" },
        { label: "Regular", percentage: "40%", width: 40, tone: "mid" },
        { label: "Ruim", percentage: "25%", width: 25, tone: "dark" }
      ],
      physicalActivity: [
        { label: "Semana 1", value: "4 dias", height: 90 },
        { label: "Semana 2", value: "5 dias", height: 112 },
        { label: "Semana 3", value: "3 dias", height: 66 },
        { label: "Semana 4", value: "2 dias", height: 42 }
      ],
      painHours: [
        32, 32, 22, 22, 32, 44, 58, 70, 58, 44, 44, 58,
        58, 70, 70, 58, 70, 84, 96, 96, 108, 96, 84, 58
      ],
      identifiedPattern: "Pico de intensidade no período noturno (22h-02h)"
    },
    reports: {
      cards: [
        { title: "Relatório Semanal", period: "Últimos 7 dias" },
        { title: "Relatório Mensal", period: "Últimos 30 dias" },
        { title: "Relatório Personalizado", period: "Escolher período" }
      ],
      current: {
        title: "Relatório Semanal",
        dateRange: "06/05/2026 - 13/05/2026",
        summaryStats: [
          { value: "7.2/10", label: "Dor Média" },
          { value: "18", label: "Respostas" },
          { value: "86%", label: "Adesão" },
          { value: "2", label: "Alertas" }
        ],
        patterns: [
          {
            title: "Dor noturna persistente:",
            detail: "Intensidade da dor aumenta significativamente após 22h em 71% dos dias"
          },
          {
            title: "Impacto no sono:",
            detail: "Qualidade do sono comprometida em 57% dos dias, correlacionado com dor noturna"
          },
          {
            title: "Atividade física reduzida:",
            detail: "Diminuição de 40% nas atividades físicas nos últimos 3 dias"
          }
        ],
        worseningEpisodes: [
          { date: "12/05", detail: "Dor intensa (8/10) com despertar noturno múltiplo" },
          { date: "10/05", detail: "Dor forte (7/10) persistente durante todo o dia" },
          { date: "08/05", detail: "Piora após atividade física, dor 8/10 à noite" }
        ],
        adherenceSummary:
          "Paciente mantém boa adesão ao acompanhamento (86%). Nenhuma pergunta ignorada sistematicamente.",
        adherenceItems: [
          { label: "Como está sua dor agora?", value: "95%" },
          { label: "Como foi seu sono?", value: "86%" },
          { label: "Você tomou a medicação?", value: "90%" },
          { label: "Fez atividade física hoje?", value: "71%" }
        ],
        conducts: [
          {
            author: "Dr. Silva",
            timestamp: "13/05 - 09:30",
            detail:
              "Ajuste de medicação para dor noturna. Solicitado acompanhamento fisioterapêutico intensivo. Retorno em 7 dias."
          },
          {
            author: "Dra. Costa",
            timestamp: "11/05 - 15:00",
            detail:
              "Revisão do plano de exercícios. Recomendação de atividades leves pela manhã para evitar sobrecarga noturna."
          }
        ],
        note:
          "Revisão Profissional: Este relatório contém sínteses automáticas que devem ser revisadas e interpretadas por profissional de saúde qualificado. Os padrões identificados são sugestões baseadas nos dados reportados pelo paciente."
      }
    },
    team: {
      members: [
        {
          name: "Dr. Silva",
          specialty: "Medicina da Dor",
          badge: "Responsável Principal",
          lastActivity: "Há 2h - Registrou conduta"
        },
        {
          name: "Dra. Costa",
          specialty: "Fisioterapia",
          badge: "Acompanhamento Físico",
          lastActivity: "Há 1 dia - Revisou evolução"
        },
        {
          name: "Psicóloga Maria",
          specialty: "Psicologia Clínica",
          badge: "Suporte Emocional",
          lastActivity: "Há 3 dias - Adicionou pergunta"
        },
        {
          name: "Fisioterapeuta Ana",
          specialty: "Fisioterapia",
          badge: "Atividade Física",
          lastActivity: "Há 1 semana - Visualizou perfil"
        }
      ],
      observations: [
        {
          author: "Dr. Silva",
          time: "Há 2h",
          type: "Conduta",
          detail:
            "Paciente mantém dor intensa no período noturno. Ajustei medicação e solicitei acompanhamento mais próximo pela fisioterapia."
        },
        {
          author: "Dra. Costa",
          time: "Há 1 dia",
          type: "Observação",
          detail:
            "Observei melhora na mobilidade durante exercícios, mas paciente relata desconforto aumentado à noite. Sugiro revisar horário das atividades."
        },
        {
          author: "Psicóloga Maria",
          time: "Há 3 dias",
          type: "Observação",
          detail:
            "Paciente demonstra ansiedade relacionada à persistência da dor. Adicionei perguntas sobre humor e qualidade do sono para acompanhamento mais próximo."
        }
      ],
      communicationSettings: [
        {
          title: "Notificar toda equipe sobre novos alertas",
          detail: "Todos os profissionais receberão notificação de alertas críticos",
          enabled: true
        },
        {
          title: "Compartilhar condutas automaticamente",
          detail: "Condutas registradas serão visíveis para toda a equipe",
          enabled: true
        }
      ]
    },
    plan: {
      communicationChannel: "WhatsApp",
      preferredFormats: ["Texto", "Botões", "Áudio"],
      idealHours: "09:00 - 21:00",
      responsibleProfessionals: "Dr. Silva, Dra. Costa, +2",
      activeQuestions: [
        {
          title: "Como está sua dor agora?",
          category: "Dor",
          status: "Ativa",
          frequency: "Diária - 3x/dia",
          schedule: "09:00, 15:00, 21:00",
          responsible: "Dr. Silva"
        },
        {
          title: "Como foi seu sono?",
          category: "Sono",
          status: "Ativa",
          frequency: "Diária - 1x/dia",
          schedule: "09:00",
          responsible: "Dra. Costa"
        },
        {
          title: "Você tomou a medicação hoje?",
          category: "Medicação",
          status: "Ativa",
          frequency: "Diária - 2x/dia",
          schedule: "09:00, 21:00",
          responsible: "Dr. Silva"
        },
        {
          title: "Fez atividade física hoje?",
          category: "Atividade Física",
          status: "Ativa",
          frequency: "Diária - 1x/dia",
          schedule: "18:00",
          responsible: "Fisioterapeuta Ana"
        },
        {
          title: "Como está seu humor hoje?",
          category: "Humor",
          status: "Pausada",
          frequency: "Semanal - 2x/semana",
          schedule: "Seg, Qui - 10:00",
          responsible: "Psicóloga Maria"
        }
      ]
    }
  }
} as const;
