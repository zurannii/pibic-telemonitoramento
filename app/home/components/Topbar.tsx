import { Icon } from "./Icon";
import { Avatar, roleLabel, ui } from "./ui";

type TopbarProps = {
  alertCount?: number;
  menuOpen: boolean;
  onLogout?: () => void;
  onOpenAlerts?: () => void;
  onOpenMenu: () => void;
  pageTitle: string;
  userName?: string;
  userRole?: string;
  userSpecialty?: string;
};

export function Topbar({
  menuOpen,
  onOpenMenu,
  onOpenAlerts,
  pageTitle,
  userName = "Dr. Silva",
  userRole,
  userSpecialty
}: TopbarProps) {
  const subtitle = [userSpecialty, userRole ? roleLabel[userRole] ?? userRole : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <header className={ui.topbar}>
      <button
        aria-controls="mobile-navigation"
        aria-expanded={menuOpen}
        aria-label="Abrir menu principal"
        className={ui.menuBtn}
        onClick={onOpenMenu}
        type="button"
      >
        <Icon name="menu" />
      </button>
      <span className={ui.mobileTitle}>{pageTitle}</span>

      <label className={ui.search}>
        <Icon name="search" />
        <span className={ui.srOnly}>Buscar</span>
        <input placeholder="Buscar paciente, alerta ou pergunta…" type="search" />
      </label>

      <div className={ui.topbarRight}>
        {onOpenAlerts ? (
          <button
            aria-label="Ver alertas"
            className={`${ui.btn} ${ui.btnSecondary} ${ui.btnIcon}`}
            onClick={onOpenAlerts}
            type="button"
          >
            <Icon name="alerts" />
          </button>
        ) : null}
        <span className={ui.vDivider} />
        <div className={ui.user}>
          <Avatar name={userName} variant="solid" />
          <div className={ui.userText}>
            <strong>{userName}</strong>
            {subtitle ? <small>{subtitle}</small> : null}
          </div>
        </div>
      </div>
    </header>
  );
}
