/**
 * Espejo minimo de Supabase Realtime para el mock (Fase 4 de Beats).
 *
 * Habla el protocolo que usa @supabase/realtime-js 2.x (vsn 2.0.0): mensajes
 * de texto con la forma [join_ref, ref, topic, event, payload], latido en el
 * topic "phoenix", phx_join con la configuracion de postgres_changes y avisos
 * `postgres_changes` con { ids, data }. Solo lo justo para las pruebas: nada de
 * broadcast ni presence, y un unico tipo de cambio (INSERT).
 *
 * El WebSocket se implementa a mano sobre el `upgrade` de http para no sumar
 * una dependencia solo por las pruebas: marcos de texto, cierre y ping.
 *
 * Como en Supabase, cada socket solo recibe filas de su propio usuario: el
 * `sub` del token con el que se une manda, no el filtro que pida el cliente.
 * Eso imita a la RLS; la RLS de verdad se prueba contra Postgres.
 */
const crypto = require("crypto");

const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

/** Sockets abiertos, cada uno con sus canales unidos. */
const conexiones = new Set();
/** Mientras este caido, se cierran los sockets y se rechazan los nuevos. */
let caido = false;
let siguienteId = 1;

function sujetoDe(token) {
  try {
    return JSON.parse(Buffer.from(String(token).split(".")[1], "base64url")).sub || null;
  } catch {
    return null;
  }
}

function marco(texto) {
  const datos = Buffer.from(texto);
  let cabecera;
  if (datos.length < 126) {
    cabecera = Buffer.from([0x81, datos.length]);
  } else if (datos.length < 65536) {
    cabecera = Buffer.alloc(4);
    cabecera[0] = 0x81;
    cabecera[1] = 126;
    cabecera.writeUInt16BE(datos.length, 2);
  } else {
    cabecera = Buffer.alloc(10);
    cabecera[0] = 0x81;
    cabecera[1] = 127;
    cabecera.writeBigUInt64BE(BigInt(datos.length), 2);
  }
  return Buffer.concat([cabecera, datos]);
}

function enviar(conexion, mensaje) {
  if (conexion.socket.destroyed) return;
  conexion.socket.write(marco(JSON.stringify(mensaje)));
}

function cerrar(conexion) {
  try {
    conexion.socket.end(Buffer.from([0x88, 0]));
  } catch {
    // ya estaba cerrado
  }
  conexiones.delete(conexion);
}

function atender(conexion, texto) {
  let mensaje;
  try {
    mensaje = JSON.parse(texto);
  } catch {
    return;
  }
  const [joinRef, ref, topic, evento, payload] = mensaje;
  const responder = (response = {}) =>
    enviar(conexion, [joinRef, ref, topic, "phx_reply", { status: "ok", response }]);

  if (topic === "phoenix" && evento === "heartbeat") return responder();

  if (evento === "phx_join") {
    const pedidos = payload?.config?.postgres_changes || [];
    const suscripciones = pedidos.map((p) => ({ ...p, id: siguienteId++ }));
    const token = payload?.access_token;
    conexion.canales.set(topic, {
      joinRef,
      suscripciones,
      usuario: sujetoDe(token) || conexion.usuario,
    });
    return responder({ postgres_changes: suscripciones });
  }

  if (evento === "access_token") {
    const canal = conexion.canales.get(topic);
    if (canal) canal.usuario = sujetoDe(payload?.access_token) || canal.usuario;
    return;
  }

  if (evento === "phx_leave") {
    conexion.canales.delete(topic);
    return responder();
  }
}

/** Lee los marcos del cliente (siempre enmascarados) y entrega los de texto. */
function alRecibir(conexion, trozo) {
  conexion.pendiente = Buffer.concat([conexion.pendiente, trozo]);
  for (;;) {
    const b = conexion.pendiente;
    if (b.length < 2) return;
    const opcode = b[0] & 0x0f;
    let largo = b[1] & 0x7f;
    let desplazamiento = 2;
    if (largo === 126) {
      if (b.length < 4) return;
      largo = b.readUInt16BE(2);
      desplazamiento = 4;
    } else if (largo === 127) {
      if (b.length < 10) return;
      largo = Number(b.readBigUInt64BE(2));
      desplazamiento = 10;
    }
    const enmascarado = (b[1] & 0x80) !== 0;
    const inicioDatos = desplazamiento + (enmascarado ? 4 : 0);
    if (b.length < inicioDatos + largo) return;

    const datos = Buffer.from(b.subarray(inicioDatos, inicioDatos + largo));
    if (enmascarado) {
      const mascara = b.subarray(desplazamiento, desplazamiento + 4);
      for (let i = 0; i < datos.length; i++) datos[i] ^= mascara[i % 4];
    }
    conexion.pendiente = b.subarray(inicioDatos + largo);

    if (opcode === 0x1) atender(conexion, datos.toString("utf8"));
    else if (opcode === 0x8) return cerrar(conexion);
    else if (opcode === 0x9) conexion.socket.write(Buffer.concat([Buffer.from([0x8a, datos.length]), datos]));
  }
}

/** Engancha el tiempo real al servidor http del mock. */
function montar(servidor) {
  servidor.on("upgrade", (req, socket) => {
    const url = new URL(req.url, "http://local");
    if (!url.pathname.startsWith("/realtime/v1/websocket") || caido) {
      socket.end("HTTP/1.1 503 Service Unavailable\r\n\r\n");
      return;
    }
    const aceptar = crypto
      .createHash("sha1")
      .update(req.headers["sec-websocket-key"] + GUID)
      .digest("base64");
    socket.write(
      "HTTP/1.1 101 Switching Protocols\r\n" +
        "Upgrade: websocket\r\nConnection: Upgrade\r\n" +
        `Sec-WebSocket-Accept: ${aceptar}\r\n\r\n`,
    );
    const conexion = {
      socket,
      pendiente: Buffer.alloc(0),
      canales: new Map(),
      usuario: sujetoDe(url.searchParams.get("apikey")),
    };
    conexiones.add(conexion);
    socket.on("data", (trozo) => alRecibir(conexion, trozo));
    socket.on("close", () => conexiones.delete(conexion));
    socket.on("error", () => conexiones.delete(conexion));
  });
}

const COLUMNAS = [
  { name: "id", type: "uuid" },
  { name: "usuario_id", type: "uuid" },
  { name: "tipo", type: "tipo_movimiento_beats" },
  { name: "beats", type: "int4" },
  { name: "ocurrido_en", type: "timestamptz" },
  { name: "dia_local", type: "date" },
  { name: "marca_id", type: "uuid" },
  { name: "escaneo_id", type: "uuid" },
  { name: "created_at", type: "timestamptz" },
];

/** `usuario_id=eq.<uuid>` -> comprueba la fila contra el filtro pedido. */
function cumpleFiltro(filtro, fila) {
  if (!filtro) return true;
  const [columna, condicion] = filtro.split("=");
  if (!condicion?.startsWith("eq.")) return false;
  return String(fila[columna]) === condicion.slice(3);
}

/** Avisa a cada canal suscrito a movimientos_beats de una fila nueva. */
function publicarInsercion(tabla, fila) {
  if (caido) return;
  for (const conexion of conexiones) {
    for (const [topic, canal] of conexion.canales) {
      // Solo las filas del dueño del token, como haria la RLS.
      if (!canal.usuario || fila.usuario_id !== canal.usuario) continue;
      const ids = canal.suscripciones
        .filter(
          (s) =>
            (s.event === "INSERT" || s.event === "*") &&
            (!s.schema || s.schema === "public") &&
            (!s.table || s.table === tabla) &&
            cumpleFiltro(s.filter, fila),
        )
        .map((s) => s.id);
      if (ids.length === 0) continue;
      enviar(conexion, [
        canal.joinRef,
        null,
        topic,
        "postgres_changes",
        {
          ids,
          data: {
            schema: "public",
            table: tabla,
            commit_timestamp: new Date().toISOString(),
            type: "INSERT",
            columns: COLUMNAS,
            record: fila,
            errors: null,
          },
        },
      ]);
    }
  }
}

/** Corta o restablece el tiempo real, para probar la caida del canal. */
function ponerCaido(valor) {
  caido = valor;
  if (valor) for (const conexion of [...conexiones]) cerrar(conexion);
}

function reiniciar() {
  ponerCaido(false);
}

/** Cuantos canales hay unidos ahora, por usuario (para las pruebas). */
function canalesDe(usuario) {
  let total = 0;
  for (const conexion of conexiones) {
    for (const canal of conexion.canales.values()) if (canal.usuario === usuario) total++;
  }
  return total;
}

module.exports = { montar, publicarInsercion, ponerCaido, reiniciar, canalesDe };
