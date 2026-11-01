/* Scroll reveals the slide's overview → module → evidence sequence.
   Nothing is hidden by default, and scrolling always belongs to the reader. */
(()=>{'use strict';
 const root=document.getElementById('method');if(!root)return;
 const preference=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 if(!('IntersectionObserver' in window))return;
 const targets=[...root.querySelectorAll('[data-m27-motion]')],seen=new WeakSet(),running=new Map();
 function stop(node){const a=running.get(node);if(a){running.delete(node);a.cancel();}}
 function settle(){for(const node of [...running.keys()])stop(node);}
 function play(node,frames,options={}){
  if(!node||preference?.matches||typeof node.animate!=='function')return;
  stop(node);
  try{const animation=node.animate(frames,{duration:800,easing:'cubic-bezier(.2,.75,.25,1)',...options});running.set(node,animation);const done=()=>{if(running.get(node)===animation)running.delete(node);};animation.onfinish=done;animation.oncancel=done;}catch{/* Static content remains complete. */}
 }
 function enter(node){
  const role=node.dataset.m27Motion,img=node.querySelector('img');
  if(role==='overview'){
   // Both responsive maps use the same slide numbering; hidden one is inert.
   for(const [i,part] of ['1','4','proposal','2','3'].entries())for(const group of node.querySelectorAll(`[data-map-part="${part}"]`))
    play(group,[{opacity:.48,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:650,delay:i*140});
  }else if(role==='locate'){
   // Match the overview's module badge before introducing that module's image.
   play(node.querySelector('.m27-part-number'),[{transform:'scale(1.18)',backgroundColor:'rgba(255,255,255,.12)'},{transform:'scale(1)',backgroundColor:'rgba(255,255,255,0)'}],{duration:650});
   play(node.querySelector('h3'),[{transform:'translateX(14px)'},{transform:'none'}],{duration:700});
  }else if(role==='loop'){
   [...node.querySelectorAll('li')].forEach((li,i)=>play(li,[{backgroundColor:'rgba(245,197,140,.12)',transform:'translateX(8px)'},{backgroundColor:'rgba(245,197,140,0)',transform:'none'}],{duration:650,delay:i*130}));
  }else if(role==='after'){
   // Slide 9 uses a rightward wipe for the checked reconstruction.
   play(img,[{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0 0 0)'}],{duration:1000});
  }else if(role==='zoom-before'||role==='zoom-after'){
   play(img,[{transform:`scale(1.065) translateX(${role==='zoom-before'?-8:8}px)`},{transform:'scale(1) translateX(0px)'}],{duration:1100});
  }else if(role==='profile'){
   play(img,[{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0 0 0)'}],{duration:1100});
  }else if(role==='diagram'){
   play(img,[{transform:'scale(.96) translateX(-18px)'},{transform:'scale(1) translateX(0px)'}],{duration:900});
  }else if(role==='network'){
   play(img,[{transform:'translateY(16px) scale(.975)'},{transform:'none'}],{duration:900});
  }else{
   play(img,[{transform:`translateX(${role==='target'?18:-18}px)`},{transform:'none'}],{duration:800});
  }
 }
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(!entry.isIntersecting||entry.intersectionRatio<.25||seen.has(entry.target))continue;
   seen.add(entry.target);observer.unobserve(entry.target);
   if(!preference?.matches)enter(entry.target);
  }
 },{threshold:[.25],rootMargin:'0px 0px -32px 0px'});
 function observe(){observer.disconnect();settle();if(!preference?.matches)for(const node of targets)if(!seen.has(node))observer.observe(node);}
 function touchOrFocus(event){for(const node of [...running.keys()])if(node===event.target||node.contains?.(event.target)||event.target.contains?.(node))stop(node);}
 root.addEventListener('focusin',touchOrFocus);root.addEventListener('pointerdown',touchOrFocus);
 preference?.addEventListener?.('change',observe);window.addEventListener('pagehide',()=>{observer.disconnect();settle();},{once:true});observe();
})();
