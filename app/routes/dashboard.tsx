import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Route } from "../+types/root";
import { useLoaderData, redirect } from "react-router";
import { leerSesionDesdeCookie } from "../models/session";
import type { SessionData } from "../models/session";
import Spinner from "../components/Spinner";
import {
  obtenerCompanias,
  obtenerTiposSancion,
  obtenerDuracionesSancion,
  obtenerCadetesPorCompania,
  obtenerSancionesPorAlumno,
  crearSancionRemota,
  actualizarEstadoSancion,
} from "../services/api";

import type {
  Compania,
  Cadete,
  TipoSancionRef,
  DuracionSancionRef,
} from "../models/types";

type LoaderData = {
  cedula: string;
  rol: string;
  userId: string;
  companias: Compania[];
  tiposSancion: TipoSancionRef[];
  duracionesSancion: DuracionSancionRef[];
};

type SancionItem = {
  uid: string;
  tipo: string;
  duracion: string;
  fecha: string;
  estado: boolean;
  autoridad: string;
};

export function meta() {
  return [
    { title: "Dashboard - Administración" },
    { name: "description", content: "Panel de administración de escuadrones" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const session = leerSesionDesdeCookie(cookieHeader) as SessionData | null;

  if (!session) {
    return redirect("/");
  }

  if ((session.rol || "").toLowerCase() !== "superadmin") {
    return redirect("/mis-sanciones");
  }

  const [companias, tiposSancion, duracionesSancion] = await Promise.all([
    obtenerCompanias(),
    obtenerTiposSancion(),
    obtenerDuracionesSancion(),
  ]);

  return {
    cedula: session.cedula,
    rol: session.rol,
    userId: session.userId,
    companias,
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
  const base = iso.split("T")[0] || iso;
  const [year, month, day] = base.split("-");
  if (!year || !month || !day) return iso;
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
    rol,
    userId,
    companias,
    tiposSancion,
    duracionesSancion,
  } = useLoaderData() as LoaderData;

  const [companiaSeleccionadaId, setCompaniaSeleccionadaId] = useState(
    companias[0]?.id ?? ""
  );

  const [cadetesPorCompania, setCadetesPorCompania] = useState<
    Record<string, Cadete[]>
  >({});
  const [cargandoCadetes, setCargandoCadetes] = useState(false);

  const [cadeteSeleccionado, setCadeteSeleccionado] =
    useState<Cadete | null>(null);

  const [modalVerAbierto, setModalVerAbierto] = useState(false);
  const [modalAplicarAbierto, setModalAplicarAbierto] = useState(false);

  const [tipoSeleccionadoId, setTipoSeleccionadoId] = useState<string>(
    tiposSancion[0]?._id ?? ""
  );
  const [duracionSeleccionadaId, setDuracionSeleccionadaId] =
    useState<string>("");
  const [fechaNuevaSancion, setFechaNuevaSancion] =
    useState<string>(hoyISODate());

  const [sancionesPorCadete, setSancionesPorCadete] = useState<
    Record<string, SancionItem[]>
  >({});
  const [cargandoSancionesCadeteId, setCargandoSancionesCadeteId] =
    useState<string | null>(null);

  const [mensajeAplicacion, setMensajeAplicacion] = useState<string | null>(
    null
  );
  const [errorAplicacion, setErrorAplicacion] = useState<string | null>(null);

  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroGuardia, setFiltroGuardia] = useState<string>("");

  const [soloActivas, setSoloActivas] = useState(false);

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

  const duracionesDisponibles = useMemo(() => {
    if (tipoEsDTE) {
      return duracionesSancion.filter((d) => d.descripcion === "DIA");
    }
    return duracionesSancion.filter((d) => d.descripcion !== "DIA");
  }, [tipoEsDTE, duracionesSancion]);

  useEffect(() => {
    if (!duracionSeleccionadaId && duracionesDisponibles.length > 0) {
      setDuracionSeleccionadaId(duracionesDisponibles[0]._id);
    } else if (
      duracionSeleccionadaId &&
      !duracionesDisponibles.some((d) => d._id === duracionSeleccionadaId)
    ) {
      if (duracionesDisponibles.length > 0) {
        setDuracionSeleccionadaId(duracionesDisponibles[0]._id);
      } else {
        setDuracionSeleccionadaId("");
      }
    }
  }, [duracionesDisponibles, duracionSeleccionadaId]);

  useEffect(() => {
    if (!companiaSeleccionadaId) return;
    if (cadetesPorCompania[companiaSeleccionadaId]) return;

    let cancelado = false;

    async function cargarCadetes() {
      try {
        setCargandoCadetes(true);
        const cadetes = await obtenerCadetesPorCompania(
          companiaSeleccionadaId
        );
        if (cancelado) return;
        setCadetesPorCompania((prev) => ({
          ...prev,
          [companiaSeleccionadaId]: cadetes,
        }));
      } catch {
      } finally {
        if (!cancelado) {
          setCargandoCadetes(false);
        }
      }
    }

    cargarCadetes();

    return () => {
      cancelado = true;
    };
  }, [companiaSeleccionadaId, cadetesPorCompania]);

  const cadetesFiltrados = useMemo(() => {
    let lista = cadetesCompaniaSeleccionada;

    if (filtroTexto.trim()) {
      const texto = filtroTexto.trim().toLowerCase();
      lista = lista.filter((c) => {
        const nombre = getNombreCompleto(c).toLowerCase();
        const cc = c.cc.toLowerCase();
        return nombre.includes(texto) || cc.includes(texto);
      });
    }

    if (filtroGuardia) {
      lista = lista.filter(
        (c) => String(c.guardia) === filtroGuardia
      );
    }

    return lista;
  }, [cadetesCompaniaSeleccionada, filtroTexto, filtroGuardia]);

  async function cargarSancionesDeCadete(cadete: Cadete) {
    const id = cadete.uid;
    if (sancionesPorCadete[id]) return;

    setCargandoSancionesCadeteId(id);
    try {
      const respuesta = await obtenerSancionesPorAlumno(id);

      const sanciones: SancionItem[] = (respuesta.sanciones || []).map(
        (s: any) => ({
          uid: s.uid,
          tipo: s.ID_tipo_sancion.descripcion,
          duracion: s.ID_duracion_sancion.descripcion,
          fecha: s.fecha,
          estado: s.estado,
          autoridad: `${s.ID_autoridad.nombre1} ${s.ID_autoridad.apellido1}`,
        })
      );

      setSancionesPorCadete((prev) => ({
        ...prev,
        [id]: sanciones,
      }));
    } catch {
    } finally {
      setCargandoSancionesCadeteId(null);
    }
  }

  function abrirModalVer(cadete: Cadete) {
    setCadeteSeleccionado(cadete);
    setSoloActivas(false);
    setModalVerAbierto(true);
    cargarSancionesDeCadete(cadete);
  }

  function abrirModalAplicar(cadete: Cadete) {
    setCadeteSeleccionado(cadete);
    setMensajeAplicacion(null);
    setErrorAplicacion(null);
    setModalAplicarAbierto(true);
  }

  function cerrarModales() {
    setModalVerAbierto(false);
    setModalAplicarAbierto(false);
    setCadeteSeleccionado(null);
  }

  function sancionesDeCadeteActual(): SancionItem[] {
    if (!cadeteSeleccionado) return [];
    const todas = sancionesPorCadete[cadeteSeleccionado.uid] || [];
    if (soloActivas) {
      return todas.filter((s) => s.estado);
    }
    return todas;
  }

  async function manejarCrearSancion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cadeteSeleccionado) return;

    setMensajeAplicacion(null);
    setErrorAplicacion(null);

    const tipo = tiposSancion.find((t) => t._id === tipoSeleccionadoId);
    const duracion = duracionesSancion.find(
      (d) => d._id === duracionSeleccionadaId
    );
    if (!tipo || !duracion) {
      setErrorAplicacion("Tipo o duración inválidos.");
      return;
    }

    const fecha = fechaNuevaSancion;

    try {
      await crearSancionRemota({
        idAlumno: cadeteSeleccionado.uid,
        idAutoridad: userId,
        idTipoSancion: tipo._id,
        idDuracionSancion: duracion._id,
        fecha,
      });

      setMensajeAplicacion("Sanción aplicada correctamente.");

      const nuevaSancion: SancionItem = {
        uid: `tmp-${Date.now()}`,
        tipo: tipo.descripcion,
        duracion: duracion.descripcion,
        fecha,
        estado: true,
        autoridad: "",
      };

      setSancionesPorCadete((prev) => {
        const id = cadeteSeleccionado.uid;
        const listaPrev = prev[id] || [];
        return {
          ...prev,
          [id]: [...listaPrev, nuevaSancion],
        };
      });

      setModalAplicarAbierto(false);
    } catch {
      setErrorAplicacion("No se pudo aplicar la sanción. Inténtalo de nuevo.");
    }
  }

  async function marcarCumplida(idSancion: string) {
    try {
      await actualizarEstadoSancion(idSancion, false);

      setSancionesPorCadete((prev) => {
        const idCadete = cadeteSeleccionado?.uid;
        if (!idCadete) return prev;
        const lista = prev[idCadete] || [];
        return {
          ...prev,
          [idCadete]: lista.map((s) =>
            s.uid === idSancion ? { ...s, estado: false } : s
          ),
        };
      });
    } catch {
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-dark)] text-[var(--color-light)]">
      <header className="flex items-center justify-between px-8 py-4 border-b border-[var(--color-primary)] bg-[var(--color-dark)]/90">
        <div>
          <h1 className="text-xl font-semibold">
            Panel de administración - Escuadrón
          </h1>
          <p className="text-sm text-[var(--color-light)]/70">
            Rol: {rol} · Sesión: {cedula}
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold mb-1">
                  Cadetes de {companiaSeleccionada.nombre}
                </h3>
                <p className="text-xs text-slate-600">
                  Información según PERSONA, GUARDIA y ROL. Gestiona sanciones
                  por cadete.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-xs">
                <input
                  type="text"
                  placeholder="Buscar por nombre o cédula"
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  className="rounded border border-slate-300 px-2 py-1 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />

                <select
                  value={filtroGuardia}
                  onChange={(e) => setFiltroGuardia(e.target.value)}
                  className="rounded border border-slate-300 px-2 py-1 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="">Todas las guardias</option>
                  <option value="1">Guardia 1</option>
                  <option value="2">Guardia 2</option>
                  <option value="3">Guardia 3</option>
                  <option value="4">Guardia 4</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              {cargandoCadetes && <Spinner />}

              {!cargandoCadetes &&
                cadetesCompaniaSeleccionada.length === 0 && (
                  <p className="text-xs text-slate-600">
                    No hay cadetes cargados para esta compañía.
                  </p>
                )}

              {!cargandoCadetes &&
                cadetesCompaniaSeleccionada.length > 0 && (
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
                            {cadete.rol || "Alumno"}
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
              <div className="flex items-center justify-between mb-3">
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

              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-700">
                  Total sanciones:{" "}
                  {sancionesPorCadete[cadeteSeleccionado.uid]?.length || 0}
                </span>
                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={soloActivas}
                    onChange={(e) => setSoloActivas(e.target.checked)}
                    className="h-3 w-3"
                  />
                  Mostrar solo sanciones activas
                </label>
              </div>

              {cargandoSancionesCadeteId === cadeteSeleccionado.uid && (
                <Spinner />
              )}

              {cargandoSancionesCadeteId !== cadeteSeleccionado.uid &&
                sancionesDeCadeteActual().length === 0 && (
                  <p className="text-xs text-slate-600">
                    No hay sanciones registradas para este alumno con el
                    filtro actual.
                  </p>
                )}

              {cargandoSancionesCadeteId !== cadeteSeleccionado.uid &&
                sancionesDeCadeteActual().length > 0 && (
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
                            Autoridad
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
                          <tr key={s.uid} className="hover:bg-slate-50">
                            <td className="border border-slate-200 px-3 py-2">
                              {formatearFechaCorta(s.fecha)}
                            </td>
                            <td className="border border-slate-200 px-3 py-2">
                              {s.tipo}
                            </td>
                            <td className="border border-slate-200 px-3 py-2">
                              {s.duracion}
                            </td>
                            <td className="border border-slate-200 px-3 py-2">
                              {s.autoridad}
                            </td>
                            <td className="border border-slate-200 px-3 py-2">
                              {s.estado ? "Activa" : "Inactiva"}
                            </td>
                            <td className="border border-slate-200 px-3 py-2">
                              {s.estado && (
                                <button
                                  type="button"
                                  className="rounded bg-green-600 text-white px-2 py-1 text-[10px] hover:bg-green-700 transition"
                                  onClick={() => marcarCumplida(s.uid)}
                                >
                                  Marcar cumplida
                                </button>
                              )}
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
                      setTipoSeleccionadoId(e.target.value);
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
                    value={duracionSeleccionadaId}
                    onChange={(e) => setDuracionSeleccionadaId(e.target.value)}
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    required
                  >
                    {duracionesDisponibles.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.descripcion}
                      </option>
                    ))}
                  </select>
                </div>

                {mensajeAplicacion && (
                  <p className="text-xs text-green-600">
                    {mensajeAplicacion}
                  </p>
                )}
                {errorAplicacion && (
                  <p className="text-xs text-red-600">{errorAplicacion}</p>
                )}

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
