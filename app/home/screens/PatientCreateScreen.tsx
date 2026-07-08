"use client";

import { useState } from "react";
import styles from "../../page.module.css";
import type { PublicUser } from "@/lib/shared/types";
import type { ScreenId } from "../types";
import { Icon } from "../components/Icon";
import { cn } from "../utils";

type PatientCreateScreenProps = {
  onSubmit: (payload: {
    name: string;
    age: string;
    phone: string;
    condition: string;
    responsibleUserId: string;
    preferredResponseFormat: "text" | "audio" | "buttons";
    requiresAudioMessages: boolean;
    preferredChannel: "whatsapp" | "telegram";
    contactWindowStart: string;
    contactWindowEnd: string;
    notes: string;
  }) => Promise<void>;
  professionals: PublicUser[];
  selectScreen: (screen: ScreenId) => void;
};

const CONDITION_SUGGESTIONS = [
  "Artrite reumatoide",
  "Fibromialgia",
  "Dor crônica lombar",
  "Dor crônica musculoesquelética",
  "Artrose",
  "Lúpus eritematoso sistêmico",
  "Espondilite anquilosante",
  "Neuropatia periférica",
  "Pós-operatório ortopédico",
  "Cefaleia crônica"
];

type PatientForm = {
  name: string;
  age: string;
  phone: string;
  condition: string;
  responsibleUserId: string;
  preferredResponseFormat: "text" | "audio" | "buttons";
  requiresAudioMessages: boolean;
  preferredChannel: "whatsapp" | "telegram";
  contactWindowStart: string;
  contactWindowEnd: string;
  notes: string;
};

export function PatientCreateScreen({ onSubmit, professionals, selectScreen }: PatientCreateScreenProps) {
  const [form, setForm] = useState<PatientForm>({
    name: "",
    age: "",
    phone: "",
    condition: "",
    responsibleUserId: professionals[0]?.id ?? "",
    preferredResponseFormat: "text",
    requiresAudioMessages: false,
    preferredChannel: "whatsapp",
    contactWindowStart: "09:00",
    contactWindowEnd: "21:00",
    notes: ""
  });
  const [busy, setBusy] = useState(false);

  const updateField = <Key extends keyof PatientForm>(key: Key, value: PatientForm[Key]) => {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      await onSubmit(form);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.screen}>
      <button className={styles.backLink} onClick={() => selectScreen("patients")} type="button">
        {"<-"} Voltar para Lista de Pacientes
      </button>

      <div className={styles.pageHeading}>
        <h1>Adicionar Novo Paciente</h1>
        <p>O cadastro ja sai pronto para rotinas por WhatsApp e tambem para vinculo com Telegram.</p>
      </div>

      <section className={cn(styles.panel, styles.formPanel)}>
        <h2>Informacoes Basicas</h2>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>Nome Completo *</span>
            <input onChange={(event) => updateField("name", event.target.value)} value={form.name} />
          </label>
          <label className={styles.field}>
            <span>Idade *</span>
            <input onChange={(event) => updateField("age", event.target.value)} value={form.age} />
          </label>
          <label className={styles.field}>
            <span>Telefone / WhatsApp *</span>
            <input onChange={(event) => updateField("phone", event.target.value)} value={form.phone} />
          </label>
          <label className={styles.field}>
            <span>Condicao Principal *</span>
            <input
              list="patient-condition-suggestions"
              onChange={(event) => updateField("condition", event.target.value)}
              placeholder="Selecione ou digite outra condição"
              value={form.condition}
            />
            <datalist id="patient-condition-suggestions">
              {CONDITION_SUGGESTIONS.map((condition) => (
                <option key={condition} value={condition} />
              ))}
            </datalist>
          </label>
        </div>
      </section>

      <section className={cn(styles.panel, styles.formPanel)}>
        <h2>Configuracao de Acompanhamento</h2>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>Profissional Responsavel</span>
            <select
              onChange={(event) => updateField("responsibleUserId", event.target.value)}
              value={form.responsibleUserId}
            >
              <option value="">Selecionar profissional</option>
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Canal Preferido</span>
            <select
              onChange={(event) =>
                updateField(
                  "preferredChannel",
                  event.target.value as PatientForm["preferredChannel"]
                )
              }
              value={form.preferredChannel}
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>Formato Preferencial</span>
            <select
              disabled={form.requiresAudioMessages}
              onChange={(event) =>
                updateField(
                  "preferredResponseFormat",
                  event.target.value as PatientForm["preferredResponseFormat"]
                )
              }
              value={form.preferredResponseFormat}
            >
              <option value="text">Texto</option>
              <option value="buttons">Botoes</option>
              <option value="audio">Audio</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>Acessibilidade de leitura</span>
            <select
              onChange={(event) => {
                const requiresAudioMessages = event.target.value === "audio";
                setForm((current) => ({
                  ...current,
                  requiresAudioMessages,
                  preferredResponseFormat: requiresAudioMessages ? "audio" : "text"
                }));
              }}
              value={form.requiresAudioMessages ? "audio" : "standard"}
            >
              <option value="standard">Paciente alfabetizado</option>
              <option value="audio">Não alfabetizado — enviar mensagens em áudio</option>
            </select>
            <small>
              Quando ativado, perguntas e mensagens serão narradas automaticamente.
            </small>
          </label>
          <label className={styles.field}>
            <span>Melhor horario inicial</span>
            <input
              onChange={(event) => updateField("contactWindowStart", event.target.value)}
              type="time"
              value={form.contactWindowStart}
            />
          </label>
          <label className={styles.field}>
            <span>Fim da janela de contato</span>
            <input
              onChange={(event) => updateField("contactWindowEnd", event.target.value)}
              type="time"
              value={form.contactWindowEnd}
            />
          </label>
        </div>
      </section>

      <section className={cn(styles.panel, styles.formPanel)}>
        <h2>Observacoes Iniciais</h2>
        <label className={styles.field}>
          <span>Observacoes relevantes para a equipe...</span>
          <textarea
            onChange={(event) => updateField("notes", event.target.value)}
            rows={5}
            value={form.notes}
          />
        </label>
      </section>

      <div className={styles.formActions}>
        <button className={styles.ghostButton} onClick={() => selectScreen("patients")} type="button">
          Cancelar
        </button>
        <button className={styles.primaryButton} disabled={busy} onClick={handleSave} type="button">
          <span className={styles.buttonContent}>
            <Icon name="save" className={styles.buttonIcon} />
            {busy ? "Salvando..." : "Salvar Paciente"}
          </span>
        </button>
      </div>
    </section>
  );
}
