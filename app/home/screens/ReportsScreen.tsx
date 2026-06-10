import styles from "../../page.module.css";
import type { DashboardSummary, PatientListItem } from "@/lib/shared/types";
import { cn } from "../utils";

type ReportsScreenProps = {
  dashboard: DashboardSummary;
  patients: PatientListItem[];
};

export function ReportsScreen({ dashboard, patients }: ReportsScreenProps) {
  const criticalCount = patients.filter((patient) => patient.status === "critical").length;
  const attentionCount = patients.filter((patient) => patient.status === "attention").length;
  const stableCount = patients.filter((patient) => patient.status === "stable").length;

  return (
    <section className={styles.screen}>
      <div className={styles.pageHeading}>
        <h1>Relatórios</h1>
        <p>Resumo rápido para apresentar resultados dos testes da plataforma.</p>
      </div>

      <section className={styles.reportCards}>
        <article className={cn(styles.panel, styles.reportCard)}>
          <h2>Pacientes ativos</h2>
          <p>{dashboard.totalPatients} cadastros válidos no ambiente.</p>
        </article>
        <article className={cn(styles.panel, styles.reportCard)}>
          <h2>Respostas hoje</h2>
          <p>{dashboard.responsesToday} interações recebidas hoje no WhatsApp.</p>
        </article>
        <article className={cn(styles.panel, styles.reportCard)}>
          <h2>Rotinas agendadas</h2>
          <p>{dashboard.scheduledMessages} rotinas prontas para disparo automático.</p>
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
    </section>
  );
}
