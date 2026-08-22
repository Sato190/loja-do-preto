(()=>{
  const panel=document.querySelector('[data-panel="settings"]');
  const client=window.supabaseClient;
  if(!panel||!client)return;
  const section=document.createElement('section');
  section.className='links-center whatsapp-message-center';
  section.innerHTML=`<header><div><p class="overline">Configurações / WhatsApp</p><h2>Mensagens automáticas</h2><p>Personalize o texto geral e o texto enviado a partir dos anúncios.</p></div></header><form id="whatsapp-message-form"><label class="custom-links">Mensagem padrão<textarea name="default_message" rows="3" required></textarea></label><label class="custom-links">Mensagem para veículo<textarea name="vehicle_template" rows="5" required></textarea><small>Variáveis disponíveis: {veiculo}, {marca}, {modelo}, {ano}, {preco} e {link}.</small></label><div class="links-preview">A mensagem de cada anúncio será preenchida com os dados reais do veículo, sem exibir campos vazios.</div><footer><p class="status" role="status"></p><button type="submit">Salvar mensagens</button></footer></form>`;
  panel.append(section);
  const form=section.querySelector('form'),status=section.querySelector('.status');
  let entries=[];
  async function load(){
    const{data,error}=await client.from('store_settings').select('testimonials').eq('id',1).maybeSingle();
    if(error){status.textContent='Não foi possível carregar as mensagens.';return}
    entries=Array.isArray(data?.testimonials)?data.testimonials:[];
    form.default_message.value=entries.find(item=>item?.type==='whatsapp_default_template')?.value||window.LDP_WHATSAPP.defaultMessage;
    form.vehicle_template.value=entries.find(item=>item?.type==='whatsapp_vehicle_template')?.value||window.LDP_WHATSAPP.vehicleTemplate;
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const defaultMessage=form.default_message.value.trim(),vehicleTemplate=form.vehicle_template.value.trim();
    if(!defaultMessage||!vehicleTemplate){status.textContent='Preencha as duas mensagens.';return}
    const allowed=/\{(veiculo|marca|modelo|ano|preco|link)\}/g;
    const unknown=[...vehicleTemplate.matchAll(/\{([^}]+)\}/g)].map(match=>match[1]).filter(key=>!['veiculo','marca','modelo','ano','preco','link'].includes(key));
    if(unknown.length){status.textContent=`Variável não reconhecida: {${unknown[0]}}.`;return}
    if(!allowed.test(vehicleTemplate)){status.textContent='Inclua pelo menos uma variável do veículo no modelo.';return}
    const kept=entries.filter(item=>!['whatsapp_default_template','whatsapp_vehicle_template'].includes(item?.type));
    const testimonials=[...kept,{type:'whatsapp_default_template',value:defaultMessage},{type:'whatsapp_vehicle_template',value:vehicleTemplate}];
    const button=form.querySelector('button');button.disabled=true;button.textContent='Salvando…';
    const{error}=await client.from('store_settings').update({testimonials}).eq('id',1);
    button.disabled=false;button.textContent='Salvar mensagens';status.textContent=error?'Não foi possível salvar as mensagens.':'Mensagens publicadas e sincronizadas.';
    if(!error){entries=testimonials;window.LDP_WHATSAPP_SETTINGS={defaultMessage,vehicleTemplate}}
  });
  load();
})();
