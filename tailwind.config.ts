import type { Config } from "tailwindcss";

/**
 * Tokens del design system de Latidos App (constitution §2, v2.1.0).
 *
 * Base clara. El amarillo de marca es muy luminoso: sirve como FONDO con texto
 * oscuro encima, no como color de texto sobre blanco. Por eso los tokens
 * separan los colores de relleno de sus variantes legibles como texto.
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

        fondo: "#FFFFFF",
        "fondo-alterno": "#F5F7FA",
        // Uso puntual, para bloques que necesitan contraste fuerte (el contador
        // de Beats, el hero de Beats). Nunca como base de pantalla.
        oscuro: "#0D1117",

        texto: {
          principal: "#1A2332",
          secundario: "#6B7280",
          terciario: "#9CA3AF",
          // Para texto sobre superficies oscuras o sobre el amarillo.
          inverso: "#FFFFFF",
        },

        exito: "#2EA043",
        alerta: "#D29922",
        error: "#F85149",

        // Variantes oscurecidas para TEXTO sobre fondo claro. Los colores de
        // arriba se quedan entre 3.3:1 y 3.4:1 contra el blanco, por debajo del
        // AA que pide la constitution §9. Se usan solo para texto; los rellenos,
        // bordes e iconos siguen con el color de marca.
        "secundario-texto": "#0070CC",
        "exito-texto": "#15803D",
        "alerta-texto": "#9A6700",
        "error-texto": "#B3261E",
      },
      borderColor: {
        sutil: "rgba(0,0,0,0.08)",
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.06)",
        elevado: "0 4px 20px rgba(0,0,0,0.08)",
        barra: "0 -2px 12px rgba(0,0,0,0.06)",
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
