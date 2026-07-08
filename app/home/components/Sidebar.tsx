import styles from "../../page.module.css";
import { navItems } from "../data";
import type { ScreenId } from "../types";
import { cn } from "../utils";
import { Icon } from "./Icon";

type SidebarProps = {
  activeNav: Exclude<ScreenId, "patient-create">;
  desktopHidden?: boolean;
  onClose: () => void;
  onSelectScreen: (screen: ScreenId) => void;
  open: boolean;
};

export function Sidebar({ activeNav, desktopHidden = false, onClose, onSelectScreen, open }: SidebarProps) {
  const handleSelect = (screen: ScreenId) => {
    onSelectScreen(screen);
    onClose();
  };

  return (
    <aside
      aria-label="Menu principal"
      className={cn(
        styles.sidebar,
        desktopHidden && styles.sidebarDesktopHidden,
        open && styles.sidebarOpen
      )}
      id="mobile-navigation"
    >
      <div className={styles.sidebarHeader}>
        <div className={styles.brandMark} aria-label="Logo do painel">
          <Icon name="brand" className={styles.brandIcon} />
          <span>Telemonitoramento</span>
        </div>
        <button className={styles.mobileCloseButton} onClick={onClose} type="button" aria-label="Fechar menu">
          <Icon name="close" />
        </button>
      </div>

      <nav className={styles.sidebarNav} aria-label="Navegação principal">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={cn(styles.navLink, activeNav === item.id && styles.navLinkActive)}
            onClick={() => handleSelect(item.id)}
            type="button"
          >
            <span className={styles.navIcon}>
              <Icon name={item.icon} />
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
