import { ok, requireUser } from "@/lib/server/api";
import { buildBootstrapPayload } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET() {
  const { user, response } = await requireUser();
  if (!user) {
    return response;
  }

  return ok(await buildBootstrapPayload(user));
}
