-- Somente homologação; use usuários e veículos descartáveis.
-- ANON: vehicles e store_settings públicos; leads e admin_access_requests inacessíveis.
select id,active,deleted_at from public.vehicles;
select id from public.store_settings;
select * from public.leads;
select * from public.admin_access_requests;

-- Sem perfil: função retorna null e todo CRUD administrativo falha.
select public.current_admin_role();

-- SALES: estoque e somente leads atribuídos. MARKETING: leads/settings.
-- MANAGER: estoque/leads/settings/logs. OWNER: tudo e aprovação via RPC.
-- Teste soft delete/restauração com um registro criado para essa finalidade.
-- Confirme auditoria depois de cada mutação autorizada:
select actor_id,actor_role,action,resource_type,resource_id,created_at from public.audit_logs order by created_at desc limit 10;
