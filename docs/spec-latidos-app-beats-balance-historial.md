---
tipo: spec
producto: Latidos App
slug: latidos-app
actor: usuario-final
pipeline: spec-builder
alimenta-a: plan-builder
tags: [spec, latidos-app, usuario-final, beats, plan-pendiente]
relacionados:
  - "[[Historia del Usuario Final - Beats: balance e historial]]"
  - "[[spec latidos-app - registro y primer escaneo]]"
  - "[[spec latidos-app - operador]]"
  - "[[spec latidos-app - admin]]"
  - "[[plan latidos-app]]"
  - "[[constitution latidos-app]]"
---

# Especificacion: Latidos App - Beats: balance e historial

## 1. Historia de Usuario

María ya tiene su cuenta en Latidos. Confirmó su correo, pasó por el onboarding y, desde la primera vez que llegó a Inicio, vio que no arrancaba de cero: tenía 5 Beats de bienvenida. Desde entonces ha escaneado alguna marca en el lanzamiento, o todavía no ha escaneado ninguna. En cualquier caso, en algún momento le surgen las mismas preguntas: cuántos Beats tiene, de dónde salió cada uno, cómo puede sumar más y para qué le van a servir. Esta historia es todo lo que ella vive para responderlas, desde que decide mirar sus Beats hasta que sale de esa pantalla sabiendo exactamente dónde está parada.

Llega por uno de dos caminos, y los dos la dejan en el mismo lugar. Puede tocar el ícono del corazón con latido, "Beats" (era el rayo hasta la v2.9.0 de la constitución, que los corrigió según la referencia aprobada), en la barra de abajo, que ya no está apagado ni dice "Disponible pronto". O puede tocar en Inicio la card donde vive su número, que ahora responde al toque en vez de quedarse quieta. Lo natural es tocar el saldo para ver el detalle, como en cualquier app donde se lleva la cuenta de algo, y ese toque la lleva directo a sus Beats. La pantalla que aparece justo después de escanear, la de "Sumaste 10 Beats de KFC", no cambia: ya le muestra su número actualizado, y en un evento lo que importa en ese momento es que siga hacia el siguiente stand, no que se ponga a revisar su historial.

Arriba, en la pantalla de Beats, ve su número exactamente como lo ve en Inicio: la misma card de vidrio, el mismo número grande, la misma barra amarilla y el mismo halo que late despacio detrás. Así lo reconoce como el mismo número, no como otro dato. Justo debajo, una línea corta le recuerda para qué los junta: pronto podrá cambiarlos por entradas al concierto, merch y cursos. No hay cifras ni barras de progreso, porque el canje todavía no está abierto y cualquier meta escrita hoy podría cambiar. Solo está el recordatorio de que el número tiene un destino. Cerca del número también hay un botón pequeño, "¿Cómo gano Beats?". Al tocarlo se abre una hoja desde abajo con lo mismo que vio en el onboarding. En "Cómo los ganas", escanear QR de marcas aparece como la forma disponible hoy, con la aclaración de que cada marca da distinto, sin prometer un monto que después no se cumpla. Donar insumos, hacer voluntariado y asistir a actividades aparecen atenuados con la etiqueta "Pronto", para que María sepa lo que viene sin salir a buscar algo que todavía no puede hacer. En "En qué los cambias" aparecen el concierto, el merch y los cursos, también marcados "Pronto". La hoja se cierra y ella vuelve a donde estaba.

Debajo del número está su historial, organizado por días como un diario. Cada día es una línea que se abre y se cierra como un acordeón. Cerrada, ya dice lo esencial: el día ("HOY", "AYER" o el día con su fecha, como "MIÉRCOLES 30 SEPT"), cuántos Beats sumó ese día y cuántos escaneos hizo. Al entrar, el día más reciente con movimientos aparece abierto, para que vea de una su último movimiento sin tocar nada, y los demás vienen cerrados. Puede abrir varios a la vez: abrir uno no cierra otro. Dentro de cada día, cada movimiento es una fila fija que no se abre más, porque ya lo dice todo: el logo de la marca, su nombre, cuántos Beats le dio y la hora. Si la marca todavía no tiene logo, en su lugar aparece un círculo con su inicial. La fila de bienvenida lleva el ícono de Latidos y dice "Bienvenida a Latidos · +5". Los días se cortan a medianoche, hora de Caracas, igual que el límite de escanear cada marca una vez al día, así que "hoy" significa lo mismo en toda la app.

Si María acaba de llegar y lo único que tiene es la bienvenida, la pantalla no se ve vacía. Su primera fila está ahí y le muestra con su propio ejemplo cómo funciona el historial. Como es justo cuando más necesita saber cómo seguir, sobre todo si se saltó el onboarding, debajo de esa fila aparece desplegada la explicación de cómo ganar Beats, junto con una línea que la invita a escanear su primer QR y un botón para hacerlo. Apenas hace su primer escaneo, esa explicación se retira de ahí, aparece su nuevo día en el acordeón, y lo de cómo ganar vuelve a vivir solo en el botón de arriba.

El número de arriba y la suma de su historial siempre coinciden. Nada cambia su saldo sin dejar una fila que lo explique. Si alguna vez el equipo de Latidos tiene que corregirle algo o regalarle Beats, eso aparece como una fila con nombre propio, como "Ajuste Latidos" o "Regalo Latidos", igual que la bienvenida. Y si una marca desactiva su QR, sus filas siguen en el historial de María con su nombre. Cada fila conserva para siempre los Beats que le dio en su momento, aunque después cambie lo que da ese QR. Lo que sí se actualiza es cómo se ve la marca: si la marca sube un logo nuevo o cambia su nombre, las filas viejas lo muestran también, porque para María sigue siendo la misma marca.

La pantalla está viva. Si su saldo cambia mientras la está mirando, el número sube frente a ella con la misma animación del contador y la fila nueva aparece en su día. Hoy eso pasa cuando vuelve de escanear. Más adelante será más visible: cuando llegue a un centro de acopio, entregue su donación y el operador le sume Beats, los verá subir en su teléfono en ese mismo instante. Y como en marzo, después de seis meses participando, su historial puede tener decenas de días, la pantalla carga primero los más recientes y trae los anteriores a medida que ella baja, sin que tenga que hacer nada.

A veces la señal no ayuda. En la Plaza Cubierta, llena de gente durante el festival, María abre sus Beats sin conexión. No ve un error ni una pantalla en blanco: ve lo último que la app tenía guardado, con un aviso pequeño arriba que le dice que no hay conexión y a qué hora eran esos datos. Cuando vuelve la señal, todo se actualiza solo y el aviso desaparece. Si tiene señal pero algo falla al cargar, pasa lo mismo, con un aviso de que no se pudo actualizar y la opción de reintentar. Solo si nunca abrió esta pantalla con conexión, y por lo tanto no hay nada guardado que mostrar, ve la pantalla de sin conexión con su ilustración, invitándola a volver cuando tenga señal. Nada de esto le llega como notificación: sumar Beats por algo que ella misma acaba de hacer se confirma en pantalla, no con un aviso en el teléfono.

La historia termina cuando María cierra la hoja o deja de bajar por su historial sabiendo cuántos Beats tiene, de dónde salió cada uno, cómo puede sumar más y que pronto los podrá cambiar por algo que le importa. Desde ahí vuelve a Inicio o toca el botón central para ir a escanear el siguiente QR. Lo que viene después son otras historias: canjear sus Beats por entradas, merch o cursos, cuando esas restas empiecen a aparecer en esta misma lista; los niveles y logros, que quedan para conversar en la próxima reunión; el operador que le suma Beats en un centro de acopio; y el admin que configura cuánto vale cada cosa.

## 2. Objetivo

Dar al usuario final una pantalla propia de Beats donde entienda, en un vistazo, cuántos Beats tiene, de dónde salió cada uno, cómo sumar más y para qué sirven. El saldo debe ser siempre verificable contra su historial, y la pantalla debe estar lista para recibir movimientos que restan cuando llegue el canje.

## 3. Alcance

**Incluye:**
- Activación del tab "Beats" de la barra inferior, que deja de estar apagado.
- Card del contador en Inicio tocable, que lleva a la pantalla de Beats.
- Pantalla de Beats con el contador (mismo tratamiento visual que en Inicio), la línea de recordatorio de canje y el botón "¿Cómo gano Beats?".
- Hoja inferior "¿Cómo gano Beats?" con "Cómo los ganas" y "En qué los cambias", con el mismo contenido que el onboarding.
- Historial agrupado por día en acordeón, con el día más reciente abierto y los movimientos como filas fijas.
- Filas de movimientos de marca (logo o inicial, nombre, Beats, hora) y de movimientos de Latidos (bienvenida, ajuste, regalo).
- Estado inicial del usuario sin escaneos: explicación de cómo ganar desplegada, línea guía y botón "Escanear".
- Actualización del saldo y del historial al entrar y en vivo mientras la pantalla está abierta.
- Carga por lotes del historial a medida que el usuario baja.
- Comportamiento sin conexión, con error de carga y sin datos guardados.
- Reglas de consistencia entre saldo e historial para todo movimiento de Beats.

**No incluye:**
- Canje de Beats por entradas, merch o cursos, y cómo se ven las filas de canje (historia de canje, Fase 3).
- Niveles, badges y logros (pendiente de definir en reunión con el cliente).
- Otorgamiento del bono de bienvenida y cambios de Inicio y onboarding (ajuste ya documentado en la spec de registro y primer escaneo).
- Modo operador y registro de donaciones, voluntariado o asistencia (Fase 2, otra historia).
- Backoffice del admin para ajustes, regalos, configuración de montos o desactivación de QR (otra historia).
- Predicciones deportivas (Fase 3).
- Filtros, búsqueda o exportación del historial.
- Detalle individual de un movimiento.
- Notificación push por movimientos generados por la propia acción del usuario.
- Pasarela de pagos, reconocimiento facial, API de casas de apuestas, chat, streaming, multiidioma y login con redes sociales (fuera de alcance global de la constitution).

## 4. Actores

- **Usuario final (estudiante UCV, egresado o externo)**: persona con cuenta confirmada que consulta su saldo de Beats, su historial y cómo ganar más.
- **Sistema**: único actor que crea movimientos de Beats y actualiza el saldo.
- **Equipo técnico de Latidos (transitorio)**: registra ajustes y regalos mientras no exista el backoffice, siempre como movimientos con nombre.

## 5. Precondiciones

- El usuario tiene sesión iniciada y ya vio el onboarding.
- La cuenta recibió el bono de bienvenida al confirmar el correo, registrado como movimiento.
- Todo cambio de saldo previo a esta historia (escaneos ya hechos) existe como movimiento consultable.
- Las marcas tienen nombre; el logo es opcional.

## 6. Disparador

- El usuario toca el tab "Beats" de la barra inferior, o toca la card del contador en Inicio.

## 7. Flujo Principal

1. El usuario toca el tab "Beats" o la card del contador en Inicio.
2. La pantalla abre de inmediato con lo último guardado en el dispositivo, si lo hay, y pide los datos actuales.
3. Arriba se muestran el título "BEATS", el botón "¿Cómo gano Beats?" y la card del contador con el saldo actual, sin animación de entrada.
4. Debajo del contador, una línea recuerda: "Pronto podrás cambiarlos por entradas al concierto, merch y cursos".
5. Debajo se muestra el historial agrupado por día, del más reciente al más antiguo. El día más reciente con movimientos viene abierto y los demás cerrados.
6. Cada línea de día muestra la etiqueta del día, el total neto del día y, si hubo escaneos, cuántos.
7. El usuario abre o cierra días tocando su línea. Puede tener varios abiertos a la vez.
8. Dentro de cada día, cada movimiento se muestra como una fila fija, del más reciente al más antiguo: ícono (logo de la marca, inicial o ícono de Latidos), nombre, Beats con signo y hora.
9. Al bajar, se cargan lotes de 7 días más, hasta llegar al primer movimiento de la cuenta.
10. Si el usuario toca "¿Cómo gano Beats?", se abre la hoja inferior con "Cómo los ganas" y "En qué los cambias". Al cerrarla, vuelve a la pantalla en el mismo punto.
11. Si el saldo cambia con la pantalla abierta, el contador sube con su animación, aparece la fila nueva en su día y el cambio se anuncia a lectores de pantalla.
12. El usuario sale a Inicio, al escáner o a otro tab desde la barra inferior.

## 8. Flujos Alternativos

1. **Usuario sin escaneos (solo bienvenida u otros movimientos de Latidos):**
   - El historial muestra el día con la fila "Bienvenida a Latidos · +5".
   - Debajo aparece desplegada la explicación de cómo ganar, con el mismo contenido de la hoja, más una línea guía hacia el primer escaneo y el botón "Escanear".
   - "Escanear" abre el mismo escáner que el botón central de la barra.
   - Con el primer escaneo, la explicación desplegada desaparece y la explicación queda solo en el botón "¿Cómo gano Beats?".

2. **Sin conexión, con datos guardados:**
   - Se muestran el saldo y el historial guardados.
   - Arriba aparece un aviso: "Sin conexión. Así estaban tus Beats a las [hora]", con el día si no fue hoy ("ayer, 9:10 pm").
   - Al volver la señal, la pantalla se actualiza sola y el aviso desaparece.
   - No se pueden cargar días más antiguos que los guardados mientras no haya señal.

3. **Sin conexión y sin datos guardados:**
   - Se muestra la pantalla completa de sin conexión con su ilustración y un texto que invita a volver cuando haya señal.
   - Al volver la señal, se carga la pantalla normal.

4. **Con conexión, pero falla la carga:**
   - Se muestra lo guardado, con el aviso "No pudimos actualizar" y un botón "Reintentar".
   - Si no hay nada guardado, se muestra el mismo mensaje con "Reintentar" en lugar del historial.

5. **Saldo cambia con la pantalla abierta:**
   - El contador anima del valor anterior al nuevo.
   - La fila nueva aparece en su día. Si el día no existía, se crea arriba y se abre.
   - El cambio se anuncia a lectores de pantalla.

6. **El canal en vivo se cae:**
   - La pantalla sigue mostrando lo último cargado, sin error visible.
   - Se pone al día la próxima vez que el usuario entra a la pantalla.

7. **Marca sin logo:**
   - La fila muestra un círculo con la inicial del nombre de la marca.

8. **QR desactivado o marca que cambió nombre o logo:**
   - La fila sigue visible, con el nombre y el logo actuales de la marca.
   - Los Beats de la fila no cambian.

9. **Ajuste o regalo de Latidos:**
   - Aparece como fila con el ícono de Latidos y el nombre "Ajuste Latidos" o "Regalo Latidos".
   - Un ajuste que resta se muestra con signo menos en color de texto normal.
   - Un ajuste que dejaría el saldo bajo cero se rechaza y no se registra.

10. **Historial largo:**
    - Se cargan primero los 7 días más recientes con movimientos, y lotes de 7 días más al bajar.

11. **Cierre de sesión:**
    - Se borra lo guardado en el dispositivo para ver sin conexión.

12. **Sin sesión o sin onboarding visto:**
    - Se redirige igual que en Inicio: a la bienvenida si no hay sesión, al onboarding si no lo vio.

## 9. Reglas de Negocio

1. El saldo mostrado siempre coincide con la suma de los movimientos del historial.
2. Nada cambia el saldo sin crear un movimiento con tipo y nombre. Nunca se edita el saldo directamente.
3. Solo el sistema crea movimientos. El dispositivo del usuario nunca puede crear, editar ni borrar movimientos ni modificar el saldo.
4. El saldo nunca puede quedar negativo.
5. Los Beats de cada movimiento quedan fijos al momento en que ocurrió, aunque luego cambie el valor configurado del QR o la acción.
6. Un QR o una marca con movimientos no se borra: se desactiva. Sus movimientos siguen visibles en el historial.
7. El historial muestra siempre el nombre y el logo actuales de la marca. Si no hay logo, muestra la inicial.
8. El día de un movimiento es el día calendario en hora de Caracas, con el mismo corte de medianoche del límite diario de escaneo.
9. Cada usuario solo puede ver sus propios movimientos.
10. El contenido de "cómo ganar" y "en qué los cambias" es el mismo en la hoja de la pantalla de Beats y en el onboarding.
11. "Cómo ganar" no muestra montos fijos por escanear ("Cada marca da distinto"). Las formas de ganar y las recompensas no disponibles se muestran atenuadas con la etiqueta "Pronto" y no son interactivas.
12. La pantalla no muestra cifras ni progreso hacia recompensas mientras el canje no esté abierto.
13. Los movimientos generados por una acción del propio usuario (escanear, la bienvenida, a futuro donar frente a un operador) no disparan notificación push.
14. El contador se ve igual en Inicio y en la pantalla de Beats: card de vidrio, número grande en navy, barra de acento y halo amarillo.
15. La pantalla de éxito del escaneo no cambia: no incluye un acceso a la pantalla de Beats.
16. El tipo de movimiento contempla desde ahora los tipos futuros (donación, voluntariado, predicción, canje) para que la pantalla no requiera cambios de estructura cuando lleguen.

## 10. Suposiciones

### Funcionales
1. El título visible de la pantalla es "BEATS", en tipografía display, y el botón "¿Cómo gano Beats?" va a la derecha del título, como botón ghost azul. *(validada)*
2. Dentro de cada día, los movimientos se ordenan del más reciente al más antiguo. Los días siguen el mismo orden. *(validada)*
3. La línea cerrada de un día cuenta solo escaneos ("3 escaneos"). Un día que solo tiene la bienvenida o ajustes muestra solo el total, sin conteo. *(validada)*
4. El total de un día es la suma neta de sus movimientos. Hoy siempre es positiva, pero queda lista para cuando existan restas. *(validada)*
5. La hora de cada fila va en formato de 12 horas con am/pm ("3:45 pm"). *(validada)*
6. La fecha de los días que no son hoy ni ayer se muestra sin año ("MIÉRCOLES 30 SEPT"), porque el programa no repite meses entre 2026 y 2027. *(validada)*
7. La pantalla carga primero los 7 días más recientes con movimientos y trae lotes de 7 días más a medida que la persona baja. *(validada)*
8. La explicación desplegada de "cómo ganar" aparece mientras la persona no tenga ningún escaneo, aunque tenga la bienvenida u otros movimientos de Latidos. *(validada)*
9. En ese estado inicial, el botón "Escanear" abre el mismo escáner que el botón central de la barra. *(validada)*
10. Las formas de ganar marcadas "Pronto" y las recompensas de "En qué los cambias" no se pueden tocar: son solo informativas. *(validada)*
11. Al entrar a la pantalla, el número aparece directo, sin animación. La animación solo ocurre cuando el saldo cambia con la pantalla abierta. *(validada)*
12. No hay gesto de arrastrar hacia abajo para refrescar: la pantalla se actualiza sola al entrar y en vivo. *(validada)*
13. El aviso sin conexión muestra la hora de la última actualización exitosa. Si fue otro día, incluye el día ("ayer, 9:10 pm"). *(validada)*
14. Los movimientos de Latidos (bienvenida, ajuste, regalo) llevan el ícono de Latidos. Un ajuste que resta se muestra con signo menos, en el color de texto normal, no en rojo. *(validada)*
15. Cuando el saldo sube en vivo, el cambio se anuncia a los lectores de pantalla ("Sumaste 10 Beats"). *(validada)*

### Usuarios
16. La pantalla exige sesión iniciada y onboarding visto. Si falta alguno, redirige igual que Inicio. *(validada)*
17. Lo guardado en el dispositivo para ver sin conexión se borra al cerrar sesión, para que otra persona no vea esos Beats en un teléfono compartido. *(validada)*

### Datos
18. Cada movimiento guarda su tipo (escaneo, bienvenida, ajuste, regalo, y a futuro donación, voluntariado, predicción y canje), la cantidad de Beats con signo, el momento en que ocurrió y la marca si es un escaneo. *(validada)*
19. Los ajustes y regalos llevan un nombre fijo ("Ajuste Latidos", "Regalo Latidos"), sin un motivo escrito visible para la persona. *(validada)*
20. Los escaneos hechos antes de esta historia aparecen en el historial desde el primer día, cada uno con su fecha real. *(validada)*
21. La bienvenida que reciben las cuentas ya existentes aparece con la fecha del momento en que se otorgó, no con la fecha de registro. *(validada)*
22. El saldo nunca puede quedar negativo. Un ajuste que lo dejaría bajo cero se rechaza. *(validada)*

### Permisos
23. Cada persona solo ve sus propios movimientos. Nadie puede ver el historial de otro usuario desde la app. *(validada)*
24. Los movimientos solo los crea el sistema, nunca el usuario desde su dispositivo. Mientras no exista el backoffice, los ajustes y regalos los registra el equipo técnico, siguiendo la misma regla de dejar fila. *(validada)*

### Integraciones
25. La actualización en vivo depende de un canal de eventos en tiempo real. Si ese canal se cae, la pantalla sigue funcionando y se pone al día la próxima vez que la persona entra. *(validada)*
26. Lo que se ve sin conexión sale de un almacenamiento local en el dispositivo, que se actualiza cada vez que la pantalla carga con éxito. *(validada)*

## 11. Criterios de Aceptacion

1. Dado que el usuario está en cualquier pantalla con la barra inferior, cuando toca el tab "Beats", entonces llega a la pantalla de Beats y el tab se muestra activo.
2. Dado que el usuario está en Inicio, cuando toca la card del contador, entonces llega a la pantalla de Beats.
3. Dado que el usuario confirma un escaneo, cuando ve la pantalla de éxito, entonces esta no incluye un acceso a la pantalla de Beats.
4. Dado que el usuario entra a la pantalla de Beats, cuando carga, entonces ve el título "BEATS", el botón "¿Cómo gano Beats?", el contador con su saldo sin animación de entrada y la línea "Pronto podrás cambiarlos por entradas al concierto, merch y cursos".
5. Dado que el usuario tiene movimientos en varios días, cuando entra a la pantalla, entonces el día más reciente aparece abierto y los demás cerrados, ordenados del más reciente al más antiguo.
6. Dado que un día está cerrado, cuando el usuario lo ve, entonces la línea muestra la etiqueta del día ("HOY", "AYER" o día y fecha sin año), el total neto y el número de escaneos si hubo alguno.
7. Dado que un día solo tiene movimientos de Latidos, cuando se muestra cerrado, entonces la línea muestra el total sin conteo de escaneos.
8. Dado que el usuario tiene un día abierto, cuando toca otro día cerrado, entonces ambos quedan abiertos.
9. Dado que un día está abierto, cuando el usuario ve sus filas, entonces cada una muestra ícono, nombre, Beats con signo y hora en formato de 12 horas, ordenadas de la más reciente a la más antigua.
10. Dado que el usuario toca una fila de movimiento, cuando lo hace, entonces no se abre ningún detalle.
11. Dado que una marca no tiene logo, cuando su fila se muestra, entonces aparece un círculo con la inicial de la marca.
12. Dado que el QR de una marca fue desactivado, cuando el usuario ve su historial, entonces las filas de esa marca siguen visibles con su nombre.
13. Dado que una marca cambió de nombre o de logo, cuando el usuario ve sus filas antiguas, entonces muestran el nombre y el logo actuales, con los mismos Beats que tenían.
14. Dado que el admin cambió los Beats de un QR, cuando el usuario ve escaneos anteriores de ese QR, entonces conservan los Beats que otorgaron en su momento.
15. Dado que el usuario tiene la bienvenida, cuando la ve en su historial, entonces aparece como "Bienvenida a Latidos · +5" con el ícono de Latidos.
16. Dado que el usuario no tiene escaneos, cuando entra a la pantalla, entonces ve debajo de su historial la explicación de cómo ganar desplegada, una línea guía y el botón "Escanear".
17. Dado que el usuario está en el estado sin escaneos, cuando toca "Escanear", entonces se abre el escáner.
18. Dado que el usuario hace su primer escaneo, cuando vuelve a la pantalla de Beats, entonces la explicación desplegada ya no aparece y el escaneo figura en su día.
19. Dado que el usuario toca "¿Cómo gano Beats?", cuando se abre la hoja, entonces ve "Cómo los ganas", con escanear QR de marcas y "Cada marca da distinto", donar, voluntariado y actividades atenuados con "Pronto"; y "En qué los cambias", con concierto, merch y cursos marcados "Pronto".
20. Dado que el usuario toca un elemento marcado "Pronto", cuando lo hace, entonces no ocurre nada.
21. Dado que la pantalla está abierta, cuando el saldo del usuario cambia, entonces el contador anima al nuevo valor, aparece la fila nueva en su día y el cambio se anuncia a lectores de pantalla.
22. Dado que el usuario tiene más de 7 días con movimientos, cuando entra a la pantalla, entonces se cargan los 7 más recientes y, al bajar, se cargan los siguientes en lotes de 7.
23. Dado que no hay conexión y hay datos guardados, cuando el usuario entra, entonces ve lo guardado con el aviso "Sin conexión. Así estaban tus Beats a las [hora]", con el día si no fue hoy.
24. Dado que el aviso sin conexión está visible, cuando vuelve la señal, entonces la pantalla se actualiza sola y el aviso desaparece.
25. Dado que no hay conexión ni datos guardados, cuando el usuario entra, entonces ve la pantalla completa de sin conexión.
26. Dado que hay conexión pero la carga falla, cuando el usuario entra, entonces ve lo guardado, si lo hay, con el aviso "No pudimos actualizar" y un botón "Reintentar".
27. Dado que el usuario cierra sesión, cuando otra persona abre la app en ese dispositivo, entonces no ve los Beats guardados del usuario anterior.
28. Dado que el usuario no tiene sesión o no vio el onboarding, cuando intenta abrir la pantalla de Beats, entonces es redirigido igual que desde Inicio.
29. Dado cualquier usuario, cuando se compara su saldo con la suma de sus movimientos, entonces ambos coinciden.
30. Dado que se intenta registrar un ajuste que dejaría el saldo bajo cero, cuando se procesa, entonces se rechaza y no se crea el movimiento.
31. Dado que un usuario intenta crear o modificar un movimiento o su saldo desde su dispositivo, cuando se procesa, entonces se rechaza.
32. Dado que un usuario consulta movimientos, cuando se procesa la consulta, entonces solo obtiene los propios.
33. Dado que el usuario suma Beats por su propia acción, cuando se registra el movimiento, entonces no recibe notificación push.

## 12. BDD / Gherkin

```gherkin
# language: es

Caracteristica: Acceso a la pantalla de Beats
  Como usuario de Latidos
  Quiero llegar a mis Beats desde donde veo mi saldo
  Para revisar el detalle sin buscarlo

  Escenario: Entrar desde el tab
    Dado que tengo sesion iniciada y vi el onboarding
    Cuando toco el tab "Beats"
    Entonces veo la pantalla de Beats y el tab aparece activo

  Escenario: Entrar desde la card del contador
    Dado que estoy en Inicio
    Cuando toco la card del contador
    Entonces veo la pantalla de Beats

  Escenario: La pantalla de exito del escaneo no cambia
    Dado que confirme un escaneo
    Cuando veo la pantalla de exito
    Entonces no hay un acceso a la pantalla de Beats

  Escenario: Sin sesion
    Dado que no tengo sesion iniciada
    Cuando intento abrir la pantalla de Beats
    Entonces soy redirigido a la bienvenida

Caracteristica: Saldo y recordatorio
  Como usuario de Latidos
  Quiero ver mi saldo y para que sirve
  Para saber donde estoy parado

  Escenario: Ver el saldo al entrar
    Dado que tengo 35 Beats
    Cuando entro a la pantalla de Beats
    Entonces veo 35 en el contador sin animacion de entrada
    Y veo la linea "Pronto podras cambiarlos por entradas al concierto, merch y cursos"

  Escenario: El saldo cuadra con el historial
    Dado que tengo movimientos de +5, +10 y +20
    Cuando veo mi saldo
    Entonces el contador muestra 35

Caracteristica: Historial por dia
  Como usuario de Latidos
  Quiero ver de donde salio cada Beat
  Para confiar en mi saldo

  Escenario: Dia mas reciente abierto
    Dado que tengo movimientos hoy y ayer
    Cuando entro a la pantalla de Beats
    Entonces el dia "HOY" aparece abierto y "AYER" cerrado

  Escenario: Linea de dia cerrado
    Dado que ayer escanee 3 marcas por un total de 25 Beats
    Cuando veo el dia "AYER" cerrado
    Entonces dice "+25" y "3 escaneos"

  Escenario: Dia solo con bienvenida
    Dado que mi unico movimiento de un dia es la bienvenida
    Cuando veo ese dia cerrado
    Entonces muestra "+5" sin conteo de escaneos

  Escenario: Varios dias abiertos
    Dado que tengo el dia "HOY" abierto
    Cuando toco el dia "AYER"
    Entonces ambos dias quedan abiertos

  Escenario: Fila de escaneo
    Dado que escanee KFC a las 3:20 pm
    Cuando abro ese dia
    Entonces veo una fila con el logo de KFC, "KFC", "+10" y "3:20 pm"
    Y tocar la fila no abre ningun detalle

  Escenario: Marca sin logo
    Dado que la marca Pepsi no tiene logo
    Cuando veo una fila de Pepsi
    Entonces veo un circulo con la letra "P"

  Escenario: QR desactivado
    Dado que escanee Movistar y luego su QR fue desactivado
    Cuando veo mi historial
    Entonces la fila de Movistar sigue visible con su nombre

  Escenario: Marca que cambio de nombre
    Dado que escanee "Movistar" por 20 Beats
    Y la marca ahora se llama "Movistar Navidad"
    Cuando veo esa fila
    Entonces dice "Movistar Navidad" y "+20"

  Escenario: Valor del QR cambiado despues
    Dado que escanee KFC cuando daba 10 Beats
    Y el admin lo cambio a 20
    Cuando veo esa fila
    Entonces sigue diciendo "+10"

  Escenario: Historial largo
    Dado que tengo 20 dias con movimientos
    Cuando entro a la pantalla de Beats
    Entonces se cargan los 7 dias mas recientes
    Y al bajar se cargan los siguientes 7

Caracteristica: Estado inicial sin escaneos
  Como usuario recien registrado
  Quiero saber como empezar a sumar
  Para hacer mi primer escaneo

  Escenario: Solo bienvenida
    Dado que mi unico movimiento es "Bienvenida a Latidos +5"
    Cuando entro a la pantalla de Beats
    Entonces veo la fila de bienvenida con el icono de Latidos
    Y debajo la explicacion de como ganar, una linea guia y el boton "Escanear"

  Escenario: Ir a escanear desde el estado inicial
    Dado que veo el estado sin escaneos
    Cuando toco "Escanear"
    Entonces se abre el escaner

  Escenario: Despues del primer escaneo
    Dado que hice mi primer escaneo
    Cuando vuelvo a la pantalla de Beats
    Entonces ya no veo la explicacion desplegada
    Y mi escaneo aparece en su dia

Caracteristica: Como gano Beats
  Como usuario de Latidos
  Quiero consultar como ganar Beats y en que cambiarlos
  Para saber que hacer despues

  Escenario: Abrir la hoja
    Dado que estoy en la pantalla de Beats
    Cuando toco "¿Como gano Beats?"
    Entonces veo "Como los ganas" con escanear QR de marcas y "Cada marca da distinto"
    Y donar, voluntariado y actividades aparecen atenuados con "Pronto"
    Y veo "En que los cambias" con concierto, merch y cursos marcados "Pronto"

  Escenario: Elementos no disponibles
    Dado que veo la hoja de como ganar
    Cuando toco "Dona insumos"
    Entonces no ocurre nada

Caracteristica: Actualizacion en vivo
  Como usuario de Latidos
  Quiero ver mis Beats subir en el momento
  Para confiar en que se sumaron

  Escenario: El saldo cambia con la pantalla abierta
    Dado que estoy mirando la pantalla de Beats con 35 Beats
    Cuando se registra un movimiento de +10 en mi cuenta
    Entonces el contador anima hasta 45
    Y aparece la fila nueva en su dia
    Y el cambio se anuncia a lectores de pantalla

  Escenario: Sin notificacion push por mi propia accion
    Dado que escanee un QR y confirme el canje
    Cuando se registra el movimiento
    Entonces no recibo una notificacion push

Caracteristica: Sin conexion y errores
  Como usuario de Latidos
  Quiero ver mis Beats aunque no tenga senal
  Para no quedarme sin informacion en el evento

  Escenario: Sin conexion con datos guardados
    Dado que abri la pantalla de Beats antes a las 3:40 pm
    Y ahora no tengo conexion
    Cuando entro a la pantalla de Beats
    Entonces veo mis Beats guardados
    Y el aviso "Sin conexion. Asi estaban tus Beats a las 3:40 pm"

  Escenario: Vuelve la senal
    Dado que veo el aviso sin conexion
    Cuando vuelve la senal
    Entonces la pantalla se actualiza sola y el aviso desaparece

  Escenario: Sin conexion y sin datos guardados
    Dado que nunca abri la pantalla de Beats con conexion
    Y no tengo conexion
    Cuando entro a la pantalla de Beats
    Entonces veo la pantalla completa de sin conexion

  Escenario: Falla la carga con conexion
    Dado que tengo conexion pero la carga falla
    Cuando entro a la pantalla de Beats
    Entonces veo lo guardado con el aviso "No pudimos actualizar" y el boton "Reintentar"

  Escenario: Cerrar sesion borra lo guardado
    Dado que cerre sesion en mi telefono
    Cuando otra persona abre la app en ese telefono
    Entonces no ve mis Beats guardados

Caracteristica: Integridad de los Beats
  Como programa Latidos
  Quiero que cada Beat tenga origen
  Para que el saldo sea confiable

  Escenario: Ajuste que resta
    Dado que tengo 40 Beats
    Cuando el equipo registra un "Ajuste Latidos" de -10
    Entonces mi saldo es 30
    Y veo la fila "Ajuste Latidos -10" con el icono de Latidos

  Escenario: Ajuste que dejaria saldo negativo
    Dado que tengo 5 Beats
    Cuando se intenta registrar un ajuste de -10
    Entonces se rechaza y no se crea el movimiento

  Escenario: Intento de modificar desde el dispositivo
    Dado que soy un usuario autenticado
    Cuando intento crear un movimiento o cambiar mi saldo desde mi dispositivo
    Entonces la operacion se rechaza

  Escenario: Privacidad del historial
    Dado que soy un usuario autenticado
    Cuando consulto movimientos
    Entonces solo obtengo los mios
```

## 13. Wireframes ASCII

### Pantalla de Beats (con historial)

```
+------------------------------------------+
|  BEATS               [ ¿Como gano Beats? ]|
|                                          |
|   +----------------------------------+   |
|   |               45                 |   |
|   |              ====                |   |
|   |              BEATS               |   |
|   +----------------------------------+   |
|                                          |
|  Pronto podras cambiarlos por entradas   |
|  al concierto, merch y cursos.           |
|                                          |
|  HOY                +10 · 1 escaneo   ^  |
|    [K] KFC                  +10  4:10 pm |
|  ---------------------------------------  |
|  AYER               +30 · 3 escaneos  v  |
|  ---------------------------------------  |
|  LUNES 28 SEPT      +5                v  |
|                                          |
+------------------------------------------+
| [Inicio] [Pulso] [(Escanear)] [Beats] [Perfil] |
+------------------------------------------+
```

- El contador tiene el mismo tratamiento que en Inicio: card de vidrio, número en navy, barra de acento y halo amarillo.
- Tocar una línea de día la abre o la cierra. Pueden estar varias abiertas.
- Las filas de movimiento no son tocables.
- Al bajar se cargan lotes de 7 días más.

### Pantalla de Beats (usuario sin escaneos)

```
+------------------------------------------+
|  BEATS               [ ¿Como gano Beats? ]|
|                                          |
|   +----------------------------------+   |
|   |                5                 |   |
|   |              ====                |   |
|   |              BEATS               |   |
|   +----------------------------------+   |
|                                          |
|  Pronto podras cambiarlos por entradas   |
|  al concierto, merch y cursos.           |
|                                          |
|  HOY                +5                ^  |
|    [L] Bienvenida a Latidos  +5  2:15 pm |
|                                          |
|  COMO LOS GANAS                          |
|  [QR] Escanea QR de marcas               |
|       Cada marca da distinto             |
|  [..] Dona insumos             (Pronto)  |
|  [..] Haz voluntariado         (Pronto)  |
|  [..] Asiste a actividades     (Pronto)  |
|                                          |
|  Escanea tu primer QR para sumar.        |
|           [ Escanear ]                   |
+------------------------------------------+
| [Inicio] [Pulso] [(Escanear)] [Beats] [Perfil] |
+------------------------------------------+
```

- La explicación desplegada desaparece con el primer escaneo.
- [L] es el ícono de Latidos.

### Hoja "¿Como gano Beats?"

```
+------------------------------------------+
|                  ----                    |
|  COMO LOS GANAS                          |
|  [QR] Escanea QR de marcas               |
|       Cada marca da distinto             |
|  [..] Dona insumos             (Pronto)  |
|  [..] Haz voluntariado         (Pronto)  |
|  [..] Asiste a actividades     (Pronto)  |
|                                          |
|  EN QUE LOS CAMBIAS                      |
|  [img] Entradas al concierto   (Pronto)  |
|  [img] Merch de Latidos        (Pronto)  |
|  [img] Cursos universitarios   (Pronto)  |
|                                          |
+------------------------------------------+
```

- Se cierra arrastrando hacia abajo o tocando fuera de la hoja.
- Los elementos "Pronto" están atenuados y no son tocables.
- El contenido es el mismo que el de la pantalla 2 del onboarding.

### Sin conexion con datos guardados

```
+------------------------------------------+
|  | Sin conexion. Asi estaban tus Beats   |
|  | a las 3:40 pm                         |
|                                          |
|  BEATS               [ ¿Como gano Beats? ]|
|   +----------------------------------+   |
|   |               45                 |   |
|   |              BEATS               |   |
|   +----------------------------------+   |
|  HOY                +10 · 1 escaneo   ^  |
|    [K] KFC                  +10  4:10 pm |
|  ...                                     |
+------------------------------------------+
```

- El aviso es un toast con borde izquierdo en color de alerta.
- Desaparece solo al volver la señal.
- Con conexión y falla de carga, el aviso dice "No pudimos actualizar" y trae un botón [ Reintentar ].

### Sin conexion y sin datos guardados

```
+------------------------------------------+
|                                          |
|        [ilustracion sin conexion]        |
|                                          |
|    Necesitas conexion para ver tus       |
|    Beats por primera vez. Vuelve a       |
|    intentarlo cuando tengas senal.       |
|                                          |
+------------------------------------------+
| [Inicio] [Pulso] [(Escanear)] [Beats] [Perfil] |
+------------------------------------------+
```
