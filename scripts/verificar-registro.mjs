#!/usr/bin/env node
/**
 * V001 — Verificacion del registro contra el Supabase real del proyecto.
 *
 * Recorre el contrato del plan §3 de punta a punta, incluyendo la confirmacion
 * de correo:
 *
 *   1. POST /api/auth/registro con los 6 campos -> 201 { usuario_id, sesion_token }
 *      con sesion_token en null, porque el correo aun no esta confirmado.
 *   2. El mismo correo otra vez -> 409 correo_ya_registrado.
 *   3. Datos con formato invalido -> 400 datos_invalidos.
 *   4. Se confirma el correo y se abre /auth/confirmar.
 *   5. Queda sesion iniciada y la fila de `usuarios` existe con los datos
 *      declarados y beats_balance en 0.
 *
 * Uso:
 *   node scripts/verificar-registro.mjs
 *
 * Necesita, en el entorno o en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * Para el paso 4 hay dos modos:
 *   - Automatico: con SUPABASE_SERVICE_ROLE_KEY en el entorno, el script pide a
 *     Supabase el enlace de confirmacion por la API de admin. Esta key es SOLO
 *     para esta verificacion; la app no la usa.
 *   - Manual: sin esa key, el script se detiene y pide que se pegue el enlace
 *     que llego al correo.
 *
 * Variables opcionales:
 *   BASE_URL  (default http://localhost:3000)
 *   CORREO_PRUEBA  correo a usar; si no, se genera uno con marca de tiempo
 */

import { createInterface } from "node:readline/promises";
import { readFileSync } from "node:fs";

// --- Entorno -----------------------------------------------------------------

function cargarEnvLocal() {
  try {
    for (const linea of readFileSync(".env.local", "utf8").split("\n")) {
      const limpia = linea.trim();
      if (!limpia || limpia.startsWith("#")) continue;
      const separador = limpia.indexOf("=");
      if (separador === -1) continue;
      const clave = limpia.slice(0, separador).trim();
      if (!process.env[clave]) {
        process.env[clave] = limpia.slice(separador + 1).trim();
      }
    }
  } catch {
    // Sin .env.local se usa lo que venga del entorno.
  }
}

cargarEnvLocal();

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  );
  process.exit(1);
}

if (SUPABASE_URL.includes("tu-proyecto")) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL sigue con el valor de ejemplo. Apunta al proyecto real.",
  );
  process.exit(1);
}

// --- Utilidades --------------------------------------------------------------

let fallos = 0;

function comprobar(etiqueta, condicion, detalle = "") {
  if (condicion) {
    console.log(`PASA   ${etiqueta}`);
  } else {
    fallos += 1;
    console.log(`FALLA  ${etiqueta}${detalle ? ` — ${detalle}` : ""}`);
  }
}

/** Cliente HTTP que arrastra cookies, como haria el navegador. */
function crearSesionHttp() {
  const galleta = new Map();

  return async function pedir(ruta, opciones = {}) {
    const cabeceras = new Headers(opciones.headers ?? {});
    if (galleta.size > 0) {
      cabeceras.set(
        "cookie",
        [...galleta].map(([n, v]) => `${n}=${v}`).join("; "),
      );
    }

    const respuesta = await fetch(new URL(ruta, BASE_URL), {
      ...opciones,
      headers: cabeceras,
      redirect: "manual",
    });

    for (const cabecera of respuesta.headers.getSetCookie?.() ?? []) {
      const [par] = cabecera.split(";");
      const separador = par.indexOf("=");
      const nombre = par.slice(0, separador).trim();
      const valor = par.slice(separador + 1).trim();
      if (valor === "" || cabecera.includes("Max-Age=0")) galleta.delete(nombre);
      else galleta.set(nombre, valor);
    }

    return respuesta;
  };
}

// --- Datos de la prueba ------------------------------------------------------

const correo = process.env.CORREO_PRUEBA ?? `qa-latidos-${Date.now()}@ejemplo.com`;
const contrasena = "prueba-latidos-1";
const datos = {
  cedula: "V-12345678",
  nombre: "Maria",
  apellido: "Rodriguez",
  telefono: "04141234567",
  correo,
  tipo_usuario: "estudiante_ucv",
  contrasena,
};

console.log(`V001 contra ${BASE_URL} / ${SUPABASE_URL}`);
console.log(`Correo de prueba: ${correo}\n`);

const http = crearSesionHttp();

// --- 1. Registro -------------------------------------------------------------

const registro = await http("/api/auth/registro", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(datos),
});
const cuerpoRegistro = await registro.json();

comprobar(
  "el registro responde 201",
  registro.status === 201,
  `recibido ${registro.status}: ${JSON.stringify(cuerpoRegistro)}`,
);
comprobar(
  "la salida tiene exactamente usuario_id y sesion_token (plan §3)",
  JSON.stringify(Object.keys(cuerpoRegistro).sort()) ===
    JSON.stringify(["sesion_token", "usuario_id"]),
  `llaves: ${Object.keys(cuerpoRegistro).join(", ")}`,
);
comprobar(
  "usuario_id es un UUID",
  /^[0-9a-f-]{36}$/i.test(cuerpoRegistro.usuario_id ?? ""),
);
comprobar(
  "sesion_token viene en null: falta confirmar el correo",
  cuerpoRegistro.sesion_token === null,
  `recibido ${JSON.stringify(cuerpoRegistro.sesion_token)}`,
);

const usuarioId = cuerpoRegistro.usuario_id;

// --- 2. Correo repetido ------------------------------------------------------

const repetido = await fetch(new URL("/api/auth/registro", BASE_URL), {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ...datos, cedula: "V-99999999" }),
});
const cuerpoRepetido = await repetido.json();
comprobar(
  "un correo ya registrado responde 409 (plan §3)",
  repetido.status === 409 && cuerpoRepetido.error === "correo_ya_registrado",
  `recibido ${repetido.status}: ${JSON.stringify(cuerpoRepetido)}`,
);

// --- 3. Formato invalido -----------------------------------------------------

const invalido = await fetch(new URL("/api/auth/registro", BASE_URL), {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ...datos, correo: "sinarroba", telefono: "hola" }),
});
const cuerpoInvalido = await invalido.json();
comprobar(
  "un formato invalido responde 400 (plan §3)",
  invalido.status === 400 && cuerpoInvalido.error === "datos_invalidos",
  `recibido ${invalido.status}: ${JSON.stringify(cuerpoInvalido)}`,
);

// --- 4. Confirmacion del correo ---------------------------------------------

async function enlaceDeConfirmacion() {
  if (SERVICE_ROLE) {
    const respuesta = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "signup", email: correo, password: contrasena }),
    });
    const cuerpo = await respuesta.json();
    if (!respuesta.ok) {
      throw new Error(`admin/generate_link respondio ${respuesta.status}: ${JSON.stringify(cuerpo)}`);
    }
    const hash = cuerpo.hashed_token ?? cuerpo.properties?.hashed_token;
    if (!hash) throw new Error("la respuesta no trae hashed_token");
    return `${BASE_URL}/auth/confirmar?token_hash=${hash}&type=signup`;
  }

  const lectura = createInterface({ input: process.stdin, output: process.stdout });
  const pegado = await lectura.question(
    `\nAbre el correo enviado a ${correo} y pega aqui el enlace de confirmacion:\n> `,
  );
  lectura.close();
  return pegado.trim();
}

let enlace;
try {
  enlace = await enlaceDeConfirmacion();
} catch (error) {
  comprobar("se obtiene el enlace de confirmacion", false, error.message);
  process.exit(1);
}

const confirmacion = await http(enlace.replace(BASE_URL, ""));
const destino = confirmacion.headers.get("location") ?? "";

comprobar(
  "confirmar el correo redirige a la cuenta lista",
  confirmacion.status >= 300 &&
    confirmacion.status < 400 &&
    destino.includes("/registro/cuenta-lista"),
  `recibido ${confirmacion.status} -> ${destino}`,
);

// --- 5. Sesion y perfil ------------------------------------------------------

const cuentaLista = await http("/registro/cuenta-lista");
const html = await cuentaLista.text();

comprobar(
  "la sesion queda iniciada tras confirmar",
  cuentaLista.status === 200,
  `recibido ${cuentaLista.status}`,
);
comprobar(
  "la pantalla saluda con el nombre registrado",
  html.includes(datos.nombre),
);
comprobar("el balance arranca en 0 Beats", /empezar con[^0-9]*0[^0-9]*Beats/.test(html));

// Esa pantalla lee la fila de `usuarios` con la sesion del propio usuario: si
// el insert o RLS hubieran fallado, no habria nombre ni balance que mostrar.

console.log(
  `\nUsuario de prueba: ${usuarioId} (${correo}). Borralo desde el panel de Supabase cuando termines.`,
);
console.log(fallos === 0 ? "\nV001: todo pasa." : `\nV001: ${fallos} fallo(s).`);
process.exit(fallos === 0 ? 0 : 1);
