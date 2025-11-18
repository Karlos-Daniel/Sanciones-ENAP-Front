import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import type { Route } from "../+types/root";
import { leerSesionDesdeCookie } from "../models/session";
import { useLoaderData } from "react-router";

import { SANCIONES_INICIALES } from "../data/sanciones";

import type {
  Compania,
  Cadete,
  Sancion,
  TipoSancionRef,
  DuracionSancionRef,
} from "../models/types";

import {
  obtenerCompanias,
  obtenerTiposSancion,
  obtenerDuracionesSancion,
  obtenerCadetesPorCompania,
  crearSancionRemota,
  obtenerSancionesPorAlumno,
} from "../services/api";

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

  const [companias, tiposSancion, duracionesSancion] = await Promise.all([
    obtenerCompanias(),
    obtenerTiposSancion(),
    obtenerDuracionesSancion(),
  ]);

  return {
    cedula: session.cedula,
    idAutoridad: session.idAutoridad ?? "",
    companias,
    sanciones: SANCIONES_INICIALES,
    tiposSancion,
    duracionesSancion,
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

type Notificacion = {
  tipo: "exito" | "error";
  mensaje: string;
};

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

  const [sancionesCadete, setSancionesCadete] = useState<Sancion[]>([]);
  const [cargandoSanciones, setCargandoSanciones] = useState(false);

  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroGrado, setFiltroGrado] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroGuardia, setFiltroGuardia] = useState("");

  const [notificacion, setNotificacion] = useState<Notificacion | null>(null);

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

  const opcionesDuracion = duracionesSancion.filter((d) =>
    tipoEsDTE ? d.descripcion === "DIA" : d.descripcion !== "DIA"
  );

  const gradosDisponibles = Array.from(
    new Set(cadetesCompaniaSeleccionada.map((c) => c.grado).filter(Boolean))
  );
  const rolesDisponibles = Array.from(
    new Set(cadetesCompaniaSeleccionada.map((c) => c.rol).filter(Boolean))
  );
  const guardiasDisponibles = Array.from(
    new Set(
      cadetesCompaniaSeleccionada.map((c) => String(c.guardia)).filter(Boolean)
    )
  );

  const cadetesFiltrados = cadetesCompaniaSeleccionada.filter((cadete) => {
    const nombreCompleto = getNombreCompleto(cadete).toLowerCase();
    if (
      filtroNombre.trim() &&
      !nombreCompleto.includes(filtroNombre.toLowerCase())
    ) {
      return false;
    }
    if (filtroGrado && cadete.grado !== filtroGrado) {
      return false;
    }
    if (filtroRol && cadete.rol !== filtroRol) {
      return false;
    }
    if (filtroGuardia && String(cadete.guardia) !== filtroGuardia) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    if (!companiaSeleccionadaId) return;
    if (cadetesPorCompania[companiaSeleccionadaId]) return;

    let cancelado = false;

    (async () => {
      try {
        const cadetes = await obtenerCadetesPorCompania(
          companiaSeleccionadaId
        );
        if (cancelado) return;

        setCadetesPorCompania((prev) => ({
          ...prev,
          [companiaSeleccionadaId]: cadetes,
        }));
      } catch {
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [companiaSeleccionadaId, cadetesPorCompania]);

  useEffect(() => {
    if (!notificacion) return;
    const t = setTimeout(() => {
      setNotificacion(null);
    }, 4000);
    return () => {
      clearTimeout(t);
    };
  }, [notificacion]);

  async function abrirModalVer(cadete: Cadete) {
    setCadeteSeleccionado(cadete);
    setModalVerAbierto(true);
    setCargandoSanciones(true);
    try {
      const data = await obtenerSancionesPorAlumno(cadete.uid);
      const mapeadas: Sancion[] = data.sanciones.map((s) => ({
        _id: s.uid,
        fecha: s.fecha,
        estado: s.estado ? "ACTIVA" : "CUMPLIDA",
        id_alumno: {
          _id: s.ID_alumno._id,
          nombre1: s.ID_alumno.nombre1,
          apellido1: s.ID_alumno.apellido1,
          apellido2: s.ID_alumno.apellido2,
          guardia: s.ID_alumno.guardia,
          cc: String(s.ID_alumno.cc),
        },
        id_tipo_sancion: {
          _id: s.ID_tipo_sancion._id,
          descripcion: s.ID_tipo_sancion.descripcion,
        },
        id_duracion: {
          _id: s.ID_duracion_sancion._id,
          descripcion: s.ID_duracion_sancion.descripcion,
        },
      }));

      setSancionesCadete(mapeadas);
    } catch {
      setSancionesCadete([]);
    } finally {
      setCargandoSanciones(false);
    }
  }

  function abrirModalAplicar(cadete: Cadete) {
    setCadeteSeleccionado(cadete);
    setModalAplicarAbierto(true);
  }

  function cerrarModales() {
    setModalVerAbierto(false);
    setModalAplicarAbierto(false);
    setCadeteSeleccionado(null);
    setSancionesCadete([]);
  }

  async function manejarCrearSancion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cadeteSeleccionado) return;
    if (!idAutoridad) {
      setNotificacion({
        tipo: "error",
        mensaje: "No se encontró el identificador de la autoridad en la sesión.",
      });
      return;
    }

    const tipo = tiposSancion.find((t) => t._id === tipoSeleccionadoId);
    if (!tipo) {
      setNotificacion({
        tipo: "error",
        mensaje: "Tipo de sanción inválido.",
      });
      return;
    }

    const descripcionDuracion =
      tipo.descripcion === "DTE" ? "DIA" : duracionSeleccionada;

    const duracionRef = duracionesSancion.find(
      (d) => d.descripcion === descripcionDuracion
    );
    if (!duracionRef) {
      setNotificacion({
        tipo: "error",
        mensaje: "Duración de sanción inválida.",
      });
      return;
    }

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
      await crearSancionRemota({
        idAlumno: cadeteSeleccionado.uid,
        idAutoridad,
        idTipoSancion: tipo._id,
        idDuracionSancion: duracionRef._id,
        fecha: fechaNuevaSancion,
      });

      setSancionesState((prev) => [...prev, nuevo]);
      setModalAplicarAbierto(false);
      setNotificacion({
        tipo: "exito",
        mensaje: "Sanción aplicada correctamente.",
      });
    } catch {
      setNotificacion({
        tipo: "error",
        mensaje: "No se pudo aplicar la sanción. Intenta nuevamente.",
      });
    }
  }

  function marcarCumplida(id: string) {
    setSancionesCadete((prev) =>
      prev.map((s) => (s._id === id ? { ...s, estado: "CUMPLIDA" } : s))
    );
    setSancionesState((prev) =>
      prev.map((s) => (s._id === id ? { ...s, estado: "CUMPLIDA" } : s))
    );
  }

  function eliminarSancion(id: string) {
    setSancionesCadete((prev) => prev.filter((s) => s._id !== id));
    setSancionesState((prev) => prev.filter((s) => s._id !== id));
  }

  return (
    <main className="min-h-screen bg-(--color-dark) text-(--color-light)">
      <header className="flex items-center justify-between px-8 py-4 border-b border-(--color-primary)">
        <div>
          <h1 className="text-xl font-semibold">
            Panel de administración - Escuadrón
          </h1>
          <p className="text-sm text-(--color-light)/70">
            Rol: Administrador · Sesión: {cedula}
          </p>
        </div>

        <form method="post" action="/logout">
          <button
            type="submit"
            className="rounded-lg bg-(--color-primary) px-4 py-2 text-sm font-medium text-(--color-light) hover:bg-[#355287] transition"
          >
            Cerrar sesión
          </button>
        </form>
      </header>

      <section className="px-8 py-6 space-y-8">
        {notificacion && (
          <div
            className={[
              "rounded-lg border px-4 py-2 text-xs mb-2",
              notificacion.tipo === "exito"
                ? "bg-green-100 text-green-800 border-green-300"
                : "bg-red-100 text-red-800 border-red-300",
            ].join(" ")}
          >
            {notificacion.mensaje}
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold">Compañías del escuadrón</h2>
          <p className="text-sm text-(--color-light)/70">
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
                onClick={() => {
                  setCompaniaSeleccionadaId(compania.id);
                  setFiltroNombre("");
                  setFiltroGrado("");
                  setFiltroRol("");
                  setFiltroGuardia("");
                }}
                className={[
                  "flex flex-col justify-center rounded-2xl border-2 px-4 py-6 text-left shadow-sm transition",
                  "bg-(--color-light) text-(--color-dark) hover:border-(--color-primary)",
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
          <div className="mt-4 rounded-2xl bg-(--color-light) text-(--color-dark) p-4 shadow-md">
            <h3 className="text-sm font-semibold mb-2">
              Cadetes de {companiaSeleccionada.nombre}
            </h3>

            <p className="text-xs text-slate-600 mb-4">
              Información según PERSONA, GRADO, ROL y GUARDIA. Gestiona
              sanciones por cadete.
            </p>

            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1">
                  Buscar por nombre
                </label>
                <input
                  type="text"
                  value={filtroNombre}
                  onChange={(e) => setFiltroNombre(e.target.value)}
                  placeholder="Ej: Pérez"
                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-(--color-primary)"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Grado
                </label>
                <select
                  value={filtroGrado}
                  onChange={(e) => setFiltroGrado(e.target.value)}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-(--color-primary)"
                >
                  <option value="">Todos</option>
                  {gradosDisponibles.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Rol
                </label>
                <select
                  value={filtroRol}
                  onChange={(e) => setFiltroRol(e.target.value)}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-(--color-primary)"
                >
                  <option value="">Todos</option>
                  {rolesDisponibles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Guardia
                </label>
                <select
                  value={filtroGuardia}
                  onChange={(e) => setFiltroGuardia(e.target.value)}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-(--color-primary)"
                >
                  <option value="">Todas</option>
                  {guardiasDisponibles.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              {cadetesCompaniaSeleccionada.length === 0 ? (
                <p className="text-xs text-slate-600">
                  No hay cadetes cargados para esta compañía.
                </p>
              ) : cadetesFiltrados.length === 0 ? (
                <p className="text-xs text-slate-600">
                  No hay cadetes que cumplan los filtros seleccionados.
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
                    {cadetesFiltrados.map((cadete) => (
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
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-xl w-full text-(--color-dark)">
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

              {cargandoSanciones ? (
                <p className="text-xs text-slate-600">Cargando sanciones...</p>
              ) : sancionesCadete.length === 0 ? (
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
                      {sancionesCadete.map((s) => (
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
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full text-(--color-dark)">
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
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-(--color-primary)"
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
                        setDuracionSeleccionada("DIA");
                      } else {
                        setDuracionSeleccionada("1");
                      }
                    }}
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-(--color-primary)"
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
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-(--color-primary)"
                    required
                  >
                    {opcionesDuracion.map((d) => (
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
                    className="rounded-lg bg-(--color-primary) px-4 py-1.5 text-xs font-semibold text-(--color-light) hover:bg-[#355287] transition"
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
