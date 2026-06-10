import styles from "../../page.module.css";
import type { DashboardSummary } from "@/lib/shared/types";
import { cn } from "../utils";
import { Icon } from "../components/Icon";

type OverviewScreenProps = {
  dashboard: DashboardSummary;
  onOpenPatient: (patientId: string) => void;
};

export function OverviewScreen({ dashboard, onOpenPatient }: OverviewScreenProps) {
  const statCards = [
    {
      label: "Pacientes Ativos",
      value: String(dashboard.totalPatients),
      icon: "patients" as const,
      tone: "soft"
    },
    {
      label: "Respostas Hoje",
      value: String(dashboard.responsesToday),
      icon: "questions" as const,
      tone: "soft"
    },
    {
      label: "Sem Resposta",
      value: String(dashboard.noResponseAlerts),
      icon: "clock" as const,
      tone: "mid"
    },
    {
      label: "Alertas Ativos",
      value: String(dashboard.activeAlerts),
      icon: "alerts" as const,
      tone: "dark"
    },
    {
      label: "Rotinas Agendadas",
      value: String(dashboard.scheduledMessages),
      icon: "reports" as const,
      tone: "mid"
    }
  ];

  return (
    <section className={styles.screen}>
      <div className={styles.pageHeading}>
        <h1>Dashboard - Visão Geral</h1>
        <p>Acompanhe rapidamente o que está acontecendo hoje na operação.</p>
      </div>

      <section className={styles.statsGrid} aria-label="Indicadores principais">
        {statCards.map((card) => (
          <article key={card.label} className={styles.statCard}>
            <div
              className={cn(
                styles.statIcon,
                card.tone === "mid" && styles.statIconMid,
                card.tone === "dark" && styles.statIconDark
              )}
            >
              <Icon name={card.icon} />
            </div>
            <strong>{card.value}</strong>
            <span>{card.label}</span>
          </article>
        ))}
      </section>

      <section className={styles.contentGrid}>
        <article className={styles.panel}>
          <h2>Alertas Recentes</h2>
          <div className={styles.stackList}>
            {dashboard.recentAlerts.map((alert) => (
              <div key={alert.id} className={styles.alertItem}>
                <span
                  className={cn(
                    styles.statusDot,
                    alert.level === "medium" && styles.statusDotSoft,
                    alert.level === "low" && styles.statusDotMuted
                  )}
                />
                <div className={styles.itemCopy}>
                  <strong>{alert.patientName}</strong>
                  <span>{alert.title}</span>
                  <time>{new Date(alert.createdAt).toLocaleString("pt-BR")}</time>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <h2>Pacientes Prioritários</h2>
          <div className={styles.stackList}>
            {dashboard.priorityPatients.map((patient) => (
              <div key={patient.id} className={styles.priorityItem}>
                <span
                  className={cn(
                    styles.priorityDot,
                    patient.status === "attention" && styles.priorityDotSoft
                  )}
                />
                <div className={styles.itemCopy}>
                  <strong>{patient.name}</strong>
                  <span>
                    Responsável: {patient.responsibleName ?? "Sem profissional definido"}
                  </span>
                </div>
                <strong className={styles.score}>
                  {patient.status === "critical" ? "Crítico" : "Atenção"}
                </strong>
                <button className={styles.primaryButton} onClick={() => onOpenPatient(patient.id)} type="button">
                  Abrir
                </button>
              </div>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}
