import type { Metadata, Viewport } from "next";
import { Anton, DM_Sans } from "next/font/google";
import "./globals.css";

import { RegistrarServiceWorker } from "@/components/pwa/registrar-service-worker";
import { FondoApp } from "@/components/marca/fondo-app";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
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
    // Base clara: barra de estado con contenido oscuro sobre el fondo blanco.
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
        {/* Detras de todo: es lo que le da material al vidrio esmerilado. */}
        <FondoApp />
        {children}
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
