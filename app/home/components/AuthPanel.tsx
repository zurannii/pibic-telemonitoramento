"use client";

import { useState } from "react";
import { cn } from "../utils";
import { Icon } from "./Icon";
import { Field, ui } from "./ui";

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
    <main className={cn(ui.root, ui.auth)}>
      <section className={ui.authPanel}>
        <div className={ui.authHero}>
          <Icon name="brand" className={ui.brandLogo} />
          <span className={ui.authEyebrow}>Telemonitoramento · Fibromialgia e doenças crônicas</span>
          <h1>Acompanhamento remoto de pacientes, com a equipe no mesmo lugar.</h1>
          <p>
            Entre com a conta demo ou crie um acesso de profissional para começar a usar o
            fluxo de acompanhamento.
          </p>
          <div className={ui.authTip}>
            <strong>Conta demo</strong>
            <code>demo@telemonitor.com</code>
            <code>demo123</code>
          </div>
        </div>

        <section className={ui.authCard}>
          <div className={ui.segmented} role="tablist" aria-label="Tipo de acesso">
            <button
              aria-selected={mode === "login"}
              className={cn(ui.segment, mode === "login" && ui.segmentActive)}
              onClick={() => setMode("login")}
              role="tab"
              type="button"
            >
              Entrar
            </button>
            <button
              aria-selected={mode === "register"}
              className={cn(ui.segment, mode === "register" && ui.segmentActive)}
              onClick={() => setMode("register")}
              role="tab"
              type="button"
            >
              Criar acesso
            </button>
          </div>

          <div className={ui.stackSm}>
            {mode === "register" && (
              <>
                <Field label="Nome">
                  <input
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="Seu nome"
                    value={form.name}
                  />
                </Field>
                <Field label="Especialidade">
                  <input
                    onChange={(event) => updateField("specialty", event.target.value)}
                    placeholder="Ex.: Fisioterapia"
                    value={form.specialty}
                  />
                </Field>
              </>
            )}

            <Field label="E-mail">
              <input
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="voce@clinica.com"
                type="email"
                value={form.email}
              />
            </Field>

            <Field label="Senha">
              <input
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="Digite sua senha"
                type="password"
                value={form.password}
              />
            </Field>
          </div>

          <button
            className={cn(ui.btn, ui.btnPrimary, ui.btnBlock)}
            disabled={busy}
            onClick={handleSubmit}
            type="button"
          >
            {busy ? "Aguarde..." : mode === "login" ? "Entrar na plataforma" : "Criar usuário"}
          </button>
        </section>
      </section>
    </main>
  );
}
