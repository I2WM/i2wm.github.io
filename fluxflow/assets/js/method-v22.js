/* Method-only progressive enhancement. No timers, autoplay, wheel handlers or scroll forcing. */
(()=>{'use strict';
 const root=document.getElementById('method');if(!root)return;
 const story=root.querySelector('[data-method-story]');if(!story)return;
 const controls=story.querySelector('[data-method-controls]'),tabs=[...story.querySelectorAll('[data-method-tab]')],panels=[...story.querySelectorAll('[data-method-panel]')];
 const previous=story.querySelector('[data-method-prev]'),next=story.querySelector('[data-method-next]'),status=story.querySelector('[data-method-status]'),all=story.querySelector('[data-method-all]');
 if(!controls||!previous||!next||!status||!all||tabs.length!==5||panels.length!==5)return;
 const preference=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 let current=0,expanded=false,animation=null,loop=0;
 const loopTabs=[...story.querySelectorAll('[data-method-loop-tab]')],loopPanels=[...story.querySelectorAll('[data-method-loop-panel]')],loopControls=story.querySelector('[data-loop-controls]');
 const cancel=()=>{animation?.cancel();animation=null;};
 function render(animate=false,direction=1){
  cancel();
  panels.forEach((panel,i)=>{panel.hidden=!expanded&&i!==current;panel.setAttribute('role',expanded?'region':'tabpanel');panel.setAttribute('aria-labelledby',expanded?panel.querySelector('h3').id:tabs[i].id);});
  tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===current));tab.tabIndex=i===current?0:-1;});
  previous.disabled=expanded||current===0;next.disabled=expanded||current===panels.length-1;
  all.setAttribute('aria-pressed',String(expanded));all.textContent=expanded?'Return to steps':'Read all steps';
  story.classList.toggle('method-read-all',expanded);
  status.textContent=expanded?'All five steps are shown in order.':`Step ${current+1} of ${panels.length} · ${tabs[current].textContent.trim().replace(/^\d+\s*/, '')}`;
  if(animate&&!expanded&&!preference?.matches&&typeof panels[current].animate==='function'){
   try{animation=panels[current].animate([{opacity:.65,transform:`translateX(${direction*20}px)`},{opacity:1,transform:'none'}],{duration:280,easing:'cubic-bezier(.16,1,.3,1)'});}catch{/* Visible state is already applied. */}
  }
 }
 function go(value,{focus=false,animate=true}={}){
  if(!Number.isFinite(value))return;
  const index=Math.max(0,Math.min(panels.length-1,Math.trunc(value)));const direction=index>=current?1:-1;const changed=index!==current||expanded;
  current=index;expanded=false;render(animate&&changed,direction);if(focus)tabs[current].focus();
 }
 function setLoop(value,{focus=false}={}){
  if(loopTabs.length!==4||loopPanels.length!==4||!Number.isFinite(value))return;
  loop=Math.max(0,Math.min(3,Math.trunc(value)));
  loopTabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===loop));tab.tabIndex=i===loop?0:-1;});
  loopPanels.forEach((panel,i)=>{panel.hidden=i!==loop;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',loopTabs[i].id);});
  if(focus)loopTabs[loop].focus();
 }
 function keyboard(event,index,count,select){
  let destination=index;
  if(event.key==='ArrowRight')destination=Math.min(count-1,index+1);
  else if(event.key==='ArrowLeft')destination=Math.max(0,index-1);
  else if(event.key==='Home')destination=0;
  else if(event.key==='End')destination=count-1;
  else return;
  event.preventDefault();select(destination,{focus:true});
 }
 tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>go(i));tab.addEventListener('keydown',event=>keyboard(event,i,tabs.length,go));});
 previous.addEventListener('click',()=>go(current-1));next.addEventListener('click',()=>go(current+1));
 all.addEventListener('click',()=>{expanded=!expanded;render();});
 loopTabs.forEach((tab,i)=>{tab.addEventListener('click',()=>setLoop(i));tab.addEventListener('keydown',event=>keyboard(event,i,loopTabs.length,setLoop));});
 const swipe=story.querySelector('[data-method-swipe]');let touch=null;
 swipe?.addEventListener('pointerdown',event=>{if(event.isPrimary===false||event.button>0)return;touch={x:event.clientX,y:event.clientY,id:event.pointerId};});
 swipe?.addEventListener('pointercancel',()=>{touch=null;});
 swipe?.addEventListener('pointerup',event=>{if(!touch||event.pointerId!==touch.id)return;const dx=event.clientX-touch.x,dy=event.clientY-touch.y;touch=null;if(expanded||Math.abs(dx)<60||Math.abs(dx)<Math.abs(dy)*1.8)return;go(current+(dx<0?1:-1));});
 function revealHash(hash){let target;try{target=document.getElementById(decodeURIComponent((hash||'').replace(/^#/,'')));}catch{return;}if(!target||!root.contains(target))return;const panel=target.closest('[data-method-panel]');const index=panels.indexOf(panel);if(index>=0)go(index,{animate:false});}
 document.addEventListener('click',event=>{const link=event.target.closest?.('a[href^="#"]');if(link)revealHash(link.getAttribute('href'));},true);
 window.addEventListener('hashchange',()=>revealHash(location.hash));window.addEventListener('popstate',()=>revealHash(location.hash));
 preference?.addEventListener?.('change',cancel);
 // Only enhance after structural checks and event registration. Plain HTML shows every stage.
 story.classList.add('method-enhanced');controls.hidden=false;
 if(loopControls&&loopTabs.length===4&&loopPanels.length===4){loopControls.hidden=false;setLoop(0);}
 render();revealHash(location.hash);
})();
