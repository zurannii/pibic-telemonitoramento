"use client";

import { useMemo, useState } from "react";
import type { AlertListItem } from "@/lib/shared/types";
import { cn } from "../utils";
import { Icon } from "../components/Icon";
import {
  AlertLevelTag,
  AlertStatusTag,
  Avatar,
  EmptyState,
  Kpi,
  PageHeader,
  formatDateTime,
  ui
} from "../components/ui";

type AlertsScreenProps = {
  alerts: AlertListItem[];
  onResolveAlert: (alertId: string) => void;
  onViewPatient: (patientId: string) => void;
};

type AlertFilter = "all" | "active" | "high" | "medium" | "resolved";

const FILTERS: Array<{ id: AlertFilter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Ativos" },
  { id: "high", label: "Alta prioridade" },
  { id: "medium", label: "Média prioridade" },
  { id: "resolved", label: "Resolvidos" }
];

export function AlertsScreen({ alerts, onResolveAlert, onViewPatient }: AlertsScreenProps) {
  const [filter, setFilter] = useState<AlertFilter>("all");

  const activeAlerts = alerts.filter((alert) => alert.status === "active");
  const criticalAlerts = activeAlerts.filter((alert) => alert.level === "high").length;
  const attentionAlerts = activeAlerts.filter((alert) => alert.level === "medium").length;
  const resolvedAlerts = alerts.filter((alert) => alert.status === "resolved").length;

  const visibleAlerts = useMemo(() => {
    switch (filter) {
      case "active":
        return alerts.filter((alert) => alert.status === "active");
      case "high":
        return alerts.filter((alert) => alert.status === "active" && alert.level === "high");
      case "medium":
        return alerts.filter((alert) => alert.status === "active" && alert.level === "medium");
      case "resolved":
        return alerts.filter((alert) => alert.status === "resolved");
      default:
        return alerts;
    }
  }, [alerts, filter]);

  return (
    <>
      <PageHeader
        subtitle="Central de alertas que exigem revisão profissional: falhas, falta de resposta e piora clínica"
        title="Alertas"
      />

      <section aria-label="Resumo dos alertas" className={ui.kpiRow}>
        <Kpi icon="warning" inline label="Alta prioridade" tone="red" value={criticalAlerts} />
        <Kpi icon="info" inline label="Média prioridade" tone="amber" value={attentionAlerts} />
        <Kpi icon="alerts" inline label="Ativos" tone="blue" value={activeAlerts.length} />
        <Kpi icon="check" inline label="Resolvidos" tone="green" value={resolvedAlerts} />
      </section>

      <div className={ui.segmented} role="tablist" aria-label="Filtrar alertas">
        {FILTERS.map((item) => (
          <button
            aria-selected={filter === item.id}
            className={cn(ui.segment, filter === item.id && ui.segmentActive)}
            key={item.id}
            onClick={() => setFilter(item.id)}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={ui.stackSm}>
        {visibleAlerts.map((record) => {
          const resolved = record.status === "resolved";
          return (
            <article className={cn(ui.alertCard, resolved && ui.alertResolved)} key={record.id}>
              <span
                className={cn(
                  ui.alertBar,
                  resolved ? ui.alertBarDone : record.level === "high" ? ui.alertBarHigh : record.level === "low" && ui.alertBarLow
                )}
              />
              <Avatar name={record.patientName} />
              <div className={ui.listMain}>
                <div className={ui.tagRow}>
                  <span className={cn(ui.small, ui.muted)} style={{ fontWeight: 600 }}>
                    {record.patientName}
                  </span>
                  <AlertStatusTag status={record.status} />
                  <AlertLevelTag level={record.level} />
                </div>
                <h2 className={ui.alertTitle}>{record.title}</h2>
                <span className={ui.listMeta}>{record.description}</span>
                <div className={ui.metaRow}>
                  <span>
                    <Icon name="calendar" />
                    {formatDateTime(record.createdAt)}
                  </span>
                  <span>
                    <Icon name="user" />
                    Responsável: {record.assignedToName ?? "não atribuído"}
                  </span>
                </div>
              </div>
              <div className={ui.actions}>
                <button
                  className={cn(ui.btn, ui.btnSecondary)}
                  onClick={() => onViewPatient(record.patientId)}
                  type="button"
                >
                  Ver perfil
                </button>
                {!resolved ? (
                  <button className={cn(ui.btn, ui.btnPrimary)} onClick={() => onResolveAlert(record.id)} type="button">
                    <Icon name="check" />
                    Marcar como resolvido
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}

        {!visibleAlerts.length ? (
          <EmptyState icon="check" title="Nenhum alerta neste filtro" />
        ) : null}
      </div>
    </>
  );
}
