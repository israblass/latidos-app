import { z } from "zod";

import { TIPOS_USUARIO } from "@/types/usuario";

/**
 * Validacion de los campos del registro.
 *
 * En Fase 1 NINGUN campo se contrasta contra un padron real: la cedula no se
 * confirma contra un registro oficial, el correo no se verifica y el telefono
 * tampoco (spec §9 regla 2 y §10 suposiciones 15 y 16). Lo que sigue es solo
 * sintaxis basica para evitar campos vacios o claramente mal escritos, y esta
 * pensado para que mas adelante se le enchufe la verificacion real (OTP) sin
 * rehacer el formulario.
 */

export const cedulaSchema = z
  .string()
  .trim()
  .min(1, "Escribe tu cedula")
  // Texto libre a proposito: solo se acota el largo para descartar pegados accidentales.
  .max(30, "Revisa tu cedula");

export const nombreSchema = z
  .string()
  .trim()
  .min(1, "Escribe tu nombre")
  .max(60, "Revisa tu nombre");

export const apellidoSchema = z
  .string()
  .trim()
  .min(1, "Escribe tu apellido")
  .max(60, "Revisa tu apellido");

export const telefonoSchema = z
  .string()
  .trim()
  .min(1, "Escribe tu telefono")
  // Sintaxis basica: digitos, con separadores comunes permitidos.
  .regex(/^[+\d][\d\s()-]{6,19}$/, "Escribe tu telefono solo con numeros");

export const correoSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Escribe tu correo")
  // Sintaxis basica: que tenga arroba y un dominio con punto.
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Revisa tu correo");

export const tipoUsuarioSchema = z.enum(TIPOS_USUARIO, {
  message: "Elige una opcion",
});

export const contrasenaSchema = z
  .string()
  // Minimo de Supabase Auth por defecto.
  .min(6, "Usa al menos 6 caracteres");

export const pasoCedulaSchema = z.object({ cedula: cedulaSchema });

export const pasoNombreSchema = z.object({
  nombre: nombreSchema,
  apellido: apellidoSchema,
});

export const pasoTelefonoSchema = z.object({ telefono: telefonoSchema });

export const pasoCorreoSchema = z.object({ correo: correoSchema });

export const pasoTipoUsuarioSchema = z.object({
  tipo_usuario: tipoUsuarioSchema,
});

export const pasoContrasenaSchema = z.object({ contrasena: contrasenaSchema });

/** Payload completo que viaja al endpoint de registro (contrato del plan §3). */
export const registroCompletoSchema = z.object({
  cedula: cedulaSchema,
  nombre: nombreSchema,
  apellido: apellidoSchema,
  telefono: telefonoSchema,
  correo: correoSchema,
  tipo_usuario: tipoUsuarioSchema,
  contrasena: contrasenaSchema,
});

export type RegistroCompleto = z.infer<typeof registroCompletoSchema>;

/** Devuelve el primer mensaje de error de un campo, o null si es valido. */
export function primerError(
  schema: z.ZodType<unknown>,
  valor: unknown,
): string | null {
  const resultado = schema.safeParse(valor);
  return resultado.success ? null : (resultado.error.issues[0]?.message ?? null);
}
