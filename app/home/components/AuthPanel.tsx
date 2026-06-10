"use client";

import { useState } from "react";
import styles from "../../page.module.css";
import { cn } from "../utils";

type AuthPanelProps = {
  busy: boolean;
  onLogin: (payload: { email: string; password: string }) => Promise<void>;
  onRegister: (payload: {
    name: string;
    email: string;
    password: string;
    specialty: string;
  }) => Promise<void>;
};

export function AuthPanel({ busy, onLogin, onRegister }: AuthPanelProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    specialty: ""
  });

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  };

  const handleSubmit = async () => {
    if (mode === "login") {
      await onLogin({
        email: form.email,
        password: form.password
      });
      return;
    }

    await onRegister(form);
  };

  return (
    <main className={styles.authShell}>
      <section className={styles.authPanel}>
        <div className={styles.authHero}>
          <span className={styles.authEyebrow}>Telemonitoramento com WhatsApp</span>
          <h1>Ambiente pronto para teste com equipe, pacientes e automações.</h1>
          <p>
            Você pode entrar com a conta demo ou criar um profissional novo e já começar
            os testes reais do fluxo.
          </p>
          <div className={styles.authTip}>
            <strong>Conta demo</strong>
            <span>`demo@telemonitor.com`</span>
            <span>`demo123`</span>
          </div>
        </div>

        <section className={styles.authCard}>
          <div className={styles.segmentedControl}>
            <button
              className={cn(styles.segment, mode === "login" && styles.segmentActive)}
              onClick={() => setMode("login")}
              type="button"
            >
              Entrar
            </button>
            <button
              className={cn(styles.segment, mode === "register" && styles.segmentActive)}
              onClick={() => setMode("register")}
              type="button"
            >
              Criar acesso
            </button>
          </div>

          <div className={styles.formPanel}>
            {mode === "register" && (
              <>
                <label className={styles.field}>
                  <span>Nome</span>
                  <input
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="Seu nome"
                    value={form.name}
                  />
                </label>
                <label className={styles.field}>
                  <span>Especialidade</span>
                  <input
                    onChange={(event) => updateField("specialty", event.target.value)}
                    placeholder="Ex: Fisioterapia"
                    value={form.specialty}
                  />
                </label>
              </>
            )}

            <label className={styles.field}>
              <span>Email</span>
              <input
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="voce@clinica.com"
                type="email"
                value={form.email}
              />
            </label>

            <label className={styles.field}>
              <span>Senha</span>
              <input
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="Digite sua senha"
                type="password"
                value={form.password}
              />
            </label>
          </div>

          <button className={styles.primaryButton} disabled={busy} onClick={handleSubmit} type="button">
            {busy ? "Aguarde..." : mode === "login" ? "Entrar na plataforma" : "Criar usuário"}
          </button>
        </section>
      </section>
    </main>
  );
}
