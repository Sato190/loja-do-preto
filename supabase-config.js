window.SUPABASE_CONFIG={
  url:'https://mkvkoeuaopgoobrszuzy.supabase.co',
  publishableKey:'sb_publishable_zZnHgX_jYjCoIzdXFldJnA_9f8cXqe0'
};
if(window.supabase&&!window.SUPABASE_CONFIG.url.startsWith('[')){
  window.supabaseClient=window.supabase.createClient(window.SUPABASE_CONFIG.url,window.SUPABASE_CONFIG.publishableKey);
}

