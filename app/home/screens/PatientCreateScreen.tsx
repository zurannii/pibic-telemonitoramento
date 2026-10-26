"use client";

import { useState } from "react";
import type { PublicUser } from "@/lib/shared/types";
import type { ScreenId } from "../types";
import { Icon } from "../components/Icon";
import { cn } from "../utils";
import { BackLink, Card, Field, IconChip, PageHeader, ui } from "../components/ui";

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

  const formatOptions: Array<{
    value: PatientForm["preferredResponseFormat"];
    icon: "text" | "buttons" | "microphone";
    title: string;
    description: string;
  }> = [
    { value: "text", icon: "text", title: "Texto", description: "Digita a resposta" },
    { value: "buttons", icon: "buttons", title: "Botões", description: "Toca em opções prontas" },
    { value: "audio", icon: "microphone", title: "Áudio", description: "Responde falando" }
  ];

  const setReadingAccessibility = (requiresAudioMessages: boolean) => {
    setForm((current) => ({
      ...current,
      requiresAudioMessages,
      preferredResponseFormat: requiresAudioMessages ? "audio" : "text"
    }));
  };

  return (
    <>
      <BackLink label="Voltar para lista de pacientes" onClick={() => selectScreen("patients")} />
      <PageHeader
        subtitle="Cadastre um novo paciente no acompanhamento assistido"
        title="Adicionar novo paciente"
      />

      <div className={ui.split}>
        <div className={ui.stack}>
          <Card icon="user" subtitle="Campos com * são obrigatórios" title="Informações básicas">
            <div className={ui.fieldGrid}>
              <Field className={ui.spanAll} label="Nome completo" required>
                <input
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Ex.: Maria da Silva"
                  value={form.name}
                />
              </Field>
              <Field label="Idade" required>
                <input
                  inputMode="numeric"
                  onChange={(event) => updateField("age", event.target.value)}
                  placeholder="Ex.: 58"
                  value={form.age}
                />
              </Field>
              <Field label="Telefone / WhatsApp" required>
                <input
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="(81) 9 0000-0000"
                  type="tel"
                  value={form.phone}
                />
              </Field>
              <Field
                className={ui.spanAll}
                hint="Escolha uma sugestão ou digite outra condição."
                label="Condição principal"
                required
              >
                <input
                  list="patient-condition-suggestions"
                  onChange={(event) => updateField("condition", event.target.value)}
                  placeholder="Ex.: Fibromialgia"
                  value={form.condition}
                />
                <datalist id="patient-condition-suggestions">
                  {CONDITION_SUGGESTIONS.map((condition) => (
                    <option key={condition} value={condition} />
                  ))}
                </datalist>
              </Field>
            </div>
          </Card>

          <Card
            icon="settings"
            subtitle="Define como e quando o paciente será contatado"
            title="Configuração do acompanhamento"
          >
            <Field label="Profissional responsável">
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
            </Field>

            <div className={ui.field}>
              <span className={ui.label}>Canal preferido</span>
              <div className={ui.optionGrid}>
                {(
                  [
                    { value: "telegram", icon: "send", title: "Telegram", description: "Mensagens pelo bot do Telegram" },
                    { value: "whatsapp", icon: "phone", title: "WhatsApp", description: "WhatsApp Cloud API" }
                  ] as const
                ).map((option) => (
                  <button
                    aria-pressed={form.preferredChannel === option.value}
                    className={cn(ui.option, form.preferredChannel === option.value && ui.optionActive)}
                    key={option.value}
                    onClick={() => updateField("preferredChannel", option.value)}
                    type="button"
                  >
                    <IconChip icon={option.icon} tone={form.preferredChannel === option.value ? "white" : "gray"} />
                    <span className={ui.optionText}>
                      <strong>{option.title}</strong>
                      <small>{option.description}</small>
                    </span>
                    <span className={ui.optionCheck}>
                      {form.preferredChannel === option.value ? <Icon name="check" /> : null}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className={ui.field}>
              <span className={ui.label}>Acessibilidade de leitura</span>
              <div className={ui.optionGrid}>
                <button
                  aria-pressed={!form.requiresAudioMessages}
                  className={cn(ui.option, !form.requiresAudioMessages && ui.optionActive)}
                  onClick={() => setReadingAccessibility(false)}
                  type="button"
                >
                  <IconChip icon="text" tone={!form.requiresAudioMessages ? "white" : "gray"} />
                  <span className={ui.optionText}>
                    <strong>Paciente alfabetizado</strong>
                    <small>Recebe as mensagens em texto</small>
                  </span>
                  <span className={ui.optionCheck}>
                    {!form.requiresAudioMessages ? <Icon name="check" /> : null}
                  </span>
                </button>
                <button
                  aria-pressed={form.requiresAudioMessages}
                  className={cn(ui.option, form.requiresAudioMessages && ui.optionActive)}
                  onClick={() => setReadingAccessibility(true)}
                  type="button"
                >
                  <IconChip icon="volume" tone={form.requiresAudioMessages ? "white" : "gray"} />
                  <span className={ui.optionText}>
                    <strong>Não alfabetizado</strong>
                    <small>Mensagens enviadas em áudio</small>
                  </span>
                  <span className={ui.optionCheck}>
                    {form.requiresAudioMessages ? <Icon name="check" /> : null}
                  </span>
                </button>
              </div>
              <span className={ui.hint}>
                Quando ativado, perguntas e mensagens serão narradas automaticamente.
              </span>
            </div>

            <div className={ui.field}>
              <span className={ui.label}>Formato preferencial de resposta</span>
              <div className={ui.optionGrid}>
                {formatOptions.map((option) => {
                  const active = form.preferredResponseFormat === option.value;
                  return (
                    <button
                      aria-pressed={active}
                      className={cn(ui.option, active && ui.optionActive)}
                      disabled={form.requiresAudioMessages}
                      key={option.value}
                      onClick={() => updateField("preferredResponseFormat", option.value)}
                      type="button"
                    >
                      <IconChip icon={option.icon} tone={active ? "white" : "gray"} />
                      <span className={ui.optionText}>
                        <strong>{option.title}</strong>
                        <small>{option.description}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
              <span className={ui.hint}>Áudios recebidos são transcritos automaticamente para a equipe.</span>
            </div>

            <div className={ui.fieldGrid}>
              <Field label="Início da janela de contato">
                <input
                  onChange={(event) => updateField("contactWindowStart", event.target.value)}
                  type="time"
                  value={form.contactWindowStart}
                />
              </Field>
              <Field label="Fim da janela de contato">
                <input
                  onChange={(event) => updateField("contactWindowEnd", event.target.value)}
                  type="time"
                  value={form.contactWindowEnd}
                />
              </Field>
            </div>

            <Field label="Observações iniciais">
              <textarea
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Digite observações relevantes para a equipe…"
                rows={4}
                value={form.notes}
              />
            </Field>
          </Card>

          <div className={ui.formBar}>
            <button className={cn(ui.btn, ui.btnSecondary)} onClick={() => selectScreen("patients")} type="button">
              Cancelar
            </button>
            <button className={cn(ui.btn, ui.btnPrimary)} disabled={busy} onClick={handleSave} type="button">
              <Icon name="check" />
              {busy ? "Salvando..." : "Salvar paciente"}
            </button>
          </div>
        </div>

        <div className={ui.stack}>
          <Card icon="info" title="Antes de salvar" variant="soft">
            <ul className={ui.bullets}>
              <li>Campos marcados com * são obrigatórios.</li>
              <li>A acessibilidade de leitura define se o paciente recebe mensagens em áudio.</li>
              <li>Pacientes no Telegram recebem um link de vínculo no perfil após o cadastro.</li>
              <li>A equipe responsável pode ser alterada depois.</li>
            </ul>
          </Card>
          <Card icon="lock" title="Privacidade">
            <p className={ui.pageSub}>
              Os dados clínicos ficam visíveis apenas para a equipe com acesso à plataforma.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
