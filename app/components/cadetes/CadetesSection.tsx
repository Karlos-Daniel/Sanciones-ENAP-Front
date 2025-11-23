import { useMemo, useState } from "react";
import type { Cadete, Compania } from "../../models/types";
import { CadeteFilters } from "../dashboard/CadeteFilters";

type CadetesSectionProps = {
  compania: Compania;
  cadetes: Cadete[];
  cargandoCadetes: boolean;
  mostrarSoloActivas: boolean;
  onToggleSoloActivas: (value: boolean) => void;
  onVerSancionesCompania: () => void;
  onVerSancionesCadete: (cadete: Cadete) => void;
  onAplicarSancionCadete: (cadete: Cadete) => void;
};

function getNombreCompleto(c: Cadete): string {
  const nombres = [c.nombre1, c.nombre2].filter(Boolean).join(" ");
  const apellidos = [c.apellido1, c.apellido2].filter(Boolean).join(" ");
  return `${nombres} ${apellidos}`.trim();
}

function getGradoDescripcion(grado: Cadete["grado"]): string {
  if (!grado) return "";
  if (typeof grado === "string") return grado;
  return grado.descripcion;
}

export function CadetesSection({
  compania,
  cadetes,
  cargandoCadetes,
  mostrarSoloActivas,
  onToggleSoloActivas,
  onVerSancionesCompania,
  onVerSancionesCadete,
  onAplicarSancionCadete,
}: CadetesSectionProps) {
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroGrado, setFiltroGrado] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroGuardia, setFiltroGuardia] = useState("");

  const cadetesFiltrados = useMemo(() => {
    return cadetes.filter((c) => {
      const nombreCompleto = getNombreCompleto(c).toLowerCase();
      const gradoStr = getGradoDescripcion(c.grado);
      const rolStr = c.rol ?? "";
      const guardiaStr = String(c.guardia ?? "");

      if (filtroNombre && !nombreCompleto.includes(filtroNombre.toLowerCase())) {
        return false;
      }
      if (filtroGrado && gradoStr !== filtroGrado) {
        return false;
      }
      if (filtroRol && rolStr !== filtroRol) {
        return false;
      }
      if (filtroGuardia && guardiaStr !== filtroGuardia) {
        return false;
      }

      return true;
    });
  }, [cadetes, filtroNombre, filtroGrado, filtroRol, filtroGuardia]);

  return (
    <div className="mt-4 rounded-2xl bg-[var(--color-light)] text-[var(--color-dark)] p-4 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold mb-1">
            Cadetes de {compania.nombre}
          </h3>
          <p className="text-xs text-slate-600">
            Información según PERSONA, GRADO, ROL y GUARDIA. Gestiona sanciones
            por cadete.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              className="h-3 w-3"
              checked={mostrarSoloActivas}
              onChange={(e) => onToggleSoloActivas(e.target.checked)}
            />
            Mostrar solo sanciones activas
          </label>

          <button
            type="button"
            onClick={onVerSancionesCompania}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Ver sanciones de la compañía
          </button>
        </div>
      </div>

      <CadeteFilters
        cadetes={cadetes}
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
        {cargandoCadetes ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 border-2 border-slate-300 border-t-[var(--color-primary)] rounded-full animate-spin" />
          </div>
        ) : cadetesFiltrados.length === 0 ? (
          <p className="text-xs text-slate-600">
            No hay cadetes que coincidan con los filtros seleccionados.
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
                    {getGradoDescripcion(cadete.grado)}
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
                        onClick={() => onVerSancionesCadete(cadete)}
                      >
                        Ver
                      </button>
                      <button
                        type="button"
                        className="rounded-lg bg-red-600 text-white px-3 py-1 text-xs hover:bg-red-700 transition"
                        onClick={() => onAplicarSancionCadete(cadete)}
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
  );
}
