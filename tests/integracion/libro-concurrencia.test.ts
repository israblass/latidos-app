import { expect, test } from "@playwright/test";
import { Client, type Pool } from "pg";

import {
  MOTIVO_SIN_BASE,
  URL_BASE_DATOS,
  conexionComoUsuario,
  crearUsuario,
  hayBaseDeDatos,
  prepararBase,
} from "../ayudantes/base-de-datos";

/**
 * T047 — concurrencia del libro de movimientos, contra Postgres real.
 *
 * Cada caso cita a dos conexiones en el mismo instante (como en
 * qr-concurrencia.test.ts): sin la cita, la primera terminaria antes de que la
 * segunda empiece y no habria carrera que probar.
 */
test.describe("concurrencia del libro de movimientos", () => {
  test.skip(!hayBaseDeDatos, MOTIVO_SIN_BASE);

  let pool: Pool;
  const BASE = "latidos_pruebas_libro_concurrencia";
  const QR = "b2000000-0000-4000-8000-000000000001"; // KFC, 10 Beats

  test.beforeAll(async () => {
    pool = await prepararBase(BASE);
  });
  test.afterAll(async () => {
    await pool?.end();
  });

  const hoy = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas" }).format(new Date());

  /** Duerme hasta `arranque` y corre la consulta: las dos salen juntas. */
  const enCita = async (conexion: Client, arranque: number, sql: string, valores: unknown[]) => {
    await conexion.query(`select pg_sleep(greatest(0, $1::numeric))`, [(arranque - Date.now()) / 1000]);
    return conexion.query(sql, valores);
  };

  /** Conexion como dueño de la base, como la del editor SQL. */
  const conexionDueno = async () => {
    const url = new URL(URL_BASE_DATOS as string);
    url.pathname = `/${BASE}`;
    const cliente = new Client({ connectionString: url.toString() });
    await cliente.connect();
    return cliente;
  };

  const estadoDe = async (id: string) =>
    (
      await pool.query(
        `select u.beats_balance as saldo,
                (select coalesce(sum(beats), 0) from public.movimientos_beats m where m.usuario_id = u.id)::int as libro,
                (select count(*) from public.escaneos e where e.usuario_id = u.id)::int as escaneos,
                (select count(*) from public.movimientos_beats m where m.usuario_id = u.id and m.tipo = 'escaneo')::int as mov_escaneo
           from public.usuarios u where u.id = $1`,
        [id],
      )
    ).rows[0] as { saldo: number; libro: number; escaneos: number; mov_escaneo: number };

  test("dos confirmaciones simultaneas del mismo QR y usuario: un escaneo y un movimiento", async () => {
    const id = await crearUsuario(pool, `doble-${Date.now()}@ejemplo.com`);
    const [a, b] = [await conexionComoUsuario(BASE, id), await conexionComoUsuario(BASE, id)];
    const arranque = Date.now() + 1500;
    const sql = `select public.confirmar_canje_qr($1, $2::timestamptz, $3::date) as r`;
    const valores = [QR, `${hoy()}T00:00:00-04:00`, hoy()];
    try {
      const resultados = (
        await Promise.all([enCita(a, arranque, sql, valores), enCita(b, arranque, sql, valores)])
      ).map((r) => r.rows[0].r as { ok: boolean; motivo?: string });

      expect(resultados.filter((r) => r.ok), JSON.stringify(resultados)).toHaveLength(1);
      expect(resultados.find((r) => !r.ok)?.motivo).toBe("ya_escaneado_hoy");
    } finally {
      await a.end();
      await b.end();
    }
    expect(await estadoDe(id)).toEqual({ saldo: 15, libro: 15, escaneos: 1, mov_escaneo: 1 });
  });

  test("un ajuste negativo a la vez que un canje nunca deja el saldo negativo ni descuadrado", async () => {
    // Saldo 5. El ajuste de -5 y el canje de +10 salen juntos: cualquiera sea
    // el orden, los dos caben, y el saldo final tiene que ser 10 y cuadrar.
    const id = await crearUsuario(pool, `cruce-${Date.now()}@ejemplo.com`);
    const usuario = await conexionComoUsuario(BASE, id);
    const dueno = await conexionDueno();
    const arranque = Date.now() + 1500;
    try {
      await Promise.all([
        enCita(usuario, arranque, `select public.confirmar_canje_qr($1, $2::timestamptz, $3::date)`, [
          QR,
          `${hoy()}T00:00:00-04:00`,
          hoy(),
        ]),
        enCita(dueno, arranque, `select public.registrar_movimiento_latidos($1, 'ajuste', -5)`, [id]),
      ]);
    } finally {
      await usuario.end();
      await dueno.end();
    }
    const estado = await estadoDe(id);
    expect(estado.saldo).toBe(10);
    expect(estado.libro).toBe(estado.saldo);
  });

  test("dos ajustes que juntos dejarian el saldo bajo cero: pasa uno solo", async () => {
    // Saldo 5 y dos ajustes de -4 a la vez. Cada uno solo cabe; los dos, no.
    // El bloqueo de la fila de usuarios los ordena: el segundo ve el saldo ya
    // descontado y se rechaza.
    const id = await crearUsuario(pool, `doble-ajuste-${Date.now()}@ejemplo.com`);
    const [a, b] = [await conexionDueno(), await conexionDueno()];
    const arranque = Date.now() + 1500;
    const sql = `select public.registrar_movimiento_latidos($1, 'ajuste', -4)`;
    let resultados: PromiseSettledResult<unknown>[];
    try {
      resultados = await Promise.allSettled([enCita(a, arranque, sql, [id]), enCita(b, arranque, sql, [id])]);
    } finally {
      await a.end();
      await b.end();
    }
    expect(resultados.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rechazo = resultados.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(String(rechazo.reason)).toMatch(/saldo quedaria negativo/);

    const estado = await estadoDe(id);
    expect(estado).toMatchObject({ saldo: 1, libro: 1 });
  });

  test("la reconciliacion sale vacia despues de todo lo anterior", async () => {
    const { rows } = await pool.query(
      `select u.id from public.usuarios u
        where u.beats_balance <> (select coalesce(sum(beats), 0) from public.movimientos_beats m where m.usuario_id = u.id)`,
    );
    expect(rows).toEqual([]);
  });
});
