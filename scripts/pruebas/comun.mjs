/**
 * Piezas compartidas de los scripts de pruebas por niveles (docs/pruebas.md).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";

/** Variables de prueba: el mock de Supabase, nunca un proyecto real. */
export const ENV_PRUEBA = {
  NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-de-prueba",
  ZONA_HORARIA: "America/Caracas",
};

/** Corre un comando heredando la consola y devuelve su codigo de salida. */
export function correr(comando, args, env = process.env) {
  const r = spawnSync(comando, args, { stdio: "inherit", env, shell: process.platform === "win32" });
  return r.status ?? 1;
}

/**
 * Corre un comando en silencio. Si falla, imprime solo las ultimas lineas de
 * su salida (nunca el log completo) y devuelve el codigo.
 */
export function correrCallado(titulo, comando, args, env = process.env, lineas = 40) {
  const r = spawnSync(comando, args, { env, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status === 0) {
    console.log(`✓ ${titulo}`);
    return 0;
  }
  const salida = `${r.stdout ?? ""}${r.stderr ?? ""}`.trimEnd().split("\n");
  console.log(`✗ ${titulo} (ultimas ${lineas} lineas):\n${salida.slice(-lineas).join("\n")}`);
  return r.status ?? 1;
}

/** ¿Alguno de estos archivos de prueba usa el Postgres de verdad? */
export const necesitanPostgres = (archivos) =>
  archivos.some((f) => existsSync(f) && readFileSync(f, "utf8").includes("ayudantes/base-de-datos"));

/**
 * Deja un Postgres local listo para las pruebas de base de datos y devuelve su
 * URL, o null si no hay ninguno (esas pruebas se saltan solas con un aviso).
 *
 * - Si ya hay DATABASE_URL, se usa tal cual (asi corre en GitHub Actions).
 * - Si no, busca un cluster local en PG_PRUEBAS_DATOS (por defecto
 *   /var/tmp/pgl) y lo arranca en PG_PRUEBAS_PUERTO (por defecto 55432) si
 *   estaba detenido.
 */
export function asegurarPostgres() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const datos = process.env.PG_PRUEBAS_DATOS || "/var/tmp/pgl";
  const puerto = process.env.PG_PRUEBAS_PUERTO || "55432";
  const pgCtl = buscarPgCtl();
  if (!existsSync(datos) || !pgCtl) {
    console.log(`! Sin Postgres local (${datos}): las pruebas de base de datos se saltan.`);
    return null;
  }
  const comoPostgres = (cmd) =>
    process.getuid?.() === 0
      ? spawnSync("su", ["postgres", "-s", "/bin/bash", "-c", cmd], { encoding: "utf8" })
      : spawnSync("bash", ["-c", cmd], { encoding: "utf8" });
  if (comoPostgres(`${pgCtl} -D ${datos} status`).status !== 0) {
    const r = comoPostgres(`${pgCtl} -D ${datos} -o "-p ${puerto}" -l ${datos}/serverlog -w start`);
    if (r.status !== 0) {
      console.log(`! No arranco Postgres en ${datos}: las pruebas de base de datos se saltan.`);
      return null;
    }
    console.log(`✓ Postgres local arrancado en :${puerto}`);
  }
  return `postgres://postgres@127.0.0.1:${puerto}/postgres`;
}

function buscarPgCtl() {
  if (spawnSync("bash", ["-c", "command -v pg_ctl"]).status === 0) return "pg_ctl";
  const base = "/usr/lib/postgresql";
  if (!existsSync(base)) return null;
  const versiones = readdirSync(base).sort().reverse();
  for (const v of versiones) {
    const ruta = `${base}/${v}/bin/pg_ctl`;
    if (existsSync(ruta)) return ruta;
  }
  return null;
}
