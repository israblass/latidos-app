import type { Page } from "@playwright/test";

/**
 * Auditoria de accesibilidad basica (constitution §9): touch targets de 48px,
 * contraste AA en todos los textos, labels en todos los inputs.
 */

export interface Hallazgo {
  regla: string;
  detalle: string;
}

/** Contraste WCAG entre dos colores RGB. */
function contraste(uno: number[], otro: number[]): number {
  const luminancia = ([r, g, b]: number[]) => {
    const canal = (v: number) => {
      const n = v / 255;
      return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
  };
  const [alto, bajo] = [luminancia(uno), luminancia(otro)].sort((a, b) => b - a);
  return (alto + 0.05) / (bajo + 0.05);
}

const aNumeros = (color: string) =>
  (color.match(/[\d.]+/g) || []).slice(0, 3).map(Number);

/** Mezcla un color translucido sobre su fondo, para medir lo que se ve. */
const aplanar = (color: number[], alfa: number, fondo: number[]) =>
  color.map((c, i) => Math.round(c * alfa + fondo[i] * (1 - alfa)));

/** Altura minima de un touch target segun la constitution. */
const MINIMO_TOUCH = 48;

export async function auditar(page: Page): Promise<Hallazgo[]> {
  const datos = await page.evaluate(() => {
    const visible = (el: Element) => {
      const caja = el.getBoundingClientRect();
      const estilo = getComputedStyle(el);
      return (
        caja.width > 0 &&
        caja.height > 0 &&
        estilo.visibility !== "hidden" &&
        estilo.display !== "none"
      );
    };

    // Color de fondo efectivo, subiendo por los ancestros hasta uno opaco.
    const fondoDe = (el: Element): string => {
      let nodo: Element | null = el;
      while (nodo && nodo !== document.documentElement) {
        const fondo = getComputedStyle(nodo).backgroundColor;
        const canales = (fondo.match(/[\d.]+/g) || []).map(Number);
        if (canales.length >= 3 && (canales.length < 4 || canales[3] > 0.9)) return fondo;
        nodo = nodo.parentElement;
      }
      return "rgb(255, 255, 255)";
    };

    const textos: {
      texto: string;
      color: string;
      fondo: string;
      tam: number;
      peso: string;
    }[] = [];
    document.querySelectorAll("h1,h2,h3,h4,p,span,label,button,a,li,div").forEach((el) => {
      const propio = Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3 && n.textContent?.trim())
        .map((n) => n.textContent?.trim())
        .join(" ");
      if (!propio || !visible(el)) return;
      const estilo = getComputedStyle(el);
      textos.push({
        texto: propio.slice(0, 45),
        color: estilo.color,
        fondo: fondoDe(el),
        tam: parseFloat(estilo.fontSize),
        peso: estilo.fontWeight,
      });
    });

    const interactivos: { descripcion: string; alto: number; ancho: number }[] = [];
    document
      .querySelectorAll('a[href], button, input, select, textarea, [role="button"]')
      .forEach((el) => {
        if (!visible(el)) return;
        const caja = el.getBoundingClientRect();
        const etiqueta =
          el.getAttribute("aria-label") ||
          el.textContent?.trim().slice(0, 40) ||
          el.getAttribute("name") ||
          el.tagName.toLowerCase();
        interactivos.push({
          descripcion: `<${el.tagName.toLowerCase()}> ${etiqueta}`,
          alto: Math.round(caja.height),
          ancho: Math.round(caja.width),
        });
      });

    const camposSinEtiqueta: string[] = [];
    document.querySelectorAll("input, select, textarea").forEach((el) => {
      if (!visible(el)) return;
      const tipo = el.getAttribute("type");
      if (tipo === "hidden") return;
      const id = el.getAttribute("id");
      const tieneLabel = id ? Boolean(document.querySelector(`label[for="${id}"]`)) : false;
      const tieneAria =
        Boolean(el.getAttribute("aria-label")) ||
        Boolean(el.getAttribute("aria-labelledby")) ||
        Boolean(el.closest("label"));
      if (!tieneLabel && !tieneAria) {
        camposSinEtiqueta.push(
          `<${el.tagName.toLowerCase()} type="${tipo ?? ""}" name="${el.getAttribute("name") ?? ""}">`,
        );
      }
    });

    const imagenesSinTexto: string[] = [];
    document.querySelectorAll("img, svg").forEach((el) => {
      if (!visible(el)) return;
      const decorativa =
        el.getAttribute("aria-hidden") === "true" || el.getAttribute("role") === "presentation";
      const alterno = el.getAttribute("alt") ?? el.getAttribute("aria-label");
      if (!decorativa && alterno === null) {
        imagenesSinTexto.push(
          `<${el.tagName.toLowerCase()}> ${el.getAttribute("src")?.slice(-40) ?? ""}`,
        );
      }
    });

    const encabezados = Array.from(document.querySelectorAll("h1")).filter(visible).length;

    return { textos, interactivos, camposSinEtiqueta, imagenesSinTexto, encabezados };
  });

  const hallazgos: Hallazgo[] = [];

  for (const t of datos.textos) {
    const frente = aNumeros(t.color);
    const fondo = aNumeros(t.fondo);
    if (frente.length < 3 || fondo.length < 3) continue;
    const alfa = (t.color.match(/[\d.]+/g) || [])[3];
    const efectivo = alfa ? aplanar(frente, parseFloat(alfa), fondo) : frente;
    const razon = contraste(efectivo, fondo);
    const grande = t.tam >= 24 || (t.tam >= 18.66 && Number(t.peso) >= 700);
    const minimo = grande ? 3 : 4.5;
    if (razon < minimo) {
      hallazgos.push({
        regla: "contraste AA",
        detalle: `${razon.toFixed(2)}:1 (minimo ${minimo}) — "${t.texto}" ${t.color} sobre ${t.fondo}`,
      });
    }
  }

  for (const i of datos.interactivos) {
    if (i.alto < MINIMO_TOUCH) {
      hallazgos.push({
        regla: "touch target 48px",
        detalle: `${i.ancho}x${i.alto}px — ${i.descripcion}`,
      });
    }
  }

  for (const campo of datos.camposSinEtiqueta) {
    hallazgos.push({ regla: "label en inputs", detalle: `sin etiqueta accesible: ${campo}` });
  }

  for (const imagen of datos.imagenesSinTexto) {
    hallazgos.push({
      regla: "texto alternativo",
      detalle: `sin alt ni aria-hidden: ${imagen}`,
    });
  }

  if (datos.encabezados !== 1) {
    hallazgos.push({
      regla: "un h1 por pantalla",
      detalle: `se encontraron ${datos.encabezados} elementos h1 visibles`,
    });
  }

  return hallazgos;
}

/** Formatea los hallazgos para que el fallo del test se lea de una vez. */
export const informe = (pantalla: string, hallazgos: Hallazgo[]) =>
  `${pantalla}: ${hallazgos.length} problema(s)\n` +
  hallazgos.map((h) => `  [${h.regla}] ${h.detalle}`).join("\n");
