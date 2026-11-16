/* NetStart – shared behaviour
   Small, dependency-free helpers. Everything here is progressive:
   if JS is unavailable the pages still read as static documents. */
(function () {
  'use strict';

  /* ---------- theme ---------- */
  var THEME_KEY = 'netstart-theme';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var btn = document.querySelector('[data-theme-toggle]');
    if (btn) {
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      btn.innerHTML = theme === 'dark'
        ? '<span aria-hidden="true">☀</span><span class="visually-hidden">Switch to light theme</span>'
        : '<span aria-hidden="true">☾</span><span class="visually-hidden">Switch to dark theme</span>';
    }
  }

  function initTheme() {
    var saved = localStorage.getItem(THEME_KEY);
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (prefersDark ? 'dark' : 'light'));

    var btn = document.querySelector('[data-theme-toggle]');
    if (btn) {
      btn.addEventListener('click', function () {
        var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
      });
    }
  }

  /* ---------- progress ---------- */
  var PROGRESS_KEY = 'netstart-progress';

  function readProgress() {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
    catch (e) { return {}; }
  }

  function writeProgress(p) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  }

  function markVisited(page) {
    var p = readProgress();
    p[page] = p[page] || { visited: false, quiz: null };
    if (!p[page].visited) {
      p[page].visited = true;
      writeProgress(p);
    }
    renderProgress();
  }

  function renderProgress() {
    var p = readProgress();
    var pages = ['basics', 'concepts', 'quiz', 'cheatsheet'];
    var done = pages.filter(function (k) { return p[k] && p[k].visited; }).length;
    var pct = Math.round((done / pages.length) * 100);

    document.querySelectorAll('[data-progress-bar]').forEach(function (el) {
      el.style.width = pct + '%';
      el.setAttribute('aria-valuenow', pct);
    });
    document.querySelectorAll('[data-progress-text]').forEach(function (el) {
      el.textContent = done + ' of ' + pages.length + ' sections explored';
    });
    document.querySelectorAll('[data-progress-dot]').forEach(function (el) {
      var key = el.getAttribute('data-progress-dot');
      var visited = !!(p[key] && p[key].visited);
      el.classList.toggle('is-done', visited);
      if (key === 'quiz' && p.quiz && typeof p.quiz.quiz === 'number') {
        el.textContent = 'explored · best ' + p.quiz.quiz + '%';
      } else {
        el.textContent = visited ? 'explored' : 'not yet visited';
      }
    });
  }

  /* ---------- concept cards ---------- */
  function initConceptCards() {
    document.querySelectorAll('.concept-card').forEach(function (card) {
      var head = card.querySelector('.concept-head');
      if (!head) return;
      function toggle() {
        var open = card.classList.toggle('open');
        head.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      head.addEventListener('click', toggle);
      head.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });
  }

  /* ---------- concept filter ---------- */
  function initConceptFilter() {
    var input = document.getElementById('conceptSearch');
    if (!input) return;
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-concept]'));
    var counter = document.getElementById('conceptCount');
    var chips = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));

    function apply() {
      var q = input.value.trim().toLowerCase();
      var active = document.querySelector('[data-filter].active');
      var tag = active ? active.getAttribute('data-filter') : 'all';
      var shown = 0;

      items.forEach(function (item) {
        var text = (item.getAttribute('data-concept') + ' ' + item.textContent).toLowerCase();
        var matchesText = !q || text.indexOf(q) !== -1;
        var matchesTag = tag === 'all' || item.getAttribute('data-tags').indexOf(tag) !== -1;
        var show = matchesText && matchesTag;
        item.classList.toggle('d-none', !show);
        if (show) shown++;
      });

      if (counter) counter.textContent = shown + ' of ' + items.length + ' concepts shown';
    }

    input.addEventListener('input', apply);
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        apply();
      });
    });
    apply();
  }

  /* ---------- quiz ---------- */
  var QUESTIONS = [
    {
      q: 'Which OSI layer decides the route a packet takes between networks?',
      options: ['Data link', 'Network', 'Transport', 'Session'],
      answer: 1,
      why: 'The network layer (layer 3) handles logical addressing and routing, which is where IP lives.',
      ref: { href: 'basics.html', label: 'the basics' }
    },
    {
      q: 'A TCP three-way handshake begins with which message?',
      options: ['ACK', 'SYN', 'FIN', 'RST'],
      answer: 1,
      why: 'The client sends SYN, the server answers SYN-ACK, and the client confirms with ACK.',
      ref: { href: 'concepts.html', label: 'TCP' }
    },
    {
      q: 'What does DNS do?',
      options: [
        'Assigns IP addresses automatically',
        'Translates domain names into IP addresses',
        'Encrypts web traffic',
        'Routes packets between networks'
      ],
      answer: 1,
      why: 'DNS is the name system: it resolves names such as example.com to an address the network can route to.',
      ref: { href: 'concepts.html', label: 'DNS' }
    },
    {
      q: 'Which address range is private (RFC 1918)?',
      options: ['8.8.8.0/24', '172.16.0.0/12', '100.64.0.0/10', '198.51.100.0/24'],
      answer: 1,
      why: '172.16.0.0/12 is one of the three private ranges, alongside 10.0.0.0/8 and 192.168.0.0/16.',
      ref: { href: 'cheatsheet.html', label: 'the addresses table' }
    },
    {
      q: 'Which protocol is connectionless and does not guarantee delivery?',
      options: ['TCP', 'UDP', 'TLS', 'BGP'],
      answer: 1,
      why: 'UDP sends datagrams without a handshake, ordering or retransmission. That is why DNS and voice use it.',
      ref: { href: 'concepts.html', label: 'UDP' }
    },
    {
      q: 'A device needs an address before it can talk to the network. Which service usually provides it?',
      options: ['DNS', 'DHCP', 'NAT', 'ARP'],
      answer: 1,
      why: 'DHCP leases an address, subnet mask, gateway and DNS server to a client when it joins the network.',
      ref: { href: 'concepts.html', label: 'DHCP' }
    },
    {
      q: 'What is the main job of NAT on a home router?',
      options: [
        'Translate private addresses to a public address',
        'Encrypt traffic between hosts',
        'Resolve hostnames',
        'Split a network into VLANs'
      ],
      answer: 0,
      why: 'NAT rewrites source addresses so many private devices can share one public IPv4 address.',
      ref: { href: 'concepts.html', label: 'NAT' }
    },
    {
      q: 'Which command shows the path packets take to a destination?',
      options: ['ping', 'tracert / traceroute', 'nslookup', 'netstat'],
      answer: 1,
      why: 'Traceroute increases the TTL step by step and reports each router that answers, revealing the path.',
      ref: { href: 'cheatsheet.html', label: 'the commands table' }
    }
  ];

  function initQuiz() {
    var root = document.getElementById('quizRoot');
    if (!root) return;

    var state = { pos: 0, score: 0, answered: false, qOrder: [], misses: [] };

    var qText = document.getElementById('quizQuestion');
    var opts = document.getElementById('quizOptions');
    var feedback = document.getElementById('quizFeedback');
    var nextBtn = document.getElementById('quizNext');
    var counter = document.getElementById('quizCounter');
    var bar = document.getElementById('quizBar');
    var result = document.getElementById('quizResult');
    var recap = document.getElementById('resultRecap');
    var badge = document.getElementById('resultBadge');

    function shuffled(n) {
      var order = [];
      for (var i = 0; i < n; i++) order.push(i);
      for (var j = order.length - 1; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var tmp = order[j]; order[j] = order[k]; order[k] = tmp;
      }
      return order;
    }

    /* Question order is reshuffled on every attempt, so "Try again" is a
       different run rather than the same eight questions in the same order. */
    function start() {
      state.pos = 0;
      state.score = 0;
      state.misses = [];
      state.qOrder = shuffled(QUESTIONS.length);
    }

    function currentItem() {
      return QUESTIONS[state.qOrder[state.pos]];
    }

    function render() {
      var item = currentItem();
      state.answered = false;

      qText.textContent = item.q;
      counter.textContent = 'Question ' + (state.pos + 1) + ' of ' + QUESTIONS.length;
      var pct = Math.round((state.pos / QUESTIONS.length) * 100);
      bar.style.width = pct + '%';
      bar.setAttribute('aria-valuenow', pct);

      /* The correct answer is always in the source at index `answer`; shuffle the
         display order so the right option is not always in the same slot. */
      state.order = shuffled(item.options.length);
      opts.innerHTML = '';
      state.order.forEach(function (origIndex, pos) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quiz-option mb-2';
        btn.textContent = item.options[origIndex];
        btn.style.animationDelay = (pos * 45) + 'ms';
        btn.classList.add('option-in');
        btn.addEventListener('click', function () { choose(pos, btn); });
        opts.appendChild(btn);
      });

      feedback.textContent = '';
      feedback.className = 'mt-3 small';
      nextBtn.disabled = true;
      nextBtn.textContent = state.pos === QUESTIONS.length - 1 ? 'See result' : 'Next question';
      result.classList.add('d-none');
      root.classList.remove('d-none');
    }

    function choose(pos, btn) {
      if (state.answered) return;
      state.answered = true;

      var item = currentItem();
      var correctPos = state.order.indexOf(item.answer);
      var buttons = opts.querySelectorAll('.quiz-option');
      buttons.forEach(function (b, idx) {
        b.classList.add('disabled');
        if (idx === correctPos) b.classList.add('correct');
      });

      if (pos === correctPos) {
        state.score++;
        feedback.className = 'mt-3 small text-success';
        feedback.textContent = 'Correct. ' + item.why;
      } else {
        btn.classList.add('wrong');
        state.misses.push({
          q: item.q,
          chosen: btn.textContent,
          correct: item.options[item.answer],
          ref: item.ref
        });
        feedback.className = 'mt-3 small text-danger';
        feedback.textContent = 'Not quite. ' + item.why;
      }
      nextBtn.disabled = false;
    }

    function next() {
      if (state.pos < QUESTIONS.length - 1) {
        state.pos++;
        render();
        return;
      }
      finish();
    }

    /* After the score, list every missed question with the right answer and a
       link to the page that explains it — the recap is the retention hook. */
    function renderRecap() {
      if (!recap) return;
      if (!state.misses.length) {
        recap.innerHTML =
          '<div class="callout small mb-0"><strong>A clean sheet.</strong> Nothing to review — ' +
          'keep the streak going on the cheat sheet.</div>';
        return;
      }
      var html = '<h3 class="h6 fw-semibold mb-2">Worth another look</h3>';
      state.misses.forEach(function (m) {
        html +=
          '<div class="recap-item">' +
          '<p class="small mb-1"><strong>' + m.q + '</strong></p>' +
          '<p class="small text-danger mb-1">Your answer: ' + m.chosen + '</p>' +
          '<p class="small text-success mb-1">Correct: ' + m.correct + '</p>' +
          '<a class="small fw-semibold" href="' + m.ref.href + '">Review in ' + m.ref.label + ' →</a>' +
          '</div>';
      });
      recap.innerHTML = html;
    }

    function showResultView(score, pct, misses) {
      root.classList.add('d-none');
      result.classList.remove('d-none');
      if (badge) badge.classList.toggle('d-none', pct < 87);
      countUp(document.getElementById('resultScore'), score, QUESTIONS.length);
      document.getElementById('resultPct').textContent = pct + '%';
      document.getElementById('resultBar').style.width = pct + '%';
      document.getElementById('resultBar').setAttribute('aria-valuenow', pct);
      if (counter) counter.textContent = 'Completed (' + score + ' of ' + QUESTIONS.length + ')';
      if (bar) {
        bar.style.width = '100%';
        bar.setAttribute('aria-valuenow', 100);
      }

      var msg = pct >= 87 ? 'Strong grasp of the core ideas. Move on to the cheat sheet and try explaining each layer out loud.'
        : pct >= 62 ? 'Solid, but a few gaps. Re-read the sections behind the questions you missed.'
          : 'Worth another pass through the basics and concepts pages before this sits in your memory.';

      document.getElementById('resultMsg').textContent = msg;
      state.misses = Array.isArray(misses) ? misses : [];
      renderRecap();
    }

    function finish() {
      var pct = Math.round((state.score / QUESTIONS.length) * 100);
      showResultView(state.score, pct, state.misses);

      var p = readProgress();
      p.quiz = p.quiz || { visited: true, quiz: null };
      /* Keep the best attempt so one bad run does not erase a good score. */
      p.quiz.quiz = Math.max(pct, p.quiz.quiz || 0);
      p.quiz.lastScore = state.score;
      p.quiz.lastPct = pct;
      p.quiz.lastMisses = state.misses;
      p.quiz.visited = true;
      writeProgress(p);
      renderProgress();
    }

    nextBtn.addEventListener('click', next);
    document.getElementById('quizRestart').addEventListener('click', function () {
      start();
      render();
    });

    var savedProgress = readProgress();
    if (savedProgress.quiz && typeof savedProgress.quiz.quiz === 'number') {
      var savedPct = typeof savedProgress.quiz.lastPct === 'number'
        ? savedProgress.quiz.lastPct
        : savedProgress.quiz.quiz;
      var savedScore = typeof savedProgress.quiz.lastScore === 'number'
        ? savedProgress.quiz.lastScore
        : Math.round((savedPct / 100) * QUESTIONS.length);
      showResultView(savedScore, savedPct, savedProgress.quiz.lastMisses || []);
    } else {
      start();
      render();
    }
  }

  /* ---------- subnet calculator ---------- */
  function initSubnet() {
    var input = document.getElementById('cidrInput');
    if (!input) return;
    var out = document.getElementById('cidrResult');

    function ipToInt(ip) {
      var parts = ip.split('.');
      if (parts.length !== 4) return null;
      var n = 0;
      for (var i = 0; i < 4; i++) {
        var v = Number(parts[i]);
        if (!Number.isInteger(v) || v < 0 || v > 255) return null;
        n = (n * 256) + v;
      }
      return n;
    }

    function intToIp(n) {
      return [ (n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255 ].join('.');
    }

    function calc() {
      var raw = input.value.trim();
      var m = raw.match(/^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/);
      if (!m) {
        out.innerHTML = '<div class="text-danger small">Enter an address in the form 192.168.1.10/24.</div>';
        return;
      }
      var ip = ipToInt(m[1]);
      var bits = Number(m[2]);
      if (ip === null || bits < 0 || bits > 32) {
        out.innerHTML = '<div class="text-danger small">That address or prefix is not valid.</div>';
        return;
      }
      var mask = bits === 0 ? 0 : (0xFFFFFFFF << (32 - bits)) >>> 0;
      var network = (ip & mask) >>> 0;
      var broadcast = (network | (~mask >>> 0)) >>> 0;
      var hosts = bits >= 31 ? 0 : Math.pow(2, 32 - bits) - 2;

      out.innerHTML =
        '<dl class="row mb-0 small">' +
        '<dt class="col-5">Network</dt><dd class="col-7 mono">' + intToIp(network) + '/' + bits + '</dd>' +
        '<dt class="col-5">Subnet mask</dt><dd class="col-7 mono">' + intToIp(mask) + '</dd>' +
        '<dt class="col-5">Usable range</dt><dd class="col-7 mono">' + (hosts ? intToIp(network + 1) + ' – ' + intToIp(broadcast - 1) : '—') + '</dd>' +
        '<dt class="col-5">Broadcast</dt><dd class="col-7 mono">' + intToIp(broadcast) + '</dd>' +
        '<dt class="col-5">Usable hosts</dt><dd class="col-7">' + hosts + '</dd>' +
        '</dl>';

      /* Flash the panel so it is obvious the numbers were recalculated. */
      out.classList.remove('is-updated');
      void out.offsetWidth;
      out.classList.add('is-updated');
    }

    input.addEventListener('input', calc);
    var form = document.getElementById('cidrForm');
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); calc(); });
    calc();
  }

  /* ---------- motion ---------- */
  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* True when this is not the first visit. Marks the flag either way, so the
     intro choreography (word-by-word headline, count-up stats) plays once. */
  function isRepeatVisit() {
    var seen = false;
    try {
      seen = !!localStorage.getItem('netstart-hero-seen');
      localStorage.setItem('netstart-hero-seen', '1');
    } catch (e) { /* storage unavailable: play the intro every time */ }
    return seen;
  }

  /* Sections fade up the first time they scroll into view. */
  function initReveal() {
    if (!('IntersectionObserver' in window) || prefersReducedMotion()) return;

    var targets = document.querySelectorAll('main section, main .card, main .callout');
    if (!targets.length) return;

    targets.forEach(function (el, i) {
      el.classList.add('will-reveal');
      /* Alternate the direction so a long page does not rise in one block. */
      if (i % 2 === 1) el.classList.add('from-right');
      else if (i % 4 === 0) el.classList.add('from-left');
      var siblings = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
      el.style.transitionDelay = Math.min(siblings, 5) * 60 + 'ms';
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });

    targets.forEach(function (el) { io.observe(el); });

    /* Safety net: if the observer never fires (some embedded viewers and
       headless renderers), show everything rather than leave the page blank. */
    window.setTimeout(function () {
      targets.forEach(function (el) { el.classList.add('is-visible'); });
    }, 2000);
  }

  /* Click feedback on buttons, drawn from the point that was pressed. */
  function initRipple() {
    if (prefersReducedMotion()) return;

    document.querySelectorAll('.btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var rect = btn.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height);
        var span = document.createElement('span');
        span.className = 'ripple';
        span.style.width = size + 'px';
        span.style.height = size + 'px';
        span.style.left = (e.clientX - rect.left - size / 2) + 'px';
        span.style.top = (e.clientY - rect.top - size / 2) + 'px';
        btn.appendChild(span);
        setTimeout(function () {
          if (span.parentNode) span.parentNode.removeChild(span);
        }, 600);
      });
    });
  }

  /* Numbers in the result panel count up instead of appearing at once. */
  function countUp(el, to, total) {
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = to + ' / ' + total;
      return;
    }
    var start = null;
    var duration = 650;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * eased) + ' / ' + total;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* Headline arrives word by word. The text is unchanged, only wrapped.
     `skip` is true for repeat visits and reduced-motion users, so the intro
     choreography plays once and then gets out of the way. */
  function initHeroWords(skip) {
    var h1 = document.querySelector('.hero-title');
    if (!h1 || skip) return;

    var words = h1.textContent.trim().split(/\s+/);
    h1.textContent = '';
    words.forEach(function (word, i) {
      var span = document.createElement('span');
      span.className = 'w';
      span.textContent = word;
      span.style.setProperty('--i', i);
      h1.appendChild(span);
      h1.appendChild(document.createTextNode(' '));
    });
  }

  /* The four numbers under the headline count up once. */
  function initCounters(skip) {
    var els = document.querySelectorAll('.stat[data-count]');
    if (!els.length || skip) return;

    els.forEach(function (el) {
      var target = Number(el.getAttribute('data-count')) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      var start = null;
      var duration = 900;

      function tick(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }

      el.textContent = '0' + suffix;
      requestAnimationFrame(tick);
    });
  }

  /* A thin bar at the top of the window tracks how far down the page you are. */
  function initScrollProgress() {
    if (!document.body) return;

    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
      bar.style.width = Math.max(0, Math.min(100, pct)) + '%';
    }

    window.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* Elements marked data-parallax drift a little slower than the page. */
  function initParallax() {
    var els = document.querySelectorAll('[data-parallax]');
    if (!els.length || prefersReducedMotion()) return;

    var strength = 0.08;
    function update() {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      els.forEach(function (el) {
        var offset = y * strength;
        el.style.transform = 'translate3d(0,' + (-offset).toFixed(1) + 'px,0)';
      });
    }
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { update(); ticking = false; });
    }, { passive: true });
    update();
  }

  /* ---------- site assistant ---------- */

  /* A fixed knowledge base written into the page. It is a keyword match, not a
     language model: every answer below is one of these strings. */
  var KB = [
    { k: ['dns', 'name', 'domain', 'resolve'], a: 'DNS turns a name such as example.com into an IP address the network can route to. It is the first thing that happens when you open a page.', link: 'basics.html', label: 'Basics' },
    { k: ['ip address', 'ip', 'address'], a: 'An IP address is the number a packet is routed to, for example 192.168.1.10. Your public address is different from the private one your router gives you.', link: 'concepts.html', label: 'Core concepts' },
    { k: ['router', 'switch'], a: 'A router forwards packets between networks and picks the next hop. A switch stays inside one network and forwards by MAC address.', link: 'basics.html', label: 'Basics' },
    { k: ['tcp', 'udp', 'reliable'], a: 'TCP checks delivery and order, so nothing is lost silently. UDP just sends: faster, no guarantees. DNS queries normally go over UDP.', link: 'concepts.html', label: 'Core concepts' },
    { k: ['subnet', 'cidr', 'mask', 'prefix'], a: 'In a /24 the first 24 bits are the network and the last 8 are hosts. The calculator on the concepts page works this out for any address.', link: 'concepts.html', label: 'Core concepts' },
    { k: ['https', 'http', 'secure', 'tls', 'certificate'], a: 'HTTPS is HTTP inside TLS: the same requests, encrypted, plus a certificate that proves which server answered.', link: 'concepts.html', label: 'Core concepts' },
    { k: ['packet', 'encapsulation', 'header'], a: 'Data is cut into packets. Each layer adds its own header, which is what encapsulation means — the Basics page draws it layer by layer.', link: 'basics.html', label: 'Basics' },
    { k: ['osi', 'layer', 'model'], a: 'The OSI model is seven layers. Layer 3 (network) routes packets, layer 4 (transport) handles ports and reliability, layer 7 is what the application asked for.', link: 'concepts.html', label: 'Core concepts' },
    { k: ['dhcp'], a: 'DHCP hands a device its address, mask, gateway and DNS server when it joins the network, which is why you rarely type an address by hand.', link: 'concepts.html', label: 'Core concepts' },
    { k: ['nat'], a: 'NAT rewrites private addresses into one public address, so many devices at home share a single IPv4 address.', link: 'concepts.html', label: 'Core concepts' },
    { k: ['port', '443', '53'], a: 'A port says which program on the machine should receive the packet: 443 for HTTPS, 53 for DNS, 22 for SSH.', link: 'cheatsheet.html', label: 'Cheat sheet' },
    { k: ['latency', 'bandwidth', 'slow', 'speed'], a: 'Bandwidth is how much fits per second; latency is how long one round trip takes. A fast link still feels slow when latency is high.', link: 'concepts.html', label: 'Core concepts' },
    { k: ['quiz', 'test', 'score', 'question'], a: 'The quiz has eight questions, each with an explanation after the answer. Your score is kept in this browser, so you can come back to it.', link: 'quiz.html', label: 'Quiz' },
    { k: ['cheat', 'print', 'revise', 'revision'], a: 'The cheat sheet condenses the whole site into one printable table — useful the night before an exam.', link: 'cheatsheet.html', label: 'Cheat sheet' },
    { k: ['who', 'ai', 'you', 'robot', 'assistant'], a: 'I am the site assistant. I match your question against a fixed list of answers built into this page — there is no live model behind it.', link: 'HomePage.html', label: 'Home' }
  ];

  var SUGGESTIONS = ['What is DNS?', 'TCP or UDP?', 'What is a subnet?', 'How does the quiz work?'];

  function initAssistant() {
    if (document.querySelector('.ai-fab')) return;

    var wrap = document.createElement('div');
    wrap.className = 'ai-fab-wrap';

    var fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'ai-fab';
    fab.setAttribute('aria-expanded', 'false');
    fab.setAttribute('aria-controls', 'aiPanel');
    fab.setAttribute('aria-label', 'Ask the site assistant');
    fab.innerHTML = '<span class="ai-fab-dot" aria-hidden="true"></span><span class="ai-fab-label">AI</span>';

    var panel = document.createElement('section');
    panel.className = 'ai-panel';
    panel.id = 'aiPanel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Site assistant');
    panel.hidden = true;
    panel.innerHTML =
      '<header class="ai-head">' +
        '<strong>NetStart AI</strong>' +
        '<button type="button" class="ai-close" aria-label="Close">×</button>' +
      '</header>' +
      '<p class="ai-note">Answers come from a knowledge base built into this page.</p>' +
      '<div class="ai-log" role="log" aria-live="polite"></div>' +
      '<div class="ai-chips"></div>' +
      '<form class="ai-form">' +
        '<input class="ai-input" type="text" placeholder="Ask about DNS, packets, subnets…" aria-label="Your question">' +
        '<button class="ai-send" type="submit" aria-label="Send">↑</button>' +
      '</form>';

    wrap.appendChild(panel);
    wrap.appendChild(fab);
    document.body.appendChild(wrap);

    var log = panel.querySelector('.ai-log');
    var chips = panel.querySelector('.ai-chips');
    var form = panel.querySelector('.ai-form');
    var input = panel.querySelector('.ai-input');
    var closeBtn = panel.querySelector('.ai-close');

    function addMessage(text, who, link, label) {
      var p = document.createElement('div');
      p.className = 'ai-msg ai-msg-' + who;
      p.textContent = text;
      if (link) {
        var a = document.createElement('a');
        a.href = link;
        a.textContent = 'Open ' + label + ' →';
        a.className = 'ai-link';
        p.appendChild(document.createElement('br'));
        p.appendChild(a);
      }
      log.appendChild(p);
      log.scrollTop = log.scrollHeight;
      return p;
    }

    function best(question) {
      var q = question.toLowerCase();
      var winner = null;
      var winnerScore = 0;
      KB.forEach(function (item) {
        var score = 0;
        item.k.forEach(function (kw) {
          if (q.indexOf(kw) !== -1) score += kw.length > 3 ? 2 : 1;
        });
        if (score > winnerScore) { winnerScore = score; winner = item; }
      });
      return winner;
    }

    function reply(question) {
      addMessage(question, 'user');
      var hit = best(question);
      window.setTimeout(function () {
        if (hit) {
          addMessage(hit.a, 'bot', hit.link, hit.label);
        } else {
          addMessage('I do not have that one. Try DNS, packets, subnets, ports or the quiz — or open the concepts page and search there.', 'bot', 'concepts.html', 'Core concepts');
        }
      }, 220);
    }

    function open() {
      panel.hidden = false;
      fab.setAttribute('aria-expanded', 'true');
      wrap.classList.add('is-open');
      if (!log.childElementCount) {
        addMessage('Hi. Ask me anything from the course — I answer from the site itself.', 'bot');
      }
      input.focus();
    }

    function close() {
      panel.hidden = true;
      fab.setAttribute('aria-expanded', 'false');
      wrap.classList.remove('is-open');
    }

    SUGGESTIONS.forEach(function (text) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ai-chip';
      b.textContent = text;
      b.addEventListener('click', function () { reply(text); });
      chips.appendChild(b);
    });

    fab.addEventListener('click', function () {
      if (panel.hidden) open(); else close();
    });
    closeBtn.addEventListener('click', close);
    panel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); fab.focus(); }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = input.value.trim();
      if (!value) return;
      input.value = '';
      reply(value);
    });
  }

  /* ---------- mascot ---------- */

  /* Three clips from the dsh-pet package (MIT, see assets/mascot/README.txt).
     Local files only: nothing is fetched and no model is called. */
  var MASCOT = {
    idle: 'assets/mascot/idle.webm',
    look: 'assets/mascot/look.webm',
    tap: 'assets/mascot/tap.webm'
  };

  function initMascot() {
    if (document.querySelector('.mascot')) return;

    var wrap = document.createElement('div');
    wrap.className = 'mascot';

    var video = document.createElement('video');
    video.className = 'mascot-video';
    video.src = MASCOT.idle;
    video.muted = true;
    video.loop = true;
    video.autoplay = !prefersReducedMotion();
    video.playsInline = true;
    video.setAttribute('aria-hidden', 'true');
    video.preload = 'auto';

    /* With reduced motion the clip stays paused, so nudge it past frame zero —
       otherwise the element is transparent and the mascot looks missing. */
    video.addEventListener('loadeddata', function () {
      if (video.paused) {
        try { video.currentTime = 0.04; } catch (e) { /* ignore */ }
      }
    });

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'mascot-button';
    button.setAttribute('aria-label', 'Say hello to the course mascot');

    wrap.appendChild(video);
    wrap.appendChild(button);
    document.body.appendChild(wrap);

    function playOnce(src) {
      video.loop = false;
      video.src = src;
      video.play().catch(function () { /* autoplay blocked: leave the first frame */ });
    }

    video.addEventListener('ended', function () {
      video.loop = true;
      video.src = MASCOT.idle;
      video.play().catch(function () {});
    });

    button.addEventListener('click', function () {
      playOnce(MASCOT.tap);
    });

    /* A glance every so often, so it does not look like a frozen image. */
    if (!prefersReducedMotion()) {
      window.setInterval(function () {
        if (video.src.indexOf(MASCOT.tap) !== -1) return;
        playOnce(MASCOT.look);
      }, 18000);
    }
  }

  /* ---------- request stepper ---------- */

  /* The Basics page turns "follow one request" into a five-step walk: each
     click lights up the hop the request is at. Falls back to a plain list
     when JavaScript is unavailable (see the noscript block in basics.html). */
  function initRequestStepper() {
    var root = document.getElementById('requestStepper');
    if (!root) return;

    var STEPS = [
      { node: 'laptop', title: '1 · DNS lookup', text: 'Your resolver asks for the address of the name you typed. Nothing has been sent to the server yet.' },
      { node: 'router', title: '2 · Routing decision', text: 'The destination is outside your subnet, so the packet leaves by the default gateway.' },
      { node: 'router', title: '3 · NAT', text: 'The router rewrites your private source address to its public one and remembers the mapping.' },
      { node: 'server', title: '4 · Transport', text: 'A TCP handshake opens a connection to the server\u2019s port 443.' },
      { node: 'laptop', title: '5 · The way back', text: 'The reply matches the NAT mapping and is forwarded to your machine.' }
    ];

    var title = document.getElementById('stepTitle');
    var text = document.getElementById('stepText');
    var dots = document.getElementById('stepDots');
    var prevBtn = document.getElementById('stepPrev');
    var nextBtn = document.getElementById('stepNext');
    if (!title || !text || !prevBtn || !nextBtn) return;

    var i = 0;

    function render() {
      var s = STEPS[i];
      title.textContent = s.title;
      text.textContent = s.text;
      if (dots) {
        var marks = '';
        for (var k = 0; k < STEPS.length; k++) marks += (k <= i ? '\u25CF' : '\u25CB') + ' ';
        dots.textContent = marks.trim();
      }
      root.querySelectorAll('.stepper-node').forEach(function (el) {
        el.classList.toggle('is-active', el.getAttribute('data-node') === s.node);
      });
      prevBtn.disabled = i === 0;
      nextBtn.textContent = i === STEPS.length - 1 ? 'Restart \u21BA' : 'Next step \u2192';
    }

    prevBtn.addEventListener('click', function () {
      if (i > 0) { i--; render(); }
    });
    nextBtn.addEventListener('click', function () {
      i = i === STEPS.length - 1 ? 0 : Math.min(i + 1, STEPS.length - 1);
      render();
    });
    render();
  }

  /* ---------- boot ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initConceptCards();
    initConceptFilter();
    initQuiz();
    initSubnet();
    initRequestStepper();
    initReveal();
    initRipple();

    /* The intro choreography plays on the first visit only; returning
       visitors get the content immediately instead of replaying it. */
    var skipIntro = prefersReducedMotion() || isRepeatVisit();
    initHeroWords(skipIntro);
    initCounters(skipIntro);

    initScrollProgress();
    initParallax();
    initAssistant();
    initMascot();

    var page = document.body.getAttribute('data-page');
    if (page) markVisited(page);

    document.querySelectorAll('.navbar .nav-link').forEach(function (link) {
      var href = link.getAttribute('href');
      if (href && href.replace('.html', '') === page) link.classList.add('active');
    });

    renderProgress();
  });
})();
