import type {
  Compania,
  Cadete,
  TipoSancionRef,
  DuracionSancionRef,
} from "../models/types";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export async function obtenerCompanias(): Promise<Compania[]> {
  const resp = await fetch(`${API_BASE_URL}/companiaGet`);
  if (!resp.ok) {
    throw new Error("Error cargando compañías");
  }

  const raw = (await resp.json()) as { descripcion: string; uid: string }[];

  const colores = ["#1d4ed8", "#16a34a", "#f97316", "#dc2626", "#7c3aed"];

  const companias: Compania[] = raw.map((c, index) => ({
    id: c.uid,
    nombre: c.descripcion,
    codigo: c.descripcion.slice(0, 3).toUpperCase(),
    turno: String(index + 1),
    color: colores[index % colores.length],
    cadetes: [],
    logoUrl: undefined,
  }));

  return companias;
}

export async function obtenerTiposSancion(): Promise<TipoSancionRef[]> {
  const resp = await fetch(`${API_BASE_URL}/tipo_sancionGet`);
  if (!resp.ok) {
    throw new Error("Error cargando tipos de sanción");
  }

  const raw = (await resp.json()) as { descripcion: string; uid: string }[];

  return raw.map((t) => ({
    _id: t.uid,
    descripcion: t.descripcion,
  }));
}

export async function obtenerDuracionesSancion(): Promise<DuracionSancionRef[]> {
  const resp = await fetch(`${API_BASE_URL}/duracionGet`);
  if (!resp.ok) {
    throw new Error("Error cargando duraciones de sanción");
  }

  const raw = (await resp.json()) as { descripcion: string; uid: string }[];

  return raw.map((d) => ({
    _id: d.uid,
    descripcion: d.descripcion,
  }));
}

export async function obtenerCadetesPorCompania(
  companiaId: string
): Promise<Cadete[]> {
  const resp = await fetch(`${API_BASE_URL}/cd-companias/${companiaId}`);
  if (!resp.ok) {
    throw new Error("Error cargando cadetes");
  }

  const raw = (await resp.json()) as {
    nombre1: string;
    nombre2?: string;
    apellido1: string;
    apellido2?: string;
    cc: number;
    grado: { _id: string; descripcion: string };
    compania: { _id: string; descripcion: string };
    guardia: number;
    uid: string;
    rol?: { _id: string; descripcion: string };
  }[];

  return raw.map((c) => ({
    uid: c.uid,
    nombre1: c.nombre1,
    nombre2: c.nombre2 ?? "",
    apellido1: c.apellido1,
    apellido2: c.apellido2 ?? "",
    cc: String(c.cc),
    grado: c.grado.descripcion,
    rol: c.rol?.descripcion ?? "",
    guardia: c.guardia,
  }));
}

export type SancionDetalle = {
  ID_alumno: {
    _id: string;
    nombre1: string;
    apellido1: string;
    apellido2: string;
    cc: number;
    grado: { _id: string; descripcion: string };
    compania: { _id: string; descripcion: string };
    guardia: number;
  };
  ID_autoridad: {
    _id: string;
    nombre1: string;
    apellido1: string;
    apellido2: string;
    grado: { _id: string; descripcion: string };
  };
  ID_tipo_sancion: { _id: string; descripcion: string };
  ID_duracion_sancion: { _id: string; descripcion: string };
  fecha: string;
  estado: boolean;
  uid: string;
};

export type SancionesAlumnoResponse = {
  alumno: string;
  compania: string;
  grado: string;
  guardia: number;
  total_sanciones: number;
  sanciones: SancionDetalle[];
};

export async function obtenerSancionesPorAlumno(
  alumnoId: string
): Promise<SancionesAlumnoResponse> {
  const resp = await fetch(`${API_BASE_URL}/sanciones-cd/${alumnoId}`);
  if (!resp.ok) {
    throw new Error("Error cargando sanciones del alumno");
  }
  return (await resp.json()) as SancionesAlumnoResponse;
}

export async function crearSancionRemota(params: {
  idAlumno: string;
  idAutoridad: string;
  idTipoSancion: string;
  idDuracionSancion: string;
  fecha: string;
}): Promise<void> {
  const body = {
    ID_alumno: params.idAlumno,
    ID_autoridad: params.idAutoridad,
    ID_tipo_sancion: params.idTipoSancion,
    ID_duracion_sancion: params.idDuracionSancion,
    fecha: params.fecha,
  };

  const resp = await fetch(`${API_BASE_URL}/sancionesPost`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    throw new Error("Error al crear la sanción");
  }
}

export async function actualizarEstadoSancion(
  sancionId: string,
  nuevoEstado: boolean
): Promise<boolean> {
  const resp = await fetch(`${API_BASE_URL}/sancionesPut/${sancionId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ estado: nuevoEstado })
  });

  return resp.ok;
}

