/* Quantitative visualization reads the existing verified paper table.
   Changing scale never changes the image-pair tabs or the two comparison fields. */
(()=>{
 const root=document.getElementById('results'),host=document.querySelector('#full-results [data-table-host]');
 if(!root||!host)return;
 const buttons=[...root.querySelectorAll('[data-result-scale]')],bars=[...root.querySelectorAll('.bars>.bar')],chart=root.querySelector('.bars');
 let active='2';
 function read(scale,metric){
  const row=[...host.querySelectorAll('tbody tr')].find(r=>r.cells[0]?.textContent.trim()==='×'+scale&&r.cells[1]?.textContent.startsWith(metric));
  if(!row)return null;
  const values=[...row.cells].slice(2).map(c=>({text:c.textContent.trim(),value:Number(c.textContent)}));
  if(values.length!==8||values.some(v=>!Number.isFinite(v.value)))return null;
  return values;
 }
 function show(scale){
  const values=read(scale,'Flux-L1'),ssim=read(scale,'SSIM');if(!values||!ssim)return;
  active=scale;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.resultScale===scale)));
  root.dataset.currentResultScale=scale;
  root.querySelector('.metric-set').textContent='Source-flux error (Flux-L1)';
  root.querySelector('.bignum').textContent=values[7].text;
  
  root.querySelector('[data-result-ssim]').textContent=ssim[7].text;
  bars.forEach((bar,i)=>{bar.style.setProperty('--v',values[i].text);bar.style.setProperty('--flux-width',values[i].value/20*100+'%');bar.querySelector('.bar-val').textContent=values[i].text});
  chart.setAttribute('aria-label','Flux-L1 at ×'+scale+', lower is better. Shared axis from 0 to 20. '+bars.map((b,i)=>b.querySelector('.bar-name').textContent+' '+values[i].text).join(', ')+'.');
  root.querySelector('[data-result-announcement]').textContent='×'+scale+' reported results: FluxFlow Flux-L1 '+values[7].text+'; SSIM '+ssim[7].text+'. Source: paper Table 2.';
 }
 buttons.forEach((button,i)=>{button.addEventListener('click',()=>show(button.dataset.resultScale));button.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const next=buttons[(i+1)%2];next.focus();show(next.dataset.resultScale)})});
 if(host.querySelector('tbody'))show(active);
 else new MutationObserver((_,observer)=>{if(host.querySelector('tbody')){show(active);observer.disconnect()}}).observe(host,{childList:true,subtree:true});
})();

