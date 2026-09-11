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
          /*
           * Un paso mas oscuro que el #6B7280 de la constitution. Aquel da
           * 4.83:1 sobre blanco puro, apenas por encima del AA, y esa holgura
           * se consume en cuanto el texto cae sobre una superficie translucida:
           * sobre vidrio, con el cielo oscuro detras, bajaba a 3.63:1.
           *
           * Se probo primero subir el velo del fondo, que es lo que menos toca
           * la paleta, pero hacia falta llevarlo a 0.94 para recuperar el AA, y
           * a ese nivel el desenfoque se queda sin variacion que difuminar: se
           * perderia justo el efecto que el velo existe para permitir.
           *
           * Este tono da 4.90:1 en el peor caso posible sobre vidrio y 6.53:1
           * sobre blanco, asi que mejora el contraste en toda la app, no solo
           * donde hay vidrio.
           */
          secundario: "#565E6D",
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
        // Dos capas: una sombra corta que "pega" la card al fondo y una larga
        // y difusa que le da altura. Con una sola capa las cards se ven
        // planas, como recortadas sobre el blanco.
        card: "0 1px 2px rgba(16,24,40,0.04), 0 8px 24px -4px rgba(16,24,40,0.10)",
        elevado: "0 2px 4px rgba(16,24,40,0.05), 0 16px 40px -8px rgba(16,24,40,0.16)",
        barra: "0 -1px 2px rgba(16,24,40,0.04), 0 -8px 28px -6px rgba(16,24,40,0.12)",
      },
      keyframes: {
        // Entrada de pantalla: sube unos pocos pixeles mientras aparece.
        "entrar-pantalla": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        // El check del canje: entra pasado de tamaño y asienta.
        "aparecer-check": {
          "0%": { opacity: "0", transform: "scale(0.4)" },
          "60%": { opacity: "1", transform: "scale(1.12)" },
          "80%": { transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        // La tarjeta de exito, que llega un pelo despues del check.
        "entrar-tarjeta": {
          from: { opacity: "0", transform: "translateY(16px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        girar: {
          to: { transform: "rotate(360deg)" },
        },
        // El latido detras del contador de Beats: respira en escala y opacidad.
        // Las dos curvas van juntas para que se lea como un pulso y no como un
        // parpadeo, y el minimo no baja a cero para que nunca desaparezca del
        // todo.
        latido: {
          "0%, 100%": { transform: "scale(0.88)", opacity: "0.45" },
          "50%": { transform: "scale(1.06)", opacity: "1" },
        },
      },
      animation: {
        "entrar-pantalla": "entrar-pantalla 260ms cubic-bezier(0.22,1,0.36,1) both",
        "aparecer-check": "aparecer-check 520ms cubic-bezier(0.34,1.56,0.64,1) 80ms both",
        "entrar-tarjeta": "entrar-tarjeta 340ms cubic-bezier(0.22,1,0.36,1) both",
        girar: "girar 700ms linear infinite",
        latido: "latido 3.6s ease-in-out infinite",
        "latido-rapido": "latido 900ms ease-in-out 2",
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
