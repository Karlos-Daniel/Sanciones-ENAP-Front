type AppHeaderProps = {
  cedula: string;
};

export function AppHeader({ cedula }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-[var(--color-primary)] bg-[var(--color-dark)]/90">
      <div>
        <h1 className="text-xl font-semibold">
          Panel de administración - Escuadrón
        </h1>
        <p className="text-sm text-[var(--color-light)]/70">
          Sesión: {cedula}
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
  );
}
