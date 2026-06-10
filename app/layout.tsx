import type { Metadata } from "next";
import "./globals.css";
import { ensureSchedulerStarted } from "@/lib/server/scheduler";

export const metadata: Metadata = {
  title: "Plataforma de Telemonitoramento",
  description: "Dashboard multipagina inspirado no design do Figma para o projeto PIBIC."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  ensureSchedulerStarted();

  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
