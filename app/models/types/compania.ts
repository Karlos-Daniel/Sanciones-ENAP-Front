import type { Cadete } from "./cadete";

export type Compania = {
  id: string;
  nombre: string;
  codigo: string;
  color: string;
  cadetes: Cadete[];
};
