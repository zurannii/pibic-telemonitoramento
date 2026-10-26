"use client";

import { cn } from "../utils";
import { ui } from "./ui";

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
    <div aria-live="polite" className={ui.toastStack}>
      {items.map((item) => (
        <article key={item.id} className={cn(ui.toast, item.tone === "error" && ui.toastError)} role="status">
          {item.message}
        </article>
      ))}
    </div>
  );
}
