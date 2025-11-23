// ======= CADETES Y COMPAÑÍAS =======

export type GradoRef = {
  _id: string;
  descripcion: string;
};

export type Cadete = {
  uid: string;
  nombre1: string;
  nombre2?: string;
  apellido1: string;
  apellido2?: string;
  cc: string;
  grado: string | GradoRef;
  rol: string;
  guardia: number;
};

export type Compania = {
  id: string;
  nombre: string;
  codigo: string;
  turno: string;
  color: string;
  cadetes: Cadete[];
  logoUrl?: string;
};

// ======= SANCIONES BÁSICAS =======

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
  fecha: string;
  estado: string;
  id_alumno: {
    _id: string;
    nombre1: string;
    apellido1: string;
    apellido2?: string;
    guardia: number;
    cc: string;
  };
  id_tipo_sancion: {
    _id: string;
    descripcion: string;
  };
  id_duracion: {
    _id: string;
    descripcion: string;
  };
};

// ======= LOADER DASHBOARD =======

export type DashboardLoaderData = {
  cedula: string;
  companias: Compania[];
  sanciones: Sancion[];
  tiposSancion: TipoSancionRef[];
  duracionesSancion: DuracionSancionRef[];
};

// ======= SANCIONES POR COMPAÑÍA =======

export type SancionCompaniaItem = {
  _id: string;
  ID_alumno: string;
  ID_autoridad: string;
  ID_tipo_sancion: {
    _id: string;
    descripcion: string;
  };
  ID_duracion_sancion: {
    _id: string,
    descripcion: string
  };
  fecha: string;
  estado: boolean;
};

export type CadeteCompaniaSanciones = {
  cadete: string;
  guardia: number;
  total_sanciones: number;
  sanciones: SancionCompaniaItem[];
};

// ======= LOGIN =======

export type LoginActionData = {
  error?: string;
  cedula?: string;
};
