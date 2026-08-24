import {cors,json,admin,publicClient,normalizeLogin,validLogin,hash} from './accounts.ts';
Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return json({error:'method_not_allowed'},405);
  const body=await req.json().catch(()=>({})),login=normalizeLogin(body.login),password=String(body.password||''),db=admin();
  if(!validLogin(login)||!password)return json({error:'invalid_credentials'},401);
  const rawIp=(req.headers.get('x-forwarded-for')||req.headers.get('cf-connecting-ip')||'unknown').split(',')[0].trim(),ipHash=await hash(rawIp),since=new Date(Date.now()-15*60*1000).toISOString();
  const{count}=await db.from('admin_login_attempts').select('*',{count:'exact',head:true}).eq('login',login).eq('ip_hash',ipHash).eq('success',false).gte('created_at',since);
  if((count||0)>=5){await db.from('security_events').insert({event_type:'login_blocked',severity:'warning',source:'login-username',summary:'Tentativas de login bloqueadas',metadata:{login}});return json({error:'temporarily_blocked'},429)}
  const{data:profile}=await db.from('admin_profiles').select('user_id,email,active,status').ilike('login',login).maybeSingle();
  if(!profile?.active||profile.status!=='active'){await db.from('admin_login_attempts').insert({login,ip_hash:ipHash,success:false,reason:'inactive_or_unknown'});return json({error:'invalid_credentials'},401)}
  const auth=publicClient(),{data,error}=await auth.auth.signInWithPassword({email:profile.email,password});
  await db.from('admin_login_attempts').insert({login,ip_hash:ipHash,success:!error,reason:error?'invalid_password':null});
  if(error||!data.session)return json({error:'invalid_credentials'},401);
  await db.from('admin_profiles').update({last_login_at:new Date().toISOString()}).eq('user_id',profile.user_id);
  await db.from('security_events').insert({event_type:'login_success',severity:'info',source:'login-username',summary:`Login ${login} realizado`,metadata:{user_id:profile.user_id}});
  return json({access_token:data.session.access_token,refresh_token:data.session.refresh_token,expires_in:data.session.expires_in});
});
