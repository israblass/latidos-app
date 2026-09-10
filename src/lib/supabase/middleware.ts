import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

/**
 * Refresca el token de Supabase en cada request y reescribe las cookies.
 * Sin esto la sesion expira al cabo de una hora y la persistencia que pide
 * la spec (§9 regla 4) se rompe al reabrir la app dias despues.
 */
export async function actualizarSesion(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesAEscribir) {
          cookiesAEscribir.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          respuesta = NextResponse.next({ request });
          cookiesAEscribir.forEach(({ name, value, options }) => {
            respuesta.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  try {
    await supabase.auth.getUser();
  } catch {
    // Sin conexion no se puede refrescar el token, pero la app tiene que
    // seguir renderizando con lo que haya en cache (constitution §9, offline).
  }

  return respuesta;
}
