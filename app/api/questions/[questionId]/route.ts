import { fail, ok, readBoolean, readString, requireUser } from "@/lib/server/api";
import { updateDb } from "@/lib/server/db";
import { nowIso, parseCommaTimes } from "@/lib/server/utils";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    questionId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { user, response } = await requireUser();
  if (!user) {
    return response;
  }

  const { questionId } = await context.params;
  const body = await request.json().catch(() => null);

  const question = await updateDb((db) => {
    const current = db.questions.find((item) => item.id === questionId);
    if (!current) {
      return null;
    }

    const title = readString(body?.title);
    const text = readString(body?.text);
    const simpleText = readString(body?.simpleText);
    const theme = readString(body?.theme);
    const responseType = readString(body?.responseType);
    const defaultTimes = parseCommaTimes(readString(body?.defaultTimes));

    if (title) current.title = title;
    if (text) current.text = text;
    if (simpleText) current.simpleText = simpleText;
    if (theme) current.theme = theme;
    if (responseType) current.responseType = responseType as typeof current.responseType;
    if (defaultTimes.length) current.defaultTimes = defaultTimes;
    if (body?.isActive !== undefined) current.isActive = readBoolean(body.isActive);
    current.updatedAt = nowIso();

    return current;
  });

  if (!question) {
    return fail(404, "Pergunta não encontrada.");
  }

  return ok({ question });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { user, response } = await requireUser();
  if (!user) {
    return response;
  }

  const { questionId } = await context.params;

  const deleted = await updateDb((db) => {
    const current = db.questions.find((item) => item.id === questionId);
    if (!current) {
      return false;
    }

    current.isActive = false;
    current.updatedAt = nowIso();
    db.schedules = db.schedules.filter((schedule) => schedule.questionId !== questionId);
    return true;
  });

  if (!deleted) {
    return fail(404, "Pergunta não encontrada.");
  }

  return ok({ success: true });
}
