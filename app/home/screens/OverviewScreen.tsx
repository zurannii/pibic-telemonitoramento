import type { DashboardSummary, PatientListItem } from "@/lib/shared/types";
import type { ScreenId } from "../types";
import { cn } from "../utils";
import { Icon } from "../components/Icon";
import {
  AlertLevelTag,
  Avatar,
  Card,
  EmptyState,
  Kpi,
  PageHeader,
  PatientStatusTag,
  timeAgo,
  ui
} from "../components/ui";

type OverviewScreenProps = {
  dashboard: DashboardSummary;
  onOpenPatient: (patientId: string) => void;
  patients?: PatientListItem[];
  selectScreen?: (screen: ScreenId) => void;
};

const STATUS_SEGMENTS = [
  { key: "stable", label: "Estável", color: "var(--green-bar)" },
  { key: "attention", label: "Atenção", color: "var(--amber-bar)" },
  { key: "critical", label: "Crítico", color: "var(--red-bar)" }
] as const;

export function OverviewScreen({ dashboard, onOpenPatient, patients = [], selectScreen }: OverviewScreenProps) {
  const statusCounts = STATUS_SEGMENTS.map((segment) => ({
    ...segment,
    total: patients.filter((patient) => patient.status === segment.key).length
  }));
  const totalPatients = patients.length;

  return (
    <>
      <PageHeader
        subtitle="Acompanhamento em tempo real dos pacientes monitorados"
        title="Visão geral"
      />

      <section aria-label="Indicadores principais" className={ui.kpiRow}>
        <Kpi icon="patients" label="Pacientes ativos" value={dashboard.totalPatients} />
        <Kpi icon="questions" label="Respostas hoje" value={dashboard.responsesToday} />
        <Kpi icon="clock" label="Sem resposta" note="alertas de falta de resposta" tone="gray" value={dashboard.noResponseAlerts} />
        <Kpi icon="warning" label="Alertas ativos" tone="red" value={dashboard.activeAlerts} />
        <Kpi icon="calendar" label="Rotinas agendadas" tone="amber" value={dashboard.scheduledMessages} />
      </section>

      <div className={ui.row}>
        <Card
          actions={
            selectScreen ? (
              <button className={cn(ui.btn, ui.btnGhost, ui.btnSm)} onClick={() => selectScreen("alerts")} type="button">
                Ver todos
                <Icon name="chevron-right" />
              </button>
            ) : null
          }
          icon="alerts"
          subtitle="Exigem revisão profissional"
          title="Alertas recentes"
        >
          {dashboard.recentAlerts.length ? (
            <div className={ui.list}>
              {dashboard.recentAlerts.map((alert) => (
                <div className={ui.listItem} key={alert.id}>
                  <Avatar name={alert.patientName} />
                  <div className={ui.listMain}>
                    <div className={ui.listTitle}>
                      {alert.patientName}
                      <AlertLevelTag level={alert.level} />
                    </div>
                    <span className={ui.listMeta}>
                      {alert.title} · {timeAgo(alert.createdAt)}
                    </span>
                  </div>
                  <button
                    className={cn(ui.btn, ui.btnSecondary, ui.btnSm)}
                    onClick={() => onOpenPatient(alert.patientId)}
                    type="button"
                  >
                    Revisar
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="check" title="Nenhum alerta ativo no momento" />
          )}
        </Card>

        <Card
          actions={
            selectScreen ? (
              <button className={cn(ui.btn, ui.btnGhost, ui.btnSm)} onClick={() => selectScreen("patients")} type="button">
                Ver lista
                <Icon name="chevron-right" />
              </button>
            ) : null
          }
          icon="activity"
          subtitle="Pacientes em estado crítico ou de atenção"
          title="Pacientes prioritários"
        >
          {dashboard.priorityPatients.length ? (
            <div className={ui.list}>
              {dashboard.priorityPatients.map((patient) => (
                <div className={ui.listItem} key={patient.id}>
                  <Avatar name={patient.name} />
                  <div className={ui.listMain}>
                    <div className={ui.listTitle}>
                      {patient.name}
                      <PatientStatusTag status={patient.status} />
                    </div>
                    <span className={ui.listMeta}>
                      Responsável: {patient.responsibleName ?? "Sem profissional definido"} · Última mensagem:{" "}
                      {timeAgo(patient.lastMessageAt, "nenhuma")}
                    </span>
                  </div>
                  <button
                    className={cn(ui.btn, ui.btnSecondary, ui.btnSm)}
                    onClick={() => onOpenPatient(patient.id)}
                    type="button"
                  >
                    Abrir
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="check" title="Nenhum paciente prioritário" />
          )}
        </Card>
      </div>

      {totalPatients > 0 ? (
        <Card icon="reports" subtitle={`${totalPatients} paciente(s) acompanhados`} title="Situação dos pacientes">
          <div className={ui.stackBar} aria-hidden="true">
            {statusCounts
              .filter((segment) => segment.total > 0)
              .map((segment) => (
                <span
                  className={ui.stackSeg}
                  key={segment.key}
                  style={{ background: segment.color, flex: segment.total }}
                />
              ))}
          </div>
          <div className={ui.legendList}>
            {statusCounts.map((segment) => (
              <div className={ui.legendRow} key={segment.key}>
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
  );
}
