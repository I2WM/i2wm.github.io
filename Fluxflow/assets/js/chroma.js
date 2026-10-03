(() => {
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#section-nav');
  function closeMenu(){menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');nav.classList.remove('is-open')}
  menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');nav.classList.toggle('is-open',open)});
  nav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
  document.addEventListener('click',e=>{if(!e.target.closest('.topbar'))closeMenu()});
  matchMedia('(min-width:901px)').addEventListener('change',closeMenu);

  function openDeepTarget(hash){let target=document.getElementById(hash.replace(/^#/,''));while(target){if(target.matches('details.deep-dive'))target.open=true;target=target.parentElement}}
  openDeepTarget(location.hash);
  addEventListener('hashchange',()=>openDeepTarget(location.hash));
  document.addEventListener('click',e=>{const link=e.target.closest('a[href^="#"]');if(link)openDeepTarget(link.getAttribute('href'))},true);
  document.querySelectorAll('details.deep-dive').forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open)requestAnimationFrame(()=>dispatchEvent(new Event('resize')))}));

  const bar=document.querySelector('.topbar');
  const colored=[['method','cobalt'],['overview','lime'],['film','plum'],['story','plum'],['technical','cobalt'],['compare','plum'],['dataset','lime'],['research-team','plum'],['literature','rose'],['appendix-h','plum'],['knobs','lime'],['downstream','paper'],['benchmark','cobalt'],['analysis','paper'],['ablation','rose'],['otherdata','paper'],['cost','lime'],['impl','cobalt'],['reading','paper']].map(([id,tone])=>[document.getElementById(id),tone]);
  let pending=0;
  function updateSurface(){pending=0;let tone='paper';const probe=bar.clientHeight+40;const hero=document.getElementById('top');if(hero.classList.contains('project-hero')&&hero.getBoundingClientRect().bottom>probe)tone='night';for(const [section,value] of colored){const box=section.getBoundingClientRect();if(box.top<=probe&&box.bottom>probe)tone=value}bar.dataset.surface=tone}
  function queueSurface(){if(!pending)pending=requestAnimationFrame(updateSurface)}
  addEventListener('scroll',queueSurface,{passive:true});addEventListener('resize',queueSurface);updateSurface();
  document.addEventListener('toggle',queueSurface,true);

  const track=document.querySelector('.gallery-track'),cards=[...document.querySelectorAll('.field-card')];
  const filters=[...document.querySelectorAll('[data-filter]')];
  const prevScroll=document.querySelector('[data-gallery-scroll="-1"]'),nextScroll=document.querySelector('[data-gallery-scroll="1"]');
  function arrows(){prevScroll.disabled=track.scrollLeft<=1;nextScroll.disabled=track.scrollLeft+track.clientWidth>=track.scrollWidth-2}
  filters.forEach(button=>button.addEventListener('click',()=>{
    const type=button.dataset.filter;
    filters.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    cards.forEach(card=>card.hidden=type!=='all'&&card.dataset.fieldType!==type);
    track.scrollTo({left:0,behavior:'instant'});requestAnimationFrame(arrows);
  }));
  [prevScroll,nextScroll].forEach(button=>button.addEventListener('click',()=>track.scrollBy({left:Number(button.dataset.galleryScroll)*track.clientWidth*.8,behavior:reduced?'instant':'smooth'})));
  track.addEventListener('scroll',arrows,{passive:true});new ResizeObserver(arrows).observe(track);arrows();
  track.addEventListener('keydown',e=>{if(e.target===track&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();track.scrollBy({left:(e.key==='ArrowRight'?1:-1)*track.clientWidth*.7,behavior:reduced?'instant':'smooth'})}});
  let down=false,startX=0,startScroll=0,dragged=false;
  track.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;down=true;dragged=false;startX=e.clientX;startScroll=track.scrollLeft});
  track.addEventListener('pointermove',e=>{if(!down)return;const delta=e.clientX-startX;if(Math.abs(delta)>6){dragged=true;track.classList.add('is-dragging');if(!track.hasPointerCapture(e.pointerId))track.setPointerCapture(e.pointerId)}if(dragged)track.scrollLeft=startScroll-delta});
  const release=()=>{down=false;track.classList.remove('is-dragging')};
  track.addEventListener('pointerup',release);track.addEventListener('pointercancel',release);track.addEventListener('lostpointercapture',release);
  track.addEventListener('click',e=>{if(dragged){e.preventDefault();e.stopPropagation();dragged=false}},true);
  track.addEventListener('dragstart',e=>e.preventDefault());

  const dialog=document.querySelector('.field-dialog'),image=dialog.querySelector('.field-dialog-image');
  const title=dialog.querySelector('#gallery-dialog-title'),caption=dialog.querySelector('[data-gallery-caption]'),original=dialog.querySelector('[data-gallery-original]');
  let selected=null,opener=null;
  const visible=()=>cards.filter(card=>!card.hidden).map(card=>card.querySelector('.field-open'));
  function show(button){selected=button;image.src=button.dataset.gallerySrc;image.alt=button.querySelector('img').alt;title.textContent=button.dataset.galleryTitle;caption.textContent=button.dataset.gallerySource+' / Original project image';original.href=button.dataset.gallerySrc;if(!dialog.open){opener=button;dialog.showModal()}}
  cards.forEach(card=>card.querySelector('button').addEventListener('click',e=>show(e.currentTarget)));
  function step(direction){const items=visible(),index=items.indexOf(selected);show(items[(index+direction+items.length)%items.length])}
  dialog.querySelector('[data-gallery-prev]').addEventListener('click',()=>step(-1));dialog.querySelector('[data-gallery-next]').addEventListener('click',()=>step(1));
  dialog.querySelector('[data-gallery-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();step(e.key==='ArrowRight'?1:-1)}});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
  dialog.addEventListener('close',()=>{if(opener&&!opener.closest('[hidden]'))opener.focus({preventScroll:true})});
})();
