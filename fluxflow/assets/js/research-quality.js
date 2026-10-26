/* Native scientific-image navigation and predictable project anchor focus. */
(()=>{
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const strips=[...document.querySelectorAll('[data-sample-strip]')];
 for(const strip of strips){
  const view=strip.closest('[data-pair-view]'),nav=view.querySelector('.sample-strip-nav'),cards=[...strip.querySelectorAll('.pair-row>div')];
  if(!nav||cards.length!==3)continue;
  const buttons=[...nav.querySelectorAll('[data-sample-step]')],status=nav.querySelector('[data-sample-position]');
  const width=()=>cards[1].offsetLeft-cards[0].offsetLeft;
  const index=()=>Math.max(0,Math.min(2,Math.round(strip.scrollLeft/Math.max(1,width()))));
  const update=()=>{const i=index();status.textContent=cards[i].querySelector('.sample-view-label').textContent+' · '+(i+1)+' of 3';buttons.forEach(b=>b.disabled=Number(b.dataset.sampleStep)<0?i===0:i===2)};
  const move=step=>strip.scrollTo({left:Math.max(0,Math.min(2,index()+step))*width(),behavior:reduced()?'instant':'smooth'});
  buttons.forEach(b=>b.addEventListener('click',()=>move(Number(b.dataset.sampleStep))));
  strip.addEventListener('keydown',e=>{if(e.target!==strip||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const i=e.key==='Home'?0:e.key==='End'?2:Math.max(0,Math.min(2,index()+(e.key==='ArrowRight'?1:-1)));strip.scrollTo({left:i*width(),behavior:reduced()?'instant':'smooth'})});
  strip.addEventListener('scroll',update,{passive:true});addEventListener('resize',update,{passive:true});
  new MutationObserver(()=>requestAnimationFrame(()=>{strip.scrollLeft=0;update()})).observe(view,{attributes:true,attributeFilter:['hidden']});update();
 }
 const zoom=document.querySelector('.lightbox');
 if(zoom){
  zoom.setAttribute('role','dialog');zoom.setAttribute('aria-modal','true');zoom.setAttribute('aria-label','Original research image');
  const close=zoom.querySelector('button');let returnFocus=null;
  document.addEventListener('click',e=>{const a=e.target.closest('a.zoom');if(a)returnFocus=a},true);
  new MutationObserver(()=>{
   if(zoom.classList.contains('is-open'))close.focus({preventScroll:true});
   else if(returnFocus){returnFocus.focus({preventScroll:true});returnFocus=null}
  }).observe(zoom,{attributes:true,attributeFilter:['class']});
  zoom.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();close.focus()}});
 }
})();
