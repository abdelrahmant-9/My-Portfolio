/* Abdelrahman Tarek — portfolio interactions. No dependencies. */
(function(){
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  /* ---------- nav: scrolled state, mobile menu, scrollspy ---------- */
  const nav = $('#nav'), toggle = $('#navToggle'), links = $('#navLinks');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 20);
  addEventListener('scroll', onScroll, {passive:true}); onScroll();
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  links.addEventListener('click', e => {
    if (e.target.closest('a')) { links.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); }
  });
  const spyMap = new Map();
  $$('.nav-links a[href^="#"]').forEach(a => { const s = $(a.getAttribute('href')); if (s) spyMap.set(s, a); });
  const spy = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    $$('.nav-links a').forEach(x => x.classList.remove('active'));
    spyMap.get(en.target)?.classList.add('active');
  }), {rootMargin:'-45% 0px -50% 0px'});
  spyMap.forEach((a, s) => spy.observe(s));

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(x => {
    if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); }
  }), {threshold:.08});
  $$('.fi').forEach(el => io.observe(el));
  const kit = $('#kit');
  if (kit) new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { kit.classList.add('in'); o.disconnect(); } }), {threshold:.25}).observe(kit);

  /* ---------- typing roles in the hero ---------- */
  const typed = $('#typed');
  const roles = [
    "I break things so users don't.",
    'Software QA Engineer @ Lumofy',
    'Mobile testing: Android · iOS · RTL',
    'Data testing: SQL · dbt · Snowflake',
    'Building Spectara: locators in 3s'
  ];
  if (typed && !reduce) {
    let r = 0, i = roles[0].length, del = true;
    const step = () => {
      const word = roles[r];
      if (del) {
        i--; typed.textContent = word.slice(0, i);
        if (i <= 0) { del = false; r = (r + 1) % roles.length; return setTimeout(step, 350); }
        return setTimeout(step, 28);
      }
      i++; typed.textContent = roles[r].slice(0, i);
      if (i >= roles[r].length) { del = true; return setTimeout(step, 2200); }
      setTimeout(step, 55 + Math.random() * 40);
    };
    setTimeout(step, 2600);
  }

  /* ---------- stat counters ---------- */
  const counters = $$('[data-count]');
  const countUp = el => {
    const end = +el.dataset.count; if (reduce || end < 2) return;
    const t0 = performance.now(), dur = 1400;
    const f = t => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); };
    el.textContent = '0'; requestAnimationFrame(f);
  };
  const co = new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { countUp(e.target); o.unobserve(e.target); } }), {threshold:.6});
  counters.forEach(c => co.observe(c));

  /* ---------- terminal: lines print in sequence ---------- */
  const term = $('#term');
  if (term) {
    const lines = $$('.term-line', term);
    if (reduce) lines.forEach(l => l.classList.add('on'));
    else new IntersectionObserver((es, o) => es.forEach(e => {
      if (!e.isIntersecting) return; o.disconnect();
      lines.forEach((l, k) => setTimeout(() => l.classList.add('on'), 180 + k * 170));
    }), {threshold:.35}).observe(term);
  }

  /* ---------- focus cards: cursor glow ---------- */
  $$('.spec').forEach(c => c.addEventListener('pointermove', e => {
    const b = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - b.left) + 'px');
    c.style.setProperty('--my', (e.clientY - b.top) + 'px');
  }));

  /* ---------- project filter ---------- */
  const filters = $$('.filter'), cards = $$('.card[data-cat]');
  filters.forEach(btn => btn.addEventListener('click', () => {
    const f = btn.dataset.f;
    filters.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    cards.forEach(c => {
      const show = f === 'all' || c.dataset.cat === f;
      c.classList.toggle('hide', !show);
      if (show) c.classList.add('in');
    });
  }));

  /* ---------- journey: line fills as you scroll ---------- */
  const tl = $('#timeline');
  if (tl) {
    const bar = $('.progress', tl), jobs = $$('.job', tl);
    const upd = () => {
      const b = tl.getBoundingClientRect(), mid = innerHeight * .6;
      const h = Math.max(0, Math.min(b.height - 12, mid - b.top));
      bar.style.height = h + 'px';
      jobs.forEach(j => j.classList.toggle('lit', j.getBoundingClientRect().top + 30 < mid));
    };
    addEventListener('scroll', upd, {passive:true}); addEventListener('resize', upd); upd();
  }

  /* ---------- test pyramid ---------- */
  const L = {
    e2e: {c:'var(--fail)', k:'E2E · ~10% of effort', h:'Few, slow, expensive.', p:'They only cover journeys that lose money when they break: sign-up, checkout, the core flow. Run before release, never on every commit.', t:['Selenium','TestNG','Page Object Model']},
    api: {c:'var(--info)', k:'API & integration · ~30% of effort', h:'Best value per hour.', p:'Endpoints validated against the requirement, not against a 200: status codes, payload shape, error paths and auth boundaries. Same idea for data: SQL checks that the tables hold what the screen claims.', t:['Postman','REST','Schema checks','SQL','dbt tests']},
    unit: {c:'var(--pass)', k:'Unit · ~60% of effort', h:'Developer-owned, and I read them.', p:'Where unit coverage is thin, the bugs I file get repetitive. So I point at the gap instead of catching the same defect by hand every sprint.', t:['JUnit','Flutter test','Coverage review']},
    explore: {c:'var(--warn)', k:'Exploratory · continuous', h:'Not a layer. A habit.', p:'No scripted suite finds the defect nobody thought to script. Timeboxed sessions against every release, on real devices, with notes and evidence captured as I go.', t:['Charters','DevTools','Real devices','Session notes']}
  };
  const info = $('#layerInfo'), pyr = $('#pyramid');
  if (info && pyr) {
    const show = key => {
      const d = L[key];
      $$('[data-l]', pyr).forEach(b => b.classList.toggle('on', b.dataset.l === key));
      info.innerHTML = `<span class="k" style="color:${d.c}">${d.k}</span><h3>${d.h}</h3><p>${d.p}</p><div class="tags">${d.t.map(x => `<span class="tag">${x}</span>`).join('')}</div>`;
    };
    $$('[data-l]', pyr).forEach(b => {
      b.addEventListener('mouseenter', () => show(b.dataset.l));
      b.addEventListener('focus', () => show(b.dataset.l));
      b.addEventListener('click', () => show(b.dataset.l));
    });
    show('api');
  }
})();
