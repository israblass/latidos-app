import Link from "next/link";

/**
 * Entrada a la app.
 *
 * La pantalla de bienvenida definitiva (branding completo + prompts de
 * instalacion PWA) es T018/T022 de la Fase 2. Esto es el punto de arranque
 * minimo para poder recorrer el registro.
 */
export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col justify-end px-5 pb-10 pt-16">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <h1 className="font-display text-[56px] uppercase leading-none text-primario">
          Latidos
        </h1>
        <p className="mt-4 max-w-xs text-texto-secundario">
          Participa, suma Beats y canjea recompensas del programa Latidos UCV.
        </p>
      </div>

      <Link href="/registro/paso-1" className="boton-primario">
        Registrarme
      </Link>
    </main>
  );
}
