import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { exigirPerfil } from "@/lib/usuario/sesion";

/**
 * El onboarding se ve una sola vez en la vida de la cuenta (spec §9 regla 5).
 * Quien ya lo vio entra directo a Inicio, aunque escriba la URL a mano.
 */
export default async function LayoutOnboarding({
  children,
}: {
  children: ReactNode;
}) {
  const perfil = await exigirPerfil();
  if (perfil.onboarding_visto) redirect("/inicio");

  return <>{children}</>;
}
