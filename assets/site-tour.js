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
    @media(max-width:640px){.em-tour-dialog{right:16px;bottom:75px;padding:22px}.em-tour-title{font-size:25px}.em-tour-launch{left:16px;bottom:15px}.em-tour-spotlight{outline-offset:4px}}
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
    if (skipAll) set('skip-all');
    launch.focus({preventScroll:true});
  };
  const steps = page === 'home' ? [
    {label:'WELCOME / 01',title:'A little more than a résumé.',text:'This space is designed to be explored. You’ll find how I think, what I’ve built, and the experiences that shaped both.',button:'Show me around →'},
    {label:'EXPLORE / 02',title:'Choose your own route.',text:'Use the navigation to jump between my approach, projects, experience, and reading. On the Skills page, there’s another small interaction to discover.',button:'Start exploring →',target:'header nav ul, header .navlinks, header nav'}
  ] : [
    {label:'EXPLORE / SKILLS',title:'Two sides of what I bring.',text:'Switch between Skills & Expertise and Programs & Platforms to explore both what I do and the tools I use to do it.',button:'Got it →',target:'.cap-switch'}
  ];
  function show(index) {
    removeHighlight(); step = index;
    const data = steps[step];
    kicker.textContent = data.label; title.textContent = data.title;
    description.textContent = data.text; next.textContent = data.button;
    if (data.target) {
      highlighted = document.querySelector(data.target);
      if (highlighted) {
        highlighted.classList.add('em-tour-spotlight');
        highlighted.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'center'});
      }
    }
    dialog.hidden = false;
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
    // Delay helps avoid competing with any existing page entry transitions.
    window.addEventListener('load', () => window.setTimeout(() => show(0), 700), {once:true});
    if (document.readyState === 'complete') window.setTimeout(() => show(0), 700);
  }
})();
