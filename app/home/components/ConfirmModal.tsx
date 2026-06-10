"use client";

import styles from "../../page.module.css";

type ConfirmModalProps = {
  actionLabel?: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
};

export function ConfirmModal({
  actionLabel = "Confirmar",
  description,
  onCancel,
  onConfirm,
  open,
  title
}: ConfirmModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className={styles.modalBackdrop} role="presentation">
      <div aria-modal="true" className={styles.modalCard} role="dialog">
        <h2>{title}</h2>
        <p>{description}</p>
        <div className={styles.modalActions}>
          <button className={styles.ghostButton} onClick={onCancel} type="button">
            Cancelar
          </button>
          <button className={styles.primaryButton} onClick={onConfirm} type="button">
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
