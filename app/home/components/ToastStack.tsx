"use client";

import styles from "../../page.module.css";
import { cn } from "../utils";

export type ToastItem = {
  id: string;
  tone: "success" | "error";
  message: string;
};

type ToastStackProps = {
  items: ToastItem[];
};

export function ToastStack({ items }: ToastStackProps) {
  return (
    <div className={styles.toastStack}>
      {items.map((item) => (
        <article
          key={item.id}
          className={cn(styles.toastCard, item.tone === "error" && styles.toastCardError)}
        >
          {item.message}
        </article>
      ))}
    </div>
  );
}
