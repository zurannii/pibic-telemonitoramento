import styles from "../../page.module.css";
import type { AlertListItem } from "@/lib/shared/types";
import { badgeTone, cn } from "../utils";

type AlertsScreenProps = {
  alerts: AlertListItem[];
  onResolveAlert: (alertId: string) => void;
  onViewPatient: (patientId: string) => void;
};

function levelLabel(level: AlertListItem["level"]) {
  if (level === "high") return "Crítico";
  if (level === "medium") return "Atenção";
  return "Informativo";
}

export function AlertsScreen({ alerts, onResolveAlert, onViewPatient }: AlertsScreenProps) {
  const activeAlerts = alerts.filter((alert) => alert.status === "active");
  const criticalAlerts = activeAlerts.filter((alert) => alert.level === "high").length;
  const attentionAlerts = activeAlerts.filter((alert) => alert.level === "medium").length;
  const resolvedAlerts = alerts.filter((alert) => alert.status === "resolved").length;

  return (
    <section className={styles.screen}>
      <div className={styles.pageHeading}>
        <h1>Alertas</h1>
        <p>Central da equipe para acompanhar falhas, falta de resposta e piora clínica.</p>
      </div>

      <section className={cn(styles.summaryGrid, styles.summaryGridAlerts)}>
        <article className={styles.summaryCard}>
          <strong>{criticalAlerts}</strong>
          <small>Críticos</small>
        </article>
        <article className={styles.summaryCard}>
          <strong>{attentionAlerts}</strong>
          <small>Atenção</small>
        </article>
        <article className={styles.summaryCard}>
          <strong>{activeAlerts.length}</strong>
          <small>Ativos</small>
        </article>
        <article className={styles.summaryCard}>
          <strong>{resolvedAlerts}</strong>
          <small>Resolvidos</small>
        </article>
      </section>

      <div className={styles.alertsList}>
        {alerts.map((record) => (
          <article key={record.id} className={cn(styles.panel, styles.alertRecord)}>
            <div className={styles.alertRecordHead}>
              <div>
                <h2>{record.patientName}</h2>
                <p>{record.title}</p>
              </div>
              <div className={styles.badgeRow}>
                <span className={cn(styles.badge, badgeTone(levelLabel(record.level)))}>
                  {levelLabel(record.level)}
                </span>
                <span className={cn(styles.badge, record.status === "active" ? styles.badgeWarn : styles.badgeSafe)}>
                  {record.status === "active" ? "Ativo" : "Resolvido"}
                </span>
              </div>
            </div>
            <p className={styles.alertMeta}>
              {record.description} • {new Date(record.createdAt).toLocaleString("pt-BR")}
            </p>
            <div className={styles.alertRecordActions}>
              <button className={styles.tableButton} onClick={() => onViewPatient(record.patientId)} type="button">
                Ver Perfil
              </button>
              {record.status === "active" && (
                <button className={styles.primaryButton} onClick={() => onResolveAlert(record.id)} type="button">
                  Marcar como resolvido
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
