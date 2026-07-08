"use client";

import styles from "./page.module.css";

import { AuthPanel } from "./home/components/AuthPanel";
import { ConfirmModal } from "./home/components/ConfirmModal";
import { Sidebar } from "./home/components/Sidebar";
import { ToastStack } from "./home/components/ToastStack";
import { Topbar } from "./home/components/Topbar";
import { AlertsScreen } from "./home/screens/AlertsScreen";
import { OverviewScreen } from "./home/screens/OverviewScreen";
import { PatientCreateScreen } from "./home/screens/PatientCreateScreen";
import { PatientProfileScreen } from "./home/screens/PatientProfileScreen";
import { PatientsScreen } from "./home/screens/PatientsScreen";
import { QuestionsScreen } from "./home/screens/QuestionsScreen";
import { ReportsScreen } from "./home/screens/ReportsScreen";
import { TeamScreen } from "./home/screens/TeamScreen";
import { useHomeController } from "./home/hooks/useHomeController";
import type { ScreenId } from "./home/types";

export default function Home() {
  const controller = useHomeController();

  if (controller.loadingSession) {
    return <main className={styles.loadingScreen}>Carregando plataforma...</main>;
  }

  if (!controller.bootstrap) {
    if (controller.loadError) {
      return (
        <>
          <main className={styles.loadingScreen}>
            <section className={styles.authPanel}>
              <div className={styles.authHero}>
                <span className={styles.authEyebrow}>Falha ao iniciar</span>
                <h1>Não conseguimos carregar a plataforma agora.</h1>
                <p>{controller.loadError}</p>
              </div>

              <section className={styles.authCard}>
                <p className={styles.infoText}>
                  A sessão será tentada novamente quando você recarregar a aplicação.
                </p>
                <div className={styles.formActions}>
                  <button className={styles.primaryButton} onClick={controller.retryInitialLoad} type="button">
                    Tentar novamente
                  </button>
                </div>
              </section>
            </section>
          </main>
          <ToastStack items={controller.toasts} />
        </>
      );
    }

    return (
      <>
        <AuthPanel busy={controller.working} onLogin={controller.handleLogin} onRegister={controller.handleRegister} />
        <ToastStack items={controller.toasts} />
      </>
    );
  }

  const bootstrap = controller.bootstrap!;
  const activeNav =
    controller.activeScreen === "patient-create" || controller.activeScreen === "patient-profile"
      ? "patients"
      : controller.activeScreen;
  const isPatientProfile = controller.activeScreen === "patient-profile";

  const renderScreen = () => {
    switch (controller.activeScreen) {
      case "overview":
        return (
          <OverviewScreen
            dashboard={bootstrap.dashboard}
            onOpenPatient={controller.openPatientProfile}
          />
        );
      case "patients":
        return (
          <PatientsScreen
            onDeletePatient={controller.confirmDeletePatient}
            onOpenPatientProfile={controller.openPatientProfile}
            patients={bootstrap.patients}
            selectScreen={controller.selectScreen}
          />
        );
      case "patient-create":
        return (
          <PatientCreateScreen
            onSubmit={controller.handleCreatePatient}
            professionals={bootstrap.users}
            selectScreen={controller.selectScreen}
          />
        );
      case "patient-profile":
        return controller.patientDetails ? (
          <PatientProfileScreen
            activeTab={controller.activePatientProfileTab}
            details={controller.patientDetails}
            onAddSchedule={controller.handleAddSchedule}
            onBack={() => controller.selectScreen("patients")}
            onDeleteSchedule={controller.confirmDeleteSchedule}
            onResolveAlert={controller.confirmResolveAlert}
            onSelectTab={controller.setActivePatientProfileTab}
            onSendMessage={controller.handleSendMessage}
            questions={bootstrap.questions}
            telegramInfo={bootstrap.telegram}
            users={bootstrap.users}
          />
        ) : (
          <main className={styles.loadingScreen}>Carregando perfil do paciente...</main>
        );
      case "alerts":
        return (
          <AlertsScreen
            alerts={bootstrap.alerts}
            onResolveAlert={controller.confirmResolveAlert}
            onViewPatient={controller.openPatientProfile}
          />
        );
      case "questions":
        return (
          <QuestionsScreen
            onCreateQuestion={controller.handleCreateQuestion}
            onDeleteQuestion={controller.confirmDeleteQuestion}
            questionView={controller.questionView}
            questions={bootstrap.questions}
            setQuestionView={controller.setQuestionView}
          />
        );
      case "reports":
        return (
          <ReportsScreen
            dashboard={bootstrap.dashboard}
            onGenerateReport={controller.generatePatientReport}
            patients={bootstrap.patients}
          />
        );
      case "team":
        return (
          <TeamScreen
            currentUser={bootstrap.currentUser}
            onCreateUser={controller.handleCreateUser}
            onDeleteUser={controller.confirmDeleteUser}
            onSaveTelegram={controller.handleSaveTelegram}
            onSaveWhatsApp={controller.handleSaveWhatsApp}
            patients={bootstrap.patients}
            telegramInfo={bootstrap.telegram}
            users={bootstrap.users}
            whatsappInfo={bootstrap.whatsapp}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className={`${styles.appShell} ${isPatientProfile ? styles.appShellSingle : ""}`}>
        {!isPatientProfile && <Sidebar activeNav={activeNav as Exclude<ScreenId, "patient-create">} onSelectScreen={controller.selectScreen} />}

        <main className={styles.dashboard}>
          <Topbar onLogout={controller.handleLogout} userName={bootstrap.currentUser.name} />
          <div className={styles.screenStack}>{renderScreen()}</div>
        </main>
      </div>

      <ConfirmModal
        actionLabel={controller.confirm.actionLabel}
        description={controller.confirm.description}
        onCancel={controller.closeConfirm}
        onConfirm={controller.confirm.onConfirm}
        open={controller.confirm.open}
        title={controller.confirm.title}
      />
      <ToastStack items={controller.toasts} />
    </>
  );
}
