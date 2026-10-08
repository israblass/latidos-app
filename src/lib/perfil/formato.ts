import { ZONA_HORARIA } from "@/lib/fecha/limite-diario";
import type { TipoUsuario } from "@/types/usuario";

/**
 * Formatos del Perfil v1 (constitution §2, v2.11.0). Funciones puras, sin red
 * ni pantalla: las prueba perfil.test.ts sin abrir el navegador.
 */

/** Como se nombra cada tipo en el chip del Perfil (el registro usa sus propias etiquetas). */
export const TIPO_EN_PERFIL: Record<TipoUsuario, string> = {
  estudiante_ucv: "Estudiante UCV",
  egresado: "Egresado UCV",
  externo: "Externo",
};

/** Primera letra del nombre y primera del apellido, en mayusculas. */
export function iniciales(nombre: string, apellido: string): string {
  const primera = (texto: string) => Array.from(texto.trim())[0] ?? "";
  return (primera(nombre) + primera(apellido)).toLocaleUpperCase("es");
}

const soloDigitos = (texto: string) => texto.replace(/\D/g, "");

/**
 * Cedula enmascarada: la letra si la escribieron (V, E...) y los ultimos 4
 * digitos. "V-12345678" -> "V-••••5678"; "21537993" -> "••••7993".
 */
export function enmascararCedula(cedula: string): { visible: string; leida: string } {
  const letra = /^\s*([A-Za-z])/.exec(cedula)?.[1]?.toUpperCase();
  const ultimos = soloDigitos(cedula).slice(-4);
  return {
    visible: `${letra ? `${letra}-` : ""}••••${ultimos}`,
    leida: `Cédula terminada en ${ultimos.split("").join(" ")}`,
  };
}

/**
 * Telefono parcialmente enmascarado: los 4 primeros digitos y los 4 ultimos.
 * "04241231977" -> "0424 ••• 1977".
 */
export function enmascararTelefono(telefono: string): { visible: string; leida: string } {
  const d = soloDigitos(telefono);
  const ultimos = d.slice(-4);
  return {
    visible: d.length >= 8 ? `${d.slice(0, 4)} ••• ${ultimos}` : `••• ${ultimos}`,
    leida: `Teléfono terminado en ${ultimos.split("").join(" ")}`,
  };
}

/** "Latiendo desde octubre 2026": mes en minuscula, en hora de Caracas. */
export function latiendoDesde(
  creadoEn: string | null | undefined,
  zona: string = ZONA_HORARIA,
): string | null {
  if (!creadoEn) return null;
  const fecha = new Date(creadoEn);
  if (Number.isNaN(fecha.getTime())) return null;
  const partes = new Intl.DateTimeFormat("es", {
    month: "long",
    year: "numeric",
    timeZone: zona,
  }).formatToParts(fecha);
  const mes = partes.find((p) => p.type === "month")?.value.toLocaleLowerCase("es");
  const anio = partes.find((p) => p.type === "year")?.value;
  return mes && anio ? `Latiendo desde ${mes} ${anio}` : null;
}
