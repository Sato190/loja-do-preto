const STORE_WHATSAPP_NUMBER = '';
const store = { name: 'Loja do Preto', whatsapp: STORE_WHATSAPP_NUMBER };
const whatsappIcon='<span class="wa-icon" aria-hidden="true"></span>';

let vehicles = [
  {id:'demo-001',brand:'Toyota',model:'Corolla',version:'XEi',year:2024,mileage:32000,transmission:'Automático',fuel:'Flex',color:'Preto',category:'Sedan',price:null,installment:null,featured:true,image:'https://raw.githubusercontent.com/Sato190/loja-do-preto/main/assets/hero-showroom.jpg',whatsappNumber:'',whatsappMessage:'',features:[]},
  {id:'demo-002',brand:'Jeep',model:'Compass',version:'Limited',year:2023,mileage:41000,transmission:'Automático',fuel:'Flex',color:'Grafite',category:'SUV',price:null,installment:null,featured:true,image:'https://raw.githubusercontent.com/Sato190/loja-do-preto/main/assets/hero-showroom.jpg',whatsappNumber:'',whatsappMessage:'',features:[]},
  {id:'demo-003',brand:'BMW',model:'320i',version:'Sport GP',year:2022,mileage:38000,transmission:'Automático',fuel:'Gasolina',color:'Preto',category:'Sedan',price:null,installment:null,featured:true,image:'https://raw.githubusercontent.com/Sato190/loja-do-preto/main/assets/hero-showroom.jpg',whatsappNumber:'',whatsappMessage:'',features:[]},
  {id:'demo-004',brand:'Volkswagen',model:'T-Cross',version:'Highline',year:2023,mileage:29000,transmission:'Automático',fuel:'Flex',color:'Prata',category:'SUV',price:null,installment:null,featured:false,image:'https://raw.githubusercontent.com/Sato190/loja-do-preto/main/assets/hero-showroom.jpg',whatsappNumber:'',whatsappMessage:'',features:[]},
  {id:'demo-005',brand:'Honda',model:'Civic',version:'Touring',year:2021,mileage:52000,transmission:'Automático',fuel:'Gasolina',color:'Branco',category:'Sedan',price:null,installment:null,featured:false,image:'https://raw.githubusercontent.com/Sato190/loja-do-preto/main/assets/hero-showroom.jpg',whatsappNumber:'',whatsappMessage:'',features:[]},
  {id:'demo-006',brand:'Chevrolet',model:'Tracker',version:'Premier',year:2024,mileage:18000,transmission:'Automático',fuel:'Flex',color:'Preto',category:'SUV',price:null,installment:null,featured:false,image:'https://raw.githubusercontent.com/Sato190/loja-do-preto/main/assets/hero-showroom.jpg',whatsappNumber:'',whatsappMessage:'',features:[]}
];

const money = n => n ? Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}) : 'Consulte o valor';
const messageFor = v => v.whatsappMessage || `Olá! Tenho interesse no ${v.brand} ${v.model} ${v.version} ${v.year} anunciado no site da Loja do Preto. Gostaria de receber mais informações e conhecer as condições de negociação.`;
function waLink(message, number=store.whatsapp){ const clean=(number||'').replace(/\D/g,''); return clean ? `https://wa.me/${clean}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message+'\n\n[WhatsApp da loja ainda será configurado no site.]')}`; }
function bindWhatsApp(root=document){ root.querySelectorAll('[data-wa]').forEach(a=>{a.href=waLink(a.dataset.message||'Olá! Gostaria de falar com a Loja do Preto.');a.target='_blank';a.rel='noopener';if(!a.querySelector('.wa-icon')){a.innerHTML=a.innerHTML.replace(/^\s*◉\s*/,'');a.insertAdjacentHTML('afterbegin',whatsappIcon)}}); }

function card(v){return `<article class="vehicle-card"><div class="vehicle-photo"><img src="${v.image}" alt="${v.brand} ${v.model}" loading="lazy">${v.featured?'<span class="tag">DESTAQUE</span>':''}</div><div class="vehicle-body"><h3>${v.brand} ${v.model}</h3><p class="version">${v.version||'Consulte a versão'}</p><a class="btn btn-wa card-wa" data-wa data-message="${messageFor(v)}">◉ Falar no WhatsApp</a><p class="specs">${v.year} &nbsp;•&nbsp; ${v.transmission||'Câmbio a consultar'} &nbsp;•&nbsp; ${Number(v.mileage||0).toLocaleString('pt-BR')} km<br>${v.fuel||'Combustível a consultar'} &nbsp;•&nbsp; ${v.color||'Cor a consultar'}</p><p class="price"><small>Valor</small>${money(v.price)}</p><p class="installment"><b>${v.installment?'A partir de '+money(v.installment)+'/mês':'Consulte as condições de financiamento'}</b></p><button class="details-btn" data-detail="${v.id}">Ver detalhes →</button></div></article>`}
const featuredGrid=document.querySelector('#featured-grid'), inventoryGrid=document.querySelector('#inventory-grid');
featuredGrid.innerHTML=vehicles.filter(v=>v.featured).map(card).join('');
let filters={};
function renderInventory(){let list=vehicles.filter(v=>(!filters.brand||v.brand===filters.brand)&&(!filters.model||v.model===filters.model)&&(!filters.minYear||v.year>=+filters.minYear)&&(!filters.maxYear||v.year<=+filters.maxYear)&&(!filters.transmission||v.transmission===filters.transmission)&&(!filters.maxPrice||!v.price||v.price<=+filters.maxPrice));const order=document.querySelector('#sort').value;if(order==='low')list.sort((a,b)=>(a.price||Infinity)-(b.price||Infinity));if(order==='high')list.sort((a,b)=>(b.price||0)-(a.price||0));if(order==='mileage')list.sort((a,b)=>a.mileage-b.mileage);inventoryGrid.innerHTML=list.map(card).join('');document.querySelector('#result-count').textContent=`${list.length} veículo${list.length===1?'':'s'} encontrado${list.length===1?'':'s'}`;document.querySelector('#empty').style.display=list.length?'none':'block';bindWhatsApp();bindDetails();}
const brand=document.querySelector('[name=brand]'),model=document.querySelector('[name=model]');[...new Set(vehicles.map(v=>v.brand))].sort().forEach(x=>brand.add(new Option(x,x)));[...new Set(vehicles.map(v=>v.model))].sort().forEach(x=>model.add(new Option(x,x)));
document.querySelector('#quick-form').addEventListener('submit',e=>{e.preventDefault();filters=Object.fromEntries(new FormData(e.currentTarget));renderInventory();document.querySelector('#estoque').scrollIntoView();});document.querySelector('#clear-filters').onclick=()=>{filters={};document.querySelector('#quick-form').reset();renderInventory()};document.querySelector('#sort').onchange=renderInventory;

const modal=document.querySelector('#vehicle-modal');function bindDetails(){document.querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>openVehicle(vehicles.find(v=>v.id===b.dataset.detail)));}
function openVehicle(v){history.replaceState(null,'',`#estoque/${v.brand}-${v.model}-${v.year}`.toLowerCase().replaceAll(' ','-'));const features=v.features?.length?v.features.join(' • '):'Consulte nossa equipe para conhecer os equipamentos e detalhes deste veículo.';document.querySelector('#modal-content').innerHTML=`<div class="modal-layout"><img class="modal-photo" src="${v.image}" alt="${v.brand} ${v.model}"><div class="modal-info"><p class="eyebrow dark">Disponível no estoque</p><h2>${v.brand} ${v.model}</h2><p>${v.version||'Consulte a versão'}</p><div class="modal-specs"><div><b>Ano</b><br>${v.year}</div><div><b>Quilometragem</b><br>${Number(v.mileage||0).toLocaleString('pt-BR')} km</div><div><b>Câmbio</b><br>${v.transmission||'Consulte'}</div><div><b>Combustível</b><br>${v.fuel||'Consulte'}</div><div><b>Cor</b><br>${v.color||'Consulte'}</div><div><b>Categoria</b><br>${v.category||'Consulte'}</div></div><p class="price">${money(v.price)}</p><p><b>${v.installment?'Parcelas a partir de '+money(v.installment)+'/mês':'Consulte as condições de financiamento'}</b></p><div class="modal-actions"><a class="btn btn-wa" data-wa data-message="${messageFor(v)}">◉ Tenho interesse — falar no WhatsApp</a><a href="#financiamento" class="btn btn-dark" onclick="document.querySelector('#vehicle-modal').close()">Simular financiamento</a><a href="#avaliacao" class="details-btn" onclick="document.querySelector('#vehicle-modal').close()">Tenho um veículo para dar na troca</a></div><h3>Destaques e equipamentos</h3><p>${features}</p></div></div>`;bindWhatsApp(document.querySelector('#modal-content'));modal.showModal();}
document.querySelector('.modal-close').onclick=()=>modal.close();modal.addEventListener('click',e=>{if(e.target===modal)modal.close()});

const faqs=['Os veículos possuem garantia?','Vocês aceitam carro usado na troca?','Posso financiar meu veículo?','Posso fazer uma simulação pelo WhatsApp?','Posso agendar uma visita?','Os veículos passam por avaliação?','Vocês entregam veículos em outras cidades?'];document.querySelector('#faq-list').innerHTML=faqs.map((q,i)=>`<div class="faq-item"><button aria-expanded="false">${q}<span>＋</span></button><div class="faq-answer">Consulte nossa equipe para verificar as condições aplicáveis a este veículo e à negociação.</div></div>`).join('');document.querySelectorAll('.faq-item button').forEach(b=>b.onclick=()=>{const p=b.parentElement;p.classList.toggle('open');b.setAttribute('aria-expanded',p.classList.contains('open'));b.querySelector('span').textContent=p.classList.contains('open')?'−':'＋'});

function digits(v){return Number((v||'').replace(/\D/g,''))||0}document.querySelector('#finance-form').addEventListener('input',e=>{const f=e.currentTarget;const financed=Math.max(0,digits(f.value.value)-digits(f.down.value));const installment=financed?financed/+f.months.value*1.018:0;document.querySelector('#estimate').textContent=installment?money(installment)+' /mês':'R$ — /mês'});
function handleForm(id,type){document.querySelector(id).addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget,status=f.querySelector('.form-status');if(!f.checkValidity()){f.reportValidity();status.textContent='Revise os campos obrigatórios.';return}status.textContent='Preparando sua solicitação…';setTimeout(()=>{const d=Object.fromEntries(new FormData(f));status.textContent='Recebemos sua solicitação! Abrindo o WhatsApp para continuar.';window.open(waLink(`Olá! Quero continuar minha solicitação de ${type}.\nDados: ${Object.entries(d).map(([k,v])=>`${k}: ${v}`).join(' | ')}`),'_blank')},500)})}handleForm('#finance-form','financiamento');handleForm('#trade-form','avaliação do meu carro');
document.querySelectorAll('[name=phone]').forEach(i=>i.addEventListener('input',()=>{let v=i.value.replace(/\D/g,'').slice(0,11);i.value=v.replace(/(\d{2})(\d{5})(\d{0,4})/,'($1) $2-$3')}));document.querySelector('.menu').onclick=e=>{const n=document.querySelector('#nav');n.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',n.classList.contains('open'))};document.querySelector('.filter-toggle').onclick=e=>{const f=document.querySelector('.filter-grid');f.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',f.classList.contains('open'));e.currentTarget.textContent=f.classList.contains('open')?'Fechar filtros':'Abrir filtros'};
async function loadRemoteContent(){
  if(!window.supabaseClient) return;
  try{
    const [{data:remoteVehicles,error:vehicleError},{data:settings,error:settingsError}]=await Promise.all([
      window.supabaseClient.from('vehicles').select('*').eq('active',true).order('created_at',{ascending:false}),
      window.supabaseClient.from('store_settings').select('*').eq('id',1).maybeSingle()
    ]);
    if(vehicleError||settingsError) throw vehicleError||settingsError;
    if(settings){
      if(settings.whatsapp) store.whatsapp=settings.whatsapp;
      const setText=(id,label,value,fallback)=>{const el=document.querySelector(id);if(el)el.textContent=value?`${label}: ${value}`:fallback};
      const name=document.querySelector('#footer-store-name');if(name&&settings.store_name)name.childNodes[0].nodeValue=settings.store_name.toUpperCase();
      setText('#footer-whatsapp','WhatsApp',settings.whatsapp,'WhatsApp: consulte nossa equipe');
      setText('#footer-phone','Telefone',settings.phone,'Telefone: consulte nossa equipe');
      setText('#footer-email','E-mail',settings.email,'E-mail: consulte nossa equipe');
      setText('#footer-address','Endereço',settings.address,'Endereço: consulte nossa equipe');
      const hours=document.querySelector('#footer-hours');if(hours)hours.textContent=settings.business_hours||'Consulte os horários de atendimento com nossa equipe.';
      const instagram=document.querySelector('#footer-instagram');if(instagram)instagram.textContent=settings.instagram?`Instagram: ${settings.instagram}`:'Instagram da Loja do Preto';
    }
    if(remoteVehicles?.length){
      vehicles=remoteVehicles.map(v=>({
        ...v,
        image:v.image_url||'https://raw.githubusercontent.com/Sato190/loja-do-preto/main/assets/hero-showroom.jpg',
        whatsappNumber:v.whatsapp_number||'',
        whatsappMessage:v.whatsapp_message||'',
        features:v.features||[]
      }));
      featuredGrid.innerHTML=vehicles.filter(v=>v.featured).map(card).join('');
      brand.innerHTML='<option value="">Todas</option>';model.innerHTML='<option value="">Todos</option>';
      [...new Set(vehicles.map(v=>v.brand))].sort().forEach(x=>brand.add(new Option(x,x)));
      [...new Set(vehicles.map(v=>v.model))].sort().forEach(x=>model.add(new Option(x,x)));
      renderInventory();bindDetails();
    }
    bindWhatsApp();
  }catch(error){console.warn('Conteúdo remoto indisponível; usando dados demonstrativos.',error.message)}
}
bindWhatsApp();renderInventory();loadRemoteContent();
if(window.supabaseClient){
  window.supabaseClient.channel('site-content')
    .on('postgres_changes',{event:'*',schema:'public',table:'vehicles'},loadRemoteContent)
    .on('postgres_changes',{event:'*',schema:'public',table:'store_settings'},loadRemoteContent)
    .subscribe();
}
