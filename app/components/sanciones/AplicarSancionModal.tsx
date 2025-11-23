import { useEffect, useState, type FormEvent } from "react";
import type { Cadete, TipoSancionRef, DuracionSancionRef } from "../../models/types";
import { hoyISODate } from "../../utils/format";

type Props = {
  open: boolean;
  cadete: Cadete | null;
  tiposSancion: TipoSancionRef[];
  duracionesSancion: DuracionSancionRef[];
  onClose: () => void;
  onCrearSancion: (args: {
    cadete: Cadete;
    fechaISO: string;
    tipo: TipoSancionRef;
    duracionDescripcion: string;
  }) => void;
};

export function AplicarSancionModal({
  open,
  cadete,
  tiposSancion,
  duracionesSancion,
  onClose,
  onCrearSancion,
}: Props) {
  const [fecha, setFecha] = useState(hoyISODate());
  const [tipoId, setTipoId] = useState<string>(tiposSancion[0]?._id ?? "");
  const [duracion, setDuracion] = useState<string>("1");

  useEffect(() => {
    if (open) {
      setFecha(hoyISODate());
      setTipoId(tiposSancion[0]?._id ?? "");
      setDuracion("1");
    }
  }, [open, tiposSancion]);

  if (!open || !cadete) return null;

  const tipoSeleccionado = tiposSancion.find((t) => t._id === tipoId);
  const tipoEsDTE = tipoSeleccionado?.descripcion === "DTE";

  const duracionesDisponibles = duracionesSancion.filter((d) =>
    tipoEsDTE ? d.descripcion === "DIA" : d.descripcion !== "DIA"
  );

  function handleTipoChange(newTipoId: string) {
    setTipoId(newTipoId);
    const nuevoTipo = tiposSancion.find((t) => t._id === newTipoId);
    if (nuevoTipo?.descripcion === "DTE") {
      setDuracion("DIA");
    } else {
      setDuracion(duracionesDisponibles[0]?.descripcion ?? "1");
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!cadete || !tipoSeleccionado) return;

    const duracionDesc = tipoEsDTE ? "DIA" : duracion;
    const fechaISO = new Date(fecha).toISOString();

    onCrearSancion({
      cadete,
      fechaISO,
      tipo: tipoSeleccionado,
      duracionDescripcion: duracionDesc,
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full text-(--color-dark)">
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

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="block text-xs font-medium">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-(--color-primary)"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium">
              Tipo de sanción
            </label>
            <select
              value={tipoId}
              onChange={(e) => handleTipoChange(e.target.value)}
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
              value={duracion}
              onChange={(e) => setDuracion(e.target.value)}
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-(--color-primary)"
              required
            >
              {duracionesDisponibles.map((d) => (
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
              onClick={onClose}
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
  );
}
