import { NextResponse } from "next/server";

import { getPrisma, hasPostgresDatabase } from "@/lib/server/prisma";

export const runtime = "nodejs";

export async function GET() {
  if (!hasPostgresDatabase()) {
    return NextResponse.json(
      { ok: false, database: "json-fallback", message: "DATABASE_URL nao configurada." },
      { status: 503 }
    );
  }

  try {
    await getPrisma().appMeta.count();
    return NextResponse.json({ ok: true, database: "postgresql" });
  } catch {
    return NextResponse.json(
      { ok: false, database: "postgresql", message: "Banco indisponivel ou migration pendente." },
      { status: 503 }
    );
  }
}
