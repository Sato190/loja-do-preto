(()=>{
  if(window.__ldpMotion)return;window.__ldpMotion=true;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target)}),{threshold:.12,rootMargin:'0px 0px -5%'});
  const signature='<div class="motion-signature" aria-hidden="true"><svg viewBox="0 0 1000 36" preserveAspectRatio="none"><path pathLength="1" d="M0 26H285c30 0 43-2 61-12 22-12 56-12 82 0l38 12h124l44-13c21-7 52-8 77 2l32 11H1000"/></svg></div>';
  function signatures(){
    if(document.querySelector('.motion-signature'))return;
    const targets=document.body.classList.contains('home-portal')?[document.querySelector('#destaques'),document.querySelector('.final-cta')]:[...document.querySelectorAll('main .portal-section,main .vehicle-knowledge')].slice(0,2);
    targets.filter(Boolean).forEach(target=>{target.insertAdjacentHTML('beforebegin',signature);const mark=target.previousElementSibling;if(target.classList.contains('section-dark')||target.classList.contains('dark'))mark.classList.add('light');revealObserver.observe(mark)});
  }
  function prepare(root=document){
    const cards=[...(root.matches?.('.vehicle-card,.catalog-card')?[root]:[]),...(root.querySelectorAll?.('.vehicle-card,.catalog-card')||[])];
    cards.forEach((card,index)=>{if(card.dataset.motionReady)return;card.dataset.motionReady='1';card.classList.add('showroom-reveal');card.style.setProperty('--reveal-delay',`${Math.min(index%3,2)*70}ms`);revealObserver.observe(card)});
    root.querySelectorAll?.('.section-title h2,.section-head h2,.editorial-copy h2,.vehicle-knowledge h2,.page-hero h1').forEach(title=>{if(title.dataset.motionReady)return;title.dataset.motionReady='1';title.classList.add('headlight-title');revealObserver.observe(title)});
    root.querySelectorAll?.('.timeline article').forEach(item=>revealObserver.observe(item));
    root.querySelectorAll?.('.negotiation-panel').forEach(panel=>requestAnimationFrame(()=>panel.classList.add('motion-ready')));
  }
  const mutations=new MutationObserver(records=>{signatures();records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===1)prepare(node)}))});
  function gallery(){document.addEventListener('click',event=>{const trigger=event.target.closest('[data-image],#prev-image,#next-image');if(!trigger)return;const image=document.querySelector('#main-vehicle-image');if(!image)return;image.classList.add('gallery-changing');setTimeout(()=>image.classList.remove('gallery-changing'),190);setTimeout(updateGalleryProgress,30)});updateGalleryProgress()}
  function updateGalleryProgress(){const index=document.querySelector('#gallery-index'),gallery=document.querySelector('.vehicle-gallery-main');if(!index||!gallery)return;let bar=gallery.querySelector('.vehicle-gallery-progress');if(!bar){bar=document.createElement('span');bar.className='vehicle-gallery-progress';bar.innerHTML='<span></span>';gallery.append(bar)}const [current,total]=index.textContent.split('/').map(Number);bar.style.setProperty('--gallery-progress',`${total?current/total*100:100}%`)}
  function animateVehicleNumbers(){const panel=document.querySelector('.negotiation-panel');if(!panel||reduced.matches)return;const values=[...panel.querySelectorAll('.vehicle-key-specs div')].find(x=>x.textContent.includes('KM'));if(!values)return;const text=values.innerHTML.match(/<br>([\d.]+)/);if(!text)return;const target=Number(text[1].replace(/\D/g,''));if(!target)return;const node=values.lastChild;node.textContent='0';node.parentElement.classList.add('motion-number');const start=performance.now(),duration=520;const tick=now=>{const p=Math.min(1,(now-start)/duration),eased=1-Math.pow(1-p,3);node.textContent=Math.round(target*eased).toLocaleString('pt-BR');if(p<1)requestAnimationFrame(tick)};requestAnimationFrame(tick)}
  function parallax(){if(reduced.matches||innerWidth<=900)return;const bg=document.querySelector('.hero-bg');if(!bg)return;let ticking=false;addEventListener('scroll',()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{bg.style.transform=`scale(1.025) translate3d(0,${Math.min(scrollY*.025,14)}px,0)`;ticking=false})},{passive:true})}
  const start=()=>{signatures();prepare();mutations.observe(document.body,{childList:true,subtree:true});gallery();setTimeout(()=>{prepare();updateGalleryProgress();animateVehicleNumbers()},500);parallax()};
  document.readyState==='loading'?addEventListener('DOMContentLoaded',start,{once:true}):start();
})();

