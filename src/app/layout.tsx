import type { Metadata, Viewport } from "next";
import { Anton, DM_Sans } from "next/font/google";
import "./globals.css";

import { LimpiarCacheSesion } from "@/components/pwa/limpiar-cache-sesion";
import { RegistrarServiceWorker } from "@/components/pwa/registrar-service-worker";
import { RecargarAlVolver } from "@/components/sesion/recargar-al-volver";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-VE" className={`${anton.variable} ${dmSans.variable}`}>
      <body className="min-h-dvh bg-fondo">
        {children}
        <RegistrarServiceWorker />
        <LimpiarCacheSesion />
        <RecargarAlVolver />
      </body>
    </html>
  );
}
