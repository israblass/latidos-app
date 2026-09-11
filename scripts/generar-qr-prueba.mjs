#!/usr/bin/env node
/**
 * Genera las imagenes de los QR de prueba definidos en supabase/seed.sql.
 *
 * Todavia no existe la pantalla de admin que emite codigos, asi que esto cubre
 * el hueco para poder probar el escaneo con un telefono real.
 *
 * Uso:
 *   node scripts/generar-qr-prueba.mjs
 *   node scripts/generar-qr-prueba.mjs --url https://latidos.vercel.app
 *
 * Sin --url el QR lleva el id pelado: funciona dentro de la app, pero la camara
 * del telefono no sabe que hacer con el. Con --url el codigo abre la app
 * directamente en el escaner, que es lo comodo para probar desde el telefono.
 *
 * Las imagenes salen en qr-prueba/ (ignorado por git).
 */

import { mkdir, writeFile } from "node:fs/promises";
import QRCode from "qrcode";

const SALIDA = "qr-prueba";

/** Espejo de supabase/seed.sql. Si cambian alla, cambian aca. */
const CODIGOS = [
  {
    archivo: "kfc-sin-limite",
    id: "b2000000-0000-4000-8000-000000000001",
    descripcion: "KFC — 10 Beats, sin limite de usos",
  },
  {
    archivo: "pepsi-limite-3",
    id: "b2000000-0000-4000-8000-000000000002",
    descripcion: "Pepsi — 5 Beats, limite 3 usos",
  },
  {
    archivo: "pepsi-agotado",
    id: "b2000000-0000-4000-8000-000000000003",
    descripcion: "Pepsi — 5 Beats, limite 2, ya agotado",
  },
  {
    archivo: "movistar-inactivo",
    id: "b2000000-0000-4000-8000-000000000004",
    descripcion: "Movistar — 20 Beats, desactivado por el admin",
  },
];

const argumentos = process.argv.slice(2);
const indiceUrl = argumentos.indexOf("--url");
const base = indiceUrl >= 0 ? argumentos[indiceUrl + 1]?.replace(/\/$/, "") : null;

await mkdir(SALIDA, { recursive: true });

console.log(
  base
    ? `Generando QR que abren ${base}/escanear\n`
    : "Generando QR con el id pelado (usa --url <dominio> para que abran la app)\n",
);

for (const codigo of CODIGOS) {
  const contenido = base
    ? `${base}/escanear?qr=${codigo.id}`
    : codigo.id;

  const ruta = `${SALIDA}/${codigo.archivo}.png`;
  await QRCode.toFile(ruta, contenido, { width: 600, margin: 2 });

  // Tambien en SVG, que es lo que conviene mandar a imprimir.
  await writeFile(
    `${SALIDA}/${codigo.archivo}.svg`,
    await QRCode.toString(contenido, { type: "svg", margin: 2 }),
  );

  console.log(`${codigo.archivo}.png  ${codigo.descripcion}`);
  console.log(`   ${contenido}\n`);
}

console.log(`Listo. Las imagenes estan en ${SALIDA}/`);
