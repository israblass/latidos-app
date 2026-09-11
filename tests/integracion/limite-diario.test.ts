import { expect, test } from "@playwright/test";
import type { Pool } from "pg";

import {
  MOTIVO_SIN_BASE,
  conexionComoUsuario,
  crearUsuario,
  hayBaseDeDatos,
  prepararBase,
} from "../ayudantes/base-de-datos";
import { inicioDelDia, esDeHoy } from "../../src/lib/fecha/limite-diario";

/**
 * T064 / V024 — el limite diario se reinicia a medianoche hora local, no a las
 * 24 horas exactas del ultimo escaneo (spec §9 regla 10).
 *
 * Dos capas: el calculo del corte (puro, sin base) y el indice unico que lo
 * sostiene en Postgres.
 */

const CARACAS = "America/Caracas";

test.describe("el corte del dia se calcula en la zona del programa", () => {
  test("medianoche de Caracas, no del servidor en UTC", () => {
    // En Vercel el proceso corre en UTC, donde medianoche cae a las 8pm en
    // Venezuela. Alguien que escanea a las 9pm veria su limite reiniciado el
    // mismo dia si el corte se tomara del reloj del proceso.
    // Este instante ya es dia 15 en UTC, pero todavia es dia 14 en Caracas:
    // exactamente el hueco donde el corte del servidor daria el dia equivocado.
    const nueveDeLaNoche = new Date("2026-09-15T01:00:00Z"); // 21:00 del 14
    const corte = inicioDelDia(nueveDeLaNoche, CARACAS);

    // Caracas es UTC-4: la medianoche del 14 local es 04:00Z del 14.
    expect(corte.toISOString()).toBe("2026-09-14T04:00:00.000Z");
    expect(corte.getTime()).toBeLessThan(nueveDeLaNoche.getTime());

    // Tomar la medianoche UTC habria cortado el dia cuatro horas antes, y el
    // escaneo de las 9pm habria quedado contado como del dia siguiente.
    const medianocheUtc = new Date("2026-09-15T00:00:00.000Z");
    expect(corte.getTime()).not.toBe(medianocheUtc.getTime());
    expect(esDeHoy(new Date("2026-09-15T00:30:00Z"), nueveDeLaNoche, CARACAS)).toBe(true);
  });

  test("a las 11pm y a la 1am de Caracas el corte es distinto", () => {
    const onceDeLaNoche = new Date("2026-09-15T03:00:00Z"); // 23:00 del 14
    const unaDeLaManana = new Date("2026-09-15T05:00:00Z"); // 01:00 del 15

    expect(inicioDelDia(onceDeLaNoche, CARACAS).toISOString()).toBe(
      "2026-09-14T04:00:00.000Z",
    );
    expect(inicioDelDia(unaDeLaManana, CARACAS).toISOString()).toBe(
      "2026-09-15T04:00:00.000Z",
    );
  });

  test("un escaneo de las 11pm ya no es de hoy pasada la medianoche", () => {
    // El caso que la regla quiere cubrir: dos horas de diferencia, pero cruzando
    // medianoche, si reinician el limite.
    const escaneo = new Date("2026-09-15T03:00:00Z"); // 23:00 del 14 en Caracas
    const antesDeMedianoche = new Date("2026-09-15T03:30:00Z"); // 23:30 del 14
    const despuesDeMedianoche = new Date("2026-09-15T04:30:00Z"); // 00:30 del 15

    expect(esDeHoy(escaneo, antesDeMedianoche, CARACAS)).toBe(true);
    expect(esDeHoy(escaneo, despuesDeMedianoche, CARACAS)).toBe(false);
  });

  test("23 horas despues puede seguir siendo 'hoy' si no cruzo medianoche", () => {
    // Al reves que el caso anterior: mucho tiempo, pero sin cambiar de dia.
    const escaneo = new Date("2026-09-15T04:30:00Z"); // 00:30 del 15
    const casiUnDiaDespues = new Date("2026-09-16T03:00:00Z"); // 23:00 del 15

    expect(esDeHoy(escaneo, casiUnDiaDespues, CARACAS)).toBe(true);
  });
});

test.describe("el indice unico sostiene el limite en la base", () => {
  test.skip(!hayBaseDeDatos, MOTIVO_SIN_BASE);

  let pool: Pool;
  const BASE = "latidos_pruebas_limite_diario";
  const QR = "d4000000-0000-4000-8000-0000000000a1";
  const MARCA = "d4000000-0000-4000-8000-0000000000b1";

  test.beforeAll(async () => {
    pool = await prepararBase(BASE);
  });

  test.afterAll(async () => {
    await pool?.end();
  });

  test.beforeEach(async () => {
    await pool.query(`delete from public.escaneos`);
    await pool.query(`delete from public.qr_marca where id = $1`, [QR]);
    await pool.query(`delete from public.marcas where id = $1`, [MARCA]);
    await pool.query(`insert into public.marcas (id, nombre) values ($1, 'Marca diaria')`, [MARCA]);
    await pool.query(
      `insert into public.qr_marca
         (id, marca_id, beats_otorgados, limite_total_escaneos, escaneos_totales_contador, estado)
       values ($1, $2, 9, null, 0, 'activo')`,
      [QR, MARCA],
    );
  });

  const confirmar = async (usuarioId: string, dia: string) => {
    const conexion = await conexionComoUsuario(BASE, usuarioId);
    try {
      const { rows } = await conexion.query(
        `select public.confirmar_canje_qr($1, $2::timestamptz, $3::date) as resultado`,
        [QR, `${dia}T00:00:00-04:00`, dia],
      );
      return rows[0].resultado as { ok: boolean; motivo?: string };
    } finally {
      await conexion.end();
    }
  };

  test("el mismo QR dos veces el mismo dia solo pasa una vez", async () => {
    const usuario = await crearUsuario(pool, `dia-a-${Date.now()}@ejemplo.com`);

    expect((await confirmar(usuario, "2026-09-15")).ok).toBe(true);
    const segunda = await confirmar(usuario, "2026-09-15");
    expect(segunda.ok).toBe(false);
    expect(segunda.motivo).toBe("ya_escaneado_hoy");
  });

  test("al cruzar medianoche el mismo QR vuelve a estar disponible", async () => {
    // V024: el reinicio es por dia calendario, no por ventana de 24 horas.
    const usuario = await crearUsuario(pool, `dia-b-${Date.now()}@ejemplo.com`);

    expect((await confirmar(usuario, "2026-09-15")).ok).toBe(true);
    expect((await confirmar(usuario, "2026-09-16")).ok).toBe(true);

    const { rows } = await pool.query(
      `select count(*)::int as total, coalesce(sum(beats_otorgados),0)::int as beats
         from public.escaneos where usuario_id = $1`,
      [usuario],
    );
    expect(rows[0].total).toBe(2);
    expect(rows[0].beats).toBe(18);
  });

  test("el limite es por persona: el escaneo de otro no me bloquea", async () => {
    const una = await crearUsuario(pool, `dia-c-${Date.now()}@ejemplo.com`);
    const otra = await crearUsuario(pool, `dia-d-${Date.now()}@ejemplo.com`);

    expect((await confirmar(una, "2026-09-15")).ok).toBe(true);
    expect((await confirmar(otra, "2026-09-15")).ok).toBe(true);
  });

  test("el limite es por QR: otro codigo de la misma marca es otro cupo diario", async () => {
    // Nota de alcance: la spec dice "una vez por marca por dia", pero el indice
    // unico es por (usuario, qr_marca, dia). Con dos QR distintos de la misma
    // marca, hoy se puede sumar dos veces. Ver README, cabos sueltos.
    const usuario = await crearUsuario(pool, `dia-e-${Date.now()}@ejemplo.com`);
    const otroQR = "d4000000-0000-4000-8000-0000000000a2";
    await pool.query(
      `insert into public.qr_marca
         (id, marca_id, beats_otorgados, limite_total_escaneos, escaneos_totales_contador, estado)
       values ($1, $2, 9, null, 0, 'activo')
       on conflict (id) do nothing`,
      [otroQR, MARCA],
    );

    expect((await confirmar(usuario, "2026-09-15")).ok).toBe(true);

    const conexion = await conexionComoUsuario(BASE, usuario);
    const { rows } = await conexion.query(
      `select public.confirmar_canje_qr($1, $2::timestamptz, $3::date) as resultado`,
      [otroQR, "2026-09-15T00:00:00-04:00", "2026-09-15"],
    );
    await conexion.end();

    expect(rows[0].resultado.ok).toBe(true);
  });
});
