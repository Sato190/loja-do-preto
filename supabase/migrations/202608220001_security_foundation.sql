begin;

create type public.admin_role as enum ('owner','manager','marketing','sales');

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role public.admin_role not null default 'sales',
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_profiles enable row level security;

do $$ declare p record; begin
  for p in select policyname,tablename from pg_policies where schemaname='public' and tablename in ('admin_profiles','vehicles','leads','store_settings','admin_access_requests')
  loop execute format('drop policy if exists %I on public.%I',p.policyname,p.tablename); end loop;
end $$;

create or replace function public.current_admin_role()
returns public.admin_role
language sql stable security definer set search_path = public
as $$ select role from public.admin_profiles where user_id=auth.uid() and active=true $$;

create or replace function public.is_admin(allowed public.admin_role[] default array['owner','manager','marketing','sales']::public.admin_role[])
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(public.current_admin_role() = any(allowed), false) $$;

revoke all on function public.current_admin_role() from public;
revoke all on function public.is_admin(public.admin_role[]) from public;
grant execute on function public.current_admin_role() to authenticated;
grant execute on function public.is_admin(public.admin_role[]) to authenticated;

insert into public.admin_profiles(user_id,email,role,active)
select id,lower(email),'owner',true from auth.users
where lower(email)='andrenevessato04@gmail.com'
on conflict(user_id) do update set role='owner',active=true,updated_at=now();

create policy "profile read self" on public.admin_profiles for select to authenticated
using (user_id=auth.uid() or public.is_admin(array['owner']::public.admin_role[]));
create policy "profile owner manage" on public.admin_profiles for all to authenticated
using (public.is_admin(array['owner']::public.admin_role[]))
with check (public.is_admin(array['owner']::public.admin_role[]));

alter table public.vehicles add column if not exists deleted_at timestamptz;
alter table public.vehicles add column if not exists deleted_by uuid references auth.users(id);
alter table public.vehicles enable row level security;
drop policy if exists "vehicles public read" on public.vehicles;
drop policy if exists "vehicles admin read" on public.vehicles;
drop policy if exists "vehicles inventory write" on public.vehicles;
create policy "vehicles public read" on public.vehicles for select to anon,authenticated
using (active=true and deleted_at is null and (status <> 'sold' or coalesce(keep_sold_public,true)));
create policy "vehicles admin read" on public.vehicles for select to authenticated
using (public.is_admin());
create policy "vehicles inventory write" on public.vehicles for all to authenticated
using (public.is_admin(array['owner','manager','sales']::public.admin_role[]))
with check (public.is_admin(array['owner','manager','sales']::public.admin_role[]));

alter table public.leads add column if not exists assigned_to uuid references auth.users(id);
alter table public.leads add column if not exists updated_at timestamptz default now();
alter table public.leads enable row level security;
drop policy if exists "leads public insert" on public.leads;
drop policy if exists "leads admin read" on public.leads;
drop policy if exists "leads staff update" on public.leads;
create policy "leads public insert" on public.leads for insert to anon
with check (
  source in ('home_financing','home_trade','journey_financing','journey_trade','journey_sell','sell_page','contact')
  and length(coalesce(name,'')) between 2 and 120
  and length(coalesce(phone,'')) <= 32
  and length(coalesce(email,'')) <= 254
  and octet_length(coalesce(details,'{}'::jsonb)::text) <= 12000
);
create policy "leads admin read" on public.leads for select to authenticated
using (public.is_admin(array['owner','manager','marketing']::public.admin_role[]) or (public.current_admin_role()='sales' and assigned_to=auth.uid()));
create policy "leads staff update" on public.leads for update to authenticated
using (public.is_admin(array['owner','manager']::public.admin_role[]) or (public.current_admin_role()='sales' and assigned_to=auth.uid()))
with check (public.is_admin(array['owner','manager']::public.admin_role[]) or (public.current_admin_role()='sales' and assigned_to=auth.uid()));

alter table public.store_settings enable row level security;
drop policy if exists "settings public read" on public.store_settings;
drop policy if exists "settings admin write" on public.store_settings;
create policy "settings public read" on public.store_settings for select to anon,authenticated using (id=1);
create policy "settings admin write" on public.store_settings for all to authenticated
using (public.is_admin(array['owner','manager','marketing']::public.admin_role[]))
with check (public.is_admin(array['owner','manager','marketing']::public.admin_role[]) and id=1);

alter table public.admin_access_requests add column if not exists role public.admin_role default 'sales';
alter table public.admin_access_requests enable row level security;
drop policy if exists "request own insert" on public.admin_access_requests;
drop policy if exists "request own read" on public.admin_access_requests;
drop policy if exists "request owner manage" on public.admin_access_requests;
create policy "request own insert" on public.admin_access_requests for insert to authenticated
with check (user_id=auth.uid() and status='pending' and reviewed_at is null and reviewed_by is null);
create policy "request own read" on public.admin_access_requests for select to authenticated
using (user_id=auth.uid() or public.is_admin(array['owner']::public.admin_role[]));
create policy "request owner manage" on public.admin_access_requests for update to authenticated
using (public.is_admin(array['owner']::public.admin_role[]))
with check (public.is_admin(array['owner']::public.admin_role[]));

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  actor_role public.admin_role,
  action text not null,
  resource_type text not null,
  resource_id text,
  result text not null default 'success',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_logs enable row level security;
create policy "audit owner manager read" on public.audit_logs for select to authenticated
using (public.is_admin(array['owner','manager']::public.admin_role[]));

create or replace function public.audit_row_change()
returns trigger language plpgsql security definer set search_path=public as $$
declare old_json jsonb; new_json jsonb; row_id text;
begin
  old_json:=case when tg_op='INSERT' then null else to_jsonb(old) end;
  new_json:=case when tg_op='DELETE' then null else to_jsonb(new) end;
  row_id:=coalesce(new_json->>'id',old_json->>'id',new_json->>'user_id',old_json->>'user_id');
  insert into public.audit_logs(actor_id,actor_role,action,resource_type,resource_id,metadata)
  values(auth.uid(),public.current_admin_role(),lower(tg_op),tg_table_name,row_id,
    jsonb_build_object('changed_keys',case when old_json is null or new_json is null then '[]'::jsonb else
      (select coalesce(jsonb_agg(key),'[]'::jsonb) from jsonb_each(new_json) n where n.value is distinct from old_json->n.key) end));
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;

drop trigger if exists audit_vehicles on public.vehicles;
create trigger audit_vehicles after insert or update or delete on public.vehicles for each row execute function public.audit_row_change();
drop trigger if exists audit_settings on public.store_settings;
create trigger audit_settings after insert or update or delete on public.store_settings for each row execute function public.audit_row_change();
drop trigger if exists audit_access on public.admin_access_requests;
create trigger audit_access after update on public.admin_access_requests for each row execute function public.audit_row_change();

create or replace function public.review_admin_access(target_user uuid, decision text, requested_role public.admin_role default 'sales')
returns void language plpgsql security definer set search_path=public as $$
declare target_email text;
begin
  if not public.is_admin(array['owner']::public.admin_role[]) then raise exception 'not authorized'; end if;
  if decision not in ('approved','rejected') then raise exception 'invalid decision'; end if;
  select lower(email) into target_email from auth.users where id=target_user;
  update public.admin_access_requests set status=decision,role=requested_role,reviewed_at=now(),reviewed_by=auth.uid() where user_id=target_user and status='pending';
  insert into public.admin_profiles(user_id,email,role,active) values(target_user,target_email,requested_role,decision='approved')
  on conflict(user_id) do update set role=excluded.role,active=excluded.active,updated_at=now();
end $$;
revoke all on function public.review_admin_access(uuid,text,public.admin_role) from public;
grant execute on function public.review_admin_access(uuid,text,public.admin_role) to authenticated;

commit;
