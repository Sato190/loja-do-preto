-- Compatibilidade: prefira executar as migrations em supabase/migrations.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('vehicle-images','vehicle-images',true,10485760,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public=true,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "Public can view vehicle images" on storage.objects;
drop policy if exists "Approved admins can upload vehicle images" on storage.objects;
drop policy if exists "Approved admins can update vehicle images" on storage.objects;
drop policy if exists "Approved admins can delete vehicle images" on storage.objects;
create policy "Public can view vehicle images" on storage.objects for select using (bucket_id='vehicle-images');
create policy "Approved admins can upload vehicle images" on storage.objects for insert to authenticated with check (
  bucket_id='vehicle-images' and public.is_admin(array['owner','manager','sales']::public.admin_role[])
  and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "Approved admins can update vehicle images" on storage.objects for update to authenticated using (
  bucket_id='vehicle-images' and public.is_admin(array['owner','manager','sales']::public.admin_role[])
);
create policy "Approved admins can delete vehicle images" on storage.objects for delete to authenticated using (
  bucket_id='vehicle-images' and public.is_admin(array['owner','manager']::public.admin_role[])
);
