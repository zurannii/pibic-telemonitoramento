"use client";

import { ui } from "./ui";

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
    <div className={ui.modalBackdrop} role="presentation">
      <div aria-modal="true" className={ui.modal} role="dialog">
        <h2>{title}</h2>
        <p>{description}</p>
        <div className={`${ui.formBar}`}>
          <button className={`${ui.btn} ${ui.btnSecondary}`} onClick={onCancel} type="button">
            Cancelar
          </button>
          <button className={`${ui.btn} ${ui.btnPrimary}`} onClick={onConfirm} type="button">
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
