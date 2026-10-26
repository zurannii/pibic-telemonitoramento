import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ensureSchedulerStarted } from "@/lib/server/scheduler";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap"
});

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
    <html lang="pt-BR" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
