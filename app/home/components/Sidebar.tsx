import { navItems } from "../data";
import type { ScreenId } from "../types";
import { cn } from "../utils";
import { Icon } from "./Icon";
import { Avatar, roleLabel, ui } from "./ui";

type SidebarProps = {
  activeNav: Exclude<ScreenId, "patient-create">;
  alertCount?: number;
  desktopHidden?: boolean;
  onClose: () => void;
  onLogout?: () => void;
  onSelectScreen: (screen: ScreenId) => void;
  open: boolean;
  userName: string;
  userRole?: string;
};

export function Sidebar({
  activeNav,
  alertCount = 0,
  onClose,
  onLogout,
  onSelectScreen,
  open,
  userName,
  userRole
}: SidebarProps) {
  const handleSelect = (screen: ScreenId) => {
    onSelectScreen(screen);
    onClose();
  };

  return (
    <aside
      aria-label="Menu principal"
      className={cn(ui.sidebar, open && ui.sidebarOpen)}
      id="mobile-navigation"
    >
      <div className={ui.brand}>
        <Icon name="brand" className={ui.brandLogo} />
        <div className={ui.brandText}>
          <span className={ui.brandName}>Telemonitoramento</span>
          <span className={ui.brandSub}>Fibromialgia e doenças crônicas</span>
        </div>
        <button aria-label="Fechar menu" className={ui.closeBtn} onClick={onClose} type="button">
          <Icon name="close" />
        </button>
      </div>

      <span className={ui.navLabel}>Menu</span>
      <nav aria-label="Navegação principal" className={ui.nav}>
        {navItems.map((item) => (
          <button
            aria-current={activeNav === item.id ? "page" : undefined}
            className={cn(ui.navItem, activeNav === item.id && ui.navItemActive)}
            key={item.id}
            onClick={() => handleSelect(item.id)}
            type="button"
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
            {item.id === "alerts" && alertCount > 0 ? (
              <span className={ui.navCount} aria-label={`${alertCount} alertas ativos`}>
                {alertCount}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      <div className={ui.sidebarSpacer} />

      <div className={ui.aiNote}>
        <strong>
          <Icon name="idea" />
          Apoio à análise
        </strong>
        <span>Resumos e análises automáticas devem ser revisados por um profissional.</span>
      </div>

      <div className={ui.account}>
        <Avatar name={userName} variant="dark" />
        <div className={ui.accountInfo}>
          <strong>{userName}</strong>
          <small>{userRole ? roleLabel[userRole] ?? userRole : "Conta conectada"}</small>
        </div>
        {onLogout ? (
          <button
            aria-label="Sair da plataforma"
            className={ui.logoutBtn}
            onClick={() => {
              onClose();
              onLogout();
            }}
            title="Sair da plataforma"
            type="button"
          >
            <Icon name="logout" />
          </button>
        ) : null}
      </div>
    </aside>
  );
}
