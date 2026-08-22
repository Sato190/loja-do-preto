(()=>{if(!document.querySelector('link[href$="motion.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='/motion.css';document.head.append(l)}if(!document.querySelector('script[src$="navigation.js"]')){const s=document.createElement('script');s.src='/navigation.js';document.head.append(s)}if(!document.querySelector('script[src$="motion.js"]')){const s=document.createElement('script');s.src='/motion.js';document.head.append(s)}
  const db=window.supabaseClient;
  const money=n=>n==null?'Consulte':new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(n);
  const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let settings={};
  const page=document.body.dataset.page||'home';const anchor=(id,el)=>{if(el&&!document.getElementById(id)){const a=document.createElement('span');a.id=id;a.className='route-anchor';el.before(a)}};anchor('avaliacao',document.querySelector('#sell-form'));anchor('simulacao',document.querySelector('#finance-form'));anchor('como-funciona',document.querySelector('.finance-layout')?.closest('.portal-section')?.nextElementSibling);if(location.hash)setTimeout(()=>document.querySelector(location.hash)?.scrollIntoView(),350);
  document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===page));
  const header=document.querySelector('.portal-header');
  addEventListener('scroll',()=>header?.classList.toggle('compact',scrollY>40),{passive:true});
  document.querySelector('.portal-menu')?.addEventListener('click',e=>{const open=document.querySelector('.portal-nav')?.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',String(!!open))});
  const favorites=()=>JSON.parse(localStorage.getItem('ldp-favorites')||'[]');
  const updateFav=()=>document.querySelectorAll('[data-favorite-count]').forEach(x=>x.textContent=favorites().length);
  updateFav(); addEventListener('storage',updateFav);
  const wa=(value,message)=>window.LDP_WHATSAPP.url(value,message);
  async function loadSettings(){
    if(db){const {data}=await db.from('store_settings').select('*').limit(1).maybeSingle();settings=data||{}}
    document.querySelectorAll('[data-wa]').forEach(a=>{a.href=wa(settings.whatsapp,a.dataset.message||'Olá! Gostaria de falar com a Loja do Preto.');a.target='_blank';a.rel='noopener'});
    document.querySelectorAll('[data-store-name]').forEach(x=>x.textContent=settings.store_name||'Loja do Preto');
    const map={phone:settings.phone,email:settings.email,address:settings.address,hours:settings.business_hours,instagram:settings.instagram};
    Object.entries(map).forEach(([k,v])=>document.querySelectorAll(`[data-setting="${k}"]`).forEach(x=>x.textContent=v||'Consulte nossa equipe'));
    if(page==='history')renderHistory(); if(page==='contact')renderContact();
  }
  function renderHistory(){
    const title=settings.history_title||'Nossa história';
    const text=settings.history_text||'Conteúdo institucional aguardando validação final pela Loja do Preto.';
    document.querySelector('[data-history-title]')?.replaceChildren(document.createTextNode(title));
    document.querySelector('[data-history-text]')?.replaceChildren(document.createTextNode(text));
    const logo=document.querySelector('[data-history-logo]'); if(logo){logo.src=settings.history_image_url||settings.hero_image_url||'assets/hero-showroom.jpg';logo.alt='Ambiente da Loja do Preto';logo.closest('.brand-shield')?.classList.add('history-media')}
    const timeline=document.querySelector('[data-timeline]');
    if(timeline){const items=Array.isArray(settings.history_timeline)?settings.history_timeline:[];timeline.innerHTML=items.length?items.map(i=>`<article><strong>${safe(i.year)}</strong><div><h3>${safe(i.title)}</h3><p>${safe(i.text)}</p></div></article>`).join(''):'<article><strong>—</strong><div><h3>Linha do tempo</h3><p>Conteúdo disponível para edição no painel administrativo.</p></div></article>'}
    const values=document.querySelector('[data-values]'); if(values){const items=Array.isArray(settings.store_values)?settings.store_values:[];values.innerHTML=(items.length?items:[{title:'Transparência',text:'Edite este conteúdo no painel.'},{title:'Atendimento',text:'Edite este conteúdo no painel.'},{title:'Curadoria',text:'Edite este conteúdo no painel.'},{title:'Confiança',text:'Edite este conteúdo no painel.'}]).map((i,n)=>`<article><b>0${n+1}</b><h3>${safe(i.title)}</h3><p>${safe(i.text)}</p></article>`).join('')}
    const gallery=document.querySelector('[data-gallery]');if(gallery){const imgs=Array.isArray(settings.history_gallery)?settings.history_gallery.filter(Boolean):[];gallery.innerHTML=imgs.length?imgs.map((src,i)=>`<img loading="lazy" src="${safe(src)}" alt="Loja do Preto ${i+1}">`).join(''):'<div class="gallery-placeholder">Galeria editável pelo painel</div>'}
  }
  function renderContact(){
    const box=document.querySelector('[data-contact-list]'); if(box)box.innerHTML=`<a href="tel:${safe(settings.phone)}"><small>Telefone</small><strong>${safe(settings.phone||'Consulte nossa equipe')}</strong></a><a href="mailto:${safe(settings.email)}"><small>E-mail</small><strong>${safe(settings.email||'Consulte nossa equipe')}</strong></a><div><small>Endereço</small><strong>${safe(settings.address||'Consulte nossa equipe')}</strong></div><div><small>Atendimento</small><strong>${safe(settings.business_hours||'Consulte nossa equipe')}</strong></div>`;
  }
  const dialog=document.querySelector('#global-search');
  document.querySelectorAll('#global-search-button,[data-open-search]').forEach(b=>b.addEventListener('click',()=>dialog?.showModal()));
  dialog?.querySelector('.search-close')?.addEventListener('click',()=>dialog.close());
  const input=dialog?.querySelector('input'); let timer;
  input?.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(async()=>{
    const q=input.value.trim();const out=dialog.querySelector('.search-results');if(q.length<2){out.innerHTML='<p>Digite pelo menos 2 caracteres.</p>';return}
    if(!db)return; const term=`%${q}%`;const {data}=await db.from('vehicles').select('id,slug,brand,model,version,year,price,body_type,vehicle_type').eq('active',true).or(`brand.ilike.${term},model.ilike.${term},version.ilike.${term},category.ilike.${term},body_type.ilike.${term},transmission.ilike.${term},fuel.ilike.${term}`).limit(8);
    out.innerHTML=(data||[]).length?data.map(v=>`<a class="search-result" href="/vehicle?slug=${encodeURIComponent(v.slug||v.id)}"><span><b>${safe(v.brand)} ${safe(v.model)}</b><small>${safe(v.version||v.year)}</small></span><strong>${money(v.price)}</strong></a>`).join(''):'<p>Nenhum veículo encontrado.</p>';
  },250)});
  document.querySelector('#sell-form')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),lead=Object.fromEntries(f);db?.from('leads').insert({source:'sell_page',name:lead.name||null,phone:lead.phone||null,vehicle_interest:lead.vehicle||null,details:lead});const msg=`Olá! Quero vender ou trocar meu carro.\nNome: ${f.get('name')}\nVeículo: ${f.get('vehicle')}\nAno: ${f.get('year')}\nQuilometragem: ${f.get('mileage')}\nTelefone: ${f.get('phone')}`;open(wa(settings.whatsapp,msg),'_blank');e.currentTarget.querySelector('.form-status').textContent='Solicitação salva. Continue pelo WhatsApp.'});
  document.querySelector('#sell-photos')?.addEventListener('change',e=>{const box=document.querySelector('.image-previews');box.innerHTML=[...e.target.files].slice(0,8).map(f=>`<img src="${URL.createObjectURL(f)}" alt="Prévia">`).join('')});
  const calc=document.querySelector('#finance-form');calc?.addEventListener('input',()=>{const f=new FormData(calc),price=+f.get('price')||0,down=+f.get('down')||0,months=+f.get('months')||48,rate=(+f.get('rate')||1.49)/100;const financed=Math.max(0,price-down);const installment=rate?financed*(rate*Math.pow(1+rate,months))/(Math.pow(1+rate,months)-1):financed/months;document.querySelector('#finance-result').innerHTML=`<small>Parcela estimada</small><strong>${money(installment)}</strong><p>Estimativa informativa. Condições sujeitas à análise de crédito.</p>`});
  loadSettings();
})();

