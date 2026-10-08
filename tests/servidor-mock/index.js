/**
 * Mock del API de Supabase para las pruebas de integracion.
 *
 * No es parte de la app: existe para que la suite corra sin tocar el Supabase
 * real, que ni siquiera es alcanzable desde CI. Reimplementa lo justo del API
 * (auth, unas pocas tablas REST y la RPC de canje) para ejercitar el cableado
 * del cliente de punta a punta.
 *
 * Lo que NO prueba este mock: la logica de Postgres. La atomicidad del canje,
 * el bloqueo de fila que serializa dos confirmaciones simultaneas y las
 * politicas RLS se prueban aparte, contra un Postgres de verdad, en
 * qr-concurrencia.test.ts, limite-diario.test.ts y rls.test.ts. Aqui esa misma
 * logica esta reescrita en JavaScript, y una reimplementacion nunca es
 * evidencia de que el original funcione.
 */
const http = require("http");
const crypto = require("crypto");

const tiempoReal = require("./tiempo-real");

const PUERTO = Number(process.env.PUERTO_MOCK || 54321);

// Espejo de supabase/seed.sql. Si el seed cambia, esto cambia con el.
const SEMILLA = {
  marcas: [
    { id: "a1000000-0000-4000-8000-000000000001", nombre: "KFC", logo_url: null },
    { id: "a1000000-0000-4000-8000-000000000002", nombre: "Pepsi", logo_url: null },
    { id: "a1000000-0000-4000-8000-000000000003", nombre: "Movistar", logo_url: null },
  ],
  qrs: [
    { id: "b2000000-0000-4000-8000-000000000001", marca_id: "a1000000-0000-4000-8000-000000000001", beats_otorgados: 10, limite_total_escaneos: null, escaneos_totales_contador: 0, estado: "activo" },
    { id: "b2000000-0000-4000-8000-000000000002", marca_id: "a1000000-0000-4000-8000-000000000002", beats_otorgados: 5, limite_total_escaneos: 3, escaneos_totales_contador: 0, estado: "activo" },
    { id: "b2000000-0000-4000-8000-000000000003", marca_id: "a1000000-0000-4000-8000-000000000002", beats_otorgados: 5, limite_total_escaneos: 2, escaneos_totales_contador: 2, estado: "activo" },
    { id: "b2000000-0000-4000-8000-000000000004", marca_id: "a1000000-0000-4000-8000-000000000003", beats_otorgados: 20, limite_total_escaneos: null, escaneos_totales_contador: 0, estado: "inactivo" },
  ],
  // Espejo del seed de la migracion de banners.
  banners: [
    { id: "c3000000-0000-4000-8000-000000000001", titulo: "Tu marca aquí", imagen_url: "/banners/tu-marca-aqui-corazon.webp", enlace_url: null, orden: 0, activo: true },
    { id: "c3000000-0000-4000-8000-000000000002", titulo: "Tu marca aquí", imagen_url: "/banners/tu-marca-aqui-donaciones.webp", enlace_url: null, orden: 1, activo: true },
    { id: "c3000000-0000-4000-8000-000000000003", titulo: "Tu marca aquí", imagen_url: "/banners/tu-marca-aqui-ecg.webp", enlace_url: null, orden: 2, activo: true },
  ],
};

let banners;
// Cierres de sesion: los que llegaron (con su alcance) y lo que dejaron
// revocado. Supabase revoca la sesion del token con scope=local y todas las
// de la persona con scope=global (el default).
let cierres, sesionesRevocadas, revocadoAntesDe;
let objetos, marcas, qrs, escaneos, movimientos, configuracion, usuariosAuth, perfiles, tokens, ultimoEnlace;
// Fallas simuladas por nombre de RPC (Fase 5: "No pudimos actualizar").
let fallas;

/** Devuelve el mock al estado semilla. Las pruebas lo llaman antes de cada caso. */
function reiniciar() {
  marcas = SEMILLA.marcas.map((m) => ({ ...m }));
  banners = SEMILLA.banners.map((b) => ({ ...b }));
  cierres = [];
  sesionesRevocadas = new Set();
  revocadoAntesDe = new Map(); // usuario -> segundos: tokens emitidos hasta ahi
  qrs = SEMILLA.qrs.map((q) => ({ ...q }));
  escaneos = [];
  objetos = new Map(); // "avatares/<ruta>" -> { bytes, tipo } (Storage)
  movimientos = [];
  configuracion = { modo_evento_activo: false, beats_bienvenida: 5 };
  usuariosAuth = new Map(); // correo -> registro de auth
  perfiles = new Map();     // id -> fila de la tabla usuarios
  tokens = new Map();       // token_hash -> correo
  ultimoEnlace = null;
  fallas = new Set();
  tiempoReal.reiniciar();
}
reiniciar();

/**
 * Espejo del libro de movimientos: todo lo que mueve Beats pasa por aqui, como
 * en la base pasa por el disparador de movimientos_beats. El saldo del perfil
 * nunca se escribe por otro lado.
 */
function registrarMovimiento(usuarioId, tipo, beats, extra = {}) {
  const perfil = perfiles.get(usuarioId);
  if (perfil.beats_balance + beats < 0) throw new Error("saldo negativo");
  const ocurrido_en = extra.ocurrido_en || new Date().toISOString();
  const fila = {
    id: crypto.randomUUID(), usuario_id: usuarioId, tipo, beats,
    marca_id: null, escaneo_id: null,
    ocurrido_en, dia_local: diaEnCaracas(new Date(ocurrido_en)),
    created_at: new Date().toISOString(),
    ...extra,
  };
  movimientos.push(fila);
  perfil.beats_balance += beats;
  // Como la publicacion de Supabase: cada insercion en el libro sale por el
  // canal de tiempo real.
  tiempoReal.publicarInsercion("movimientos_beats", fila);
  return fila;
}

/** YYYY-MM-DD en hora de Caracas, como dia_local_latidos() en la base. */
function diaEnCaracas(instante) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(instante);
}

/**
 * Espejo de historial_beats(): dias completos, del mas reciente al mas
 * antiguo, con la marca en su valor actual. La version que importa vive en
 * supabase/migrations/20260929130000_lectura_beats.sql.
 */
function historialDe(usuarioId, antesDe, cantidadDias) {
  const cantidad = Math.min(Math.max(Number(cantidadDias) || 7, 1), 31);
  const propios = movimientos.filter((m) => m.usuario_id === usuarioId);
  const dias = [...new Set(propios.map((m) => m.dia_local))]
    .filter((d) => !antesDe || d < antesDe)
    .sort()
    .reverse();
  const hayMas = dias.length > cantidad;
  const pagina = dias.slice(0, cantidad);
  return {
    dias: pagina.map((dia) => {
      const delDia = propios
        .filter((m) => m.dia_local === dia)
        .sort((a, b) => (a.ocurrido_en < b.ocurrido_en ? 1 : a.ocurrido_en > b.ocurrido_en ? -1 : 0));
      return {
        dia_local: dia,
        total_neto: delDia.reduce((t, m) => t + m.beats, 0),
        escaneos: delDia.filter((m) => m.tipo === "escaneo").length,
        movimientos: delDia.map((m) => {
          const marca = m.marca_id ? marcas.find((x) => x.id === m.marca_id) : null;
          return {
            id: m.id, tipo: m.tipo, beats: m.beats, ocurrido_en: m.ocurrido_en,
            marca: marca ? { nombre: marca.nombre, logo_url: marca.logo_url } : null,
          };
        }),
      };
    }),
    hay_mas: hayMas,
    siguiente_cursor: hayMas ? pagina[pagina.length - 1] : null,
  };
}

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");

const token = (id, email) => {
  const ahora = Math.floor(Date.now() / 1000);
  return b64({ alg: "HS256", typ: "JWT" }) + "." +
    b64({ sub: id, email, role: "authenticated", exp: ahora + 3600, iat: ahora,
          aud: "authenticated", session_id: crypto.randomUUID() }) + ".firma";
};

const sesion = (id, email, user) => {
  const ahora = Math.floor(Date.now() / 1000);
  return { access_token: token(id, email), token_type: "bearer", expires_in: 3600,
           expires_at: ahora + 3600, refresh_token: "r-" + id, user };
};

const usuarioDe = (reg) => ({
  id: reg.id, email: reg.correo, aud: "authenticated", role: "authenticated",
  created_at: new Date().toISOString(), app_metadata: { provider: "email" },
  user_metadata: reg.metadata, identities: reg.identities,
  email_confirmed_at: reg.confirmado ? new Date().toISOString() : null,
});

const servidor = http.createServer((req, res) => {
  const trozos = [];
  req.on("data", (c) => trozos.push(c));
  req.on("end", () => {
    // Binario para las subidas de Storage; texto para todo lo demas.
    const bruto = Buffer.concat(trozos);
    const cuerpo = bruto.toString();
    const url = new URL(req.url, "http://local");
    // CORS como el de Supabase: la pantalla de Beats lee desde el navegador,
    // no desde el servidor de Next, y el navegador exige estas cabeceras.
    const cors = {
      "access-control-allow-origin": req.headers.origin || "*",
      "access-control-allow-credentials": "true",
      "access-control-allow-headers":
        req.headers["access-control-request-headers"] || "authorization, apikey, content-type, x-client-info, prefer, accept-profile, content-profile",
      "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "access-control-expose-headers": "content-range",
    };
    if (req.method === "OPTIONS") {
      res.writeHead(204, cors);
      return res.end();
    }
    const json = (c, d) => { res.writeHead(c, { "content-type": "application/json", ...cors }); res.end(JSON.stringify(d)); };
    const unico = () => (req.headers.accept || "").includes("pgrst.object");
    const reclamos = () => {
      const a = req.headers.authorization || "";
      try { return JSON.parse(Buffer.from(a.split(" ")[1].split(".")[1], "base64url")); }
      catch { return null; }
    };
    const sujeto = () => {
      const a = req.headers.authorization || "";
      try { return JSON.parse(Buffer.from(a.split(" ")[1].split(".")[1], "base64url")).sub; }
      catch { return null; }
    };

    // ---------- Ganchos de prueba (no existen en Supabase) ----------

    if (url.pathname === "/prueba/reiniciar" && req.method === "POST") {
      reiniciar();
      return json(200, { ok: true });
    }
    // El enlace de confirmacion que Supabase mandaria por correo.
    if (url.pathname === "/prueba/ultimo-enlace" && req.method === "GET") {
      return json(200, { enlace: ultimoEnlace });
    }
    if (url.pathname === "/prueba/modo-evento" && req.method === "POST") {
      configuracion.modo_evento_activo = JSON.parse(cuerpo).activo;
      return json(200, configuracion);
    }
    if (url.pathname === "/prueba/estado-qr" && req.method === "GET") {
      const q = qrs.find((x) => x.id === url.searchParams.get("id"));
      return json(200, { qr: q, escaneos: escaneos.length });
    }
    if (url.pathname === "/prueba/beats-qr" && req.method === "POST") {
      const { id, beats } = JSON.parse(cuerpo);
      const q = qrs.find((x) => x.id === id);
      q.beats_otorgados = beats;
      return json(200, q);
    }
    if (url.pathname === "/prueba/escaneo" && req.method === "POST") {
      escaneos.push(JSON.parse(cuerpo));
      return json(201, { ok: true });
    }
    if (url.pathname === "/prueba/ultimo-usuario" && req.method === "GET") {
      const ids = [...perfiles.keys()];
      return json(200, { id: ids[ids.length - 1] || null });
    }
    if (url.pathname === "/prueba/beats-bienvenida" && req.method === "POST") {
      configuracion.beats_bienvenida = JSON.parse(cuerpo).beats;
      return json(200, configuracion);
    }
    if (url.pathname === "/prueba/movimientos" && req.method === "GET") {
      const id = url.searchParams.get("id");
      return json(200, movimientos.filter((m) => m.usuario_id === id));
    }
    // Siembra un movimiento con fecha arbitraria: dias viejos para el historial,
    // regalos o ajustes como los registraria el equipo tecnico.
    if (url.pathname === "/prueba/movimiento" && req.method === "POST") {
      const { usuario_id, tipo, beats, ocurrido_en, marca_id } = JSON.parse(cuerpo);
      if (!perfiles.has(usuario_id)) return json(404, { message: "sin perfil" });
      try {
        const fila = registrarMovimiento(usuario_id, tipo, beats, {
          ...(ocurrido_en ? { ocurrido_en } : {}),
          ...(marca_id ? { marca_id } : {}),
        });
        return json(201, fila);
      } catch (e) {
        return json(400, { message: e.message });
      }
    }
    // Cambia el nombre o el logo de una marca, como lo haria el admin.
    if (url.pathname === "/prueba/marca" && req.method === "POST") {
      const { id, ...cambios } = JSON.parse(cuerpo);
      const marca = marcas.find((m) => m.id === id);
      Object.assign(marca, cambios);
      return json(200, marca);
    }
    if (url.pathname === "/prueba/qr-estado" && req.method === "POST") {
      const { id, estado } = JSON.parse(cuerpo);
      const qr = qrs.find((q) => q.id === id);
      qr.estado = estado;
      return json(200, qr);
    }
    // Corta o restablece el tiempo real (caida del canal, Fase 4).
    if (url.pathname === "/prueba/tiempo-real" && req.method === "POST") {
      tiempoReal.ponerCaido(Boolean(JSON.parse(cuerpo).caido));
      return json(200, { ok: true });
    }
    if (url.pathname === "/prueba/canales" && req.method === "GET") {
      return json(200, { canales: tiempoReal.canalesDe(url.searchParams.get("id")) });
    }
    // Corre hacia atras todos los movimientos de una cuenta, para tener una
    // pantalla sin dia de HOY en la que un movimiento en vivo cree el dia.
    if (url.pathname === "/prueba/mover-movimientos" && req.method === "POST") {
      const { usuario_id, dias } = JSON.parse(cuerpo);
      for (const m of movimientos.filter((x) => x.usuario_id === usuario_id)) {
        const antes = new Date(new Date(m.ocurrido_en).getTime() - dias * 86400000);
        m.ocurrido_en = antes.toISOString();
        m.dia_local = diaEnCaracas(antes);
      }
      return json(200, { ok: true });
    }
    if (url.pathname === "/prueba/cierres" && req.method === "GET") {
      return json(200, { cierres });
    }
    // Reemplaza los banners (filas tal cual llegarian de la tabla).
    if (url.pathname === "/prueba/banners" && req.method === "POST") {
      const { filas } = JSON.parse(cuerpo || "{}");
      banners = (filas || []).map((f, i) => ({ id: crypto.randomUUID(), orden: i, activo: true, enlace_url: null, ...f }));
      return json(200, { banners });
    }
    // Hace fallar una RPC con 500 hasta que se apague.
    if (url.pathname === "/prueba/falla" && req.method === "POST") {
      const { rpc, activa } = JSON.parse(cuerpo);
      if (activa) fallas.add(rpc);
      else fallas.delete(rpc);
      return json(200, { fallas: [...fallas] });
    }
    // Pone avatar_path directo (sin subir nada): para probar una ruta cuyo
    // archivo no existe.
    if (url.pathname === "/prueba/avatar" && req.method === "POST") {
      const { id, ruta } = JSON.parse(cuerpo);
      const p = perfiles.get(id);
      if (p) p.avatar_path = ruta;
      return json(200, { ok: Boolean(p) });
    }
    if (url.pathname === "/prueba/objetos" && req.method === "GET") {
      return json(200, [...objetos.entries()].map(([clave, o]) => ({ clave, tipo: o.tipo, tamano: o.bytes.length })));
    }
    if (url.pathname === "/prueba/perfil" && req.method === "GET") {
      return json(200, perfiles.get(url.searchParams.get("id")) || null);
    }
    if (url.pathname === "/prueba/balance" && req.method === "GET") {
      const p = perfiles.get(url.searchParams.get("id"));
      return json(200, { beats_balance: p ? p.beats_balance : null });
    }

    // ---------- Auth ----------

    if (url.pathname === "/auth/v1/signup" && req.method === "POST") {
      const { email, password, data } = JSON.parse(cuerpo || "{}");
      if (process.env.FALLA_CORREO === "1") {
        return json(500, { code: "unexpected_failure", message: "Error sending confirmation email" });
      }
      if (usuariosAuth.has(email)) {
        // Con la confirmacion activa Supabase no delata que el correo existe:
        // responde 200 con identities vacio.
        return json(200, usuarioDe({ id: crypto.randomUUID(), correo: email, metadata: {}, identities: [], confirmado: false }));
      }
      const id = crypto.randomUUID();
      // La contraseña se guarda para poder entrar despues (/entrar). En el mock
      // va en claro: es un servidor de pruebas y nunca ve una cuenta real.
      const reg = { id, correo: email, contrasena: password, metadata: data || {}, identities: [{ id, provider: "email" }], confirmado: false };
      usuariosAuth.set(email, reg);
      const th = "hash-" + crypto.randomUUID();
      tokens.set(th, email);
      ultimoEnlace = `/auth/confirmar?token_hash=${th}&type=signup`;
      return json(200, usuarioDe(reg));
    }

    // Entrar con correo y contraseña (signInWithPassword). Los errores van con
    // la forma de Supabase desde la version 2024-01-01 de su API: cabecera de
    // version y `code`, que es lo que auth-js lee para llenar error.code.
    if (url.pathname === "/auth/v1/token" && req.method === "POST" &&
        url.searchParams.get("grant_type") === "password") {
      const errorAuth = (estado, code, message) => {
        res.writeHead(estado, {
          "content-type": "application/json",
          "x-supabase-api-version": "2024-01-01",
          ...cors,
          // Supabase la expone por CORS; sin esto auth-js no ve la version y
          // no llena error.code.
          "access-control-expose-headers": "content-range, x-supabase-api-version",
        });
        res.end(JSON.stringify({ code, message }));
      };
      if (fallas.has("auth:token")) return json(500, { message: "falla simulada" });
      const { email, password } = JSON.parse(cuerpo || "{}");
      const reg = usuariosAuth.get(String(email || "").trim().toLowerCase());
      // Mismo error para correo inexistente y contraseña equivocada, como
      // Supabase: no se delata si el correo tiene cuenta.
      if (!reg || reg.contrasena !== password) {
        return errorAuth(400, "invalid_credentials", "Invalid login credentials");
      }
      if (!reg.confirmado) return errorAuth(400, "email_not_confirmed", "Email not confirmed");
      return json(200, sesion(reg.id, reg.correo, usuarioDe(reg)));
    }

    // Cerrar sesion, con el alcance de Supabase: local revoca solo esta
    // sesion; global (el default), todas las de la persona.
    if (url.pathname === "/auth/v1/logout" && req.method === "POST") {
      const r = reclamos();
      const alcance = url.searchParams.get("scope") || "global";
      cierres.push({ usuario: r && r.sub, alcance });
      if (r && alcance === "local") sesionesRevocadas.add(r.session_id);
      if (r && alcance === "global") revocadoAntesDe.set(r.sub, Math.floor(Date.now() / 1000));
      res.writeHead(204, cors);
      return res.end();
    }

    if (url.pathname === "/auth/v1/settings" && req.method === "GET") {
      return json(200, { mailer_autoconfirm: false, external: { email: true } });
    }

    if (url.pathname === "/auth/v1/verify" && req.method === "POST") {
      const { token_hash } = JSON.parse(cuerpo || "{}");
      const correo = tokens.get(token_hash);
      if (!correo) return json(403, { code: "otp_expired", message: "Token has expired or is invalid" });
      const reg = usuariosAuth.get(correo);
      reg.confirmado = true;
      tokens.delete(token_hash);
      return json(200, sesion(reg.id, correo, usuarioDe(reg)));
    }

    if (url.pathname === "/auth/v1/user" && req.method === "GET") {
      const id = sujeto();
      if (!id) return json(401, { message: "invalid claim" });
      const r = reclamos();
      if (sesionesRevocadas.has(r.session_id) ||
          (revocadoAntesDe.has(id) && r.iat <= revocadoAntesDe.get(id))) {
        return json(403, { code: "session_not_found", message: "Session from session_id claim in JWT does not exist" });
      }
      const reg = [...usuariosAuth.values()].find((r) => r.id === id);
      return reg ? json(200, usuarioDe(reg)) : json(401, { message: "not found" });
    }

    // ---------- REST ----------

    if (url.pathname === "/rest/v1/configuracion_app" && req.method === "GET") {
      if (!sujeto()) return json(401, { message: "no auth" });
      const fila = { modo_evento_activo: configuracion.modo_evento_activo };
      return json(200, unico() ? fila : [fila]);
    }

    if (url.pathname === "/rest/v1/qr_marca" && req.method === "GET") {
      if (!sujeto()) return json(401, { message: "no auth" });
      const filtroId = (url.searchParams.get("id") || "").replace("eq.", "");
      // Espeja la politica qr_marca_select_activos: los inactivos no se leen.
      const fila = qrs.find((q) => q.id === filtroId && q.estado === "activo");
      if (!fila) return unico() ? json(406, { code: "PGRST116", message: "0 rows" }) : json(200, []);
      const marca = marcas.find((m) => m.id === fila.marca_id);
      const salida = { ...fila, marcas: marca ? { nombre: marca.nombre, logo_url: marca.logo_url } : null };
      return json(200, unico() ? salida : [salida]);
    }

    // ---------- Storage: bucket privado "avatares" ----------
    // Espeja supabase/storage/avatares.sql: privado, 1 MB, JPEG/WebP/PNG, y
    // cada quien solo toca su carpeta (<uuid>/...).
    if (url.pathname.startsWith("/storage/v1/object/")) {
      const resto = decodeURIComponent(url.pathname.slice("/storage/v1/object/".length));
      const firmada = resto.startsWith("sign/");
      const clave = firmada ? resto.slice(5) : resto;
      const [bucket, ...partes] = clave.split("/");
      const ruta = partes.join("/");
      const errorStorage = (c, mensaje) => json(c, { statusCode: String(c), error: mensaje, message: mensaje });
      if (bucket !== "avatares") return errorStorage(400, "Bucket not found");

      // Leer con la URL firmada: no lleva sesion, lleva el token.
      if (firmada && req.method === "GET") {
        const obj = objetos.get(clave);
        if (!obj || url.searchParams.get("token") !== `firma:${clave}`) return errorStorage(400, "Object not found");
        res.writeHead(200, { ...cors, "content-type": obj.tipo, "cache-control": "no-store" });
        return res.end(obj.bytes);
      }

      const id = sujeto();
      if (!id) return errorStorage(401, "Unauthorized");
      const propia = (r) => r.split("/")[0] === id;
      if (fallas.has("storage")) return errorStorage(500, "Internal Server Error");

      if (firmada && req.method === "POST") {
        if (!propia(ruta) || !objetos.has(clave)) return errorStorage(400, "Object not found");
        return json(200, { signedURL: `/object/sign/${clave}?token=firma:${clave}` });
      }
      if (req.method === "POST" && ruta) {
        if (!propia(ruta)) return errorStorage(403, "new row violates row-level security policy");
        let bytes = bruto;
        let tipo = req.headers["content-type"] || "";
        // supabase-js manda un Blob dentro de un FormData: se saca la parte del archivo.
        const limite = /boundary=(.+)$/.exec(tipo)?.[1];
        if (limite) {
          const marca = Buffer.from(`--${limite}`);
          let desde = 0;
          while ((desde = bruto.indexOf(marca, desde)) !== -1) {
            const finCabecera = bruto.indexOf("\r\n\r\n", desde);
            if (finCabecera === -1) break;
            const cabecera = bruto.subarray(desde, finCabecera).toString();
            const siguiente = bruto.indexOf(marca, finCabecera);
            if (/filename=/.test(cabecera)) {
              bytes = bruto.subarray(finCabecera + 4, siguiente - 2);
              tipo = /content-type:\s*([^\r\n]+)/i.exec(cabecera)?.[1] || "";
              break;
            }
            desde = siguiente;
          }
        }
        if (bytes.length > 1048576) return errorStorage(413, "Payload too large");
        if (!["image/jpeg", "image/webp", "image/png"].includes(tipo)) return errorStorage(415, "mime type not supported");
        if (objetos.has(clave) && req.headers["x-upsert"] !== "true") return errorStorage(409, "Duplicate");
        objetos.set(clave, { bytes: Buffer.from(bytes), tipo });
        return json(200, { Id: clave, Key: clave });
      }
      if (req.method === "DELETE" && !ruta) {
        const { prefixes = [] } = JSON.parse(cuerpo || "{}");
        const borradas = prefixes.filter((r) => propia(r) && objetos.delete(`avatares/${r}`));
        return json(200, borradas.map((name) => ({ name, bucket_id: "avatares" })));
      }
      return errorStorage(400, "no soportado por el mock");
    }

    // Conteo de los escaneos propios (Perfil): HEAD con Prefer count=exact,
    // como PostgREST, que responde el total en content-range.
    if (url.pathname === "/rest/v1/escaneos" && req.method === "HEAD") {
      const id = sujeto();
      if (!id) { res.writeHead(401, cors); return res.end(); }
      const n = escaneos.filter((e) => e.usuario_id === id).length;
      res.writeHead(200, { ...cors, "content-range": n ? `0-${n - 1}/${n}` : "*/0" });
      return res.end();
    }

    if (url.pathname === "/rest/v1/escaneos" && req.method === "GET") {
      const id = sujeto();
      if (!id) return json(401, { message: "no auth" });
      const qrId = (url.searchParams.get("qr_marca_id") || "").replace("eq.", "");
      const desde = (url.searchParams.get("confirmado_en") || "").replace("gte.", "");
      // Espeja escaneos_select_propios: solo los del sujeto del token.
      const hallados = escaneos.filter((e) =>
        e.usuario_id === id && e.qr_marca_id === qrId &&
        (!desde || new Date(e.confirmado_en) >= new Date(desde)));
      if (hallados.length === 0) return unico() ? json(406, { code: "PGRST116", message: "0 rows" }) : json(200, []);
      return json(200, unico() ? hallados[0] : hallados);
    }

    if (url.pathname === "/rest/v1/usuarios") {
      const id = sujeto();
      if (!id) return json(401, { message: "no auth" });
      if (req.method === "POST") {
        const fila = JSON.parse(cuerpo);
        if (fila.id !== id) return json(403, { code: "42501", message: "RLS" });
        if (perfiles.has(id)) return json(409, { code: "23505", message: "duplicate key" });
        // created_at: espeja el default now() de la tabla (el Perfil lo muestra).
        perfiles.set(id, { ...fila, beats_balance: 0, onboarding_visto: false, notificaciones_habilitadas: false, created_at: new Date().toISOString() });
        // Espeja el disparador de bienvenida: el perfil nace en 0 y el bono
        // llega como movimiento, una sola vez.
        registrarMovimiento(id, "bienvenida", configuracion.beats_bienvenida ?? 5);
        return json(201, perfiles.get(id));
      }
      if (req.method === "PATCH") {
        const actual = perfiles.get(id);
        if (!actual) return json(404, { message: "no existe" });
        const cambios = JSON.parse(cuerpo);
        // Espeja el trigger proteger_beats_balance: el cliente no toca su saldo.
        if ("beats_balance" in cambios && cambios.beats_balance !== actual.beats_balance) {
          return json(403, { code: "P0001", message: "beats_balance no se modifica desde el cliente" });
        }
        // Espeja el check usuarios_avatar_path_propio: solo rutas de su carpeta.
        if (cambios.avatar_path != null && !String(cambios.avatar_path).startsWith(`${id}/`)) {
          return json(400, { code: "23514", message: "usuarios_avatar_path_propio" });
        }
        perfiles.set(id, { ...actual, ...cambios });
        return json(200, perfiles.get(id));
      }
      const fila = perfiles.get(id) || null;
      return json(200, unico() ? fila : fila ? [fila] : []);
    }

    const rpc = url.pathname.startsWith("/rest/v1/rpc/") ? url.pathname.slice(13) : null;
    if (rpc && fallas.has(rpc)) {
      return json(500, { code: "XX000", message: "falla simulada" });
    }

    // Espejo de resumen_beats(): sin sesion o sin perfil, ninguna fila.
    if (rpc === "resumen_beats" && req.method === "POST") {
      const id = sujeto();
      if (!id) return json(401, { message: "no auth" });
      const perfil = perfiles.get(id);
      if (!perfil) return json(200, []);
      return json(200, [{
        saldo: perfil.beats_balance,
        tiene_escaneos: movimientos.some((m) => m.usuario_id === id && m.tipo === "escaneo"),
        onboarding_visto: perfil.onboarding_visto,
      }]);
    }

    if (rpc === "historial_beats" && req.method === "POST") {
      const id = sujeto();
      if (!id) return json(401, { message: "no auth" });
      const { p_antes_de, p_cantidad_dias } = JSON.parse(cuerpo || "{}");
      return json(200, historialDe(id, p_antes_de, p_cantidad_dias));
    }

    // Espeja banners_select_activos: solo con sesion y solo los activos.
    if (url.pathname === "/rest/v1/banners" && req.method === "GET") {
      if (fallas.has("banners")) return json(500, { code: "XX000", message: "falla simulada" });
      if (!sujeto()) return json(401, { message: "no auth" });
      const filas = banners.filter((b) => b.activo)
        .sort((a, b) => a.orden - b.orden)
        .map(({ id, titulo, imagen_url, enlace_url }) => ({ id, titulo, imagen_url, enlace_url }));
      return json(200, filas);
    }

    // Marcas: cualquiera con sesion las lee (marcas_select_autenticado).
    if (url.pathname === "/rest/v1/marcas" && req.method === "GET") {
      if (!sujeto()) return json(401, { message: "no auth" });
      const filtroId = (url.searchParams.get("id") || "").replace("eq.", "");
      const halladas = marcas.filter((m) => !filtroId || m.id === filtroId)
        .map(({ id, nombre, logo_url }) => ({ id, nombre, logo_url }));
      if (unico()) {
        return halladas[0] ? json(200, halladas[0]) : json(406, { code: "PGRST116", message: "0 rows" });
      }
      return json(200, halladas);
    }

    // Espejo en JavaScript de la funcion confirmar_canje_qr de Postgres.
    // Sirve para ejercitar al cliente; la version que importa vive en SQL.
    if (url.pathname === "/rest/v1/rpc/confirmar_canje_qr" && req.method === "POST") {
      const id = sujeto();
      if (!id) return json(401, { message: "no auth" });
      const { p_qr_marca_id, p_inicio_del_dia, p_dia_local } = JSON.parse(cuerpo || "{}");

      if (escaneos.some((e) => e.usuario_id === id && e.qr_marca_id === p_qr_marca_id &&
                               new Date(e.confirmado_en) >= new Date(p_inicio_del_dia))) {
        return json(200, { ok: false, motivo: "ya_escaneado_hoy" });
      }
      const qr = qrs.find((q) => q.id === p_qr_marca_id);
      if (!qr || qr.estado !== "activo") return json(200, { ok: false, motivo: "qr_invalido" });
      if (qr.limite_total_escaneos !== null && qr.escaneos_totales_contador >= qr.limite_total_escaneos) {
        return json(200, { ok: false, motivo: "limite_alcanzado" });
      }

      qr.escaneos_totales_contador += 1;
      const escaneo = { id: crypto.randomUUID(), usuario_id: id, qr_marca_id: qr.id,
                        beats_otorgados: qr.beats_otorgados,
                        confirmado_en: new Date().toISOString(), dia_local: p_dia_local };
      escaneos.push(escaneo);
      registrarMovimiento(id, "escaneo", qr.beats_otorgados,
                          { marca_id: qr.marca_id, escaneo_id: escaneo.id, dia_local: p_dia_local });
      const perfil = perfiles.get(id);
      return json(200, { ok: true, beats_otorgados: qr.beats_otorgados,
                         beats_balance_actualizado: perfil.beats_balance });
    }

    json(404, { message: "no mockeado: " + url.pathname });
  });
});

tiempoReal.montar(servidor);

servidor.listen(PUERTO, () => console.log(`mock de Supabase en :${PUERTO}`));
