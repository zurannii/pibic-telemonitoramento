"use client";

import { useState } from "react";
import type { QuestionRecord } from "@/lib/shared/types";
import type { QuestionView } from "../types";
import { cn } from "../utils";
import { Icon } from "../components/Icon";
import { Card, EmptyState, Field, PageHeader, ui } from "../components/ui";

const THEME_OPTIONS = ["Dor", "Sono", "Alimentação", "Humor", "Atividade física", "Medicação", "Mobilidade"];

const RESPONSE_TYPES = [
  { value: "scale", label: "Escala 0–10" },
  { value: "yes-no", label: "Sim/Não" },
  { value: "multiple-choice", label: "Múltipla escolha" },
  { value: "text", label: "Texto livre" },
  { value: "audio", label: "Áudio" }
];

function responseTypeLabel(value: string) {
  return RESPONSE_TYPES.find((type) => type.value === value)?.label ?? value;
}

type QuestionsScreenProps = {
  onCreateQuestion: (payload: {
    title: string;
    text: string;
    simpleText: string;
    theme: string;
    responseType: string;
    defaultTimes: string;
  }) => Promise<void>;
  onDeleteQuestion: (questionId: string) => void;
  questionView: QuestionView;
  questions: QuestionRecord[];
  setQuestionView: (view: QuestionView) => void;
};

export function QuestionsScreen({
  onCreateQuestion,
  onDeleteQuestion,
  questionView,
  questions,
  setQuestionView
}: QuestionsScreenProps) {
  const [form, setForm] = useState({
    title: "",
    text: "",
    simpleText: "",
    theme: "Dor",
    responseType: "text",
    defaultTimes: "09:00"
  });
  const [busy, setBusy] = useState(false);

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      await onCreateQuestion(form);
      setForm({
        title: "",
        text: "",
        simpleText: "",
        theme: "Dor",
        responseType: "text",
        defaultTimes: "09:00"
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        actions={
          questionView === "library" ? (
            <button className={cn(ui.btn, ui.btnPrimary)} onClick={() => setQuestionView("create")} type="button">
              <Icon name="plus" />
              Criar pergunta
            </button>
          ) : null
        }
        subtitle="Crie e gerencie perguntas reutilizáveis para o acompanhamento dos pacientes"
        title="Perguntas de monitoramento"
      />

      <div className={ui.tabs} role="tablist" aria-label="Perguntas">
        <button
          aria-selected={questionView === "create"}
          className={cn(ui.tab, questionView === "create" && ui.tabActive)}
          onClick={() => setQuestionView("create")}
          role="tab"
          type="button"
        >
          <Icon name="plus" />
          Nova pergunta
        </button>
        <button
          aria-selected={questionView === "library"}
          className={cn(ui.tab, questionView === "library" && ui.tabActive)}
          onClick={() => setQuestionView("library")}
          role="tab"
          type="button"
        >
          <Icon name="questions" />
          Perguntas cadastradas ({questions.length})
        </button>
      </div>

      {questionView === "create" ? (
        <div className={ui.split}>
          <div className={ui.stack}>
            <Card icon="questions" subtitle="O texto será enviado ao paciente nos horários definidos" title="Nova pergunta">
              <Field hint="Uso interno da equipe — não é enviado ao paciente." label="Título da pergunta" required>
                <input
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="Ex.: Intensidade da dor"
                  value={form.title}
                />
              </Field>

              <Field label="Texto da pergunta" required>
                <textarea
                  onChange={(event) => updateField("text", event.target.value)}
                  placeholder="Ex.: Como está sua dor agora? Responda de 0 a 10."
                  rows={3}
                  value={form.text}
                />
              </Field>

              <Field
                hint="Usada para pacientes com baixo letramento. Para pacientes não alfabetizados, a mensagem é enviada em áudio."
                label="Versão em linguagem simples"
              >
                <textarea
                  onChange={(event) => updateField("simpleText", event.target.value)}
                  placeholder="Versão simplificada da pergunta…"
                  rows={2}
                  value={form.simpleText}
                />
              </Field>

              <div className={ui.field}>
                <span className={ui.label}>Tema</span>
                <div className={ui.chips}>
                  {THEME_OPTIONS.map((theme) => (
                    <button
                      aria-pressed={form.theme === theme}
                      className={cn(ui.chip, form.theme === theme && ui.chipActive)}
                      key={theme}
                      onClick={() => updateField("theme", theme)}
                      type="button"
                    >
                      {form.theme === theme ? <Icon name="check" /> : null}
                      {theme}
                    </button>
                  ))}
                </div>
                <input
                  aria-label="Outro tema"
                  className={ui.input}
                  onChange={(event) => updateField("theme", event.target.value)}
                  placeholder="Ou digite outro tema"
                  value={THEME_OPTIONS.includes(form.theme) ? "" : form.theme}
                />
              </div>

              <div className={ui.field}>
                <span className={ui.label}>Tipo de resposta</span>
                <div className={ui.chips}>
                  {RESPONSE_TYPES.map((type) => (
                    <button
                      aria-pressed={form.responseType === type.value}
                      className={cn(ui.chip, form.responseType === type.value && ui.chipActive)}
                      key={type.value}
                      onClick={() => updateField("responseType", type.value)}
                      type="button"
                    >
                      {form.responseType === type.value ? <Icon name="check" /> : null}
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <Field hint="Separe vários horários por vírgula." label="Horários padrão">
                <input
                  onChange={(event) => updateField("defaultTimes", event.target.value)}
                  placeholder="09:00, 15:00, 21:00"
                  value={form.defaultTimes}
                />
              </Field>
            </Card>

            <div className={ui.formBar}>
              <button className={cn(ui.btn, ui.btnPrimary)} disabled={busy} onClick={handleSave} type="button">
                <Icon name="check" />
                {busy ? "Salvando..." : "Salvar pergunta"}
              </button>
            </div>
          </div>

          <div className={ui.stack}>
            <Card icon="info" title="Boas práticas" variant="soft">
              <ul className={ui.bullets}>
                <li>Prefira perguntas curtas, com uma informação por vez.</li>
                <li>Seja específico: “dor acima de 7/10” é mais claro que “dor alta”.</li>
                <li>Use a escala 0–10 para acompanhar a evolução da dor.</li>
                <li>Depois de salvar, agende a pergunta na aba Plano do paciente.</li>
              </ul>
            </Card>
          </div>
        </div>
      ) : (
        <div className={ui.stackSm}>
          {questions.map((question) => (
            <Card key={question.id}>
              <div className={ui.cardHead}>
                <div className={ui.cardHeadText}>
                  <div className={ui.tagRow}>
                    <h2 className={ui.cardTitle}>{question.title}</h2>
                    <span className={ui.pill}>{question.theme}</span>
                    <span className={ui.pill}>{responseTypeLabel(question.responseType)}</span>
                  </div>
                </div>
                <button
                  aria-label={`Excluir ${question.title}`}
                  className={cn(ui.btn, ui.btnDanger, ui.btnSm)}
                  onClick={() => onDeleteQuestion(question.id)}
                  type="button"
                >
                  <Icon name="trash" />
                  Excluir
                </button>
              </div>
              <div className={cn(ui.bubble)} style={{ alignSelf: "stretch", maxWidth: "none" }}>
                “{question.text}”
              </div>
              {question.simpleText ? (
                <div className={ui.softBox}>
                  <p className={ui.sectionLabel}>Linguagem simples</p>
                  <p style={{ margin: "6px 0 0" }}>{question.simpleText}</p>
                </div>
              ) : null}
              <div className={ui.metaRow}>
                <span>
                  <Icon name="clock" />
                  {question.defaultTimes.join(", ") || "Sem horário padrão"}
                </span>
              </div>
            </Card>
          ))}

          {!questions.length ? (
            <Card>
              <EmptyState
                description="Crie a primeira pergunta para começar a montar as rotinas."
                icon="questions"
                title="Nenhuma pergunta cadastrada"
              />
            </Card>
          ) : null}
        </div>
      )}
    </>
  );
}
