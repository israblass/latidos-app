import type { Config } from "tailwindcss";

/**
 * Tokens del design system de Latidos App (constitution §2).
 * Los nombres son en espanol para que el codigo hable el mismo idioma
 * que la constitution y el resto del producto.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primario: "#FDFB05",
        secundario: "#0090FF",
        fondo: "#0D1117",
        superficie: "#161B22",
        elevado: "#21262D",
        texto: {
          principal: "#FFFFFF",
          secundario: "#8B949E",
          terciario: "#484F58",
        },
        exito: "#2EA043",
        alerta: "#D29922",
        error: "#F85149",
      },
      borderColor: {
        sutil: "rgba(255,255,255,0.08)",
      },
      fontFamily: {
        display: ["var(--font-anton)", "Impact", "sans-serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        control: "12px",
        sheet: "24px",
      },
      minHeight: {
        touch: "48px",
      },
      letterSpacing: {
        etiqueta: "0.1em",
      },
    },
  },
  plugins: [],
};
export default config;
