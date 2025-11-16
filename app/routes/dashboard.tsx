// app/routes/dashboard.tsx
import { useState } from "react";
import type { Route } from "../+types/root";
import { leerSesionDesdeCookie } from "../models/session";
import { useLoaderData } from "react-router";

import { COMPANIAS } from "../data/companias";
import type { Compania, Cadete } from "../models/types";

export function meta() {
  return [
    { title: "Dashboard - Administración" },
    { name: "description", content: "Panel de administración de escuadrones" },
  ];
}

type LoaderData = {
  cedula: string;
  companias: Compania[];
};

export async function loader({ request }: Route.LoaderArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const session = leerSesionDesdeCookie(cookieHeader);

  if (!session) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/" },
    });
  }

  return {
    cedula: session.cedula,
    companias: COMPANIAS,
  } satisfies LoaderData;
}

function getNombreCompleto(c: Cadete): string {
  const nombres = [c.nombre1, c.nombre2].filter(Boolean).join(" ");
  const apellidos = [c.apellido1, c.apellido2].filter(Boolean).join(" ");
  return `${nombres} ${apellidos}`.trim();
}

export default function Dashboard() {
  const { cedula, companias } = useLoaderData() as LoaderData;

  const [companiaSeleccionadaId, setCompaniaSeleccionadaId] = useState(
    companias[0]?.id ?? ""
  );

  const companiaSeleccionada = companias.find(
    (c) => c.id === companiaSeleccionadaId
  );

  return (
    <main className="min-h-screen bg-[var(--color-dark)] text-[var(--color-light)]">
      {/* HEADER SUPERIOR */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-[var(--color-primary)] bg-[var(--color-dark)]/90">
        <div>
          <h1 className="text-xl font-semibold">
            Panel de administración - Escuadrón
          </h1>
          <p className="text-sm text-[var(--color-light)]/70">
            Rol: Administrador · Sesión: {cedula}
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

      {/* CONTENIDO */}
      <section className="px-8 py-6 space-y-8">
        {/* ENCABEZADO */}
        <div>
          <h2 className="text-lg font-semibold">Compañías del escuadrón</h2>
          <p className="text-sm text-[var(--color-light)]/70">
            Selecciona una compañía para ver sus cadetes.
          </p>
        </div>

        {/* GRID DE COMPAÑÍAS */}
        <div className="grid gap-4 md:grid-cols-3">
          {companias.map((compania) => {
            const seleccionada = compania.id === companiaSeleccionadaId;

            return (
              <button
                key={compania.id}
                type="button"
                onClick={() => setCompaniaSeleccionadaId(compania.id)}
                className={[
                  "flex flex-col justify-center rounded-2xl border-2 px-4 py-6 text-left shadow-sm transition",
                  "bg-[var(--color-light)] text-[var(--color-dark)] hover:border-[var(--color-primary)]",
                ].join(" ")}
                style={
                  seleccionada
                    ? {
                      borderColor: compania.color,
                      boxShadow: `0 0 0 1px ${compania.color}`,
                    }
                    : undefined
                }
              >
                {/* COLOR IDENTIFICATIVO */}
                <div
                  className="h-2 w-full rounded-lg mb-3"
                  style={{ backgroundColor: compania.color }}
                />

                {/* LOGO (cuando lo agregues) */}
                {compania.logoUrl && (
                  <img
                    src={compania.logoUrl}
                    alt={compania.nombre}
                    className="h-10 object-contain mb-2"
                  />
                )}

                <span className="text-xs uppercase tracking-wide text-slate-500">
                  {compania.codigo} · Turno {compania.turno}
                </span>

                <span className="mt-1 text-sm font-semibold">
                  {compania.nombre}
                </span>

                <span className="mt-2 text-xs text-slate-600">
                  Cadetes: {compania.cadetes.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* TABLA DE CADETES */}
        {companiaSeleccionada && (
          <div className="mt-4 rounded-2xl bg-[var(--color-light)] text-[var(--color-dark)] p-4 shadow-md">
            <h3 className="text-sm font-semibold mb-2">
              Cadetes de {companiaSeleccionada.nombre}
            </h3>

            <p className="text-xs text-slate-600 mb-4">
              Información según PERSONA, GRADO, ROL y GUARDIA.
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-200 px-3 py-2 text-center">ID</th>
                    <th className="border border-slate-200 px-3 py-2 text-center">Nombre completo</th>
                    <th className="border border-slate-200 px-3 py-2 text-center">Cédula</th>
                    <th className="border border-slate-200 px-3 py-2 text-center">Grado</th>
                    <th className="border border-slate-200 px-3 py-2 text-center">Rol</th>
                    <th className="border border-slate-200 px-3 py-2 text-center">Guardia</th>
                    <th className="border border-slate-200 px-3 py-2 text-center">Sanciones</th>
                  </tr>
                </thead>

                <tbody>
                  {companiaSeleccionada.cadetes.map((cadete) => (
                    <tr key={cadete.id} className="hover:bg-slate-50">
                      <td className="border border-slate-200 px-3 py-2 text-center">{cadete.id}</td>
                      <td className="border border-slate-200 px-3 py-2 text-center">
                        {getNombreCompleto(cadete)}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-center">{cadete.cc}</td>
                      <td className="border border-slate-200 px-3 py-2 text-center">{cadete.grado}</td>
                      <td className="border border-slate-200 px-3 py-2 text-center">{cadete.rol}</td>
                      <td className="border border-slate-200 px-3 py-2 text-center">{cadete.guardia}</td>

                      {/* Botón VER sanciones */}
                      <td className="border border-slate-200 px-3 py-2 text-center gap-2 flex justify-center items-center">
                        <button
                          type="button"
                          className="rounded-lg bg-blue-600 text-white px-3 py-1 text-xs hover:bg-blue-700 transition"
                          onClick={() => console.log("VER sanciones de", cadete)}
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-red-600 text-white px-3 py-1 text-xs hover:bg-red-700 transition"
                          onClick={() => console.log("APLICAR sanción a", cadete)}
                        >
                          Aplicar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </section>
    </main>
  );
}
