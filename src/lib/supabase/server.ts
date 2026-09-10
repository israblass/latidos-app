import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

/**
 * Cliente de Supabase para Server Components, Route Handlers y Server Actions.
 * Escribe las cookies de sesion cuando Supabase renueva o crea el token, lo que
 * mantiene la sesion iniciada entre aperturas de la app (spec §9 regla 4).
 *
 * En un Server Component el intento de escribir cookies lanza; se ignora porque
 * el middleware ya se encarga de refrescar la sesion en cada request.
 */
export function crearClienteServidor() {
  const almacenCookies = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return almacenCookies.getAll();
        },
        setAll(cookiesAEscribir) {
          try {
            cookiesAEscribir.forEach(({ name, value, options }) => {
              almacenCookies.set(name, value, options);
            });
          } catch {
            // Server Component: el middleware refresca la sesion.
          }
        },
      },
    },
  );
}
