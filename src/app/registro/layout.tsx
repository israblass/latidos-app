"use client";

import type { ReactNode } from "react";

import { ProveedorRegistro } from "@/hooks/use-registro-form";

/**
 * El proveedor vive en el layout para que el estado sobreviva la navegacion
 * entre pasos, pero se pierda por completo al recargar o cerrar la app.
 */
export default function LayoutRegistro({ children }: { children: ReactNode }) {
  return <ProveedorRegistro>{children}</ProveedorRegistro>;
}
