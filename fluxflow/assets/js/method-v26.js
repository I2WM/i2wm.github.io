/* Content stays visible. One entrance per scientific role, no scroll ownership. */
(()=>{'use strict';
 const root=document.getElementById('method');if(!root)return;
 const nodes=[...root.querySelectorAll('[data-m26-motion]')];
 const preference=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 if(!nodes.length||!('IntersectionObserver' in window))return;
 const seen=new WeakSet(),running=new Map();
 function stop(node){const a=running.get(node);if(a){running.delete(node);a.cancel();}}
 function cancel(){for(const n of [...running.keys()])stop(n);}
 function play(node,frames,options={}){if(preference?.matches||typeof node.animate!=='function')return;stop(node);try{const a=node.animate(frames,{duration:720,easing:'cubic-bezier(.16,1,.3,1)',...options});running.set(node,a);const clear=()=>{if(running.get(node)===a)running.delete(node);};a.onfinish=clear;a.oncancel=clear;}catch{/* Static final content remains visible. */}}
 function enter(node){
  const kind=node.dataset.m26Motion,img=node.querySelector('img');
  if(kind==='compare-left'||kind==='compare-right'){const x=kind==='compare-left'?-20:20;play(node,[{clipPath:'inset(0 12% 0 0)',transform:`translateX(${x}px)`},{clipPath:'inset(0 0 0 0)',transform:'none'}],{duration:760});}
  else if(kind==='zoom-left'||kind==='zoom-right'){if(img)play(img,[{transform:`scale(1.045) translateX(${kind==='zoom-left'?-6:6}px)`},{transform:'scale(1) translateX(0px)'}],{duration:920});}
  else if(kind==='diagram'){if(img)play(img,[{transform:'scale(.975) translateX(-12px)'},{transform:'scale(1) translateX(0px)'}],{duration:850});}
  else if(kind==='curve'){if(img)play(img,[{clipPath:'inset(0 28% 0 0)'},{clipPath:'inset(0 0 0 0)'}],{duration:900});}
  else if(kind==='flow'){[...node.querySelectorAll('li')].forEach((li,i)=>play(li,[{backgroundColor:'rgba(159,198,255,.16)',transform:'translateX(10px)'},{backgroundColor:'rgba(159,198,255,0)',transform:'none'}],{duration:700,delay:i*120}));}
  else{[...node.children].forEach((child,i)=>play(child,[{opacity:.92,transform:'translateX(-8px)'},{opacity:1,transform:'none'}],{duration:520,delay:Math.min(i*65,130)}));}
 }
 const observer=new IntersectionObserver(entries=>{for(const e of entries){if(!e.isIntersecting||seen.has(e.target))continue;seen.add(e.target);observer.unobserve(e.target);if(!preference?.matches)enter(e.target);}},{threshold:.08,rootMargin:'0px 0px -24px 0px'});
 function observe(){observer.disconnect();cancel();if(!preference?.matches)for(const node of nodes)if(!seen.has(node))observer.observe(node);}
 function settle(event){for(const node of [...running.keys()])if(node===event.target||node.contains?.(event.target)||event.target.contains?.(node))stop(node);}
 root.addEventListener('focusin',settle);root.addEventListener('pointerdown',settle);preference?.addEventListener?.('change',observe);observe();
})();
