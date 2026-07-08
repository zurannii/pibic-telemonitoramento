"use client";

import { useMemo, useState } from "react";
import styles from "../../page.module.css";
import type { PatientListItem } from "@/lib/shared/types";
import { badgeTone, cn } from "../utils";
import { Icon } from "../components/Icon";
import type { ScreenId } from "../types";

type PatientsScreenProps = {
  onDeletePatient: (patientId: string) => void;
  onOpenPatientProfile: (patientId: string) => void;
  patients: PatientListItem[];
  selectScreen: (screen: ScreenId) => void;
};

function translateStatus(status: PatientListItem["status"]) {
  if (status === "critical") return "Critico";
  if (status === "attention") return "Atencao";
  return "Estavel";
}

function translateChannel(channel: PatientListItem["preferredChannel"]) {
  return channel === "telegram" ? "Telegram" : "WhatsApp";
}

export function PatientsScreen({
  onDeletePatient,
  onOpenPatientProfile,
  patients,
  selectScreen
}: PatientsScreenProps) {
  const [search, setSearch] = useState("");

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return patients;
    }

    return patients.filter((patient) =>
      [patient.name, patient.condition, patient.phone].some((field) => field.toLowerCase().includes(term))
    );
  }, [patients, search]);

  return (
    <section className={styles.screen}>
      <div className={styles.pageHead}>
        <div className={styles.pageHeading}>
          <h1>Lista de Pacientes</h1>
          <p>Cadastre, acompanhe e abra o perfil de cada paciente.</p>
        </div>
        <button className={styles.primaryButton} onClick={() => selectScreen("patient-create")} type="button">
          Adicionar Paciente
        </button>
      </div>

      <div className={cn(styles.panel, styles.compactPanel)}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarSearch}>
            <Icon name="search" className={styles.toolbarIcon} />
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, condicao ou telefone..."
              type="search"
              value={search}
            />
          </div>
        </div>
      </div>

      <article className={cn(styles.panel, styles.tablePanel)}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Idade</th>
              <th>Contato</th>
              <th>Canal</th>
              <th>Ultima Resposta</th>
              <th>Status</th>
              <th>Responsavel</th>
              <th>Acao</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((patient) => (
              <tr key={patient.id}>
                <td data-label="Nome">{patient.name}</td>
                <td data-label="Idade">{patient.age}</td>
                <td data-label="Contato">{patient.phone}</td>
                <td data-label="Canal">
                  {translateChannel(patient.preferredChannel)}
                  {patient.preferredChannel === "telegram" && !patient.telegramLinkedAt ? " (aguardando /start)" : ""}
                  {patient.requiresAudioMessages ? " • áudio assistido" : ""}
                </td>
                <td data-label="Ultima resposta">
                  {patient.lastResponseAt
                    ? new Date(patient.lastResponseAt).toLocaleString("pt-BR")
                    : "Sem resposta ainda"}
                </td>
                <td data-label="Status">
                  <span className={cn(styles.badge, badgeTone(translateStatus(patient.status)))}>
                    {translateStatus(patient.status)}
                  </span>
                </td>
                <td data-label="Responsavel">{patient.responsibleName ?? "Sem responsavel"}</td>
                <td data-label="Acoes">
                  <div className={styles.tableActionRow}>
                    <button className={styles.tableButton} onClick={() => onOpenPatientProfile(patient.id)} type="button">
                      Ver Perfil
                    </button>
                    <button className={styles.tableButton} onClick={() => onDeletePatient(patient.id)} type="button">
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.tableFooter}>
          <span>Mostrando {filteredPatients.length} paciente(s)</span>
        </div>
      </article>
    </section>
  );
}
