import { fail, ok, requireUser } from "@/lib/server/api";
import { readDb } from "@/lib/server/db";
import { buildPatientReport } from "@/lib/server/patient-report";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    patientId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { patientId } = await context.params;
  const report = buildPatientReport(await readDb(), patientId);
  if (!report) {
    return fail(404, "Paciente nao encontrado.");
  }

  return ok(report);
}
