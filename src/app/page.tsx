import { CarruselBienvenida } from "@/components/bienvenida/carrusel-bienvenida";
import { PromptsInstalacion } from "@/components/instalacion/prompts-instalacion";

/**
 * Pantalla de bienvenida (T018; constitution §2, v2.10.0).
 *
 * Es la misma sin importar de donde venga la persona: QR fisico, link de
 * WhatsApp, campaña o la web informativa (spec §10 suposicion 1). Un carrusel
 * de cuatro pantallas con ilustraciones grandes sobre el degradado de marca
 * (sin el cielo de foto ni la card de vidrio de antes) y, fijos abajo, los dos
 * botones de deslizar: Registrarme y Ya tengo cuenta.
 *
 * El prompt de instalacion nunca bloquea nada: va arriba, como aviso flotante,
 * para no chocar con los botones.
 */
export default function Home() {
  return (
    <main className="bienvenida">
      <div aria-hidden="true" className="fondo-inicio" />
      <CarruselBienvenida />
      <PromptsInstalacion ubicacion="arriba" />
    </main>
  );
}
