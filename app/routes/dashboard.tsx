import { useEffect, useState, type FormEvent } from "react";
import type { Route } from "../+types/root";
import { useLoaderData, redirect } from "react-router";
import { leerSesionDesdeCookie } from "../models/session";

import type {
  Compania,
  Cadete,
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
  type SancionDetalle,
} from "../services/api";

import { AppHeader } from "../components/layout/AppHeader";
import { CompanyGrid } from "../components/dashboard/CompanyGrid";
import { CadeteFilters } from "../components/dashboard/CadeteFilters";
import { CadeteTable } from "../components/dashboard/CadeteTable";

export function meta() {
  return [
    { title: "Dashboard - Administración" },
    { name: "description", content: "Panel de administración de escuadrones" },
  ];
}

type LoaderData = {
  cedula: string;
  idAutoridad: string;
  rol: string;
  companias: Compania[];
  tiposSancion: TipoSancionRef[];
  duracionesSancion: DuracionSancionRef[];
};

export async function loader({ request }: Route.LoaderArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const session = leerSesionDesdeCookie(cookieHeader);

  if (!session) {
    return redirect("/");
  }

  const rolSesion = String(session.rol).toLowerCase();

  if (rolSesion !== "admin") {
    return redirect("/mis-sanciones");
  }

  const [companias, tiposSancion, duracionesSancion] = await Promise.all([
    obtenerCompanias(),
    obtenerTiposSancion(),
    obtenerDuracionesSancion(),
  ]);

  return {
    cedula: session.cedula,
    idAutoridad: session.userId ?? "",
    rol: rolSesion,
    companias,
    tiposSancion,
    duracionesSancion,
  } satisfies LoaderData;
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

type ModalVerProps = {
  abierto: boolean;
  onClose: () => void;
  alumnoNombre: string;
  sanciones: SancionDetalle[];
};

function ModalVerSanciones({
  abierto,
  onClose,
  alumnoNombre,
  sanciones,
}: ModalVerProps) {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-xl w-full text-[var(--color-dark)]">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold">
            Sanciones de {alumnoNombre}
          </h4>
          <button
            type="button"
            className="text-xs text-slate-600 hover:text-slate-900"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>

        {sanciones.length === 0 ? (
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
                </tr>
              </thead>
              <tbody>
                {sanciones.map((s) => (
                  <tr key={s.uid} className="hover:bg-slate-50">
                    <td className="border border-slate-200 px-3 py-2">
                      {formatearFechaCorta(s.fecha)}
                    </td>
                    <td className="border border-slate-200 px-3 py-2">
                      {s.ID_tipo_sancion.descripcion}
                    </td>
                    <td className="border border-slate-200 px-3 py-2">
                      {s.ID_duracion_sancion.descripcion}
                    </td>
                    <td className="border border-slate-200 px-3 py-2">
                      {s.estado ? "ACTIVA" : "CUMPLIDA"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

type ModalAplicarProps = {
  abierto: boolean;
  onClose: () => void;
  cadete: Cadete | null;
  tiposSancion: TipoSancionRef[];
  duraciones: DuracionSancionRef[];
  idAutoridad: string;
  onSancionAplicada: () => void;
};

function ModalAplicarSancion({
  abierto,
  onClose,
  cadete,
  tiposSancion,
  duraciones,
  idAutoridad,
  onSancionAplicada,
}: ModalAplicarProps) {
  const [tipoSeleccionadoId, setTipoSeleccionadoId] = useState<string>(
    tiposSancion[0]?._id ?? ""
  );
  const [duracionSeleccionadaId, setDuracionSeleccionadaId] =
    useState<string>("");
  const [fecha, setFecha] = useState<string>(hoyISODate());
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setFecha(hoyISODate());
    const tipo = tiposSancion.find((t) => t._id === tipoSeleccionadoId);
    if (tipo?.descripcion === "DTE") {
      const dia = duraciones.find((d) => d.descripcion === "DIA");
      setDuracionSeleccionadaId(dia?._id ?? "");
    } else {
      const primeraHora = duraciones.find((d) => d.descripcion !== "DIA");
      setDuracionSeleccionadaId(primeraHora?._id ?? "");
    }
  }, [abierto, tiposSancion, duraciones, tipoSeleccionadoId]);

  if (!abierto || !cadete) return null;

  const tipoActual = tiposSancion.find((t) => t._id === tipoSeleccionadoId);
  const esDTE = tipoActual?.descripcion === "DTE";
  const duracionesFiltradas = duraciones.filter((d) =>
    esDTE ? d.descripcion === "DIA" : d.descripcion !== "DIA"
  );

  async function manejarSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!cadete || !tipoActual || !duracionSeleccionadaId) return;
    if (!idAutoridad) return;

    setEnviando(true);
    try {
      await crearSancionRemota({
        idAlumno: cadete.uid,
        idAutoridad,
        idTipoSancion: tipoActual._id,
        idDuracionSancion: duracionSeleccionadaId,
        fecha,
      });
      onSancionAplicada();
      onClose();
    } catch {
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full text-[var(--color-dark)]">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold">
            Aplicar sanción a {cadete.nombre1} {cadete.apellido1}
          </h4>
          <button
            type="button"
            className="text-xs text-slate-600 hover:text-slate-900"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>

        <form className="space-y-4" onSubmit={manejarSubmit}>
          <div className="space-y-1">
            <label className="block text-xs font-medium">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
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
              onChange={(e) => setTipoSeleccionadoId(e.target.value)}
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
              Duración ({esDTE ? "días" : "horas"})
            </label>
            <select
              value={duracionSeleccionadaId}
              onChange={(e) => setDuracionSeleccionadaId(e.target.value)}
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              required
            >
              {duracionesFiltradas.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.descripcion}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-1.5 text-xs font-semibold text-[var(--color-light)] hover:bg-[#355287] transition disabled:opacity-60"
            >
              {enviando ? "Aplicando..." : "Aplicar sanción"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const {
    cedula,
    idAutoridad,
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

  const companiaSeleccionada = companias.find(
    (c) => c.id === companiaSeleccionadaId
  );

  const cadetesCompaniaSeleccionada =
    (companiaSeleccionada &&
      cadetesPorCompania[companiaSeleccionada.id]) ||
    [];

  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroGrado, setFiltroGrado] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroGuardia, setFiltroGuardia] = useState("");

  const cadetesFiltrados = cadetesCompaniaSeleccionada.filter((cadete) => {
    const nombre = `${cadete.nombre1} ${cadete.nombre2 ?? ""} ${
      cadete.apellido1
    } ${cadete.apellido2 ?? ""}`.toLowerCase();
    if (
      filtroNombre.trim() &&
      !nombre.includes(filtroNombre.toLowerCase())
    ) {
      return false;
    }
    if (filtroGrado && cadete.grado !== filtroGrado) return false;
    if (filtroRol && cadete.rol !== filtroRol) return false;
    if (filtroGuardia && String(cadete.guardia) !== filtroGuardia) {
      return false;
    }
    return true;
  });

  const [modalVerAbierto, setModalVerAbierto] = useState(false);
  const [modalAplicarAbierto, setModalAplicarAbierto] = useState(false);
  const [cadeteSeleccionado, setCadeteSeleccionado] =
    useState<Cadete | null>(null);
  const [sancionesAlumno, setSancionesAlumno] = useState<SancionDetalle[]>([]);

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

  async function abrirModalVer(cadete: Cadete) {
    setCadeteSeleccionado(cadete);
    try {
      const resp = await obtenerSancionesPorAlumno(cadete.uid);
      setSancionesAlumno(resp.sanciones);
    } catch {
      setSancionesAlumno([]);
    }
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

  return (
    <main className="min-h-screen bg-[var(--color-dark)] text-[var(--color-light)]">
      <AppHeader cedula={cedula} />

      <section className="px-8 py-6 space-y-8">
        <div>
          <h2 className="text-lg font-semibold">Compañías del escuadrón</h2>
          <p className="text-sm text-[var(--color-light)]/70">
            Selecciona una compañía para ver sus cadetes y gestionar sanciones.
          </p>
        </div>

        <CompanyGrid
          companias={companias}
          cadetesPorCompania={cadetesPorCompania}
          companiaSeleccionadaId={companiaSeleccionadaId}
          onSeleccionarCompania={(id) => {
            setCompaniaSeleccionadaId(id);
            setFiltroNombre("");
            setFiltroGrado("");
            setFiltroRol("");
            setFiltroGuardia("");
          }}
        />

        {companiaSeleccionada && (
          <div className="mt-4 rounded-2xl bg-[var(--color-light)] text-[var(--color-dark)] p-4 shadow-md">
            <h3 className="text-sm font-semibold mb-2">
              Cadetes de {companiaSeleccionada.nombre}
            </h3>

            <p className="text-xs text-slate-600 mb-4">
              Información según PERSONA, GRADO, ROL y GUARDIA. Gestiona
              sanciones por cadete.
            </p>

            <CadeteFilters
              cadetes={cadetesCompaniaSeleccionada}
              filtroNombre={filtroNombre}
              filtroGrado={filtroGrado}
              filtroRol={filtroRol}
              filtroGuardia={filtroGuardia}
              onFiltroNombre={setFiltroNombre}
              onFiltroGrado={setFiltroGrado}
              onFiltroRol={setFiltroRol}
              onFiltroGuardia={setFiltroGuardia}
            />

            <div className="overflow-x-auto">
              {cadetesCompaniaSeleccionada.length === 0 ? (
                <p className="text-xs text-slate-600">
                  No hay cadetes cargados para esta compañía.
                </p>
              ) : (
                <CadeteTable
                  cadetes={cadetesFiltrados}
                  onVerSanciones={abrirModalVer}
                  onAplicarSancion={abrirModalAplicar}
                />
              )}
            </div>
          </div>
        )}
      </section>

      <ModalVerSanciones
        abierto={modalVerAbierto}
        onClose={cerrarModales}
        alumnoNombre={
          cadeteSeleccionado
            ? `${cadeteSeleccionado.nombre1} ${cadeteSeleccionado.apellido1}`
            : ""
        }
        sanciones={sancionesAlumno}
      />

      <ModalAplicarSancion
        abierto={modalAplicarAbierto}
        onClose={cerrarModales}
        cadete={cadeteSeleccionado}
        tiposSancion={tiposSancion}
        duraciones={duracionesSancion}
        idAutoridad={idAutoridad}
        onSancionAplicada={() => {}}
      />
    </main>
  );
}
