import type { Cadete } from "../../models/types";

type CadeteFiltersProps = {
  cadetes: Cadete[];
  filtroNombre: string;
  filtroGrado: string;
  filtroRol: string;
  filtroGuardia: string;
  onFiltroNombre: (v: string) => void;
  onFiltroGrado: (v: string) => void;
  onFiltroRol: (v: string) => void;
  onFiltroGuardia: (v: string) => void;
};

// Normaliza un grado/rol cualquiera a STRING mayúscula sin espacios
function normalizarCampo(v: unknown): string {
  if (!v) return "";
  if (typeof v === "string") return v.trim().toUpperCase();

  // Caso GradoRef u objetos similares { descripcion: string }
  if (typeof v === "object" && "descripcion" in (v as any)) {
    const desc = (v as any).descripcion;
    return typeof desc === "string" ? desc.trim().toUpperCase() : "";
  }

  return String(v).trim().toUpperCase();
}

export function CadeteFilters({
  cadetes,
  filtroNombre,
  filtroGrado,
  filtroRol,
  filtroGuardia,
  onFiltroNombre,
  onFiltroGrado,
  onFiltroRol,
  onFiltroGuardia,
}: CadeteFiltersProps) {
  const gradosDisponibles = Array.from(
    new Set(
      cadetes
        .map((c) => normalizarCampo(c.grado))
        .filter((g) => g.length > 0)
    )
  );

  const rolesDisponibles = Array.from(
    new Set(
      cadetes
        .map((c) => normalizarCampo(c.rol))
        .filter((r) => r.length > 0)
    )
  );

  const guardiasDisponibles = Array.from(
    new Set(
      cadetes
        .map((c) => String(c.guardia))
        .filter((g) => g.length > 0)
    )
  );

  return (
    <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-end">
      <div className="flex-1">
        <label className="block text-xs font-medium mb-1">
          Buscar por nombre
        </label>
        <input
          type="text"
          value={filtroNombre}
          onChange={(e) => onFiltroNombre(e.target.value)}
          placeholder="Ej: Pérez"
          className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-(--color-primary)"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Grado</label>
        <select
          value={filtroGrado}
          onChange={(e) => onFiltroGrado(e.target.value)}
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
        <label className="block text-xs font-medium mb-1">Rol</label>
        <select
          value={filtroRol}
          onChange={(e) => onFiltroRol(e.target.value)}
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
        <label className="block text-xs font-medium mb-1">Guardia</label>
        <select
          value={filtroGuardia}
          onChange={(e) => onFiltroGuardia(e.target.value)}
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
  );
}
