/** Ganchos del servidor mock. Solo existen en pruebas. */

const URL_MOCK = process.env.URL_MOCK || "http://localhost:54321";

const pedir = async (ruta: string, opciones?: RequestInit) => {
  const respuesta = await fetch(`${URL_MOCK}${ruta}`, opciones);
  if (!respuesta.ok) {
    throw new Error(`mock ${ruta} respondio ${respuesta.status}`);
  }
  return respuesta.json();
};

const enviar = (ruta: string, cuerpo: unknown) =>
  pedir(ruta, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });

/** Devuelve el mock a su estado semilla. Va antes de cada prueba. */
export const reiniciarMock = () => pedir("/prueba/reiniciar", { method: "POST" });

/** El enlace que Supabase habria mandado por correo. */
export const ultimoEnlaceDeConfirmacion = (): Promise<{ enlace: string | null }> =>
  pedir("/prueba/ultimo-enlace");

export const ponerModoEvento = (activo: boolean) => enviar("/prueba/modo-evento", { activo });

export const estadoDelQR = (
  id: string,
): Promise<{
  qr: { beats_otorgados: number; escaneos_totales_contador: number; estado: string };
  escaneos: number;
}> => pedir(`/prueba/estado-qr?id=${id}`);

export const cambiarBeatsDelQR = (id: string, beats: number) => enviar("/prueba/beats-qr", { id, beats });

export const ultimoUsuario = (): Promise<{ id: string | null }> => pedir("/prueba/ultimo-usuario");

export const balanceDe = (id: string): Promise<{ beats_balance: number | null }> =>
  pedir(`/prueba/balance?id=${id}`);

/** Siembra un escaneo como si hubiera ocurrido hace `diasAtras` dias. */
export const sembrarEscaneo = async (opciones: {
  usuarioId: string;
  qrMarcaId: string;
  beats?: number;
  diasAtras?: number;
}) => {
  const cuando = new Date();
  cuando.setDate(cuando.getDate() - (opciones.diasAtras ?? 0));
  return enviar("/prueba/escaneo", {
    usuario_id: opciones.usuarioId,
    qr_marca_id: opciones.qrMarcaId,
    beats_otorgados: opciones.beats ?? 10,
    confirmado_en: cuando.toISOString(),
    dia_local: cuando.toISOString().slice(0, 10),
  });
};

/**
 * Siembra un movimiento del libro como si hubiera ocurrido hace `diasAtras`
 * dias, a la hora indicada de Caracas. Por defecto las 3 de la tarde: lejos de
 * la medianoche, para que el dia no dependa de a que hora corre la prueba.
 */
export const sembrarMovimiento = (opciones: {
  usuarioId: string;
  tipo: "escaneo" | "bienvenida" | "ajuste" | "regalo";
  beats: number;
  diasAtras?: number;
  horaCaracas?: number;
  minuto?: number;
  marcaId?: string;
}) => {
  const hoyCaracas = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas" }).format(new Date());
  const [a, m, d] = hoyCaracas.split("-").map(Number);
  // Caracas es UTC-4 todo el año (no tiene horario de verano).
  const cuando = new Date(
    Date.UTC(a, m - 1, d - (opciones.diasAtras ?? 0), (opciones.horaCaracas ?? 15) + 4, opciones.minuto ?? 0),
  );
  return enviar("/prueba/movimiento", {
    usuario_id: opciones.usuarioId,
    tipo: opciones.tipo,
    beats: opciones.beats,
    ocurrido_en: cuando.toISOString(),
    marca_id: opciones.marcaId,
  });
};

export const cambiarMarca = (id: string, cambios: { nombre?: string; logo_url?: string | null }) =>
  enviar("/prueba/marca", { id, ...cambios });

export const cambiarEstadoQR = (id: string, estado: "activo" | "inactivo") =>
  enviar("/prueba/qr-estado", { id, estado });

/** Hace fallar una RPC del mock (500) hasta que se apague. */
export const simularFalla = (rpc: string, activa: boolean) => enviar("/prueba/falla", { rpc, activa });

export const movimientosDe = (id: string): Promise<{ tipo: string; beats: number }[]> =>
  pedir(`/prueba/movimientos?id=${id}`);

/** Corta (true) o restablece (false) el tiempo real del mock. */
export const ponerTiempoRealCaido = (caido: boolean) => enviar("/prueba/tiempo-real", { caido });

/** Canales de tiempo real unidos ahora por esa cuenta. */
export const canalesDe = (id: string): Promise<{ canales: number }> => pedir(`/prueba/canales?id=${id}`);

/** Corre hacia atras todos los movimientos de una cuenta. */
export const moverMovimientos = (usuarioId: string, dias: number) =>
  enviar("/prueba/mover-movimientos", { usuario_id: usuarioId, dias });

/** Reemplaza los banners de Inicio. Sin filas, la tabla queda vacia. */
export const ponerBanners = (
  filas: { titulo: string; imagen_url: string | null; enlace_url?: string | null }[],
) => enviar("/prueba/banners", { filas });

/** Los cierres de sesion que recibio el mock, con su alcance. */
export const cierresDeSesion = (): Promise<{ cierres: { usuario: string | null; alcance: string }[] }> =>
  pedir("/prueba/cierres");

/** Archivos guardados en el Storage del mock (bucket "avatares"). */
export const objetosDeStorage = (): Promise<Array<{ clave: string; tipo: string; tamano: number }>> =>
  pedir("/prueba/objetos");

/** La fila de `usuarios` tal como la tiene el mock. */
export const perfilDelMock = (id: string): Promise<{ avatar_path?: string | null } | null> =>
  pedir(`/prueba/perfil?id=${id}`);
