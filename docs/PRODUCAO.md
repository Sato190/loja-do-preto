# Operação segura — Loja do Preto

## Estado desta entrega

- IMPLEMENTADO: migrations versionadas, RLS/RBAC, endpoint validado de leads, auditoria, soft delete, validação de upload, headers e métricas determinísticas.
- TESTADO: sintaxe JavaScript/JSON, referências a segredos e inspeção estática das políticas.
- NÃO VERIFICADO: aplicação das migrations, planos Vercel/Supabase, backup automático, SMTP, restauração real, OAuth Meta/TikTok e testes por usuários reais.
- BLOQUEADO: validação completa dos perfis e deploy dependem de homologação e acesso autorizado às plataformas.

## Publicação

1. Crie backup/exportação lógica antes da mudança.
2. Aplique em homologação as migrations de `supabase/migrations`, na ordem.
3. Execute `supabase/tests/rls_manual.sql` com usuários descartáveis.
4. Execute `supabase-storage-migration.sql` depois da base de segurança.
5. Faça deploy de preview na Vercel e valide login, CRUD, leads, imagens, WhatsApp e headers.
6. Publique em produção somente após aprovação e acompanhe Auth, Database, Storage e logs por 24 horas.

## Segredos

O navegador deve conter somente URL do Supabase e chave pública. `service_role`, client secrets, refresh tokens, SMTP password e OAuth secrets ficam exclusivamente no servidor. Meta e TikTok permanecem “Não conectado”.

## Backup e restauração

O plano atual não está comprovado. Confirme retenção no painel. Recomendação: backup diário por 7 dias, semanal por 30 dias e teste trimestral em projeto separado, comparando contagens, amostras, Auth e Storage. Registre responsável, duração e resultado.

## Custos a confirmar

Vercel, banco/egress/storage/backups do Supabase, domínio, SMTP, observabilidade e eventual WhatsApp Business API. Nenhum plano, anúncio ou cobrança foi ativado nesta entrega.

## Rollback

- Vercel: promova o deployment anterior.
- RLS: corrija/reverta a policy específica em nova migration; não desative RLS globalmente.
- Dados: restaure o backup em projeto separado e valide antes da troca.
- Soft delete: restaure `deleted_at`, `deleted_by` e `active` por usuário autorizado.

## Limitação remanescente

Rate limiting confiável por IP requer Edge Function/WAF. A função atual valida campos/tamanho, honeypot e duplicidade em dois minutos. CAPTCHA e limite por IP continuam necessários antes de tráfego alto.
