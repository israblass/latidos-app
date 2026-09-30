import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FormularioEntrar } from "@/components/sesion/formulario-entrar";
import { haySesion } from "@/lib/usuario/sesion";

export const metadata: Metadata = { title: "Entrar · Latidos" };

/**
 * /entrar: correo y contraseña para quien ya tiene cuenta. Si ya hay sesion,
 * no hay nada que hacer aqui: va a Inicio, que decide si toca el onboarding.
 */
export default async function Entrar() {
  if (await haySesion()) redirect("/inicio");
  return <FormularioEntrar />;
}
