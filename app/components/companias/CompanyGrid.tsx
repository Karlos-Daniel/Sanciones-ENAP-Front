import type { Compania, Cadete } from "../../models/types";
import { CompanyCard } from "./CompanyCard";

type Props = {
  companias: Compania[];
  cadetesPorCompania: Record<string, Cadete[]>;
  selectedId: string;
  onSelect: (id: string) => void;
};

export function CompanyGrid({
  companias,
  cadetesPorCompania,
  selectedId,
  onSelect,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {companias.map((compania) => {
        const cadetesCount = cadetesPorCompania[compania.id]?.length ?? 0;
        return (
          <CompanyCard
            key={compania.id}
            compania={compania}
            isSelected={compania.id === selectedId}
            cadetesCount={cadetesCount}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
}
