import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";
import type { Pool } from "pg";

import {
  MOTIVO_SIN_BASE,
  comoUsuario,
  conexionComoUsuario,
  crearUsuario,
  hayBaseDeDatos,
  prepararBase,
} from "../ayudantes/base-de-datos";

/**
 * T014 — libro de movimientos de Beats (Fase 1, verificaciones V002 a V009).
 *
 * Corre contra Postgres de verdad: el disparador del libro, el candado del
 * saldo, las unicidades y el borrado restringido son comportamiento de la base.
 * El mock de JS solo los imita para que el cliente tenga con que hablar.
 */
test.describe("libro de movimientos de Beats", () => {
  test.skip(!hayBaseDeDatos, MOTIVO_SIN_BASE);

  let pool: Pool;
  const BASE = "latidos_pruebas_libro";
  const QR = "b2000000-0000-4000-8000-000000000001"; // KFC, 10 Beats, sin limite
  const MARCA = "a1000000-0000-4000-8000-000000000001";

  const RAIZ = process.cwd();
  const leer = (...ruta: string[]) => readFileSync(join(RAIZ, ...ruta), "utf8");

  let contador = 0;
  const nuevoCorreo = (prefijo: string) => `${prefijo}-${Date.now()}-${contador++}@ejemplo.com`;

  const saldoDe = async (id: string) =>
    (await pool.query(`select beats_balance from public.usuarios where id = $1`, [id])).rows[0]
      .beats_balance as number;

  const movimientosDe = async (id: string) =>
    (
      await pool.query(
        `select tipo, beats, marca_id, escaneo_id, ocurrido_en, dia_local::text as dia_local
           from public.movimientos_beats where usuario_id = $1 order by ocurrido_en, created_at`,
        [id],
      )
    ).rows as {
      tipo: string;
      beats: number;
      marca_id: string | null;
      escaneo_id: string | null;
      ocurrido_en: Date;
      dia_local: string;
    }[];

  /** Devuelve el mensaje de error, o null si la consulta paso. */
  const fallaCon = async (sql: string, valores: unknown[] = []) => {
    try {
      await pool.query(sql, valores);
      return null;
    } catch (error) {
      return (error as Error).message;
    }
  };

  const canjear = async (usuarioId: string, qr = QR) => {
    const conexion = await conexionComoUsuario(BASE, usuarioId);
    try {
      const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas" }).format(
        new Date(),
      );
      const { rows } = await conexion.query(
        `select public.confirmar_canje_qr($1, $2::timestamptz, $3::date) as resultado`,
        [qr, `${hoy}T00:00:00-04:00`, hoy],
      );
      return rows[0].resultado as {
        ok: boolean;
        motivo?: string;
        beats_otorgados?: number;
        beats_balance_actualizado?: number;
      };
    } finally {
      await conexion.end();
    }
  };

  const reconciliacion = async () => {
    const { rows } = await pool.query(leer("scripts", "sql", "reconciliacion-saldos.sql"));
    return rows as { correo: string; problema: string; detalle: string }[];
  };

  test.beforeAll(async () => {
    pool = await prepararBase(BASE);
  });

  test.afterAll(async () => {
    await pool?.end();
  });

  test.describe("bono de bienvenida", () => {
    test("una cuenta nueva nace con 5 Beats y una sola bienvenida", async () => {
      // V005, primera mitad.
      const id = await crearUsuario(pool, nuevoCorreo("nueva"));
      expect(await saldoDe(id)).toBe(5);

      const movimientos = await movimientosDe(id);
      expect(movimientos).toHaveLength(1);
      expect(movimientos[0]).toMatchObject({ tipo: "bienvenida", beats: 5, marca_id: null });
    });

    test("reintentar la bienvenida o la creacion del perfil no la duplica", async () => {
      const id = await crearUsuario(pool, nuevoCorreo("reintento"));

      // Otra vez el mismo camino que usa el disparador.
      await pool.query(`select interno.otorgar_bienvenida($1)`, [id]);
      await pool.query(`select interno.otorgar_bienvenida($1)`, [id]);

      // Y otra vez el insert del perfil, como dos pestañas confirmando a la vez:
      // choca contra la PK y no deja nada.
      const error = await fallaCon(
        `insert into public.usuarios (id, cedula, nombre, apellido, telefono, correo, tipo_usuario)
         values ($1, 'V-1', 'Otra', 'Vez', '0414', 'otra@ejemplo.com', 'externo')`,
        [id],
      );
      expect(error).toMatch(/duplicate key/);

      const bienvenidas = (await movimientosDe(id)).filter((m) => m.tipo === "bienvenida");
      expect(bienvenidas).toHaveLength(1);
      expect(await saldoDe(id)).toBe(5);
    });

    test("la persona que crea su propio perfil con su sesion tambien la recibe", async () => {
      // Es el camino real (asegurarPerfil): el insert llega como `authenticated`,
      // un rol que no puede escribir en el libro por su cuenta.
      const correo = nuevoCorreo("propia");
      const { rows } = await pool.query<{ id: string }>(
        `insert into auth.users (id, email) values (gen_random_uuid(), $1) returning id`,
        [correo],
      );
      const id = rows[0].id;

      await comoUsuario(pool, id, async (consultar) => {
        await consultar(
          `insert into public.usuarios (id, cedula, nombre, apellido, telefono, correo, tipo_usuario)
           values ($1, 'V-2', 'Propia', 'Sesion', '0414', $2, 'externo')`,
          [id, correo],
        );
      });

      expect(await saldoDe(id)).toBe(5);
      expect((await movimientosDe(id)).map((m) => m.tipo)).toEqual(["bienvenida"]);
    });

    test("el monto sale de la configuracion", async () => {
      // V005, segunda mitad.
      await pool.query(`update public.configuracion_app set beats_bienvenida = 10`);
      try {
        const id = await crearUsuario(pool, nuevoCorreo("diez"));
        expect(await saldoDe(id)).toBe(10);
        expect((await movimientosDe(id))[0]).toMatchObject({ tipo: "bienvenida", beats: 10 });
      } finally {
        await pool.query(`update public.configuracion_app set beats_bienvenida = 5`);
      }
    });

    test("un monto de bienvenida de 0 no se acepta", async () => {
      const error = await fallaCon(`update public.configuracion_app set beats_bienvenida = 0`);
      expect(error).toMatch(/beats_bienvenida_positivo/);
    });
  });

  test.describe("candado del saldo", () => {
    test("editar beats_balance a mano desde el editor SQL se rechaza", async () => {
      // V007: el dueño de la base tampoco puede, a diferencia del guardia
      // anterior, que solo bloqueaba a authenticated y anon.
      const id = await crearUsuario(pool, nuevoCorreo("candado"));
      const error = await fallaCon(`update public.usuarios set beats_balance = 999 where id = $1`, [
        id,
      ]);
      expect(error).toMatch(/solo cambia con un movimiento del libro/);
      expect(await saldoDe(id)).toBe(5);
    });

    test("el cliente tampoco puede, ni creando su perfil con saldo", async () => {
      const id = await crearUsuario(pool, nuevoCorreo("cliente"));
      let error: string | null = null;
      try {
        await comoUsuario(pool, id, async (consultar) => {
          await consultar(`update public.usuarios set beats_balance = 999 where id = $1`, [id]);
        });
      } catch (e) {
        error = (e as Error).message;
      }
      expect(error).toMatch(/solo cambia con un movimiento del libro/);

      // La policy de insert solo mira el id; sin el candado, se podria nacer rico.
      const correo = nuevoCorreo("rico");
      const { rows } = await pool.query<{ id: string }>(
        `insert into auth.users (id, email) values (gen_random_uuid(), $1) returning id`,
        [correo],
      );
      let errorInsert: string | null = null;
      try {
        await comoUsuario(pool, rows[0].id, async (consultar) => {
          await consultar(
            `insert into public.usuarios
               (id, cedula, nombre, apellido, telefono, correo, tipo_usuario, beats_balance)
             values ($1, 'V-3', 'Rico', 'Rico', '0414', $2, 'externo', 100000)`,
            [rows[0].id, correo],
          );
        });
      } catch (e) {
        errorInsert = (e as Error).message;
      }
      expect(errorInsert).toMatch(/perfil nuevo empieza en 0/);
    });

    test("el cliente no puede activar la marca del libro para cambiar su saldo", async () => {
      // La marca de transaccion es un ajuste de sesion, y `set_config` lo puede
      // llamar cualquier rol. Si el candado solo mirara la marca, una sesion
      // `authenticated` se la pondria y se subiria el saldo a mano.
      const id = await crearUsuario(pool, nuevoCorreo("marca"));

      const intentos = [
        `update public.usuarios set beats_balance = 99999 where id = $1`,
        `update public.usuarios set nombre = 'Marca', beats_balance = 99999 where id = $1`,
      ];
      for (const sql of intentos) {
        let error: string | null = null;
        try {
          await comoUsuario(pool, id, async (consultar) => {
            await consultar(`select set_config('latidos.desde_libro', 'si', true)`);
            await consultar(sql, [id]);
          });
        } catch (e) {
          error = (e as Error).message;
        }
        expect(error, sql).toMatch(/solo cambia con un movimiento del libro/);
      }

      // Tampoco creando el perfil con la marca puesta.
      const correo = nuevoCorreo("marca-alta");
      const { rows } = await pool.query<{ id: string }>(
        `insert into auth.users (id, email) values (gen_random_uuid(), $1) returning id`,
        [correo],
      );
      let errorAlta: string | null = null;
      try {
        await comoUsuario(pool, rows[0].id, async (consultar) => {
          await consultar(`select set_config('latidos.desde_libro', 'si', true)`);
          await consultar(
            `insert into public.usuarios
               (id, cedula, nombre, apellido, telefono, correo, tipo_usuario, beats_balance)
             values ($1, 'V-4', 'Marca', 'Alta', '0414', $2, 'externo', 100000)`,
            [rows[0].id, correo],
          );
        });
      } catch (e) {
        errorAlta = (e as Error).message;
      }
      expect(errorAlta).toMatch(/perfil nuevo empieza en 0/);

      expect(await saldoDe(id)).toBe(5);
      expect((await movimientosDe(id)).map((m) => m.tipo)).toEqual(["bienvenida"]);
    });

    test("anon con la marca puesta tampoco toca ningun saldo", async () => {
      const id = await crearUsuario(pool, nuevoCorreo("anon"));
      const conexion = await pool.connect();
      try {
        await conexion.query("begin");
        await conexion.query("set local role anon");
        await conexion.query(`select set_config('latidos.desde_libro', 'si', true)`);
        // anon no tiene policy de update: la fila ni siquiera es visible.
        const { rowCount } = await conexion.query(
          `update public.usuarios set beats_balance = 99999 where id = $1`,
          [id],
        );
        expect(rowCount).toBe(0);
        await conexion.query("rollback");
      } finally {
        conexion.release();
      }
      expect(await saldoDe(id)).toBe(5);
    });

    test("el cliente no puede escribir en el libro", async () => {
      const id = await crearUsuario(pool, nuevoCorreo("libro"));
      let error: string | null = null;
      try {
        await comoUsuario(pool, id, async (consultar) => {
          await consultar(
            `insert into public.movimientos_beats (usuario_id, tipo, beats, dia_local)
             values ($1, 'regalo', 1000, current_date)`,
            [id],
          );
        });
      } catch (e) {
        error = (e as Error).message;
      }
      expect(error).toMatch(/row-level security|permission/i);
      expect(await saldoDe(id)).toBe(5);
    });
  });

  test.describe("canje por el libro", () => {
    test("confirmar un QR crea el escaneo y su movimiento, y el saldo devuelto cuadra", async () => {
      // V006.
      const id = await crearUsuario(pool, nuevoCorreo("canje"));
      const resultado = await canjear(id);

      expect(resultado).toMatchObject({
        ok: true,
        beats_otorgados: 10,
        beats_balance_actualizado: 15,
      });
      expect(await saldoDe(id)).toBe(15);

      const { rows: escaneos } = await pool.query(
        `select id, confirmado_en, dia_local::text as dia_local from public.escaneos
          where usuario_id = $1`,
        [id],
      );
      expect(escaneos).toHaveLength(1);

      const escaneo = (await movimientosDe(id)).find((m) => m.tipo === "escaneo");
      expect(escaneo).toMatchObject({
        beats: 10,
        marca_id: MARCA,
        escaneo_id: escaneos[0].id,
        dia_local: escaneos[0].dia_local,
      });
      expect(escaneo?.ocurrido_en.getTime()).toBe(escaneos[0].confirmado_en.getTime());
    });

    test("un canje rechazado no deja movimiento", async () => {
      const id = await crearUsuario(pool, nuevoCorreo("rechazo"));
      expect((await canjear(id)).ok).toBe(true);
      expect(await canjear(id)).toMatchObject({ ok: false, motivo: "ya_escaneado_hoy" });

      const tipos = (await movimientosDe(id)).map((m) => m.tipo);
      expect(tipos).toEqual(["bienvenida", "escaneo"]);
      expect(await saldoDe(id)).toBe(15);
    });
  });

  test.describe("ajustes y regalos", () => {
    const registrar = (id: string, tipo: string, beats: number) =>
      pool.query<{ movimiento_id: string; saldo_resultante: number }>(
        `select * from public.registrar_movimiento_latidos($1, $2::public.tipo_movimiento_beats, $3)`,
        [id, tipo, beats],
      );

    test("un ajuste que dejaria el saldo bajo cero se rechaza sin crear nada", async () => {
      // V008, primera mitad.
      const id = await crearUsuario(pool, nuevoCorreo("ajuste"));
      const error = await registrar(id, "ajuste", -10).then(
        () => null,
        (e: Error) => e.message,
      );
      expect(error).toMatch(/saldo quedaria negativo/);
      expect(await movimientosDe(id)).toHaveLength(1);
      expect(await saldoDe(id)).toBe(5);
    });

    test("un regalo positivo aparece en el libro y sube el saldo", async () => {
      // V008, segunda mitad.
      const id = await crearUsuario(pool, nuevoCorreo("regalo"));
      const { rows } = await registrar(id, "regalo", 20);
      expect(rows[0].saldo_resultante).toBe(25);
      expect(await saldoDe(id)).toBe(25);

      const regalo = (await movimientosDe(id)).find((m) => m.tipo === "regalo");
      expect(regalo).toMatchObject({ beats: 20, marca_id: null, escaneo_id: null });
    });

    test("un ajuste negativo que si cabe resta", async () => {
      const id = await crearUsuario(pool, nuevoCorreo("resta"));
      const { rows } = await registrar(id, "ajuste", -3);
      expect(rows[0].saldo_resultante).toBe(2);
    });

    test("rechaza 0 Beats, regalos negativos, otros tipos y cuentas inexistentes", async () => {
      const id = await crearUsuario(pool, nuevoCorreo("invalidos"));
      const casos: [string, string, number, RegExp][] = [
        [id, "ajuste", 0, /no puede ser 0/],
        [id, "regalo", -5, /regalo no puede ser negativo/],
        [id, "escaneo", 5, /tipo invalido/],
        [id, "bienvenida", 5, /tipo invalido/],
        ["00000000-0000-4000-8000-000000000000", "regalo", 5, /no existe el usuario/],
      ];
      for (const [usuario, tipo, beats, mensaje] of casos) {
        const error = await registrar(usuario, tipo, beats).then(
          () => null,
          (e: Error) => e.message,
        );
        expect(error, `${tipo} ${beats}`).toMatch(mensaje);
      }
      expect(await movimientosDe(id)).toHaveLength(1);
    });

    test("desde la app no se puede llamar", async () => {
      const id = await crearUsuario(pool, nuevoCorreo("app"));
      let error: string | null = null;
      try {
        await comoUsuario(pool, id, async (consultar) => {
          await consultar(`select * from public.registrar_movimiento_latidos($1, 'regalo', 100)`, [
            id,
          ]);
        });
      } catch (e) {
        error = (e as Error).message;
      }
      expect(error).toMatch(/permission denied/);
    });
  });

  test.describe("borrado restringido", () => {
    test("una marca, un QR o un escaneo con historia no se borran", async () => {
      // V009, primera mitad.
      const id = await crearUsuario(pool, nuevoCorreo("borrado"));
      expect((await canjear(id)).ok).toBe(true);

      expect(await fallaCon(`delete from public.marcas where id = $1`, [MARCA])).toMatch(
        /foreign key/,
      );
      expect(await fallaCon(`delete from public.qr_marca where id = $1`, [QR])).toMatch(
        /foreign key/,
      );
      expect(
        await fallaCon(`delete from public.escaneos where usuario_id = $1`, [id]),
      ).toMatch(/foreign key/);
    });

    test("borrar una cuenta si se lleva su historial entero", async () => {
      // El borrado restringido no puede trabar el de una cuenta: escaneos y
      // movimientos se van juntos en la misma cascada.
      const id = await crearUsuario(pool, nuevoCorreo("baja"));
      expect((await canjear(id)).ok).toBe(true);

      await pool.query(`delete from auth.users where id = $1`, [id]);
      const { rows } = await pool.query(
        `select (select count(*) from public.movimientos_beats where usuario_id = $1)::int as mov,
                (select count(*) from public.escaneos where usuario_id = $1)::int as esc`,
        [id],
      );
      expect(rows[0]).toEqual({ mov: 0, esc: 0 });
    });

    test("el script de limpieza si los borra, conserva lo demas y deja todo cuadrado", async () => {
      // V009, segunda mitad. Una marca y un QR propios, para no tocar la semilla.
      const marca = "d4000000-0000-4000-8000-0000000000b1";
      const qr = "d4000000-0000-4000-8000-0000000000a1";
      await pool.query(`insert into public.marcas (id, nombre) values ($1, 'Marca de prueba')`, [
        marca,
      ]);
      await pool.query(
        `insert into public.qr_marca (id, marca_id, beats_otorgados, estado)
         values ($1, $2, 8, 'activo')`,
        [qr, marca],
      );

      const id = await crearUsuario(pool, nuevoCorreo("limpieza"));
      expect((await canjear(id, qr)).ok).toBe(true);
      expect((await canjear(id, QR)).ok).toBe(true);
      await pool.query(`select public.registrar_movimiento_latidos($1, 'regalo', 3)`, [id]);
      expect(await saldoDe(id)).toBe(5 + 8 + 10 + 3);

      const script = leer("scripts", "sql", "limpiar-datos-prueba.sql").replace(
        "-- 'a1000000-0000-4000-8000-000000000002'",
        `'${marca}'`,
      );
      expect(script).toContain(`'${marca}'`);
      const resultados = (await pool.query(script)) as unknown as { rows: unknown[] }[];

      // El ultimo resultado del script es la reconciliacion: vacia.
      expect(resultados[resultados.length - 1].rows).toEqual([]);

      // Se fue lo de la marca de prueba; bienvenida, regalo y KFC se quedan.
      expect(await saldoDe(id)).toBe(5 + 10 + 3);
      expect((await movimientosDe(id)).map((m) => m.tipo).sort()).toEqual(
        ["bienvenida", "escaneo", "regalo"].sort(),
      );
      const { rows } = await pool.query(
        `select (select count(*) from public.marcas where id = $1)::int as marcas,
                (select count(*) from public.qr_marca where id = $2)::int as qrs`,
        [marca, qr],
      );
      expect(rows[0]).toEqual({ marcas: 0, qrs: 0 });
    });
  });

  test.describe("migracion", () => {
    test("la carga retroactiva pasa al libro lo que existia antes, con su dia real", async () => {
      // V003: una cuenta con un escaneo anterior al libro y un saldo que no
      // cuadra. Se simula saltando el libro, como estaban los datos antes.
      const id = await crearUsuario(pool, nuevoCorreo("legado"));
      const { rows } = await pool.query<{ id: string }>(
        `insert into public.escaneos (usuario_id, qr_marca_id, beats_otorgados, confirmado_en, dia_local)
         values ($1, $2, 10, '2026-09-20T02:00:00Z', '2026-09-20') returning id`,
        [id, QR],
      );
      await pool.query(`delete from public.movimientos_beats where usuario_id = $1`, [id]);

      await pool.query(leer("supabase", "migrations", "20260929120500_carga_retroactiva.sql"));

      const movimientos = await movimientosDe(id);
      const escaneo = movimientos.find((m) => m.tipo === "escaneo");
      // Las 2am UTC del 20 son las 10pm del 19 en Caracas: ese es su dia.
      expect(escaneo).toMatchObject({ escaneo_id: rows[0].id, marca_id: MARCA, beats: 10 });
      expect(escaneo?.dia_local).toBe("2026-09-19");
      expect(movimientos.filter((m) => m.tipo === "bienvenida")).toHaveLength(1);
      expect(await saldoDe(id)).toBe(15);
    });

    test("aplicar todas las migraciones dos veces seguidas no falla ni duplica", async () => {
      // V002.
      const antes = (
        await pool.query(`select count(*)::int as n, sum(beats)::int as s from public.movimientos_beats`)
      ).rows[0];

      const dir = join(RAIZ, "supabase", "migrations");
      const archivos = readdirSync(dir).filter((n) => n.endsWith(".sql")).sort();
      for (let vuelta = 0; vuelta < 2; vuelta++) {
        for (const archivo of archivos) {
          await pool.query(readFileSync(join(dir, archivo), "utf8"));
        }
      }

      const despues = (
        await pool.query(`select count(*)::int as n, sum(beats)::int as s from public.movimientos_beats`)
      ).rows[0];
      expect(despues).toEqual(antes);
    });

    test("la reconciliacion sale vacia", async () => {
      // V004. Va al final: despues de todo lo anterior, nada quedo descuadrado.
      expect(await reconciliacion()).toEqual([]);
    });
  });
});
