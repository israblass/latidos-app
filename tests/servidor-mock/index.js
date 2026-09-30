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
};

let marcas, qrs, escaneos, movimientos, configuracion, usuariosAuth, perfiles, tokens, ultimoEnlace;
// Fallas simuladas por nombre de RPC (Fase 5: "No pudimos actualizar").
let fallas;

/** Devuelve el mock al estado semilla. Las pruebas lo llaman antes de cada caso. */
function reiniciar() {
  marcas = SEMILLA.marcas.map((m) => ({ ...m }));
  qrs = SEMILLA.qrs.map((q) => ({ ...q }));
  escaneos = [];
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
  let cuerpo = "";
  req.on("data", (c) => (cuerpo += c));
  req.on("end", () => {
    const url = new URL(req.url, "http://local");
    // CORS como el de Supabase: la pantalla de Beats lee desde el navegador,
    // no desde el servidor de Next, y el navegador exige estas cabeceras.
    const cors = {
      "access-control-allow-origin": req.headers.origin || "*",
      "access-control-allow-credentials": "true",
      "access-control-allow-headers":
        req.headers["access-control-request-headers"] || "authorization, apikey, content-type, x-client-info, prefer, accept-profile, content-profile",
      "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "access-control-expose-headers": "content-range",
    };
    if (req.method === "OPTIONS") {
      res.writeHead(204, cors);
      return res.end();
    }
    const json = (c, d) => { res.writeHead(c, { "content-type": "application/json", ...cors }); res.end(JSON.stringify(d)); };
    const unico = () => (req.headers.accept || "").includes("pgrst.object");
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
    // Hace fallar una RPC con 500 hasta que se apague.
    if (url.pathname === "/prueba/falla" && req.method === "POST") {
      const { rpc, activa } = JSON.parse(cuerpo);
      if (activa) fallas.add(rpc);
      else fallas.delete(rpc);
      return json(200, { fallas: [...fallas] });
    }
    if (url.pathname === "/prueba/balance" && req.method === "GET") {
      const p = perfiles.get(url.searchParams.get("id"));
      return json(200, { beats_balance: p ? p.beats_balance : null });
    }

    // ---------- Auth ----------

    if (url.pathname === "/auth/v1/signup" && req.method === "POST") {
      const { email, data } = JSON.parse(cuerpo || "{}");
      if (process.env.FALLA_CORREO === "1") {
        return json(500, { code: "unexpected_failure", message: "Error sending confirmation email" });
      }
      if (usuariosAuth.has(email)) {
        // Con la confirmacion activa Supabase no delata que el correo existe:
        // responde 200 con identities vacio.
        return json(200, usuarioDe({ id: crypto.randomUUID(), correo: email, metadata: {}, identities: [], confirmado: false }));
      }
      const id = crypto.randomUUID();
      const reg = { id, correo: email, metadata: data || {}, identities: [{ id, provider: "email" }], confirmado: false };
      usuariosAuth.set(email, reg);
      const th = "hash-" + crypto.randomUUID();
      tokens.set(th, email);
      ultimoEnlace = `/auth/confirmar?token_hash=${th}&type=signup`;
      return json(200, usuarioDe(reg));
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
        perfiles.set(id, { ...fila, beats_balance: 0, onboarding_visto: false, notificaciones_habilitadas: false });
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
