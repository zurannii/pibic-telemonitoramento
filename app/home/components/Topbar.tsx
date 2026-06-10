import styles from "../../page.module.css";

type TopbarProps = {
  onLogout?: () => void;
  userName?: string;
};

export function Topbar({ onLogout, userName = "Dr. Silva" }: TopbarProps) {
  return (
    <header className={styles.topbar}>
      <label className={styles.search}>
        <span className={styles.srOnly}>Buscar</span>
        <input type="search" placeholder="Buscar..." />
      </label>

      <div className={styles.userChip}>
        <span className={styles.avatar} aria-hidden="true" />
        <span>{userName}</span>
        {onLogout && (
          <button className={styles.tableButton} onClick={onLogout} type="button">
            Sair
          </button>
        )}
      </div>
    </header>
  );
}
