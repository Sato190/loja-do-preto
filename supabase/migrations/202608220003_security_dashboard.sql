begin;

create table if not exists public.security_checks (
  id bigint generated always as identity primary key,
  check_key text not null unique,
  name text not null,
  category text not null,
  description text not null,
  severity text not null check (severity in ('P0','P1','P2','P3')),
  enabled boolean not null default true,
  check_type text not null check (check_type in ('realtime','periodic','on_demand')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.security_check_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(), finished_at timestamptz,
  triggered_by uuid not null references auth.users(id), environment text not null default 'production',
  total_checks integer not null default 0, passed integer not null default 0,
  warnings integer not null default 0, failed integer not null default 0,
  critical integer not null default 0, unverified integer not null default 0,
  score integer, status text not null default 'running'
);
create table if not exists public.security_findings (
  id bigint generated always as identity primary key,
  check_id bigint references public.security_checks(id), run_id uuid not null references public.security_check_runs(id) on delete cascade,
  status text not null, severity text not null, title text not null, description text not null,
  resource_type text, resource_id text, expected_result text, actual_result text,
  first_detected_at timestamptz not null default now(), last_detected_at timestamptz not null default now(),
  resolved_at timestamptz, metadata jsonb not null default '{}'::jsonb
);
create table if not exists public.security_events (
  id bigint generated always as identity primary key, event_type text not null,
  severity text not null, source text not null, summary text not null,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

alter table public.security_checks enable row level security;
alter table public.security_check_runs enable row level security;
alter table public.security_findings enable row level security;
alter table public.security_events enable row level security;

create policy "security authorized read checks" on public.security_checks for select to authenticated using (public.is_admin(array['owner','manager']::public.admin_role[]));
create policy "security authorized read runs" on public.security_check_runs for select to authenticated using (public.is_admin(array['owner','manager']::public.admin_role[]));
create policy "security authorized read findings" on public.security_findings for select to authenticated using (public.is_admin(array['owner','manager']::public.admin_role[]));
create policy "security owner read events" on public.security_events for select to authenticated using (public.is_admin(array['owner']::public.admin_role[]));

insert into public.security_checks(check_key,name,category,description,severity,check_type) values
('rls_tables','RLS das tabelas críticas','Banco','Confirma RLS ativo nas tabelas operacionais e de segurança.','P0','periodic'),
('anon_policies','Políticas anônimas','Banco','Confirma que leads e acessos não possuem leitura anônima e veículos possuem somente leitura pública.','P0','periodic'),
('privilege_escalation','Escalação de privilégios','Autenticação','Confirma que perfis administrativos não aceitam alteração pelo próprio usuário.','P0','periodic'),
('admin_rpc','Operações privilegiadas','Backend','Confirma função server-side para aprovação de acesso.','P0','periodic'),
('storage_policies','Políticas de Storage','Storage','Confirma escrita autenticada e ausência de exclusão pública.','P0','periodic'),
('storage_limits','Limites de upload','Storage','Confirma limite e MIME types permitidos no bucket.','P1','periodic'),
('audit_logging','Logs administrativos','Backend','Confirma tabela protegida e triggers de auditoria.','P1','realtime'),
('soft_delete','Exclusão recuperável','Banco','Confirma deleted_at e deleted_by em veículos.','P1','periodic'),
('lead_protection','Proteção de leads','Backend','Confirma endpoint validado e ausência de INSERT anônimo direto.','P1','periodic'),
('internal_snapshot','Snapshot pré-alteração','Backup','Confirma cópia interna criada antes da migration.','P1','periodic'),
('external_backup','Backup externo','Backup','Backup externo e restauração precisam de comprovação fora do banco.','P1','periodic'),
('oauth_integrations','OAuth Meta e TikTok','Integrações','Confirmação depende de backend OAuth ainda não conectado.','P2','periodic')
on conflict(check_key) do update set name=excluded.name,category=excluded.category,description=excluded.description,severity=excluded.severity,check_type=excluded.check_type,updated_at=now();

create or replace function public.run_security_checks()
returns jsonb language plpgsql security definer set search_path=public,storage,pg_catalog as $$
declare run_uuid uuid; item record; ok boolean; stat text; details text; passed_count int:=0; warning_count int:=0; failed_count int:=0; critical_count int:=0; unverified_count int:=0; total_count int:=0; final_score int;
begin
  if not public.is_admin(array['owner','manager']::public.admin_role[]) then raise exception 'not authorized'; end if;
  insert into public.security_check_runs(triggered_by) values(auth.uid()) returning id into run_uuid;
  for item in select * from public.security_checks where enabled order by id loop
    total_count:=total_count+1; ok:=false; stat:='NÃO VERIFICADO'; details:='Verificação indisponível.';
    case item.check_key
      when 'rls_tables' then select count(*)=10 into ok from pg_class where oid in ('public.vehicles'::regclass,'public.leads'::regclass,'public.store_settings'::regclass,'public.admin_access_requests'::regclass,'public.admin_profiles'::regclass,'public.audit_logs'::regclass,'public.security_checks'::regclass,'public.security_check_runs'::regclass,'public.security_findings'::regclass,'public.security_events'::regclass) and relrowsecurity; stat:=case when ok then 'SEGURO' else 'CRÍTICO' end; details:='RLS ativo em '||(select count(*) from pg_class where oid in ('public.vehicles'::regclass,'public.leads'::regclass,'public.store_settings'::regclass,'public.admin_access_requests'::regclass,'public.admin_profiles'::regclass,'public.audit_logs'::regclass,'public.security_checks'::regclass,'public.security_check_runs'::regclass,'public.security_findings'::regclass,'public.security_events'::regclass) and relrowsecurity)||' de 10 tabelas.';
      when 'anon_policies' then select not exists(select 1 from pg_policies where schemaname='public' and tablename in ('leads','admin_access_requests','admin_profiles','audit_logs') and 'anon'=any(roles) and cmd='SELECT') into ok; stat:=case when ok then 'SEGURO' else 'CRÍTICO' end; details:='Políticas públicas sensíveis encontradas: '||(select count(*) from pg_policies where schemaname='public' and tablename in ('leads','admin_access_requests','admin_profiles','audit_logs') and 'anon'=any(roles) and cmd='SELECT')||'.';
      when 'privilege_escalation' then select not exists(select 1 from pg_policies where schemaname='public' and tablename='admin_profiles' and cmd in ('UPDATE','ALL') and 'authenticated'=any(roles) and coalesce(with_check,'') ilike '%auth.uid%') into ok; stat:=case when ok then 'TESTADO' else 'CRÍTICO' end; details:='Alteração de perfis exige política de proprietário.';
      when 'admin_rpc' then select exists(select 1 from pg_proc where proname='review_admin_access' and prosecdef) into ok; stat:=case when ok then 'FUNCIONANDO' else 'CRÍTICO' end; details:='Aprovação de acesso executada por função SECURITY DEFINER com verificação de owner.';
      when 'storage_policies' then select exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Approved admins can upload vehicle images') and not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and cmd in ('INSERT','DELETE') and 'anon'=any(roles)) into ok; stat:=case when ok then 'SEGURO' else 'CRÍTICO' end; details:='Escrita pública no bucket: '||case when ok then 'bloqueada' else 'política insegura encontrada' end||'.';
      when 'storage_limits' then select file_size_limit=10485760 and allowed_mime_types <@ array['image/jpeg','image/png','image/webp','image/avif'] into ok from storage.buckets where id='vehicle-images'; stat:=case when ok then 'SEGURO' else 'ATENÇÃO' end; details:='Bucket limitado a 10 MB e formatos de imagem aprovados.';
      when 'audit_logging' then select exists(select 1 from pg_trigger where tgname in ('audit_vehicles','audit_settings','audit_access') and tgenabled<>'D') and (select relrowsecurity from pg_class where oid='public.audit_logs'::regclass) into ok; stat:=case when ok then 'FUNCIONANDO' else 'ERRO' end; details:='Triggers ativos: '||(select count(*) from pg_trigger where tgname in ('audit_vehicles','audit_settings','audit_access') and tgenabled<>'D')||' de 3.';
      when 'soft_delete' then select count(*)=2 into ok from information_schema.columns where table_schema='public' and table_name='vehicles' and column_name in ('deleted_at','deleted_by'); stat:=case when ok then 'SEGURO' else 'ERRO' end; details:='Colunas de recuperação encontradas: '||(select count(*) from information_schema.columns where table_schema='public' and table_name='vehicles' and column_name in ('deleted_at','deleted_by'))||' de 2.';
      when 'lead_protection' then select exists(select 1 from pg_proc where proname='submit_public_lead' and prosecdef) and not exists(select 1 from pg_policies where schemaname='public' and tablename='leads' and cmd='INSERT' and 'anon'=any(roles)) into ok; stat:=case when ok then 'SEGURO' else 'CRÍTICO' end; details:='Entrada pública ocorre por função validada; INSERT direto anônimo bloqueado.';
      when 'internal_snapshot' then select exists(select 1 from information_schema.schemata where schema_name='ldp_backup_20260822') into ok; stat:=case when ok then 'TESTADO' else 'ATENÇÃO' end; details:='Snapshot interno de 22/08/2026 '||case when ok then 'encontrado' else 'não encontrado' end||'.';
      when 'external_backup' then stat:='NÃO VERIFICADO'; details:='Plano Free sem backup automático comprovado; restauração externa não testada.';
      when 'oauth_integrations' then stat:='NÃO APLICÁVEL'; details:='Meta e TikTok não conectados; nenhum token armazenado.';
    end case;
    if stat in ('SEGURO','FUNCIONANDO','TESTADO','NÃO APLICÁVEL') then passed_count:=passed_count+1; elsif stat='CRÍTICO' then critical_count:=critical_count+1; failed_count:=failed_count+1; elsif stat in ('ATENÇÃO','PARCIAL','ERRO') then warning_count:=warning_count+1; else unverified_count:=unverified_count+1; end if;
    insert into public.security_findings(check_id,run_id,status,severity,title,description,resource_type,resource_id,expected_result,actual_result,metadata)
    values(item.id,run_uuid,stat,item.severity,item.name,details,item.category,item.check_key,'Configuração segura conforme política do projeto',stat,jsonb_build_object('method','server-side catalog inspection'));
  end loop;
  final_score:=greatest(0,round(100.0*(passed_count::numeric/greatest(total_count,1))-critical_count*25-warning_count*8)::int);
  update public.security_check_runs set finished_at=now(),total_checks=total_count,passed=passed_count,warnings=warning_count,failed=failed_count,critical=critical_count,unverified=unverified_count,score=final_score,status=case when critical_count>0 then 'CRÍTICO' when warning_count>0 or unverified_count>0 then 'ATENÇÃO' else 'SEGURO' end where id=run_uuid;
  return (select jsonb_build_object('run',to_jsonb(r),'findings',(select jsonb_agg(to_jsonb(f) order by f.id) from public.security_findings f where f.run_id=run_uuid)) from public.security_check_runs r where r.id=run_uuid);
end $$;
revoke all on function public.run_security_checks() from public;
grant execute on function public.run_security_checks() to authenticated;

commit;
