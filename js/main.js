(function () {
  var root = document.documentElement;
  var home = document.getElementById('home');
  // every view that is not the homepage: the three cases, What we make, About us, the gaffe story
  var cases = { aquainn: document.getElementById('aquainn'), ara: document.getElementById('ara'), sanjo: document.getElementById('sanjo'), services: document.getElementById('services'), about: document.getElementById('about'), story: document.getElementById('story') };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function each(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  /* ---------- the side-scroller: its own page, opened from the play button ---------- */
  var story = cases.story;
  var side = document.getElementById('idea');
  var stick = side.querySelector('.side__sticky');
  var view = side.querySelector('.side__view');
  var track = side.querySelector('.side__track');
  var bar = side.querySelector('.side__bar');
  var walk = side.querySelector('.side__walk');
  var prev = document.getElementById('side-prev'), next = document.getElementById('side-next');
  var topBar = document.querySelector('.top');
  var hmovers = Array.prototype.slice.call(side.querySelectorAll('[data-hspeed]'));
  var pinned = false, dist = 0, RATIO = 2.2, walkT = 0;

  // Pinned: vertical scrolling drives the ribbon. Otherwise the ribbon scrolls sideways on its own.
  function measure() {
    if (story.hidden) { return; }
    var can = !reduce && window.innerHeight >= 420 && window.innerHeight <= 1400;
    if (can !== pinned) {
      pinned = can;
      side.classList.toggle('pin', pinned);
      if (pinned) { view.scrollLeft = 0; } else { track.style.transform = ''; side.style.height = ''; }
    }
    dist = Math.max(0, track.offsetWidth - view.clientWidth);
    if (pinned) { side.style.height = Math.round(stick.offsetHeight + dist / RATIO) + 'px'; }
  }
  function progress() {
    if (pinned) {
      var total = side.offsetHeight - stick.offsetHeight;
      return total > 0 ? clamp((topBar.offsetHeight - side.getBoundingClientRect().top) / total, 0, 1) : 0;
    }
    return dist ? clamp(view.scrollLeft / dist, 0, 1) : 0;
  }
  var lastP = -1;
  function paintSide() {
    if (story.hidden) { return; }
    var p = progress();
    if (pinned) { track.style.transform = 'translate3d(' + (-p * dist).toFixed(1) + 'px,0,0)'; }
    bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    // the walkers stand on the tip of the red line and walk with it
    walk.style.transform = 'translate3d(' + (p * (stick.clientWidth - walk.offsetWidth)).toFixed(1) + 'px,0,0)';
    prev.disabled = p <= .001; next.disabled = p >= .999;
    if (!reduce) {
      var vw = view.clientWidth;
      hmovers.forEach(function (el) {
        var r = el.parentNode.getBoundingClientRect();
        if (r.right < -300 || r.left > vw + 300) { return; }
        el.style.setProperty('--px', ((r.left + r.width / 2 - vw / 2) * parseFloat(el.getAttribute('data-hspeed'))).toFixed(1) + 'px');
      });
      if (lastP >= 0 && Math.abs(p - lastP) > .0002) {
        side.classList.add('walking');
        clearTimeout(walkT);
        walkT = setTimeout(function () { side.classList.remove('walking'); }, 200);
      }
    }
    lastP = p;
  }
  function nudge(dir) {
    var step = view.clientWidth * .85 * dir;
    if (pinned) { window.scrollBy({ top: step / RATIO, behavior: reduce ? 'auto' : 'smooth' }); }
    else { view.scrollBy({ left: step, behavior: reduce ? 'auto' : 'smooth' }); }
  }
  prev.addEventListener('click', function () { stopPlay(); nudge(-1); });
  next.addEventListener('click', function () { stopPlay(); nudge(1); });
  view.addEventListener('scroll', paintSide, { passive: true });
  view.addEventListener('keydown', function (e) {
    if (!pinned) { return; }
    if (e.key === 'ArrowRight') { nudge(.4); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { nudge(-.4); e.preventDefault(); }
  });
  // sideways gestures (trackpad, finger) also move the ribbon while it is pinned
  view.addEventListener('wheel', function (e) {
    if (pinned && Math.abs(e.deltaX) > Math.abs(e.deltaY)) { window.scrollBy({ top: e.deltaX / RATIO, behavior: 'instant' }); e.preventDefault(); }
  }, { passive: false });
  var tx = 0, ty = 0, sideways = null;
  view.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; sideways = null; }, { passive: true });
  view.addEventListener('touchmove', function (e) {
    if (!pinned) { return; }
    var x = e.touches[0].clientX, y = e.touches[0].clientY;
    if (sideways === null && (Math.abs(x - tx) > 6 || Math.abs(y - ty) > 6)) { sideways = Math.abs(x - tx) > Math.abs(y - ty); }
    if (sideways) { window.scrollBy({ top: (tx - x) / RATIO * 1.6, behavior: 'instant' }); tx = x; ty = y; }
  }, { passive: true });

  /* ---------- the story walks itself: after IDLE ms with no input it scrolls on slowly, from wherever
     the reader is; any input takes over and restarts the wait ---------- */
  var playing = 0, idleT = 0, IDLE = 5000, SPEED = .1;  // SPEED: px of page scroll per ms (x RATIO sideways)
  function stopPlay() {
    if (playing) { cancelAnimationFrame(playing); playing = 0; }
  }
  function armAuto() {
    clearTimeout(idleT);
    if (!story.hidden && !reduce) { idleT = setTimeout(autoWalk, IDLE); }
  }
  function autoWalk() {
    if (story.hidden) { return; }
    var t0 = 0, step;
    if (pinned) {
      var start = side.getBoundingClientRect().top + window.pageYOffset - topBar.offsetHeight;
      var end = start + side.offsetHeight - stick.offsetHeight;
      var y0 = Math.max(window.pageYOffset, start);
      if (y0 >= end - 1) { return; }
      step = function (t) {
        if (!t0) { t0 = t; }
        var y = Math.min(end, y0 + (t - t0) * SPEED);
        // 'instant', or the page's smooth scroll-behavior restarts an animation every frame and stalls
        window.scrollTo({ top: y, behavior: 'instant' });
        playing = y < end ? requestAnimationFrame(step) : 0;
      };
    } else {
      var x0 = view.scrollLeft;
      if (x0 >= dist - 1) { return; }
      step = function (t) {
        if (!t0) { t0 = t; }
        var x = Math.min(dist, x0 + (t - t0) * SPEED * RATIO);
        view.scrollLeft = x;
        playing = x < dist ? requestAnimationFrame(step) : 0;
      };
    }
    playing = requestAnimationFrame(step);
  }
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (t) {
    window.addEventListener(t, function () { stopPlay(); armAuto(); }, true);
  });
  // the play button opens the story page; the walk starts once the reader has been still for a moment
  document.getElementById('play').addEventListener('click', function () {
    go('story', true);
    if (!reduce) { side.classList.add('is-opening'); setTimeout(function () { side.classList.remove('is-opening'); }, 900); }
  });

  /* ---------- mobile menu ---------- */
  var burger = document.getElementById('burger');
  function menu(open) {
    root.classList.toggle('nav-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  burger.addEventListener('click', function () { menu(!root.classList.contains('nav-open')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('nav-open')) { menu(false); burger.focus(); } });

  /* ---------- views ---------- */
  function setHash(name) {
    try { history.replaceState(null, '', '#' + name); } catch (e) { /* sandboxed: the view still changes */ }
  }
  function show(name) {
    var isCase = Object.prototype.hasOwnProperty.call(cases, name);
    home.hidden = isCase;
    Object.keys(cases).forEach(function (k) { cases[k].hidden = k !== name; });
    stopPlay();
    if (name === 'story') { measure(); }
    armAuto();
    requestAnimationFrame(move);
    return isCase;
  }
  function go(name, instant) {
    if (name === 'idea') { name = 'story'; }
    // #how is the last scene of the story: open it where it has walked into view
    if (name === 'how') {
      show('story');
      window.scrollTo({ top: pinned ? side.offsetHeight - stick.offsetHeight : 0, behavior: 'instant' });
      if (!pinned) { view.scrollLeft = dist; }
      setHash('how');
      return;
    }
    if (show(name)) { window.scrollTo({ top: 0, behavior: 'instant' }); setHash(name); return; }
    var target = name === 'home' ? document.getElementById('top') : document.getElementById(name);
    if (!target) { return; }
    target.scrollIntoView({ behavior: instant || reduce ? 'auto' : 'smooth', block: 'start' });
    setHash(name === 'home' ? 'top' : name);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('[data-go]') : null;
    if (!a) { return; }
    e.preventDefault();
    stopPlay();
    menu(false);
    var name = a.getAttribute('data-go');
    // Contact lives outside the home view, so it works from a case page without leaving it.
    if (name === 'contact') { document.getElementById('contact').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); return; }
    if (!cases[name] && home.hidden) { show('home'); go(name, true); return; }
    go(name);
  });
  function fromHash() {
    var h = (location.hash || '').replace('#', '');
    if (h) { go(h === 'top' ? 'home' : h, true); }
  }
  window.addEventListener('hashchange', fromHash);

  /* ---------- the nav marks where you are; the contact button keeps out of the way ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-spy]'));
  var contactSec = document.getElementById('contact');
  var workSec = document.getElementById('work');
  var fab = document.querySelector('.fab');
  function spy() {
    var vh = window.innerHeight, here = '';
    var open = Object.keys(cases).filter(function (k) { return !cases[k].hidden; })[0];
    if (open) { here = open === 'story' ? '' : open === 'services' || open === 'about' ? open : 'work'; }
    else {
      var w = workSec.getBoundingClientRect();
      if (w.top < vh * .5 && w.bottom > vh * .5) { here = 'work'; }
    }
    var contactOn = contactSec.getBoundingClientRect().top < vh * .6;
    if (contactOn) { here = 'contact'; }
    navLinks.forEach(function (a) {
      if (a.getAttribute('data-spy') === here) { a.setAttribute('aria-current', 'true'); } else { a.removeAttribute('aria-current'); }
    });
    // it steps aside while the story is pinned (the walkers and its controls own that corner)
    // and once the real contact section is on screen; the header's Contact button stays either way.
    // It also clears the yellow "Next" block that ends each inner page, whose button sits in the same corner.
    var s = side.getBoundingClientRect();
    var onStory = !story.hidden && pinned && s.top <= topBar.offsetHeight + 1 && s.bottom >= vh - 1;
    var onNext = false;
    if (open) {
      var n = cases[open].querySelector('.next').getBoundingClientRect();
      onNext = n.top < vh && n.bottom > vh - 120;
    }
    fab.classList.toggle('is-away', contactOn || onStory || onNext);
  }

  /* ---------- motion down the page ---------- */
  var movers = Array.prototype.slice.call(document.querySelectorAll('[data-speed]'));
  var ticking = false;
  function move() {
    ticking = false;
    paintSide();
    spy();
    if (reduce) { return; }
    var vh = window.innerHeight;
    movers.forEach(function (el) {
      var host = el.parentNode;
      if (!host.offsetParent) { return; }
      var r = host.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) { return; }
      var d = r.top + r.height / 2 - vh / 2;
      el.style.setProperty('--py', (d * parseFloat(el.getAttribute('data-speed'))).toFixed(1) + 'px');
    });
  }
  function queue() { if (!ticking) { ticking = true; requestAnimationFrame(move); } }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', function () { measure(); queue(); });

  /* the hero collage leans towards the pointer */
  each('[data-mouse]', function (cg) {
    if (reduce) { return; }
    var deep = Array.prototype.slice.call(cg.querySelectorAll('[data-depth]'));
    var sec = cg.closest('.sec') || cg;
    sec.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') { return; }
      var r = sec.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
      deep.forEach(function (el) {
        var k = parseFloat(el.getAttribute('data-depth'));
        el.style.setProperty('--mx', (nx * k).toFixed(1) + 'px');
        el.style.setProperty('--my', (ny * k).toFixed(1) + 'px');
      });
    });
  });

  /* each work row's peek follows the pointer and leans the way it moves */
  each('.cl__row', function (row) {
    var pv = row.querySelector('.cl__pv');
    var lastX = null;
    row.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') { return; }
      var r = row.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      pv.style.setProperty('--px', x.toFixed(0) + 'px');
      pv.style.setProperty('--py', y.toFixed(0) + 'px');
      if (lastX !== null && !reduce) { pv.style.setProperty('--pr', clamp((x - lastX) * .6 - 4, -14, 10).toFixed(1) + 'deg'); }
      lastX = x;
    });
    row.addEventListener('pointerleave', function () { lastX = null; pv.style.setProperty('--pr', '-4deg'); });
  });

  /* strikes draw and labels pop when their section comes into view */
  root.classList.add('js');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: .18 });
    each('[data-in]', function (el) { io.observe(el); });
  } else {
    each('[data-in]', function (el) { el.classList.add('in'); });
  }

  /* the five-minute shower counts down */
  if (!reduce) {
    var left = 300;
    setInterval(function () {
      left = left <= -2 ? 300 : left - 1;
      var s = Math.max(0, left), text = Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
      each('[data-timer]', function (el) { el.textContent = text; });
    }, 1000);
  }

  measure();
  fromHash();
  move();
  window.addEventListener('load', function () { measure(); if (home.hidden && location.hash !== '#how') { window.scrollTo({ top: 0, behavior: 'instant' }); } move(); });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { measure(); move(); }); }

  /* ---------- audience tabs ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function pick(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) { tab.focus(); }
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { pick(t); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { pick(tabs[(i + 1) % tabs.length], true); }
      if (e.key === 'ArrowLeft') { pick(tabs[(i - 1 + tabs.length) % tabs.length], true); }
    });
  });

  /* ---------- shower calculator: 10 litres a minute, from the proposal's own figures ---------- */
  var range = document.getElementById('shower-min');
  var out = document.getElementById('shower-out');
  var note = document.getElementById('shower-note');
  function shower() {
    var m = Number(range.value), l = m * 10;
    out.textContent = m + ' min = ' + l + ' L';
    note.textContent = m <= 5 ? 'The best five minutes of your life.' : (l - 50) + ' litres more than a five-minute shower.';
  }
  range.addEventListener('input', shower);
  shower();

  /* ---------- the brief form: sent in the background, with a mail fallback ---------- */
  var form = document.getElementById('brief');
  var fstate = document.getElementById('form-state');
  form.addEventListener('submit', function (e) {
    if (!window.fetch || !window.FormData) { return; }  // old browsers post the form normally
    e.preventDefault();
    var data = new FormData(form);
    form.classList.add('is-sending');
    fstate.className = 'lbl form__state';
    fstate.textContent = 'Sending…';
    function fallback() {
      var body = data.get('message') + '\n\n' + data.get('name') + ' <' + data.get('email') + '>';
      fstate.className = 'lbl form__state is-err';
      fstate.innerHTML = 'That didn’t go through. <a href="mailto:info@gaffe.pt?subject=' + encodeURIComponent('New brief') + '&body=' + encodeURIComponent(body) + '">Send it by email instead</a>.';
    }
    fetch(form.getAttribute('data-endpoint'), { method: 'POST', headers: { Accept: 'application/json' }, body: data })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r); })
      .then(function (res) {
        if (res && (res.success === true || res.success === 'true')) {
          form.reset();
          fstate.className = 'lbl form__state is-ok';
          fstate.textContent = 'Got it. Talk soon!';
        } else { fallback(); }
      }, fallback)
      .then(function () { form.classList.remove('is-sending'); });
  });

  /* ---------- copy the email address ---------- */
  var state = document.getElementById('copy-state');
  document.getElementById('copy-mail').addEventListener('click', function () {
    var text = document.getElementById('mail').textContent;
    function done() { state.textContent = 'Copied'; setTimeout(function () { state.textContent = ''; }, 2400); }
    function fallback() {
      var r = document.createRange(); r.selectNodeContents(document.getElementById('mail'));
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      state.textContent = 'Selected. Press copy.';
    }
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, fallback); } else { fallback(); }
  });
})();
