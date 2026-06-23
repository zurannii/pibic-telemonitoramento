"use client";

import { useEffect } from "react";
import styles from "./page.module.css";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={styles.authShell}>
      <section className={styles.authPanel}>
        <div className={styles.authHero}>
          <span className={styles.authEyebrow}>Erro inesperado</span>
          <h1>Algo saiu do ar, mas a aplicação pode ser restaurada.</h1>
          <p>
            Tente recarregar a rota. Se o erro persistir, revise os logs do servidor e a integração
            configurada no ambiente.
          </p>
        </div>

        <section className={styles.authCard}>
          <div className={styles.formPanel}>
            <p className={styles.infoText}>
              {error.message || "Não foi possível renderizar esta tela."}
            </p>
          </div>

          <div className={styles.formActions}>
            <button className={styles.ghostButton} onClick={() => window.location.reload()} type="button">
              Recarregar
            </button>
            <button className={styles.primaryButton} onClick={reset} type="button">
              Tentar novamente
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
