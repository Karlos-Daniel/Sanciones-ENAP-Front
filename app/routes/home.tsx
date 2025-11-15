import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import type { LoginActionData } from "../models/auth";

export function meta() {
  return [
    { title: "Login" },
    { name: "description", content: "Pantalla de login" },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const cedula = String(formData.get("cedula") || "");
  const password = String(formData.get("password") || "");
  const remember = formData.get("remember") === "on";

  console.log("DATOS RECIBIDOS DESDE EL FORMULARIO:");
  console.log("Cedula:", cedula);
  console.log("Contraseña:", password);
  console.log("Recordar:", remember);

  const VALID_CEDULA = "1234567890";
  const VALID_PASSWORD = "123456";

  // Login correcto → redirección a /dashboard
  if (cedula === VALID_CEDULA && password === VALID_PASSWORD) {
    console.log("LOGIN EXITOSO. Redirigiendo a /dashboard.");

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/dashboard", // redirección
      },
    });
  }

  console.log("LOGIN FALLIDO. Credenciales incorrectas.");

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

export default function Home() {
  return <Welcome />;
}
