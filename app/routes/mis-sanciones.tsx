import type { Route } from "../+types/root";
import { useLoaderData, redirect } from "react-router";
import { leerSesionDesdeCookie } from "../models/session";
import { useEffect, useState } from "react";
import { obtenerSancionesPorAlumno } from "../services/api";

type SancionItem = {
  uid: string;
  tipo: string;
  duracion: string;
  fecha: string;
  estado: boolean;
  autoridad: string;
};

type SancionesAlumnoResumen = {
  alumno: string;
  compania: string;
  grado: string;
  guardia: number;
  total_sanciones: number;
  sanciones: SancionItem[];
};

type LoaderData = {
  cedula: string;
  rol: string;
  idAlumno: string;
};

export function meta() {
  return [
    { title: "Mis sanciones" },
    { name: "description", content: "Listado de sanciones del cadete" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const session = leerSesionDesdeCookie(cookieHeader);

  if (!session) {
    return redirect("/");
  }

  const rolSesion = String(session.rol || "").toLowerCase();

  if (rolSesion === "superadmin") {
    return redirect("/dashboard");
  }

  if (!session.userId) {
    throw new Response("No se pudo determinar el identificador del alumno.", {
      status: 400,
    });
  }

  return {
    cedula: session.cedula,
    rol: session.rol,
    idAlumno: session.userId,
  } satisfies LoaderData;
}

function formatearFechaCorta(iso: string): string {
  const base = iso.split("T")[0];
  const [y, m, d] = base.split("-");
  return `${d}/${m}/${y}`;
}

export default function MisSanciones() {
  const { cedula, rol, idAlumno } = useLoaderData() as LoaderData;

  const [sancionesAlumno, setSancionesAlumno] =
    useState<SancionesAlumnoResumen | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError(null);
      try {
        const respuesta = await obtenerSancionesPorAlumno(idAlumno);
        if (cancelado) return;

        const sanciones: SancionItem[] = respuesta.sanciones.map((s: any) => ({
          uid: s.uid,
          tipo: s.ID_tipo_sancion.descripcion,
          duracion: s.ID_duracion_sancion.descripcion,
          fecha: s.fecha,
          estado: s.estado,
          autoridad: `${s.ID_autoridad.nombre1} ${s.ID_autoridad.apellido1}`,
        }));

        const resumen: SancionesAlumnoResumen = {
          alumno: respuesta.alumno,
          compania: respuesta.compania,
          grado: respuesta.grado,
          guardia: respuesta.guardia,
          total_sanciones: respuesta.total_sanciones,
          sanciones,
        };

        setSancionesAlumno(resumen);
      } catch {
        if (!cancelado) {
          setError("No se pudieron cargar las sanciones.");
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    cargar();

    return () => {
      cancelado = true;
    };
  }, [idAlumno]);

  return (
    <main className="min-h-screen bg-[var(--color-dark)] text-[var(--color-light)]">
      <header className="flex items-center justify-between px-8 py-4 border-b border-[var(--color-primary)] bg-[var(--color-dark)]/90">
        <div>
          <h1 className="text-xl font-semibold">Mis sanciones</h1>
          <p className="text-sm text-[var(--color-light)]/70">
            Rol: {rol} · Sesión: {cedula}
          </p>
        </div>

        <form method="post" action="/logout">
          <button
            type="submit"
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-light)] hover:bg-[#355287] transition"
          >
            Cerrar sesión
          </button>
        </form>
      </header>

      <section className="px-8 py-6 space-y-4">
        {cargando && (
          <p className="text-sm text-[var(--color-light)]/80">
            Cargando sanciones...
          </p>
        )}

        {error && (
          <p className="text-sm text-red-400">
            {error}
          </p>
        )}

        {!cargando && !error && sancionesAlumno && (
          <div className="rounded-2xl bg-[var(--color-light)] text-[var(--color-dark)] p-4 shadow-md">
            <div className="mb-4">
              <h2 className="text-base font-semibold">
                {sancionesAlumno.alumno}
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Compañía: {sancionesAlumno.compania} · Grado:{" "}
                {sancionesAlumno.grado} · Guardia: {sancionesAlumno.guardia} ·
                Total sanciones: {sancionesAlumno.total_sanciones}
              </p>
            </div>

            {sancionesAlumno.sanciones.length === 0 ? (
              <p className="text-xs text-slate-600">
                No tienes sanciones registradas.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-200 px-3 py-2 text-left">
                        Fecha
                      </th>
                      <th className="border border-slate-200 px-3 py-2 text-left">
                        Tipo
                      </th>
                      <th className="border border-slate-200 px-3 py-2 text-left">
                        Duración
                      </th>
                      <th className="border border-slate-200 px-3 py-2 text-left">
                        Autoridad
                      </th>
                      <th className="border border-slate-200 px-3 py-2 text-left">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sancionesAlumno.sanciones.map((s) => (
                      <tr key={s.uid} className="hover:bg-slate-50">
                        <td className="border border-slate-200 px-3 py-2">
                          {formatearFechaCorta(s.fecha)}
                        </td>
                        <td className="border border-slate-200 px-3 py-2">
                          {s.tipo}
                        </td>
                        <td className="border border-slate-200 px-3 py-2">
                          {s.duracion}
                        </td>
                        <td className="border border-slate-200 px-3 py-2">
                          {s.autoridad}
                        </td>
                        <td className="border border-slate-200 px-3 py-2">
                          {s.estado ? "Activa" : "Inactiva"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
