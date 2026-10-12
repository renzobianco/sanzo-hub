-- Sanzo Hub — esquema compartido (Santino + Renzo)
-- Pegá TODO este archivo en Supabase → SQL Editor → New query → Run.
-- Se puede correr varias veces sin romper nada (usa IF NOT EXISTS / OR REPLACE).

-- ---------- Tablas ----------
-- "sanzo_state" guarda los documentos únicos: la configuración general
-- (id = 'settings') y la ficha de cada socio (id = 'partner_santino' / 'partner_renzo').
create table if not exists sanzo_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists sanzo_products (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists sanzo_sales (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sanzo_expenses (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sanzo_orders (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sanzo_goals (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sanzo_followers (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sanzo_clients (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sanzo_phases (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists sanzo_stock_log (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists sanzo_content_posts (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sanzo_notes (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Función atómica para ajustar stock ----------
-- Evita pisadas cuando los dos socios venden al mismo tiempo: todo el cálculo
-- (sumar/restar y no bajar de cero) ocurre en un único UPDATE en la base.
create or replace function adjust_product_stock(p_id text, stock_delta int, initial_delta int default 0)
returns void
language plpgsql
security definer
as $$
begin
  update sanzo_products
  set payload = jsonb_set(
        jsonb_set(
          payload,
          '{stock}',
          to_jsonb(greatest(0, coalesce((payload->>'stock')::int, 0) + stock_delta))
        ),
        '{initialStock}',
        to_jsonb(greatest(0, coalesce((payload->>'initialStock')::int, 0) + initial_delta))
      ),
      updated_at = now()
  where id = p_id;
end;
$$;

grant execute on function adjust_product_stock(text, int, int) to anon, authenticated;

-- ---------- Row Level Security ----------
-- Sin login de por medio: cualquiera con el link de la app (vos y Santino) lee y escribe.
-- Es la llave "publishable/anon", no la "secret" — nunca se expone la secret en el navegador.
alter table sanzo_state enable row level security;
alter table sanzo_products enable row level security;
alter table sanzo_sales enable row level security;
alter table sanzo_expenses enable row level security;
alter table sanzo_orders enable row level security;
alter table sanzo_goals enable row level security;
alter table sanzo_followers enable row level security;
alter table sanzo_clients enable row level security;
alter table sanzo_phases enable row level security;
alter table sanzo_stock_log enable row level security;
alter table sanzo_content_posts enable row level security;
alter table sanzo_notes enable row level security;

drop policy if exists "anon all" on sanzo_state;
create policy "anon all" on sanzo_state for all to anon, authenticated using (true) with check (true);
drop policy if exists "anon all" on sanzo_products;
create policy "anon all" on sanzo_products for all to anon, authenticated using (true) with check (true);
drop policy if exists "anon all" on sanzo_sales;
create policy "anon all" on sanzo_sales for all to anon, authenticated using (true) with check (true);
drop policy if exists "anon all" on sanzo_expenses;
create policy "anon all" on sanzo_expenses for all to anon, authenticated using (true) with check (true);
drop policy if exists "anon all" on sanzo_orders;
create policy "anon all" on sanzo_orders for all to anon, authenticated using (true) with check (true);
drop policy if exists "anon all" on sanzo_goals;
create policy "anon all" on sanzo_goals for all to anon, authenticated using (true) with check (true);
drop policy if exists "anon all" on sanzo_followers;
create policy "anon all" on sanzo_followers for all to anon, authenticated using (true) with check (true);
drop policy if exists "anon all" on sanzo_clients;
create policy "anon all" on sanzo_clients for all to anon, authenticated using (true) with check (true);
drop policy if exists "anon all" on sanzo_phases;
create policy "anon all" on sanzo_phases for all to anon, authenticated using (true) with check (true);
drop policy if exists "anon all" on sanzo_stock_log;
create policy "anon all" on sanzo_stock_log for all to anon, authenticated using (true) with check (true);
drop policy if exists "anon all" on sanzo_content_posts;
create policy "anon all" on sanzo_content_posts for all to anon, authenticated using (true) with check (true);
drop policy if exists "anon all" on sanzo_notes;
create policy "anon all" on sanzo_notes for all to anon, authenticated using (true) with check (true);

-- ---------- Realtime ----------
-- Así cuando uno carga algo, al otro le aparece solo, sin recargar la página.
alter publication supabase_realtime add table
  sanzo_state,
  sanzo_products,
  sanzo_sales,
  sanzo_expenses,
  sanzo_orders,
  sanzo_goals,
  sanzo_followers,
  sanzo_clients,
  sanzo_phases,
  sanzo_stock_log,
  sanzo_content_posts,
  sanzo_notes;

-- ---------- Storage: videos/imágenes del calendario de contenido ----------
-- Bucket público: Buffer necesita descargar el archivo desde una URL pública para
-- poder programarlo. No son secretos (van a publicarse en redes de todos modos).
insert into storage.buckets (id, name, public, file_size_limit)
values ('sanzo-content-media', 'sanzo-content-media', true, 209715200) -- 200 MB por archivo
on conflict (id) do update set public = true, file_size_limit = 209715200;

drop policy if exists "anon all sanzo-content-media" on storage.objects;
create policy "anon all sanzo-content-media"
  on storage.objects for all
  to anon, authenticated
  using (bucket_id = 'sanzo-content-media')
  with check (bucket_id = 'sanzo-content-media');
