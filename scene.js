/* Phase 01: event-driven portrait inspection and a scroll companion.
   No WebGL context, dependency, continuous particle field, or idle render loop. */
(() => {
  'use strict';
  const root=document.documentElement;
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
  const art=document.getElementById('heroArt');
  const card=document.getElementById('portraitCard');
  const picture=document.getElementById('portraitImageWrap');
  const inspect=document.getElementById('inspectProfile');
  const facts=document.getElementById('inspectFacts');
  const coordinates=document.getElementById('inspectCoordinates');
  const journey=document.getElementById('journey');
  const track=journey.querySelector('.journey-track');
  const current=document.getElementById('journeyCurrent');
  const label=document.getElementById('journeyLabel');
  const number=document.getElementById('journeyNumber');
  const percent=document.getElementById('journeyPercent');
  const stops=[...journey.querySelectorAll('.journey-stop')];
  const sectionNames=['INTRODUCTION','ABOUT ME','SELECTED WORK','EXPERIENCE','THE TOOLKIT','THE APPROACH','THE PLAYGROUND','EDUCATION','LET’S TALK'];
  const sections=stops.map(link=>document.querySelector(link.getAttribute('href')));
  let sectionTops=[],maxScroll=1,trackHeight=280,viewportHeight=800,scrollFrame=0,measureFrame=0,active=-1;
  let pointerFrame=0,portraitBounds=null,point={x:.5,y:.5},portraitVisible=true;
  const moving=()=>root.dataset.motion!=='off' && !media.matches;
  const renderJourney=()=>{
    scrollFrame=0;
    const y=Math.max(0,window.scrollY);
    const progress=Math.min(1,y/maxScroll);
    journey.style.setProperty('--journey-progress',progress.toFixed(4));
    journey.style.setProperty('--probe-y',(progress*trackHeight-11).toFixed(1)+'px');
    journey.style.setProperty('--probe-rotation',moving()?(-28+progress*65).toFixed(1)+'deg':'-28deg');
    percent.textContent=Math.round(progress*100)+'%';
    let next=0;
    for(let i=1;i<sectionTops.length;i++) if(sectionTops[i]<=y+viewportHeight*.33) next=i;
    if(y>=maxScroll-2) next=sections.length-1;
    if(next!==active){
      active=next;label.textContent=sectionNames[next];number.textContent=String(next).padStart(2,'0')+' / 08';
      current.href=stops[next].getAttribute('href');
      stops.forEach((stop,i)=>{if(i===next)stop.setAttribute('aria-current','location');else stop.removeAttribute('aria-current');});
    }
  };
  const scheduleScroll=()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(renderJourney);};
  const measure=()=>{
    measureFrame=0;
    const y=window.scrollY;
    sectionTops=sections.map(section=>section.getBoundingClientRect().top+y);
    maxScroll=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
    trackHeight=track.clientHeight;viewportHeight=window.innerHeight;
    portraitBounds=null;scheduleScroll();
  };
  const scheduleMeasure=()=>{if(!measureFrame)measureFrame=requestAnimationFrame(measure);};
  window.addEventListener('scroll',scheduleScroll,{passive:true});
  window.addEventListener('resize',scheduleMeasure,{passive:true});
  window.addEventListener('load',scheduleMeasure,{once:true});
  new ResizeObserver(scheduleMeasure).observe(document.body);

  const resetPortrait=()=>{
    cancelAnimationFrame(pointerFrame);pointerFrame=0;
    card.classList.remove('interacting');
    card.style.removeProperty('--portrait-x');card.style.removeProperty('--portrait-y');
    coordinates.textContent='X: 200   Y: 200';portraitBounds=null;
  };
  const renderPointer=()=>{
    pointerFrame=0;
    if(!moving() || !portraitVisible)return;
    card.classList.add('interacting');
    card.style.setProperty('--portrait-y',(-8+(point.x-.5)*10).toFixed(2)+'deg');
    card.style.setProperty('--portrait-x',(4-(point.y-.5)*8).toFixed(2)+'deg');
    card.style.setProperty('--cross-x',(point.x*100).toFixed(1)+'%');
    card.style.setProperty('--cross-y',(point.y*100).toFixed(1)+'%');
    coordinates.textContent='X: '+Math.round(point.x*400)+'   Y: '+Math.round(point.y*400);
  };
  picture.addEventListener('pointerenter',()=>{portraitBounds=picture.getBoundingClientRect();});
  picture.addEventListener('pointermove',event=>{
    if(!finePointer.matches || !moving() || !portraitVisible)return;
    const rect=portraitBounds || (portraitBounds=picture.getBoundingClientRect());
    point={x:Math.min(1,Math.max(0,(event.clientX-rect.left)/rect.width)),y:Math.min(1,Math.max(0,(event.clientY-rect.top)/rect.height))};
    if(!pointerFrame)pointerFrame=requestAnimationFrame(renderPointer);
  },{passive:true});
  picture.addEventListener('pointerleave',resetPortrait);
  inspect.addEventListener('click',()=>{
    const open=inspect.getAttribute('aria-pressed')!=='true';
    inspect.setAttribute('aria-pressed',String(open));facts.hidden=!open;
    facts.setAttribute('aria-hidden',String(!open));
    inspect.textContent=open?'✓ Profile inspected':'⌕ Inspect me';
    card.classList.toggle('inspected',open);
  });
  new IntersectionObserver(([entry])=>{
    portraitVisible=entry.isIntersecting;
    art.classList.toggle('in-view',portraitVisible);
    if(!portraitVisible)resetPortrait();
  }).observe(art);
  const syncMotion=()=>{
    const paused=!moving();
    document.querySelectorAll('.motion-btn').forEach(button=>{
      button.setAttribute('aria-pressed',String(paused));
      button.setAttribute('aria-label',paused?'Enable animation':'Pause animation');
      button.title=paused?'Enable animation':'Pause animation';
    });
    if(paused)resetPortrait();scheduleScroll();
  };
  window.addEventListener('motionchange',syncMotion);
  media.addEventListener('change',()=>{
    if(media.matches){root.dataset.motion='off';window.dispatchEvent(new CustomEvent('motionchange',{detail:'off'}));}
    syncMotion();
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){cancelAnimationFrame(scrollFrame);cancelAnimationFrame(pointerFrame);cancelAnimationFrame(measureFrame);scrollFrame=0;pointerFrame=0;measureFrame=0;resetPortrait();}
    else scheduleMeasure();
  });
  measure();syncMotion();
})();

/* Transient feedback particles: the canvas is dormant between game clicks. */
(() => {
  const canvas=document.getElementById('fx'),ctx=canvas.getContext('2d');
  if(!ctx)return;
  const root=document.documentElement,media=matchMedia('(prefers-reduced-motion: reduce)');
  let particles=[],frame=0,previous=0,w=0,h=0,colors={},dirtySize=true;
  const readColors=()=>{const style=getComputedStyle(root);colors={pass:style.getPropertyValue('--pass').trim(),fail:style.getPropertyValue('--fail').trim()};};
  const resize=()=>{
    w=window.innerWidth;h=window.innerHeight;const ratio=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);dirtySize=false;
  };
  const stop=()=>{cancelAnimationFrame(frame);frame=0;previous=0;particles=[];ctx.clearRect(0,0,w,h);};
  const draw=time=>{
    frame=0;
    if(document.hidden || root.dataset.motion==='off' || media.matches){stop();return;}
    const step=previous?Math.min((time-previous)/16.67,2):1;previous=time;
    ctx.clearRect(0,0,w,h);
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];p.x+=p.vx*step;p.y+=p.vy*step;p.vy+=.055*step;p.life-=.025*step;
      if(p.life<=0){particles.splice(i,1);continue;}
      ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3*p.life,3*p.life);
    }
    ctx.globalAlpha=1;
    if(particles.length)frame=requestAnimationFrame(draw);else stop();
  };
  window.__burst=(x,y,kind)=>{
    if(root.dataset.motion==='off' || media.matches || document.hidden)return;
    if(dirtySize)resize();
    for(let i=0;i<18;i++){
      const angle=i/18*Math.PI*2,speed=1.5+Math.random()*2;
      particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-1,life:1,color:colors[kind]||colors.pass});
    }
    if(particles.length>90)particles=particles.slice(-90);
    if(!frame)frame=requestAnimationFrame(draw);
  };
  window.addEventListener('resize',()=>{dirtySize=true;if(particles.length)resize();},{passive:true});
  window.addEventListener('motionchange',event=>{if(event.detail==='off')stop();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  new MutationObserver(readColors).observe(root,{attributes:true,attributeFilter:['data-theme']});
  readColors();
})();

(() => {
  const menu=document.getElementById('navLinks'),button=document.getElementById('navToggle');
  const close=()=>{menu.classList.remove('open');button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','Open menu');};
  button.addEventListener('click',()=>button.setAttribute('aria-label',menu.classList.contains('open')?'Close menu':'Open menu'));
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && menu.classList.contains('open')){close();button.focus();}});
  document.addEventListener('pointerdown',event=>{if(!event.target.closest('nav[aria-label="Main navigation"]'))close();});
  menu.addEventListener('click',event=>{if(event.target.closest('a'))close();});
})();
