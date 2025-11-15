import { Form, useActionData, useNavigation } from "react-router";
import type { LoginActionData } from "../models/auth";

const LOGO_URL =
  "https://www.reservanavalcolombia.co/wp-content/uploads/2025/07/ESCUDO-ARMADA-Horizontal-Azul.png";

const BG_IMAGE_URL =
  "https://www.wradio.com.co/resizer/v2/YTW4XZPSPNHQFL4LR6GRA2ZKSQ.jpg?auth=5760a8427e6eb88d7c114a6b4f279da25a05d6b8b29d7ec164cc57da1eecf9e4&width=650&height=488&quality=70&smart=true";

const CARD_IMAGE_URL =
  "https://www.cgfm.mil.co/sites/default/files/styles/wide/public/2024-12/cogfm-arc-asume-primera-mujer-como-comandante-de-una-fragata-misilera-21.jpg?itok=NKeptpWP";

export function Welcome() {
  const actionData = useActionData<LoginActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <main className="relative min-h-screen flex items-center justify-center text-[var(--color-light)] overflow-hidden">

      {/* Fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${BG_IMAGE_URL})` }}
      />

      {/* Capa difuminada */}
      <div className="absolute inset-0 bg-[var(--color-dark)]/70 backdrop-blur-sm" />

      {/* Contenedor principal */}
      <div className="relative z-10 mx-4 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-[var(--color-primary)] bg-[var(--color-light)]">
        <div className="grid md:grid-cols-[1.2fr_1fr]">

          {/* PANEL IZQUIERDO */}
          <section className="bg-[var(--color-dark)] px-8 py-10 flex flex-col gap-8 justify-between">
            
            {/* Logo + texto */}
            <div className="space-y-6 flex flex-col justify-center items-center">
              <div className="w-40 md:w-48">
                <img
                  src={LOGO_URL}
                  alt="Armada de Colombia"
                  className="w-full object-contain drop-shadow-md"
                />
              </div>

              <div className="space-y-3 text-center md:text-left">
                <h1 className="text-3xl font-semibold leading-tight">
                  Bienvenido de nuevo
                </h1>
                <p className="text-sm text-[var(--color-light)]/90 max-w-md">
                  Inicia sesión con tu cédula para acceder al sistema y continuar
                  con la gestión de tu información de forma segura.
                </p>
              </div>
            </div>

            {/* CARDS INFORMATIVAS */}
            <div className="grid gap-3 text-xs text-[var(--color-light)]/90 mt-4">

              <div className="rounded-2xl bg-[var(--color-light)]/10 backdrop-blur-sm px-4 py-3">
                <p className="font-semibold">Interfaz institucional</p>
                <p className="text-[var(--color-light)]/80">
                  Inspirada en la imagen de la Armada de Colombia.
                </p>
              </div>

              <div className="rounded-2xl overflow-hidden bg-[var(--color-light)]/10 backdrop-blur-sm">
                <img
                  src={CARD_IMAGE_URL}
                  alt="Imagen institucional"
                  className="w-full object-cover h-24 md:h-32"
                />
                <div className="px-4 py-2 text-[var(--color-light)]">
                  <p className="font-semibold">Nuestra Fuerza</p>
                  <p className="text-xs text-[var(--color-light)]/80">
                    Un legado de servicio, preparación y compromiso.
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* PANEL DERECHO: LOGIN */}
          <section className="bg-[var(--color-light)] px-8 py-10 flex items-center">
            <div className="w-full space-y-6 text-[var(--color-dark)]">

              <header className="space-y-1">
                <h2 className="text-xl font-semibold">Inicia sesión</h2>
                <p className="text-sm text-slate-600">
                  Ingresa tu cédula y contraseña para continuar.
                </p>
              </header>

              <Form method="post" className="space-y-5" noValidate>
                
                {/* CEDULA */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="cedula"
                    className="block text-sm font-medium text-[var(--color-dark)]"
                  >
                    Cédula
                  </label>
                  <input
                    id="cedula"
                    name="cedula"
                    type="text"
                    required
                    autoComplete="off"
                    defaultValue={actionData?.cedula ?? ""}
                    className="w-full rounded-xl border border-slate-300 bg-[var(--color-light)] px-3 py-2.5 text-sm text-[var(--color-dark)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition"
                    placeholder="1234567890"
                  />
                </div>

                {/* CONTRASEÑA */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[var(--color-dark)]"
                  >
                    Contraseña
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-300 bg-[var(--color-light)] px-3 py-2.5 text-sm text-[var(--color-dark)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition"
                    placeholder="••••••••"
                  />

                  {actionData?.error && (
                    <p className="text-xs text-red-500 mt-1">
                      {actionData.error}
                    </p>
                  )}
                </div>

                {/* RECORDAR */}
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="remember"
                      className="h-4 w-4 rounded border-slate-400 bg-[var(--color-light)] text-[var(--color-primary)] focus:ring-0"
                    />
                    <span>Recuérdame</span>
                  </label>

                  <button
                    type="button"
                    className="text-[var(--color-primary)] hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {/* BOTÓN */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-1 inline-flex w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-light)] shadow-lg shadow-[var(--color-primary)]/40 hover:bg-[#355287] disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {isSubmitting ? "Ingresando..." : "Ingresar"}
                </button>

              </Form>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
