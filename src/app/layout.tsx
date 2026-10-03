import type { Metadata, Viewport } from "next";
import { Anton, DM_Sans } from "next/font/google";
import "./globals.css";

import { LimpiarCacheSesion } from "@/components/pwa/limpiar-cache-sesion";
import { RegistrarServiceWorker } from "@/components/pwa/registrar-service-worker";
import { SplashInicial } from "@/components/pwa/splash-inicial";
import { RecargarAlVolver } from "@/components/sesion/recargar-al-volver";
import { IMAGENES_SPLASH } from "@/lib/splash";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Latidos",
  description:
    "Latidos UCV: participa, suma Beats y canjea recompensas del programa.",
  manifest: "/manifest.json",
  applicationName: "Latidos",
  appleWebApp: {
    // Hace que iOS abra la app a pantalla completa cuando se instala desde
    // "Agregar a pantalla de inicio".
    capable: true,
    title: "Latidos",
    // Base clara: barra de estado con contenido oscuro sobre el fondo crema.
    statusBarStyle: "default",
    // Imagenes de arranque (v2.10.1): sin ellas iOS abre la app instalada en
    // blanco mientras carga. Una por tamaño de iPhone (src/lib/splash.ts).
    startupImage: IMAGENES_SPLASH,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  // El crema de la base (--color-fondo en globals.css). Aqui va escrito porque
  // el meta theme-color no puede leer variables CSS.
  themeColor: "#FFFFF5",
  width: "device-width",
  initialScale: 1,
  // Sin maximumScale: bloquear el zoom impide ampliar el texto a quien lo
  // necesita (WCAG 1.4.4). Los campos usan 16 px, asi que iOS no hace zoom
  // solo al escribir, que era lo que ese bloqueo evitaba.
  viewportFit: "cover",
};

/**
 * CSS critico de la pantalla de carga (SplashInicial), en linea en el <head>:
 * tiene que verse antes que cualquier hoja de estilos. Misma composicion que
 * las imagenes de arranque (scripts/splash-fuentes): crema, azul tenue arriba
 * a la derecha, azul abajo a la izquierda y resplandor amarillo al centro; el
 * icono a 0.33 del ancho, esquinas del 22.5% y 1% por encima del centro (con
 * flex centrado). Solo en la app instalada; el crema en html y body evita
 * cualquier cuadro en blanco. Pasados 8s se oculta solo, aunque falle el JS.
 */
const CSS_SPLASH = `
html,body{background:#FFFFF5}
#splash-inicial{display:none}
@media (display-mode: standalone){
#splash-inicial{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;pointer-events:none;background:radial-gradient(120% 70% at 50% 50%,rgba(253,251,5,.30),rgba(253,251,5,0) 62%),radial-gradient(90% 55% at 0% 100%,rgba(0,144,255,.34),rgba(0,144,255,0) 70%),radial-gradient(80% 50% at 100% 0%,rgba(0,144,255,.18),rgba(0,144,255,0) 70%),#FFFFF5;transition:opacity .25s ease-out;animation:splash-tope 0s linear 8s forwards}
#splash-inicial.saliendo{opacity:0}
#splash-inicial picture{display:block}
#splash-inicial img{display:block;width:clamp(96px,33vw,180px);height:auto;aspect-ratio:1/1;margin-top:-1vh;border-radius:22.5%;box-shadow:0 16px 38px rgba(26,35,50,.18),0 2px 6px rgba(26,35,50,.12)}
}
@media (prefers-reduced-motion: reduce){#splash-inicial{transition:none}}
@keyframes splash-tope{to{opacity:0;visibility:hidden}}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-VE" className={`${anton.variable} ${dmSans.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: CSS_SPLASH }} />
        {/* El icono de la pantalla de carga, solo si se va a ver. */}
        <link rel="preload" as="image" href="/icons/icon-512.png" media="(display-mode: standalone)" />
      </head>
      <body className="min-h-dvh bg-fondo">
        <SplashInicial />
        {children}
        <RegistrarServiceWorker />
        <LimpiarCacheSesion />
        <RecargarAlVolver />
      </body>
    </html>
  );
}
