import type { CadeteCompaniaSanciones } from "../../models/types";
import { formatearFechaCorta } from "../../utils/format";

type Props = {
  open: boolean;
  companiaNombre?: string;
  mostrarSoloActivas: boolean;
  cargando: boolean;
  error: string | null;
  data: CadeteCompaniaSanciones[];
  onClose: () => void;
};

export function SancionesCompaniaModal({
  open,
  companiaNombre,
  mostrarSoloActivas,
  cargando,
  error,
  data,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto text-(--color-dark)">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold">
            Sanciones de la compañía {companiaNombre ?? ""}
          </h4>
          <button
            type="button"
            className="text-xs text-slate-600 hover:text-slate-900"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>

        {cargando ? (
          <p className="text-xs text-slate-600">Cargando sanciones...</p>
        ) : error ? (
          <p className="text-xs text-red-600">{error}</p>
        ) : data.length === 0 ? (
          <p className="text-xs text-slate-600">
            No hay sanciones registradas para los cadetes de esta compañía.
          </p>
        ) : (
          <div className="space-y-6">
            {data.map((cadeteGrupo) => (
              <div
                key={`${cadeteGrupo.cadete}-${cadeteGrupo.guardia}`}
                className="border border-slate-200 rounded-xl p-4 bg-slate-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <p className="text-xs font-semibold">
                      Cadete: {cadeteGrupo.cadete}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Guardia: {cadeteGrupo.guardia}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-[11px] font-medium text-slate-700">
                    Total sanciones: {cadeteGrupo.total_sanciones}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-200">
                        <th className="border border-slate-300 px-2 py-1 text-left">
                          Fecha
                        </th>
                        <th className="border border-slate-300 px-2 py-1 text-left">
                          Tipo
                        </th>
                        <th className="border border-slate-300 px-2 py-1 text-left">
                          Duración
                        </th>
                        <th className="border border-slate-300 px-2 py-1 text-left">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cadeteGrupo.sanciones
                        .filter((s) =>
                          mostrarSoloActivas ? s.estado === true : true
                        )
                        .map((s) => (
                          <tr key={s._id} className="bg-white">
                            <td className="border border-slate-200 px-2 py-1">
                              {formatearFechaCorta(s.fecha)}
                            </td>
                            <td className="border border-slate-200 px-2 py-1">
                              {s.ID_tipo_sancion.descripcion}
                            </td>
                            <td className="border border-slate-200 px-2 py-1">
                              {s.ID_duracion_sancion.descripcion}
                            </td>
                            <td className="border border-slate-200 px-2 py-1">
                              {s.estado ? "ACTIVA" : "INACTIVA"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
