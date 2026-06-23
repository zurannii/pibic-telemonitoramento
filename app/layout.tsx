import type { Metadata } from "next";
import "./globals.css";
import { ensureSchedulerStarted } from "@/lib/server/scheduler";

export const metadata: Metadata = {
  title: "Telemonitoramento Clinico | PIBIC",
  description: "Dashboard clinico de telemonitoramento com foco em pacientes, equipe e integrações."
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
