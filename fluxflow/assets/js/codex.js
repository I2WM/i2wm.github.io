/* Local codex iteration: scale-specific comparison, accessible figures, truthful clipboard feedback. */
(()=>{'use strict';
 const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
 function comparisons(){
  $$('.scale-comparison').forEach(panel=>{
   const scale=Number(panel.dataset.scale),field=$('[data-scale-field]',panel),method=$('[data-scale-method]',panel),slider=$('[data-scale-slider]',panel),stage=$('.scale-stage',panel),under=$('[data-scale-under]',panel),over=$('[data-scale-over]',panel),label=$('[data-scale-label]',panel),status=$('.scale-status',panel);
   const allowed=row=>row===5?['swinir','hat','fisr','hst']:['hat','swinir','fisr','bicubic','cgan','gdnet','asbridge','hst'];
   let generation=0;
   async function load(){
    const row=Number(field.value),ok=allowed(row);[...method.options].forEach(o=>o.disabled=!ok.includes(o.value));if(!ok.includes(method.value))method.value='hat';
    const choice=method.value,name=method.selectedOptions[0].textContent,letter=String.fromCharCode(65+row);label.textContent=name;
    const g=++generation;status.textContent='Loading Field '+letter+'…';panel.setAttribute('aria-busy','true');
    // Decode both frames before swapping so the divider never briefly compares different fields.
    const a=new Image(),b=new Image();a.src=`assets/img/complete/r${row}-${choice}.png`;b.src=`assets/img/complete/r${row}-fluxflow.png`;
    try{await Promise.all([a.decode(),b.decode()]);if(g!==generation)return;under.src=a.src;over.src=b.src;under.alt=`${name} · Field ${letter} · ×${scale}`;over.alt=`FluxFlow · the same Field ${letter} · ×${scale}`;status.textContent=`Field ${letter} · ×${scale} · ${name} vs FluxFlow`;panel.dataset.currentRow=String(row);panel.dataset.currentMethod=choice;}catch{if(g===generation)status.textContent='This image could not be loaded. Please choose another field.';}finally{if(g===generation)panel.removeAttribute('aria-busy');}
   }
   const position=()=>{stage.style.setProperty('--position',slider.value+'%');slider.setAttribute('aria-valuetext',`${slider.value}% ${label.textContent}, ${100-Number(slider.value)}% FluxFlow`)};
   slider.addEventListener('input',position);field.addEventListener('change',load);method.addEventListener('change',load);position();load();
  });
 }
 function citation(){
  const b=$('.citation-copy'),pre=$('#bibtex'),status=$('.citation-status');if(!b||!pre)return;
  b.addEventListener('click',async()=>{
   const text=pre.textContent;let ok=false;
   if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(text);ok=true;}catch{}}
   if(!ok){const area=document.createElement('textarea');area.value=text;area.setAttribute('aria-label','Citation clipboard helper');Object.assign(area.style,{position:'fixed',left:'-10000px',top:'0'});document.body.append(area);area.select();try{ok=document.execCommand('copy')}catch{}area.remove();b.focus();}
   if(ok){b.textContent='Copied';status.textContent='BibTeX copied to the clipboard.';setTimeout(()=>b.textContent='Copy BibTeX',2200);}
   else{const range=document.createRange();range.selectNodeContents(pre);const sel=getSelection();sel.removeAllRanges();sel.addRange(range);b.textContent='Copy BibTeX';status.textContent='Automatic copy is unavailable. The citation is selected; press Ctrl+C or ⌘C.';}
  });
 }
 function figures(){
  const dialog=document.createElement('dialog');dialog.className='image-inspector';dialog.setAttribute('aria-labelledby','figure-inspector-title');dialog.innerHTML='<div class="inspector-head"><span id="figure-inspector-title">Research figure</span><button type="button" class="inspector-close" aria-label="Close image">×</button></div><img class="inspector-image" alt=""><a class="inspector-original" target="_blank" rel="noopener">Open original image ↗</a>';document.body.append(dialog);
  let opener=null;const image=$('img',dialog),title=$('#figure-inspector-title',dialog),original=$('.inspector-original',dialog);
  $$('[data-figure-open]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();opener=a;const source=a.href,fig=a.closest('figure'),related=a.querySelector('img')||fig?.querySelector('img');image.src=source;image.alt=related?.alt||'Original research figure';title.textContent=a.dataset.figureTitle||fig?.querySelector('.figure-topline span')?.textContent||'Research figure';original.href=source;dialog.showModal();document.documentElement.style.overflow='hidden';$('.inspector-close',dialog).focus()}));
  const close=()=>dialog.close();$('.inspector-close',dialog).addEventListener('click',close);dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close()}});dialog.addEventListener('close',()=>{document.documentElement.style.overflow='';opener?.focus()});
 }
 function table(){
  const host=$('[data-table-host]');if(!host)return;
  const mark=()=>{for(const row of $$('tbody tr',host)){const cells=[...row.cells];if(cells.length!==10)continue;const vals=cells.slice(2).map(c=>Number(c.textContent));if(vals.some(x=>!Number.isFinite(x)))continue;const best=cells[1].textContent.includes('↓')?Math.min(...vals):Math.max(...vals);cells.forEach(c=>c.classList.remove('best'));cells.slice(2).forEach((c,i)=>{if(vals[i]===best)c.classList.add('best')})}};
  mark();new MutationObserver(es=>{if(es.some(e=>e.type==='childList'))mark()}).observe(host,{childList:true});
 }
 function filmKeys(){
  const f=$('[data-film]'),v=f?.querySelector('video');if(!f||!v)return;f.tabIndex=0;f.setAttribute('aria-label','FluxFlow film. Space plays or pauses; A/D or arrow keys seek five seconds.');
  f.addEventListener('keydown',e=>{if(e.target.closest('input,select,textarea')||e.target.closest('[data-bar]'))return;const delta={a:-5,A:-5,d:5,D:5,ArrowLeft:-5,ArrowRight:5}[e.key];if(delta){e.preventDefault();v.currentTime=Math.max(0,Math.min((v.duration||72)-.05,v.currentTime+delta))}else if(e.key===' '&&e.target===f){e.preventDefault();v.paused?v.play().catch(()=>{}):v.pause()}});
 }

 function datasetPairs(){
  const tabs=$$('.pair-tabs [data-pair-scale]');if(!tabs.length)return;
  const show=active=>{tabs.forEach(b=>{const on=b===active;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1});$$('[data-pair-view]').forEach(p=>p.hidden=p.dataset.pairView!==active.dataset.pairScale)};
  tabs.forEach((b,i)=>{b.addEventListener('click',()=>show(b));b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;show(tabs[n]);tabs[n].focus()})});
 }

 function boot(){for(const [name,fn] of Object.entries({comparisons,citation,datasetPairs,figures,table,filmKeys})){try{fn()}catch(e){(window.__codexErrors??=[]).push(name+': '+e.message);console.error(e)}}window.__codexReady=true;}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
