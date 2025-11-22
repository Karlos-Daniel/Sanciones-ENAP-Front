import type { Route } from "./+types/home";
import { construirCookieSesion } from "../models/session";
import type { SessionData } from "../models/session";
import type { LoginActionData } from "~/models/types";
import { Welcome } from "./welcome";

export function meta() {
  return [
    { title: "Login" },
    { name: "description", content: "Pantalla de login" },
  ];
}

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const cedula = String(formData.get("cedula") || "");
  const password = String(formData.get("password") || "");
  const remember = formData.get("remember") === "on";

  if (!API_BASE_URL) {
    return new Response(
      JSON.stringify({
        error:
          "No se pudo contactar el servidor de autenticación. Falta configuración.",
        cedula,
      } as LoginActionData),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const respuesta = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cc: Number(cedula),
        password,
      }),
    });

    if (respuesta.ok) {
      const data = await respuesta.json().catch(() => null);

      const rol = String(data?.rol ?? "");
      const userId = String(data?.ID_autoridad ?? "");
      const token = data?.token ? String(data.token) : "";

      const sessionData: SessionData = {
        cedula,
        rol,
        userId,
        token,
      };

      const cookie = construirCookieSesion(sessionData);

      return new Response(null, {
        status: 302,
        headers: {
          Location:
            rol.toLowerCase() === "admin" ? "/dashboard" : "/mis-sanciones",
          "Set-Cookie": cookie,
        },
      });
    }

    if (respuesta.status === 400 || respuesta.status === 401) {
      return new Response(
        JSON.stringify({
          error: "Cédula o contraseña incorrectas.",
          cedula,
        } as LoginActionData),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Error inesperado al validar las credenciales.",
        cedula,
      } as LoginActionData),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({
        error:
          "No se pudo conectar con el servidor de autenticación. Intenta nuevamente.",
        cedula,
      } as LoginActionData),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export default function Home() {
  return <Welcome />;
}
