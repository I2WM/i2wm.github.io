/* One owner for section jumps, mobile navigation, and native disclosures. */
(()=>{'use strict';
 const menu=document.querySelector('.menu-toggle'),nav=document.getElementById('section-nav');
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function closeMenu(restoreFocus=false){
  const wasOpen=menu.getAttribute('aria-expanded')==='true';
  menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');nav.classList.remove('is-open');
  if(wasOpen&&restoreFocus)menu.focus();
 }
 menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');nav.classList.toggle('is-open',open)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){e.preventDefault();closeMenu(nav.contains(document.activeElement)||document.activeElement===menu)}});
 document.addEventListener('click',e=>{if(!e.target.closest('.topbar'))closeMenu()});
 matchMedia('(min-width:1201px)').addEventListener('change',()=>closeMenu());
 function resolve(hash){try{return document.getElementById(decodeURIComponent(hash.replace(/^#/,'')))}catch{return null}}
 function openAncestors(target){for(let e=target;e;e=e.parentElement)if(e.tagName==='DETAILS')e.open=true}
 function focusTarget(target){const old=target.getAttribute('tabindex');target.setAttribute('tabindex','-1');target.focus({preventScroll:true});target.addEventListener('blur',()=>{old===null?target.removeAttribute('tabindex'):target.setAttribute('tabindex',old)},{once:true})}
 function jump(target,{focus=true,smooth=true}={}){openAncestors(target);closeMenu();requestAnimationFrame(()=>{if(focus)focusTarget(target);target.scrollIntoView({block:'start',behavior:smooth&&!reduced()?'smooth':'instant'});dispatchEvent(new Event('resize'))})}
 document.addEventListener('click',e=>{
  const a=e.target.closest('a[href^="#"]');if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.hasAttribute('data-figure-open'))return;
  const target=resolve(a.getAttribute('href'));if(!target)return;e.preventDefault();
  const next='#'+encodeURIComponent(target.id);if(location.hash!==next)history.pushState(null,'',next);jump(target);
 });
 let pendingRoute=0;
 function route(){cancelAnimationFrame(pendingRoute);pendingRoute=requestAnimationFrame(()=>{const target=resolve(location.hash||'#top');if(target)jump(target,{focus:false,smooth:false})})}
 addEventListener('popstate',route);addEventListener('hashchange',route);if(location.hash)route();
 document.addEventListener('toggle',e=>{if(e.target.tagName==='DETAILS'&&e.target.open)requestAnimationFrame(()=>dispatchEvent(new Event('resize')))},true);
 const links=[...nav.querySelectorAll('a[href^="#"]')];let frame=0;
 function active(){frame=0;let current=null;for(const a of links){const target=resolve(a.hash);if(target&&target.getBoundingClientRect().top<=120)current=a}for(const a of links)if(a===current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')}
 addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(active)},{passive:true});addEventListener('resize',active);active();
})();
