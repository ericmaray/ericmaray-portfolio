/* Eric T. Maray — optional first-visit guidance for Home and Skills. No external dependencies. */
(() => {
  'use strict';
  const path = location.pathname.replace(/\/index\.html$/i, '/').replace(/\/$/, '') || '/';
  const page = path === '/' ? 'home' : path === '/capabilities' ? 'skills' : null;
  if (!page) return;

  const KEY = 'em-portfolio-tour-v1-';
  const get = key => { try { return localStorage.getItem(KEY + key); } catch (_) { return null; } };
  const set = (key, value = '1') => { try { localStorage.setItem(KEY + key, value); } catch (_) {} };
  const del = key => { try { localStorage.removeItem(KEY + key); } catch (_) {} };
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = () => matchMedia('(max-width: 640px)').matches;
  const css = `
    .em-tour-launch{position:fixed;z-index:109;left:20px;bottom:20px;display:inline-flex;align-items:center;gap:8px;padding:9px 13px;border:1px solid rgba(212,165,116,.43);border-radius:30px;background:rgba(10,10,10,.94);color:#d4a574;font:10px/1.3 'JetBrains Mono',monospace;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;box-shadow:0 7px 24px #0005}
    .em-tour-launch:hover,.em-tour-launch:focus-visible{border-color:#d4a574;background:#231c16;outline:2px solid transparent}
    .em-tour-spotlight{outline:2px solid #d4a574!important;outline-offset:8px;position:relative;z-index:111!important;border-radius:4px;transition:outline-color .2s}
    .em-tour-dialog{position:fixed;z-index:120;right:clamp(16px,3vw,48px);bottom:clamp(65px,8vh,100px);width:min(390px,calc(100vw - 32px));padding:27px 27px 23px;border:1px solid rgba(212,165,116,.65);border-radius:3px;background:#151310;box-shadow:0 18px 65px #000c;color:#f4f1ea;font:17px/1.55 'Fraunces',Georgia,serif;text-align:left}
    .em-tour-dialog[hidden]{display:none!important}.em-tour-kicker{color:#d4a574;font:10px/1.5 'JetBrains Mono',monospace;letter-spacing:.18em;text-transform:uppercase;margin-bottom:12px}
    .em-tour-title{font:300 29px/1.14 'Fraunces',Georgia,serif;letter-spacing:-.02em;margin:0 0 12px;color:#f4f1ea}
    .em-tour-description{color:#c7bfb6;font:16px/1.55 'Fraunces',Georgia,serif;margin:0}
    .em-tour-actions{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:25px}
    .em-tour-secondary,.em-tour-primary{font:10px/1.4 'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;border-radius:30px;padding:11px 14px}
    .em-tour-secondary{background:transparent;border:1px solid transparent;color:#aaa39a}.em-tour-secondary:hover{color:#f4f1ea}
    .em-tour-primary{background:#d4a574;border:1px solid #d4a574;color:#14100d}.em-tour-primary:hover{background:#e3b587}
    .em-tour-dialog button:focus-visible{outline:2px solid #f4f1ea;outline-offset:3px}
    .em-tour-launch[hidden]{display:none!important}
    .em-tour-spotlight{scroll-margin-top:110px}
    @media(max-width:640px){
      .em-tour-dialog{left:0;right:0;bottom:0;width:100%;max-width:none;max-height:min(65dvh,460px);overflow-y:auto;box-sizing:border-box;padding:20px 22px calc(21px + env(safe-area-inset-bottom,0px));border-left:0;border-right:0;border-bottom:0;border-radius:15px 15px 0 0;box-shadow:0 -15px 52px #000d;font-size:15px}
      .em-tour-kicker{font-size:9px;margin-bottom:8px}
      .em-tour-title{font-size:clamp(23px,6.3vw,27px);margin-bottom:9px}
      .em-tour-description{font-size:15px;line-height:1.48}
      .em-tour-actions{margin-top:18px;gap:8px}
      .em-tour-secondary,.em-tour-primary{font-size:10px;min-height:42px;padding:10px 14px}
      .em-tour-launch{left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));padding:9px 11px;font-size:9px}
      .em-tour-spotlight{outline-offset:3px;scroll-margin-top:86px}
      body.em-tour-active{overscroll-behavior-y:contain}
    }
    @media(max-width:360px){.em-tour-dialog{padding-left:17px;padding-right:17px}.em-tour-actions{flex-wrap:wrap}.em-tour-primary{margin-left:auto}}
    @media(prefers-reduced-motion:reduce){.em-tour-spotlight{transition:none}}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const launch = document.createElement('button');
  launch.type = 'button'; launch.className = 'em-tour-launch';
  launch.textContent = '↻ Take a tour';
  launch.setAttribute('aria-label', 'Replay the quick page tour');
  document.body.appendChild(launch);

  const dialog = document.createElement('section');
  dialog.className = 'em-tour-dialog'; dialog.hidden = true;
  dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'false');
  dialog.setAttribute('aria-labelledby', 'em-tour-title');
  dialog.innerHTML = '<div class="em-tour-kicker" id="em-tour-kicker"></div><h2 class="em-tour-title" id="em-tour-title"></h2><p class="em-tour-description" id="em-tour-description"></p><div class="em-tour-actions"><button type="button" class="em-tour-secondary" id="em-tour-skip">Skip tour</button><button type="button" class="em-tour-primary" id="em-tour-next">Continue →</button></div>';
  document.body.appendChild(dialog);
  const kicker = dialog.querySelector('#em-tour-kicker');
  const title = dialog.querySelector('#em-tour-title');
  const description = dialog.querySelector('#em-tour-description');
  const next = dialog.querySelector('#em-tour-next');
  const skip = dialog.querySelector('#em-tour-skip');
  let step = 0;
  let highlighted = null;
  const removeHighlight = () => { if (highlighted) highlighted.classList.remove('em-tour-spotlight'); highlighted = null; };
  const finish = (skipAll = false) => {
    dialog.hidden = true; removeHighlight(); set(page);
    launch.hidden = false; document.body.classList.remove('em-tour-active');
    if (skipAll) set('skip-all');
    launch.focus({preventScroll:true});
  };
  const steps = page === 'home' ? [
    {label:'WELCOME / 01',title:'A little more than a résumé.',text:'This space is designed to be explored. You’ll find how I think, what I’ve built, and the experiences that shaped both.',button:'Show me around →'},
    {label:'EXPLORE / 02',title:'Choose your own route.',text:'Use the navigation to jump between my approach, projects, experience, and reading. On the Skills page, there’s another small interaction to discover.',button:'Start exploring →',target:'header nav ul, header .navlinks, header nav',mobileTarget:'#menuBtn, header button[aria-label*=menu], header nav button'}
  ] : [
    {label:'EXPLORE / SKILLS',title:'Two sides of what I bring.',text:'Switch between Skills & Expertise and Programs & Platforms to explore both what I do and the tools I use to do it.',button:'Got it →',target:'.cap-switch'}
  ];
  function show(index) {
    removeHighlight(); step = index;
    const data = steps[step];
    kicker.textContent = data.label; title.textContent = data.title;
    description.textContent = data.text; next.textContent = data.button;
    if (data.target) {
      const selector = mobile() && data.mobileTarget ? data.mobileTarget : data.target;
      highlighted = document.querySelector(selector);
      if (highlighted) {
        highlighted.classList.add('em-tour-spotlight');
        if (mobile()) {
          const rect = highlighted.getBoundingClientRect();
          const sheetSpace = Math.min(window.innerHeight * .65, 460);
          const visibleBottom = window.innerHeight - sheetSpace - 12;
          if (rect.top < 75 || rect.bottom > visibleBottom) {
            const desiredTop = page === 'skills' ? Math.max(80, visibleBottom - rect.height - 30) : 105;
            window.scrollBy({top:rect.top - desiredTop,behavior:reduceMotion?'instant':'smooth'});
          }
        } else {
          highlighted.scrollIntoView({behavior:reduceMotion?'instant':'smooth',block:'center'});
        }
      }
    }
    dialog.hidden = false;
    launch.hidden = true; document.body.classList.add('em-tour-active');
    next.focus({preventScroll:true});
  }
  next.addEventListener('click', () => step < steps.length - 1 ? show(step + 1) : finish());
  skip.addEventListener('click', () => finish(true));
  launch.addEventListener('click', () => {del('skip-all');show(0);});
  document.addEventListener('keydown', e => {if(e.key==='Escape' && !dialog.hidden) finish();});
  if (page === 'skills') {
    for (const id of ['tab-skills','tab-tools']) {
      const button = document.getElementById(id);
      if (button) button.addEventListener('click', () => {if (!dialog.hidden) finish();});
    }
  }
  if (!get(page) && !get('skip-all')) {
    // Run just once, even when the script loads after the load event.
    const start = () => window.setTimeout(() => { if (dialog.hidden && !get(page) && !get('skip-all')) show(0); }, 700);
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, {once:true});
  }
})();
