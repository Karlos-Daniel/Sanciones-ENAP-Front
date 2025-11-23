import { useEffect, useState } from "react";
import type {
  Cadete,
  Compania,
  DashboardLoaderData,
  CadeteCompaniaSanciones,
  TipoSancionRef,
  DuracionSancionRef,
} from "../../models/types";
import { CompanyCards } from "../companias/CompanyCard";
import { CadetesSection } from "../cadetes/CadetesSection";
import { SancionesCadeteModal } from "../sanciones/SancionesCadeteModal";
import { SancionesCompaniaModal } from "../sanciones/SancionesCompaniaModal";
import { obtenerCadetesPorCompania } from "../../services/api";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL as string;

type AplicarSancionFormState = {
  tipoSeleccionadoId: string;
  duracionSeleccionadaId: string;
  fecha: string;
};

function hoyISODate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DashboardPage({ data }: { data: DashboardLoaderData }) {
  const { cedula, companias, tiposSancion, duracionesSancion } = data;

  const [companiaSeleccionadaId, setCompaniaSeleccionadaId] = useState(
    companias[0]?.id ?? ""
  );

  const [cadetesPorCompania, setCadetesPorCompania] = useState<
    Record<string, Cadete[]>
  >({});

  const [cargandoCadetes, setCargandoCadetes] = useState(false);
  const [mostrarSoloActivas, setMostrarSoloActivas] = useState(false);

  const [cadeteSeleccionado, setCadeteSeleccionado] =
    useState<Cadete | null>(null);
  const [modalVerAbierto, setModalVerAbierto] = useState(false);
  const [modalAplicarAbierto, setModalAplicarAbierto] = useState(false);

  const [modalCompaniaAbierto, setModalCompaniaAbierto] = useState(false);
  const [sancionesCompania, setSancionesCompania] = useState<
    CadeteCompaniaSanciones[]
  >([]);
  const [cargandoSancionesCompania, setCargandoSancionesCompania] =
    useState(false);
  const [errorSancionesCompania, setErrorSancionesCompania] = useState<
    string | null
  >(null);

  const [aplicarSancionForm, setAplicarSancionForm] =
    useState<AplicarSancionFormState>(() => ({
      tipoSeleccionadoId: tiposSancion[0]?._id ?? "",
      duracionSeleccionadaId: duracionesSancion[0]?._id ?? "",
      fecha: hoyISODate(),
    }));

  const companiaSeleccionada: Compania | undefined = companias.find(
    (c) => c.id === companiaSeleccionadaId
  );

  const companiasConCadetes: Compania[] = companias.map((c) => ({
    ...c,
    cadetes: cadetesPorCompania[c.id] ?? c.cadetes ?? [],
  }));

  const cadetesCompaniaSeleccionada: Cadete[] =
    (companiaSeleccionada &&
      cadetesPorCompania[companiaSeleccionada.id]) ||
    [];

  useEffect(() => {
    if (!companiaSeleccionadaId) return;
    if (cadetesPorCompania[companiaSeleccionadaId]) return;

    let cancelado = false;
    setCargandoCadetes(true);

    (async () => {
      try {
        const cadetes = await obtenerCadetesPorCompania(companiaSeleccionadaId);
        if (cancelado) return;

        setCadetesPorCompania((prev) => ({
          ...prev,
          [companiaSeleccionadaId]: cadetes,
        }));
      } catch {
        if (!cancelado) {
          setCadetesPorCompania((prev) => ({
            ...prev,
            [companiaSeleccionadaId]: [],
          }));
        }
      } finally {
        if (!cancelado) setCargandoCadetes(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [companiaSeleccionadaId, cadetesPorCompania]);

  function handleVerSancionesCadete(cadete: Cadete) {
    setCadeteSeleccionado(cadete);
    setModalVerAbierto(true);
  }

  function handleAplicarSancionCadete(cadete: Cadete) {
    setCadeteSeleccionado(cadete);
    setAplicarSancionForm((prev) => ({
      ...prev,
      fecha: hoyISODate(),
    }));
    setModalAplicarAbierto(true);
  }

  function cerrarModalesCadete() {
    setModalVerAbierto(false);
    setModalAplicarAbierto(false);
    setCadeteSeleccionado(null);
  }

  async function abrirModalSancionesCompania() {
    if (!companiaSeleccionada) return;

    setModalCompaniaAbierto(true);
    setCargandoSancionesCompania(true);
    setErrorSancionesCompania(null);

    try {
      const resp = await fetch(
        `${API_BASE_URL}/sancionesCompanias/${companiaSeleccionada.id}`
      );

      if (!resp.ok) {
        setErrorSancionesCompania("No se pudieron cargar las sanciones.");
        setSancionesCompania([]);
        return;
      }

      const json = (await resp.json()) as {
        cadetes: CadeteCompaniaSanciones[];
      };

      setSancionesCompania(json.cadetes || []);
    } catch {
      setErrorSancionesCompania(
        "Error de red al cargar las sanciones de la compañía."
      );
      setSancionesCompania([]);
    } finally {
      setCargandoSancionesCompania(false);
    }
  }

  function cerrarModalCompania() {
    setModalCompaniaAbierto(false);
  }

  async function handleSubmitAplicarSancion(event: React.FormEvent) {
    event.preventDefault();
    if (!cadeteSeleccionado) return;

    try {
      const body = {
        ID_alumno: cadeteSeleccionado.uid,
        ID_tipo_sancion: aplicarSancionForm.tipoSeleccionadoId,
        ID_duracion_sancion: aplicarSancionForm.duracionSeleccionadaId,
        fecha: aplicarSancionForm.fecha,
      };

      const resp = await fetch(`${API_BASE_URL}/sancionesPost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        console.error("Error al crear sanción");
      }
    } finally {
      setModalAplicarAbierto(false);
      setCadeteSeleccionado(null);
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
            Rol: SuperAdmin · Sesión: {cedula}
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

        <CompanyCards
          companias={companiasConCadetes}
          companiaSeleccionadaId={companiaSeleccionadaId}
          onSelectCompania={setCompaniaSeleccionadaId}
        />

        {companiaSeleccionada && (
          <CadetesSection
            compania={companiaSeleccionada}
            cadetes={cadetesCompaniaSeleccionada}
            cargandoCadetes={cargandoCadetes}
            mostrarSoloActivas={mostrarSoloActivas}
            onToggleSoloActivas={setMostrarSoloActivas}
            onVerSancionesCompania={abrirModalSancionesCompania}
            onVerSancionesCadete={handleVerSancionesCadete}
            onAplicarSancionCadete={handleAplicarSancionCadete}
          />
        )}

        <SancionesCadeteModal
          isOpen={modalVerAbierto}
          cadete={cadeteSeleccionado}
          mostrarSoloActivas={mostrarSoloActivas}
          onClose={cerrarModalesCadete}
        />

        {modalAplicarAbierto && cadeteSeleccionado && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full text-[var(--color-dark)]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold">
                  Aplicar sanción
                </h4>
                <button
                  type="button"
                  className="text-xs text-slate-600 hover:text-slate-900"
                  onClick={cerrarModalesCadete}
                >
                  Cerrar
                </button>
              </div>

              <form className="space-y-4" onSubmit={handleSubmitAplicarSancion}>
                <div className="space-y-1">
                  <label className="block text-xs font-medium">Fecha</label>
                  <input
                    type="date"
                    value={aplicarSancionForm.fecha}
                    onChange={(e) =>
                      setAplicarSancionForm((prev) => ({
                        ...prev,
                        fecha: e.target.value,
                      }))
                    }
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-(--color-primary)"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium">
                    Tipo de sanción
                  </label>
                  <select
                    value={aplicarSancionForm.tipoSeleccionadoId}
                    onChange={(e) =>
                      setAplicarSancionForm((prev) => ({
                        ...prev,
                        tipoSeleccionadoId: e.target.value,
                      }))
                    }
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-(--color-primary)"
                    required
                  >
                    {tiposSancion.map((t: TipoSancionRef) => (
                      <option key={t._id} value={t._id}>
                        {t.descripcion}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium">
                    Duración
                  </label>
                  <select
                    value={aplicarSancionForm.duracionSeleccionadaId}
                    onChange={(e) =>
                      setAplicarSancionForm((prev) => ({
                        ...prev,
                        duracionSeleccionadaId: e.target.value,
                      }))
                    }
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-(--color-primary)"
                    required
                  >
                    {duracionesSancion.map((d: DuracionSancionRef) => (
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
                    onClick={cerrarModalesCadete}
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

        <SancionesCompaniaModal
          open={modalCompaniaAbierto}
          companiaNombre={companiaSeleccionada?.nombre}
          mostrarSoloActivas={mostrarSoloActivas}
          cargando={cargandoSancionesCompania}
          error={errorSancionesCompania}
          data={sancionesCompania}
          onClose={cerrarModalCompania}
        />
      </section>
    </main>
  );
}
