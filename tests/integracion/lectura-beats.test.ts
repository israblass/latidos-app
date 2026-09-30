import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";
import type { Pool } from "pg";

import {
  MOTIVO_SIN_BASE,
  comoUsuario,
  crearUsuario,
  hayBaseDeDatos,
  prepararBase,
} from "../ayudantes/base-de-datos";

/**
 * T016 — funciones de lectura de la pantalla de Beats, contra Postgres real.
 *
 * El mock de JS reimplementa resumen_beats() e historial_beats() para que la
 * pantalla tenga con que hablar; esta prueba es la que demuestra que las de
 * verdad agrupan, paginan y respetan la RLS.
 */
test.describe("lectura de Beats en la base", () => {
  test.skip(!hayBaseDeDatos, MOTIVO_SIN_BASE);

  let pool: Pool;
  const BASE = "latidos_pruebas_lectura";
  const QR = "b2000000-0000-4000-8000-000000000001"; // KFC
  const MARCA = "a1000000-0000-4000-8000-000000000001";

  let contador = 0;
  const nuevoCorreo = (p: string) => `${p}-${Date.now()}-${contador++}@ejemplo.com`;

  type Historial = {
    dias: {
      dia_local: string;
      total_neto: number;
      escaneos: number;
      movimientos: {
        tipo: string;
        beats: number;
        ocurrido_en: string;
        marca: { nombre: string; logo_url: string | null } | null;
      }[];
    }[];
    hay_mas: boolean;
    siguiente_cursor: string | null;
  };

  const leerComo = async <T,>(id: string, sql: string, valores: unknown[] = []) => {
    let filas: T[] = [];
    await comoUsuario(pool, id, async (consultar) => {
      filas = (await consultar(sql, valores)).rows as T[];
    });
    return filas;
  };

  const historial = async (id: string, antesDe: string | null = null, dias = 7) =>
    (
      await leerComo<{ h: Historial }>(id, `select public.historial_beats($1::date, $2) as h`, [
        antesDe,
        dias,
      ])
    )[0].h;

  const resumen = async (id: string) =>
    (
      await leerComo<{ saldo: number; tiene_escaneos: boolean; onboarding_visto: boolean }>(
        id,
        `select * from public.resumen_beats()`,
      )
    )[0];

  /**
   * Escaneos de hace `dias` dias, cargados como estaban antes del libro y
   * pasados al libro por la carga retroactiva: asi quedan con su fecha real.
   */
  const escaneosViejos = async (id: string, dias: number[]) => {
    for (const d of dias) {
      await pool.query(
        `insert into public.escaneos (usuario_id, qr_marca_id, beats_otorgados, confirmado_en, dia_local)
         values ($1, $2, 10, now() - make_interval(days => $3), current_date - $3)`,
        [id, QR, d],
      );
    }
    await pool.query(
      readFileSync(
        join(process.cwd(), "supabase", "migrations", "20260929120500_carga_retroactiva.sql"),
        "utf8",
      ),
    );
  };

  test.beforeAll(async () => {
    pool = await prepararBase(BASE);
  });

  test.afterAll(async () => {
    await pool?.end();
  });

  test("resumen: saldo, si ya escaneo y si vio el onboarding", async () => {
    const id = await crearUsuario(pool, nuevoCorreo("resumen"));
    expect(await resumen(id)).toEqual({ saldo: 5, tiene_escaneos: false, onboarding_visto: false });

    await escaneosViejos(id, [2]);
    await pool.query(`update public.usuarios set onboarding_visto = true where id = $1`, [id]);
    expect(await resumen(id)).toEqual({ saldo: 15, tiene_escaneos: true, onboarding_visto: true });
  });

  test("sin sesion no hay resumen ni historial", async () => {
    const { rows } = await pool.query(`select * from public.resumen_beats()`);
    expect(rows).toEqual([]);
  });

  test("agrupa por dia con total, conteo de escaneos y la bienvenida sin conteo", async () => {
    const id = await crearUsuario(pool, nuevoCorreo("dias"));
    await escaneosViejos(id, [1, 5]);
    await pool.query(`select public.registrar_movimiento_latidos($1, 'regalo', 3)`, [id]);

    const h = await historial(id);
    expect(h.dias.map((d) => d.total_neto)).toEqual([8, 10, 10]);
    expect(h.dias.map((d) => d.escaneos)).toEqual([0, 1, 1]);
    // Hoy: el regalo es lo mas reciente, arriba de la bienvenida.
    expect(h.dias[0].movimientos.map((m) => m.tipo)).toEqual(["regalo", "bienvenida"]);
    expect(h.dias[1].movimientos[0].marca).toEqual({ nombre: "KFC", logo_url: null });
    expect(h.hay_mas).toBe(false);
    expect(h.siguiente_cursor).toBeNull();
  });

  test("pagina por dias completos: 20 dias son 7, 7 y 6", async () => {
    const id = await crearUsuario(pool, nuevoCorreo("pagina"));
    // Hoy tiene la bienvenida; 19 dias mas con un escaneo cada uno.
    await escaneosViejos(id, Array.from({ length: 19 }, (_, i) => i + 1));

    const primera = await historial(id);
    expect(primera.dias).toHaveLength(7);
    expect(primera.hay_mas).toBe(true);

    const segunda = await historial(id, primera.siguiente_cursor);
    expect(segunda.dias).toHaveLength(7);
    expect(segunda.hay_mas).toBe(true);
    expect(segunda.dias[0].dia_local < primera.dias[6].dia_local).toBe(true);

    const tercera = await historial(id, segunda.siguiente_cursor);
    expect(tercera.dias).toHaveLength(6);
    expect(tercera.hay_mas).toBe(false);
    expect(tercera.siguiente_cursor).toBeNull();
  });

  test("la marca sale en su valor actual y los Beats en su valor original", async () => {
    const id = await crearUsuario(pool, nuevoCorreo("marca"));
    await escaneosViejos(id, [3]);
    await pool.query(`update public.marcas set nombre = 'KFC Venezuela', logo_url = 'https://x/kfc.png' where id = $1`, [MARCA]);
    await pool.query(`update public.qr_marca set estado = 'inactivo', beats_otorgados = 50 where id = $1`, [QR]);
    try {
      const fila = (await historial(id)).dias[1].movimientos[0];
      expect(fila.marca).toEqual({ nombre: "KFC Venezuela", logo_url: "https://x/kfc.png" });
      expect(fila.beats).toBe(10);
    } finally {
      await pool.query(`update public.marcas set nombre = 'KFC', logo_url = null where id = $1`, [MARCA]);
      await pool.query(`update public.qr_marca set estado = 'activo', beats_otorgados = 10 where id = $1`, [QR]);
    }
  });

  test("nadie lee el historial ni el resumen de otra persona", async () => {
    const ana = await crearUsuario(pool, nuevoCorreo("ana"));
    const beto = await crearUsuario(pool, nuevoCorreo("beto"));
    await pool.query(`select public.registrar_movimiento_latidos($1, 'regalo', 40)`, [beto]);

    // Ana solo ve lo suyo: su bienvenida, nunca el regalo de Beto.
    const h = await historial(ana);
    expect(h.dias.flatMap((d) => d.movimientos.map((m) => m.beats))).toEqual([5]);
    expect((await resumen(ana)).saldo).toBe(5);
  });

  test("el tamaño del lote se acota", async () => {
    const id = await crearUsuario(pool, nuevoCorreo("acota"));
    await escaneosViejos(id, [1, 2]);
    expect((await historial(id, null, 0)).dias).toHaveLength(1);
    expect((await historial(id, null, 1000)).dias).toHaveLength(3);
  });
});
