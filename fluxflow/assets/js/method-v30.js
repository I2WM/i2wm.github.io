/* Current-step scrollytelling. Scientific pixels and text stay stationary. */
(()=>{'use strict';
 const root=document.getElementById('method');if(!root)return;
 const chapters=[...root.querySelectorAll('[data-method-part]')];
 const links=[...root.querySelectorAll('.m28-flow a[href^="#method-part-"]')];
 if(!chapters.length||!('IntersectionObserver' in window))return;
 const visible=new Map();
 function current(chapter){
  for(const item of chapters){if(item===chapter)item.setAttribute('data-reading-current','');else item.removeAttribute('data-reading-current');}
  for(const link of links){if(link.getAttribute('href')==='#'+chapter.id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}
 }
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(entry.isIntersecting&&entry.intersectionRatio>=.12)visible.set(entry.target,entry.intersectionRatio);else visible.delete(entry.target);
   if(entry.target.matches('.m27-figure')){
    if(entry.isIntersecting)entry.target.setAttribute('data-reading-evidence','');else entry.target.removeAttribute('data-reading-evidence');
   }
  }
  const best=[...visible].sort((a,b)=>b[1]-a[1])[0];const chapter=best?.[0].closest('[data-method-part]');if(chapter)current(chapter);
 },{threshold:[.12,.35,.65,1],rootMargin:'-140px 0px -15% 0px'});
 for(const chapter of chapters)for(const node of chapter.querySelectorAll('.m27-chapter-head,.m27-figure'))observer.observe(node);
 window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
})();
