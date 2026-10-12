-- Sanzo Hub — agrega la tabla de Notas compartidas a una base ya existente.
-- Pegá TODO este archivo en Supabase → SQL Editor → New query → Run.
-- Se puede correr varias veces sin romper nada.

create table if not exists sanzo_notes (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table sanzo_notes enable row level security;

drop policy if exists "anon all" on sanzo_notes;
create policy "anon all" on sanzo_notes for all to anon, authenticated using (true) with check (true);

-- ALTER PUBLICATION no se puede repetir sobre una tabla ya agregada, así que lo
-- guardamos con un chequeo previo para poder correr este archivo más de una vez.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'sanzo_notes'
  ) then
    alter publication supabase_realtime add table sanzo_notes;
  end if;
end $$;
