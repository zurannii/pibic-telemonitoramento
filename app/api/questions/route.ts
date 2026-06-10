import { fail, ok, readString, requireUser } from "@/lib/server/api";
import { readDb, updateDb } from "@/lib/server/db";
import { createId, nowIso, parseCommaTimes } from "@/lib/server/utils";

export const runtime = "nodejs";

export async function GET() {
  const { user, response } = await requireUser();
  if (!user) {
    return response;
  }

  const db = await readDb();
  return ok({ questions: db.questions.filter((question) => question.isActive) });
}

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) {
    return response;
  }

  const body = await request.json().catch(() => null);
  const title = readString(body?.title);
  const text = readString(body?.text);
  const simpleText = readString(body?.simpleText);
  const theme = readString(body?.theme);
  const responseType = readString(body?.responseType);
  const defaultTimes = parseCommaTimes(readString(body?.defaultTimes));

  if (!title || !text || !theme || !responseType) {
    return fail(400, "Preencha título, texto, tema e tipo de resposta.");
  }

  const question = await updateDb((db) => {
    const now = nowIso();
    const nextQuestion = {
      id: createId("question"),
      title,
      text,
      simpleText: simpleText || text,
      theme,
      responseType:
        responseType === "yes-no" ||
        responseType === "scale" ||
        responseType === "multiple-choice" ||
        responseType === "audio"
          ? responseType
          : "text",
      defaultTimes,
      isActive: true,
      createdByUserId: user.id,
      createdAt: now,
      updatedAt: now
    } as const;

    db.questions.push(nextQuestion);
    return nextQuestion;
  });

  return ok({ question });
}
