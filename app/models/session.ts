export const SESSION_COOKIE_NAME = "session_arc";

export type SessionData = {
  cedula: string;
  idAutoridad: string;
};

export function crearValorSesion(cedula: string, idAutoridad: string): string {
  const data: SessionData = { cedula, idAutoridad };
  const json = JSON.stringify(data);
  const base64 = Buffer.from(json, "utf8").toString("base64url");
  return base64;
}

export function construirCookieSesion(cedula: string, idAutoridad: string): string {
  const value = crearValorSesion(cedula, idAutoridad);
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
    const data = JSON.parse(json) as Partial<SessionData>;
    if (!data.cedula) return null;
    return {
      cedula: String(data.cedula),
      idAutoridad: String(data.idAutoridad ?? ""),
    };
  } catch {
    return null;
  }
}
