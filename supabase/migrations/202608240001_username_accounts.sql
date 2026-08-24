begin;

alter table public.admin_profiles add column if not exists login text;
alter table public.admin_profiles add column if not exists display_name text;
alter table public.admin_profiles add column if not exists status text not null default 'active';
alter table public.admin_profiles add column if not exists last_login_at timestamptz;
alter table public.admin_profiles add column if not exists disabled_at timestamptz;
alter table public.admin_profiles add column if not exists removed_at timestamptz;
alter table public.admin_profiles add constraint admin_profiles_login_format check (login is null or login ~ '^[a-z][a-z0-9._-]{2,31}$');
alter table public.admin_profiles add constraint admin_profiles_status_valid check (status in ('active','disabled','removed'));
create unique index if not exists admin_profiles_login_unique on public.admin_profiles(lower(login)) where login is not null;

update public.admin_profiles set login='andre',display_name='Administrador principal',status='active'
where role='owner' and login is null;

create table if not exists public.admin_login_attempts (
  id bigint generated always as identity primary key,
  login text not null,
  ip_hash text not null,
  success boolean not null,
  reason text,
  created_at timestamptz not null default now()
);
alter table public.admin_login_attempts enable row level security;
create index if not exists admin_login_attempts_lookup on public.admin_login_attempts(lower(login),ip_hash,created_at desc);
create policy "owner reads login attempts" on public.admin_login_attempts for select to authenticated
using (public.is_admin(array['owner']::public.admin_role[]));

create or replace function public.can_access_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.admin_profiles where user_id=auth.uid() and active=true and status='active' and removed_at is null)
$$;
revoke all on function public.can_access_admin() from public;
grant execute on function public.can_access_admin() to authenticated;

commit;
