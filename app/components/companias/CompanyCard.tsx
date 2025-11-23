import type { Compania } from "../../models/types";

type CompanyCardsProps = {
  companias: Compania[];
  companiaSeleccionadaId: string;
  onSelectCompania: (id: string) => void;
};

export function CompanyCards({
  companias,
  companiaSeleccionadaId,
  onSelectCompania,
}: CompanyCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {companias.map((compania) => {
        const seleccionada = compania.id === companiaSeleccionadaId;
        const cantidadCadetes = compania.cadetes?.length ?? 0;

        return (
          <button
            key={compania.id}
            type="button"
            onClick={() => onSelectCompania(compania.id)}
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
  );
}
