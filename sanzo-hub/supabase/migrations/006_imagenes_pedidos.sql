-- Sanzo Hub — bucket para las imágenes que suben los clientes en la web para grabar en el parche.
-- Pegá TODO este archivo en Supabase → SQL Editor → New query → Run. Se puede correr varias veces.
--
-- La web (sanzo-web, /api/imagen) sube la imagen original apenas el cliente la elige en "Personalizar",
-- y el link viaja con el pedido: se ve en "Pedidos web" del Hub para descargarla y grabarla.
-- Público para que el Hub la muestre sin login. Los nombres son al azar (no se pueden adivinar).
-- Solo imágenes, hasta 10 MB. La web no puede borrar ni pisar: solo subir y leer.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sanzo-pedidos', 'sanzo-pedidos', true, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'])
on conflict (id) do update set public = true, file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];

drop policy if exists "anon subir sanzo-pedidos" on storage.objects;
create policy "anon subir sanzo-pedidos"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'sanzo-pedidos');

drop policy if exists "anon ver sanzo-pedidos" on storage.objects;
create policy "anon ver sanzo-pedidos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'sanzo-pedidos');
