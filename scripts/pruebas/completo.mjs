#!/usr/bin/env node
/**
 * Nivel 2 (docs/pruebas.md): build de produccion + la suite entera de
 * Playwright, incluidas las pruebas de base de datos y la de rendimiento.
 * Es lo que corre GitHub Actions en cada PR (.github/workflows/ci.yml).
 *
 * La salida va truncada: del build solo se ven las ultimas lineas si falla, y
 * de Playwright el reporter "dot" (un punto por prueba y el detalle solo de
 * las que fallan).
 */
import { ENV_PRUEBA, asegurarPostgres, correr, correrCallado } from "./comun.mjs";

const env = { ...process.env, ...ENV_PRUEBA };

// `next build` tambien corre el typecheck y el lint.
const build = correrCallado("next build", "npx", ["next", "build"], env);
if (build !== 0) process.exit(build);

const url = asegurarPostgres();
if (url) env.DATABASE_URL = url;

env.PW_SERVIDOR = "produccion";
env.PROBAR_RENDIMIENTO = "1";
// En CI, ademas, el reporte HTML para subirlo como artifact si algo falla.
const reporter = process.env.CI ? "dot,html" : "dot";

process.exit(correr("npx", ["playwright", "test", "--project=movil", `--reporter=${reporter}`], env));
