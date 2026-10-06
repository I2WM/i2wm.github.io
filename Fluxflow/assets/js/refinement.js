(()=>{
 const ids=['top','film','method','results','compare','dataset','paper'];
 const enabled=new Set(['top','film','method','compare','dataset','paper']);
 ids.forEach(id=>document.getElementById(id).classList.toggle('is-refined',enabled.has(id)));
 document.body.classList.toggle('hero-refined',enabled.has('top'));
 const make=(tag,className,html)=>{const e=document.createElement(tag);e.className=className;e.innerHTML=html;return e};
 const byId=id=>document.getElementById(id);
 const action=make('a','project-action refine-only code-action','<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 5-5 5 5 5m6-10 5 5-5 5m-2-13-2 16"/></svg>Code');
 action.href='https://github.com/I2WM/FluxFlow';action.target='_blank';action.rel='noopener';
 byId('top').querySelector('.project-actions').append(action);
 const actionNodes=[...byId('top').querySelectorAll('.project-action')];
 actionNodes[0].classList.add('watch-action');actionNodes[1].classList.add('paper-action');
 actionNodes[2].classList.add('dataset-action');actionNodes[3].classList.add('bibtex-action');
 const film=byId('film');film.querySelector('.film-heading').append(make('p','refine-only film-summary','The method, the evidence, and the real sky.<br><span>72 seconds · Sound available</span>'));
 ['method','results','compare'].forEach((id,i)=>{
  const k=byId(id).querySelector('.kicker');k.prepend(make('span','refine-only section-number',String(i+1).padStart(2,'0')));
 });
 byId('results').querySelector('.metric--hero').append(make('p','refine-only metric-context','Lower is better<br><span>DESI–HST · ×2</span>'));
 byId('compare').querySelector('.cmp-stage').insertAdjacentElement('afterend',make('p','refine-only compare-guide','<span aria-hidden="true">↔</span> Drag the divider to inspect the same field'));
 const stats=make('dl','refine-only release-stats','<div><dt>Training</dt><dd>17,737</dd></div><div><dt>Test</dt><dd>1,701</dd></div><div><dt>Scales</dt><dd>×2 / ×4</dd></div>');
 const dataset=byId('dataset');dataset.querySelector('.dek').after(stats);
 const resources=make('nav','refine-only resource-actions','');resources.setAttribute('aria-label','Primary research resources');
 [...byId('paper').querySelectorAll('.links>li')].slice(0,3).forEach(li=>{const a=li.querySelector('a').cloneNode(true);resources.append(a)});
 byId('paper').querySelector('.paper-venue').after(resources);
 dispatchEvent(new Event('resize'));
})();
