(()=>{
  const client=window.supabaseClient;
  if(!client||!window.LDP_WHATSAPP)return;
  let destination=window.LDP_WHATSAPP.official,channel,observer;
  const templates=()=>window.LDP_WHATSAPP_SETTINGS||{defaultMessage:window.LDP_WHATSAPP.defaultMessage,vehicleTemplate:window.LDP_WHATSAPP.vehicleTemplate};
  const number=value=>{const digits=String(value||'').replace(/\D/g,'');return digits?Number(digits)/100:null};
  function applyGeneral(root=document){root.querySelectorAll?.('[data-wa]').forEach(link=>{const message=link.dataset.message||templates().defaultMessage;link.href=window.LDP_WHATSAPP.url(destination,message);link.target='_blank';link.rel='noopener noreferrer'})}
  function applyCatalog(root=document){root.querySelectorAll?.('.catalog-card').forEach(card=>{
    if(card.querySelector('[data-catalog-wa]'))return;
    const detail=card.querySelector('.card-price a'),title=card.querySelector('h3')?.textContent.trim()||'',version=card.querySelector('.card-body>p')?.textContent.trim()||'',year=card.querySelector('.card-specs span')?.textContent.trim()||'',priceText=card.querySelector('.card-price strong')?.textContent.trim()||'',parts=title.split(/\s+/),brand=parts.shift()||'',model=parts.join(' '),link=detail?.href||location.href;
    const message=window.LDP_WHATSAPP.vehicleMessage({brand,model,version,year,price:number(priceText),link},templates().vehicleTemplate);
    const action=document.createElement('a');action.className='portal-btn green catalog-whatsapp';action.dataset.catalogWa='';action.textContent='Chamar no WhatsApp';action.href=window.LDP_WHATSAPP.url(destination,message);action.target='_blank';action.rel='noopener noreferrer';
    card.querySelector('.card-body')?.append(action);
  })}
  function refresh(){document.querySelectorAll('[data-catalog-wa]').forEach(link=>link.remove());applyGeneral();applyCatalog()}
  function configure(settings={}){const entries=Array.isArray(settings.testimonials)?settings.testimonials:[],configuredNumber=entries.find(x=>x?.type==='whatsapp_number')?.value;destination=configuredNumber||settings.whatsapp||destination;window.LDP_WHATSAPP_SETTINGS={defaultMessage:entries.find(x=>x?.type==='whatsapp_default_template')?.value||window.LDP_WHATSAPP.defaultMessage,vehicleTemplate:entries.find(x=>x?.type==='whatsapp_vehicle_template')?.value||window.LDP_WHATSAPP.vehicleTemplate};refresh()}
  async function load(){const{data}=await client.from('store_settings').select('whatsapp,testimonials').eq('id',1).maybeSingle();if(data)configure(data)}
  observer=new MutationObserver(records=>{if(records.some(record=>record.addedNodes.length)){applyGeneral();applyCatalog()}});observer.observe(document.documentElement,{childList:true,subtree:true});
  load();applyGeneral();applyCatalog();
  channel=client.channel('whatsapp-runtime-live').on('postgres_changes',{event:'UPDATE',schema:'public',table:'store_settings',filter:'id=eq.1'},payload=>configure(payload.new||{})).subscribe();
  addEventListener('pagehide',()=>{observer?.disconnect();if(channel)client.removeChannel(channel)},{once:true});
})();
