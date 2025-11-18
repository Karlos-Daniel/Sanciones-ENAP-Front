import type { Cadete } from "../../models/types";

type CadeteTableProps = {
  cadetes: Cadete[];
  onVerSanciones: (c: Cadete) => void;
  onAplicarSancion: (c: Cadete) => void;
};

function getNombreCompleto(c: Cadete): string {
  const nombres = [c.nombre1, c.nombre2].filter(Boolean).join(" ");
  const apellidos = [c.apellido1, c.apellido2].filter(Boolean).join(" ");
  return `${nombres} ${apellidos}`.trim();
}

export function CadeteTable({
  cadetes,
  onVerSanciones,
  onAplicarSancion,
}: CadeteTableProps) {
  if (cadetes.length === 0) {
    return (
      <p className="text-xs text-slate-600">
        No hay cadetes que cumplan los filtros seleccionados.
      </p>
    );
  }

  return (
    <table className="min-w-full text-xs border-collapse">
      <thead>
        <tr className="bg-slate-100">
          <th className="border border-slate-200 px-3 py-2 text-center">ID</th>
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
        {cadetes.map((cadete) => (
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
                  onClick={() => onVerSanciones(cadete)}
                >
                  Ver
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-red-600 text-white px-3 py-1 text-xs hover:bg-red-700 transition"
                  onClick={() => onAplicarSancion(cadete)}
                >
                  Aplicar
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
