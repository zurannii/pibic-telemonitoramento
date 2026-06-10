"use client";

import { useState } from "react";
import styles from "../../page.module.css";
import type { QuestionRecord } from "@/lib/shared/types";
import type { QuestionView } from "../types";
import { badgeTone, cn } from "../utils";
import { Icon } from "../components/Icon";

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
    <section className={styles.screen}>
      <div className={styles.pageHeading}>
        <h1>Perguntas de Monitoramento</h1>
        <p>Crie mensagens reutilizáveis para enviar automaticamente no WhatsApp.</p>
      </div>

      <section className={cn(styles.panel, styles.questionsWorkspace)}>
        <div className={styles.questionTabs}>
          <button
            className={cn(styles.questionTab, questionView === "create" && styles.questionTabActive)}
            onClick={() => setQuestionView("create")}
            type="button"
          >
            <Icon name="questions" className={styles.questionTabIcon} />
            Criar Pergunta
          </button>
          <button
            className={cn(styles.questionTab, questionView === "library" && styles.questionTabActive)}
            onClick={() => setQuestionView("library")}
            type="button"
          >
            <Icon name="idea" className={styles.questionTabIcon} />
            Biblioteca ({questions.length})
          </button>
        </div>

        <div className={styles.questionsWorkspaceBody}>
          {questionView === "create" ? (
            <section className={styles.questionComposerCard}>
              <h2>Nova Pergunta</h2>

              <div className={styles.questionFormStack}>
                <label className={cn(styles.field, styles.questionSpanFull)}>
                  <span>Título *</span>
                  <input onChange={(event) => updateField("title", event.target.value)} value={form.title} />
                </label>

                <label className={cn(styles.field, styles.questionSpanFull)}>
                  <span>Texto da Pergunta *</span>
                  <textarea
                    onChange={(event) => updateField("text", event.target.value)}
                    rows={3}
                    value={form.text}
                  />
                </label>

                <label className={cn(styles.field, styles.questionSpanFull)}>
                  <span>Versão mais simples</span>
                  <textarea
                    onChange={(event) => updateField("simpleText", event.target.value)}
                    rows={2}
                    value={form.simpleText}
                  />
                </label>

                <div className={styles.questionInlineGrid}>
                  <label className={styles.field}>
                    <span>Tema</span>
                    <input onChange={(event) => updateField("theme", event.target.value)} value={form.theme} />
                  </label>
                  <label className={styles.field}>
                    <span>Tipo de resposta</span>
                    <select
                      onChange={(event) => updateField("responseType", event.target.value)}
                      value={form.responseType}
                    >
                      <option value="text">Texto livre</option>
                      <option value="scale">Escala 0-10</option>
                      <option value="yes-no">Sim/Não</option>
                      <option value="multiple-choice">Múltipla escolha</option>
                      <option value="audio">Áudio</option>
                    </select>
                  </label>
                </div>

                <label className={cn(styles.field, styles.questionSpanFull)}>
                  <span>Horários padrão</span>
                  <input
                    onChange={(event) => updateField("defaultTimes", event.target.value)}
                    placeholder="09:00, 15:00, 21:00"
                    value={form.defaultTimes}
                  />
                </label>

                <section className={styles.questionPreviewBox}>
                  <div className={styles.questionPreviewHeader}>
                    <Icon name="eye" className={styles.questionPreviewIcon} />
                    <span>Pré-visualização no WhatsApp</span>
                  </div>

                  <div className={styles.questionPreviewBubble}>
                    <small>{form.defaultTimes.split(",")[0] || "09:00"}</small>
                    <p>{form.simpleText || form.text || "[Sua pergunta aparecerá aqui]"}</p>
                  </div>
                </section>
              </div>

              <div className={styles.questionFooterActions}>
                <button className={styles.primaryButton} disabled={busy} onClick={handleSave} type="button">
                  <span className={styles.buttonContent}>
                    <Icon name="save" className={styles.buttonIcon} />
                    {busy ? "Salvando..." : "Salvar Pergunta"}
                  </span>
                </button>
              </div>
            </section>
          ) : (
            <div className={styles.questionsLibrary}>
              {questions.map((question) => (
                <article key={question.id} className={cn(styles.panel, styles.questionCard)}>
                  <div className={styles.questionCardHead}>
                    <div>
                      <h2>{question.title}</h2>
                      <p>{question.text}</p>
                    </div>
                    <div className={styles.badgeRow}>
                      <span className={cn(styles.badge, badgeTone(question.theme))}>{question.theme}</span>
                      <span className={cn(styles.badge, styles.badgeSoft)}>
                        {question.defaultTimes.join(", ") || "Sem horário padrão"}
                      </span>
                    </div>
                  </div>
                  <p className={styles.questionNote}>
                    Linguagem simples: {question.simpleText || "Não informada"}
                  </p>
                  <div className={styles.questionActions}>
                    <button className={styles.tableButton} onClick={() => onDeleteQuestion(question.id)} type="button">
                      Excluir
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
