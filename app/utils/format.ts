import type { Cadete } from "../models/types";

export function getNombreCompleto(c: Cadete): string {
  const nombres = [c.nombre1, c.nombre2].filter(Boolean).join(" ");
  const apellidos = [c.apellido1, c.apellido2].filter(Boolean).join(" ");
  return `${nombres} ${apellidos}`.trim();
}

export function formatearFechaCorta(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

export function hoyISODate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
