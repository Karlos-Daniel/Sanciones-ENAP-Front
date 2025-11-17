import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import type { Route } from "../+types/root";
import { leerSesionDesdeCookie } from "../models/session";
import { useLoaderData } from "react-router";

import {
  SANCIONES_INICIALES,
  TIPOS_SANCION,
  DURACIONES_SANCION,
} from "../data/sanciones";

import type {
  Compania,
  Cadete,
  Sancion,
  TipoSancionRef,
  DuracionSancionRef,
} from "../models/types";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export function meta() {
  return [
    { title: "Dashboard - Administración" },
    { name: "description", content: "Panel de administración de escuadrones" },
  ];
}

type LoaderData = {
  cedula: string;
  idAutoridad: string;
  companias: Compania[];
  sanciones: Sancion[];
  tiposSancion: TipoSancionRef[];
  duracionesSancion: DuracionSancionRef[];
};

export async function loader({ request }: Route.LoaderArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const session = leerSesionDesdeCookie(cookieHeader);

  if (!session) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/" },
    });
  }

  const resp = await fetch(`${API_BASE_URL}/companiaGet`);
  if (!resp.ok) {
    throw new Response("Error cargando compañías", { status: 500 });
  }

  const raw = (await resp.json()) as { descripcion: string; uid: string }[];

  const companias: Compania[] = raw.map((c, index) => ({
    id: c.uid,
    nombre: c.descripcion,
    codigo: c.descripcion.slice(0, 3).toUpperCase(),
    turno: String(index + 1),
    color: ["#1d4ed8", "#16a34a", "#f97316", "#dc2626", "#7c3aed"][index % 5],
    cadetes: [],
    logoUrl: undefined,
  }));

  return {
    cedula: session.cedula,
    idAutoridad: session.idAutoridad,
    companias,
    sanciones: SANCIONES_INICIALES,
    tiposSancion: TIPOS_SANCION,
    duracionesSancion: DURACIONES_SANCION,
  } satisfies LoaderData;
}

function getNombreCompleto(c: Cadete): string {
  const nombres = [c.nombre1, c.nombre2].filter(Boolean).join(" ");
  const apellidos = [c.apellido1, c.apellido2].filter(Boolean).join(" ");
  return `${nombres} ${apellidos}`.trim();
}

function formatearFechaCorta(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

function hoyISODate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Dashboard() {
  const {
    cedula,
    idAutoridad,
    companias,
    sanciones,
    tiposSancion,
    duracionesSancion,
  } = useLoaderData() as LoaderData;

  const [companiaSeleccionadaId, setCompaniaSeleccionadaId] = useState(
    companias[0]?.id ?? ""
  );

  const [sancionesState, setSancionesState] = useState<Sancion[]>(sanciones);

  const [cadeteSeleccionado, setCadeteSeleccionado] =
    useState<Cadete | null>(null);

  const [modalVerAbierto, setModalVerAbierto] = useState(false);
  const [modalAplicarAbierto, setModalAplicarAbierto] = useState(false);

  const [tipoSeleccionadoId, setTipoSeleccionadoId] = useState<string>(
    tiposSancion[0]?._id ?? ""
  );
  const [duracionSeleccionada, setDuracionSeleccionada] =
    useState<string>("1");
  const [fechaNuevaSancion, setFechaNuevaSancion] = useState<string>(
    hoyISODate()
  );

  const [cadetesPorCompania, setCadetesPorCompania] = useState<
    Record<string, Cadete[]>
  >({});

  const companiaSeleccionada = companias.find(
    (c) => c.id === companiaSeleccionadaId
  );

  const cadetesCompaniaSeleccionada =
    (companiaSeleccionada &&
      cadetesPorCompania[companiaSeleccionada.id]) ||
    [];

  const tipoSeleccionado = tiposSancion.find(
    (t) => t._id === tipoSeleccionadoId
  );
  const tipoEsDTE = tipoSeleccionado?.descripcion === "DTE";

  useEffect(() => {
    if (!companiaSeleccionadaId) return;
    if (cadetesPorCompania[companiaSeleccionadaId]) return;

    let cancelado = false;

    (async () => {
      const resp = await fetch(
        `${API_BASE_URL}/cd-companias/${companiaSeleccionadaId}`
      );
      if (!resp.ok) return;

      const raw = (await resp.json()) as {
        nombre1: string;
        nombre2?: string;
        apellido1: string;
        apellido2?: string;
        cc: number;
        grado: string | { _id: string; descripcion: string };
        compania: { _id: string; descripcion: string };
        guardia: number;
        uid: string;
        rol?: { _id: string; descripcion: string };
      }[];

      const cadetes: Cadete[] = raw.map((c) => ({
        uid: c.uid,
        nombre1: c.nombre1,
        nombre2: c.nombre2 ?? "",
        apellido1: c.apellido1,
        apellido2: c.apellido2 ?? "",
        cc: String(c.cc),
        grado:
          typeof c.grado === "string"
            ? c.grado
            : c.grado?.descripcion ?? "",
        rol: c.rol?.descripcion ?? "",
        guardia: c.guardia,
      }));

      if (cancelado) return;

      setCadetesPorCompania((prev) => ({
        ...prev,
        [companiaSeleccionadaId]: cadetes,
      }));
    })();

    return () => {
      cancelado = true;
    };
  }, [companiaSeleccionadaId, cadetesPorCompania]);

  function abrirModalVer(cadete: Cadete) {
    setCadeteSeleccionado(cadete);
    setModalVerAbierto(true);
  }

  function abrirModalAplicar(cadete: Cadete) {
    setCadeteSeleccionado(cadete);
    setModalAplicarAbierto(true);
  }

  function cerrarModales() {
    setModalVerAbierto(false);
    setModalAplicarAbierto(false);
    setCadeteSeleccionado(null);
  }

  function sancionesDeCadeteActual(): Sancion[] {
    if (!cadeteSeleccionado) return [];
    return sancionesState.filter(
      (s) => s.id_alumno.cc === cadeteSeleccionado.cc
    );
  }

  async function manejarCrearSancion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cadeteSeleccionado) return;

    const tipo = tiposSancion.find((t) => t._id === tipoSeleccionadoId);
    if (!tipo) return;

    const descripcionDuracion =
      tipo.descripcion === "DTE" ? "DÍA" : duracionSeleccionada;

    const duracionRef = duracionesSancion.find(
      (d) => d.descripcion === descripcionDuracion
    );
    if (!duracionRef) return;

    const nuevo: Sancion = {
      _id: `tmp-${Date.now()}`,
      fecha: new Date(fechaNuevaSancion).toISOString(),
      estado: "ACTIVA",
      id_alumno: {
        _id: cadeteSeleccionado.uid,
        nombre1: cadeteSeleccionado.nombre1,
        apellido1: cadeteSeleccionado.apellido1,
        apellido2: cadeteSeleccionado.apellido2 ?? "",
        guardia: cadeteSeleccionado.guardia,
        cc: cadeteSeleccionado.cc,
      },
      id_tipo_sancion: {
        _id: tipo._id,
        descripcion: tipo.descripcion,
      },
      id_duracion: {
        _id: duracionRef._id,
        descripcion: descripcionDuracion,
      },
    };

    try {
      await fetch(`${API_BASE_URL}/sancionesPost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ID_alumno: cadeteSeleccionado.uid,
          ID_autoridad: idAutoridad,
          ID_tipo_sancion: tipo._id,
          ID_duracion_sancion: duracionRef._id,
          fecha: fechaNuevaSancion,
        }),
      });

      setSancionesState((prev) => [...prev, nuevo]);
      setModalAplicarAbierto(false);
    } catch {
      setSancionesState((prev) => [...prev, nuevo]);
      setModalAplicarAbierto(false);
    }
  }

  function marcarCumplida(id: string) {
    setSancionesState((prev) =>
      prev.map((s) => (s._id === id ? { ...s, estado: "CUMPLIDA" } : s))
    );
  }

  function eliminarSancion(id: string) {
    setSancionesState((prev) => prev.filter((s) => s._id !== id));
  }

  return (
    <main className="min-h-screen bg-[var(--color-dark)] text-[var(--color-light)]">
      <header className="flex items-center justify-between px-8 py-4 border-b border-[var(--color-primary)] bg-[var(--color-dark)]/90">
        <div>
          <h1 className="text-xl font-semibold">
            Panel de administración - Escuadrón
          </h1>
          <p className="text-sm text-[var(--color-light)]/70">
            Rol: Administrador · Sesión: {cedula}
          </p>
        </div>

        <form method="post" action="/logout">
          <button
            type="submit"
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-light)] hover:bg-[#355287] transition"
          >
            Cerrar sesión
          </button>
        </form>
      </header>

      <section className="px-8 py-6 space-y-8">
        <div>
          <h2 className="text-lg font-semibold">Compañías del escuadrón</h2>
          <p className="text-sm text-[var(--color-light)]/70">
            Selecciona una compañía para ver sus cadetes y gestionar sanciones.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {companias.map((compania) => {
            const seleccionada = compania.id === companiaSeleccionadaId;
            const cantidadCadetes =
              cadetesPorCompania[compania.id]?.length ?? 0;

            return (
              <button
                key={compania.id}
                type="button"
                onClick={() => setCompaniaSeleccionadaId(compania.id)}
                className={[
                  "flex flex-col justify-center rounded-2xl border-2 px-4 py-6 text-left shadow-sm transition",
                  "bg-[var(--color-light)] text-[var(--color-dark)] hover:border-[var(--color-primary)]",
                ].join(" ")}
                style={
                  seleccionada
                    ? {
                        borderColor: compania.color,
                        boxShadow: `0 0 0 1px ${compania.color}`,
                      }
                    : undefined
                }
              >
                <div
                  className="h-2 w-full rounded-lg mb-3"
                  style={{ backgroundColor: compania.color }}
                />

                <span className="text-xs uppercase tracking-wide text-slate-500">
                  {compania.codigo}
                </span>

                <span className="mt-1 text-sm font-semibold">
                  Compañía {compania.nombre}
                </span>

                <span className="mt-2 text-xs text-slate-600">
                  Cadetes: {cantidadCadetes}
                </span>
              </button>
            );
          })}
        </div>

        {companiaSeleccionada && (
          <div className="mt-4 rounded-2xl bg-[var(--color-light)] text-[var(--color-dark)] p-4 shadow-md">
            <h3 className="text-sm font-semibold mb-2">
              Cadetes de {companiaSeleccionada.nombre}
            </h3>

            <p className="text-xs text-slate-600 mb-4">
              Información según PERSONA, GRADO, ROL y GUARDIA. Gestiona
              sanciones por cadete.
            </p>

            <div className="overflow-x-auto">
              {cadetesCompaniaSeleccionada.length === 0 ? (
                <p className="text-xs text-slate-600">
                  No hay cadetes cargados para esta compañía.
                </p>
              ) : (
                <table className="min-w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-200 px-3 py-2 text-center">
                        ID
                      </th>
                      <th className="border border-slate-200 px-3 py-2 text-center">
                        Nombre completo
                      </th>
                      <th className="border border-slate-200 px-3 py-2 text-center">
                        Cédula
                      </th>
                      <th className="border border-slate-200 px-3 py-2 text-center">
                        Grado
                      </th>
                      <th className="border border-slate-200 px-3 py-2 text-center">
                        Rol
                      </th>
                      <th className="border border-slate-200 px-3 py-2 text-center">
                        Guardia
                      </th>
                      <th className="border border-slate-200 px-3 py-2 text-center">
                        Sanciones
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {cadetesCompaniaSeleccionada.map((cadete) => (
                      <tr key={cadete.uid} className="hover:bg-slate-50">
                        <td className="border border-slate-200 px-3 py-2 text-center">
                          {cadete.uid}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-center">
                          {getNombreCompleto(cadete)}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-center">
                          {cadete.cc}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-center">
                          {cadete.grado}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-center">
                          {cadete.rol}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-center">
                          {cadete.guardia}
                        </td>

                        <td className="border border-slate-200 px-3 py-2 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              type="button"
                              className="rounded-lg bg-blue-600 text-white px-3 py-1 text-xs hover:bg-blue-700 transition"
                              onClick={() => abrirModalVer(cadete)}
                            >
                              Ver
                            </button>
                            <button
                              type="button"
                              className="rounded-lg bg-red-600 text-white px-3 py-1 text-xs hover:bg-red-700 transition"
                              onClick={() => abrirModalAplicar(cadete)}
                            >
                              Aplicar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {modalVerAbierto && cadeteSeleccionado && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-xl w-full text-[var(--color-dark)]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold">
                  Sanciones de {getNombreCompleto(cadeteSeleccionado)}
                </h4>
                <button
                  type="button"
                  className="text-xs text-slate-600 hover:text-slate-900"
                  onClick={cerrarModales}
                >
                  Cerrar
                </button>
              </div>

              {sancionesDeCadeteActual().length === 0 ? (
                <p className="text-xs text-slate-600">
                  No hay sanciones registradas para este alumno.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-200 px-3 py-2 text-left">
                          Fecha
                        </th>
                        <th className="border border-slate-200 px-3 py-2 text-left">
                          Tipo
                        </th>
                        <th className="border border-slate-200 px-3 py-2 text-left">
                          Duración
                        </th>
                        <th className="border border-slate-200 px-3 py-2 text-left">
                          Estado
                        </th>
                        <th className="border border-slate-200 px-3 py-2 text-left">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sancionesDeCadeteActual().map((s) => (
                        <tr key={s._id} className="hover:bg-slate-50">
                          <td className="border border-slate-200 px-3 py-2">
                            {formatearFechaCorta(s.fecha)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2">
                            {s.id_tipo_sancion.descripcion}
                          </td>
                          <td className="border border-slate-200 px-3 py-2">
                            {s.id_duracion.descripcion}
                          </td>
                          <td className="border border-slate-200 px-3 py-2">
                            {s.estado}
                          </td>
                          <td className="border border-slate-200 px-3 py-2">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="rounded bg-green-600 text-white px-2 py-1 text-[10px] hover:bg-green-700 transition"
                                onClick={() => marcarCumplida(s._id)}
                              >
                                Marcar cumplida
                              </button>
                              <button
                                type="button"
                                className="rounded bg-slate-600 text-white px-2 py-1 text-[10px] hover:bg-slate-800 transition"
                                onClick={() => eliminarSancion(s._id)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {modalAplicarAbierto && cadeteSeleccionado && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full text-[var(--color-dark)]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold">
                  Aplicar sanción a {getNombreCompleto(cadeteSeleccionado)}
                </h4>
                <button
                  type="button"
                  className="text-xs text-slate-600 hover:text-slate-900"
                  onClick={cerrarModales}
                >
                  Cerrar
                </button>
              </div>

              <form className="space-y-4" onSubmit={manejarCrearSancion}>
                <div className="space-y-1">
                  <label className="block text-xs font-medium">Fecha</label>
                  <input
                    type="date"
                    value={fechaNuevaSancion}
                    onChange={(e) => setFechaNuevaSancion(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium">
                    Tipo de sanción
                  </label>
                  <select
                    value={tipoSeleccionadoId}
                    onChange={(e) => {
                      const nuevoTipoId = e.target.value;
                      setTipoSeleccionadoId(nuevoTipoId);
                      const tipo = tiposSancion.find(
                        (t) => t._id === nuevoTipoId
                      );
                      if (tipo?.descripcion === "DTE") {
                        setDuracionSeleccionada("DÍA");
                      } else {
                        setDuracionSeleccionada("1");
                      }
                    }}
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    required
                  >
                    {tiposSancion.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.descripcion}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium">
                    Duración ({tipoEsDTE ? "días" : "horas"})
                  </label>

                  <select
                    value={duracionSeleccionada}
                    onChange={(e) => setDuracionSeleccionada(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    required
                  >
                    {duracionesSancion.map((d) => (
                      <option key={d._id} value={d.descripcion}>
                        {d.descripcion}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
                    onClick={cerrarModales}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[var(--color-primary)] px-4 py-1.5 text-xs font-semibold text-[var(--color-light)] hover:bg-[#355287] transition"
                  >
                    Aplicar sanción
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
