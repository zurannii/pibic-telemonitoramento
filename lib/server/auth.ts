import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { PublicUser, UserRecord } from "../shared/types";
import { findUserById } from "./db";
import { toPublicUser } from "./public";

const SESSION_COOKIE = "telemonitor_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;
const SESSION_SECRET = process.env.SESSION_SECRET ?? "telemonitor-dev-secret-change-me";

function base64UrlEncode(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function createSignature(value: string) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result as Buffer);
    });
  });

  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt, originalHash] = storedHash.split(":");
  if (!salt || !originalHash) {
    return false;
  }

  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result as Buffer);
    });
  });

  return crypto.timingSafeEqual(Buffer.from(originalHash, "hex"), derivedKey);
}

export async function createSession(userId: string) {
  const payload = JSON.stringify({
    userId,
    exp: Date.now() + SESSION_DURATION_MS
  });
  const encoded = base64UrlEncode(payload);
  const signature = createSignature(encoded);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, `${encoded}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) {
    return null;
  }

  const [encoded, signature] = sessionCookie.split(".");
  if (!encoded || !signature) {
    return null;
  }

  const expectedSignature = createSignature(encoded);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  const payload = JSON.parse(base64UrlDecode(encoded)) as { userId: string; exp: number };
  if (payload.exp <= Date.now()) {
    await clearSession();
    return null;
  }

  const user = await findUserById(payload.userId);
  return user ?? null;
}

export { toPublicUser };
