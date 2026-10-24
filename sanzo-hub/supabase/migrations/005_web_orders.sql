-- Pedidos de la tienda online (sanzo-web) → Sanzo Hub.
-- Pegá TODO este archivo en Supabase → SQL Editor → New query → Run. Se puede correr varias veces.
--
-- La web guarda cada pedido acá (payload con cliente, ítems, total y las `ventas` ya traducidas
-- a los productos del Hub). Cuando el pago se confirma —solo, con el aviso de Mercado Pago, o a mano
-- desde "Pedidos web" en el Hub— aplicar_pedido_web() crea esas ventas y descuenta el stock,
-- todo junto y una sola vez.

create table if not exists sanzo_web_orders (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table sanzo_web_orders enable row level security;
drop policy if exists "anon all" on sanzo_web_orders;
create policy "anon all" on sanzo_web_orders for all to anon, authenticated using (true) with check (true);

do $$
begin
  alter publication supabase_realtime add table sanzo_web_orders;
exception when duplicate_object then null;
end $$;

-- Cambia el estado del pedido sin crear ventas (pendiente de pago, rechazado, cancelado…).
-- No toca un pedido que ya se pasó a ventas.
create or replace function estado_pedido_web(p_id text, p_estado text, p_pago jsonb default null)
returns text
language plpgsql
security definer
as $$
declare
  o jsonb;
begin
  select payload into o from sanzo_web_orders where id = p_id for update;
  if o is null then return 'no_existe'; end if;
  if coalesce((o->>'aplicado')::boolean, false) then return 'ya_aplicado'; end if;
  o := jsonb_set(o, '{estado}', to_jsonb(p_estado));
  if p_pago is not null then o := jsonb_set(o, '{pago}', p_pago); end if;
  update sanzo_web_orders set payload = o, updated_at = now() where id = p_id;
  return 'ok';
end;
$$;

-- Pasa el pedido a ventas del Hub: una venta por producto (canal "Tienda online"), descuenta el
-- stock con adjust_product_stock y marca el pedido como pagado. Si ya se aplicó, no hace nada.
-- p_pago.monto (si viene) tiene que cubrir el total del pedido; si no, queda en "revisar".
create or replace function aplicar_pedido_web(p_id text, p_pago jsonb default '{}'::jsonb)
returns text
language plpgsql
security definer
as $$
declare
  o jsonb;
  v jsonb;
  hoy text := to_char(now() at time zone 'America/Argentina/Buenos_Aires', 'YYYY-MM-DD');
  ahora text := to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
begin
  select payload into o from sanzo_web_orders where id = p_id for update;
  if o is null then return 'no_existe'; end if;
  if coalesce((o->>'aplicado')::boolean, false) then return 'ya_aplicado'; end if;

  if p_pago ? 'monto' and (p_pago->>'monto')::numeric + 1 < coalesce((o->>'total')::numeric, 0) then
    update sanzo_web_orders
    set payload = jsonb_set(jsonb_set(o, '{estado}', '"revisar"'), '{pago}', p_pago), updated_at = now()
    where id = p_id;
    return 'monto_distinto';
  end if;

  for v in select * from jsonb_array_elements(coalesce(o->'ventas', '[]'::jsonb)) loop
    insert into sanzo_sales (id, payload)
    values (v->>'id', v || jsonb_build_object('date', hoy, 'createdAt', ahora, 'webOrderId', p_id))
    on conflict (id) do nothing;
    perform adjust_product_stock(v->>'productId', -coalesce((v->>'qty')::int, 0), 0);
  end loop;

  o := o || jsonb_build_object('estado', 'pagado', 'aplicado', true, 'aplicadoAt', ahora, 'pago', p_pago);
  update sanzo_web_orders set payload = o, updated_at = now() where id = p_id;
  return 'ok';
end;
$$;

grant execute on function estado_pedido_web(text, text, jsonb) to anon, authenticated;
grant execute on function aplicar_pedido_web(text, jsonb) to anon, authenticated;
