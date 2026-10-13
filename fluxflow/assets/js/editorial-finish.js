/* Only the newly added architecture presentation; existing figure links stay intact. */
(()=>{
 const viewport=document.querySelector('.architecture-viewport'),buttons=[...document.querySelectorAll('[data-architecture-mode]')],hint=document.getElementById('architecture-help');
 if(!viewport||!buttons.length)return;
 buttons.forEach(button=>button.addEventListener('click',()=>{
  const mode=button.dataset.architectureMode;
  viewport.dataset.view=mode;
  buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  viewport.scrollLeft=0;
  hint.textContent=mode==='details'?'Swipe across the model — open the original for a closer look':'View the whole model — switch to details to read its layers';
 }));
})();
