import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Pool } from "pg";

import {
  MOTIVO_SIN_BASE,
  comoUsuario,
  crearUsuario,
  hayBaseDeDatos,
  prepararBase,
} from "../ayudantes/base-de-datos";

/**
 * avatar_path en Postgres de verdad (constitution §2, v2.12.0): la migracion
 * es idempotente, el check solo acepta rutas de la carpeta propia y RLS deja
 * a cada quien cambiar solo la suya. El bucket y sus politicas de Storage no
 * se prueban aqui: este Postgres no tiene el esquema `storage`
 * (supabase/storage/avatares.sql se corre a mano en Supabase).
 */
test.describe("avatar_path", () => {
  test.skip(!hayBaseDeDatos, MOTIVO_SIN_BASE);

  let pool: Pool;
  let ana: string;
  let beto: string;

  test.beforeAll(async () => {
    pool = await prepararBase("latidos_pruebas_avatar");
    ana = await crearUsuario(pool, "ana@ejemplo.com");
    beto = await crearUsuario(pool, "beto@ejemplo.com");
  });

  test.afterAll(async () => {
    await pool?.end();
  });

  test("la migracion se puede correr dos veces", async () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase", "migrations", "20261008120000_avatar_path.sql"),
      "utf8",
    );
    await pool.query(sql);
    const { rows } = await pool.query(`select avatar_path from public.usuarios where id = $1`, [ana]);
    expect(rows[0].avatar_path).toBeNull();
  });

  test("Ana guarda una ruta de su carpeta y la vuelve a null", async () => {
    await comoUsuario(pool, ana, async (consultar) => {
      await consultar(`update public.usuarios set avatar_path = $2 where id = $1`, [
        ana,
        `${ana}/avatar-1.webp`,
      ]);
    });
    let { rows } = await pool.query(`select avatar_path from public.usuarios where id = $1`, [ana]);
    expect(rows[0].avatar_path).toBe(`${ana}/avatar-1.webp`);

    await comoUsuario(pool, ana, async (consultar) => {
      await consultar(`update public.usuarios set avatar_path = null where id = $1`, [ana]);
    });
    ({ rows } = await pool.query(`select avatar_path from public.usuarios where id = $1`, [ana]));
    expect(rows[0].avatar_path).toBeNull();
  });

  test("el check rechaza una ruta fuera de su carpeta", async () => {
    for (const ruta of [`${beto}/avatar-1.webp`, "avatar-1.webp", `${ana}avatar.webp`]) {
      await expect(
        comoUsuario(pool, ana, async (consultar) => {
          await consultar(`update public.usuarios set avatar_path = $2 where id = $1`, [ana, ruta]);
        }),
        ruta,
      ).rejects.toThrow(/usuarios_avatar_path_propio/);
    }
  });

  test("Ana no puede cambiar el avatar de Beto", async () => {
    await comoUsuario(pool, ana, async (consultar) => {
      await consultar(`update public.usuarios set avatar_path = $2 where id = $1`, [
        beto,
        `${beto}/avatar-1.webp`,
      ]);
    });
    const { rows } = await pool.query(`select avatar_path from public.usuarios where id = $1`, [beto]);
    expect(rows[0].avatar_path).toBeNull();
  });
});
