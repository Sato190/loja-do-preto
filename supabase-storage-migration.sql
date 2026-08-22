-- Execute uma vez no SQL Editor do Supabase.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('vehicle-images','vehicle-images',true,10485760,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public=true,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;

create policy "Public can view vehicle images" on storage.objects for select using (bucket_id='vehicle-images');
create policy "Approved admins can upload vehicle images" on storage.objects for insert to authenticated with check (
  bucket_id='vehicle-images' and (
    lower(auth.jwt()->>'email')='andrenevessato04@gmail.com' or exists(select 1 from public.admin_access_requests r where r.user_id=auth.uid() and r.status='approved')
  )
);
create policy "Approved admins can update vehicle images" on storage.objects for update to authenticated using (
  bucket_id='vehicle-images' and (lower(auth.jwt()->>'email')='andrenevessato04@gmail.com' or exists(select 1 from public.admin_access_requests r where r.user_id=auth.uid() and r.status='approved'))
);
create policy "Approved admins can delete vehicle images" on storage.objects for delete to authenticated using (
  bucket_id='vehicle-images' and (lower(auth.jwt()->>'email')='andrenevessato04@gmail.com' or exists(select 1 from public.admin_access_requests r where r.user_id=auth.uid() and r.status='approved'))
);
