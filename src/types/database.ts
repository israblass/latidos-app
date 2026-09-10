/**
 * Tipado del esquema de Supabase usado por los clientes.
 * Se mantiene a mano en Fase 1; cuando el esquema crezca conviene generarlo
 * con `supabase gen types typescript`.
 */

import type { TipoUsuario, Usuario } from "@/types/usuario";

export type Database = {
  public: {
    Tables: {
      usuarios: {
        Row: Usuario;
        Insert: Omit<
          Usuario,
          | "onboarding_visto"
          | "notificaciones_habilitadas"
          | "beats_balance"
          | "created_at"
          | "updated_at"
        > &
          Partial<
            Pick<
              Usuario,
              "onboarding_visto" | "notificaciones_habilitadas" | "beats_balance"
            >
          >;
        Update: Partial<Omit<Usuario, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      tipo_usuario: TipoUsuario;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
