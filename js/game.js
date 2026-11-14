/* Spot the Bug — game engine (ported from the previous version of the site). */
(function(){
  const ROUND_MS=30000, PENALTY=150, HINT_COST=200, TOTAL=6;

  const ROUNDS=[
    {
      id:'checkout', url:'https://shop.staging.local/cart/checkout',
      name:'Checkout — order summary',
      spec:"the order total equals subtotal + shipping",
      severity:'Critical', bug:'total',
      hint:'Ignore the labels. Add the money column up yourself.',
      why:'Subtotal <code>$69.98</code> + shipping <code>$5.00</code> = <code>$74.98</code>, but the total charges <code>$69.98</code>. Shipping is dropped from the sum — the business loses $5 on every order that reaches this screen.',
      html:`
        <h5>Order summary</h5><div class="app-sub">Cart · 2 items · standard delivery</div>
        <button class="hot" data-id="item1" aria-label="Line item wireless mouse"><div class="app-row"><span class="k">Wireless Mouse × 1</span><span class="v">$49.99</span></div></button>
        <button class="hot" data-id="item2" aria-label="Line item USB-C cable"><div class="app-row"><span class="k">USB-C Cable × 1</span><span class="v">$19.99</span></div></button>
        <button class="hot" data-id="sub" aria-label="Subtotal row"><div class="app-row"><span class="k">Subtotal</span><span class="v">$69.98</span></div></button>
        <button class="hot" data-id="ship" aria-label="Shipping row"><div class="app-row"><span class="k">Shipping (standard)</span><span class="v">$5.00</span></div></button>
        <button class="hot" data-id="total" aria-label="Total row"><div class="app-row tot"><span class="k">Total</span><span class="v">$69.98</span></div></button>
        <div style="margin-top:16px"><span class="app-btn">Place order</span></div>`
    },
    {
      id:'pager', url:'https://admin.staging.local/users?page=1',
      name:'User directory — pagination',
      spec:"every result is reachable through the pager",
      severity:'Major', bug:'pager',
      hint:'Divide the result count by the page size, then count the page buttons.',
      why:'24 users at 10 per page needs <code>3</code> pages. The pager only renders <code>1</code> and <code>2</code>, so users 21–24 are unreachable — a classic off-by-one in <code>Math.ceil</code>.',
      html:`
        <h5>Users</h5><div class="app-sub">Admin · directory</div>
        <button class="hot" data-id="search" aria-label="Search field"><div class="app-input ph">Search users…</div></button>
        <table class="app-table" style="margin-top:14px">
          <tr><th>Name</th><th>Role</th><th>Status</th></tr>
          <tr><td>Mona Adel</td><td>Admin</td><td>Active</td></tr>
          <tr><td>Youssef Nabil</td><td>Editor</td><td>Active</td></tr>
          <tr><td>Salma Hassan</td><td>Viewer</td><td>Invited</td></tr>
        </table>
        <div class="app-flex" style="margin-top:14px">
          <button class="hot inline" data-id="count" aria-label="Results count"><span style="font-size:12.6px;color:var(--t3)">Showing 1–10 of 24 users</span></button>
          <button class="hot inline" data-id="pager" aria-label="Pagination control"><div class="app-pager"><span>‹</span><span class="cur">1</span><span>2</span><span>›</span></div></button>
        </div>`
    },
    {
      id:'password', url:'https://app.staging.local/signup',
      name:'Sign-up — credential fields',
      spec:"credentials are never rendered in plain text",
      severity:'Critical', bug:'pwd',
      hint:'Two fields hold the same secret. Only one of them is behaving.',
      why:'The password field renders its value in plain text — <code>type="password"</code> is missing or overridden. The confirm field masks correctly, which proves the pattern exists and this field skipped it. Exposed on screen shares, screenshots, and over the shoulder.',
      html:`
        <h5>Create your account</h5><div class="app-sub">Step 2 of 3 · credentials</div>
        <button class="hot" data-id="email" aria-label="Email field">
          <div class="app-field"><span class="app-label">Email</span><div class="app-input">mona.adel@example.com</div></div>
        </button>
        <button class="hot" data-id="pwd" aria-label="Password field">
          <div class="app-field"><span class="app-label">Password</span><div class="app-input">Sup3rSecret!2026</div><div class="app-hint">Minimum 8 characters</div></div>
        </button>
        <button class="hot" data-id="confirm" aria-label="Confirm password field">
          <div class="app-field"><span class="app-label">Confirm password</span><div class="app-input">••••••••••••••••</div></div>
        </button>
        <button class="hot inline" data-id="submit" aria-label="Create account button"><span class="app-btn">Create account</span></button>`
    },
    {
      id:'dates', url:'https://booking.staging.local/search',
      name:'Booking — date range',
      spec:"check-out must fall after check-in",
      severity:'Major', bug:'out',
      hint:'Read the two dates in the order a guest would live them.',
      why:'Check-out <code>2026-09-03</code> is nine days <em>before</em> check-in <code>2026-09-12</code>, and the form accepts it with no validation error. Downstream this produces a negative night count and, in most booking engines, a negative price.',
      html:`
        <h5>Book a stay</h5><div class="app-sub">Cairo · 1 room</div>
        <button class="hot" data-id="in" aria-label="Check-in date">
          <div class="app-field"><span class="app-label">Check-in</span><div class="app-input">2026-09-12</div></div>
        </button>
        <button class="hot" data-id="out" aria-label="Check-out date">
          <div class="app-field"><span class="app-label">Check-out</span><div class="app-input">2026-09-03</div></div>
        </button>
        <button class="hot" data-id="guests" aria-label="Guests field">
          <div class="app-field"><span class="app-label">Guests</span><div class="app-input">2 adults</div></div>
        </button>
        <button class="hot inline" data-id="search" aria-label="Search button"><span class="app-btn">Search availability</span></button>`
    },
    {
      id:'submit', url:'https://app.staging.local/support/new',
      name:'Support form — validation state',
      spec:"submit stays disabled while a required field is invalid",
      severity:'Major', bug:'submit',
      hint:'The red error message is correct. Something on this screen is ignoring it.',
      html:`
        <h5>Contact support</h5><div class="app-sub">We reply within one business day</div>
        <button class="hot" data-id="name" aria-label="Full name field">
          <div class="app-field"><span class="app-label">Full name *</span><div class="app-input ph">&nbsp;</div><div class="app-hint err">Required field</div></div>
        </button>
        <button class="hot" data-id="email" aria-label="Email field">
          <div class="app-field"><span class="app-label">Email *</span><div class="app-input">mona.adel@example.com</div></div>
        </button>
        <button class="hot" data-id="msg" aria-label="Message field">
          <div class="app-field"><span class="app-label">Message *</span><div class="app-area">The export button returns a 500 on large date ranges.</div></div>
        </button>
        <button class="hot inline" data-id="submit" aria-label="Submit ticket button"><span class="app-btn">Submit ticket</span></button>`,
      why:'A required field is empty and already flagged <code>Required field</code>, yet <code>Submit ticket</code> is fully enabled. The form can be posted invalid — validation renders the error but never gates the action.'
    },
    {
      id:'sort', url:'https://shop.staging.local/admin/products?sort=price_asc',
      name:'Product table — sort indicator',
      spec:"the active sort matches the order of the rows",
      severity:'Major', bug:'hprice',
      hint:'That little arrow is a promise. Check whether the data keeps it.',
      why:'The Price column claims ascending sort (<code>▲</code>) but the rows read <code>120 → 45 → 300</code>. Either the sort never applied or the indicator is stale — the screen contradicts itself, and any user trusting it gets the wrong product first.',
      html:`
        <h5>Products</h5><div class="app-sub">Sorted by price, ascending</div>
        <table class="app-table" style="margin-top:6px">
          <tr>
            <th><button class="hot inline" data-id="hname" aria-label="Name column header" style="padding:2px 5px;margin:0">Name</button></th>
            <th><button class="hot inline" data-id="hprice" aria-label="Price column header" style="padding:2px 5px;margin:0">Price ▲</button></th>
            <th><button class="hot inline" data-id="hstock" aria-label="Stock column header" style="padding:2px 5px;margin:0">Stock</button></th>
          </tr>
          <tr><td>Mechanical Keyboard</td><td class="num">$120.00</td><td class="num">14</td></tr>
          <tr><td>Wireless Mouse</td><td class="num">$45.00</td><td class="num">61</td></tr>
          <tr><td>27&quot; Monitor</td><td class="num">$300.00</td><td class="num">7</td></tr>
        </table>
        <div style="margin-top:14px"><button class="hot inline" data-id="export" aria-label="Export button"><span class="app-btn ghost">Export CSV</span></button></div>`
    },
    {
      id:'badge', url:'https://app.staging.local/inbox',
      name:'Inbox — unread counter',
      spec:"the unread badge matches the actual unread count",
      severity:'Minor', bug:'badge',
      hint:'Two parts of this screen are counting the same thing and disagreeing.',
      why:'The badge shows <code>1</code> unread while the list and the empty state both report <code>0</code>. The badge is not cleared when messages are read — a stale count that trains users to ignore the badge entirely.',
      html:`
        <div class="app-flex" style="margin-bottom:14px">
          <h5 style="margin:0">Inbox</h5>
          <button class="hot inline" data-id="badge" aria-label="Unread badge"><span class="app-pill">Unread <span class="app-badge">1</span></span></button>
        </div>
        <button class="hot" data-id="empty" aria-label="Empty state message">
          <div style="text-align:center;padding:26px 10px;border:1px dashed var(--line-2);border-radius:9px">
            <div style="font-size:22px">📭</div>
            <div style="font-size:14px;font-weight:600;margin-top:6px">You're all caught up</div>
            <div style="font-size:12.6px;color:var(--t3);margin-top:3px">0 unread messages</div>
          </div>
        </button>
        <div class="app-flex" style="margin-top:14px">
          <button class="hot inline" data-id="refresh" aria-label="Refresh button"><span class="app-btn ghost">Refresh</span></button>
          <button class="hot inline" data-id="settings" aria-label="Settings link"><span style="font-size:12.6px;color:var(--t3)">Inbox settings</span></button>
        </div>`
    },
    {
      id:'label', url:'https://app.staging.local/settings/profile',
      name:'Profile settings — field copy',
      spec:"each field's placeholder describes that field's own input",
      severity:'Minor', bug:'email',
      hint:'Read every label together with the grey text underneath it.',
      why:'The field is labelled <code>Email address</code> but its placeholder shows a phone-number format. Copy was pasted into the wrong field — users type a phone number, validation rejects it, and nobody can tell why.',
      html:`
        <h5>Profile settings</h5><div class="app-sub">These details appear on your public profile</div>
        <button class="hot" data-id="name" aria-label="Full name field">
          <div class="app-field"><span class="app-label">Full name</span><div class="app-input">Mona Adel</div></div>
        </button>
        <button class="hot" data-id="email" aria-label="Email address field">
          <div class="app-field"><span class="app-label">Email address</span><div class="app-input ph">+20 1XX XXX XXXX</div></div>
        </button>
        <button class="hot" data-id="country" aria-label="Country field">
          <div class="app-field"><span class="app-label">Country</span><div class="app-input">Egypt</div></div>
        </button>
        <button class="hot inline" data-id="save" aria-label="Save changes button"><span class="app-btn">Save changes</span></button>`
    },
    {
      id:'promo', url:'https://shop.staging.local/cart/payment',
      name:'Payment — promo discount',
      spec:"a percentage promo deducts that percentage of the subtotal",
      severity:'Major', bug:'disc',
      hint:'A percentage is not an amount. Convert it before you trust the line.',
      why:'<code>SAVE20</code> is 20% of <code>$200.00</code> = <code>$40.00</code>, but only <code>$20.00</code> was deducted. The total is internally consistent with the wrong discount, so the summing logic is fine — the discount calculation treats the percentage as a flat amount.',
      html:`
        <h5>Payment</h5><div class="app-sub">Promo code applied · SAVE20</div>
        <button class="hot" data-id="sub" aria-label="Subtotal row"><div class="app-row"><span class="k">Subtotal</span><span class="v">$200.00</span></div></button>
        <button class="hot" data-id="disc" aria-label="Discount row"><div class="app-row"><span class="k">Promo SAVE20 (−20%)</span><span class="v" style="color:var(--pass)">−$20.00</span></div></button>
        <button class="hot" data-id="ship" aria-label="Shipping row"><div class="app-row"><span class="k">Shipping</span><span class="v">$0.00</span></div></button>
        <button class="hot" data-id="total" aria-label="Total row"><div class="app-row tot"><span class="k">Total</span><span class="v">$180.00</span></div></button>
        <div style="margin-top:16px"><span class="app-btn">Pay $180.00</span></div>`
    }
  ];

  /* ---------- refs ---------- */
  const el={
    start:document.getElementById('gameStart'),
    play:document.getElementById('gamePlay'),
    report:document.getElementById('gameReport'),
    hud:document.getElementById('hud'),
    round:document.getElementById('hudRound'),
    score:document.getElementById('hudScore'),
    found:document.getElementById('hudFound'),
    time:document.getElementById('hudTime'),
    timerItem:document.getElementById('hudTimer'),
    fill:document.getElementById('timerFill'),
    app:document.getElementById('mockApp'),
    url:document.getElementById('mockUrl'),
    spec:document.getElementById('specText'),
    steps:document.getElementById('steps'),
    verdict:document.getElementById('verdict'),
    hint:document.getElementById('btnHint'),
    startBtn:document.getElementById('btnStart'),
    footRun:document.getElementById('footRun')
  };

  /* ---------- state ---------- */
  let deck=[], idx=0, score=0, clicks=0, hits=0, results=[], roundStart=0,
      raf=null, locked=true, hintUsed=false, roundPenalty=0, pausedAt=0;

  const shuffle=a=>{const c=a.slice();for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[c[i],c[j]]=[c[j],c[i]];}return c;};
  const fmt=ms=>(ms/1000).toFixed(1)+'s';

  /* ---------- lifecycle ---------- */
  function startGame(){
    deck=shuffle(ROUNDS).slice(0,TOTAL);
    idx=0;score=0;clicks=0;hits=0;results=[];
    el.start.hidden=true;el.report.hidden=true;el.play.hidden=false;el.hud.hidden=false;
    buildSteps();
    loadRound();
    el.play.scrollIntoView({block:'center',behavior:'smooth'});
  }

  function buildSteps(){
    el.steps.innerHTML=deck.map((r,i)=>
      `<div class="step" data-step="${i}"><span class="n">${i+1}</span><span>${r.name.split('—')[0].trim()}</span></div>`
    ).join('');
  }

  function loadRound(){
    const r=deck[idx];
    hintUsed=false;roundPenalty=0;locked=false;
    el.hint.disabled=false;el.hint.textContent='Reveal hint (−'+HINT_COST+')';
    el.url.textContent=r.url;
    el.spec.innerHTML='&nbsp;&nbsp;'+r.spec;
    el.app.innerHTML=r.html;
    el.verdict.innerHTML='';
    el.round.textContent=(idx+1)+'/'+deck.length;
    el.score.textContent=score;
    el.found.textContent=hits;
    document.querySelectorAll('.step').forEach((s,i)=>{
      s.classList.toggle('on',i===idx);
      if(i<idx){
        s.classList.add('done');
        if(results[i] && !results[i].pass) s.classList.add('miss');
      }
    });
    el.app.querySelectorAll('.hot').forEach(h=>h.addEventListener('click',onHot));
    roundStart=performance.now();
    tick();
  }

  function tick(){
    cancelAnimationFrame(raf);
    const loop=()=>{
      if(locked) return;
      const left=Math.max(0,ROUND_MS-(performance.now()-roundStart));
      const pct=(left/ROUND_MS)*100;
      el.fill.style.width=pct+'%';
      el.fill.classList.toggle('low',pct<34);
      el.time.textContent=Math.ceil(left/1000)+'s';
      el.timerItem.classList.toggle('warn',pct<34);
      if(left<=0){ timeUp(); return; }
      raf=requestAnimationFrame(loop);
    };
    raf=requestAnimationFrame(loop);
  }

  /* ---------- interaction ---------- */
  function onHot(e){
    if(locked) return;
    const btn=e.currentTarget, r=deck[idx];
    clicks++;
    if(btn.dataset.id===r.bug){
      const elapsed=performance.now()-roundStart;
      const speed=Math.max(0,Math.round(400*(1-elapsed/ROUND_MS)));
      const gained=Math.max(50,600+speed-roundPenalty-(hintUsed?HINT_COST:0));
      score+=gained;hits++;
      btn.classList.add('mark-ok');
      const box=btn.getBoundingClientRect();
      if(window.__burst) window.__burst(box.left+box.width/2, box.top+box.height/2, 'pass');
      finishRound({pass:true,ms:elapsed,gained:gained,reason:'found'});
    }else{
      roundPenalty+=PENALTY;
      score=Math.max(0,score-PENALTY);
      el.score.textContent=score;
      btn.classList.add('mark-no');
      btn.disabled=true;
      const bx=btn.getBoundingClientRect();
      if(window.__burst) window.__burst(bx.left+bx.width/2, bx.top+bx.height/2, 'fail');
      el.verdict.innerHTML=
        `<div class="verdict no">
           <div class="verdict-t"><span>✗</span> FAIL — that element satisfies the requirement</div>
           <div class="verdict-d">−${PENALTY} points. Re-read the requirement on the right and compare it against what each element actually states.</div>
         </div>`;
    }
  }

  function timeUp(){
    const r=deck[idx];
    const target=el.app.querySelector('[data-id="'+r.bug+'"]');
    if(target) target.classList.add('mark-ok');
    finishRound({pass:false,ms:ROUND_MS,gained:0,reason:'timeout'});
  }

  function finishRound(res){
    locked=true;
    cancelAnimationFrame(raf);
    el.hint.disabled=true;
    const r=deck[idx];
    el.app.querySelectorAll('.hot').forEach(h=>h.classList.add('locked'));
    results[idx]={pass:res.pass,ms:res.ms,name:r.name,why:r.why,severity:r.severity};
    el.score.textContent=score;el.found.textContent=hits;
    const last=idx===deck.length-1;
    el.verdict.innerHTML=
      `<div class="verdict ${res.pass?'ok':'no'}">
         <div class="verdict-t">
           <span>${res.pass?'✓':'✗'}</span>
           ${res.pass?'PASS — defect located in '+fmt(res.ms):'FAIL — time expired, defect revealed'}
           <span class="chip ${res.severity==='Critical'?'chip-fail':res.severity==='Major'?'chip-warn':'chip-info'}" style="margin-left:auto">${r.severity}</span>
         </div>
         <div class="verdict-d">${r.why}${res.pass?' <b style="color:var(--pass)">+'+res.gained+' points</b>':''}</div>
         <div class="verdict-act">
           <button class="btn ${res.pass?'btn-g':'btn-o'}" id="btnNext">${last?'See test report':'Next round →'}</button>
         </div>
       </div>`;
    document.getElementById('btnNext').addEventListener('click',()=>{
      if(last){ showReport(); } else { idx++; loadRound(); }
    });
    document.getElementById('btnNext').focus({preventScroll:true});
  }

  el.hint.addEventListener('click',()=>{
    if(locked||hintUsed) return;
    hintUsed=true;
    el.hint.disabled=true;el.hint.textContent='Hint revealed';
    score=Math.max(0,score-HINT_COST);el.score.textContent=score;
    el.verdict.innerHTML=
      `<div class="verdict">
         <div class="verdict-t" style="color:var(--warn)"><span>!</span> HINT</div>
         <div class="verdict-d">${deck[idx].hint}</div>
       </div>`;
  });

  /* ---------- report ---------- */
  function showReport(){
    cancelAnimationFrame(raf);
    el.play.hidden=true;el.hud.hidden=true;el.report.hidden=false;
    el.fill.style.width='100%';el.fill.classList.remove('low');
    const total=results.length;
    const passed=results.filter(r=>r.pass).length;
    const failed=total-passed;
    const pct=Math.round((passed/total)*100);
    const accuracy=clicks?Math.round((hits/clicks)*100):0;
    const avg=results.reduce((s,r)=>s+r.ms,0)/total;
    let best=0;try{best=parseInt(localStorage.getItem('stbBest')||'0',10);}catch(e){}
    const isBest=score>best;
    if(isBest){try{localStorage.setItem('stbBest',String(score));}catch(e){}}

    let grade,blurb;
    if(passed===total && accuracy>=80){grade='SENIOR QA EYE';blurb='Six for six with clean clicks. You read requirements before you read the screen — that is the whole discipline.';}
    else if(passed>=5){grade='STRONG TESTER';blurb='You caught almost everything. The misses are the ones that hide in copy and state, not in the numbers.';}
    else if(passed>=3){grade='SOLID INSTINCT';blurb='Half the defects found. The pattern worth practising: check arithmetic, then check whether the UI contradicts itself.';}
    else{grade='KEEP TRAINING';blurb='Most defects survived. Not a problem — this is exactly what test case design is for. Run it again and work the requirement line by line.';}

    const circ=2*Math.PI*48;
    el.report.innerHTML=`
      <div class="report-top">
        <div class="ring">
          <svg viewBox="0 0 112 112" aria-hidden="true">
            <circle class="bgc" cx="56" cy="56" r="48"></circle>
            <circle class="fgc" cx="56" cy="56" r="48"
              style="stroke:${pct>=80?'var(--pass)':pct>=50?'var(--warn)':'var(--fail)'};
                     stroke-dasharray:${circ};stroke-dashoffset:${circ}"></circle>
          </svg>
          <div class="ring-txt"><div><div class="ring-n">${pct}%</div><div class="ring-l">detected</div></div></div>
        </div>
        <div style="flex:1;min-width:240px">
          <div class="chip ${passed===total?'chip-pass':'chip-warn'}" style="margin-bottom:8px">${grade}</div>
          <div class="report-title">${passed} passing · ${failed} failing</div>
          <p class="report-sub">${blurb}</p>
          <div class="report-stats">
            <span class="hud-item">score <b>${score}</b></span>
            <span class="hud-item">best <b>${Math.max(score,best)}</b>${isBest?' <span style="color:var(--pass)">new</span>':''}</span>
            <span class="hud-item">click accuracy <b>${accuracy}%</b></span>
            <span class="hud-item">avg time <b>${fmt(avg)}</b></span>
          </div>
        </div>
      </div>

      <div class="log">
        ${results.map((r,i)=>`
          <div class="log-row">
            <span class="mk ${r.pass?'ok':'no'}">${r.pass?'✓':'✗'}</span>
            <div style="flex:1;min-width:0">
              <div class="log-name">${i+1}. ${r.name} <span class="chip ${r.severity==='Critical'?'chip-fail':r.severity==='Major'?'chip-warn':'chip-info'}" style="margin-left:6px">${r.severity}</span></div>
              <div class="log-why">${r.why}</div>
            </div>
            <span class="log-time">${r.pass?fmt(r.ms):'timeout'}</span>
          </div>`).join('')}
      </div>

      <div class="report-cta">
        <button class="btn btn-g" id="btnAgain">
          <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
          Run the suite again
        </button>
        <a class="btn btn-o" href="#contact">Hire this eye →</a>
        <a class="btn btn-o" href="#work">See how I automate it →</a>
      </div>`;

    requestAnimationFrame(()=>{
      const fg=el.report.querySelector('.fgc');
      if(fg) fg.style.strokeDashoffset=String(circ*(1-passed/total));
    });
    document.getElementById('btnAgain').addEventListener('click',startGame);
    if(el.footRun) el.footRun.textContent='test run finished — '+failed+' failing';
    el.report.scrollIntoView({block:'center',behavior:'smooth'});
  }

  /* pause the clock if the tab goes away — nobody should lose to a notification */
  document.addEventListener('visibilitychange',()=>{
    if(locked) return;
    if(document.hidden){ pausedAt=performance.now(); cancelAnimationFrame(raf); }
    else if(pausedAt){ roundStart+=performance.now()-pausedAt; pausedAt=0; tick(); }
  });

  el.startBtn.addEventListener('click',startGame);
})();
