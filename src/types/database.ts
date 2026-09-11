/**
 * Tipado del esquema de Supabase usado por los clientes.
 * Se mantiene a mano en Fase 1; cuando el esquema crezca conviene generarlo
 * con `supabase gen types typescript`.
 */

import type { ConfiguracionApp } from "@/types/configuracion";
import type { Escaneo, EstadoQR, Marca, QRMarca } from "@/types/qr";
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
      marcas: {
        Row: Marca;
        Insert: Omit<Marca, "id" | "created_at"> & Partial<Pick<Marca, "id">>;
        Update: Partial<Omit<Marca, "id" | "created_at">>;
        Relationships: [];
      };
      qr_marca: {
        Row: QRMarca;
        Insert: Omit<QRMarca, "id" | "created_at" | "updated_at"> &
          Partial<Pick<QRMarca, "id" | "escaneos_totales_contador" | "estado">>;
        Update: Partial<Omit<QRMarca, "id" | "created_at">>;
        Relationships: [];
      };
      configuracion_app: {
        Row: ConfiguracionApp;
        Insert: Partial<ConfiguracionApp>;
        Update: Partial<Omit<ConfiguracionApp, "id">>;
        Relationships: [];
      };
      escaneos: {
        Row: Escaneo;
        Insert: Omit<Escaneo, "id" | "created_at" | "confirmado_en"> &
          Partial<Pick<Escaneo, "id" | "confirmado_en">>;
        Update: Partial<Omit<Escaneo, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      confirmar_canje_qr: {
        Args: {
          p_qr_marca_id: string;
          p_inicio_del_dia: string;
          p_dia_local: string;
        };
        Returns: unknown;
      };
    };
    Enums: {
      tipo_usuario: TipoUsuario;
      estado_qr: EstadoQR;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
