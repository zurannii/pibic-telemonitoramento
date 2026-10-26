import styles from "../page.module.css";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function badgeTone(label: string) {
  if (label === "Alerta" || label === "Crítico" || label === "Critico" || label === "Dor 8/10") {
    return styles.badgeAlert;
  }

  if (label === "Estável" || label === "Estavel" || label === "Ativo") {
    return styles.badgeSafe;
  }

  if (label === "Atenção" || label === "Atencao" || label === "Dor 7/10") {
    return styles.badgeWarn;
  }

  if (label === "Sem Resposta" || label === "Em Observação" || label === "Braço Direito") {
    return styles.badgeNeutral;
  }

  return styles.badgeSoft;
}

export function initials(name: string) {
  const parts = name
    .replace(/\./g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

const displayLabels: Record<string, string> = {
  text: "Texto",
  buttons: "Botões",
  audio: "Áudio",
  automatic: "Automático",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  queued: "Na fila",
  pending: "Pendente",
  sent: "Enviada",
  delivered: "Entregue",
  read: "Lida",
  received: "Recebida",
  answered: "Respondida",
  failed: "Falha no envio"
};

/** Rótulo legível para valores técnicos exibidos na interface (somente exibição). */
export function displayLabel(value: string | null | undefined) {
  if (!value) return "";
  return displayLabels[value] ?? value;
}
