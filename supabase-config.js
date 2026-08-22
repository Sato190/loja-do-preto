window.SUPABASE_CONFIG={
  url:'https://mkvkoeuaopgoobrszuzy.supabase.co',
  publishableKey:'sb_publishable_zZnHgX_jYjCoIzdXFldJnA_9f8cXqe0'
};
window.LDP_CURRENCY=Object.freeze({currency:'BRL',locale:'pt-BR',format(value,fallback='Consulte o valor'){const number=Number(value);return Number.isFinite(number)&&number>0?new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2,maximumFractionDigits:2}).format(number):fallback},number(value){const number=Number(value);return Number.isFinite(number)&&number>=0?number:null}});
if(!document.querySelector('link[href$="price.css"]')){const priceStyles=document.createElement('link');priceStyles.rel='stylesheet';priceStyles.href='/price.css';document.head.append(priceStyles)}
if(window.supabase&&!window.SUPABASE_CONFIG.url.startsWith('[')){
  window.supabaseClient=window.supabase.createClient(window.SUPABASE_CONFIG.url,window.SUPABASE_CONFIG.publishableKey);
}

