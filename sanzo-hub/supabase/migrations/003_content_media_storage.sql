-- Sanzo Hub — bucket público para los videos/imágenes del Calendario de contenido.
-- Pegá TODO este archivo en Supabase → SQL Editor → New query → Run.
-- Se puede correr varias veces sin romper nada.
--
-- Por qué es público: Buffer necesita descargar el archivo desde una URL pública
-- para poder programarlo (no acepta subida directa por su API). Los archivos NO
-- son secretos (son videos/fotos que van a publicarse en redes de todos modos),
-- así que un bucket público es lo correcto acá — a diferencia de la clave de API
-- de Buffer, que nunca toca esta base.

insert into storage.buckets (id, name, public, file_size_limit)
values ('sanzo-content-media', 'sanzo-content-media', true, 209715200) -- 200 MB por archivo
on conflict (id) do update set public = true, file_size_limit = 209715200;

-- Mismo criterio que el resto de la app: sin login de por medio, cualquiera con
-- el link de la app (vos y Santino) puede subir, ver y borrar archivos de este bucket.
drop policy if exists "anon all sanzo-content-media" on storage.objects;
create policy "anon all sanzo-content-media"
  on storage.objects for all
  to anon, authenticated
  using (bucket_id = 'sanzo-content-media')
  with check (bucket_id = 'sanzo-content-media');
