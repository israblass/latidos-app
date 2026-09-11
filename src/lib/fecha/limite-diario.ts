/**
 * Corte del limite diario de escaneo.
 *
 * Una persona puede escanear el QR de una marca una vez al dia, y el conteo se
 * reinicia a medianoche, no a las 24 horas exactas del ultimo escaneo
 * (spec §9 regla 10).
 *
 * El corte se calcula en el servidor y no con el reloj del telefono: el plan
 * (Decision Tecnica 2) lo pide asi porque un reloj mal puesto no puede decidir
 * una regla de negocio.
 *
 * La zona es explicita y no la del proceso. En Vercel el servidor corre en UTC,
 * y ahi "medianoche del servidor" caeria a las 8 de la noche en Venezuela:
 * alguien que escanea a las 9pm veria su limite reiniciado el mismo dia. Se usa
 * la zona del programa, que es lo que la regla realmente quiere decir.
 */

export const ZONA_HORARIA = process.env.ZONA_HORARIA ?? "America/Caracas";

/** Desfase de la zona respecto a UTC, en minutos, para un instante dado. */
function desfaseEnMinutos(instante: Date, zona: string): number {
  // `en-CA` da el formato YYYY-MM-DD, que Date.parse entiende sin ambiguedad.
  const formateador = new Intl.DateTimeFormat("en-CA", {
    timeZone: zona,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const partes = Object.fromEntries(
    formateador.formatToParts(instante).map(({ type, value }) => [type, value]),
  );

  // La misma pared de reloj, leida como si fuera UTC.
  const comoUtc = Date.UTC(
    Number(partes.year),
    Number(partes.month) - 1,
    Number(partes.day),
    // A medianoche algunos entornos devuelven 24 en vez de 00.
    Number(partes.hour) % 24,
    Number(partes.minute),
    Number(partes.second),
  );

  return (comoUtc - instante.getTime()) / 60_000;
}

/**
 * Instante en que empezo el dia en curso, para comparar contra los escaneos
 * guardados. Todo escaneo con `confirmado_en` mayor o igual a esto ocurrio hoy.
 */
export function inicioDelDia(
  ahora: Date = new Date(),
  zona: string = ZONA_HORARIA,
): Date {
  const desfase = desfaseEnMinutos(ahora, zona);

  // Hora de pared en la zona, expresada como si fuera UTC.
  const pared = new Date(ahora.getTime() + desfase * 60_000);

  const medianochePared = Date.UTC(
    pared.getUTCFullYear(),
    pared.getUTCMonth(),
    pared.getUTCDate(),
  );

  // De vuelta a instante real. Se recalcula el desfase sobre la medianoche
  // tentativa porque un cambio de horario puede moverlo entre ambos momentos.
  const tentativa = new Date(medianochePared - desfase * 60_000);
  const desfaseEnLaMedianoche = desfaseEnMinutos(tentativa, zona);

  return desfaseEnLaMedianoche === desfase
    ? tentativa
    : new Date(medianochePared - desfaseEnLaMedianoche * 60_000);
}

/** True si el instante dado cae dentro del dia en curso. */
export function esDeHoy(
  instante: Date,
  ahora: Date = new Date(),
  zona: string = ZONA_HORARIA,
): boolean {
  return instante.getTime() >= inicioDelDia(ahora, zona).getTime();
}
