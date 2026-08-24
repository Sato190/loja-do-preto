import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.4';
export const cors={'Access-Control-Allow-Origin':'https://loja-do-preto.vercel.app','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
export const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
export const admin=()=>createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
export const publicClient=()=>createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
export const normalizeLogin=(value:unknown)=>String(value||'').trim().toLowerCase();
export const validLogin=(value:string)=>/^[a-z][a-z0-9._-]{2,31}$/.test(value);
export async function hash(value:string){const bytes=new TextEncoder().encode(value);const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('')}
