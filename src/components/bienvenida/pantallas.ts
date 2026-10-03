import { ILUSTRACIONES, type Ilustracion } from "@/lib/ilustraciones";

/**
 * Las cuatro pantallas de la bienvenida (constitution §2, v2.10.0), en orden
 * fijo. Las posiciones del arte estan en px de un lienzo de 390 x 430 (la
 * referencia aprobada); el componente las escala de forma uniforme.
 */

export type PiezaArte = {
  ilustracion: Ilustracion;
  /** Horizontal: desde el centro del lienzo (`centro`) o desde su borde izquierdo (`izquierda`). */
  centro?: number;
  izquierda?: number;
  top: number;
  /** Tamaño: por ancho o por alto (el otro sale de la proporcion del archivo). */
  ancho?: number;
  alto?: number;
  opacidad?: number;
  /** Alfa del drop-shadow navy (0 10px 22px). */
  sombra?: number;
};

export type Pantalla = {
  eyebrow: string;
  titulo: string;
  tituloFuerte: string;
  sub: string;
  /** Clase del campo de color de arriba (solo paleta + alfa). */
  campo: "campo-azul" | "campo-amarillo" | "campo-amarillo-suave";
  /** El logo sobre amarillo pleno usa la variante de LOGO_AMARILLO. */
  logoSobreAmarillo?: boolean;
  arte: PiezaArte[];
};

const I = ILUSTRACIONES;

export const PANTALLAS: Pantalla[] = [
  {
    eyebrow: "Programa UCV · 2026-2027",
    titulo: "Tu pulso",
    tituloFuerte: "cuenta",
    sub: "Asiste a los eventos, suma Beats y canjéalos por recompensas.",
    campo: "campo-azul",
    arte: [
      { ilustracion: I.circulosPulsoBienvenida, ancho: 620, centro: -310, top: -60, opacidad: 0.55 },
      { ilustracion: I.ecgPulsoAncho, ancho: 560, centro: -250, top: 236 },
      { ilustracion: I.corazonLatidoBienvenida, ancho: 330, centro: -165, top: 110 },
    ],
  },
  {
    eyebrow: "Eventos",
    titulo: "Vive cada",
    tituloFuerte: "evento",
    sub: "Cada evento del programa te suma Beats.",
    campo: "campo-amarillo",
    logoSobreAmarillo: true,
    arte: [
      { ilustracion: I.estadioUcv, ancho: 540, izquierda: -150, top: 108, sombra: 0.18 },
      { ilustracion: I.parlanteCorazones, alto: 300, centro: 6, top: 126, sombra: 0.28 },
    ],
  },
  {
    eyebrow: "Campus",
    titulo: "Recorre",
    tituloFuerte: "la UCV",
    sub: "Busca los QR por el campus y escanéalos para sumar Beats.",
    campo: "campo-amarillo-suave",
    arte: [
      { ilustracion: I.mapaCampus, ancho: 520, centro: -270, top: 104, sombra: 0.18 },
      { ilustracion: I.estatuaUcv, alto: 470, centro: 38, top: 90, sombra: 0.22 },
    ],
  },
  {
    eyebrow: "Recompensas",
    titulo: "Enciende",
    tituloFuerte: "tu pulso",
    sub: "Canjea tus Beats por recompensas.",
    campo: "campo-amarillo-suave",
    arte: [
      { ilustracion: I.vitralUcv, ancho: 540, centro: -300, top: 98, sombra: 0.18 },
      // Corrida 58px a la izquierda para que la llama no toque el logo.
      { ilustracion: I.velaCorazon, alto: 340, centro: -58, top: 122, sombra: 0.25 },
    ],
  },
];
