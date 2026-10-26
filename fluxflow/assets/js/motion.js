/* Choreographed motion only: visible fallback, native controls, unchanged final layout. */
(()=>{'use strict';
 if(!Element.prototype.animate||!window.matchMedia)return;
 const preference=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width: 760px)');
 const groups=[],claimed=new WeakSet(),seen=new WeakSet(),running=new Map(),counts=new Map(),summaryClicks=new WeakSet();
 function add(container,targets,kind='content'){
  if(!container||container.closest('details'))return;const unique=[...targets].filter(node=>node&&!claimed.has(node));
  if(!unique.length)return;unique.forEach(node=>claimed.add(node));groups.push({container,targets:unique,kind});
 }
 const one=selector=>document.querySelector(selector),all=selector=>[...document.querySelectorAll(selector)];
 add(one('#top'),all('#top .paper-title,#top .paper-subtitle,#top .paper-authors,#top .paper-affiliations,#top .paper-contributions,#top .hero-context'),'hero');
 add(one('#atmosphere'),all('#atmosphere .atmosphere-photo,#atmosphere .atmosphere-copy'),'scene');
 for(const head of all('#main .sec-head'))add(head,[...head.children]);
 for(const [parent,children,kind] of [
  ['#observatories .observatory-grid',':scope > *','cards'],
  ['#observatories .survey-layout',':scope > *','content'],
  ['#dataset .dataset-stats',':scope > *','count'],
  ['#method .bento',':scope > .cell','process'],
  ['#results .clean-metrics',':scope > *','cards'],
  ['#hallucinations .explain-points',':scope > *','cards'],
  ['#paper .paper-resource-copy','.paper-identity,.resource-rows li,.paper-secondary-actions','resources']
 ]){const container=one(parent);if(container)add(container,container.querySelectorAll(children),kind)}
 for(const node of all('#method .model-figure,#results-examples .paired-dataset,#hallucinations .evidence-figure,#paper .paper-preview'))add(node,[node],'figure');
 add(one('#compare .dual-comparison'),[one('#compare .dual-comparison')]);
 add(one('#abstract .abstract-text'),[one('#abstract .abstract-text')]);
 add(one('#results .clean-result-chart'),[one('#results .clean-result-chart')],'chart');
 function stop(node){counts.get(node)?.();const animation=running.get(node);if(animation){animation.cancel();running.delete(node)}}
 function stopTree(root){for(const node of [...running.keys(),...counts.keys()])if(root===node||root.contains(node))stop(node)}
 function stopAll(){for(const node of [...running.keys(),...counts.keys()])stop(node)}
 function animate(node,frames,options){
  stop(node);if(preference.matches||!node.isConnected)return;
  try{const animation=node.animate(frames,{easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards',...options});running.set(node,animation);
   const clear=()=>{if(running.get(node)===animation)running.delete(node)};animation.onfinish=clear;animation.oncancel=clear;
  }catch{/* Keep the original visible final state. */}
 }
 function drawBars(){
  const chart=one('#results .clean-result-chart');if(!chart)return;
  stopTree(chart);const rect=chart.getBoundingClientRect();if(preference.matches||rect.bottom<=0||rect.top>=innerHeight||chart.contains(document.activeElement))return;seen.add(chart);observer?.observe(chart);
  // Baseline CSS locks transform:none!important. Clip draws the existing final-width
  // bar from zero without modifying its real width, data label, or accessible value.
  all('#results .bar-fill').forEach((bar,index)=>animate(bar,[{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)'}],{duration:mobile.matches?650:1000,delay:index*(mobile.matches?35:65)}));
 }
 function countUp(card,index){
  const number=card.querySelector('dd');if(!number)return;stop(number);if(matchMedia('(forced-colors: active)').matches)return;
  const source=number.textContent.trim();if(!/^\d{1,3}(,\d{3})*$/.test(source))return;
  const value=Number(source.replaceAll(',','')),style=number.getAttribute('style'),color=getComputedStyle(number).color;
  const clone=document.createElement('span');clone.setAttribute('aria-hidden','true');clone.className='motion-count';clone.textContent='0';
  Object.assign(clone.style,{position:'absolute',inset:'0',color,pointerEvents:'none'});
  let frame=0,finished=false;
  const cleanup=()=>{if(finished)return;finished=true;cancelAnimationFrame(frame);clone.remove();style===null?number.removeAttribute('style'):number.setAttribute('style',style);counts.delete(number)};
  counts.set(number,cleanup);
  try{
   if(getComputedStyle(number).position==='static')number.style.setProperty('position','relative');
   number.style.setProperty('color','transparent','important');number.append(clone);
   const start=performance.now()+index*100,duration=mobile.matches?800:1150;
   const tick=now=>{if(finished)return;if(preference.matches||!number.isConnected){cleanup();return}const progress=Math.max(0,Math.min(1,(now-start)/duration));
    clone.textContent=Math.round(value*(1-Math.pow(1-progress,3))).toLocaleString('en-US');
    if(progress>=1)cleanup();else frame=requestAnimationFrame(tick);
   };frame=requestAnimationFrame(tick);
  }catch{cleanup()}
 }
 function play(node,{kind='content',index=0}={}){
  stopTree(node);if(preference.matches||!node.isConnected||node.contains(document.activeElement))return;
  if(kind==='chart'){drawBars();return}
  if(kind==='count'){countUp(node,index);return}
  if(kind==='process'){const title=node.querySelector('h3');if(title)animate(title,[{boxShadow:'inset 0 -3px 0 #9fc6ff00'},{boxShadow:'inset 0 -3px 0 #9fc6ff',offset:.35},{boxShadow:'inset 0 -3px 0 #9fc6ff',offset:.7},{boxShadow:'inset 0 -3px 0 #9fc6ff00'}],{duration:mobile.matches?900:1300,delay:index*(mobile.matches?260:420)});return}
  const small=mobile.matches,focused=node.contains(document.activeElement),transformed=getComputedStyle(node).transform!=='none';
  let duration=small?540:720,delay=Math.min(index*(small?70:110),small?280:440);
  let frames=[{opacity:.35},{opacity:1}];
  if(kind==='scene'&&node.classList.contains('atmosphere-photo')){
   duration=small?800:1150;delay=0;
   frames=transformed?[{opacity:.72},{opacity:1}]:[{opacity:.72,transform:'scale(1.045)'},{opacity:1,transform:'scale(1)'}];
  }else if(!focused&&!transformed){
   const y=kind==='hero'?(small?24:44):kind==='disclosure'?(small?12:18):(small?18:30);
   frames=[{opacity:kind==='figure'?.55:.3,transform:`translateY(${y}px)`},{opacity:1,transform:'translateY(0)'}];
  }
  if(kind==='figure'){frames=[{clipPath:'inset(0 32% 0 0)'},{clipPath:'inset(0 0% 0 0)'}];duration=small?650:950;delay=0}
  if(kind==='hero')duration=small?650:900;
  if(kind==='disclosure'){duration=small?280:360;delay=Math.min(index*45,135)}
  animate(node,frames,{duration,delay});
 }
 let observer=null;
 function destination(hash){try{return hash&&document.getElementById(decodeURIComponent(hash.replace(/^#/,'')))}catch{return null}}
 function settleDestination(hash){stopAll();const target=destination(hash);if(!target)return;const section=target.closest('section')||target;
  for(const group of groups)if(section.contains(group.container)||group.container.contains(target)){seen.add(group.container);observer?.unobserve(group.container)}
 }
 const byContainer=new Map(groups.map(group=>[group.container,group]));
 if('IntersectionObserver' in window)observer=new IntersectionObserver(entries=>{
  for(const entry of entries){const group=byContainer.get(entry.target);if(!group)continue;
   if(!entry.isIntersecting){if(seen.has(entry.target)){group.targets.forEach(stopTree);observer.unobserve(entry.target)}continue}
   if(seen.has(entry.target))continue;seen.add(entry.target);
   const rect=entry.target.getBoundingClientRect();
   if(!preference.matches&&rect.bottom>0&&rect.top<innerHeight)group.targets.forEach((node,index)=>play(node,{kind:group.kind,index}));
  }
 },{threshold:.08});
 function observe(){if(observer&&!preference.matches)for(const group of groups)if(!seen.has(group.container))observer.observe(group.container)}
 document.addEventListener('click',event=>{
  const target=event.target instanceof Element?event.target:null;if(!target)return;
  const anchor=target.closest('a[href^="#"]');if(anchor){settleDestination(anchor.getAttribute('href'));return}
  const summary=target.closest('summary');if(summary?.parentElement?.tagName==='DETAILS')summaryClicks.add(summary.parentElement);
 },true);
 document.addEventListener('focusin',event=>{for(const node of [...running.keys(),...counts.keys()])if(node.contains(event.target))stop(node)},true);
 document.addEventListener('toggle',event=>{
  const details=event.target;if(details.tagName!=='DETAILS')return;
  const fromSummary=summaryClicks.has(details);summaryClicks.delete(details);
  [...details.children].filter(child=>child.tagName!=='SUMMARY').forEach((child,index)=>{stopTree(child);if(details.open&&fromSummary)play(child,{kind:'disclosure',index})});
 },true);
 const results=one('#results');
 if(results&&'MutationObserver' in window){let scale=results.getAttribute('data-current-result-scale');
  new MutationObserver(()=>{const current=results.getAttribute('data-current-result-scale');if(current===scale)return;scale=current;drawBars()}).observe(results,{attributes:true,attributeFilter:['data-current-result-scale']});
 }
 const route=()=>settleDestination(location.hash);addEventListener('hashchange',route);addEventListener('popstate',route);
 const change=()=>{stopAll();observer?.disconnect();observe()};
 if(preference.addEventListener)preference.addEventListener('change',change);else preference.addListener?.(change);
 if(location.hash)settleDestination(location.hash);observe();
})();
