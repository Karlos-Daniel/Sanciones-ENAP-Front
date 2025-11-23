import { useEffect, useState } from "react";
import type { Cadete } from "../../models/types";
import {
  obtenerSancionesPorAlumno,
  type SancionesAlumnoResponse,
  actualizarEstadoSancion,
} from "../../services/api";

type Props = {
  isOpen: boolean;
  cadete: Cadete | null;
  mostrarSoloActivas: boolean;
  onClose: () => void;
};

function formatearFechaCorta(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

function getNombreCompleto(c: Cadete): string {
  const nombres = [c.nombre1, c.nombre2].filter(Boolean).join(" ");
  const apellidos = [c.apellido1, c.apellido2].filter(Boolean).join(" ");
  return `${nombres} ${apellidos}`.trim();
}

type Sancion = SancionesAlumnoResponse["sanciones"][number];

export function SancionesCadeteModal({
  isOpen,
  cadete,
  mostrarSoloActivas,
  onClose,
}: Props) {
  const [data, setData] = useState<SancionesAlumnoResponse | null>(null);
  const [sancionesLocal, setSancionesLocal] = useState<Sancion[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !cadete) {
      setData(null);
      setSancionesLocal(null);
      setError(null);
      setCargando(false);
      setActualizandoId(null);
      return;
    }

    let cancelado = false;

    (async () => {
      try {
        setCargando(true);
        setError(null);

        const resp = await obtenerSancionesPorAlumno(cadete.uid);

        if (!cancelado) {
          setData(resp);
          setSancionesLocal(resp.sanciones);
        }
      } catch {
        if (!cancelado) {
          setError("No se pudieron cargar las sanciones del alumno.");
          setData(null);
          setSancionesLocal(null);
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [isOpen, cadete]);

  if (!isOpen || !cadete) return null;

  const base = sancionesLocal ?? data?.sanciones ?? [];
  const sanciones = base.filter((s) =>
    mostrarSoloActivas ? s.estado === true : true
  );

  async function handleToggleEstado(sancion: Sancion) {
    const id = (sancion as any).uid ?? (sancion as any)._id;
    if (!id) return;

    const nuevoEstado = !sancion.estado;
    setActualizandoId(id);
    setError(null);

    try {
      const ok = await actualizarEstadoSancion(id, nuevoEstado);
      if (!ok) {
        setError("No se pudo actualizar el estado de la sanción.");
        return;
      }

      setSancionesLocal((prev) =>
        prev
          ? prev.map((s) => {
              const sid = (s as any).uid ?? (s as any)._id;
              return sid === id ? { ...s, estado: nuevoEstado } : s;
            })
          : prev
      );
    } catch {
      setError("Error de red al actualizar la sanción.");
    } finally {
      setActualizandoId(null);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-xl w-full text-(--color-dark)">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold">
            Sanciones de {getNombreCompleto(cadete)}
          </h4>
          <button
            type="button"
            className="text-xs text-slate-600 hover:text-slate-900"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>

        {cargando && (
          <p className="text-xs text-slate-600">Cargando sanciones...</p>
        )}

        {error && !cargando && (
          <p className="text-xs text-red-600 mb-2">{error}</p>
        )}

        {!cargando && !error && sanciones.length === 0 && (
          <p className="text-xs text-slate-600">
            No hay sanciones registradas para este alumno.
          </p>
        )}

        {!cargando && !error && sanciones.length > 0 && (
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
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {sanciones.map((s) => {
                  const id = (s as any).uid ?? (s as any)._id;
                  return (
                    <tr key={id} className="hover:bg-slate-50">
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
                        {s.estado ? "ACTIVA" : "INACTIVA"}
                      </td>
                      <td className="border border-slate-200 px-3 py-2">
                        <button
                          type="button"
                          onClick={() => handleToggleEstado(s)}
                          disabled={actualizandoId === id}
                          className="rounded-lg border border-slate-300 px-3 py-1 text-[10px] text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                        >
                          {s.estado
                            ? "HABILITAR"
                            : "INABILITAR"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
