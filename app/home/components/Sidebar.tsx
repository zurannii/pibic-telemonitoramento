import styles from "../../page.module.css";
import { navItems } from "../data";
import type { ScreenId } from "../types";
import { cn } from "../utils";
import { Icon } from "./Icon";

type SidebarProps = {
  activeNav: Exclude<ScreenId, "patient-create">;
  onSelectScreen: (screen: ScreenId) => void;
};

export function Sidebar({ activeNav, onSelectScreen }: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brandMark} aria-label="Logo do painel">
        <Icon name="brand" className={styles.brandIcon} />
      </div>

      <nav className={styles.sidebarNav} aria-label="Navegação principal">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={cn(styles.navLink, activeNav === item.id && styles.navLinkActive)}
            onClick={() => onSelectScreen(item.id)}
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
