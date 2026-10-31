/* Visible-first, scroll-triggered accents. No scroll, wheel, navigation or hidden-state ownership. */
(()=>{'use strict';
 const root=document.getElementById('method');if(!root)return;
 const nodes=[...root.querySelectorAll('[data-m23-reveal]')];
 const preference=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 if(!('IntersectionObserver' in window)||!nodes.length)return;
 const seen=new WeakSet(),running=new Map();
 const cancel=()=>{for(const animation of running.values())animation.cancel();running.clear();};
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(!entry.isIntersecting||seen.has(entry.target))continue;
   seen.add(entry.target);observer.unobserve(entry.target);
   if(preference?.matches||typeof entry.target.animate!=='function')continue;
   try{const animation=entry.target.animate([{opacity:.65,transform:'translateY(20px)'},{opacity:1,transform:'none'}],{duration:620,easing:'cubic-bezier(.16,1,.3,1)'});running.set(entry.target,animation);animation.onfinish=()=>running.delete(entry.target);animation.oncancel=()=>running.delete(entry.target);}catch{/* Base content is already visible. */}
  }
 },{threshold:.08,rootMargin:'0px 0px -24px 0px'});
 function observe(){observer.disconnect();cancel();if(!preference?.matches)for(const node of nodes)if(!seen.has(node))observer.observe(node);}
 preference?.addEventListener?.('change',observe);observe();
})();
