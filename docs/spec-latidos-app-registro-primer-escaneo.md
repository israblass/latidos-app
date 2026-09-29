---
tipo: spec
producto: Latidos App
slug: latidos-app
actor: usuario-final
pipeline: spec-builder
alimenta-a: plan-builder
tags: [spec, latidos-app, usuario-final, plan-pendiente]
<!-- Actualizado 2026-09-10: correccion post-implementacion de Fase 1. La sesion ya no se inicia al completar el paso 6, sino al confirmar el correo (confirmacion de email activada, no prevista en la version original de esta spec). Ver plan y tasks para el detalle tecnico. -->
<!-- Actualizado 2026-09-29: ajuste derivado de la historia "Beats: balance e historial". (1) Bono de bienvenida: al confirmar el correo la cuenta recibe 5 Beats (configurable por el admin), una sola vez, registrados como movimiento "Bienvenida a Latidos"; las cuentas creadas antes de este ajuste tambien lo reciben. (2) Inicio ya no arranca en cero ni muestra la ilustracion de estado vacio; la card del contador se puede tocar y lleva a la pantalla de Beats. (3) La pantalla 2 del onboarding deja de prometer montos fijos ("Cada marca da distinto") y marca como "Pronto" las formas de ganar que aun no existen (donar, voluntariado, actividades). -->
relacionados:
  - "[[Historia del Usuario Final - Registro y Primer Escaneo]]"
  - "[[spec latidos-app - operador]]"
  - "[[spec latidos-app - admin]]"
  - "[[plan latidos-app]]"
  - "[[constitution latidos-app]]"
  - "[[Historia del Usuario Final - Beats: balance e historial]]"
---

# Especificacion: Latidos App - Registro y Primer Escaneo de QR

## 1. Historia de Usuario

La persona llega a latidos.app por primera vez. No importa si el camino fue un QR fisico en el evento del 15 de septiembre, un link compartido en un grupo de WhatsApp, una campaña dentro de la universidad, o un boton dentro de la web informativa de Latidos — todos esos caminos desembocan en el mismo lugar. Lo primero que ve es una pantalla de bienvenida con el branding de Latidos: el amarillo sobre el fondo azul cielo, el badge UCV. Puede empezar a registrarse de inmediato, sin que nada se lo impida. Sobre esa pantalla de bienvenida aparece tambien un prompt de instalacion: en iOS un modal breve con los pasos (Compartir, luego Agregar a pantalla de inicio), en Android el banner o boton nativo del navegador que dispara el dialogo de instalacion del sistema. En ambos casos el prompt se puede cerrar sin bloquear nada — la persona puede seguir navegando o registrarse sin instalar.

Toca para registrarse y el formulario se despliega por pasos, no de golpe. Lo primero que pide es su cedula. Despues, en pasos siguientes, nombre y apellido, telefono, correo, el tipo de persona que es (estudiante de la UCV, egresado, o externo), y una contraseña. La cedula, el telefono y el tipo de usuario son autodeclarados, sin validacion real contra ningun padron todavia. El correo si se valida: al completar el ultimo paso, el sistema envia un correo de confirmacion y la persona debe confirmarlo antes de que la cuenta quede completamente activa — puede hacerlo desde el mismo dispositivo o desde otro. El formulario se guarda solo al completar todos los pasos, no de forma incremental: si la persona cierra la app a mitad del proceso, pierde lo avanzado y debe empezar de nuevo. Cada campo esta construido de forma que, mas adelante, se le pueda enchufar una validacion real adicional (por ejemplo verificacion de cedula por codigo OTP, prevista como mejora posterior a la fase beta) sin tener que rehacer el formulario. Al confirmar el correo, el perfil se completa con los datos del registro y la sesion queda iniciada de forma persistente en el dispositivo.

En vez de caer directo a una pantalla vacia, ve un onboarding de tres pantallas cortas, que se muestra una unica vez en la vida de la cuenta: que es Latidos, como se ganan Beats (con la unica forma disponible hoy, escanear QR de marcas, sin un monto fijo porque cada marca da distinto, y las demas marcadas como "Pronto"), y una pantalla de cierre con un boton para empezar — con la opcion de saltarselo desde la primera pantalla si no quiere leer. Dentro de este onboarding tambien se le solicita permiso de notificaciones push, pensado para avisos futuros de valor real (nuevas jornadas, artistas confirmados, novedades del programa) — no para confirmar cada accion que haga dentro de la app. Cuando termina el onboarding, aterriza en Inicio. Ahi esta el contador de Beats, la firma visual de toda la app, y no marca cero: al confirmar su correo la cuenta recibio 5 Beats de bienvenida, y esa es la primera vez que los ve. Empezar con algo ya sumado le hace sentir que va en camino, no que parte de la nada. Si toca ese contador, llega a la pantalla de sus Beats, donde la bienvenida aparece como su primer movimiento.

Ve el boton de escanear en el centro de la barra de navegacion y lo toca. La camara se abre pidiendo el permiso correspondiente del navegador. No necesita apuntar y presionar un boton de captura — en cuanto enfoca un QR, la app lo reconoce sola. Justo despues de leerlo hay un instante de validacion que dura lo que tarda la respuesta del servidor, sin espera artificial: el sistema revisa contra la base de datos si ese QR esta activo, si esta persona no lo escaneo ya hoy, si no supero su limite total de usos. Si el QR pasa esas validaciones, antes de sumar los Beats se le muestra una pantalla de confirmacion con el nombre de la marca y la cantidad de Beats en juego, y debe tocar un boton para confirmar el canje. Recien al confirmar se otorgan los Beats: ve la tarjeta de exito con el contador subiendo con animacion. Esta confirmacion ocurre unicamente en pantalla, sin notificacion push asociada. Si en ese momento el admin activo el modo evento desde backoffice — como estara activo durante el lanzamiento del 15, con varios stands cerca — el mensaje de cierre la invita a seguir escaneando, porque tiene sentido que haya mas marcas alrededor. Si el modo evento esta apagado, el cierre es mas simple, sin ese empujon a seguir buscando, y sin ningun CTA adicional mas alla de volver a Inicio.

No todo escaneo termina en exito. Si ya escaneo ese mismo QR hoy (el limite diario se resetea a medianoche, hora local, no a las 24 horas exactas desde el ultimo escaneo), el mensaje no suena a restriccion sino a algo ya logrado: que ya sumo con esa marca hoy. Si el QR llego a su limite total de usos, el mensaje es neutro, sin mencionar que se acabo ni que llego tarde — simplemente que ese codigo ya no esta activo, sin generarle la sensacion incomoda de haberse perdido algo frente al stand de la marca. Si la camara no logra leer el codigo, ya sea porque esta dañado, mal enfocado o no es un QR de Latidos, el mensaje la invita a asegurarse de enfocar bien y volver a intentar. Y si no tiene conexion en ese momento, la app no intenta procesar nada en segundo plano — le dice que intente de nuevo cuando tenga señal.

La historia termina cuando la persona, ya registrada y con su primer QR escaneado, ve su balance de Beats reflejado en su perfil. De ahi en adelante puede seguir escaneando otros QR, volver a Inicio, o simplemente cerrar la app sabiendo que su cuenta y sus Beats van a estar ahi la proxima vez que entre.

## 2. Objetivo

Permitir que cualquier persona (estudiante UCV, egresado o externo) cree una cuenta en Latidos App sin friccion y experimente su primera ganancia de Beats al escanear el QR de una marca patrocinadora, estableciendo el patron de uso central de la app (escanear y sumar) desde el primer contacto.

## 3. Alcance

**Incluye:**
- Pantalla de bienvenida en latidos.app, unica sin importar el canal de origen (QR fisico, link, campaña, web)
- Prompt de instalacion de la PWA (variante iOS y variante Android), descartable, no bloqueante
- Registro por pasos: cedula, nombre y apellido, telefono, correo, tipo de usuario, contraseña
- Confirmacion de correo por enlace antes de activar la cuenta, soportando confirmacion desde un dispositivo distinto al del registro
- Guardado del registro solo al completar todos los pasos
- Onboarding de 3 pantallas mostrado una unica vez por cuenta, con solicitud de permiso de notificaciones push
- Bono de bienvenida: 5 Beats (configurable por el admin) otorgados una sola vez al confirmar el correo, registrados como movimiento "Bienvenida a Latidos"
- Pantalla de Inicio con contador de Beats mostrando el bono de bienvenida tras el registro, con la card del contador tocable hacia la pantalla de Beats
- Escaneo de QR de marca por camara, con reconocimiento automatico sin boton de captura
- Instante de validacion server-side post-lectura de QR
- Pantalla de confirmacion previa al canje (marca y Beats en juego) cuando el QR es valido, con boton de confirmar
- Tarjeta de confirmacion de escaneo exitoso tras confirmar el canje, con variante segun modo evento activo/inactivo
- Los cuatro escenarios de friccion del escaneo: QR ya usado hoy, QR con limite alcanzado, QR invalido/mal enfocado, sin conexion
- Persistencia de sesion tras confirmar el correo

**No incluye:**
- Verificacion real de cedula o telefono contra ningun padron (quedan previstos para despues de la fase beta, via OTP para cedula)
- Notificacion push de confirmacion por cada escaneo de QR (la confirmacion es solo en pantalla)
- Lo que ve el operador de punto de control al escanear a un usuario (otra historia)
- Lo que ve el admin generando QR de marcas o activando el modo evento (otra historia, backoffice)
- Modulo Pulso (insumos, centros de acopio, cronologia) — llega en Fase 2 segun la constitution
- Canje de Beats por merch, entradas o cursos (otra historia)
- Pasarela de pagos integrada
- Reconocimiento facial
- Chat en vivo o chatbot
- Multiidioma (solo español)
- Login con redes sociales

## 4. Actores

- **Usuario final (estudiante UCV, egresado o externo)**: persona que descarga/instala o simplemente abre la PWA, se registra sin verificacion real de sus datos, y escanea QR de marcas para acumular Beats.

## 5. Precondiciones

- Existe al menos un QR de marca activo generado desde backoffice, con Beats configurados y limite de escaneos definido
- El dominio latidos.app esta activo y desplegado
- El admin ha definido el estado del modo evento (activo o inactivo) segun corresponda a la fecha

## 6. Disparador

La persona accede a latidos.app por primera vez, desde cualquier canal (QR fisico, link compartido, campaña universitaria, boton en la web informativa de Latidos).

## 7. Flujo Principal

1. La persona abre latidos.app y ve la pantalla de bienvenida con el branding de Latidos.
2. Sobre la bienvenida aparece el prompt de instalacion (modal en iOS, banner nativo en Android). Puede cerrarlo sin que esto le impida continuar.
3. Toca para registrarse. El formulario se presenta por pasos: cedula, nombre y apellido, telefono, correo, tipo de usuario (seleccion unica entre estudiante UCV / egresado / externo), contraseña.
4. Completa todos los pasos. El sistema crea la cuenta y envia un correo de confirmacion. La persona ve una pantalla que le indica que revise su correo antes de continuar; la sesion y el perfil completo quedan pendientes hasta confirmar.
4b. La persona confirma el correo desde el enlace recibido (puede hacerlo desde otro dispositivo). Al confirmar, la sesion queda iniciada de forma persistente, el perfil se completa con los datos del registro y la cuenta recibe los Beats de bienvenida.
5. Ve el onboarding de 3 pantallas: que es Latidos, como se ganan Beats (escanear QR de marcas sin monto fijo; donar, voluntariado y actividades marcados como "Pronto"), pantalla de cierre con boton para empezar (con opcion de saltar desde la primera pantalla). Durante el onboarding se le solicita permiso de notificaciones push.
6. Aterriza en Inicio, donde ve el contador de Beats con los Beats de bienvenida. Tocar la card del contador lleva a la pantalla de Beats.
7. Toca el boton de escanear en la barra de navegacion. Se solicita permiso de camara si aun no fue otorgado.
8. Enfoca un QR de marca. La app lo reconoce automaticamente, sin boton de captura.
9. El sistema valida contra el servidor: QR activo, no escaneado por esta persona hoy, no excede limite total de usos.
10. Si es valido: aparece una pantalla de confirmacion previa con el nombre de la marca y la cantidad de Beats en juego, con un boton para confirmar el canje.
11. La persona confirma. Se otorgan los Beats: aparece la tarjeta de exito con el contador subiendo con animacion.
12. Si el modo evento esta activo, el mensaje de cierre invita a seguir escaneando. Si esta inactivo, el cierre es simple, sin CTA adicional mas alla de volver a Inicio.
13. La persona vuelve a Inicio y ve su balance de Beats actualizado, o continua escaneando otro QR.

## 8. Flujos Alternativos

1. **QR ya escaneado hoy por esta persona:**
   - El sistema detecta que ya existe un registro de escaneo de ese QR por ese usuario en el dia en curso (reinicio a medianoche, hora local)
   - Se muestra un mensaje que enmarca el hecho como algo ya logrado, no como restriccion (ej. "Ya sumaste con esta marca hoy")
   - No se otorgan Beats adicionales

2. **QR alcanzo su limite total de escaneos:**
   - El sistema detecta que el contador de usos del QR alcanzo el limite configurado por el admin
   - Se muestra un mensaje neutro que no menciona limites ni "se acabo" (ej. "Este codigo ya no esta activo")
   - No se otorgan Beats

3. **QR invalido o ilegible:**
   - La camara no logra decodificar el codigo, o el codigo leido no corresponde a un QR de Latidos
   - Se muestra un mensaje que invita a reintentar asegurando el enfoque (ej. "Asegurate de enfocar bien el codigo y vuelve a intentar")
   - El escaner permanece activo para un nuevo intento

4. **Sin conexion al momento de escanear:**
   - La app detecta ausencia de red al intentar validar el QR contra el servidor
   - Se muestra un mensaje que sugiere reintentar cuando haya señal
   - No se guarda ni se procesa el intento en segundo plano

5. **Persona cancela la confirmacion de canje:**
   - El QR ya paso la validacion (activo, no usado hoy, con cupo) y se le mostro marca y Beats en juego
   - La persona toca cancelar o cierra la pantalla de confirmacion sin confirmar
   - No se otorgan Beats, el escaneo no cuenta como uso del QR para el limite diario ni total
   - Vuelve al escaner o a Inicio

6. **Persona cierra la app a mitad del registro:**
   - Ningun dato del formulario incompleto se guarda
   - Al volver a abrir la app, debe iniciar el registro desde el primer paso

7. **Persona descarta el prompt de instalacion:**
   - El prompt se cierra sin bloquear el acceso a la bienvenida, el registro ni ninguna otra funcion
   - La app sigue siendo completamente funcional desde el navegador sin instalar

8. **Persona no otorga permiso de notificaciones durante el onboarding:**
   - El onboarding continua igualmente hasta la pantalla de Inicio
   - La app queda operativa; el usuario no recibe avisos futuros de jornadas o novedades hasta que otorgue el permiso (fuera de alcance de esta historia definir el reintento de este permiso)

9. **Persona no otorga permiso de camara al intentar escanear:**
   - El escaner no puede activarse
   - Se muestra indicacion de habilitar el permiso desde la configuracion del navegador/dispositivo

## 9. Reglas de Negocio

1. El registro requiere completar los 6 pasos (cedula, nombre y apellido, telefono, correo, tipo de usuario, contraseña) para crear la cuenta; no hay guardado parcial.
2. La cedula, el telefono y el tipo de usuario son autodeclarados, sin validacion real contra ningun padron en esta fase. El correo si se valida mediante confirmacion por enlace enviado tras completar el registro.
3. El campo de tipo de usuario acepta exactamente tres valores: estudiante UCV, egresado, externo, sin diferenciacion de permisos entre ellos en esta historia.
4. La sesion queda iniciada de forma persistente en el dispositivo recien al confirmar el correo, no al completar el paso 6. La confirmacion puede hacerse desde un dispositivo distinto al que inicio el registro.
5. El onboarding de 3 pantallas se muestra una unica vez por cuenta, nunca se repite en sesiones posteriores.
6. El permiso de notificaciones push se solicita durante el onboarding, orientado a avisos futuros de valor (jornadas, artistas, novedades) — no se dispara notificacion push por cada escaneo de QR.
7. El escaneo de QR reconoce el codigo automaticamente al enfocarlo; no existe boton de captura manual. La validacion contra el servidor ocurre en silencio, sin pedir confirmacion mientras se revisa.
8. Si el QR pasa la validacion (activo, no usado hoy por esta persona, con cupo disponible), el sistema muestra una pantalla de confirmacion con marca y Beats en juego antes de otorgarlos; los Beats solo se acreditan cuando la persona confirma. Cancelar en este paso no cuenta como uso del QR.
9. Cada QR de marca tiene: identificador unico, marca asociada, cantidad de Beats (configurable en cualquier momento sin reimprimir el codigo fisico), limite total de escaneos, estado activo/inactivo.
10. Una misma persona puede escanear el QR de una marca una unica vez por dia; el conteo se reinicia a medianoche hora local.
11. Cualquier usuario registrado puede escanear cualquier QR de marca activo, sin restriccion por tipo de usuario.
12. El "modo evento" es un unico toggle global en backoffice, controlado solo por el admin, que determina si el cierre de un escaneo exitoso invita a seguir escaneando o se presenta de forma simple.
13. Solo el admin puede activar/desactivar el modo evento y modificar los Beats o el estado de un QR ya emitido.
14. La camara se accede via navegador (permiso de camara web) en esta fase PWA; al empaquetarse con Capacitor para las tiendas, el acceso se resuelve via el contenedor nativo manteniendo la misma experiencia.
15. El prompt de instalacion nunca bloquea el registro ni el uso de la app; la PWA es completamente funcional sin instalar.
16. Al confirmar el correo, la cuenta recibe un bono de bienvenida de 5 Beats (valor configurable por el admin), una unica vez por cuenta. El bono queda registrado como movimiento "Bienvenida a Latidos" en el historial, para que el saldo coincida siempre con la suma del historial. Las cuentas creadas antes de esta regla tambien lo reciben, una sola vez.
17. La pantalla del onboarding que explica como ganar Beats no muestra montos fijos por escanear (cada marca da distinto) y marca como "Pronto" las formas de ganar que aun no estan disponibles. Su contenido es el mismo que la explicacion de como ganar en la pantalla de Beats.

## 10. Suposiciones

### Funcionales
1. La pantalla de bienvenida en latidos.app es la misma sin importar el origen del enlace (QR fisico, WhatsApp, campaña, web informativa) — no hay contenido distinto por canal de origen. *(validada)*
2. El prompt de instalacion aparece sobre la pantalla de bienvenida sin bloquear el uso ni el registro. En iOS es un modal con instrucciones paso a paso (Compartir, luego Agregar a pantalla de inicio). En Android es el banner/boton nativo del navegador que dispara el dialogo de instalacion del sistema. Ambos se pueden descartar y la persona sigue navegando o registrandose sin instalar. *(refinada)*
3. El prompt de instalacion puede descartarse y no vuelve a aparecer de forma insistente en cada sesion — reaparece como maximo un recordatorio discreto ocasional. *(validada)*
4. El registro tiene 6 pasos en este orden: cedula, nombre y apellido, telefono, correo, tipo de usuario, contraseña. *(validada)*
5. Cada paso del registro se guarda solo al completar el formulario entero, no de forma incremental — si la persona cierra la app a la mitad, pierde el progreso. *(validada)*
6. El campo de tipo de usuario (estudiante UCV / egresado / externo) se presenta como seleccion unica entre las tres opciones, sin campo adicional que la sustente. *(validada)*
7. El onboarding post-registro tiene exactamente 3 pantallas: que es Latidos, como se ganan Beats, y confirmacion para empezar. En la pantalla de como se ganan, escanear QR de marcas aparece sin monto fijo ("Cada marca da distinto") y donar, voluntariado y actividades aparecen atenuados con la etiqueta "Pronto". *(refinada 2026-09-29)*
8. El onboarding se muestra una sola vez en la vida de la cuenta, no se repite en sesiones futuras. *(validada)*
9. El escaner reconoce el QR automaticamente al enfocarlo, sin boton de captura manual. *(validada)*
10. El instante de validacion post-lectura del QR dura lo que tarda la respuesta del servidor, sin un tiempo minimo artificial de espera. *(validada)*
11. El "modo evento" es un toggle unico y global en backoffice (no por marca ni por ubicacion) que afecta el copy de cierre de escaneo en toda la app mientras esta activo. *(validada)*
12. Fuera de modo evento, el cierre de escaneo exitoso no incluye ningun CTA adicional mas alla de volver a Inicio. *(validada)*
12b. Al confirmar el correo, la cuenta recibe 5 Beats de bienvenida (configurable por el admin), una sola vez, y el contador de Inicio los muestra desde la primera llegada. Ya no existe el estado de Inicio en cero. *(agregada 2026-09-29)*
12c. La card del contador en Inicio se puede tocar y lleva a la pantalla de Beats. *(agregada 2026-09-29)*

### Usuarios
13. Solo existe un tipo de cuenta en esta historia (usuario final autodeclarado); no hay diferenciacion de permisos entre estudiante UCV, egresado o externo en esta primera version. *(validada)*
14. La sesion permanece iniciada indefinidamente en el dispositivo tras el registro (no requiere reautenticacion en cada apertura). *(validada)*

### Datos
15. La cedula se almacena como texto libre sin formato forzado en esta fase (sin validacion real). Queda prevista la incorporacion de verificacion por codigo OTP como mejora posterior a la fase beta, sin que esto requiera rehacer el flujo de registro. *(refinada)*
16. El correo y el telefono tampoco se validan en formato estricto mas alla de una validacion basica de sintaxis (que el correo tenga arroba, que el telefono sean digitos). *(validada)*
17. Cada QR de marca guarda: identificador unico, marca asociada, cantidad de Beats configurable, limite total de escaneos, estado activo/inactivo. *(validada)*
18. El registro de "esta persona ya escaneo este QR hoy" se resetea a medianoche (hora local), no a las 24 horas exactas desde el ultimo escaneo. *(validada)*

### Permisos
19. Cualquier usuario registrado puede escanear cualquier QR de marca activo, sin restriccion por tipo de usuario (estudiante/egresado/externo). *(validada)*
20. Solo el admin puede activar o desactivar el "modo evento" y cambiar los Beats de un QR ya emitido. *(validada)*

### Integraciones
21. La camara del dispositivo se usa via navegador (permiso de camara web) en esta fase PWA. Cuando la app pase a Capacitor y se publique en las tiendas, el acceso a camara se resuelve via el contenedor nativo, manteniendo la misma experiencia de usuario. *(refinada)*
22. Al completar el registro (dentro del onboarding) se le solicita permiso de notificaciones push, pensado para futuros avisos de valor (jornadas, artistas, novedades del programa). El escaneo de un QR y la suma de Beats no dispara push — la confirmacion ocurre unicamente en pantalla mediante la tarjeta y la animacion del contador. *(refinada)*

## 11. Criterios de Aceptacion

1. Dado que una persona accede a latidos.app desde cualquier canal (QR fisico, link, campaña, web), cuando la pagina carga, entonces ve la misma pantalla de bienvenida con el branding de Latidos.
2. Dado que la persona esta en iOS, cuando ve la bienvenida, entonces aparece un modal de instalacion con los pasos Compartir y Agregar a pantalla de inicio, descartable.
3. Dado que la persona esta en Android, cuando ve la bienvenida, entonces aparece el banner o boton nativo del navegador para instalar, descartable.
4. Dado que la persona descarta el prompt de instalacion, cuando continua navegando, entonces puede registrarse y usar la app sin restriccion alguna.
5. Dado que la persona inicia el registro, cuando avanza por los pasos, entonces ve en orden: cedula, nombre y apellido, telefono, correo, tipo de usuario, contraseña.
6. Dado que la persona cierra la app antes de completar el ultimo paso del registro, cuando vuelve a abrirla, entonces el formulario esta vacio y debe empezar desde el primer paso.
7. Dado que la persona completa los 6 pasos del registro, cuando confirma el ultimo paso, entonces el sistema envia un correo de confirmacion y muestra una pantalla que le pide revisarlo, sin sesion iniciada todavia.
7b. Dado que la persona confirma el correo desde el enlace recibido (mismo dispositivo o distinto), cuando la confirmacion se procesa, entonces el perfil se completa, la sesion queda iniciada de forma persistente y avanza al onboarding.
8. Dado que la cuenta se acaba de confirmar, cuando el sistema la redirige, entonces ve el onboarding de 3 pantallas antes de llegar a Inicio.
9. Dado que la persona esta en el onboarding, cuando toca "saltar" desde la primera pantalla, entonces llega directo a Inicio sin ver las pantallas restantes.
10. Dado que la persona ya vio el onboarding una vez, cuando vuelve a abrir la app en una sesion futura, entonces no vuelve a mostrarse.
11. Dado que la persona esta en el onboarding, cuando el sistema lo solicita, entonces se le pide permiso de notificaciones push.
12. Dado que la persona llega a Inicio por primera vez tras confirmar el correo, cuando ve la pantalla, entonces el contador de Beats muestra los Beats de bienvenida (5 por defecto).
12b. Dado que la persona confirma su correo, cuando la confirmacion se procesa, entonces recibe una unica vez los Beats de bienvenida y queda registrado un movimiento "Bienvenida a Latidos".
12c. Dado que la persona esta en Inicio, cuando toca la card del contador, entonces llega a la pantalla de Beats.
12d. Dado que la persona ve la pantalla del onboarding sobre como ganar Beats, cuando la lee, entonces escanear QR de marcas no muestra monto fijo y donar, voluntariado y actividades aparecen marcados como "Pronto".
13. Dado que la persona toca el boton de escanear, cuando la camara aun no tiene permiso otorgado, entonces el sistema lo solicita antes de activar el escaner.
14. Dado que la persona enfoca un QR valido con la camara, cuando el sistema lo reconoce, entonces no requiere ningun boton de captura adicional.
15. Dado que el QR escaneado esta activo, no fue usado hoy por esta persona y no excede su limite, cuando se valida, entonces se muestra una pantalla de confirmacion con marca y Beats en juego, sin otorgar Beats todavia.
16. Dado que la persona ve la pantalla de confirmacion de canje, cuando toca confirmar, entonces se otorgan los Beats y ve la tarjeta de exito con el contador subiendo con animacion.
17. Dado que la persona ve la pantalla de confirmacion de canje, cuando cancela o la cierra sin confirmar, entonces no se otorgan Beats y el escaneo no cuenta contra el limite diario ni total del QR.
18. Dado que el modo evento esta activo en backoffice, cuando el canje se confirma con exito, entonces el mensaje de cierre invita a seguir escaneando.
19. Dado que el modo evento esta inactivo, cuando el canje se confirma con exito, entonces el cierre es simple sin CTA adicional mas alla de volver a Inicio.
20. Dado que la persona ya escaneo ese QR hoy, cuando lo vuelve a enfocar, entonces ve un mensaje que enmarca el hecho como logro cumplido, sin llegar a la pantalla de confirmacion ni otorgar Beats adicionales.
21. Dado que el QR alcanzo su limite total de usos, cuando alguien lo enfoca, entonces ve un mensaje neutro sin mencion de limites, sin llegar a la pantalla de confirmacion ni otorgar Beats.
22. Dado que el QR es ilegible o invalido, cuando la camara falla en decodificarlo, entonces se muestra un mensaje que invita a enfocar mejor y reintentar.
23. Dado que no hay conexion al momento de escanear, cuando el sistema intenta validar, entonces se muestra un mensaje que sugiere reintentar con señal, sin procesar nada en segundo plano.
24. Dado que el admin sube o baja los Beats de un QR ya impreso, cuando alguien lo escanea despues del cambio y confirma el canje, entonces recibe la cantidad de Beats actualizada sin que el codigo fisico haya cambiado.

## 12. BDD / Gherkin

```gherkin
# language: es

Caracteristica: Bienvenida e instalacion
  Como persona que llega por primera vez a Latidos
  Quiero ver la app y poder instalarla si quiero
  Para decidir como voy a usarla sin que nada me bloquee

  Escenario: Llegada desde cualquier canal
    Dado que accedo a latidos.app desde un QR fisico, un link o la web informativa
    Cuando la pagina carga
    Entonces veo la misma pantalla de bienvenida con el branding de Latidos

  Escenario: Prompt de instalacion en iOS
    Dado que abro latidos.app desde Safari en iOS
    Cuando veo la bienvenida
    Entonces aparece un modal con los pasos Compartir y Agregar a pantalla de inicio

  Escenario: Prompt de instalacion en Android
    Dado que abro latidos.app desde Chrome en Android
    Cuando veo la bienvenida
    Entonces aparece el banner o boton nativo de instalacion del navegador

  Escenario: Descartar el prompt sin bloqueo
    Dado que veo el prompt de instalacion
    Cuando lo cierro
    Entonces puedo registrarme y usar la app con normalidad

Caracteristica: Registro por pasos
  Como persona nueva en Latidos
  Quiero crear mi cuenta sin friccion
  Para empezar a participar en el programa

  Escenario: Completar el registro
    Dado que inicio el registro
    Cuando avanzo por cedula, nombre y apellido, telefono, correo, tipo de usuario y contraseña
    Entonces al confirmar el ultimo paso recibo un correo de confirmacion y veo una pantalla que me pide revisarlo

  Escenario: Confirmar el correo
    Dado que complete el registro y recibi el correo de confirmacion
    Cuando toco el enlace de confirmacion, desde el mismo dispositivo o desde otro
    Entonces mi perfil se completa, mi sesion queda iniciada y avanzo al onboarding

  Escenario: Cerrar la app a mitad del registro
    Dado que complete solo algunos pasos del registro
    Cuando cierro la app y la vuelvo a abrir
    Entonces el formulario esta vacio y debo empezar desde el primer paso

Caracteristica: Onboarding
  Como persona recien registrada
  Quiero entender que es Latidos y como gano Beats
  Para saber que hacer despues de crear mi cuenta

  Escenario: Ver el onboarding la primera vez
    Dado que acabo de crear mi cuenta
    Cuando el sistema me redirige
    Entonces veo 3 pantallas de onboarding antes de llegar a Inicio

  Escenario: Saltar el onboarding
    Dado que estoy en la primera pantalla del onboarding
    Cuando toco "saltar"
    Entonces llego directo a Inicio

  Escenario: Formas de ganar sin montos fijos
    Dado que estoy en la pantalla de como se ganan Beats
    Cuando la leo
    Entonces escanear QR de marcas dice que cada marca da distinto
    Y donar, voluntariado y actividades aparecen marcados como "Pronto"

  Escenario: Onboarding no se repite
    Dado que ya vi el onboarding una vez
    Cuando abro la app en una sesion futura
    Entonces no vuelve a mostrarse

Caracteristica: Bono de bienvenida
  Como persona recien registrada
  Quiero empezar con algo sumado
  Para sentir que ya voy en camino

  Escenario: Recibir el bono al confirmar el correo
    Dado que complete el registro
    Cuando confirmo mi correo
    Entonces recibo 5 Beats de bienvenida una sola vez
    Y al llegar a Inicio el contador los muestra

  Escenario: Ir a mis Beats desde Inicio
    Dado que estoy en Inicio
    Cuando toco la card del contador
    Entonces llego a la pantalla de Beats

Caracteristica: Primer escaneo de QR
  Como usuario registrado
  Quiero escanear el QR de una marca
  Para sumar mis primeros Beats

  Escenario: QR valido muestra confirmacion antes de otorgar Beats
    Dado que el QR esta activo, no lo escanee hoy y no supera su limite
    Cuando lo enfoco con la camara
    Entonces veo una pantalla de confirmacion con la marca y los Beats en juego, sin haber recibido Beats todavia

  Escenario: Confirmar canje con modo evento activo
    Dado que veo la pantalla de confirmacion de canje
    Y el modo evento esta activo en backoffice
    Cuando toco confirmar
    Entonces recibo los Beats, veo el contador subir con animacion y un mensaje que me invita a seguir escaneando

  Escenario: Confirmar canje con modo evento inactivo
    Dado que veo la pantalla de confirmacion de canje
    Y el modo evento esta inactivo
    Cuando toco confirmar
    Entonces recibo los Beats y veo un cierre simple sin CTA adicional mas alla de volver a Inicio

  Escenario: Cancelar la confirmacion de canje
    Dado que veo la pantalla de confirmacion de canje
    Cuando toco cancelar o la cierro sin confirmar
    Entonces no recibo Beats y el escaneo no cuenta contra el limite del QR

  Escenario: QR ya escaneado hoy
    Dado que ya escanee este QR hoy
    Cuando lo vuelvo a enfocar
    Entonces veo un mensaje que reconoce que ya sume con esta marca, sin llegar a la pantalla de confirmacion

  Escenario: QR con limite alcanzado
    Dado que el QR alcanzo su limite total de escaneos
    Cuando lo enfoco
    Entonces veo un mensaje neutro que no otorga Beats, sin llegar a la pantalla de confirmacion

  Escenario: QR ilegible
    Dado que la camara no logra leer el codigo
    Cuando intento escanearlo
    Entonces veo un mensaje que me invita a enfocar mejor y reintentar

  Escenario: Sin conexion
    Dado que no tengo conexion a internet
    Cuando intento escanear un QR
    Entonces veo un mensaje que me sugiere reintentar cuando tenga señal
```

## 13. Wireframes ASCII

### Bienvenida con prompt de instalacion (iOS)

```
+------------------------------------------+
|                                            |
|              [ LATIDOS ]                  |
|           (amarillo sobre cielo)          |
|                                            |
|              [badge UCV]                  |
|                                            |
|         [ Registrarme ]                   |
|                                            |
+------------------------------------------+
|  Para instalar Latidos              [ X ] |
|                                            |
|  Usa Latidos como una app en tu telefono. |
|                                            |
|  1  Toca "Compartir" en el navegador      |
|  2  Elige "Agregar a pantalla de inicio"  |
|  3  Toca "Agregar"                        |
|                                            |
|  [        Entendido        ]              |
+------------------------------------------+
```

### Registro por pasos

```
+------------------------------------------+
|  [<]                    Paso 1 de 6       |
|                                            |
|  Cual es tu cedula?                       |
|                                            |
|  [___________________________]            |
|                                            |
|                                            |
|              [ Continuar ]                |
+------------------------------------------+
```

### Onboarding (pantalla 2 de 3)

```
+------------------------------------------+
|                          [ Saltar ]       |
|                                            |
|            [icono contador]               |
|                                            |
|          Gana Beats                       |
|                                            |
|  [QR] Escanea QR de marcas                |
|       Cada marca da distinto              |
|  [..] Dona insumos             (Pronto)   |
|  [..] Haz voluntariado         (Pronto)   |
|  [..] Asiste a actividades     (Pronto)   |
|                                            |
|         o  ●  o                           |
|                                            |
|              [ Siguiente ]                |
+------------------------------------------+
```

### Inicio (primera llegada, con bono de bienvenida)

```
+------------------------------------------+
|  Hola, [nombre]                [notif]    |
|                                            |
|            LATIDOS                        |
|                                            |
|      +----------------------------+       |
|      |             5              |       |
|      |           BEATS            |       |
|      +----------------------------+       |
|      (card tocable: lleva a Beats)        |
|                                            |
|  Sigue participando para sumar mas.       |
|                                            |
|  [banner publicitario]                    |
|                                            |
+------------------------------------------+
|  [Inicio] [Pulso] [(Escanear)] [Beats] [Perfil] |
+------------------------------------------+
```

### Escaner activo

```
+------------------------------------------+
|  [ X ]                                    |
|                                            |
|         +----------------------+          |
|         |                      |          |
|         |    (visor camara)    |          |
|         |                      |          |
|         +----------------------+          |
|                                            |
|      Enfoca el QR de la marca             |
|                                            |
+------------------------------------------+
```

### Pantalla de confirmacion previa al canje

```
+------------------------------------------+
|  [ X ]                                    |
|                                            |
|            [logo marca]                   |
|                                            |
|         Vas a canjear el QR de            |
|              KFC                          |
|                                            |
|            +10  BEATS                     |
|                                            |
|                                            |
|         [ Confirmar canje ]               |
|         [ Cancelar ]                      |
+------------------------------------------+
```

### Confirmacion de escaneo exitoso (modo evento activo)

```
+------------------------------------------+
|                                            |
|            [logo marca]                   |
|                                            |
|         Sumaste 10 Beats de               |
|              KFC                          |
|                                            |
|          47  BEATS                        |
|        (animacion +10)                    |
|                                            |
|   Sigue escaneando, hay mas marcas cerca  |
|                                            |
|         [ Seguir escaneando ]             |
|         [ Volver a Inicio ]               |
+------------------------------------------+
```

### Friccion: QR con limite alcanzado

```
+------------------------------------------+
|                                            |
|              [icono neutro]                |
|                                            |
|      Este codigo ya no esta activo        |
|                                            |
|         [ Volver a Inicio ]               |
+------------------------------------------+
```
