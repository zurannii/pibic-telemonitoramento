import { fail, ok, readBoolean, readString, requireUser } from "@/lib/server/api";
import { readDb, updateDb } from "@/lib/server/db";
import { maskSecret, nowIso } from "@/lib/server/utils";

export const runtime = "nodejs";

export async function GET() {
  const { user, response } = await requireUser();
  if (!user) {
    return response;
  }

  const db = await readDb();
  return ok({
    settings: {
      enabled: db.whatsapp.enabled,
      accessToken: maskSecret(db.whatsapp.accessToken),
      phoneNumberId: db.whatsapp.phoneNumberId,
      businessAccountId: db.whatsapp.businessAccountId,
      verifyToken: db.whatsapp.verifyToken,
      appSecret: maskSecret(db.whatsapp.appSecret),
      apiVersion: db.whatsapp.apiVersion,
      updatedAt: db.whatsapp.updatedAt
    }
  });
}

export async function PATCH(request: Request) {
  const { user, response } = await requireUser();
  if (!user) {
    return response;
  }

  const body = await request.json().catch(() => null);

  await updateDb((db) => {
    const enabled = body?.enabled !== undefined ? readBoolean(body.enabled) : db.whatsapp.enabled;
    const accessToken = readString(body?.accessToken);
    const phoneNumberId = readString(body?.phoneNumberId);
    const businessAccountId = readString(body?.businessAccountId);
    const verifyToken = readString(body?.verifyToken);
    const appSecret = readString(body?.appSecret);
    const apiVersion = readString(body?.apiVersion);

    db.whatsapp.enabled = enabled;
    if (accessToken) db.whatsapp.accessToken = accessToken;
    if (phoneNumberId) db.whatsapp.phoneNumberId = phoneNumberId;
    if (businessAccountId) db.whatsapp.businessAccountId = businessAccountId;
    if (verifyToken) db.whatsapp.verifyToken = verifyToken;
    if (appSecret) db.whatsapp.appSecret = appSecret;
    if (apiVersion) db.whatsapp.apiVersion = apiVersion;
    db.whatsapp.updatedAt = nowIso();
  });

  return ok({ success: true });
}
