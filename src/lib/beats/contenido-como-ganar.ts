/**
 * Como se ganan Beats y en que se cambian: la unica fuente de ese contenido
 * (plan §4, decision 13; spec §9 regla 10).
 *
 * Lo usan la hoja "¿Cómo gano Beats?", el estado inicial de la pantalla de
 * Beats y la pantalla 2 del onboarding. Antes el onboarding tenia su propia
 * lista con montos fijos ("+5" por escanear) que no coincidian con lo que da
 * cada marca; con una sola lista no pueden volver a divergir.
 *
 * Reglas (spec §9 regla 11): sin montos fijos por escanear, y lo que todavia
 * no existe va marcado "Pronto" y no se puede tocar.
 */

export type EstadoItem = "disponible" | "pronto";

export type ItemComoGanar = {
  titulo: string;
  detalle: string;
  /** Archivo sin extension dentro de /assets/<carpeta>. */
  icono: string;
  carpeta: "iconos" | "recompensas";
  estado: EstadoItem;
};

export const FORMAS_DE_GANAR: readonly ItemComoGanar[] = [
  {
    titulo: "Escanea QR de marcas",
    detalle: "Cada marca da distinto.",
    icono: "icono-escanear-qr",
    carpeta: "iconos",
    estado: "disponible",
  },
  {
    titulo: "Dona insumos",
    detalle: "En los centros de acopio del programa.",
    icono: "icono-donar",
    carpeta: "iconos",
    estado: "pronto",
  },
  {
    titulo: "Haz voluntariado",
    detalle: "Suma trabajando en las jornadas.",
    icono: "icono-voluntariado",
    carpeta: "iconos",
    estado: "pronto",
  },
  {
    titulo: "Asiste a actividades",
    detalle: "Charlas y actividades del programa.",
    icono: "icono-actividad-curso",
    carpeta: "iconos",
    estado: "pronto",
  },
];

export const EN_QUE_LOS_CAMBIAS: readonly ItemComoGanar[] = [
  {
    titulo: "Entradas al concierto",
    detalle: "Zona general, media o frente de tarima.",
    icono: "recompensa-entrada-concierto",
    carpeta: "recompensas",
    estado: "pronto",
  },
  {
    titulo: "Merch de Latidos",
    detalle: "Bolsos, gorras y más.",
    icono: "recompensa-merch",
    carpeta: "recompensas",
    estado: "pronto",
  },
  {
    titulo: "Cursos universitarios",
    detalle: "Oratoria y otros, por convenio con la UCV.",
    icono: "recompensa-curso",
    carpeta: "recompensas",
    estado: "pronto",
  },
];

export const TITULO_COMO_GANAR = "Cómo los ganas";
export const TITULO_EN_QUE_CAMBIAS = "En qué los cambias";
