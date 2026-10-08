import { ILUSTRACIONES, type Ilustracion } from "@/lib/ilustraciones";

/**
 * Las cuatro pantallas de la bienvenida (constitution §2, v2.10.0), en orden
 * fijo. Las posiciones del arte estan en px de un lienzo de 390 x 430 (la
 * referencia aprobada); el componente las escala de forma uniforme.
 */

/**
 * Area de reserva del logo LATIDOS (constitution §2, v2.10.1; pedido de la
 * diseñadora de la marca). El logo de la bienvenida mide 52px de alto, y el
 * wordmark (las letras LATIDOS, sin el badge que sube por encima) ocupa 121 de
 * los 156px del archivo: 40.3px en pantalla. La reserva es la mitad de esa
 * altura (~20px), alrededor del rectangulo que envuelve el wordmark y su badge
 * UCV, hacia arriba, abajo, izquierda y derecha. Ningun elemento figurativo de
 * las ilustraciones entra ahi; las texturas difusas de fondo (anillos de
 * ondas, lineas ECG que sangran, degradados) si pueden pasar por detras.
 */
export const ALTO_LOGO_BIENVENIDA = 52;
export const ALTO_WORDMARK = (ALTO_LOGO_BIENVENIDA * 121) / 156;
export const RESERVA_LOGO = 0.5 * ALTO_WORDMARK;

/**
 * Que es cada pieza respecto de la reserva del logo:
 * - "protagonista": la figura principal de la lamina (corazon, parlante,
 *   estatua, vela). Se escala con el pie anclado (`escala`, ~90%) y, si aun
 *   asi entrara en la reserva, se achica lo justo para quedar debajo. Con
 *   `hastaEtiqueta`, ademas termina 8px por encima de la etiqueta del titular.
 * - "escena": el escenario de atras (estadio, mural, vitral). No se achica:
 *   solo baja lo necesario para salir de la reserva; su parte de abajo ya
 *   queda bajo el texto, desvanecida por la mascara.
 * - sin rol: textura de fondo difusa, puede pasar por detras del logo.
 */
export type RolPieza = "protagonista" | "escena";

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
  rol?: RolPieza;
  /** Protagonista: escala de partida, con el pie anclado. */
  escala?: number;
  /** Protagonista: termina 8px por encima de la etiqueta del titular. */
  hastaEtiqueta?: boolean;
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
      { ilustracion: I.corazonLatidoBienvenida, ancho: 330, centro: -165, top: 110, rol: "protagonista", escala: 0.9, hastaEtiqueta: true },
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
      { ilustracion: I.estadioUcv, ancho: 540, izquierda: -150, top: 108, sombra: 0.18, rol: "escena" },
      { ilustracion: I.parlanteCorazones, alto: 300, centro: 6, top: 126, sombra: 0.28, rol: "protagonista", escala: 0.9, hastaEtiqueta: true },
    ],
  },
  {
    eyebrow: "Campus",
    titulo: "Recorre",
    tituloFuerte: "la UCV",
    sub: "Busca los QR por el campus y escanéalos para sumar Beats.",
    campo: "campo-amarillo-suave",
    arte: [
      { ilustracion: I.mapaCampus, ancho: 520, centro: -270, top: 104, sombra: 0.18, rol: "escena" },
      // La estatua queda a la derecha de la etiqueta: su base sigue bajo el texto.
      { ilustracion: I.estatuaUcv, alto: 470, centro: 38, top: 90, sombra: 0.22, rol: "protagonista", escala: 0.9 },
    ],
  },
  {
    eyebrow: "Recompensas",
    titulo: "Enciende",
    tituloFuerte: "tu pulso",
    sub: "Canjea tus Beats por recompensas.",
    campo: "campo-amarillo-suave",
    arte: [
      { ilustracion: I.vitralUcv, ancho: 540, centro: -300, top: 98, sombra: 0.18, rol: "escena" },
      // Corrida 58px a la izquierda para que la llama no toque el logo.
      { ilustracion: I.velaCorazon, alto: 340, centro: -58, top: 122, sombra: 0.25, rol: "protagonista", escala: 0.9, hastaEtiqueta: true },
    ],
  },
];
