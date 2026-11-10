/* Eric T. Maray portfolio tour — responsive guided spotlight, no dependencies. */
(() => {
  'use strict';
  const pathname = location.pathname.replace(/\/index\.html$/i, '/').replace(/\/$/, '') || '/';
  const page = pathname === '/' ? 'home' : pathname === '/capabilities' ? 'skills' : null;
  if (!page || document.getElementById('em-tour-launch')) return;
  const KEY = 'em-portfolio-tour-v1-'; // Retain original completion state.
  const get = name => { try { return localStorage.getItem(KEY + name); } catch { return null; } };
  const set = name => { try { localStorage.setItem(KEY + name, '1'); } catch {} };
  const del = name => { try { localStorage.removeItem(KEY + name); } catch {} };
  const mobile = () => window.matchMedia('(max-width: 767px)').matches;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const select = selector => document.querySelector(selector);
  const stylesheet = document.createElement('style');
  stylesheet.textContent = `
    .em-tour-veil{position:fixed;inset:0;z-index:9990;background:rgba(0,0,0,.62);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;transition:opacity .25s;pointer-events:none}
    .em-tour-veil.is-active{opacity:1;pointer-events:auto}
    .em-tour-highlight{position:relative!important;z-index:9992!important;outline:2px solid #d4a574!important;outline-offset:8px!important;border-radius:12px!important;box-shadow:0 0 0 9px rgba(212,165,116,.09),0 0 40px rgba(212,165,116,.15)!important;scroll-margin-top:120px}
    .em-tour-highlight a,.em-tour-highlight button{position:relative}
    .em-tour-arrow{position:fixed;z-index:9996;display:none;color:#e9b57d;filter:drop-shadow(0 2px 5px #000);font:600 37px/1 Georgia,serif;pointer-events:none;animation:em-tour-nudge 1.15s ease-in-out infinite alternate}
    .em-tour-arrow.is-visible{display:block}
    @keyframes em-tour-nudge{from{transform:translateY(0)}to{transform:translateY(-6px)}}
    .em-tour-card{position:fixed;z-index:10000;bottom:clamp(32px,6vh,90px);right:clamp(18px,5vw,80px);box-sizing:border-box;width:min(410px,calc(100vw - 36px));padding:28px;background:rgba(24,21,18,.97);border:1px solid rgba(212,165,116,.62);border-radius:22px;box-shadow:0 22px 75px #000d;color:#f4f1ea;text-align:left;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
    .em-tour-card[hidden],.em-tour-launch[hidden]{display:none!important}
    .em-tour-kicker{font:10px/1.5 'JetBrains Mono',monospace;letter-spacing:.17em;text-transform:uppercase;color:#d4a574;margin-bottom:12px}
    .em-tour-title{font:300 29px/1.18 'Fraunces',Georgia,serif;letter-spacing:-.02em;color:#f4f1ea;margin:0 0 11px}
    .em-tour-text{font:16px/1.55 'Fraunces',Georgia,serif;color:#c7bfb6;margin:0}
    .em-tour-buttons{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:24px}
    .em-tour-buttons button,.em-tour-launch{font:10px/1.4 'JetBrains Mono',monospace;letter-spacing:.07em;text-transform:uppercase;cursor:pointer;border-radius:999px;padding:12px 17px}
    .em-tour-skip{background:transparent;border:1px solid transparent;color:#aaa39a}.em-tour-skip:hover{color:#fff}
    .em-tour-next{background:#d4a574;color:#18130f;border:1px solid #d4a574}.em-tour-next:hover{background:#edc39b}
    .em-tour-buttons button:focus-visible,.em-tour-launch:focus-visible{outline:2px solid #fff;outline-offset:3px}
    .em-tour-launch{position:fixed;z-index:9980;left:20px;bottom:20px;padding:10px 14px;border:1px solid rgba(212,165,116,.45);background:rgba(18,16,14,.94);color:#d4a574;box-shadow:0 7px 22px #0008}
    @media(max-width:767px){
      .em-tour-veil{backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);background:rgba(0,0,0,.68)}
      .em-tour-card{left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));width:auto;padding:21px 20px 19px;border-radius:20px;max-height:52dvh;overflow:auto}
      .em-tour-title{font-size:25px}.em-tour-text{font-size:14px;line-height:1.48}.em-tour-kicker{margin-bottom:8px}
      .em-tour-buttons{margin-top:17px}.em-tour-buttons button{min-height:43px;padding:11px 13px}
      .em-tour-arrow{font-size:32px}.em-tour-launch{left:12px;bottom:12px;font-size:9px}
      .em-tour-highlight{outline-offset:4px!important;border-radius:8px!important}
      /* The real mobile menu must remain above the veil during its demonstration. */
      #mobileMenu.em-tour-menu-open{z-index:9993!important}
    }
    @media(prefers-reduced-motion:reduce){.em-tour-arrow{animation:none}.em-tour-veil{transition:none}}
  `;
  document.head.appendChild(stylesheet);
  const veil = document.createElement('div'); veil.className='em-tour-veil'; veil.setAttribute('aria-hidden','true');
  const arrow = document.createElement('div'); arrow.className='em-tour-arrow'; arrow.textContent='↓'; arrow.setAttribute('aria-hidden','true');
  const launch = document.createElement('button'); launch.id='em-tour-launch'; launch.className='em-tour-launch'; launch.type='button'; launch.textContent='↻ Take a tour';
  const card=document.createElement('section'); card.className='em-tour-card'; card.hidden=true;
  card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-labelledby','em-tour-heading');
  card.innerHTML='<div class="em-tour-kicker"></div><h2 id="em-tour-heading" class="em-tour-title"></h2><p class="em-tour-text"></p><div class="em-tour-buttons"><button class="em-tour-skip" type="button">Skip tour</button><button class="em-tour-next" type="button">Continue →</button></div>';
  document.body.append(veil,arrow,launch,card);
  const kicker=card.querySelector('.em-tour-kicker'),heading=card.querySelector('.em-tour-title'),paragraph=card.querySelector('.em-tour-text');
  const next=card.querySelector('.em-tour-next');
  let index=0, highlighted=null, openedMenu=false, active=false, generation=0;
  function navTarget(){return mobile()?select('#menuBtn, .mobile-menu-toggle, header button[aria-label*="menu" i]'):select('header nav ul:not(.hidden), header .navlinks, .portfolio-header .navlinks, header nav ul, header nav');}
  function findGrid(){
    // Prefer the homepage's route-card collection. Fall back to recognizable route links.
    const card = select('.route-grid, .routes-grid, .explore-grid, #explore-grid, .navigation-grid');
    if(card)return card;
    const routes=[...document.querySelectorAll('main a.route-card, main a[href^="/philosophy/"], main a[href^="/personal/"], main a[href^="/work/"], main a[href^="/journey/"], main a[href^="/capabilities/"]')];
    const visible=routes.filter(el=>{const r=el.getBoundingClientRect();return r.width>90&&r.height>36});
    if(visible.length>=2){
      const parent=visible[0].parentElement;
      if(parent && visible.filter(el=>el.parentElement===parent).length>=2)return parent;
      const p=visible[0].closest('.grid');if(p)return p;
    }
    return select('main .route-card')?.parentElement || select('main .grid.grid-cols-2, main .grid.grid-cols-3, main .grid.grid-cols-4');
  }
  const steps=page==='skills' ? [
    {k:'SKILLS / 01',h:'Two sides of what I bring.',p:'Use this toggle to explore both my capabilities and the platforms I work with.',label:'Got it →',target:()=>select('.cap-switch, [role="tablist"]')}
  ] : [
    {k:'WELCOME / 01',h:'A little more than a résumé.',p:'This portfolio is meant to be explored. Here’s a quick look at how to find your way around.',label:'Show me around →'},
    {k:'NAVIGATION / 02',h:'Find your way around.',p:mobile()?'This menu opens the different areas of my portfolio. Watch it open in the next step.':'The links across the top take you straight to each part of the portfolio.',label:mobile()?'Open the menu →':'Show me the grid →',target:navTarget,point:true},
    ...(mobile()?[{k:'NAVIGATION / 03',h:'Here are your options.',p:'Use these links to jump between my philosophy, work, experience, skills, and reading.',label:'Show me the grid →',target:()=>select('#mobileMenu'),menu:true}]:[]),
    {k:mobile()?'EXPLORE / 04':'EXPLORE / 03',h:'Or explore from the page.',p:'These tiles give you another way into the portfolio. Choose whichever path catches your attention.',label:'Start exploring →',target:findGrid,point:true,scroll:true}
  ];
  function cleanupMenu(){if(!openedMenu)return;const m=select('#mobileMenu');m?.classList.remove('em-tour-menu-open');const close=select('#closeBtn');if(m && !m.classList.contains('hidden')){if(close)close.click();else{m.classList.add('hidden');m.classList.remove('flex');}}openedMenu=false;}
  function cleanHighlight(){highlighted?.classList.remove('em-tour-highlight');highlighted=null;arrow.classList.remove('is-visible');}
  function arrowAt(el){if(!el)return;const r=el.getBoundingClientRect();if(!r.width||!r.height)return;const w=window.innerWidth;const below=r.top<110;arrow.textContent=below?'↑':'↓';arrow.style.left=Math.max(8,Math.min(w-42,r.left+r.width/2-18))+'px';arrow.style.top=Math.max(65,Math.min(window.innerHeight-65,below?r.bottom+10:r.top-48))+'px';arrow.classList.add('is-visible');}
  function position(){if(!active)return;const data=steps[index];if(data?.point && highlighted)arrowAt(highlighted);else arrow.classList.remove('is-visible');}
  function reveal(el, scroll){if(!el)return;const rect=el.getBoundingClientRect();const cardHeight=card.getBoundingClientRect().height||210;const topLimit=105;const bottomLimit=mobile()?innerHeight-cardHeight-45:innerHeight-80;
    if(scroll || rect.top<topLimit || rect.bottom>bottomLimit){const targetTop=mobile()?Math.max(topLimit,Math.min(180,bottomLimit-rect.height-16)):Math.max(topLimit,Math.min(220,bottomLimit-rect.height-16));window.scrollBy({top:rect.top-targetTop,behavior:reduce?'instant':'smooth'});}}
  function show(step){
    ++generation;cleanHighlight();index=step;active=true;const data=steps[step];
    kicker.textContent=data.k;heading.textContent=data.h;paragraph.textContent=data.p;next.textContent=data.label;
    card.hidden=false;launch.hidden=true;veil.classList.add('is-active');
    if(data.menu){
      const menu=select('#mobileMenu');
      if(menu){menu.classList.add('em-tour-menu-open'); highlighted=menu;menu.classList.add('em-tour-highlight');}
    }else if(data.target){
      highlighted=data.target();
      if(highlighted){highlighted.classList.add('em-tour-highlight');reveal(highlighted,Boolean(data.scroll));}
    }
    const t=generation;
    window.setTimeout(()=>{if(t!==generation||!active)return;position();},reduce?30:450);
    next.focus({preventScroll:true});
  }
  function finish(skipAll=false){++generation;active=false;cleanHighlight();cleanupMenu();card.hidden=true;veil.classList.remove('is-active');set(page);if(skipAll)set('skip-all');launch.hidden=false;launch.focus({preventScroll:true});}
  next.addEventListener('click',()=>{
    const nextStep=index+1;
    if(nextStep>=steps.length){finish();return;}
    if(page==='home' && mobile() && steps[nextStep]?.menu){
      const button=select('#menuBtn'); const menu=select('#mobileMenu');
      if(button && menu){button.click();openedMenu=true;}
    }else if(openedMenu && !steps[nextStep]?.menu){cleanupMenu();}
    show(nextStep);
  });
  card.querySelector('.em-tour-skip').addEventListener('click',()=>finish(true));
  launch.addEventListener('click',()=>{del('skip-all');cleanupMenu();show(0);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active){e.preventDefault();finish();}});
  window.addEventListener('resize',()=>{if(active)position();},{passive:true});
  window.addEventListener('scroll',()=>{if(active)position();},{passive:true});
  if(page==='skills') ['tab-skills','tab-tools'].forEach(id=>{select('#'+id)?.addEventListener('click',()=>{if(active)finish();});});
  if(!get(page)&&!get('skip-all')){
    const begin=()=>window.setTimeout(()=>{if(!active&&!get(page)&&!get('skip-all'))show(0);},850);
    if(document.readyState==='complete')begin();else window.addEventListener('load',begin,{once:true});
  }
})();
