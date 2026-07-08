"use client";

import { useEffect, useState } from "react";
import type { jsPDF } from "jspdf";

import styles from "../../page.module.css";
import type {
  DashboardSummary,
  PatientListItem,
  PatientReport
} from "@/lib/shared/types";
import { cn } from "../utils";

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

  return (
    <section className={embeddedPatientId ? undefined : styles.screen}>
      {!embeddedPatientId && dashboard && (
        <>
          <div className={styles.pageHead}>
            <div className={styles.pageHeading}>
              <h1>Relatórios</h1>
              <p>Consolidação das respostas e evolução relatada por cada paciente.</p>
            </div>
          </div>

          <section className={styles.reportCards}>
            <article className={cn(styles.panel, styles.reportCard)}>
              <h2>Pacientes ativos</h2>
              <p>{dashboard.totalPatients} cadastros disponíveis para acompanhamento.</p>
            </article>
            <article className={cn(styles.panel, styles.reportCard)}>
              <h2>Respostas hoje</h2>
              <p>{dashboard.responsesToday} interações recebidas hoje.</p>
            </article>
            <article className={cn(styles.panel, styles.reportCard)}>
              <h2>Rotinas agendadas</h2>
              <p>{dashboard.scheduledMessages} rotinas configuradas.</p>
            </article>
          </section>

          <section className={cn(styles.panel, styles.reportSummary)}>
            <div className={styles.summaryGrid}>
              <article className={styles.summaryCard}>
                <strong>{stableCount}</strong>
                <small>Estáveis</small>
              </article>
              <article className={styles.summaryCard}>
                <strong>{attentionCount}</strong>
                <small>Atenção</small>
              </article>
              <article className={styles.summaryCard}>
                <strong>{criticalCount}</strong>
                <small>Críticos</small>
              </article>
              <article className={styles.summaryCard}>
                <strong>{dashboard.activeAlerts}</strong>
                <small>Alertas ativos</small>
              </article>
            </div>
          </section>
        </>
      )}

      <section className={styles.profileSectionCard}>
        <h2>{embeddedPatientId ? "Resumo e análise do acompanhamento" : "Relatório individual"}</h2>
        {!embeddedPatientId && <div className={styles.profileInfoGrid}>
          <label className={styles.field}>
            <span>Paciente</span>
            <select
              onChange={(event) => {
                setSelectedPatientId(event.target.value);
                setReport(null);
              }}
              value={selectedPatientId}
            >
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} - {patient.condition}
                </option>
              ))}
            </select>
          </label>
        </div>}
        <div className={styles.formActions}>
          <button
            className={styles.primaryButton}
            disabled={!selectedPatientId || loadingReport}
            onClick={handleGenerateReport}
            type="button"
          >
            {loadingReport ? "Analisando respostas..." : "Gerar resumo e análise"}
          </button>
          <button
            className={styles.ghostButton}
            disabled={!report || exportingPdf}
            onClick={handleExportPdf}
            type="button"
          >
            {exportingPdf ? "Gerando PDF..." : "Exportar PDF"}
          </button>
        </div>
      </section>

      {report && (
        <>
          <section className={styles.profileSectionCard}>
            <div className={styles.profileCardToolbar}>
              <div>
                <h2>{report.patient.name}</h2>
                <p className={styles.infoText}>
                  {report.patient.age} anos • {report.patient.condition} • {statusLabel(report.patient.status)}
                </p>
              </div>
              <small>Atualizado em {formatDate(report.generatedAt)}</small>
            </div>

            <div className={styles.profileReportStats}>
              <article className={styles.profileReportStat}>
                <strong>{report.metrics.responseCount}</strong>
                <span>Respostas</span>
              </article>
              <article className={styles.profileReportStat}>
                <strong>{report.metrics.audioResponseCount}</strong>
                <span>Áudios</span>
              </article>
              <article className={styles.profileReportStat}>
                <strong>{report.metrics.averagePain ?? "-"}</strong>
                <span>Dor média /10</span>
              </article>
              <article className={styles.profileReportStat}>
                <strong>{report.metrics.activeAlertCount}</strong>
                <span>Alertas ativos</span>
              </article>
            </div>
          </section>

          <section className={styles.profileSectionCard}>
            <h2>Resumo narrativo</h2>
            <div className={styles.profileSoftPanel}>
              <p>{report.narrative}</p>
            </div>
          </section>

          <section className={styles.profileSectionCard}>
            <h2>Análise do quadro relatado</h2>
            <div className={styles.profileReportList}>
              {report.analysis.map((observation) => (
                <article key={observation} className={styles.profileReportListItem}>
                  <p>{observation}</p>
                </article>
              ))}
            </div>
          </section>

          {report.painHistory.length > 0 && (
            <section className={styles.profileSectionCard}>
              <h2>Evolução da dor</h2>
              <div className={styles.profileReportList}>
                {report.painHistory.map((item) => (
                  <article
                    key={`${item.reportedAt}-${item.level}`}
                    className={styles.profileReportListItem}
                  >
                    <strong>{item.level}/10</strong>
                    <p>{item.response}</p>
                    <small>{formatDate(item.reportedAt)}</small>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className={styles.profileSectionCard}>
            <h2>Todas as respostas consideradas</h2>
            <div className={styles.profileResponseCards}>
              {report.timeline.map((item) => (
                <article key={item.id} className={styles.profileResponseCard}>
                  <div className={styles.profileResponseMeta}>
                    <strong>{item.theme}</strong>
                    <small>{formatDate(item.reportedAt)} • {item.channel} • {item.type}</small>
                  </div>
                  <div className={styles.profileResponseTextBlock}>
                    <small>{item.question}</small>
                    <p>{item.response}</p>
                  </div>
                </article>
              ))}
              {!report.timeline.length && <p>Nenhuma resposta registrada para este paciente.</p>}
            </div>
          </section>

          <p className={styles.profileReviewNote}>{report.reviewNotice}</p>
        </>
      )}
    </section>
  );
}
