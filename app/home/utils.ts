import styles from "../page.module.css";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function badgeTone(label: string) {
  if (label === "Alerta" || label === "Crítico" || label === "Dor 8/10") {
    return styles.badgeAlert;
  }

  if (label === "Estável" || label === "Ativo") {
    return styles.badgeSafe;
  }

  if (label === "Atenção" || label === "Dor 7/10") {
    return styles.badgeWarn;
  }

  if (label === "Sem Resposta" || label === "Em Observação" || label === "Braço Direito") {
    return styles.badgeNeutral;
  }

  return styles.badgeSoft;
}
