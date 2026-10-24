export const SESSION_COOKIE = "kcj_session";
export const SESSION_MAX_AGE = 60 * 60 * 8;

export interface SessionClaims {
  sub: string;
  role: "USER" | "ADMIN";
  exp: number;
}

function encodeBase64Url(value: Uint8Array) {
  let binary = "";
  value.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

async function signingKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to a random value of at least 32 characters.");
  }

  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(user: { id: string; role: SessionClaims["role"] }) {
  const claims: SessionClaims = {
    sub: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  const payload = encodeBase64Url(new TextEncoder().encode(JSON.stringify(claims)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await signingKey(),
    new TextEncoder().encode(payload),
  );
  return `${payload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
    throw new Error("AUTH_SECRET must be set to a random value of at least 32 characters.");
  }

  try {
    const [payload, encodedSignature, extra] = token.split(".");
    if (!payload || !encodedSignature || extra) return null;
    const valid = await crypto.subtle.verify(
      "HMAC",
      await signingKey(),
      decodeBase64Url(encodedSignature),
      new TextEncoder().encode(payload),
    );
    if (!valid) return null;

    const claims: unknown = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload)));
    if (
      typeof claims !== "object" ||
      claims === null ||
      !("sub" in claims) ||
      !("role" in claims) ||
      !("exp" in claims) ||
      typeof claims.sub !== "string" ||
      (claims.role !== "USER" && claims.role !== "ADMIN") ||
      typeof claims.exp !== "number" ||
      claims.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return claims as SessionClaims;
  } catch {
    return null;
  }
}
