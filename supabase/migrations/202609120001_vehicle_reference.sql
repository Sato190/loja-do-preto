begin;

alter table public.vehicles add column if not exists reference bigint;

with numbered as (
  select id, row_number() over (order by created_at nulls last, id) as ref
  from public.vehicles where reference is null
), offset_value as (
  select coalesce(max(reference), 0) as base from public.vehicles
)
update public.vehicles v set reference = o.base + n.ref
from numbered n cross join offset_value o where v.id = n.id;

alter table public.vehicles alter column reference set not null;
alter table public.vehicles drop constraint if exists vehicles_reference_positive;
alter table public.vehicles add constraint vehicles_reference_positive check (reference > 0);
create unique index if not exists vehicles_reference_unique on public.vehicles(reference);

create or replace function public.next_vehicle_reference()
returns bigint language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin(array['owner','manager','sales']::public.admin_role[]) then raise exception 'not authorized'; end if;
  return (select coalesce(max(reference), 0) + 1 from public.vehicles);
end $$;
revoke all on function public.next_vehicle_reference() from public;
grant execute on function public.next_vehicle_reference() to authenticated;

create or replace function public.vehicle_reference_available(candidate bigint, current_vehicle uuid default null)
returns table(available boolean, vehicle_id uuid, vehicle_slug text, vehicle_label text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin(array['owner','manager','sales']::public.admin_role[]) then raise exception 'not authorized'; end if;
  return query select not exists(select 1 from public.vehicles x where x.reference=candidate and x.id is distinct from current_vehicle),
    v.id,v.slug,trim(concat_ws(' ',v.brand,v.model,v.version,v.year::text))
  from (select 1) seed left join lateral (
    select id,slug,brand,model,version,year from public.vehicles
    where reference=candidate and id is distinct from current_vehicle limit 1
  ) v on true;
end
$$;
revoke all on function public.vehicle_reference_available(bigint,uuid) from public;
grant execute on function public.vehicle_reference_available(bigint,uuid) to authenticated;

create or replace function public.log_vehicle_reference_conflict(candidate bigint)
returns void language plpgsql security definer set search_path = public as $$
declare found_vehicle uuid;
begin
  if not public.is_admin(array['owner','manager','sales']::public.admin_role[]) then raise exception 'not authorized'; end if;
  select id into found_vehicle from public.vehicles where reference=candidate limit 1;
  if found_vehicle is not null then
    insert into public.audit_logs(actor_id,actor_role,action,resource_type,resource_id,result,metadata)
    values(auth.uid(),public.current_admin_role(),'reference_conflict','vehicles',found_vehicle::text,'blocked',jsonb_build_object('reference',candidate));
  end if;
end $$;
revoke all on function public.log_vehicle_reference_conflict(bigint) from public;
grant execute on function public.log_vehicle_reference_conflict(bigint) to authenticated;

create or replace function public.audit_vehicle_reference()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='INSERT' or old.reference is distinct from new.reference then
    insert into public.audit_logs(actor_id,actor_role,action,resource_type,resource_id,metadata)
    values(auth.uid(),public.current_admin_role(),case when tg_op='INSERT' then 'reference_created' else 'reference_changed' end,'vehicles',new.id::text,
      jsonb_build_object('old_reference',case when tg_op='INSERT' then null else old.reference end,'new_reference',new.reference));
  end if;
  return new;
end $$;
drop trigger if exists audit_vehicle_reference on public.vehicles;
create trigger audit_vehicle_reference after insert or update of reference on public.vehicles
for each row execute function public.audit_vehicle_reference();

comment on column public.vehicles.reference is 'Identificador comercial único, positivo e permanente; não é liberado por soft delete.';
commit;
