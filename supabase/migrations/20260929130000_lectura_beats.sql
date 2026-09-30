-- Latidos App - Beats, Fase 2 (T016)
-- Lectura de la pantalla de Beats: resumen del saldo e historial por dias.
-- Escrita para poder pegarse en el SQL Editor mas de una vez.

/*
 * Las dos funciones son de solo lectura y corren con los permisos de quien
 * llama (security invoker, el default): la RLS de `usuarios` y de
 * `movimientos_beats` sigue decidiendo que filas se ven, asi que cada persona
 * solo puede leer lo suyo aunque alguien llame la funcion con otros datos
 * (spec §9 regla 9). La persona sale de la sesion, nunca de un parametro.
 *
 * Existen como funciones, y no como consultas del cliente sobre las tablas,
 * porque el historial necesita agrupar por dia y cortar por dias completos
 * (plan §4, decision 9): con una consulta por filas, un lote podria partir un
 * dia a la mitad.
 */

-- ------------------------------------------------------------ Resumen -------

/*
 * Lo minimo para decidir que mostrar al abrir la pantalla (plan §3, "Leer
 * resumen de Beats"): el saldo, si la persona ya escaneo alguna vez (decide el
 * estado inicial) y si ya vio el onboarding (el guardia de la pantalla).
 *
 * Sin sesion, o sin perfil todavia, no devuelve filas: el cliente lo trata
 * igual que Inicio.
 */
create or replace function public.resumen_beats()
returns table (saldo integer, tiene_escaneos boolean, onboarding_visto boolean)
language sql
stable
set search_path = public
as $$
  select u.beats_balance,
         exists (
           select 1 from public.movimientos_beats m
            where m.usuario_id = u.id and m.tipo = 'escaneo'
         ),
         u.onboarding_visto
    from public.usuarios u
   where u.id = auth.uid();
$$;

revoke all on function public.resumen_beats() from public, anon;
grant execute on function public.resumen_beats() to authenticated;

-- ------------------------------------------------------------ Historial -----

/*
 * Historial por dias, del mas reciente al mas antiguo (plan §3, "Leer
 * historial por dias").
 *
 * Pagina por dias completos con un cursor de fecha: devuelve hasta
 * `p_cantidad_dias` dias con movimientos anteriores a `p_antes_de` (o los mas
 * recientes si es nulo). `siguiente_cursor` es el dia mas antiguo del lote, que
 * es lo que se pasa como `p_antes_de` para pedir el siguiente.
 *
 * Cada movimiento lleva el nombre y el logo ACTUALES de su marca, resueltos por
 * `marca_id` y no por el QR (plan §4, decision 7): si la marca cambia su nombre
 * o su logo, las filas viejas lo muestran; si el QR se desactiva, la fila sigue
 * teniendo nombre. Los Beats, en cambio, son los del movimiento, que no cambian.
 *
 * `escaneos` cuenta solo los movimientos de tipo escaneo: la bienvenida, los
 * ajustes y los regalos suman al total pero no son escaneos.
 *
 * El tamaño del lote se acota entre 1 y 31 dias para que un parametro raro no
 * convierta una pagina en una descarga del historial entero.
 */
create or replace function public.historial_beats(
  p_antes_de date default null,
  p_cantidad_dias integer default 7
)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_usuario uuid := auth.uid();
  v_cantidad integer := least(greatest(coalesce(p_cantidad_dias, 7), 1), 31);
  v_dias date[];
  v_hay_mas boolean;
  v_pagina date[];
  v_resultado jsonb;
begin
  if v_usuario is null then
    return jsonb_build_object('dias', '[]'::jsonb, 'hay_mas', false, 'siguiente_cursor', null);
  end if;

  -- Un dia de mas que los pedidos: si aparece, hay otra pagina.
  select array_agg(dia order by dia desc) into v_dias
    from (
      select distinct m.dia_local as dia
        from public.movimientos_beats m
       where m.usuario_id = v_usuario
         and (p_antes_de is null or m.dia_local < p_antes_de)
       order by 1 desc
       limit v_cantidad + 1
    ) d;

  v_dias := coalesce(v_dias, '{}');
  v_hay_mas := cardinality(v_dias) > v_cantidad;
  v_pagina := v_dias[1:v_cantidad];

  select coalesce(jsonb_agg(dia_json order by dia desc), '[]'::jsonb) into v_resultado
    from (
      select m.dia_local as dia,
             jsonb_build_object(
               'dia_local', m.dia_local,
               'total_neto', sum(m.beats),
               'escaneos', count(*) filter (where m.tipo = 'escaneo'),
               'movimientos', jsonb_agg(
                 jsonb_build_object(
                   'id', m.id,
                   'tipo', m.tipo,
                   'beats', m.beats,
                   'ocurrido_en', m.ocurrido_en,
                   'marca', case when ma.id is null then null
                                 else jsonb_build_object('nombre', ma.nombre,
                                                         'logo_url', ma.logo_url) end
                 )
                 order by m.ocurrido_en desc, m.created_at desc
               )
             ) as dia_json
        from public.movimientos_beats m
        left join public.marcas ma on ma.id = m.marca_id
       where m.usuario_id = v_usuario
         and m.dia_local = any (v_pagina)
       group by m.dia_local
    ) por_dia;

  return jsonb_build_object(
    'dias', v_resultado,
    'hay_mas', v_hay_mas,
    'siguiente_cursor', case when v_hay_mas then v_pagina[v_cantidad] end
  );
end;
$$;

revoke all on function public.historial_beats(date, integer) from public, anon;
grant execute on function public.historial_beats(date, integer) to authenticated;
