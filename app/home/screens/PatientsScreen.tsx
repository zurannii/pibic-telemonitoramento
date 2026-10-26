"use client";

import { useMemo, useState } from "react";
import type { PatientListItem } from "@/lib/shared/types";
import { cn } from "../utils";
import { Icon } from "../components/Icon";
import type { ScreenId } from "../types";
import {
  Avatar,
  Card,
  EmptyState,
  Field,
  PageHeader,
  PatientStatusTag,
  Tag,
  formatDateTime,
  timeAgo,
  ui
} from "../components/ui";

type PatientsScreenProps = {
  onDeletePatient: (patientId: string) => void;
  onOpenPatientProfile: (patientId: string) => void;
  patients: PatientListItem[];
  selectScreen: (screen: ScreenId) => void;
};

function ChannelCell({ patient }: { patient: PatientListItem }) {
  const isTelegram = patient.preferredChannel === "telegram";
  return (
    <div className={ui.tagRow}>
      <span className={ui.pill}>
        <Icon name={isTelegram ? "send" : "phone"} />
        {isTelegram ? "Telegram" : "WhatsApp"}
      </span>
      {isTelegram && !patient.telegramLinkedAt ? <Tag tone="warning">Aguardando /start</Tag> : null}
      {patient.requiresAudioMessages ? (
        <Tag icon="volume" tone="purple">
          Áudio assistido
        </Tag>
      ) : null}
    </div>
  );
}

export function PatientsScreen({
  onDeletePatient,
  onOpenPatientProfile,
  patients,
  selectScreen
}: PatientsScreenProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PatientListItem["status"]>("all");

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    return patients.filter((patient) => {
      if (statusFilter !== "all" && patient.status !== statusFilter) return false;
      if (!term) return true;
      return [patient.name, patient.condition, patient.phone].some((field) =>
        field.toLowerCase().includes(term)
      );
    });
  }, [patients, search, statusFilter]);

  return (
    <>
      <PageHeader
        actions={
          <button className={cn(ui.btn, ui.btnPrimary)} onClick={() => selectScreen("patient-create")} type="button">
            <Icon name="plus" />
            Adicionar paciente
          </button>
        }
        subtitle="Busque, filtre e acompanhe os pacientes ativos"
        title="Pacientes"
      />

      <Card>
        <div className={ui.filterRow}>
          <Field className={ui.filterGrow} label="Buscar">
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nome, condição ou telefone"
              type="search"
              value={search}
            />
          </Field>
          <Field label="Status">
            <select
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              value={statusFilter}
            >
              <option value="all">Todos</option>
              <option value="critical">Crítico</option>
              <option value="attention">Atenção</option>
              <option value="stable">Estável</option>
            </select>
          </Field>
          {search || statusFilter !== "all" ? (
            <button
                className={cn(ui.btn, ui.btnGhost)}
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                type="button"
              >
                Limpar filtros
              </button>
          ) : null}
        </div>
      </Card>

      <Card className={ui.onlyDesktop} variant="flush">
        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Idade</th>
                <th>Canal</th>
                <th>Última resposta</th>
                <th>Status</th>
                <th>Responsável</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id}>
                  <td>
                    <div className={ui.cellUser}>
                      <Avatar name={patient.name} size="sm" />
                      <div>
                        <strong>{patient.name}</strong>
                        <small>{patient.condition}</small>
                      </div>
                    </div>
                  </td>
                  <td>{patient.age}</td>
                  <td>
                    <ChannelCell patient={patient} />
                  </td>
                  <td>
                    <span
                      className={ui.cellInline}
                      title={patient.lastResponseAt ? formatDateTime(patient.lastResponseAt) : undefined}
                    >
                      <Icon name="clock" />
                      {timeAgo(patient.lastResponseAt)}
                    </span>
                  </td>
                  <td>
                    <PatientStatusTag status={patient.status} />
                  </td>
                  <td>{patient.responsibleName ?? "Sem responsável"}</td>
                  <td>
                    <div className={ui.actions} style={{ flexWrap: "nowrap" }}>
                      <button
                        className={cn(ui.btn, ui.btnSecondary, ui.btnSm)}
                        onClick={() => onOpenPatientProfile(patient.id)}
                        type="button"
                      >
                        Ver perfil
                      </button>
                      <button
                        aria-label={`Excluir ${patient.name}`}
                        className={cn(ui.btn, ui.btnDanger, ui.btnIcon)}
                        onClick={() => onDeletePatient(patient.id)}
                        title="Excluir paciente"
                        type="button"
                      >
                        <Icon name="trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!filteredPatients.length ? (
          <EmptyState
            description="Tente buscar por outro nome, condição ou telefone."
            title="Nenhum paciente encontrado"
          />
        ) : null}

        <div className={ui.tableFooter}>
          <span>
            Mostrando {filteredPatients.length} de {patients.length} paciente(s)
          </span>
        </div>
      </Card>

      <section aria-label="Pacientes encontrados" className={cn(ui.onlyMobile, ui.stackSm)} style={{ flexDirection: "column" }}>
        {filteredPatients.map((patient) => (
          <Card key={patient.id}>
            <div className={ui.cellUser}>
              <Avatar name={patient.name} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>{patient.name}</strong>
                <small>
                  {patient.age} anos · {patient.condition}
                </small>
              </div>
              <PatientStatusTag status={patient.status} />
            </div>
            <ChannelCell patient={patient} />
            <div className={ui.infoGrid}>
              <div className={ui.info}>
                <span>Responsável</span>
                <strong>{patient.responsibleName ?? "Não definido"}</strong>
              </div>
              <div className={ui.info}>
                <span>Última resposta</span>
                <strong>{timeAgo(patient.lastResponseAt, "Nenhuma resposta")}</strong>
              </div>
            </div>
            <div className={ui.formBar}>
              <button className={cn(ui.btn, ui.btnDanger)} onClick={() => onDeletePatient(patient.id)} type="button">
                Excluir
              </button>
              <button
                className={cn(ui.btn, ui.btnPrimary)}
                onClick={() => onOpenPatientProfile(patient.id)}
                type="button"
              >
                Abrir perfil
              </button>
            </div>
          </Card>
        ))}

        {!filteredPatients.length ? (
          <EmptyState
            description="Tente buscar por outro nome, condição ou telefone."
            title="Nenhum paciente encontrado"
          />
        ) : null}
      </section>
    </>
  );
}
