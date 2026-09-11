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

export const ponerModoEvento = (activo: boolean) =>
  enviar("/prueba/modo-evento", { activo });

export const estadoDelQR = (
  id: string,
): Promise<{
  qr: { beats_otorgados: number; escaneos_totales_contador: number; estado: string };
  escaneos: number;
}> => pedir(`/prueba/estado-qr?id=${id}`);

export const cambiarBeatsDelQR = (id: string, beats: number) =>
  enviar("/prueba/beats-qr", { id, beats });

export const ultimoUsuario = (): Promise<{ id: string | null }> =>
  pedir("/prueba/ultimo-usuario");

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
