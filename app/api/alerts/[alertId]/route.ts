import { fail, ok, readString, requireUser } from "@/lib/server/api";
import { updateDb, updatePatientStatusFromAlerts } from "@/lib/server/db";
import { nowIso } from "@/lib/server/utils";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    alertId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { user, response } = await requireUser();
  if (!user) {
    return response;
  }

  const { alertId } = await context.params;
  const body = await request.json().catch(() => null);
  const status = readString(body?.status);

  const alert = await updateDb((db) => {
    const current = db.alerts.find((item) => item.id === alertId);
    if (!current) {
      return null;
    }

    if (status === "resolved") {
      current.status = "resolved";
      current.resolvedAt = nowIso();
      current.assignedToUserId = user.id;
    }

    const patient = db.patients.find((item) => item.id === current.patientId);
    if (patient) {
      updatePatientStatusFromAlerts(patient, db.alerts);
    }

    return current;
  });

  if (!alert) {
    return fail(404, "Alerta não encontrado.");
  }

  return ok({ alert });
}
