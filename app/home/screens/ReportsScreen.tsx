"use client";

import { useEffect, useState } from "react";
import type { jsPDF } from "jspdf";

import type {
  DashboardSummary,
  PatientListItem,
  PatientReport
} from "@/lib/shared/types";
import { cn, displayLabel } from "../utils";
import { Icon } from "../components/Icon";
import { Card, EmptyState, Field, Kpi, Note, PageHeader, ui } from "../components/ui";

type ReportsScreenProps = {
  dashboard?: DashboardSummary;
  embeddedPatientId?: string;
  onGenerateReport: (patientId: string) => Promise<PatientReport | undefined>;
  patients?: PatientListItem[];
};

function formatDate(value: string | null) {
  if (!value) return "Sem registros";
  return new Date(value).toLocaleString("pt-BR");
}

function statusLabel(status: PatientReport["patient"]["status"]) {
  if (status === "critical") return "Crítico";
  if (status === "attention") return "Atenção";
  return "Estável";
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function exportReportPdf(report: PatientReport) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 16;
  const contentWidth = pdf.internal.pageSize.getWidth() - margin * 2;
  const pageHeight = pdf.internal.pageSize.getHeight();
  let cursorY = 18;

  const ensureSpace = (height: number) => {
    if (cursorY + height <= pageHeight - 18) return;
    pdf.addPage();
    cursorY = 18;
  };

  const addText = (
    text: string,
    options: { bold?: boolean; fontSize?: number; gapAfter?: number } = {}
  ) => {
    const fontSize = options.fontSize ?? 10;
    pdf.setFont("helvetica", options.bold ? "bold" : "normal");
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, contentWidth) as string[];
    const lineHeight = fontSize * 0.42;
    for (const line of lines) {
      ensureSpace(lineHeight);
      pdf.text(line, margin, cursorY);
      cursorY += lineHeight;
    }
    cursorY += options.gapAfter ?? 3;
  };

  const addSection = (title: string) => {
    ensureSpace(12);
    cursorY += 3;
    addText(title, { bold: true, fontSize: 13, gapAfter: 4 });
  };

  addText("Relatório de acompanhamento", { bold: true, fontSize: 18, gapAfter: 2 });
  addText(`Gerado em ${formatDate(report.generatedAt)}`, { fontSize: 9, gapAfter: 6 });

  addSection("Identificação");
  addText(`Paciente: ${report.patient.name} | Idade: ${report.patient.age} anos`);
  addText(`Condição informada: ${report.patient.condition}`);
  addText(
    `Responsável: ${report.patient.responsibleName ?? "Não definido"} | Situação: ${statusLabel(report.patient.status)}`
  );
  addText(`Período analisado: ${formatDate(report.period.start)} a ${formatDate(report.period.end)}`);

  addSection("Indicadores");
  addText(
    `Respostas: ${report.metrics.responseCount} | Áudios: ${report.metrics.audioResponseCount} | Dor média: ${report.metrics.averagePain ?? "-"}/10 | Maior dor: ${report.metrics.maximumPain ?? "-"}/10 | Alertas ativos: ${report.metrics.activeAlertCount}`
  );

  addSection("Resumo narrativo");
  addText(report.narrative);

  addSection("Análise descritiva");
  for (const observation of report.analysis) {
    addText(`- ${observation}`, { gapAfter: 2 });
  }

  if (report.painHistory.length) {
    addSection("Evolução da dor relatada");
    for (const item of report.painHistory) {
      addText(
        `${formatDate(item.reportedAt)} - ${item.level}/10 - ${item.response}`,
        { gapAfter: 2 }
      );
    }
  }

  addSection("Histórico completo de respostas");
  if (!report.timeline.length) {
    addText("Nenhuma resposta registrada.");
  }
  for (const item of report.timeline) {
    addText(`${formatDate(item.reportedAt)} | ${item.theme} | ${item.channel} | ${item.type}`, {
      bold: true,
      fontSize: 9,
      gapAfter: 1
    });
    addText(`Pergunta: ${item.question}`, { fontSize: 9, gapAfter: 1 });
    addText(`Resposta: ${item.response}`, { gapAfter: 4 });
  }

  addSection("Revisão profissional");
  addText(report.reviewNotice, { fontSize: 9 });

  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(`Página ${page} de ${pageCount}`, pdf.internal.pageSize.getWidth() - margin, pageHeight - 8, {
      align: "right"
    });
  }

  pdf.save(`relatorio-${slugify(report.patient.name) || "paciente"}.pdf`);
}

export function ReportsScreen({
  dashboard,
  embeddedPatientId,
  onGenerateReport,
  patients = []
}: ReportsScreenProps) {
  const [selectedPatientId, setSelectedPatientId] = useState(
    embeddedPatientId ?? patients[0]?.id ?? ""
  );
  const [report, setReport] = useState<PatientReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    if (embeddedPatientId) {
      setSelectedPatientId(embeddedPatientId);
      setReport(null);
      return;
    }

    if (selectedPatientId && patients.some((patient) => patient.id === selectedPatientId)) return;
    setSelectedPatientId(patients[0]?.id ?? "");
    setReport(null);
  }, [embeddedPatientId, patients, selectedPatientId]);

  const criticalCount = patients.filter((patient) => patient.status === "critical").length;
  const attentionCount = patients.filter((patient) => patient.status === "attention").length;
  const stableCount = patients.filter((patient) => patient.status === "stable").length;

  const handleGenerateReport = async () => {
    if (!selectedPatientId) return;

    setLoadingReport(true);
    try {
      const generatedReport = await onGenerateReport(selectedPatientId);
      if (generatedReport) setReport(generatedReport);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleExportPdf = async () => {
    if (!report) return;

    setExportingPdf(true);
    try {
      await exportReportPdf(report);
    } finally {
      setExportingPdf(false);
    }
  };

  const totalPatients = patients.length;
  const statusSegments = [
    { label: "Estável", total: stableCount, color: "var(--green-bar)" },
    { label: "Atenção", total: attentionCount, color: "var(--amber-bar)" },
    { label: "Crítico", total: criticalCount, color: "var(--red-bar)" }
  ];
  const painPoints = report?.painHistory.slice(-12) ?? [];

  const generator = (
    <Card
      actions={
        <>
          <button
            className={cn(ui.btn, ui.btnSecondary)}
            disabled={!report || exportingPdf}
            onClick={handleExportPdf}
            type="button"
          >
            <Icon name="download" />
            {exportingPdf ? "Gerando PDF..." : "Exportar PDF"}
          </button>
          <button
            className={cn(ui.btn, ui.btnPrimary)}
            disabled={!selectedPatientId || loadingReport}
            onClick={handleGenerateReport}
            type="button"
          >
            <Icon name="idea" />
            {loadingReport ? "Analisando respostas..." : "Gerar resumo e análise"}
          </button>
        </>
      }
      icon="text"
      subtitle={
        embeddedPatientId
          ? "Relatório longitudinal com as respostas registradas do paciente"
          : "Selecione um paciente para gerar o relatório longitudinal"
      }
      title={embeddedPatientId ? "Relatório do paciente" : "Relatório individual"}
    >
      {!embeddedPatientId ? (
        <Field label="Paciente">
          <select
            onChange={(event) => {
              setSelectedPatientId(event.target.value);
              setReport(null);
            }}
            value={selectedPatientId}
          >
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name} — {patient.condition}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      {!report ? (
        <Note>Clique em “Gerar resumo e análise” para montar o relatório com as respostas mais recentes.</Note>
      ) : null}
    </Card>
  );

  return (
    <div className={ui.stack}>
      {!embeddedPatientId && dashboard && (
        <>
          <PageHeader
            subtitle="Consolidação das respostas e da evolução relatada por cada paciente"
            title="Relatórios"
          />

          <section aria-label="Indicadores gerais" className={ui.kpiRow}>
            <Kpi icon="patients" label="Pacientes ativos" value={dashboard.totalPatients} />
            <Kpi icon="questions" label="Respostas hoje" value={dashboard.responsesToday} />
            <Kpi icon="calendar" label="Rotinas agendadas" tone="amber" value={dashboard.scheduledMessages} />
            <Kpi icon="alerts" label="Alertas ativos" tone="red" value={dashboard.activeAlerts} />
          </section>

          {totalPatients > 0 ? (
            <Card icon="reports" subtitle="Distribuição atual dos pacientes acompanhados" title="Distribuição de status">
              <div aria-hidden="true" className={ui.stackBar}>
                {statusSegments
                  .filter((segment) => segment.total > 0)
                  .map((segment) => (
                    <span
                      className={ui.stackSeg}
                      key={segment.label}
                      style={{ background: segment.color, flex: segment.total }}
                    />
                  ))}
              </div>
              <div className={ui.legendList}>
                {statusSegments.map((segment) => (
                  <div className={ui.legendRow} key={segment.label}>
                    <span className={ui.legendDot} style={{ background: segment.color }} />
                    <span className={ui.legendLabel}>{segment.label}</span>
                    <span className={ui.legendValue}>{segment.total}</span>
                    <span className={cn(ui.muted, ui.small)}>
                      {Math.round((segment.total / totalPatients) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </>
      )}

      {generator}

      {report && (
        <>
          <Card
            actions={<span className={cn(ui.small, ui.muted)}>Gerado em {formatDate(report.generatedAt)}</span>}
            icon="user"
            subtitle={`${report.patient.age} anos · ${report.patient.condition} · ${statusLabel(report.patient.status)}`}
            title={report.patient.name}
          >
            <div className={ui.kpiRow}>
              <div className={ui.softBox}>
                <p className={ui.sectionLabel}>Respostas</p>
                <div className={ui.kpiValue}>{report.metrics.responseCount}</div>
              </div>
              <div className={ui.softBox}>
                <p className={ui.sectionLabel}>Áudios</p>
                <div className={ui.kpiValue}>{report.metrics.audioResponseCount}</div>
              </div>
              <div className={ui.softBox}>
                <p className={ui.sectionLabel}>Dor média</p>
                <div className={ui.kpiValue}>
                  {report.metrics.averagePain ?? "—"}
                  <span className={cn(ui.small, ui.muted)}>/10</span>
                </div>
              </div>
              <div className={ui.softBox}>
                <p className={ui.sectionLabel}>Alertas ativos</p>
                <div className={ui.kpiValue}>{report.metrics.activeAlertCount}</div>
              </div>
            </div>
            <span className={cn(ui.small, ui.muted)}>
              Período analisado: {formatDate(report.period.start)} a {formatDate(report.period.end)}
            </span>
          </Card>

          <div className={ui.row}>
            <Card icon="idea" title="Resumo narrativo" variant="soft">
              <Note>Síntese gerada automaticamente — deve ser revisada por um profissional.</Note>
              <p style={{ lineHeight: 1.6, margin: 0 }}>{report.narrative}</p>
            </Card>

            <Card icon="activity" title="Análise do quadro relatado">
              {report.analysis.length ? (
                <ul className={ui.bullets}>
                  {report.analysis.map((observation) => (
                    <li key={observation}>{observation}</li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="Sem observações para o período" />
              )}
            </Card>
          </div>

          {painPoints.length > 0 && (
            <Card icon="activity" subtitle="Intensidade relatada pelo paciente (escala 0–10)" title="Evolução da dor">
              <div className={ui.bars}>
                {painPoints.map((item) => (
                  <div className={ui.barCol} key={`${item.reportedAt}-${item.level}`} title={item.response}>
                    <span className={ui.barValue}>{item.level}/10</span>
                    <span
                      className={cn(ui.bar, item.level >= 7 ? ui.barRed : item.level >= 4 ? ui.barAmber : ui.barGreen)}
                      style={{ height: `${Math.max(4, item.level * 10)}%` }}
                    />
                    <span className={ui.barLabel}>
                      {new Date(item.reportedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
              <div className={ui.tagRow}>
                <span className={ui.legendRow}>
                  <span className={ui.legendDot} style={{ background: "var(--red-bar)" }} />
                  <span className={ui.small}>Intensa (7–10)</span>
                </span>
                <span className={ui.legendRow}>
                  <span className={ui.legendDot} style={{ background: "var(--amber-bar)" }} />
                  <span className={ui.small}>Moderada (4–6)</span>
                </span>
                <span className={ui.legendRow}>
                  <span className={ui.legendDot} style={{ background: "var(--green-bar)" }} />
                  <span className={ui.small}>Leve (0–3)</span>
                </span>
              </div>
            </Card>
          )}

          {report.themes.length > 0 && (
            <Card icon="questions" title="Temas das respostas">
              <div className={ui.tagRow}>
                {report.themes.map((theme) => (
                  <span className={ui.pill} key={theme.name}>
                    {theme.name} · {theme.count}
                  </span>
                ))}
              </div>
            </Card>
          )}

          <Card icon="questions" subtitle={`${report.timeline.length} resposta(s)`} title="Todas as respostas consideradas">
            {report.timeline.length ? (
              <div className={ui.list}>
                {report.timeline.map((item) => (
                  <div className={ui.listItem} key={item.id} style={{ alignItems: "flex-start" }}>
                    <div className={ui.messageBody}>
                      <div className={ui.messageHead}>
                        <strong>{item.theme}</strong>
                        <span className={ui.pill}>{displayLabel(item.channel)}</span>
                        <span className={ui.pill}>{displayLabel(item.type)}</span>
                        <span className={ui.messageTime}>
                          <Icon name="clock" />
                          {formatDate(item.reportedAt)}
                        </span>
                      </div>
                      <span className={ui.listMeta}>Pergunta: {item.question}</span>
                      <div className={ui.bubble}>{item.response}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Nenhuma resposta registrada para este paciente" />
            )}
          </Card>

          <Note>{report.reviewNotice}</Note>
        </>
      )}
    </div>
  );
}
