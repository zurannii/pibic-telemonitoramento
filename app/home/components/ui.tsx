import type { ReactNode } from "react";
import type {
  AlertLevel,
  AlertStatus,
  MessageStatus,
  PatientStatus
} from "@/lib/shared/types";
import type { IconName } from "../types";
import { cn, initials } from "../utils";
import { Icon } from "./Icon";
import ui from "../ui.module.css";

/* Componentes visuais reutilizados pelas telas. Só apresentação. */

export type Tone = "blue" | "red" | "amber" | "green" | "gray" | "purple" | "white";

const toneClass: Record<Tone, string> = {
  blue: ui.toneBlue,
  red: ui.toneRed,
  amber: ui.toneAmber,
  green: ui.toneGreen,
  gray: ui.toneGray,
  purple: ui.tonePurple,
  white: ui.toneWhite
};

export function PageHeader({
  actions,
  subtitle,
  title
}: {
  actions?: ReactNode;
  subtitle?: ReactNode;
  title: ReactNode;
}) {
  return (
    <div className={ui.pageHead}>
      <div className={ui.pageHeadText}>
        <h1 className={ui.pageTitle}>{title}</h1>
        {subtitle ? <p className={ui.pageSub}>{subtitle}</p> : null}
      </div>
      {actions ? <div className={ui.pageActions}>{actions}</div> : null}
    </div>
  );
}

export function BackLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className={ui.backLink} onClick={onClick} type="button">
      <Icon name="arrow-left" />
      {label}
    </button>
  );
}

export function Card({
  actions,
  children,
  className,
  icon,
  subtitle,
  title,
  variant
}: {
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  icon?: IconName;
  subtitle?: ReactNode;
  title?: ReactNode;
  variant?: "soft" | "flush";
}) {
  return (
    <section
      className={cn(
        ui.card,
        variant === "soft" && ui.cardSoft,
        variant === "flush" && ui.cardFlush,
        className
      )}
    >
      {title ? (
        <div className={ui.cardHead}>
          <div className={ui.cardHeadText}>
            <h2 className={ui.cardTitle}>
              {icon ? <Icon name={icon} /> : null}
              {title}
            </h2>
            {subtitle ? <p className={ui.cardSub}>{subtitle}</p> : null}
          </div>
          {actions ? <div className={ui.actions}>{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function IconChip({
  icon,
  large,
  tone = "blue"
}: {
  icon: IconName;
  large?: boolean;
  tone?: Tone;
}) {
  return (
    <span className={cn(ui.iconChip, large && ui.iconChipLg, toneClass[tone])} aria-hidden="true">
      <Icon name={icon} />
    </span>
  );
}

export function Kpi({
  icon,
  inline,
  label,
  note,
  tone = "blue",
  value
}: {
  icon: IconName;
  inline?: boolean;
  label: string;
  note?: ReactNode;
  tone?: Tone;
  value: ReactNode;
}) {
  if (inline) {
    return (
      <article className={cn(ui.kpi, ui.kpiInline)}>
        <IconChip icon={icon} large tone={tone} />
        <div>
          <div className={ui.kpiValue}>{value}</div>
          <div className={ui.kpiLabel}>{label}</div>
        </div>
      </article>
    );
  }

  return (
    <article className={ui.kpi}>
      <IconChip icon={icon} tone={tone} />
      <div className={ui.kpiValue}>{value}</div>
      <div className={ui.kpiLabel}>{label}</div>
      {note ? <div className={ui.kpiNote}>{note}</div> : null}
    </article>
  );
}

export function Avatar({
  name,
  size = "md",
  variant
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "dark";
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        ui.avatar,
        size === "sm" && ui.avatarSm,
        size === "lg" && ui.avatarLg,
        variant === "solid" && ui.avatarSolid,
        variant === "dark" && ui.avatarOnDark
      )}
    >
      {initials(name) || "?"}
    </span>
  );
}

type TagTone = "critical" | "warning" | "success" | "neutral" | "info" | "purple";

const tagToneClass: Record<TagTone, string> = {
  critical: ui.tagCritical,
  warning: ui.tagWarning,
  success: ui.tagSuccess,
  neutral: ui.tagNeutral,
  info: ui.tagInfo,
  purple: ui.tagPurple
};

export function Tag({
  children,
  icon,
  tone = "info"
}: {
  children: ReactNode;
  icon?: IconName;
  tone?: TagTone;
}) {
  return (
    <span className={cn(ui.tag, tagToneClass[tone])}>
      {icon ? <Icon name={icon} /> : null}
      {children}
    </span>
  );
}

/* Status sempre com ícone + texto (não depende só de cor). */
export function PatientStatusTag({ status }: { status: PatientStatus }) {
  if (status === "critical") return <Tag icon="warning" tone="critical">Crítico</Tag>;
  if (status === "attention") return <Tag icon="info" tone="warning">Atenção</Tag>;
  return <Tag icon="check" tone="success">Estável</Tag>;
}

export function AlertLevelTag({ level }: { level: AlertLevel }) {
  if (level === "high") return <Tag icon="warning" tone="critical">Alta</Tag>;
  if (level === "medium") return <Tag icon="info" tone="warning">Média</Tag>;
  return <Tag icon="info" tone="neutral">Informativo</Tag>;
}

export function AlertStatusTag({ status }: { status: AlertStatus }) {
  return status === "active" ? (
    <Tag icon="alerts" tone="info">Ativo</Tag>
  ) : (
    <Tag icon="check" tone="success">Resolvido</Tag>
  );
}

export function MessageStatusTag({ status }: { status: MessageStatus }) {
  switch (status) {
    case "failed":
      return <Tag icon="warning" tone="critical">Falha no envio</Tag>;
    case "answered":
      return <Tag icon="check" tone="success">Respondida</Tag>;
    case "received":
      return <Tag icon="check" tone="success">Recebida</Tag>;
    case "read":
      return <Tag icon="eye" tone="info">Lida</Tag>;
    case "delivered":
      return <Tag icon="check" tone="info">Entregue</Tag>;
    case "sent":
      return <Tag icon="send" tone="info">Enviada</Tag>;
    default:
      return <Tag icon="clock" tone="neutral">Agendada</Tag>;
  }
}

export function EmptyState({
  description,
  icon = "search",
  title
}: {
  description?: ReactNode;
  icon?: IconName;
  title: ReactNode;
}) {
  return (
    <div className={ui.empty}>
      <Icon name={icon} />
      <strong>{title}</strong>
      {description ? <span>{description}</span> : null}
    </div>
  );
}

export function Field({
  children,
  className,
  hint,
  label,
  required
}: {
  children: ReactNode;
  className?: string;
  hint?: ReactNode;
  label: ReactNode;
  required?: boolean;
}) {
  return (
    <label className={cn(ui.field, className)}>
      <span className={ui.label}>
        {label}
        {required ? <span className={ui.req}>*</span> : null}
      </span>
      {children}
      {hint ? <span className={ui.hint}>{hint}</span> : null}
    </label>
  );
}

export function Note({
  children,
  icon = "info",
  warning
}: {
  children: ReactNode;
  icon?: IconName;
  warning?: boolean;
}) {
  return (
    <div className={cn(ui.note, warning && ui.noteWarning)}>
      <Icon name={icon} />
      <span>{children}</span>
    </div>
  );
}

/** Barra de intensidade de dor (0–10), com número + cor. */
export function PainMeter({ value }: { value: number | null }) {
  if (value === null) return <span className={ui.muted}>—</span>;
  const color = value >= 7 ? "var(--red-bar)" : value >= 4 ? "var(--amber-bar)" : "var(--green-bar)";
  return (
    <span className={ui.cellInline}>
      <strong>{value}/10</strong>
      <span className={ui.meter}>
        <span
          className={ui.meterFill}
          style={{ background: color, width: `${Math.max(4, Math.min(100, value * 10))}%`, display: "block" }}
        />
      </span>
    </span>
  );
}

export function formatDateTime(value: string | null | undefined, empty = "—") {
  if (!value) return empty;
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/** "Há 2h", "Há 3 dias" — formatação amigável de datas recentes. */
export function timeAgo(value: string | null | undefined, empty = "Sem resposta ainda") {
  if (!value) return empty;
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "Agora";
  if (minutes < 60) return `Há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Há ${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `Há ${days} dia${days > 1 ? "s" : ""}`;
  return formatDateTime(value);
}

export const roleLabel: Record<string, string> = {
  admin: "Administrador",
  professional: "Profissional",
  viewer: "Visualizador"
};

export const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export { ui };
