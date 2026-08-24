begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('site-assets','site-assets',true,8388608,array['image/jpeg','image/png','image/webp','image/avif']) on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "Public reads site assets" on storage.objects;drop policy if exists "Authorized staff uploads site assets" on storage.objects;drop policy if exists "Authorized staff updates site assets" on storage.objects;drop policy if exists "Authorized staff deletes site assets" on storage.objects;
create policy "Public reads site assets" on storage.objects for select using(bucket_id='site-assets');
create policy "Authorized staff uploads site assets" on storage.objects for insert to authenticated with check(bucket_id='site-assets' and public.is_admin(array['owner','manager','marketing']::public.admin_role[]) and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Authorized staff updates site assets" on storage.objects for update to authenticated using(bucket_id='site-assets' and public.is_admin(array['owner','manager','marketing']::public.admin_role[]));
create policy "Authorized staff deletes site assets" on storage.objects for delete to authenticated using(bucket_id='site-assets' and public.is_admin(array['owner','manager']::public.admin_role[]));
commit;
