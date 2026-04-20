import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "blog_session";
const EXPIRY = "7d";

function secret() {
  const s = process.env.BLOG_MASTER_SESSION_SECRET;
  if (!s) throw new Error("BLOG_MASTER_SESSION_SECRET not set");
  return new TextEncoder().encode(s);
}

export async function signSession(adminId: string): Promise<string> {
  return new SignJWT({ uid: adminId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(secret());
}

export async function verifySession(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return (payload.uid as string) ?? null;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export { COOKIE };
