import type { Cadete } from "./cadete";

export type Compania = {
  id: string;
  nombre: string;
  codigo: string;
  turno: string;
  color: string;
  logoUrl: string;
  cadetes: Cadete[];
};
