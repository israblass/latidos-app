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
 * T066 — RLS: nadie lee ni modifica los datos de otra persona.
 *
 * Toda consulta corre con el rol `authenticated` y el claim `sub` puesto, que
 * es el contexto real del cliente. Consultar como dueño de la base no probaria
 * nada: el dueño se salta RLS por completo, y esa es la trampa clasica de estas
 * pruebas.
 *
 * Ademas de los casos concretos hay tres barridos estructurales al final, que
 * son los que atrapan el agujero que nadie penso en probar: toda tabla con RLS
 * activo, toda funcion `security definer` con search_path fijo, y ninguna
 * politica de escritura sobre lo que solo el admin puede tocar.
 */
test.describe("RLS", () => {
  test.skip(!hayBaseDeDatos, MOTIVO_SIN_BASE);

  let pool: Pool;
  const BASE = "latidos_pruebas_rls";
  let ana: string;
  let beto: string;

  test.beforeAll(async () => {
    pool = await prepararBase(BASE);
    ana = await crearUsuario(pool, "ana@ejemplo.com");
    beto = await crearUsuario(pool, "beto@ejemplo.com");
    // Beto ya tiene Beats e historial: hay algo concreto que Ana podria espiar.
    await pool.query(`update public.usuarios set beats_balance = 500 where id = $1`, [beto]);
    await pool.query(
      `insert into public.escaneos (usuario_id, qr_marca_id, beats_otorgados, confirmado_en, dia_local)
       values ($1, 'b2000000-0000-4000-8000-000000000001', 500, now(), current_date)`,
      [beto],
    );
  });

  test.afterAll(async () => {
    await pool?.end();
  });

  /** Corre una consulta como Ana y devuelve las filas. */
  const comoAna = async (sql: string, valores: unknown[] = []) => {
    const conexion = await conexionComoUsuario(BASE, ana);
    try {
      return (await conexion.query(sql, valores)).rows;
    } finally {
      await conexion.end();
    }
  };

  /** Corre una consulta como Ana esperando que Postgres la rechace. */
  const comoAnaDebeFallar = async (sql: string, valores: unknown[] = []) => {
    const conexion = await conexionComoUsuario(BASE, ana);
    try {
      await conexion.query(sql, valores);
      return null;
    } catch (error) {
      return (error as Error).message;
    } finally {
      await conexion.end();
    }
  };

  test.describe("tabla usuarios", () => {
    test("Ana ve su propia fila", async () => {
      const filas = await comoAna(`select id, correo from public.usuarios`);
      expect(filas).toHaveLength(1);
      expect(filas[0].id).toBe(ana);
    });

    test("Ana no puede leer la fila de Beto ni pidiendola por id", async () => {
      const filas = await comoAna(`select id, correo, beats_balance, cedula, telefono
                                     from public.usuarios where id = $1`, [beto]);
      expect(filas).toHaveLength(0);
    });

    test("Ana no puede modificar la fila de Beto", async () => {
      await comoAna(`update public.usuarios set nombre = 'Hackeado' where id = $1`, [beto]);
      const { rows } = await pool.query(`select nombre from public.usuarios where id = $1`, [beto]);
      expect(rows[0].nombre).not.toBe("Hackeado");
    });

    test("Ana no puede insertar una fila a nombre de otro id", async () => {
      const error = await comoAnaDebeFallar(
        `insert into public.usuarios (id, cedula, nombre, apellido, telefono, correo, tipo_usuario)
         values ($1, 'V-9', 'Falsa', 'Falsa', '0414', 'falsa@ejemplo.com', 'externo')`,
        ["00000000-0000-4000-8000-0000000000cc"],
      );
      expect(error).toMatch(/row-level security|violates/i);
    });

    test("Ana no puede subirse los Beats a mano", async () => {
      // Este es el agujero que aparecio en Fase 5: el trigger que lo impide
      // dejo de funcionar por ser security definer, y con eso el cliente podia
      // ponerse el saldo que quisiera.
      const error = await comoAnaDebeFallar(
        `update public.usuarios set beats_balance = 9999 where id = $1`,
        [ana],
      );
      expect(error, "el cliente pudo escribir su propio balance").toBeTruthy();

      const { rows } = await pool.query(
        `select beats_balance from public.usuarios where id = $1`, [ana]);
      expect(rows[0].beats_balance).toBe(0);
    });

    test("tampoco colando el balance junto a un campo legitimo", async () => {
      const error = await comoAnaDebeFallar(
        `update public.usuarios set nombre = 'Ana', beats_balance = 4242 where id = $1`,
        [ana],
      );
      expect(error).toBeTruthy();
      const { rows } = await pool.query(
        `select beats_balance from public.usuarios where id = $1`, [ana]);
      expect(rows[0].beats_balance).toBe(0);
    });

    test("los campos que si le tocan si se pueden actualizar", async () => {
      // El guardia no puede quedar tan cerrado que rompa el onboarding.
      await comoAna(`update public.usuarios set onboarding_visto = true,
                       notificaciones_habilitadas = true where id = $1`, [ana]);
      const { rows } = await pool.query(
        `select onboarding_visto, notificaciones_habilitadas
           from public.usuarios where id = $1`, [ana]);
      expect(rows[0].onboarding_visto).toBe(true);
      expect(rows[0].notificaciones_habilitadas).toBe(true);
    });

    test("Ana no puede borrar cuentas", async () => {
      await comoAna(`delete from public.usuarios where id = $1`, [beto]);
      await comoAna(`delete from public.usuarios where id = $1`, [ana]);
      const { rows } = await pool.query(`select count(*)::int as total from public.usuarios`);
      expect(rows[0].total).toBeGreaterThanOrEqual(2);
    });
  });

  test.describe("tabla escaneos", () => {
    test("Ana no ve el historial de Beto", async () => {
      const filas = await comoAna(`select id, usuario_id, beats_otorgados from public.escaneos`);
      expect(filas.every((f) => f.usuario_id === ana)).toBe(true);
      expect(filas.some((f) => f.usuario_id === beto)).toBe(false);
    });

    test("Ana no puede fabricarse un escaneo", async () => {
      // No hay policy de insert: la unica via de escritura es la funcion de canje.
      const error = await comoAnaDebeFallar(
        `insert into public.escaneos (usuario_id, qr_marca_id, beats_otorgados, confirmado_en, dia_local)
         values ($1, 'b2000000-0000-4000-8000-000000000001', 99999, now(), current_date)`,
        [ana],
      );
      expect(error).toMatch(/row-level security|violates|permission/i);
    });

    test("Ana no puede reescribir sus propios escaneos", async () => {
      await comoAna(`update public.escaneos set beats_otorgados = 99999`);
      const { rows } = await pool.query(
        `select max(beats_otorgados)::int as tope from public.escaneos`);
      expect(rows[0].tope).toBeLessThan(99999);
    });
  });

  test.describe("tabla qr_marca", () => {
    test("Ana no ve los QR que el admin desactivo", async () => {
      const filas = await comoAna(
        `select id from public.qr_marca where id = 'b2000000-0000-4000-8000-000000000004'`);
      expect(filas).toHaveLength(0);
    });

    test("Ana no puede cambiarse los Beats de un QR", async () => {
      await comoAna(`update public.qr_marca set beats_otorgados = 99999`);
      const { rows } = await pool.query(
        `select max(beats_otorgados)::int as tope from public.qr_marca`);
      expect(rows[0].tope).toBeLessThan(99999);
    });

    test("Ana no puede devolver el contador a cero para reusar un QR agotado", async () => {
      const agotado = "b2000000-0000-4000-8000-000000000003";
      await comoAna(`update public.qr_marca set escaneos_totales_contador = 0 where id = $1`,
        [agotado]);
      const { rows } = await pool.query(
        `select escaneos_totales_contador from public.qr_marca where id = $1`, [agotado]);
      expect(rows[0].escaneos_totales_contador).toBe(2);
    });

    test("Ana no puede reactivar un QR ni crear uno propio", async () => {
      await comoAna(`update public.qr_marca set estado = 'activo' where estado = 'inactivo'`);
      const { rows } = await pool.query(
        `select count(*)::int as total from public.qr_marca where estado = 'inactivo'`);
      expect(rows[0].total).toBeGreaterThan(0);

      const error = await comoAnaDebeFallar(
        `insert into public.qr_marca (marca_id, beats_otorgados, estado)
         values ('a1000000-0000-4000-8000-000000000001', 99999, 'activo')`);
      expect(error).toMatch(/row-level security|violates|permission/i);
    });
  });

  test.describe("configuracion_app", () => {
    test("Ana lee el modo evento pero no lo cambia", async () => {
      const filas = await comoAna(`select modo_evento_activo from public.configuracion_app`);
      expect(filas).toHaveLength(1);

      await comoAna(`update public.configuracion_app set modo_evento_activo = true`);
      const { rows } = await pool.query(
        `select modo_evento_activo from public.configuracion_app`);
      expect(rows[0].modo_evento_activo).toBe(false);
    });
  });

  test.describe("la funcion de canje no se puede torcer", () => {
    test("acredita a quien llama, no a quien se le indique", async () => {
      // La funcion no recibe usuario_id: lo toma de auth.uid(). Si lo recibiera
      // como parametro, cualquiera podria acreditarle Beats a otra cuenta o
      // gastarle el cupo diario.
      const { rows } = await pool.query(
        `select pg_get_function_identity_arguments(
                  'public.confirmar_canje_qr(uuid,timestamptz,date)'::regprocedure) as firma`);
      expect(rows[0].firma).not.toMatch(/usuario/i);
    });

    test("el rol anonimo no la puede ejecutar", async () => {
      const conexion = await conexionComoUsuario(BASE, ana);
      try {
        await conexion.query("set role anon");
        let fallo = null;
        try {
          await conexion.query(
            `select public.confirmar_canje_qr('b2000000-0000-4000-8000-000000000001',
                                              now(), current_date)`);
        } catch (error) {
          fallo = (error as Error).message;
        }
        expect(fallo, "anon pudo ejecutar la funcion de canje").toMatch(/permission denied/i);
      } finally {
        await conexion.end();
      }
    });
  });

  test.describe("barridos estructurales", () => {
    test("toda tabla de public tiene RLS activo", async () => {
      // Una tabla nueva sin RLS queda abierta de par en par, y no hay nada que
      // lo avise salvo una revision como esta.
      const { rows } = await pool.query<{ tablename: string }>(
        `select tablename from pg_tables
          where schemaname = 'public' and rowsecurity = false`);
      expect(
        rows.map((r) => r.tablename),
        "estas tablas no tienen row level security",
      ).toEqual([]);
    });

    test("toda tabla de public tiene al menos una politica", async () => {
      // RLS activo sin politicas niega todo: se detecta como funcionalidad rota,
      // pero mejor verlo aqui que en produccion.
      const { rows } = await pool.query<{ tablename: string }>(
        `select t.tablename from pg_tables t
          where t.schemaname = 'public'
            and not exists (select 1 from pg_policies p
                             where p.schemaname = 'public' and p.tablename = t.tablename)`);
      expect(rows.map((r) => r.tablename), "tablas sin ninguna politica").toEqual([]);
    });

    test("ninguna tabla acepta escrituras del cliente salvo usuarios", async () => {
      // Beats, escaneos, QR y configuracion solo se escriben por la funcion de
      // canje o por el admin. Una policy de insert/update/delete en cualquiera
      // de ellas seria una via directa para inflarse los Beats.
      const { rows } = await pool.query<{ tablename: string; policyname: string; cmd: string }>(
        `select tablename, policyname, cmd from pg_policies
          where schemaname = 'public'
            and cmd <> 'SELECT'
            and tablename <> 'usuarios'`);
      expect(
        rows.map((r) => `${r.tablename}.${r.policyname} (${r.cmd})`),
        "politicas de escritura inesperadas",
      ).toEqual([]);
    });

    test("toda funcion security definer fija su search_path", async () => {
      // Una security definer sin search_path fijo se puede secuestrar plantando
      // un objeto con el mismo nombre en un esquema que vaya antes.
      const { rows } = await pool.query<{ nombre: string }>(
        `select p.proname as nombre
           from pg_proc p
           join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public'
            and p.prosecdef
            and not exists (
              select 1 from unnest(coalesce(p.proconfig, '{}')) as ajuste
               where ajuste like 'search_path=%')`);
      expect(
        rows.map((r) => r.nombre),
        "security definer sin search_path fijo",
      ).toEqual([]);
    });

    test("ninguna funcion de trigger es security definer", async () => {
      // Esta es exactamente la forma del agujero de Fase 5: un trigger que
      // compara el rol de quien escribe deja de servir si corre como dueño,
      // porque entonces el rol que ve es siempre el dueño.
      const { rows } = await pool.query<{ nombre: string }>(
        `select p.proname as nombre
           from pg_proc p
           join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public'
            and p.prosecdef
            and p.prorettype = 'trigger'::regtype`);
      expect(
        rows.map((r) => r.nombre),
        "un trigger security definer no ve el rol real de quien escribe",
      ).toEqual([]);
    });

    test("las funciones security definer no quedan ejecutables por todo el mundo", async () => {
      const { rows } = await pool.query<{ nombre: string }>(
        `select p.proname as nombre
           from pg_proc p
           join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public'
            and p.prosecdef
            and p.prorettype <> 'trigger'::regtype
            and has_function_privilege('public', p.oid, 'execute')`);
      expect(
        rows.map((r) => r.nombre),
        "ejecutables por PUBLIC (incluye anon)",
      ).toEqual([]);
    });
  });
});
