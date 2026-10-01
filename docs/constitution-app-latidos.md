---
tipo: constitution
producto: Latidos App
slug: latidos-app
version: 2.4.0
fecha-creacion: 2026-08-20
ultima-modificacion: 2026-10-01
<!-- v2.0.0 | 2026-08-26 | Cambio de stack a PWA (Next.js + Capacitor) para lanzar en Android e iOS el 15 sept sin esperar aprobacion de tiendas. Fase 1 reordenada segun acuerdo con Kevin: prioriza registro + QR + Beats sobre Pulso completo. Beats por QR de marca ahora configurables en cualquier momento por el admin. -->
<!-- v2.1.0 | 2026-09-10 | Cambio de design system: base clara/blanca en vez de fondo oscuro solido. El cliente pidio explicitamente alejarse del fondo oscuro por no ir con la tematica festiva del evento. Referencia de atmosfera: apps tipo Cashea/Yummy. La paleta de marca (amarillo/azul) y la tipografia no cambian, solo la base y los tonos de superficie. Pantallas ya construidas (bienvenida, registro, onboarding, Inicio) requieren pasada de restyle. -->
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

- **Botones primarios**: fondo `#FDFB05`, texto `#1A2332`, border-radius 12px, altura minima 48px (touch target), font-weight 500.
- **Botones secundarios**: borde 1px `#0090FF`, texto navy `#1A2332`, fondo blanco.
- **Botones ghost**: sin borde, texto navy `#1A2332` subrayado en `#0090FF`, fondo transparente. Para acciones secundarias.
- **Cards**: border-radius 16px, padding 16px, superficie blanca `#FFFFFF` sobre el crema (clase `.superficie` / `.tarjeta`). El vidrio queda para la barra, las hojas y una pieza destacada sobre el cielo (ver "Liquid glass").
- **Bottom navigation (menu inferior)**: pildora flotante de vidrio (`.vidrio-barra`, ver "Menu inferior flotante" abajo). 5 pestañas maximo, todas con icono y etiqueta. Una pestaña cuya fase no ha llegado se muestra apagada y sin enlace, nunca se omite.
- **Bottom sheets**: border-radius 24px top, vidrio casi opaco (`.vidrio-hoja`, blanco al 94%), handle bar centrado, sobre un velo navy al 40% sin desenfoque.
- **Inputs**: border-radius 12px, borde 1px `rgba(0,0,0,0.12)`, fondo `#F5F7FA`, altura 48px, texto `#1A2332`, placeholder `#9CA3AF`.
- **Barras de progreso**: fondo `#F5F7FA` o `rgba(0,0,0,0.08)`, fill `#0090FF`, border-radius full (pill), altura 8px.
- **Badges de Beats**: fondo `#FDFB05`, texto `#1A2332`, border-radius full, DM Sans 700.
- **Toast/Snackbar**: fondo `#FFFFFF` con sombra, borde izquierdo 3px color semantico (exito/error/alerta), border-radius 12px.

### Liquid glass (v2.3.0)

Pedido explicito del cliente. Vidrio CLARO, en CSS puro: sin WebGL, sin html-to-image y sin filtros SVG de refraccion (no funcionan en Safari iOS y pesan). La receta vive en un solo lugar, `globals.css`, y ningun componente escribe un `backdrop-filter` propio (lo vigila una prueba).

- **Clases**: `.vidrio` (pieza suelta sobre el cielo: contador de Inicio, card de la bienvenida, titulo del onboarding), `.vidrio-barra` (barra de tabs), `.vidrio-hoja` (hojas inferiores).
- **Receta**: fondo `rgba(255,255,255,.55)`; `backdrop-filter: blur(20px) saturate(180%)` (y `-webkit-`); borde `1px solid rgba(255,255,255,.65)`; sombras `inset 0 1px 0 rgba(255,255,255,.8)`, `inset 0 -1px 0 rgba(26,35,50,.04)`, `0 8px 32px rgba(26,35,50,.10)`, `0 1px 3px rgba(26,35,50,.06)`.
- **Brillo especular**: `::before` con degradado blanco a transparente y mascara, de modo que solo se ve el aro de 1px.
- **Hojas y barra**: misma receta con el fondo mas opaco: las hojas al 94% (texto largo sobre un velo oscuro) y la barra al 85% (etiquetas de 11px que deben pasar AA aunque debajo pase contenido oscuro).
- **Limite**: como mucho dos capas con desenfoque visibles a la vez. Por eso las tarjetas de contenido son blancas y no vidrio.
- **Respaldos**: sin soporte de `backdrop-filter`, fondo `rgba(255,255,255,.92)`; con `prefers-reduced-transparency: reduce`, blanco solido sin desenfoque.
- **Legibilidad**: el texto sobre vidrio cumple AA contra el crema y contra el pixel mas oscuro del cielo del header (lo verifica una prueba).

### Menu inferior flotante (v2.4.0)

Patron de referencia: la barra inferior de Facebook iOS y de BanescoMovil.

- **Contenedor**: pildora fija, separada de los bordes: 12px a los lados y 8px sobre la zona segura del iPhone (`bottom: calc(env(safe-area-inset-bottom) + 8px)`), alto 64px, `border-radius: 9999px`. En pantallas anchas, maximo 480px y centrada. Usa la clase central `.vidrio-barra`, con el fondo al 85% para que las etiquetas pasen AA aunque debajo pase contenido oscuro. El componente no define vidrio propio.
- **Pestañas**: repartidas en partes iguales; icono de 24px (SVG de trazo 1.75 con `currentColor`) y etiqueta visible debajo, DM Sans 11px, en TODAS las pestañas. Area tactil minima 44x44.
- **Activa**: pildora de relleno amarillo `#FDFB05` detras del icono y la etiqueta; icono en variante rellena y texto navy `#1A2332` en negrita. Nunca amarillo como texto. **Inactivas**: icono de contorno y etiqueta en `#565E6D`.
- **Animacion**: la pildora amarilla se desliza (`transform: translateX`, 250ms ease-out) desde la pestaña anterior hasta la nueva. Con `prefers-reduced-motion: reduce`, cambio instantaneo.
- **Accesibilidad**: `<nav aria-label="Principal">`, `aria-current="page"` en la activa, foco visible con contorno navy de 2px separado 2px, etiquetas reales. Cada pestaña tiene previsto un hueco para insignia (punto o contador), que hoy no se muestra.
- **Visibilidad**: solo en las pantallas con pestañas (Inicio, Beats, Perfil). No aparece en bienvenida, registro, entrar, onboarding, escaner ni sin conexion; con una hoja o modal abierto queda debajo del velo.
- **Espacio inferior**: el contenido scrollea por debajo de la barra. Cada pantalla con barra reserva `alto de la barra + zona segura + 16px` con la clase `.espacio-barra`, calculada en un solo lugar a partir de `--alto-barra` (globals.css), de modo que el ultimo elemento se ve completo al llegar al final.

### Atmosfera

Base crema `#FFFFF5` con superficies blancas (v2.3.0). Referencia de atmosfera: apps tipo Cashea/Yummy — fondo claro, secciones bien segmentadas con cards y bloques de color.

El cielo del branding (con su velo blanco y el tinte de marca en `soft-light`) va SOLO en:
- La bienvenida y el onboarding, a pantalla completa y fijo.
- El header de Inicio, como franja que se funde con el crema.

En el resto de la app: crema solido. A tamano completo y sin velo, el cielo se reserva para el splash screen.

### Firma visual

El momento memorable de la app es el contador de Beats: un numero grande en Anton, en navy `#1A2332`; en Inicio, dentro de una card de vidrio sobre el cielo del header, y en Beats, en una superficie blanca. El amarillo `#FDFB05` no se usa como color del numero (no alcanza contraste sobre superficie clara): pasa a una barra de acento debajo del numero y a un halo radial detras que late despacio (se queda quieto con `prefers-reduced-motion`). Con animacion de incremento cuando se suman puntos. Es lo primero que el usuario ve en su pantalla principal, y se ve igual en Inicio y en la pantalla de Beats para que se reconozca como el mismo numero.

## 3. Tono y Copy

Hereda las reglas de la constitution web con adaptaciones para mobile:

- **Idioma**: espanol (Venezuela)
- **Registro**: mas cercano que la web. La app habla directo al usuario: "Sumaste 10 Beats", "Tu proxima jornada", "Dona y suma". Tuteo.
- **Voz en notificaciones**: directa y breve. "Nueva jornada de Pulso: utiles escolares. Dona y suma Beats." No "Querido usuario, le informamos que..."
- **Patrones prohibidos**: los mismos que la web. Ademas: no usar "Felicidades!" ni "Increible!" en confirmaciones. Ser concreto: "Donacion registrada. +10 Beats."
- **Microcopy**: cada pantalla tiene un estado vacio con texto que guia a la accion, no que se disculpa. "Tu primer escaneo aparecera aqui." NO "Lo sentimos, no hay datos disponibles."
- **CTAs mobile**: verbos cortos en infinitivo. "Donar", "Escanear", "Canjear", "Ver mas". Maximo 2 palabras.

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
4. **Beats**: balance de Beats, historial de movimientos agrupado por dia, explicacion de como ganar Beats y en que se cambian, opciones de canje (Fase 3)
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
