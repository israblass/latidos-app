/**
 * Ids de los QR de prueba, espejo de supabase/seed.sql.
 *
 * Son fijos a proposito: mientras no exista la pantalla de admin, es la unica
 * forma de tener codigos reproducibles para imprimir y para probar.
 */
export const QR = {
  /** KFC, 10 Beats, sin limite total. El caso feliz. */
  sinLimite: "b2000000-0000-4000-8000-000000000001",
  /** Pepsi, 5 Beats, limite 3, sin usar. */
  conCupo: "b2000000-0000-4000-8000-000000000002",
  /** Pepsi, 5 Beats, limite 2, ya usado 2 veces. */
  agotado: "b2000000-0000-4000-8000-000000000003",
  /** Movistar, 20 Beats, desactivado por el admin. */
  inactivo: "b2000000-0000-4000-8000-000000000004",
  /** No existe en la base. */
  inexistente: "b2000000-0000-4000-8000-00000000beef",
} as const;

export const MARCA = { sinLimite: "KFC", conCupo: "Pepsi" } as const;
