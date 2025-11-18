export const SESSION_COOKIE_NAME = "session_arc";

export type SessionData = {
  cedula: string;
  rol: string;
  userId: string;
  token?: string;
};

export function crearValorSesion(data: SessionData): string {
  const json = JSON.stringify(data);
  const base64 = Buffer.from(json, "utf8").toString("base64url");
  return base64;
}

export function construirCookieSesion(data: SessionData): string {
  const value = crearValorSesion(data);
  return [
    `${SESSION_COOKIE_NAME}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ].join("; ");
}

export function limpiarCookieSesion(): string {
  return [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Lax",
  ].join("; ");
}

export function leerSesionDesdeCookie(
  cookieHeader: string | null
): SessionData | null {
  if (!cookieHeader) return null;

  const cookie = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));

  if (!cookie) return null;

  const value = cookie.substring(SESSION_COOKIE_NAME.length + 1);
  try {
    const json = Buffer.from(value, "base64url").toString("utf8");
    const data = JSON.parse(json) as SessionData;
    if (!data.cedula || !data.rol || !data.userId) return null;
    return data;
  } catch {
    return null;
  }
}
