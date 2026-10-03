(() => {
  'use strict';
  const hero=document.querySelector('.project-hero'),canvas=document.querySelector('.project-sky');
  if(!hero||!canvas)return;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let seed=0xF10A,stars=[],w=0,h=0,frame=0,visible=false,last=0;
  const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296};
  for(let i=0;i<150;i++)stars.push({x:random(),y:random(),r:.35+random()*1.7,a:.12+random()*.48,phase:random()*Math.PI*2});
  function size(){const box=hero.getBoundingClientRect(),scale=Math.min(devicePixelRatio||1,2);w=box.width;h=box.height;canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);ctx.setTransform(scale,0,0,scale,0,0);draw(0)}
  function draw(time){ctx.clearRect(0,0,w,h);ctx.fillStyle='#06080a';ctx.fillRect(0,0,w,h);
    for(const star of stars){const x=star.x*w,y=star.y*h,r=star.r*(w<600?.75:1),a=star.a*(reduced?1:.85+.15*Math.sin(time*.00035+star.phase));
      const glow=ctx.createRadialGradient(x,y,0,x,y,r*4);glow.addColorStop(0,`rgba(225,232,240,${a})`);glow.addColorStop(.3,`rgba(205,216,236,${a*.3})`);glow.addColorStop(1,'rgba(205,216,236,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,r*4,0,Math.PI*2);ctx.fill();
    }
    ctx.strokeStyle='rgba(166,180,197,.045)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(w*.99,h*.055,w*.065,h*.14,.32,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.ellipse(w*1.015,h*.04,w*.025,h*.17,.32,0,Math.PI*2);ctx.stroke();
    for(const [x,y] of [[.064,.264],[.73,.735],[.21,.145]]){ctx.strokeStyle='rgba(204,218,235,.07)';ctx.beginPath();ctx.moveTo(w*x-13,h*y);ctx.lineTo(w*x+13,h*y);ctx.moveTo(w*x,h*y-13);ctx.lineTo(w*x,h*y+13);ctx.stroke()}
  }
  function tick(time){frame=0;if(!visible||document.hidden||reduced)return;if(time-last>=70){draw(time);last=time}frame=requestAnimationFrame(tick)}
  function start(){if(visible&&!document.hidden&&!reduced&&!frame)frame=requestAnimationFrame(tick)}
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible&&frame){cancelAnimationFrame(frame);frame=0}else start()}).observe(hero);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&frame){cancelAnimationFrame(frame);frame=0}else start()});
  new ResizeObserver(size).observe(hero);document.fonts.ready.then(size);size();
})();
