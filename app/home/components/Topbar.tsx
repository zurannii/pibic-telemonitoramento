import styles from "../../page.module.css";
import { Icon } from "./Icon";

type TopbarProps = {
  menuOpen: boolean;
  onLogout?: () => void;
  onOpenMenu: () => void;
  userName?: string;
};

export function Topbar({ menuOpen, onLogout, onOpenMenu, userName = "Dr. Silva" }: TopbarProps) {
  return (
    <header className={styles.topbar}>
      <div className={styles.topbarStart}>
        <button
          aria-controls="mobile-navigation"
          aria-expanded={menuOpen}
          aria-label="Abrir menu principal"
          className={styles.mobileMenuButton}
          onClick={onOpenMenu}
          type="button"
        >
          <Icon name="menu" />
        </button>
        <label className={styles.search}>
          <span className={styles.srOnly}>Buscar</span>
          <input type="search" placeholder="Buscar..." />
        </label>
      </div>

      <div className={styles.userChip}>
        <span className={styles.avatar} aria-hidden="true" />
        <span className={styles.userName}>{userName}</span>
        {onLogout && (
          <button className={styles.tableButton} onClick={onLogout} type="button">
            Sair
          </button>
        )}
      </div>
    </header>
  );
}
