import { expect, test } from "@playwright/test";
import type { Pool } from "pg";

import {
  MOTIVO_SIN_BASE,
  conexionComoUsuario,
  crearUsuario,
  hayBaseDeDatos,
  prepararBase,
} from "../ayudantes/base-de-datos";

/**
 * T063 / V025 — dos confirmaciones casi simultaneas sobre un QR con
 * limite_total_escaneos = 1: solo una puede completarse.
 *
 * Corre contra Postgres de verdad a proposito. Lo que se prueba aqui es el
 * bloqueo de fila que serializa las dos transacciones, y eso solo existe en
 * Postgres: contra el mock la prueba pasaria sin demostrar nada.
 */
test.describe("condicion de carrera al confirmar el canje", () => {
  test.skip(!hayBaseDeDatos, MOTIVO_SIN_BASE);

  let pool: Pool;
  const BASE = "latidos_pruebas_concurrencia";
  const QR = "c3000000-0000-4000-8000-0000000000a1";
  const MARCA = "c3000000-0000-4000-8000-0000000000b1";

  test.beforeAll(async () => {
    pool = await prepararBase(BASE);
  });

  test.afterAll(async () => {
    await pool?.end();
  });

  test.beforeEach(async () => {
    // Un QR con un solo cupo: el escenario exacto de la verificacion.
    await pool.query(`delete from public.escaneos`);
    await pool.query(`delete from public.qr_marca where id = $1`, [QR]);
    await pool.query(`delete from public.marcas where id = $1`, [MARCA]);
    await pool.query(
      `insert into public.marcas (id, nombre) values ($1, 'Marca de carrera')`,
      [MARCA],
    );
    await pool.query(
      `insert into public.qr_marca
         (id, marca_id, beats_otorgados, limite_total_escaneos, escaneos_totales_contador, estado)
       values ($1, $2, 7, 1, 0, 'activo')`,
      [QR, MARCA],
    );
  });

  test("con limite 1, de dos confirmaciones simultaneas solo pasa una", async () => {
    const primera = await crearUsuario(pool, `carrera-a-${Date.now()}@ejemplo.com`);
    const segunda = await crearUsuario(pool, `carrera-b-${Date.now()}@ejemplo.com`);

    const hoy = new Date().toISOString().slice(0, 10);
    const inicioDelDia = `${hoy}T00:00:00Z`;

    /**
     * Las dos conexiones se citan en el mismo instante: cada una duerme hasta
     * un arranque comun antes de llamar a la funcion. Sin esa cita, la primera
     * terminaria antes de que la segunda empiece y no habria carrera que probar.
     */
    const arranque = Date.now() + 1500;
    const confirmar = async (usuarioId: string) => {
      const conexion = await conexionComoUsuario(BASE, usuarioId);
      try {
        await conexion.query(`select pg_sleep(greatest(0, $1::numeric))`, [
          (arranque - Date.now()) / 1000,
        ]);
        const { rows } = await conexion.query(
          `select public.confirmar_canje_qr($1, $2::timestamptz, $3::date) as resultado`,
          [QR, inicioDelDia, hoy],
        );
        return rows[0].resultado as { ok: boolean; motivo?: string; beats_otorgados?: number };
      } finally {
        await conexion.end();
      }
    };

    const [a, b] = await Promise.all([confirmar(primera), confirmar(segunda)]);
    const resultados = [a, b];

    const exitosos = resultados.filter((r) => r.ok);
    const rechazados = resultados.filter((r) => !r.ok);

    expect(exitosos, `resultados: ${JSON.stringify(resultados)}`).toHaveLength(1);
    expect(exitosos[0].beats_otorgados).toBe(7);
    expect(rechazados).toHaveLength(1);
    expect(rechazados[0].motivo).toBe("limite_alcanzado");

    // Y la base quedo coherente: un solo uso, un solo Escaneo, 7 Beats repartidos.
    const { rows: qr } = await pool.query(
      `select escaneos_totales_contador from public.qr_marca where id = $1`,
      [QR],
    );
    expect(qr[0].escaneos_totales_contador).toBe(1);

    const { rows: escaneos } = await pool.query(
      `select count(*)::int as total, coalesce(sum(beats_otorgados), 0)::int as beats
         from public.escaneos where qr_marca_id = $1`,
      [QR],
    );
    expect(escaneos[0].total).toBe(1);
    expect(escaneos[0].beats).toBe(7);

    const { rows: balances } = await pool.query(
      `select coalesce(sum(beats_balance), 0)::int as total
         from public.usuarios where id in ($1, $2)`,
      [primera, segunda],
    );
    expect(balances[0].total).toBe(7);
  });

  test("el cupo rechazado no queda consumido: nadie mas pierde su turno", async () => {
    // Si la transaccion perdedora dejara el contador movido, el QR quedaria
    // agotado sin que nadie haya ganado nada.
    const usuario = await crearUsuario(pool, `carrera-c-${Date.now()}@ejemplo.com`);
    const hoy = new Date().toISOString().slice(0, 10);

    await pool.query(`update public.qr_marca set limite_total_escaneos = 2 where id = $1`, [QR]);

    const confirmarCon = async (usuarioId: string) => {
      const conexion = await conexionComoUsuario(BASE, usuarioId);
      try {
        const { rows } = await conexion.query(
          `select public.confirmar_canje_qr($1, $2::timestamptz, $3::date) as resultado`,
          [QR, `${hoy}T00:00:00Z`, hoy],
        );
        return rows[0].resultado as { ok: boolean; motivo?: string };
      } finally {
        await conexion.end();
      }
    };

    // El mismo usuario dos veces el mismo dia: la segunda choca con el indice
    // unico, y eso debe abortar la transaccion entera, contador incluido.
    expect((await confirmarCon(usuario)).ok).toBe(true);
    const segunda = await confirmarCon(usuario);
    expect(segunda.ok).toBe(false);
    expect(segunda.motivo).toBe("ya_escaneado_hoy");

    const { rows } = await pool.query(
      `select escaneos_totales_contador from public.qr_marca where id = $1`,
      [QR],
    );
    expect(rows[0].escaneos_totales_contador).toBe(1);
  });
});
