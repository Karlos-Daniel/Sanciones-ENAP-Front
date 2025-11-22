import type {
  Sancion,
  TipoSancionRef,
  DuracionSancionRef,
} from "../models/types";

export const TIPOS_SANCION: TipoSancionRef[] = [
  { _id: "670ab9ee1294cc18e3001122", descripcion: "HTE" },
  { _id: "670ab9ee1294cc18e3001123", descripcion: "HDM" },
  { _id: "670ab9ee1294cc18e3001124", descripcion: "HAF" },
  { _id: "670ab9ee1294cc18e3001125", descripcion: "DTE" },
];

// Duraciones de 1 a 8
export const DURACIONES_SANCION: DuracionSancionRef[] = Array.from(
  { length: 8 },
  (_, i) => ({
    _id: `dur-${i + 1}`,
    descripcion: String(i + 1),
  })
);

// Valor especial SOLO PARA DTE
export const DURACION_DTE: DuracionSancionRef = {
  _id: "dur-dia",
  descripcion: "DÍA",
};

export const SANCIONES_INICIALES: Sancion[] = [];
