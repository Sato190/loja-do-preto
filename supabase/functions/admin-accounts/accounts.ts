import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.4';
export const cors={'Access-Control-Allow-Origin':'https://loja-do-preto.vercel.app','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
export const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
export const admin=()=>createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
export const normalizeLogin=(value:unknown)=>String(value||'').trim().toLowerCase();
export const validLogin=(value:string)=>/^[a-z0-9._-]{8,32}$/.test(value);
export const technicalEmail=(login:string)=>`${login}@accounts.lojadopreto.invalid`;
export async function requireOwner(req:Request){const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');if(!token)return null;const db=admin(),{data:{user}}=await db.auth.getUser(token);if(!user)return null;const{data:profile}=await db.from('admin_profiles').select('user_id,role,active,status').eq('user_id',user.id).maybeSingle();return profile?.role==='owner'&&profile.active&&profile.status==='active'?{db,user,token}:null}
