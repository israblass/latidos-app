import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Videos y4m con un QR, para alimentar la camara falsa de Chromium.
 *
 * Se arman a mano porque el ffmpeg que trae Playwright no decodifica PNG. El
 * tamaño del codigo dentro del cuadro es un parametro a proposito: qr-scanner
 * solo analiza una parte del video, asi que un QR que se ve perfecto puede no
 * leerse si se sale de esa zona, y eso hay que poder probarlo.
 */

const ANCHO = 640;
const ALTO = 480;
const CUADROS = 120;

export interface OpcionesQR {
  /** Que lleva codificado. */
  contenido: string;
  /** Cuanto del lado menor del cuadro ocupa el codigo, de 0 a 1. */
  ocupacion?: number;
}

/** Escribe un y4m con el QR quieto en el centro y devuelve su ruta. */
export function videoConQR({ contenido, ocupacion = 0.55 }: OpcionesQR): string {
  // Se importa aqui y no arriba para no cargar qrcode en pruebas que no lo usan.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const QRCode = require("qrcode") as typeof import("qrcode");
  const qr = QRCode.create(contenido, { errorCorrectionLevel: "M" });
  const lados = qr.modules.size;
  const modulos = qr.modules.data;

  const escala = Math.max(1, Math.floor((Math.min(ANCHO, ALTO) * ocupacion) / lados));
  const pixeles = escala * lados;
  const x0 = Math.floor((ANCHO - pixeles) / 2);
  const y0 = Math.floor((ALTO - pixeles) / 2);

  const Y = Buffer.alloc(ANCHO * ALTO, 235); // claro
  const U = Buffer.alloc((ANCHO / 2) * (ALTO / 2), 128);
  const V = Buffer.alloc((ANCHO / 2) * (ALTO / 2), 128);

  for (let fila = 0; fila < lados; fila += 1) {
    for (let columna = 0; columna < lados; columna += 1) {
      if (!modulos[fila * lados + columna]) continue;
      for (let dy = 0; dy < escala; dy += 1) {
        const y = y0 + fila * escala + dy;
        if (y < 0 || y >= ALTO) continue;
        const inicio = y * ANCHO + x0 + columna * escala;
        Y.fill(16, inicio, inicio + escala); // oscuro
      }
    }
  }

  const partes: Buffer[] = [
    Buffer.from(`YUV4MPEG2 W${ANCHO} H${ALTO} F15:1 Ip A1:1 C420\n`),
  ];
  for (let i = 0; i < CUADROS; i += 1) {
    partes.push(Buffer.from("FRAME\n"), Y, U, V);
  }

  const ruta = join(mkdtempSync(join(tmpdir(), "qr-")), "camara.y4m");
  writeFileSync(ruta, Buffer.concat(partes));
  return ruta;
}

/** Argumentos de Chromium para que la camara reproduzca ese video. */
export const camaraCon = (rutaVideo: string) => [
  "--use-fake-ui-for-media-stream",
  "--use-fake-device-for-media-stream",
  `--use-file-for-fake-video-capture=${rutaVideo}`,
];
