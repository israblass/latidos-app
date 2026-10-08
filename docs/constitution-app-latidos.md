---
tipo: constitution
producto: Latidos App
slug: latidos-app
version: 2.10.1
fecha-creacion: 2026-08-20
ultima-modificacion: 2026-10-03
<!-- v2.0.0 | 2026-08-26 | Cambio de stack a PWA (Next.js + Capacitor) para lanzar en Android e iOS el 15 sept sin esperar aprobacion de tiendas. Fase 1 reordenada segun acuerdo con Kevin: prioriza registro + QR + Beats sobre Pulso completo. Beats por QR de marca ahora configurables en cualquier momento por el admin. -->
<!-- v2.1.0 | 2026-09-10 | Cambio de design system: base clara/blanca en vez de fondo oscuro solido. El cliente pidio explicitamente alejarse del fondo oscuro por no ir con la tematica festiva del evento. Referencia de atmosfera: apps tipo Cashea/Yummy. La paleta de marca (amarillo/azul) y la tipografia no cambian, solo la base y los tonos de superficie. Pantallas ya construidas (bienvenida, registro, onboarding, Inicio) requieren pasada de restyle. -->
<!-- v2.10.1 | 2026-10-03 | bienvenida: el arte llega al borde físico de la pantalla (edge-to-edge); pie con los logos de los aliados (Flame y sello UCV) en monocromo negro por pedido de diseño, sin deformarlos (MUN UCV retirado por solicitud del cliente); regla de reserva del logo LATIDOS (RESERVA_LOGO = 0.5 × altura del wordmark): ningún elemento principal de las ilustraciones la invade; pantalla de carga de la app instalada: solo el icono sobre el fondo de marca, con imágenes de arranque de iOS (14 tamaños) y un overlay en línea que solo se ve en standalone. Con la barra 'default' de iOS (que no cambia) la zona segura vale 0: el borde de arriba se funde con el crema (máscara a 56px + velo). Service worker v12. -->
<!-- v2.10.0 | 2026-10-02 | Bienvenida inmersiva (referencia-v5 aprobada por Isra): carrusel de 4 pantallas con scroll-snap y textos fijos (Tu pulso cuenta, Vive cada evento, Recorre la UCV, Enciende tu pulso), ilustraciones grandes sobre campos de color de la paleta y, fijos abajo, dos botones de deslizar de vidrio (variantes vidrio-amarillo y vidrio-blanco; excepcion: "Ya tengo cuenta" tambien se desliza). Sale el cielo de foto y la card de vidrio de la bienvenida (FondoApp queda solo en el onboarding). Variantes de logo con aro blanco en el sello UCV y wordmark blanco sobre el amarillo pleno (constante LOGO_AMARILLO para pasar a navy). Excepcion de color para las ilustraciones. Service worker v11. -->
<!-- v2.9.0 | 2026-10-02 | Pulido antes de las pruebas con el equipo (referencia-v3 aprobada por Isra): circulos del pulso en la tarjeta de Beats del Inicio, techo de nubes arriba del Inicio, Beats con una sola tarjeta de vidrio (saldo + Tu pulso; se van el hero navy, la tarjeta Tu pulso aparte, el "+N Beats" duplicado, la variante navy del contador y el token texto-sobre-navy), boton de deslizar <BotonDeslizar> solo para la accion principal y las irreversibles, iconos de la barra corregidos (rayo para Pulso, corazon para Beats). Con una hoja abierta, el vidrio de la pantalla de atras apaga su desenfoque para no pasar de dos capas. -->
<!-- v2.8.0 | 2026-10-01 | Pantalla de Beats como dashboard (referencia-v2/beats-dashboard aprobada por Isra): cabecera "Tus Beats" con la pildora navy "?", hero navy opaco con chip de la semana, tarjeta "Tu pulso" (ECG del cliente y metricas de 7 dias), carrusel de marcas con su criterio de calculo, historial por dias en el acordeon compartido y boton "Cómo ganar". Vuelve el token de texto sobre navy como blanco al 72%. Los colores de exito, alerta y error quedan documentados como excepcion funcional de la paleta. Pendiente de unificacion: el gris terciario #9CA3AF y el azul de texto #0070CC (no se tocan en esta version). -->
<!-- v2.7.0 | 2026-10-01 | Inicio pulido (referencia-v2 aprobada por Isra): campana con hoja de notificaciones (solo interfaz, estado vacio, sin backend), avatar de marca en la pildora de perfil, tarjeta de Beats de vuelta en vidrio sobre el degradado, y principio de paleta: solo colores de la paleta y transparencias de esos mismos colores (fuera los tokens celeste, celeste-claro, gris-chip y sobre-navy, el gris de vidrio #4A5160 y las sombras #101828), vigilado por una prueba. "Cómo gano Beats" queda solo en la pantalla de Beats. -->
<!-- v2.6.0 | 2026-10-01 | Inicio rediseñado (referencia aprobada por Isra): botones en pildora plana con modificador de flecha y boton oscuro; cabecera con pildoras de ayuda y perfil; tarjeta de Beats navy plana como excepcion al vidrio; fondo del Inicio en degradado de marca en CSS (el cielo de foto queda en bienvenida y onboarding); patron de acordeon; regla de copy de CTA. -->
<!-- v2.5.0 | 2026-10-01 | Liquid glass que se nota: receta con variables (tinte en degradado, blur 24px + saturacion 200% + brillo, borde y reflejo marcados, sombra definida), opacidades minimas por contraste sobre negro, gris de texto sobre vidrio #4A5160, contenido con color detras de cada vidrio (cielo pleno bajo el contador de Inicio, capsula de puntos sobre el banner) y excepcion de controles chicos en el limite de dos capas. -->
<!-- v2.4.0 | 2026-10-01 | Menu inferior como pildora flotante de vidrio (estilo Facebook iOS / BanescoMovil): separada de los bordes, pestaña activa en su propia pildora amarilla que se desliza, etiquetas visibles en todas las pestañas e iconos SVG de trazo uniforme. El espacio inferior de las pantallas sale de un solo token. -->
<!-- v2.3.0 | 2026-10-01 | Base crema #FFFFF5 (unica definicion: --color-fondo en globals.css) con tarjetas, hojas y modales en blanco puro #FFFFFF. Regla del amarillo y regla del azul. Liquid glass renovado en CSS puro y definido en un solo lugar (.vidrio, .vidrio-barra, .vidrio-hoja), maximo dos capas a la vez. El cielo solo en bienvenida, onboarding y header de Inicio. Texto secundario #565E6D. Icono nuevo de la app. -->
<!-- v2.2.0 | 2026-09-29 | Se documenta lo ya construido y pedido por el cliente: vidrio esmerilado (liquid glass) claro sobre un lienzo de cielo con velo blanco, y contador de Beats en navy con barra y halo amarillo (sin card oscura). Se agrega el bono de bienvenida (5 Beats configurables, una vez por cuenta, al confirmar el correo) y las reglas de consistencia saldo/historial, historial en vivo y marcas en el historial. Salen de la historia de Beats: balance e historial. -->
---

# Constitution: Latidos App

## 1. Identidad

- **Producto**: Latidos App — aplicacion movil del programa Latidos UCV para participacion, gamificacion y donaciones
- **Slug**: latidos-app
- **Mercado**: Venezuela (Caracas, universidad UCV, estudiantes, egresados, publico externo y marcas patrocinadoras)
- **Organizador**: The Flame Creative Lab (agencia creativa, Caracas)
- **Desarrollador**: Israel Maita / ISRA BLASS (tech partner de Flame)

### Actores del ecosistema

- **Usuario final**: estudiante UCV, egresado o persona externa que participa en el programa. Se registra, acumula Beats por acciones (donar, escanear QR, participar en dinamicas, asistir a actividades), canjea Beats por merch/entradas/cursos, ve contenido del programa y recibe notificaciones.
- **Patrocinante (marca)**: empresa que paga un paquete de patrocinio. En la app tiene QR propios que los usuarios escanean, banners publicitarios en espacios vendidos, y acceso a metricas de su participacion via dashboard (web, no app — ver constitution latidos-web).
- **Operador de punto de control**: persona en un centro de acopio o stand que valida donaciones/participacion escaneando el QR del usuario. Puede ser voluntario de Flame o personal de la marca.
- **Admin (backoffice)**: equipo de Flame/Kevin. Gestiona actividades, define Beats por accion, carga jornadas de Pulso, administra QR de marcas, controla notificaciones push, exporta data. Backoffice compartido con la web via Supabase.

### Contexto del programa

Latidos es un programa de 6 meses (septiembre 2026 — marzo 2027). La app es el hilo conductor que acompana al usuario a traves de las tres fases:

1. **Pulso** (15 sept — 30 marzo): responsabilidad social. El usuario ve los insumos que se necesitan cada mes, dona en centros de acopio, escanea QR para sumar Beats, y ve la cronologia de jornadas pasadas con fotos, recap y participantes.
2. **Empuje** (18 de diciembre de 2026): Gaitazo y Misa de Accion de Gracias. Encuentro de fe, tradicion y union para celebrar la resiliencia de la comunidad. Marcas invitadas con stand y QR propio. El usuario escanea QR de marcas para sumar Beats, participa en dinamicas, voluntariados navideños.
3. **Late Venezuela / Festival** (23-27 marzo 2027): una semana completa con cinco componentes: expo de marcas en Plaza Cubierta del Rectorado (+100 espacios), expo automotriz en estacionamiento de Ingenieria Mecanica (test drives, marcas de aceite, talleres, accesorios), torneos deportivos en canchas PINECO (futbol y voleibol, ~12 equipos por deporte incluyendo equipos de otras universidades via influencers, 3 canchas recuperadas en alianza con PINECO), concierto de cierre el 27 de marzo con artistas invitados. Todo entrada libre excepto el concierto (se canjea con Beats). Mapa interactivo, feed de fotos, predicciones deportivas con parlay de Beats, canje final de Beats por entradas.

### Relacion app — web

La app y la web Latidos son productos separados que comparten backend (Supabase, misma instancia). La web es el canal informativo publico y de gestion de patrocinantes. La app es el canal de participacion del usuario final. Esta constitution cubre SOLO la app. La web tiene su propia constitution (latidos-web).

Datos compartidos entre ambos productos via Supabase:
- Tabla de patrocinantes y paquetes
- Metricas de escaneos QR (la app los genera, la web los muestra en el dashboard del patrocinante)
- Jornadas de Pulso (el admin las carga desde backoffice, la web y la app las consumen)
- Tabla de emails de interes (la web los captura, la app podria consumirlos en el futuro)

## 2. Design System

### Paleta de colores

Heredada del branding oficial (LAF.psd), misma paleta de marca que la web. Base clara (revision v2.1.0): el cliente pidio explicitamente alejarse de un fondo oscuro por no ir con la tematica festiva del evento — referencia de atmosfera: apps tipo Cashea/Yummy (fondo blanco/claro, acentos de color en cards y botones, secciones bien segmentadas).

- **Primario (Amarillo Latidos)**: `#FDFB05` — CTAs, acentos de atencion, indicadores de Beats, badges de logro. Color protagonista.
- **Secundario (Azul UCV)**: `#0090FF` — acentos institucionales, links, iconografia, barras de progreso.
- **Fondo principal app (crema)**: `#FFFFF5` — fondo de pagina de toda la app (revision v2.3.0). Se define UNA sola vez como `--color-fondo` en `globals.css`; Tailwind (`bg-fondo`) apunta a la variable y ningun componente lleva el valor escrito. Solo el manifest y el meta `theme-color` lo repiten, porque no pueden leer CSS.
- **Superficies (tarjetas, hojas, modales)**: `#FFFFFF` puro sobre el crema, con borde `rgba(26,35,50,0.06)` y sombra corta. Es lo que da profundidad: la pieza blanca se lee apoyada sobre la pagina crema.
- **Fondo secundario**: `#F5F7FA` — inputs, chips apagados y zonas de respiro dentro de una superficie.
- **Fondo oscuro (uso puntual)**: `#0D1117` — reservado para elementos que necesitan contraste fuerte puntual (ej. tarjetas de "logro" destacado, contador de Beats grande en Inicio si se decide destacarlo asi), NO como base general de pantalla.
- **Borde sutil**: `rgba(0,0,0,0.08)` — separadores y bordes de cards sobre fondo claro.
- **Texto principal**: `#1A2332` — titulos, nombres, datos destacados (no negro puro).
- **Texto secundario**: `#565E6D` — descripciones, metadata, timestamps. (Antes `#6B7280`, que sobre superficies translucidas bajaba de AA.)
- **Texto terciario**: `#9CA3AF` — placeholders, hints.
- **Exito**: `#2EA043` — confirmaciones, donacion completada, Beats sumados.
- **Alerta**: `#D29922` — advertencias, limites cercanos.
- **Error**: `#F85149` — errores de validacion, QR invalido.

### Principio de paleta (v2.7.0)

En `src/` solo se escriben colores de la paleta, opacos o con transparencia de ese mismo color. No se inventan tonos intermedios: un celeste es el azul con alfa, un gris de chip es el `#F5F7FA`.

- **Paleta**: crema `#FFFFF5`, blanco `#FFFFFF`, amarillo `#FDFB05` (solo relleno con texto navy), azul `#0090FF` (texto grande, iconos, bordes y rellenos), navy `#1A2332`, gris texto `#565E6D`, fondo secundario `#F5F7FA` y oscuro `#0D1117` (uso puntual).
- **Transparencias de uso comun**: azul al 12% (circulos de icono), azul al 8% (paneles claros), blanco al 72% (texto secundario sobre navy), navy al 8% (bordes y separadores), navy al 15% (borde del boton secundario). Las sombras son navy con alfa.
- **Prueba**: `diseno.test.ts` falla si aparece en `src/` un hex o un `rgb()`/`rgba()` cuyo color no sea de la paleta. Lo que solo se menciona en un comentario no cuenta.
- **Excepcion documentada**: los colores de una marca patrocinante. La linea se marca con el comentario `paleta: marca patrocinante`.
- **Excepcion funcional (v2.8.0)**: los colores de estado de `tailwind.config.ts` se quedan como estan, porque comunican un estado y no decoran: exito `#2EA043`, alerta `#D29922` y error `#F85149`, con sus variantes oscurecidas para texto sobre fondo claro (`exito-texto` `#15803D`, `alerta-texto` `#9A6700`, `error-texto` `#B3261E`). No se reemplazan por colores de la paleta.
- **Pendiente de unificacion**: el gris terciario `#9CA3AF` (placeholders, hints) y el azul de texto `secundario-texto` `#0070CC` siguen fuera de la paleta. No se tocan hasta decidir con que se unifican (anotado en el CHANGELOG de la v2.8.0).
- **Texto sobre navy**: en la v2.8.0 volvio el token `texto-sobre-navy` como blanco al 72% para el hero navy de Beats. En la v2.9.0 ese hero se fue y el token se quito: no queda texto sobre navy fuera de los botones.
- **Ilustraciones (v2.9.0; v2.10.0)**: los archivos de arte de marca (`public/ilustraciones/*.webp` y los logos de `public/marca/`) quedan fuera de la regla: son imagenes y conservan los colores originales de la ilustradora (el rojo del vitral, el verde del estadio, el gris de la estatua). La regla vigila el CSS y el codigo de `src/`: los campos de color, sombras y tintes que acompañan a las ilustraciones siguen siendo paleta + alfa.

### Regla del amarillo (v2.3.0)

El `#FDFB05` queda en 1.1:1 contra el crema y el blanco: es invisible como trazo.

- **Nunca** como color de texto ni como linea fina (bordes, subrayados, separadores, anillos) sobre crema o blanco.
- **Si** como relleno de botones, chips y acentos con texto navy `#1A2332` encima, o en formas grandes (el circulo de Escanear, el banner provisional, el halo del contador).
- La barra de acento bajo titulos y contadores es una pastilla de 10px con un canto navy suave, no una linea.

### Regla del azul (v2.3.0)

- El azul `#0090FF` va en texto grande (>= 18px bold o >= 24px), iconos, bordes y rellenos.
- El texto chico va en navy `#1A2332` o en gris `#565E6D`: botones secundarios y ghost (el ghost lleva subrayado azul), etiqueta del tab activo, chips.

### Tipografia

- **Display**: Anton (condensada bold). Titulos de seccion, nombres de fase, contadores de Beats grandes. Siempre mayusculas.
- **Body**: DM Sans. Pesos: 300 (body), 400 (enfasis), 500 (subtitulos/labels activos), 700 (bold/numeros destacados).

### Jerarquia tipografica (mobile)

- Titulo de pantalla: Anton, 28-32px, uppercase
- Subtitulo de seccion: DM Sans 500, 18-20px
- Body: DM Sans 300, 15-16px, line-height 1.6
- Label/Tag: DM Sans 500, 11px, uppercase, letter-spacing 0.1em
- Caption: DM Sans 300, 12px, color texto secundario
- Numero grande (Beats, stats): Anton, 48-72px

### Componentes mobile

- **Botones (v2.6.0)**: pildoras planas, como una app seria. Definidos una sola vez en `globals.css`:
  - `.boton-primario`: amarillo plano `#FDFB05`, texto navy, `rounded-full`, alto minimo 52px, DM Sans 16px semibold (600). Sin degradado ni sombras elevadas. Al tocar, `scale(.98)`; deshabilitado, opacidad 0.4.
  - `.boton-secundario`: blanco, `rounded-full`, borde 1px navy al 15%, texto navy. El azul ya no es su borde: queda solo para el anillo de foco (2px, separado 2px).
  - `.boton-oscuro`: navy plano, texto blanco, mismo alto.
  - `.boton-ghost`: sin borde, texto navy subrayado en `#0090FF`. Para acciones secundarias.
  - Modificador `.boton--flecha`: etiqueta a la izquierda (padding 24px) y un circulo con flecha a la derecha (padding 6px), componente `<CirculoFlecha>`. En el primario el circulo es navy con flecha amarilla (48px en el CTA grande de 64px, 32px en botones bajos); en el oscuro, amarillo con flecha navy. El circulo navy con icono amarillo (`.circulo-navy`) es el unico uso del amarillo como trazo, siempre sobre navy.
  - Area tactil minima 48px (44px como piso absoluto) y contraste AA en todos.
- **Boton de deslizar (v2.9.0)**: `<BotonDeslizar>` (`src/components/ui/boton-deslizar.tsx`, estilos `.deslizar` en `globals.css`). **Regla: solo para la accion principal de una pantalla y para acciones que no se pueden deshacer** (hoy "Escanear QR" del Inicio; despues "Canjear Beats"). Los botones secundarios ("Ver historial", "Cómo ganar") son de toque, con `<CirculoFlecha>`: deslizar todo cansa y le quita valor al gesto.
  - **Excepcion (v2.10.0), solo en la bienvenida**: "Ya tengo cuenta" tambien se desliza, en una version mas angosta (228px, centrada) y del mismo alto que "Registrarme" (ancho completo), por decision de diseño de Isra. En el resto de la app la regla sigue igual.
  - Pildora de 64px con el circulo de 48px a la izquierda (8px de margen). El circulo se arrastra con Pointer Events (`setPointerCapture`, `touch-action: none` solo en el circulo). Mientras arrastra, la etiqueta se desvanece y un tinte se llena detras. Soltado pasado el 82% del recorrido: completa, vibra 18ms si se puede (en `try/catch`), ejecuta la accion y regresa. Antes del 82%: regresa con rebote y no hace nada. Si se cancela el puntero, regresa.
  - Nadie depende del gesto: un toque en el circulo o en la etiqueta, y Enter o Espacio con el circulo enfocado, tambien activan. El circulo es un `<button>` con nombre accesible ("Escanear QR. Desliza o toca para abrir el escáner.") y foco visible azul; no hay un `<a>` arrastrable adentro. Con `href` hace `router.prefetch` al montar.
  - Destello suave sobre la etiqueta solo con `prefers-reduced-motion: no-preference`; con reduced-motion, sin destello y regreso sin rebote (el arrastre sigue).
  - **Variantes de vidrio (v2.10.0)**: `vidrio-amarillo` y `vidrio-blanco`. El control lleva la clase central `.vidrio` (filtro, borde, sombra, reflejo y canto especular) y el modificador solo cambia las variables de tinte, como `.vidrio-barra` y `.vidrio-hoja`; ningun componente escribe `backdrop-filter`. `vidrio-amarillo`: tinte amarillo de la paleta `rgba(253,251,5,.92)` -> `.82`, etiqueta navy (14.4:1 en el peor caso de la bienvenida), circulo navy con flecha amarilla; sin soporte de `backdrop-filter` pasa a amarillo al 96% y con `prefers-reduced-transparency` a amarillo solido. `vidrio-blanco`: el tinte estandar (.62 -> .48), etiqueta navy (15.7:1), circulo navy con flecha blanca. Sin `overflow: hidden` (recortaria el canto). Sobre crema liso el vidrio se ve como un boton suave con borde brillante, reflejo y sombra, sin desenfoque visible: aceptado, y no se agregan fondos de color para forzarlo.
  - El recorrido del circulo y el umbral del 82% se miden sobre el ancho real del control (`clientWidth`), asi que funcionan igual en el boton angosto.
  - Variantes de paleta: amarillo con circulo navy y flecha amarilla (`.circulo-navy`); navy con circulo amarillo y flecha navy; blanco con borde navy al 16% y circulo navy. Tintes: navy al 10%, blanco al 12% y azul al 10%.
- **Cards**: border-radius 16px, padding 16px, superficie blanca `#FFFFFF` sobre el crema (clase `.superficie` / `.tarjeta`). El vidrio queda para la barra, las hojas y una pieza destacada sobre el cielo (ver "Liquid glass").
- **Bottom navigation (menu inferior)**: pildora flotante de vidrio (`.vidrio-barra`, ver "Menu inferior flotante" abajo). 5 pestañas maximo, todas con icono y etiqueta. Una pestaña cuya fase no ha llegado se muestra apagada y sin enlace, nunca se omite.
- **Bottom sheets**: border-radius 24px top, vidrio (`.vidrio-hoja`, tinte 0.85), handle bar centrado, sobre un velo navy al 30% sin desenfoque. Se montan en un portal sobre `<body>`, para que ningun contexto de apilamiento (el `<main>` `isolate` del Inicio) deje la barra por encima del velo. **Variante aviso (v2.7.0)**: blanca y opaca, radio 28px arriba, titulo en Anton mayusculas 24px y una X en un circulo `#F5F7FA` de 40px (area tactil de 48px). Mismo comportamiento: foco atrapado, Escape, velo, bloqueo del scroll y sin animacion con `prefers-reduced-motion`. Es opaca porque en el Inicio ya hay dos vidrios grandes.
- **Inputs**: border-radius 12px, borde 1px `rgba(0,0,0,0.12)`, fondo `#F5F7FA`, altura 48px, texto `#1A2332`, placeholder `#9CA3AF`.
- **Barras de progreso**: fondo `#F5F7FA` o `rgba(0,0,0,0.08)`, fill `#0090FF`, border-radius full (pill), altura 8px.
- **Badges de Beats**: fondo `#FDFB05`, texto `#1A2332`, border-radius full, DM Sans 700.
- **Toast/Snackbar**: fondo `#FFFFFF` con sombra, borde izquierdo 3px color semantico (exito/error/alerta), border-radius 12px.

### Liquid glass (v2.5.0)

Pedido explicito del cliente, con la barra inferior de Facebook iOS y de BanescoMovil como referencia. Vidrio CLARO, en CSS puro: sin WebGL, sin html-to-image y sin filtros SVG de refraccion (no funcionan en Safari iOS y pesan). La "refraccion" se aproxima con desenfoque + saturacion + brillo, el reflejo del tercio superior y el canto iluminado. La receta vive en un solo lugar, `globals.css`, y ningun componente escribe un `backdrop-filter` propio (lo vigila una prueba).

- **Clases**: `.vidrio` (piezas sobre el cielo, el degradado o una imagen: tarjeta de Beats del Inicio y de Beats, titulo del onboarding, capsula de puntos del banner y, desde la v2.10.0, los dos botones de deslizar de la bienvenida; la card de vidrio de la bienvenida se quito en la v2.10.0), `.vidrio-barra` (menu inferior), `.vidrio-hoja` (hojas inferiores).
- **Variables compartidas**: `--vidrio-tinte-arriba` / `--vidrio-tinte-abajo` (fondo en degradado vertical), `--vidrio-filtro: blur(24px) saturate(200%) brightness(1.04)` (con y sin `-webkit-`), `--vidrio-borde: rgba(255,255,255,.75)`, `--vidrio-sombra` (`inset 0 1.5px 0 rgba(255,255,255,.95)`, `inset 0 -1px 0 rgba(26,35,50,.06)`, `0 10px 30px rgba(26,35,50,.14)`, `0 2px 6px rgba(26,35,50,.08)`) y `--vidrio-texto-tenue` (desde la v2.7.0 apunta al gris secundario `#565E6D`).
- **Reflejo**: `::before` con degradado blanco que se apaga en el tercio superior, por debajo del contenido; `::after` con el aro especular de 1px recortado por mascara.
- **Opacidades** (minimo que da AA 4.5:1 en el peor caso):
  - `.vidrio`: 0.62 -> 0.48. Va sobre el cielo del onboarding, el degradado de marca o el banner; el peor caso es el pixel mas oscuro de lo que tiene detras (se mide en pantalla).
  - `.vidrio-barra` y `.vidrio-hoja`: 0.85 (v2.7.0). Debajo puede pasar cualquier cosa: se calcula sobre negro puro. Con el gris de la paleta `#565E6D` el minimo es 0.85 (antes 0.77, con un gris `#4A5160` que no era de la paleta).
- **Texto sobre vidrio**: navy `#1A2332` o el gris `#565E6D` (v2.7.0; antes `#4A5160`). Si un tinte no da AA, se sube la opacidad del vidrio, no se cambia el color.
- **Que haya algo detras**: el vidrio solo se nota sobre color o textura. Los puntos del banner van en una capsula de vidrio sobre la imagen; el contenido pasa por debajo de la barra; el velo de las hojas es navy al 30%, translucido.
- **Limite**: como mucho dos capas GRANDES con desenfoque visibles a la vez. Los controles chicos (menos de 8000 px², como la capsula de puntos) no cuentan: su costo es minimo.
- **Con una hoja abierta (v2.9.0)**: `HojaInferior` marca el `body` (`data-hoja-abierta`) y el vidrio de la pantalla de atras, que queda bajo el velo, apaga su desenfoque (`--vidrio-filtro: none`). Asi Beats (tarjeta + barra) y el Inicio no pasan de dos capas con la hoja (hoja + barra).
- **Ancestros**: ningun contenedor de un vidrio puede quedar como raiz del backdrop (opacidad, filtro, mascara o una animacion de opacidad que siga aplicada). La entrada de pantalla del `<main>` usa `animation-fill-mode: backwards` por eso: con `both`, el vidrio de la bienvenida y del onboarding no veia el cielo.
- **Respaldos**: sin soporte de `backdrop-filter`, tinte al 0.92; con `prefers-reduced-transparency: reduce`, blanco solido sin desenfoque.

### Menu inferior flotante (v2.4.0)

Patron de referencia: la barra inferior de Facebook iOS y de BanescoMovil.

- **Contenedor**: pildora fija, separada de los bordes: 12px a los lados y 8px sobre la zona segura del iPhone (`bottom: calc(env(safe-area-inset-bottom) + 8px)`), alto 64px, `border-radius: 9999px`. En pantallas anchas, maximo 480px y centrada. Usa la clase central `.vidrio-barra` (tinte 0.85 desde la v2.7.0, el minimo que da AA sobre negro con el gris `#565E6D`). El componente no define vidrio propio.
- **Pestañas**: repartidas en partes iguales; icono de 24px (SVG de trazo 1.75 con `currentColor`) y etiqueta visible debajo, DM Sans 11px, en TODAS las pestañas. Area tactil minima 44x44.
- **Iconos (v2.9.0)**: casa (Inicio), rayo (Pulso), marco de escaneo (Escanear), corazon con latido (Beats) y persona (Perfil). Hasta la v2.8.0 el rayo y el corazon estaban cruzados respecto a la referencia aprobada; se corrigieron sin cambiar el orden ni el estado apagado de Pulso.
- **Activa**: pildora de relleno amarillo `#FDFB05` detras del icono y la etiqueta; icono en variante rellena y texto navy `#1A2332` en negrita. Nunca amarillo como texto. **Inactivas**: icono de contorno y etiqueta en el gris `#565E6D` (v2.7.0).
- **Animacion**: la pildora amarilla se desliza (`transform: translateX`, 250ms ease-out) desde la pestaña anterior hasta la nueva. Con `prefers-reduced-motion: reduce`, cambio instantaneo.
- **Accesibilidad**: `<nav aria-label="Principal">`, `aria-current="page"` en la activa, foco visible con contorno navy de 2px separado 2px, etiquetas reales. Cada pestaña tiene previsto un hueco para insignia (punto o contador), que hoy no se muestra.
- **Visibilidad**: solo en las pantallas con pestañas (Inicio, Beats, Perfil). No aparece en bienvenida, registro, entrar, onboarding, escaner ni sin conexion; con una hoja o modal abierto queda debajo del velo.
- **Espacio inferior**: el contenido scrollea por debajo de la barra. Cada pantalla con barra reserva `alto de la barra + zona segura + 16px` con la clase `.espacio-barra`, calculada en un solo lugar a partir de `--alto-barra` (globals.css), de modo que el ultimo elemento se ve completo al llegar al final.

### Atmosfera

Base crema `#FFFFF5` con superficies blancas (v2.3.0). Referencia de atmosfera: apps tipo Cashea/Yummy — fondo claro, secciones bien segmentadas con cards y bloques de color.

- **Onboarding**: el cielo del branding (foto con velo blanco y tinte de marca en `soft-light`), a pantalla completa y fijo (`FondoApp`). Desde la v2.10.0 es la unica pantalla con cielo de foto.
- **Bienvenida (v2.10.0)**: el `.fondo-inicio` (degradado de marca sobre crema) y, en cada pantalla del carrusel, un campo de color arriba que se desvanece hacia el crema. La parte de abajo, donde van los botones, es crema: no se le pone fondo de color.
- **Inicio (v2.7.0)**: degradado de marca en CSS puro, sin foto ni desenfoque (`.fondo-inicio`): un radial amarillo `rgba(253,251,5,.34)` arriba a la derecha y uno azul `rgba(0,144,255,.22)` a la izquierda, sobre el crema, en una franja de 640px detras del contenido. Sus colores viven como variables en `:root` (`--inicio-amarillo`, `--inicio-azul`), no escritos en la regla. Ya no hay vertical de cielo ni tonos verdosos.
- **Beats (v2.8.0)**: el mismo `.fondo-inicio`, sin otra definicion: la pantalla pone el mismo div `aria-hidden` dentro de su `<main>` `relative isolate`.
- **Resto de la app**: crema solido. A tamaño completo y sin velo, el cielo se reserva para el splash screen.

### Bienvenida (v2.10.0)

Referencia aprobada por Isra (`referencia-v5`, 390 x 844). Ruta `/`, solo modo claro. Un carrusel horizontal de cuatro pantallas con `scroll-snap-type: x mandatory` y `scroll-snap-stop: always`, sin librerias y sin autoplay (`src/components/bienvenida/`).

**Orden y copy (fijos, en tuteo):**
1. "Programa UCV · 2026-2027" / "Tu pulso" **cuenta** / "Asiste a los eventos, suma Beats y canjéalos por recompensas." Arte: campo azul al 22%, circulos del pulso, ECG ancho y corazon con latido.
2. "Eventos" / "Vive cada" **evento** / "Cada evento del programa te suma Beats." Arte: campo amarillo pleno `#FDFB05`, estadio y parlante con corazones.
3. "Campus" / "Recorre" **la UCV** / "Busca los QR por el campus y escanéalos para sumar Beats." Arte: campo amarillo al 34%, mapa del campus y estatua.
4. "Recompensas" / "Enciende" **tu pulso** / "Canjea tus Beats por recompensas." Arte: campo amarillo al 34%, vitral y vela (corrida a la izquierda para que la llama no toque el logo).

**Estructura:** dentro de cada pantalla (se mueven con el swipe) van el logo, el arte y el texto. Fijos, fuera del carrusel, van los puntos, los dos botones y el pie. Asi el arrastre de un boton no mueve el carrusel ni el swipe activa un boton; el dock solo recibe toques en lo tocable.

**Medidas (a 390 x 844):** logo centrado a `max(54px, zona segura + 16px)` y 52px de alto; arte en un lienzo de 390 x 430 con el campo y las ilustraciones desvanecidos por mascara (62% y 60%); texto a 400 desde la v2.10.1 (antes 408; eyebrow 12px/600/tracking .2em/mayusculas/`#565E6D`; titular DM Sans 48px/1.02, 300 y la segunda linea 700 en bloque; sub 16px/1.4 `#565E6D`, max 290px); puntos a 608 (8px, activo 24px navy, inactivos navy al 22%); "Registrarme" a 634 (ancho completo, 64px); "Ya tengo cuenta" a 710 (228px, 64px, centrado); pie a `max(14px, zona segura de abajo + 6px)` del borde (v2.10.1; ver "Pie").

**Borde superior (v2.10.1):** el arte llega al borde fisico (edge-to-edge). El campo de color nace en `top: 0` y mide `430 (escalado) + env(safe-area-inset-top)`; la capa de ilustraciones se corre hacia abajo exactamente la zona segura (el lienzo de 390 x 430 no cambia); texto, puntos, botones y pie no se mueven. La raiz no lleva padding arriba. Encima del arte y debajo del logo va un velo crema (`.bienvenida-velo`: `rgba(255,255,245,.55)` -> transparente, alto zona segura + 16px, `pointer-events: none`) para que la hora y la bateria se lean.
- **Excepcion de ilustracion**: el arte de las laminas va edge-to-edge, hasta el borde fisico, por debajo de la barra de estado cuando iOS lo permite. Es arte (imagenes), asi que sigue la excepcion de color de las ilustraciones; los campos de color, la mascara y el velo siguen siendo paleta + alfa.
- **iPhone instalado (plan B)**: con `apple-mobile-web-app-status-bar-style: default` (no se cambia; `black-translucent` esta descartado) iOS pinta la barra de estado opaca aparte y la pagina empieza debajo, con zona segura 0: el contenido no puede pasar por debajo. Antes el campo de color empezaba justo en ese borde y se veia una linea dura bajo la banda crema. Ahora el campo y las ilustraciones nacen transparentes y llegan a opacos a los 56px (`mask-image`), asi el borde se funde con el crema de la barra. Con zona segura > 0 (barra translucida, o Chromium emulado) la misma regla deja el arte bajo la hora.

**Pie (v2.10.1):** "Un programa de" a 10px (`#565E6D`, con el letter-spacing final compensado con `margin-right: -0.18em` para que quede en el eje) sobre los logos de los aliados: The Flame Creative Lab a la izquierda y el sello de la UCV a la derecha, **en negro de una sola tinta por pedido de la diseñadora** (los archivos ya vienen en negro; no se recolorean por CSS ni con filtros). **MUN UCV se retiro por solicitud del cliente.** Flex centrado como un solo grupo en el eje de la pantalla (el mismo de los puntos y los botones), alineados al centro vertical; Flame sube 1px (`translateY(-1px)`) porque sus letras caen ~1.3px mas abajo que el centro visual del sello. Alturas: UCV 44px, Flame 28px (ancho proporcional); 28px entre ellos (20px a 320 de ancho o menos); como mucho el 85% del ancho, y si no cabe se escala el grupo entero. Con alto < 700px se oculta el rotulo y el grupo baja al 90%. Al menos 12px entre "Ya tengo cuenta" y el pie, que va a `max(14px, zona segura de abajo + 6px)` del borde. Como el sello de 44px hace crecer el pie 8px, en pantallas de 700px de alto o mas el bloque de texto sube 8px (`--reserva` 436 -> 444) para conservar los 6px entre el subtitulo y los puntos. Archivos en `public/marca/pie/` (`logo-flame-negro.webp`, `logo-ucv-negro.webp`; `LOGOS_PIE` en `src/lib/assets.ts`), con carga diferida.
- **Regla de los logos de terceros**: se escalan proporcionalmente y nada mas: nunca se deforman, recortan ni redibujan en la app. Son imagenes, asi que quedan fuera de la regla de paleta (como las ilustraciones).
- **Pendiente de aprobacion**: el sello de la UCV es una version redibujada (con IA, a partir del sello oficial), NO el archivo oficial; hay que pedir a la UCV (o a Kevin) el vector oficial o la aprobacion de este. Flame es un reescalado de una fuente pequeña, mejorable con el vector original.

**Reserva del logo LATIDOS (v2.10.1, pedido de la diseñadora de la marca):** `RESERVA_LOGO = 0.5 × altura del wordmark` (`src/components/bienvenida/pantallas.ts`). El logo mide 52px y el wordmark LATIDOS ocupa 121 de los 156px del archivo, asi que la reserva es ~20px, alrededor del rectangulo que envuelve el wordmark y su badge UCV, hacia arriba, abajo, izquierda y derecha. **Ningun elemento figurativo de las ilustraciones entra en esa zona**; las texturas de fondo difusas (anillos de ondas, lineas ECG que sangran, degradados) si pueden pasar por detras. Cada pieza del arte declara su papel en `pantallas.ts`:
- **Protagonista** (corazon, parlante, estatua, vela; uno por lamina): se escala al 90% con el pie anclado y, si aun asi entrara en la reserva, se achica lo justo para quedar debajo, centrado en el mismo eje. El corazon, el parlante y la vela, que van sobre la etiqueta del titular, terminan al menos 8px por encima de ella; la estatua queda a la derecha de la etiqueta y su base sigue bajo el texto.
- **Escena** (estadio, mural del campus, vitral): conserva su tamaño y solo baja lo necesario para salir de la reserva; su parte de abajo ya queda bajo el texto, desvanecida por la mascara.
- Todo se resuelve en CSS (`--arriba-libre` y `--abajo-libre` en `.bienvenida-lienzo > img`), sin medir en JavaScript, y vale para cualquier tamaño de pantalla. Como el logo no escala y el arte si, en pantallas bajas la franja libre se angosta: a 320 x 568 los protagonistas que van sobre la etiqueta quedan de ~48px de alto.
- El wordmark no se mueve: blanco con aro en la lamina 2 (`LOGO_AMARILLO`), azul con aro en las demas.

**Escala:** el arte se escala de forma uniforme con k = clamp(.5, min(ancho/390, (alto - 432)/430), 1.15), anclado arriba y centrado. Se hace en CSS con unidades de contenedor (sin JavaScript y sin saltos en la primera pintura). El texto y el dock guardan su tamaño y se anclan abajo; el arte absorbe la diferencia. Con alto < 700px el logo sube a `max(36px, zona segura + 16px)`, el titular baja a 42px y el pie queda solo con los logos; con alto < 600px (320 x 568) el titular baja a 38px y los dos botones a 56px. En 375 x 667 y 360 x 640 los dos botones y el pie se ven completos sin scroll.

**Accesibilidad:** el carrusel es una region con `aria-roledescription="carrusel"`, enfocable y navegable con las flechas. Cada pantalla es un `group` "N de 4"; las que no se ven van `inert` y `aria-hidden`, y solo la visible usa `h1` para su titular. Los puntos son botones "Ir a la pantalla N de 4" de 48px de alto, contiguos y sin solaparse; tocarlos desliza suave (instantaneo con `prefers-reduced-motion`). Orden de foco: carrusel, puntos, Registrarme, Ya tengo cuenta.

**Logo:** `public/marca/`, generado con `scripts/logo-variantes.py` desde el oficial (`recursos/marca/logo-latidos-ucv-oficial.png`). Todas las variantes llevan un aro blanco (circulo de 1.12 veces el radio del sello, detras del logo). Pantallas 1, 3 y 4: el oficial. Pantalla 2 (amarillo pleno): wordmark blanco, pedido de Isra; se lee por tamaño, no por contraste (~1.06:1). La constante `LOGO_AMARILLO` en `src/lib/assets.ts` lo pasa a navy (~15:1) sin tocar nada mas.

**Instalacion:** el aviso de Android flota arriba (no bloquea ni tapa los botones) y, cerrado, queda un boton de icono de 48px en la esquina superior derecha para reabrirlo.

**Carga:** las ilustraciones de la pantalla 1 van con prioridad y se precachean (service worker v11, v12 desde la v2.10.1, con el logo y las fuentes; los logos del pie no); las demas con carga diferida, y las de la pantalla 2 se precargan cuando el navegador esta libre. Todas con ancho y alto fijos y `alt=""`.

### Pantalla de carga de la app instalada (v2.10.1)

Maqueta aprobada por Isra (`referencia-splash-v2`, fuentes en `scripts/splash-fuentes/`): SOLO el icono de la app, centrado, sobre el fondo de marca. Sin wordmark ni texto. Es parecido al `.fondo-inicio` pero no igual, y no lo reutiliza.

- **Composicion** (W = ancho): crema `#FFFFF5`; encima, azul tenue arriba a la derecha `radial-gradient(80% 50% at 100% 0%, rgba(0,144,255,.18), transparente 70%)`, azul abajo a la izquierda `radial-gradient(90% 55% at 0% 100%, rgba(0,144,255,.34), transparente 70%)` y resplandor amarillo al centro `radial-gradient(120% 70% at 50% 50%, rgba(253,251,5,.30), transparente 62%)`. Icono a 0.33 W, esquinas del 22.5% del lado, sombra `0 16px 38px rgba(26,35,50,.18), 0 2px 6px rgba(26,35,50,.12)`, centrado y algo por encima del centro (flex centrado con `margin-top: -1%` del alto, como la maqueta).
- **Fase 1, antes de que exista el documento (iOS)**: iOS instalado ignora el splash del manifest y usa `apple-touch-startup-image`. Hay 14 imagenes (`public/splash/`, una por tamaño de iPhone en vertical, de SE 1 a 16 Pro Max y Air), registradas con `metadata.appleWebApp.startupImage` desde `src/lib/splash.ts` y generadas con `npm run splash` (`scripts/generar-splash.mjs`, sharp: fondo en SVG + icono). PNG de paleta con difuminado: 74 a 309 KB. No se precachean (~3 MB): iOS las guarda al instalar, asi que para ver unas nuevas hay que reinstalar la app.
- **Fase 2, entre el HTML y la primera pintura**: `#splash-inicial` (`SplashInicial`), primer hijo del `<body>`, renderizado en el servidor, con su CSS critico en linea en el `<head>` (`CSS_SPLASH` en `layout.tsx`) y `html, body` en crema. Solo se ve con `display-mode: standalone`; en el navegador queda en `display: none` y el icono (`/icons/icon-512.png`, ya precacheado) ni se pide. Al hidratar y pintar (doble `requestAnimationFrame`) se desvanece en 250ms y sale del DOM; con `prefers-reduced-motion`, sin fundido. Sin esperas artificiales. Tope de seguridad de 8s (por CSS y por JS). `pointer-events: none` siempre. No vuelve en las navegaciones internas.
- **Android**: genera su propio splash con el icono y `background_color` (`#FFFFF5`). El manifest no cambia.

### Inicio (v2.6.0, pulido en v2.7.0 y v2.9.0)

Referencias aprobadas por Isra (`referencia-inicio`, `referencia-v2` y `referencia-v3`, 390px). De arriba a abajo:

0. **Techo de nubes (v2.9.0)**: franja decorativa (`.techo-nubes`, `public/ilustraciones/techo-nubes.webp`, 860x375, ~96 KB) que nace en el borde superior de la pantalla, a todo el ancho, con las formas colgando y desvaneciendose hacia abajo con `mask-image` (opaca hasta el 60%, transparente al 100%). Alto `max(120px, calc(env(safe-area-inset-top, 0px) + 84px))`; la imagen mide 430px (o el ancho + 36px en pantallas mas anchas), corrida 18px a la izquierda y 6px hacia arriba. `aria-hidden`, `alt=""`, `pointer-events: none`, `fetchpriority="low"` y ancho y alto fijos: no compite con el LCP (que sigue siendo el banner). Solo en el Inicio. El `<main>` del Inicio ya no lleva padding arriba: la franja incluye la zona segura.
   - **iPhone instalado**: con `apple-mobile-web-app-status-bar-style: default` (no se cambia) iOS pinta una banda opaca para la barra de estado y la pagina empieza debajo; ahi `env(safe-area-inset-top)` vale 0 y la franja nace bajo esa banda, no detras de ella. Para que los hilos cuelguen desde el borde fisico haria falta `black-translucent`.
1. **Pildoras de cabecera** (108x58, `rounded-full`), debajo del techo.
   - Izquierda, **campana** (v2.7.0): pildora navy con icono de trazo blanco, `aria-label="Notificaciones"` y `aria-haspopup="dialog"`. Abre la hoja de notificaciones (variante aviso). Hoy es solo interfaz: `<ListaNotificaciones items={[]}>` muestra el estado vacio (circulo azul al 12% con la campana, "Sin notificaciones recientes" en DM Sans 600 y "Cuando haya novedades de Latidos, las verás aquí." en `#565E6D`). No hay tablas, RPC ni push.
   - Derecha, **avatar** (v2.7.0): pildora blanca translucida (blanco al 85%, borde blanco al 90%, sombra `0 6px 18px` navy al 8%) con el corazon con audifonos de la ilustradora a 46px de alto, `alt=""`, enlace a Perfil con `aria-label="Mi perfil"`. Es el mismo para todos: elegir avatar llega con el Perfil completo, sin columna en la base por ahora.
   - "Cómo gano Beats" ya no esta en el Inicio: vive en la cabecera de la pantalla de Beats.
2. **Saludo**: DM Sans a 40px y line-height 1.1, "Hola," en 300 y el nombre en 700 con "!". Con nombres de mas de 10 caracteres baja a 32px. El `h1` es solo para lector de pantalla.
3. **Tarjeta de Beats** (v2.7.0): vidrio (`.vidrio`, la clase central) sobre el degradado, radio 30px, padding 22/24, sin barra ni halo. Arriba "Beats acumulados" (14px, `#565E6D`) y, si hay, el chip amarillo "+N esta semana" (suma de los ultimos 7 dias calendario en hora de Caracas; no aparece si N <= 0 o si los datos no cargaron). Abajo el numero en Anton 68px navy, con el conteo animado de siempre. Es el enlace a Beats. Se acaba la excepcion de la v2.6.0 (tarjeta navy plana). El contraste AA se mide contra el pixel mas oscuro del degradado real detras de la tarjeta.
   - **Circulos del pulso (v2.9.0)**: `public/ilustraciones/circulos-pulso.webp` (480x480, ~106 KB) a la derecha, recortados por el borde: `right: -48px`, `top: -56px`, ancho `min(236px, 100% - 104px)` (en pantallas angostas se achica para que los anillos no crucen "Beats acumulados" ni un saldo de tres cifras; probado a 320, 360, 390 y 430), opacidad 0.92. Van en su propia capa recortada (`.circulos-pulso`: inset 0, radio heredado, overflow hidden) y no con overflow hidden en la tarjeta, que recortaria el canto especular del vidrio. El texto va encima (`z-index`); el chip queda sobre los anillos.
4. **Escanear QR (v2.9.0)**: `<BotonDeslizar>` amarillo de 64px, ancho completo, 17px bold; se desliza o se toca para abrir el escaner.
5. **Banners**: el carrusel de siempre.
6. **Acordeones**: una tarjeta blanca (radio 28px, borde navy al 8%) con "Actividad reciente" (abierta al entrar: hasta 3 movimientos y "Ver historial") y "Qué es Latidos" (cerrada: parrafo y las 3 fases en tarjetas crema con panel azul al 8% y chip "Próximamente" en `#F5F7FA`). El estado no se guarda.

Capas de vidrio grandes en el Inicio: la tarjeta de Beats y la barra (dos, el limite). Por eso la hoja de notificaciones es opaca.

Margenes laterales del Inicio: 16px (las demas pantallas siguen en 20px). No hay barra de progreso ni "proximo nivel": los niveles no estan definidos.

### Beats como dashboard (v2.8.0, tarjeta unificada en v2.9.0)

Referencia aprobada por Isra (`referencia-v2/beats-dashboard`, 390px). Solo front: todo sale del historial y del resumen que la pantalla ya trae (`useHistorialBeats`); no hay tablas ni RPC nuevas y no se pide nada mas a la red. Margenes laterales de 16px, como el Inicio. De arriba a abajo:

1. **Cabecera**: `h1` "Tus Beats" en DM Sans a 40px ("Tus" en 300, "Beats" en 700) y, a la derecha, la pildora navy de 108x58 con "?" (`aria-label="¿Cómo gano Beats?"`) que abre la hoja de como ganar. Es la misma pildora de ayuda de antes, restilizada; no hay otra.
2. **Tarjeta de Beats (v2.9.0)**: una sola pieza de vidrio (`.vidrio`, como la del Inicio; radio 30px, padding 22/24), region con nombre "Tu balance de Beats". Reemplaza al hero navy y a la tarjeta "Tu pulso" aparte de la v2.8.0. De arriba a abajo: "Beats acumulados" (14px, `#565E6D`) y el chip amarillo "+N esta semana" (mismo calculo semanal; no aparece si N <= 0; la cifra semanal vive solo ahi, ya no hay "+N Beats" duplicado); el saldo en Anton 68px navy (`ContadorBeatsVivo` variante `plano`, con el conteo animado y el anuncio en vivo de siempre); la linea de latido del cliente (`ecg-pulso.webp`, 640x218, decorativa con `alt=""` porque es arte de marca y no una grafica de los datos, con ancho y alto fijos); "Tu pulso · Últimos 7 días" (`h2` de 12px, 600, `#565E6D`); y, tras una linea navy al 10%, las tres metricas en Anton: Escaneos, Marcas y Días activos. La variante `navy` del contador y el token `texto-sobre-navy` se quitaron.
4. **Marcas**: `h2` "Marcas" (Anton mayusculas) con "Donde has sumado" a la derecha. Carrusel horizontal con snap de tarjetas de 150px (logo de la marca o su inicial en circulo azul al 12%, nombre, "N escaneos" y "+total" en Anton). Al final, la tarjeta punteada "Descubre más" / "Escanea una marca", que es un enlace a Escanear. Sin marcas, queda solo esa. La lista es enfocable (se mueve con las flechas) y Tab pasa al enlace y sigue de largo, sin trampa.
5. **Historial**: `h2` "Historial" y una sola tarjeta con un acordeon por dia (`h3`): icono de reloj, "Hoy" / "Ayer" / "Miércoles 23 sept", "N movimientos · +total" y el chevron en circulo navy. El dia mas reciente nace abierto. Se mantienen la carga de mas dias al llegar al final (`FinDeLista`), los lotes de 7 dias y el reintento. Filas: logo o inicial en circulo azul al 12% (40px), nombre (15px, 600), hora (13px gris) y "+N" en negrita a la derecha; la bienvenida va con un corazon navy en circulo amarillo y los demas movimientos de Latidos con el icono de la app. Las filas del Inicio usan el mismo componente.
6. **Estado inicial** (sin ningun escaneo): la explicacion desplegada y "Escanear", como siempre (spec §8.1).
7. **Cómo ganar**: `.boton-secundario .boton--flecha` con el circulo navy de 40px y flecha amarilla; abre la misma hoja que la pildora. Debajo, el recordatorio del canje en 13px gris.

**Criterio de calculo** (`src/lib/beats/dashboard.ts`, funciones puras con pruebas):
- **Semana**: hoy y los 6 dias anteriores, en dias locales de Caracas (`diaLocalDe`), igual que el chip del Inicio. El cambio de dia es a medianoche de Caracas, no del telefono.
- **Movimiento de marca**: un escaneo (`tipo = "escaneo"`) que trae su marca. La bienvenida, los regalos y los ajustes son de Latidos: suman al total y cuentan como dia activo, pero no son marca ni escaneo de marca.
- **Beats de la semana**: suma con signo de todos los movimientos de la semana.
- **Escaneos**: movimientos de marca de la semana. **Marcas**: marcas distintas entre ellos. **Días activos**: dias locales distintos de la semana con al menos un movimiento de cualquier tipo.
- **Carrusel**: los movimientos de marca de todo el historial cargado en pantalla (al abrir, los 7 dias con actividad mas recientes; crece al cargar mas), agrupados por el nombre actual de la marca, de la escaneada mas recientemente a la mas antigua. El primer lote siempre cubre la semana completa, asi que "Tu pulso" no depende de bajar.

Capas de vidrio (v2.9.0): la tarjeta de Beats y la barra, dos. Con la hoja de ayuda abierta, la tarjeta apaga su desenfoque (ver "Liquid glass"). Las demas tarjetas son blancas opacas. El gris `#565E6D` de la tarjeta se mide contra el pixel mas oscuro del degradado real.

### Acordeon (v2.6.0)

`src/components/ui/acordeon.tsx`. Desde la v2.8.0 puede ir controlado desde fuera (`abierto` + `alAlternar`), con encabezado `h3` (`nivel={3}`) y con un id de region fijo: asi lo usa el historial de Beats. Cabecera `<h2><button>` con icono en circulo azul al 12% de 44px (v2.7.0; antes un celeste fuera de paleta), titulo (16px bold), subtitulo (13px, `#565E6D`) y un circulo navy de 36px con chevron amarillo que gira 180° al abrir. `aria-expanded`, `aria-controls` y una region nombrada por el titulo; cerrada, la region va `inert` (fuera del foco y del arbol accesible), tambien en el HTML del servidor. Abre con transicion de alto de 250ms (`grid-template-rows` 0fr -> 1fr); sin transicion con `prefers-reduced-motion`. Las secciones de una misma tarjeta se separan con una linea fina.

### Firma visual

El momento memorable de la app es el contador de Beats: un numero grande en Anton. En el Inicio (v2.7.0) y en Beats (v2.9.0) va en navy sobre la tarjeta de vidrio. El amarillo `#FDFB05` no se usa como color del numero (no alcanza contraste sobre superficie clara): pasa a una barra de acento debajo del numero y a un halo radial detras que late despacio (se queda quieto con `prefers-reduced-motion`). Con animacion de incremento cuando se suman puntos. Es lo primero que el usuario ve en su pantalla principal. Se reconoce como el mismo numero en Inicio y en Beats por la tipografia (Anton 68px) y el chip de la semana, aunque cambie el fondo. Desde la v2.8.0 ninguna pantalla usa la barra de acento ni el halo (la variante `halo` de `ContadorBeatsVivo` queda en el codigo).

## 3. Tono y Copy

Hereda las reglas de la constitution web con adaptaciones para mobile:

- **Idioma**: espanol (Venezuela)
- **Registro**: mas cercano que la web. La app habla directo al usuario: "Sumaste 10 Beats", "Tu proxima jornada", "Dona y suma". Tuteo.
- **Voz en notificaciones**: directa y breve. "Nueva jornada de Pulso: utiles escolares. Dona y suma Beats." No "Querido usuario, le informamos que..."
- **Patrones prohibidos**: los mismos que la web. Ademas: no usar "Felicidades!" ni "Increible!" en confirmaciones. Ser concreto: "Donacion registrada. +10 Beats."
- **Microcopy**: cada pantalla tiene un estado vacio con texto que guia a la accion, no que se disculpa. "Tu primer escaneo aparecera aqui." NO "Lo sentimos, no hay datos disponibles."
- **CTAs mobile**: verbos en infinitivo, maximo 2 palabras. "Escanear QR", "Ver historial", "Donar", "Canjear".

## 4. Stack Tecnico

- **Framework**: Next.js 14+ (App Router) como PWA (Progressive Web App) — mismo stack que la web Latidos, un solo repo de componentes compartidos
- **Lenguaje**: TypeScript
- **Styling**: Tailwind CSS con config que mapea los tokens del design system de esta constitution
- **Backend/Auth**: Supabase (misma instancia que la web). PostgreSQL + Auth + Storage + Realtime + Edge Functions.
- **Empaquetado nativo**: Capacitor envuelve la misma PWA para publicar en App Store y Play Store cuando esten aprobadas. No es una reescritura — es la misma base de codigo con un contenedor nativo. Cuentas de desarrollador a nombre de Flame.
- **Instalacion**: la PWA se instala desde el navegador ("Agregar a pantalla de inicio" en iOS Safari, "Instalar app" en Android Chrome) y funciona igual de completa sin instalar, para no bloquear a quien solo quiere escanear un QR rapido.
- **Camara/QR**: Web API `getUserMedia` + libreria de lectura de QR (ej. `qr-scanner` o `zxing`) — funciona en el navegador sin plugin nativo, y sigue funcionando igual dentro del contenedor Capacitor.
- **Notificaciones push**: Web Push API (soportada en Android Chrome y en iOS Safari 16.4+ solo si la PWA esta instalada). Se reutiliza el mismo servicio cuando la app pase a Capacitor.
- **Mapas**: Google Maps Embed o Mapbox GL JS (web-first, sin SDK nativo).
- **Almacenamiento local**: localStorage / IndexedDB para cache de sesion y datos offline.
- **Imagenes**: Supabase Storage para fotos de jornadas, logos de marcas, banners. Carga lazy con thumbnails.

### Ruta a las tiendas

- **15 sept 2026**: lanzamiento como PWA instalable, disponible para Android e iOS por igual desde el navegador. No requiere aprobacion de ninguna tienda.
- **En paralelo**: se envian las solicitudes a Google Play y App Store. Google suele aprobar en dias; Apple puede tomar 1-2 semanas y es mas estricto en la primera revision.
- **Cuando cada tienda aprueba**: se publica la misma PWA empaquetada con Capacitor, sin cambio de cuenta ni perdida de datos para quien ya la use instalada desde el navegador (misma base de Supabase).
- No se ofrece APK de Android como via de instalacion — la PWA cubre Android e iOS por igual y evita el problema de "instalar apps de origen desconocido".

### Integraciones obligatorias

- **Supabase Auth**: registro y login con email/password. Tipos de usuario: estudiante_ucv, egresado, externo.
- **Supabase Realtime**: actualizacion en vivo del balance y el historial de Beats (incluido cuando un operador le suma Beats al usuario), barras de progreso de insumos, notificaciones de nuevas jornadas.
- **QR Scanner**: lectura de QR de marcas y de centros de acopio. Validacion contra Supabase en tiempo real (limites de escaneo, una vez por dia por marca).
- **QR Generator**: generacion de QR unico por usuario para que el operador del punto de control lo escanee al recibir donacion.
- **Notificaciones push**: avisos de nuevas jornadas, artistas confirmados, recordatorios de actividades, Beats ganados sin que el usuario este en la app (ej. prediccion acertada). No por cada escaneo.
- **WhatsApp redirect**: para flujo de compra de merch y contacto general. wa.me con mensaje predefinido.

### Integraciones opcionales (no v1 o por fase)

- **Predicciones deportivas** (fase Festival): modulo interno de parlay con Beats, sin API externa de casas de apuestas. La seccion se vende como espacio patrocinado.
- **Pasarela de pago**: si se decide cobrar entradas o merch directamente. Por ahora es flujo manual via WhatsApp.
- **Deep linking**: para que links en redes sociales o la web abran directamente una seccion de la app.
- **Analytics**: Mixpanel, Amplitude o similar para tracking de eventos in-app. No obligatorio en v1.

## 5. Sistema de Beats

### Que son los Beats

Beats es la moneda interna de Latidos. Se acumulan por acciones y se canjean por recompensas. El nombre viene de "latidos" (heartbeats). No tienen valor monetario.

### Como se ganan Beats

| Accion | Beats | Fase | Notas |
|--------|-------|------|-------|
| Donar insumos en centro de acopio | 10 (configurable) | Pulso | Operador escanea QR del usuario |
| Escanear QR de marca en stand | 5 (configurable) | Empuje, Festival | Limite: 1 vez por marca por dia |
| Participar en dinamica de marca | Variable | Empuje, Festival | Admin define Beats por dinamica |
| Asistir a actividad | Variable | Todas | Admin define por actividad |
| Participar en voluntariado | 15 (configurable) | Pulso, Empuje | Validado por operador |
| Bienvenida a Latidos | 5 (configurable) | Todas | Una sola vez por cuenta, se otorga al confirmar el correo. Tambien se otorga a las cuentas creadas antes de esta regla |
| Acertar prediccion deportiva (simple) | Variable | Festival | Predecir equipo ganador de un partido |
| Acertar prediccion deportiva (parlay) | Variable (multiplicado) | Festival | Predecir multiples resultados: ganador + goles + tarjetas. A mas aciertos, mas Beats |

Todos los valores de Beats son configurables por el admin desde backoffice. La tabla de arriba son valores por defecto sugeridos.

### Como se gastan Beats

| Recompensa | Beats requeridos | Notas |
|------------|-----------------|-------|
| Entrada concierto — zona general | 1.000 (configurable) | QR generado automaticamente |
| Entrada concierto — zona media | 3.000 (configurable) | QR generado automaticamente |
| Entrada concierto — frente de tarima | 5.000 (configurable) | QR generado automaticamente |
| Merch Latidos (bolso, gorra, etc.) | Variable | Segun item y alianza de marca |
| Donar merch | Mismo costo que el item | El item se destina a la comunidad |
| Curso universitario (oratoria, etc.) | Variable | Convenio con la universidad |
| Apostar en prediccion deportiva | Variable | Se apuestan Beats, no dinero |

### Reglas del sistema

- Los Beats no expiran durante el programa (sept 2026 — marzo 2027).
- Los Beats no se pueden transferir entre usuarios.
- Los Beats no tienen valor monetario. No se compran ni se venden.
- El admin puede ajustar el costo de cualquier recompensa en cualquier momento.
- Al canjear Beats se descuentan del balance. La transaccion queda registrada.
- Si un usuario dona Beats (via "donar merch"), los Beats se descuentan y el item se marca como donado.
- **El saldo siempre coincide con la suma del historial.** Nada cambia el balance sin dejar un movimiento con nombre (escaneo, bienvenida, donacion, canje, etc.). Si hay que corregir o regalar Beats, se crea un movimiento con nombre ("Ajuste Latidos", "Regalo Latidos"); nunca se edita el balance a mano.
- **Lo que ya tiene movimientos no se borra, se desactiva.** Un QR o una marca con escaneos se desactiva; borrarlo borraria filas del historial sin bajar el saldo.
- **Los Beats de cada movimiento quedan fijos** al momento en que ocurrio, aunque el admin cambie despues el valor del QR o la accion.
- **El historial muestra siempre el nombre y logo actuales de la marca**, aunque el QR este desactivado. Si la marca no tiene logo, se muestra un circulo con su inicial.
- **Balance e historial se actualizan en vivo**: si cambian mientras el usuario mira la pantalla (por ejemplo, cuando un operador le suma Beats por una donacion), el numero sube con la animacion del contador y aparece el movimiento nuevo.
- **El dia de un movimiento es el dia calendario en hora de Caracas**, el mismo corte de medianoche del limite diario de escaneo.
- **Sumar Beats por algo que el usuario acaba de hacer** (escanear, donar frente a un operador, la bienvenida) **no dispara notificacion push**; la confirmacion es en pantalla. El push queda para Beats que llegan sin que el usuario este mirando, como una prediccion acertada (seccion 7).

## 6. Sistema de QR

### Tipos de QR

1. **QR de marca**: generado por el admin para cada patrocinante. Lo distribuyen fisicamente (stickers, fichas, habladores de mesa/mostrador, stands). Al escanearlo, el usuario suma Beats de esa marca.
   - El valor de Beats no va impreso ni codificado en el QR — se resuelve del lado del servidor al momento del escaneo. Esto permite al admin subir o bajar los Beats de un QR ya impreso sin reimprimir el material fisico (ej: subirle Beats al QR de una marca por una semana para generar una campaña de visitas puntual).
   - Limite de escaneos totales configurable (ej: maximo 500 escaneos)
   - Una persona solo puede escanear el QR de una marca una vez al dia
   - El admin puede desactivar/reactivar QR (ej: cancelar los pre-evento y crear nuevos para el festival)

2. **QR de usuario**: cada usuario registrado tiene un QR unico en su perfil. Lo muestra al operador del centro de acopio o stand para que valide la donacion/participacion y le sume Beats.

3. **QR de acceso al concierto**: generado automaticamente cuando el usuario canjea Beats por entrada. Contiene su nombre, tipo de zona y un hash de validacion. Se escanea en la puerta del concierto.

### Flujo de escaneo

**Usuario escanea QR de marca:**
1. Abre el scanner en la app
2. Enfoca el QR de la marca
3. La app valida contra Supabase: QR activo, no excede limite, usuario no lo escaneo hoy
4. Si es valido: animacion de Beats sumados, registro en base de datos
5. Si no es valido: mensaje claro del motivo (ya escaneado hoy, QR expirado, limite alcanzado)

**Operador escanea QR de usuario (donacion):**
1. El usuario muestra su QR desde el perfil
2. El operador lo escanea con su dispositivo (misma app, modo operador)
3. Selecciona tipo de accion (donacion, voluntariado, asistencia)
4. Confirma. Beats se suman al usuario en tiempo real.

## 7. Torneos Deportivos y Predicciones

### Contexto

Los torneos son el componente competitivo del Festival. Kevin no tenia claro como integrarlos a la app hasta que surgio la idea de las predicciones con Beats. El modulo deportivo es lo que alimenta las predicciones y le da sentido al parlay.

### Estructura de los torneos

- **Deportes**: futbol (hombres) y voleibol (mujeres)
- **Equipos por deporte**: ~12, distribuidos entre equipos de la UCV (~6) y equipos invitados de otras universidades (~6: Metro, Catolica, Montevideo, etc.)
- **Canchas**: 3 canchas en PINECO, recuperadas como parte de la alianza con el programa
- **Formato**: definido por el admin (grupos + eliminatoria, round-robin, etc.). La app no impone formato, lo consume.
- **Estrategia de convocatoria**: influencers que estudian en otras universidades arman equipos y generan FOMO de competencia contra la UCV

### Datos del modulo (backoffice)

El admin carga y gestiona desde backoffice:
- Torneos: nombre, deporte, fecha inicio/fin
- Equipos: nombre, universidad, logo/foto, jugadores (opcional)
- Fixture/calendario: partidos con fecha, hora, cancha, equipo local vs visitante
- Resultados: goles/sets, tarjetas (futbol), resultado final. Se cargan post-partido.
- Tabla de posiciones: calculada automaticamente a partir de resultados cargados

### Pantalla de Torneos (usuario)

Accesible desde Inicio durante el Festival. Muestra:
- Selector de deporte (futbol / voleibol)
- Tabla de posiciones actualizada
- Calendario de partidos: proximos y pasados con resultados
- Detalle de partido: equipos, hora, cancha, resultado (si ya se jugo)

### Predicciones / Parlay de Beats

Las predicciones son internas (no usan API de casas de apuestas). La seccion se puede vender como espacio patrocinado a una marca tipo Apuestas Royal — ellos ponen su branding, pero la logica es de Latidos.

**Tipos de prediccion:**
- **Simple**: quien gana el partido (equipo A, equipo B, empate). Cuesta X Beats, paga Y si acierta.
- **Parlay**: multiples resultados en un solo ticket (ganador + cantidad de goles + tarjetas amarillas). A mas condiciones acertadas, mayor multiplicador de Beats.

**Flujo:**
1. El usuario entra a la seccion de predicciones
2. Ve los partidos disponibles para predecir (solo los que el admin habilita)
3. Selecciona tipo de prediccion y hace su apuesta de Beats
4. Los Beats se descuentan de su balance al confirmar
5. Cuando el admin carga el resultado del partido, el sistema calcula automaticamente quien acerto
6. Los Beats ganados se suman al balance con notificacion push

**Reglas:**
- Solo se pueden hacer predicciones antes del inicio del partido (deadline configurable por el admin)
- El admin define cuantos Beats cuesta cada tipo de prediccion y los multiplicadores de ganancia
- Un usuario puede hacer una sola prediccion por partido (no puede cubrir todas las opciones)
- Las predicciones no se cancelan una vez confirmadas
- El calculo de ganadores es automatico basado en los resultados que el admin carga

### Backoffice deportivo

- Crear/editar torneos, equipos, partidos
- Cargar resultados post-partido (esto dispara el calculo de predicciones)
- Habilitar/deshabilitar partidos para predicciones
- Configurar costos de prediccion y multiplicadores
- Ver estadisticas: total de Beats apostados por partido, predicciones acertadas, distribucion de apuestas

## 8. Estructura de la App

### Navegacion principal (bottom tabs)

1. **Inicio**: resumen del programa, proxima jornada de Pulso, actividades recientes, banners publicitarios
2. **Pulso**: jornada activa con insumos y progreso, centros de acopio, cronologia de jornadas pasadas
3. **Escanear** (tab central destacado): abre la camara para escanear QR de marcas
4. **Beats**: dashboard (v2.8.0): balance de Beats, "Tu pulso" de la semana, marcas donde se ha sumado, historial de movimientos agrupado por dia, explicacion de como ganar Beats y en que se cambian, opciones de canje (Fase 3)
5. **Perfil**: datos del usuario, QR personal, configuracion, cerrar sesion

### Pantallas adicionales (no en bottom tabs)

- **Mapa interactivo** (Festival): accesible desde Inicio o tab temporal. Muestra los espacios del evento con marcadores: Plaza Cubierta, estacionamiento de Mecanica, canchas PINECO, zona de concierto.
- **Feed de fotos** (Festival): galeria tipo Pinterest con fotos del evento. Banners publicitarios intercalados.
- **Torneos deportivos** (Festival): selector de deporte, tabla de posiciones, calendario/fixture, detalle de partido con resultado.
- **Predicciones / Parlay** (Festival): partidos disponibles para predecir, interfaz para apostar Beats (simple o parlay), historial de predicciones con resultados.
- **Merch / Tienda**: catalogo de items canjeables por Beats o comprables via WhatsApp.
- **Detalle de jornada**: vista de una jornada de Pulso pasada con fotos, recap, participantes.
- **Notificaciones**: historial de notificaciones push recibidas.

### Modo operador

No es una app separada. Es un modo dentro de la misma app activado por rol (el admin asigna el rol "operador" al usuario desde backoffice). En modo operador aparece:
- Scanner para leer QR de usuarios
- Selector de tipo de accion (donacion, voluntariado, asistencia)
- Confirmacion y registro

## 9. Reglas de Calidad

- **Testing pre-lanzamiento**: equipo de minimo 3 personas (Flame + dev) prueba todos los flujos antes de publicar. Registro, escaneo QR, acumulacion de Beats, canje, notificaciones, modo operador. Cada variante posible documentada y probada.
- **Soft launch**: primera version publica (PWA, 15 sept) con registro + perfil + informacion del programa + scanner de QR de marca + acumulacion de Beats + banners. Pulso completo (insumos, centros de acopio, cronologia) y modo operador llegan en la Fase 2. Funcionalidades completas se activan despues de validar estabilidad.
- **Performance**: la app debe cargar en menos de 3 segundos en conexion 4G. Imagenes lazy-loaded con thumbnails. Listas virtualizadas para cronologias largas.
- **Offline**: la app debe mostrar datos cacheados si no hay conexion. Las acciones que requieren red (escaneo QR, canje) muestran mensaje claro, no error generico.
- **Seguridad**: RLS en Supabase para que un usuario no vea datos de otro. Tokens de sesion con expiracion. El QR de usuario contiene un hash, no datos personales en texto plano. Validacion server-side de todas las transacciones de Beats (el cliente no puede modificar su balance).
- **Accesibilidad**: touch targets minimo 48px, contraste AA en todos los textos, labels en todos los inputs, soporte de screen reader basico.

## 10. Entrega por Fases

### Fase 1 — Soft launch (15 septiembre 2026)

Acordado con Kevin el 26 de agosto: prioriza registro, informacion del programa, QR y Beats sobre Pulso completo. Se entrega como PWA instalable (Android e iOS por igual), sin esperar aprobacion de tiendas.

- Registro y perfil de usuario (nombre, apellido, cedula, telefono, correo, tipo)
- QR personal del usuario
- Informacion del programa dentro de la app (que es Latidos, las tres fases)
- Scanner de QR de marca — el usuario escanea y suma Beats
- Sistema de Beats basico: acumulacion + balance visible
- Banners publicitarios en pantalla de inicio
- Backoffice: generador de QR de marcas con Beats configurables (y reconfigurables sin reimprimir), gestion de usuarios, gestion de banners
- Periodo de pruebas con equipo de Flame + dev antes de soltar al publico (duracion no estimada, depende de los hallazgos)
- Solicitud a Google Play y App Store enviada en paralelo

### Fase 2 — Empuje (noviembre 2026)
- Modulo Pulso completo: jornada activa, insumos con progreso, centros de acopio
- Modo operador para centros de acopio (donaciones)
- QR de marcas con limites y validacion avanzada (una vez al dia, limite total)
- Cronologia de jornadas pasadas con fotos y recap
- Notificaciones push segmentadas
- Publicacion en tiendas cuando Google/Apple aprueben (misma app, mismos datos, sin migracion)

### Fase 3 — Festival (febrero 2027)
- Mapa interactivo con todos los espacios del evento
- Feed de fotos con banners intercalados
- Modulo de torneos deportivos: fixture, equipos, resultados, tabla de posiciones
- Predicciones / parlay de Beats: prediccion simple y parlay con multiplicadores, calculo automatico de ganadores
- Backoffice deportivo: crear torneos, cargar resultados, configurar predicciones
- Tienda de merch (canje de Beats + compra via WhatsApp)
- Canje de Beats por entrada al concierto con QR de acceso por zona
- Donacion de merch

## 11. Fuera de Alcance Global

- Pasarela de pagos integrada (merch y entradas se manejan via WhatsApp o canje de Beats)
- Reconocimiento facial (add-on cotizable aparte, no incluido en los $7.500)
- Integracion con API de casas de apuestas (predicciones son internas con Beats)
- Chat en vivo o chatbot dentro de la app
- Streaming de video del concierto
- Multiidioma (solo espanol)
- Login con redes sociales (solo email/password en v1)
- Hosting: el costo de servidor (~$200-300/año) es del cliente, no esta incluido en el desarrollo
- Cuentas de App Store ($99/año) y Play Store ($25 una vez) son del cliente (a nombre de Flame)
- APK de Android como via de distribucion — se descarto a favor de PWA instalable, que cubre Android e iOS por igual sin pedir al usuario que habilite "origenes desconocidos"
