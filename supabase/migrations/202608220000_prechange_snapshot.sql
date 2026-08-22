-- Snapshot interno porque o projeto Free não possui backup automático.
-- Não substitui uma cópia externa, mas permite comparar/restaurar as quatro tabelas alteradas.
begin;
create schema if not exists ldp_backup_20260822;
create table if not exists ldp_backup_20260822.vehicles as table public.vehicles;
create table if not exists ldp_backup_20260822.leads as table public.leads;
create table if not exists ldp_backup_20260822.store_settings as table public.store_settings;
create table if not exists ldp_backup_20260822.admin_access_requests as table public.admin_access_requests;
create table if not exists ldp_backup_20260822.policies as
select * from pg_policies where schemaname in ('public','storage');
revoke all on schema ldp_backup_20260822 from public,anon,authenticated;
revoke all on all tables in schema ldp_backup_20260822 from public,anon,authenticated;
commit;
