# Pasos manuales — Beats: balance e historial (Fases 2 a 6)

Documento vivo: se actualiza al terminar cada fase. Si el trabajo se detuvo a
la mitad, la seccion 1 dice hasta donde se llego.

Rama de trabajo: `claude/beats-fases-2-6` (parte del ultimo commit de
`claude/beats-fase1-libro-movimientos`).

## 1. Estado

- **Fase 1** (libro de movimientos, bono y carga retroactiva): HECHA. Las seis
  migraciones `20260929120000` a `20260929120500` estan aplicadas y
  verificadas en produccion. Falta desplegar su codigo (ver seccion 2).
- **Fase 2** (pantalla de Beats con historial): HECHA. T016 a T026.
  Suite completa al cerrar la fase: 159 pruebas pasan, 3 omitidas (las de
  rendimiento, que solo corren con `PROBAR_RENDIMIENTO=1`).
- **Fase 3** (como ganar y estado inicial): HECHA. T027 a T033.
  Suite completa al cerrar la fase: todas las pruebas de las Fases 1 a 3
  pasan (170 en esa corrida, 3 omitidas de rendimiento). Esa corrida incluyo
  por error el archivo de pruebas de la Fase 4, todavia sin construir; sus 7
  fallos son de ese archivo y no cuentan para la Fase 3.
- **Fase 4** (actualizacion en vivo): HECHA. T034 a T038.
  Suite completa al cerrar la fase: 181 pruebas pasan, 3 omitidas (las de
  rendimiento).
- **Fase 5** (sin conexion y errores): HECHA. T039 a T045.
  Suite completa al cerrar la fase: 190 pruebas pasan, 3 omitidas (las de
  rendimiento). Despues, revisando capturas sin red, aparecio que las
  imagenes de next/image salian rotas sin conexion; se corrigio en el service
  worker y lo cubre la suite final de la Fase 6.
- **Fase 6** (polish y QA): en curso.

## 2. Pasos en produccion

Se completa al terminar las fases.

## 3. Recorrido en telefono real (T052 / V033)

Se completa al terminar las fases.

## 4. Como probar cada fase a mano

Se completa al terminar las fases.

## 5. Decisiones tomadas que no estaban en el plan

Se completa a medida que se toman.

## 6. Riesgos y cosas que no se pudieron verificar aqui

Se completa a medida que aparecen.

## 7. Sugerencias para la Fase 1

Se completa a medida que aparecen.
