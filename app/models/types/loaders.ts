import type {
  Compania,
  Sancion,
  TipoSancionRef,
  DuracionSancionRef,
} from "./index";

export type DashboardLoaderData = {
  cedula: string;
  companias: Compania[];
  sanciones: Sancion[];
  tiposSancion: TipoSancionRef[];
  duracionesSancion: DuracionSancionRef[];
};
