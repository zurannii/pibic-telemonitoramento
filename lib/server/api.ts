import { NextResponse } from "next/server";
import { getSessionUser } from "./auth";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    return { user: null, response: fail(401, "Sua sessão expirou. Entre novamente.") };
  }

  return { user, response: null };
}

export function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function readBoolean(value: unknown) {
  return value === true || value === "true";
}
