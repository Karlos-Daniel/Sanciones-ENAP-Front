import type { Route } from "../+types/root";
import { useLoaderData } from "react-router";
import { leerSesionDesdeCookie } from "../models/session";

import type { DashboardLoaderData } from "../models/types";
import { DashboardPage } from "../components/dashboard/DashboardPage";

import {
  obtenerCompanias,
  obtenerTiposSancion,
  obtenerDuracionesSancion,
} from "../services/api";

export function meta() {
  return [
    { title: "Dashboard - Administración" },
    { name: "description", content: "Panel de administración de escuadrones" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const session = leerSesionDesdeCookie(cookieHeader);

  if (!session) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/" },
    });
  }

  try {
    const [companias, tiposSancion, duracionesSancion] = await Promise.all([
      obtenerCompanias(),
      obtenerTiposSancion(),
      obtenerDuracionesSancion(),
    ]);

    const data: DashboardLoaderData = {
      cedula: session.cedula,
      companias,
      sanciones: [],
      tiposSancion,
      duracionesSancion,
    };

    return data;
  } catch (e) {
    console.error("Error cargando datos del dashboard:", e);
    throw new Response("Error cargando datos del dashboard", { status: 500 });
  }
}

export default function DashboardRoute() {
  const data = useLoaderData() as DashboardLoaderData;
  return <DashboardPage data={data} />;
}
