import type { Route } from "./+types/home";
import { Welcome } from "./welcome";
import type { LoginActionData } from "../models/types/auth";
import { construirCookieSesion } from "../models/session";

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

  console.log("Cedula (frontend):", cedula);
  console.log("Recordar:", remember);
  console.log("API_BASE_URL:", API_BASE_URL);

  if (!API_BASE_URL) {
    console.error("VITE_BACKEND_URL no está definida.");
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

    console.log("Respuesta del backend /login:", respuesta.status);

    if (respuesta.ok) {
      const data = await respuesta.json().catch(() => null);
      console.log("Payload backend:", data);

      const ccFromApi =
        (data && (data.cc ?? data.cedula ?? data.documento)) ?? cedula;

      const backendRolRaw = data?.rol ?? "user";
      const rol = String(backendRolRaw).toLowerCase();

      const idAutoridad: string | undefined = data?.ID_autoridad ?? undefined;
      const idAlumno: string | undefined = data?.ID_alumno ?? undefined;

      const cookie = construirCookieSesion({
        cedula: String(ccFromApi),
        rol,
        idAutoridad,
        idAlumno,
      });

      const destino = rol === "admin" ? "/dashboard" : "/mis-sanciones";

      return new Response(null, {
        status: 302,
        headers: {
          Location: destino,
          "Set-Cookie": cookie,
        },
      });

    }

    if (respuesta.status === 400 || respuesta.status === 401) {
      console.log("LOGIN FALLIDO EN BACKEND. Credenciales incorrectas.");
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

    console.error("Error inesperado del backend:", respuesta.status);
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
  } catch (error) {
    console.error("Error de red al llamar /login en el backend:", error);
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
