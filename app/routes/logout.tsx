import type { Route } from "../+types/root";
import { limpiarCookieSesion } from "../models/session";

export async function loader({}: Route.LoaderArgs) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
      "Set-Cookie": limpiarCookieSesion(),
    },
  });
}

export async function action({}: Route.ActionArgs) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
      "Set-Cookie": limpiarCookieSesion(),
    },
  });
}

export default function Logout() {
  // No se llega a renderizar en la práctica porque loader/action redirigen.
  return null;
}
