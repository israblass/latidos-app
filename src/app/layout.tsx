import type { Metadata, Viewport } from "next";
import { Anton, DM_Sans } from "next/font/google";
import "./globals.css";

import { RegistrarServiceWorker } from "@/components/pwa/registrar-service-worker";

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
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0D1117",
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
        {children}
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
