/**
 * Modelo de datos del usuario final (plan §2, tabla `usuarios`).
 */

export const TIPOS_USUARIO = ["estudiante_ucv", "egresado", "externo"] as const;

export type TipoUsuario = (typeof TIPOS_USUARIO)[number];

/** Etiquetas que se muestran en pantalla para cada tipo de usuario. */
export const ETIQUETAS_TIPO_USUARIO: Record<TipoUsuario, string> = {
  estudiante_ucv: "Estudiante UCV",
  egresado: "Egresado",
  externo: "Externo",
};

export function esTipoUsuario(valor: unknown): valor is TipoUsuario {
  return TIPOS_USUARIO.includes(valor as TipoUsuario);
}

/**
 * Se declara como `type` y no como `interface` a proposito: el tipado de
 * Supabase exige que la fila satisfaga `Record<string, unknown>`, algo que las
 * interfaces no cumplen por no tener index signature implicito.
 */
export type Usuario = {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  tipo_usuario: TipoUsuario;
  onboarding_visto: boolean;
  notificaciones_habilitadas: boolean;
  beats_balance: number;
  created_at: string;
  updated_at: string;
};

/** Campos que el usuario declara durante el registro por pasos. */
export type DatosRegistroUsuario = Pick<
  Usuario,
  "cedula" | "nombre" | "apellido" | "telefono" | "correo" | "tipo_usuario"
>;
