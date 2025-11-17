export type AlumnoSancionRef = {
  _id: string;
  nombre1: string;
  apellido1: string;
  apellido2?: string;
  guardia: Number;
  cc: string;
};

export type TipoSancionRef = {
  _id: string;
  descripcion: string;
};

export type DuracionSancionRef = {
  _id: string;
  descripcion: string;
};

export type Sancion = {
  _id: string;
  fecha: string; // ISO string
  estado: "ACTIVA" | "CUMPLIDA" | "ANULADA";
  id_alumno: AlumnoSancionRef;
  id_tipo_sancion: TipoSancionRef;
  id_duracion: DuracionSancionRef;
};
