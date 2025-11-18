import type { Route } from "../+types/root";
import { useLoaderData, redirect } from "react-router";
import { leerSesionDesdeCookie } from "../models/session";
import { obtenerSancionesPorAlumno } from "../services/api";

export function meta() {
  return [
    { title: "Mis sanciones" },
    { name: "description", content: "Visualización de sanciones personales" },
  ];
}

type LoaderData = {
  cedula: string;
  rol: string;
  resumen: Awaited<ReturnType<typeof obtenerSancionesPorAlumno>> | null;
};

export async function loader({ request }: Route.LoaderArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const session = leerSesionDesdeCookie(cookieHeader);

  if (!session) {
    return redirect("/");
  }

  const rolSesion = String(session.rol).toLowerCase();

  if (rolSesion === "admin") {
    return redirect("/dashboard");
  }

  let resumen = null;
  if (session.idAlumno) {
    resumen = await obtenerSancionesPorAlumno(session.idAlumno);
  }

  return {
    cedula: session.cedula,
    rol: rolSesion,
    resumen,
  } satisfies LoaderData;
}


function formatearFechaCorta(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

export default function MisSanciones() {
  const { cedula, rol, resumen } = useLoaderData() as LoaderData;

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
        {!resumen ? (
          <p className="text-sm text-[var(--color-light)]/80">
            No se encontraron sanciones asociadas a tu usuario.
          </p>
        ) : (
          <>
            <div className="text-sm text-[var(--color-light)]/90 space-y-1">
              <div>
                <span className="font-semibold">Alumno:</span>{" "}
                {resumen.alumno}
              </div>
              <div>
                <span className="font-semibold">Compañía:</span>{" "}
                {resumen.compania}
              </div>
              <div>
                <span className="font-semibold">Grado:</span> {resumen.grado}
              </div>
              <div>
                <span className="font-semibold">Guardia:</span>{" "}
                {resumen.guardia}
              </div>
              <div>
                <span className="font-semibold">Total sanciones:</span>{" "}
                {resumen.total_sanciones}
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-[var(--color-light)] text-[var(--color-dark)] p-4 shadow-md">
              {resumen.sanciones.length === 0 ? (
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
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumen.sanciones.map((s) => (
                        <tr key={s.uid} className="hover:bg-slate-50">
                          <td className="border border-slate-200 px-3 py-2">
                            {formatearFechaCorta(s.fecha)}
                          </td>
                          <td className="border border-slate-200 px-3 py-2">
                            {s.ID_tipo_sancion.descripcion}
                          </td>
                          <td className="border border-slate-200 px-3 py-2">
                            {s.ID_duracion_sancion.descripcion}
                          </td>
                          <td className="border border-slate-200 px-3 py-2">
                            {s.estado ? "ACTIVA" : "CUMPLIDA"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
