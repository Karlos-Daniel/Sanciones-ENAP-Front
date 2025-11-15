import type { Route } from "../+types/root";
import { leerSesionDesdeCookie } from "../models/session";
import { useLoaderData } from "react-router";

type LoaderData = {
  cedula: string;
};

export function meta() {
  return [
    { title: "Dashboard" },
    { name: "description", content: "Panel principal del sistema" },
  ];
}


export async function loader({ request }: Route.LoaderArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const session = leerSesionDesdeCookie(cookieHeader);

  if (!session) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  }

  const data: LoaderData = {
    cedula: session.cedula,
  };

  return data;
}

export default function Dashboard() {
  const { cedula } = useLoaderData() as LoaderData;

  return (
    <main className="min-h-screen bg-[var(--color-dark)] text-[var(--color-light)]">
      <header className="flex items-center justify-between px-8 py-4 border-b border-[var(--color-primary)] bg-[var(--color-dark)]/90">
        <div>
          <h1 className="text-xl font-semibold">Panel principal</h1>
          <p className="text-sm text-[var(--color-light)]/70">
            Bienvenido, cadete {cedula}.
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

      <section className="px-8 py-6 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-[var(--color-light)] text-[var(--color-dark)] p-4 shadow-md">
          <h2 className="text-sm font-semibold mb-2">Resumen</h2>
          <p className="text-xs text-slate-600">
            Aquí puedes empezar a colocar tarjetas con información clave del sistema.
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--color-light)] text-[var(--color-dark)] p-4 shadow-md">
          <h2 className="text-sm font-semibold mb-2">Actividad reciente</h2>
          <p className="text-xs text-slate-600">
            Log de operaciones, movimientos, reportes, etc.
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--color-light)] text-[var(--color-dark)] p-4 shadow-md">
          <h2 className="text-sm font-semibold mb-2">Estado del sistema</h2>
          <p className="text-xs text-slate-600">
            Aquí podemos mostrar métricas, alertas o KPIs.
          </p>
        </div>
      </section>
    </main>
  );
}
