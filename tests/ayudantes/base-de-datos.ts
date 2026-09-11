import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { Client, Pool } from "pg";

/**
 * Conexion a un Postgres de verdad para las pruebas que no se pueden fingir.
 *
 * La atomicidad del canje, el bloqueo de fila que serializa dos confirmaciones
 * simultaneas y las politicas RLS son comportamiento de Postgres. Probarlos
 * contra el mock no probaria nada: el mock los reimplementa en JavaScript.
 *
 * Sin DATABASE_URL estas pruebas se saltan con un aviso, en vez de pasar en
 * falso. Para correrlas:
 *
 *   DATABASE_URL=postgres://postgres@localhost:5432/postgres npm run test:bd
 */
export const URL_BASE_DATOS = process.env.DATABASE_URL;

export const hayBaseDeDatos = Boolean(URL_BASE_DATOS);

export const MOTIVO_SIN_BASE =
  "Necesita un Postgres real: define DATABASE_URL (ver tests/ayudantes/base-de-datos.ts)";

const RAIZ = process.cwd();

/** Las migraciones en el orden en que se aplican, mas el shim de Supabase. */
function sqlDelEsquema(): string[] {
  const dir = join(RAIZ, "supabase", "migrations");
  const migraciones = readdirSync(dir)
    .filter((n) => n.endsWith(".sql"))
    .sort()
    .map((n) => readFileSync(join(dir, n), "utf8"));
  const shim = readFileSync(join(RAIZ, "tests", "servidor-mock", "supabase-shim.sql"), "utf8");
  const semilla = readFileSync(join(RAIZ, "supabase", "seed.sql"), "utf8");
  return [shim, ...migraciones, semilla];
}

/**
 * Crea una base limpia con el esquema y la semilla, y devuelve un pool hacia
 * ella. Cada archivo de prueba usa la suya para no pisarse con los demas.
 */
export async function prepararBase(nombre: string) {
  if (!URL_BASE_DATOS) throw new Error(MOTIVO_SIN_BASE);

  const base = new URL(URL_BASE_DATOS);
  const administrador = new Client({ connectionString: URL_BASE_DATOS });
  await administrador.connect();
  await administrador.query(`drop database if exists ${nombre}`);
  await administrador.query(`create database ${nombre}`);
  await administrador.end();

  base.pathname = `/${nombre}`;
  const pool = new Pool({ connectionString: base.toString() });
  for (const sql of sqlDelEsquema()) {
    await pool.query(sql);
  }
  return pool;
}

/** Crea una cuenta con perfil, como la dejaria el registro. */
export async function crearUsuario(pool: Pool, correo: string) {
  const { rows } = await pool.query<{ id: string }>(
    `insert into auth.users (id, email) values (gen_random_uuid(), $1) returning id`,
    [correo],
  );
  const id = rows[0].id;
  await pool.query(
    `insert into public.usuarios (id, cedula, nombre, apellido, telefono, correo, tipo_usuario)
     values ($1, 'V-1', 'Prueba', 'Prueba', '04140000000', $2, 'externo')`,
    [id, correo],
  );
  return id;
}

/**
 * Corre una consulta como la correria el cliente: con el rol `authenticated` y
 * el claim `sub` puesto, que es exactamente el contexto en el que se evaluan
 * las politicas RLS. Sin esto se consultaria como dueño de la base y RLS ni
 * siquiera se aplicaria, que es la trampa clasica de estas pruebas.
 */
export type Consultar = <F extends Record<string, unknown>>(
  sql: string,
  valores?: unknown[],
) => Promise<{ rows: F[] }>;

export async function comoUsuario(
  pool: Pool,
  usuarioId: string,
  trabajo: (consultar: Consultar) => Promise<void>,
) {
  const conexion = await pool.connect();
  try {
    await conexion.query("begin");
    await conexion.query("set local role authenticated");
    await conexion.query(`set local request.jwt.claim.sub = '${usuarioId}'`);
    await trabajo(((sql: string, valores?: unknown[]) =>
      conexion.query(sql, valores)) as Consultar);
    await conexion.query("commit");
  } catch (error) {
    await conexion.query("rollback").catch(() => {});
    throw error;
  } finally {
    conexion.release();
  }
}

/**
 * Abre una conexion propia (no del pool) ya puesta en el rol `authenticated`
 * con el claim `sub` del usuario, que es el contexto en el que corren las
 * politicas RLS y la funcion de canje.
 *
 * Es una conexion aparte a proposito: `set role` sin transaccion se queda
 * pegado a la conexion, y devolver al pool una conexion con el rol cambiado
 * hace fallar por permisos a la siguiente consulta que la reutilice.
 */
export async function conexionComoUsuario(nombreBase: string, usuarioId: string) {
  if (!URL_BASE_DATOS) throw new Error(MOTIVO_SIN_BASE);
  const url = new URL(URL_BASE_DATOS);
  url.pathname = `/${nombreBase}`;

  const cliente = new Client({ connectionString: url.toString() });
  await cliente.connect();
  await cliente.query("set role authenticated");
  await cliente.query("select set_config('request.jwt.claim.sub', $1, false)", [usuarioId]);
  return cliente;
}
