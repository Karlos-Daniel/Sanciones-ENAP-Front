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

  const VALID_CEDULA = "1234567890";
  const VALID_PASSWORD = "123456";

  if (cedula === VALID_CEDULA && password === VALID_PASSWORD) {
    return new Response(
      JSON.stringify({ cedula } satisfies LoginActionData),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({
      error: "Cédula o contraseña incorrectas.",
      cedula,
    } satisfies LoginActionData),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export default function Home() {
  return <Welcome />;
}
