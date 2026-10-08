import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { TabBar } from "@/components/navegacion/tab-bar";
import { EliminarCuenta } from "@/components/perfil/eliminar-cuenta";
import { FotoPerfil } from "@/components/perfil/foto-perfil";
import { IconoPerfil, type NombreIcono } from "@/components/perfil/iconos";
import { BannerAliado } from "@/components/registro/banner-aliado";
import { BotonCerrarSesion } from "@/components/sesion/boton-cerrar-sesion";
import { ILUSTRACIONES } from "@/lib/ilustraciones";
import {
  TIPO_EN_PERFIL,
  enmascararCedula,
  enmascararTelefono,
  iniciales,
  latiendoDesde,
} from "@/lib/perfil/formato";
import { leerDatosPerfil } from "@/lib/perfil/leer-perfil";
import { exigirSesionConPerfil } from "@/lib/usuario/sesion";

export const metadata: Metadata = { title: "Perfil · Latidos" };

/**
 * Perfil v1 (constitution §2, v2.11.0): solo lectura, con los datos que ya
 * existen. Avatar con iniciales, nombre, tipo de usuario, tres numeros, "Mis
 * datos" enmascarados, actividad, ajustes, banner "Aliado" y cerrar sesion.
 * Lo que aun no tiene flujo (canjes, ajustes, ayuda, terminos) va atenuado con
 * el chip "Pronto" y sin tap. La foto de perfil (v2.12.0) es privada: solo
 * la ve la persona, con URLs firmadas de su carpeta en el bucket `avatares`.
 *
 * Vidrio: el avatar es la unica pieza con desenfoque (junto con la barra, dos
 * capas); las tarjetas y los chips son .vidrio-plano, el mismo vidrio sin
 * desenfoque.
 *
 * Se pinta en el servidor y con la sesion de quien la pide, asi que nunca se
 * guarda una copia: el service worker solo guarda la de /beats, que no lleva
 * datos de nadie.
 */
export default async function Perfil() {
  const { correo, perfil } = await exigirSesionConPerfil();
  const { datos, escaneos } = await leerDatosPerfil(perfil.id);
  const arte = ILUSTRACIONES.circulosPulsoBienvenida;

  const nombre = datos?.nombre ?? perfil.nombre;
  const apellido = datos?.apellido ?? "";
  const desde = latiendoDesde(datos?.created_at);
  const cedula = datos?.cedula ? enmascararCedula(datos.cedula) : null;
  const telefono = datos?.telefono ? enmascararTelefono(datos.telefono) : null;

  return (
    <>
      <main className="perfil">
        <div aria-hidden="true" className="registro-arte">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={arte.src} alt="" width={arte.ancho} height={arte.alto} decoding="async" />
        </div>

        <header className="flex flex-col items-center text-center">
          <FotoPerfil
            usuarioId={perfil.id}
            iniciales={iniciales(nombre, apellido)}
            rutaInicial={datos?.avatar_path ?? null}
          />
          <h1 className="perfil-nombre">{`${nombre} ${apellido}`.trim()}</h1>
          {datos ? (
            <p className="vidrio vidrio-plano perfil-chip mt-3" data-tipo-usuario={datos.tipo_usuario}>
              <span aria-hidden="true" className="circulo-navy perfil-chip-icono">
                <IconoPerfil nombre="birrete" tamano={14} trazo={2.2} />
              </span>
              {TIPO_EN_PERFIL[datos.tipo_usuario]}
            </p>
          ) : null}
          {desde ? <p className="mt-2.5 text-[13px] text-texto-secundario">{desde}</p> : null}
        </header>

        <section aria-label="Tus números" className="vidrio vidrio-plano perfil-numeros">
          <Numero valor={datos?.beats_balance ?? null} etiqueta="Beats" grande />
          <Numero valor={escaneos} etiqueta="Escaneos" />
          {/* Canjes: el flujo aun no existe. */}
          <Numero valor={null} etiqueta="Canjes" />
        </section>

        <h2 className="perfil-seccion">Mis datos</h2>
        <dl className="vidrio vidrio-plano perfil-lista">
          <Dato
            etiqueta="Cédula"
            valor={cedula?.visible ?? "—"}
            leida={cedula?.leida}
            extra={
              <span className="ml-auto shrink-0 text-texto-secundario">
                <IconoPerfil nombre="candado" tamano={16} trazo={2.2} />
              </span>
            }
          />
          <Dato etiqueta="Teléfono" valor={telefono?.visible ?? "—"} leida={telefono?.leida} />
          <Dato etiqueta="Correo" valor={correo ?? "—"} />
        </dl>

        <h2 className="perfil-seccion">Mi actividad</h2>
        <ul className="vidrio vidrio-plano perfil-lista">
          <Fila
            icono="historial"
            titulo="Historial de Beats"
            subtitulo="Todo lo que has sumado"
            href="/beats"
          />
          <Fila icono="regalo" titulo="Mis canjes" subtitulo="Premios y recompensas" />
        </ul>

        <h2 className="perfil-seccion">Ajustes</h2>
        <ul className="vidrio vidrio-plano perfil-lista">
          {/* Ninguna tiene pantalla todavia, y el proyecto aun no tiene un
              contacto de soporte: las tres van como "Pronto". */}
          <Fila icono="campana" titulo="Notificaciones" />
          <Fila icono="ayuda" titulo="Ayuda y contacto" />
          <Fila icono="documento" titulo="Términos y privacidad" />
        </ul>

        <div className="mt-6">
          <BannerAliado slot="perfil-pie" siempreVisible />
        </div>

        <div className="mt-[26px] flex flex-col items-center">
          <BotonCerrarSesion />
          <EliminarCuenta />
        </div>
      </main>

      <TabBar />
    </>
  );
}

/** Un numero de la tarjeta; sin dato, una raya ("—") y no un cero inventado. */
function Numero({
  valor,
  etiqueta,
  grande = false,
}: {
  valor: number | null;
  etiqueta: string;
  grande?: boolean;
}) {
  return (
    <div className="perfil-numero" data-numero={etiqueta}>
      <p className={grande ? "perfil-numero-valor text-[52px]" : "perfil-numero-valor text-[40px]"}>
        {valor === null ? (
          <>
            <span aria-hidden="true">—</span>
            <span className="sr-only">sin datos todavía</span>
          </>
        ) : (
          valor
        )}
      </p>
      <p className="perfil-numero-etiqueta">{etiqueta}</p>
    </div>
  );
}

/** Una fila de "Mis datos": solo lectura en v1, en una linea con elipsis. */
function Dato({
  etiqueta,
  valor,
  leida,
  extra,
}: {
  etiqueta: string;
  valor: string;
  /** Lo que lee el lector de pantalla cuando el valor va enmascarado. */
  leida?: string;
  extra?: ReactNode;
}) {
  return (
    <div className="perfil-fila">
      <dt className="perfil-fila-etiqueta">{etiqueta}</dt>
      <dd className="perfil-fila-valor" aria-label={leida}>
        <span>{valor}</span>
        {extra}
      </dd>
    </div>
  );
}

/**
 * Una fila con icono. Con `href` navega (chevron a la derecha); sin el, la
 * funcion aun no existe: atenuada, sin tap, sin flecha y con el chip "Pronto".
 */
function Fila({
  icono,
  titulo,
  subtitulo,
  href,
}: {
  icono: NombreIcono;
  titulo: string;
  subtitulo?: string;
  href?: string;
}) {
  const contenido = (
    <>
      <span aria-hidden="true" className="perfil-icono">
        <IconoPerfil nombre={icono} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-semibold text-texto-principal">{titulo}</span>
        {subtitulo ? <span className="block text-[13px] text-texto-secundario">{subtitulo}</span> : null}
      </span>
    </>
  );

  return (
    <li className="perfil-fila-lista">
      {href ? (
        <Link href={href} className="perfil-fila perfil-fila-enlace">
          {contenido}
          <span aria-hidden="true" className="shrink-0 text-texto-secundario">
            <IconoPerfil nombre="chevron" tamano={18} trazo={2.4} />
          </span>
        </Link>
      ) : (
        <div role="link" aria-disabled="true" className="perfil-fila" data-pronto="">
          {contenido}
          <span className="vidrio vidrio-plano perfil-chip-pronto">Pronto</span>
        </div>
      )}
    </li>
  );
}
