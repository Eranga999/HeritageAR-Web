/* HeritageAR - main.js
   All behaviour for the single-page site. Content comes from window.SITE_DATA
   (data/site-data.js). Text is always inserted with textContent / text nodes. */
(function () {
  'use strict';

  var D = window.SITE_DATA || {};
  var NS = 'http://www.w3.org/2000/svg';
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  // Attachment limits. FormSubmit accepts at most 10 MB of files per message.
  var MAX_FILES = 5, MAX_BYTES = 10 * 1024 * 1024;
  var FILE_TYPES = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv', 'zip', 'png', 'jpg', 'jpeg', 'gif', 'webp'];
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function isMissing(v) {
    if (v === null || v === undefined) return true;
    var s = String(v).trim();
    return s === '' || /^placeholder/i.test(s);
  }
  function safeUrl(u) {
    if (isMissing(u)) return '';
    u = String(u).trim();
    return /^(javascript|data|vbscript):/i.test(u) ? '' : u;
  }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  // Element builder. Children may be nodes or strings (strings become text nodes).
  function el(tag, props, kids) {
    var n = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') n.className = v;
        else if (k === 'text') n.textContent = v;
        else n.setAttribute(k, v === true ? '' : v);
      });
    }
    arr(kids).forEach(function (c) { if (c !== null && c !== undefined && c !== false) n.append(c); });
    return n;
  }
  function icon(name, cls) {
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('class', 'icon' + (cls ? ' ' + cls : ''));
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('focusable', 'false');
    var u = document.createElementNS(NS, 'use');
    u.setAttribute('href', '#i-' + name);
    s.appendChild(u);
    return s;
  }
  function tba(text) { return el('span', { class: 'tba', text: text || 'To be added' }); }
  function textOr(v, fallback) { return isMissing(v) ? tba(fallback) : String(v); }
  function scrollBehavior() { return reduceMotion.matches ? 'auto' : 'smooth'; }

  /* ---------- toast + clipboard ---------- */
  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = '';
    clearTimeout(toastTimer);
    requestAnimationFrame(function () {
      t.textContent = msg;
      t.classList.add('is-visible');
      toastTimer = setTimeout(function () { t.classList.remove('is-visible'); }, 2600);
    });
  }
  function legacyCopy(text) {
    var active = document.activeElement;
    var ta = el('textarea', { readonly: true, style: 'position:fixed;top:0;left:0;opacity:0' });
    ta.value = text;
    document.body.append(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    if (active && active.focus) active.focus();
    return ok;
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }
  function initCopyButtons() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-copy]');
      if (!b) return;
      copyText(b.getAttribute('data-copy')).then(function (ok) { toast(ok ? 'Copied' : 'Copy failed. Please copy it manually.'); });
    });
  }

  /* ---------- navbar: scrolled state + mobile menu ---------- */
  function initNav() {
    var nav = $('#nav'), toggle = $('#nav-toggle'), menu = $('#nav-menu');
    if (!nav) return;
    var onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 24); };
    requestAnimationFrame(onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    if (!toggle || !menu) return;

    var isOpen = function () { return nav.classList.contains('is-open'); };
    var focusables = function () { return [toggle].concat($$('a[href], button:not([disabled])', menu)); };
    function setOpen(open, returnFocus) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      $('use', toggle).setAttribute('href', open ? '#i-close' : '#i-menu');
      if (open) { var f = focusables()[1]; if (f) f.focus(); }
      else if (returnFocus) toggle.focus();
    }
    toggle.addEventListener('click', function () { setOpen(!isOpen()); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a') && isOpen()) setOpen(false); });
    document.addEventListener('click', function (e) { if (isOpen() && !nav.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (!isOpen()) return;
      if (e.key === 'Escape') { setOpen(false, true); return; }
      if (e.key !== 'Tab') return;
      var list = focusables(), first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    var mq = window.matchMedia('(min-width: 900px)');
    var onMq = function () { if (mq.matches && isOpen()) setOpen(false); };
    if (mq.addEventListener) mq.addEventListener('change', onMq); else mq.addListener(onMq);
  }

  /* ---------- scroll-spy (main nav + domain tabs) ---------- */
  function spy(ids, rootMargin, onActive) {
    var els = ids.map(function (id) { return document.getElementById(id); }).filter(Boolean);
    if (!els.length || !hasIO) return;
    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      for (var i = 0; i < els.length; i++) {
        if (visible[els[i].id]) { onActive(els[i].id); return; }
      }
    }, { rootMargin: rootMargin, threshold: 0 });
    els.forEach(function (e) { io.observe(e); });
  }
  function initScrollSpy() {
    var links = $$('[data-spy]');
    var ids = links.map(function (a) { return a.getAttribute('data-spy'); });
    // "How we work together" belongs to About Us, so it keeps that link active.
    var alias = { 'how-we-work': 'about' };
    if (ids.indexOf('about') !== -1) ids.splice(ids.indexOf('about') + 1, 0, 'how-we-work');
    spy(ids, '-42% 0px -56% 0px', function (id) {
      id = alias[id] || id;
      links.forEach(function (a) {
        var on = a.getAttribute('data-spy') === id;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
    });
  }
  function initSubnav() {
    var track = $('#subnav-track');
    if (!track) return;
    var links = $$('[data-sub]', track);
    var fades = function () {
      track.classList.toggle('fade-l', track.scrollLeft > 4);
      track.classList.toggle('fade-r', track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
    };
    track.addEventListener('scroll', fades, { passive: true });
    window.addEventListener('resize', fades);
    window.addEventListener('load', fades);
    spy(links.map(function (a) { return a.getAttribute('data-sub'); }), '-160px 0px -62% 0px', function (id) {
      links.forEach(function (a) {
        var on = a.getAttribute('data-sub') === id;
        a.classList.toggle('is-active', on);
        if (on) {
          a.setAttribute('aria-current', 'true');
          if (track.scrollWidth > track.clientWidth) {
            track.scrollTo({ left: a.offsetLeft - (track.clientWidth - a.offsetWidth) / 2, behavior: scrollBehavior() });
          }
        } else a.removeAttribute('aria-current');
      });
    });
  }

  /* ---------- reveal on scroll ---------- */
  function finishReveal(n) {
    n.removeAttribute('data-reveal');
    n.classList.remove('is-in');
    n.style.transitionDelay = '';
  }
  function initReveal() {
    var items = $$('[data-reveal]');
    if (reduceMotion.matches || !hasIO) { items.forEach(finishReveal); return; }
    var io = new IntersectionObserver(function (entries) {
      var batch = new Map();
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var n = en.target, p = n.parentElement, i = batch.get(p) || 0;
        batch.set(p, i + 1);
        io.unobserve(n);
        var delay = Math.min(i, 6) * 80;
        n.style.transitionDelay = delay + 'ms';
        n.classList.add('is-in');
        setTimeout(function () { finishReveal(n); }, 650 + delay);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    items.forEach(function (n) { io.observe(n); });
  }

  /* ---------- count-up for stat numbers ---------- */
  function initCountUp() {
    var nodes = $$('[data-count]');
    if (reduceMotion.matches || !hasIO) return;
    function parts(v) { return /^(\D*?)(\d+(?:\.\d+)?)(.*)$/.exec(v); }
    function run(node) {
      var final = node.getAttribute('data-count'), m = parts(final);
      if (!m || parseFloat(m[2]) === 0) { node.textContent = final; return; }
      var target = parseFloat(m[2]), dec = (m[2].split('.')[1] || '').length, t0 = performance.now();
      (function step(now) {
        var p = Math.min((now - t0) / 1200, 1), e = 1 - Math.pow(1 - p, 3);
        node.textContent = p < 1 ? m[1] + (target * e).toFixed(dec) + m[3] : final;
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); run(en.target); } });
    }, { threshold: 0.6 });
    nodes.forEach(function (n) {
      var m = parts(n.getAttribute('data-count'));
      if (m) n.textContent = m[1] + (0).toFixed((m[2].split('.')[1] || '').length) + m[3];
      io.observe(n);
    });
  }

  /* ---------- home: stats, features, image slots ---------- */
  function renderStats() {
    var wrap = $('#stats');
    if (!wrap) return;
    arr(D.stats).forEach(function (s) {
      var v = String(s.value === null || s.value === undefined ? '' : s.value);
      wrap.append(el('div', { class: 'stat', 'data-reveal': true }, [
        el('p', { class: 'stat-value' }, [
          el('span', { 'aria-hidden': 'true', 'data-count': v, text: v }),
          el('span', { class: 'sr-only', text: v })
        ]),
        el('p', { class: 'stat-caption', text: s.caption || '' })
      ]));
    });
  }
  function renderFeatures() {
    var wrap = $('#features');
    if (!wrap) return;
    arr(D.features).forEach(function (f) {
      wrap.append(el('article', { class: 'card card--hover feature', 'data-reveal': true }, [
        el('span', { class: 'icon-badge' }, [icon(f.icon || 'scan-frame')]),
        el('h3', { text: f.title || '' }),
        el('p', { text: f.text || '' }),
        el('a', { class: 'text-link', href: '#domain' }, ['Learn more', el('span', { class: 'sr-only', text: ' about ' + (f.title || 'this capability') }), icon('arrow-right')])
      ]));
    });
  }
  function initImageSlots() {
    var imgs = D.images || {};
    $$('[data-img-slot]').forEach(function (slot) {
      var src = safeUrl(imgs[slot.getAttribute('data-img-slot')]);
      if (!src) return;
      var img = el('img', {
        src: src, alt: slot.getAttribute('data-alt') || '',
        width: slot.getAttribute('data-w'), height: slot.getAttribute('data-h'),
        loading: slot.hasAttribute('data-eager') ? 'eager' : 'lazy', decoding: 'async'
      });
      img.addEventListener('load', function () {
        img.classList.add('is-loaded');
        slot.classList.add('has-img');
        var svg = $('svg', slot);
        if (svg) svg.setAttribute('aria-hidden', 'true');
        // The hero caption says the screens are illustrative; drop it once all are real.
        var cap = $('#hp-caption');
        if (cap && $$('.hp-screen').every(function (s) { return s.classList.contains('has-img'); })) cap.remove();
      });
      img.addEventListener('error', function () { img.remove(); });
      slot.append(img);
    });
  }

  /* ---------- domain: technologies + accordion ---------- */
  function renderTech() {
    var wrap = $('#tech-groups'), filters = $('#tech-filters');
    if (!wrap) return;
    var groups = arr(D.domain && D.domain.technologies).filter(function (g) { return arr(g.items).length; });
    var groupEls = groups.map(function (g) {
      return el('div', { class: 'tech-group', id: 'tech-' + slug(g.group), 'data-group': g.group }, [
        el('h4', { class: 'tech-label', text: g.group }),
        el('ul', { class: 'tech-grid', role: 'list' }, g.items.map(function (t) {
          var mono = isMissing(t.mono) ? String(t.name || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 2) : t.mono;
          var badge = isMissing(t.icon) ? el('span', { class: 'tech-mono', 'aria-hidden': 'true', text: mono })
            : el('span', { class: 'tech-mono', 'aria-hidden': 'true' }, [icon(t.icon)]);
          return el('li', { class: 'card tech-tile', 'data-reveal': true }, [
            badge,
            el('span', null, [el('span', { class: 'tech-name', text: t.name || '' }), el('span', { class: 'tech-role', text: t.role || '' })])
          ]);
        }))
      ]);
    });
    groupEls.forEach(function (g) { wrap.append(g); });
    if (!filters || !groups.length) return;
    ['All'].concat(groups.map(function (g) { return g.group; })).forEach(function (name, i) {
      filters.append(el('button', { type: 'button', class: 'filter-pill', 'data-filter': name, 'aria-pressed': String(i === 0), 'aria-controls': 'tech-groups', text: name }));
    });
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('[data-filter]');
      if (!b) return;
      var f = b.getAttribute('data-filter');
      $$('[data-filter]', filters).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      groupEls.forEach(function (g) {
        var show = f === 'All' || g.getAttribute('data-group') === f;
        g.hidden = !show;
        g.classList.remove('is-entering');
        if (show) { void g.offsetWidth; g.classList.add('is-entering'); }
      });
    });
  }
  function initAccordion() {
    // Panels are open in the HTML so the content is readable without JS; collapse all but the first.
    $$('.acc-btn').forEach(function (btn, i) {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      var set = function (open) { btn.setAttribute('aria-expanded', String(open)); if (panel) panel.hidden = !open; };
      set(i === 0);
      btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
    });
  }

  /* ---------- milestones ---------- */
  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d.getTime()) ? null : d;
  }
  function fmtDate(d) { return d ? d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() : 'Date TBA'; }
  function isoDate(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function hasMarks(m) { return typeof m.marks === 'number' && isFinite(m.marks); }
  function marksText(n) { return n + (n === 1 ? ' mark' : ' marks'); }
  function statusOf(d, today) {
    if (!d) return { key: 'tba', label: 'Date TBA', chip: 'chip--soon' };
    var days = Math.round((d - today) / 864e5);
    if (days < 0) return { key: 'completed', label: 'Completed', chip: 'chip--completed', days: days };
    if (days <= 30) return { key: 'upcoming', label: 'Upcoming', chip: 'chip--upcoming', days: days };
    return { key: 'pending', label: 'Pending', chip: 'chip--pending', days: days };
  }
  function allDocs() {
    var docs = D.documents || {};
    return arr(docs.documents).concat(arr(docs.presentations));
  }
  function docLink(docId) {
    if (isMissing(docId)) return null;
    var doc = allDocs().filter(function (x) { return x.id === docId; })[0];
    if (!doc) return null;
    var url = safeUrl(doc.url);
    var label = ['View document', el('span', { class: 'sr-only', text: ': ' + doc.title }), icon(url ? 'arrow-ne' : 'arrow-right')];
    return url
      ? el('a', { class: 'text-link', href: url, target: '_blank', rel: 'noopener noreferrer' }, label)
      : el('a', { class: 'text-link', href: '#doc-' + doc.id }, label);
  }
  function renderMilestones() {
    var summary = $('#ms-summary'), timeline = $('#ms-timeline'), tableWrap = $('#ms-table-wrap');
    if (!timeline) return;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var list = arr(D.milestones).map(function (m) {
      var d = parseDate(m.date);
      return { m: m, d: d, s: statusOf(d, today) };
    });

    var withMarks = list.filter(function (x) { return hasMarks(x.m); });
    var totalMarks = withMarks.reduce(function (a, x) { return a + x.m.marks; }, 0);
    var passedMarks = withMarks.filter(function (x) { return x.s.key === 'completed'; }).reduce(function (a, x) { return a + x.m.marks; }, 0);
    var completed = list.filter(function (x) { return x.s.key === 'completed'; }).length;
    var future = list.filter(function (x) { return x.d && x.s.days >= 0; }).sort(function (a, b) { return a.d - b.d; });
    var next = future[0];

    if (summary) {
      var card = function (label, value, caption, isText) {
        return el('div', { class: 'stat', 'data-reveal': true }, [
          el('p', { class: 'stat-label', text: label }),
          el('p', { class: 'stat-value' + (isText ? ' stat-value--text' : ''), text: value }),
          el('p', { class: 'stat-caption', text: caption })
        ]);
      };
      var missingMarks = list.length - withMarks.length;
      var nextCaption = 'No upcoming dates yet';
      var nextValue = 'TBA';
      if (next) {
        nextValue = next.s.days === 0 ? 'Today' : next.s.days === 1 ? '1 day' : next.s.days + ' days';
        nextCaption = (next.s.days > 0 ? 'left until ' : '') + next.m.title + ', ' + fmtDate(next.d);
      }
      summary.append(
        card('Total assessments', String(list.length), 'Across the research project'),
        card('Total marks', withMarks.length ? String(totalMarks) : 'TBA', missingMarks ? missingMarks + ' of ' + list.length + ' still to be added' : 'Allocated across all assessments'),
        card('Completed', String(completed), completed === 1 ? 'Assessment with a past deadline' : 'Assessments with a past deadline'),
        card('Next milestone', nextValue, nextCaption, !next)
      );
    }

    var pct = totalMarks ? Math.round((passedMarks / totalMarks) * 100) : 0;
    var bar = $('#ms-progress'), ptext = $('#ms-progress-text');
    if (bar) {
      bar.setAttribute('aria-valuenow', String(pct));
      bar.setAttribute('aria-valuetext', totalMarks ? pct + '% (' + passedMarks + ' of ' + totalMarks + ' marks)' : 'Marks to be added');
      var fill = $('.progress-fill', bar);
      requestAnimationFrame(function () { fill.style.width = pct + '%'; });
    }
    if (ptext) ptext.textContent = totalMarks ? passedMarks + ' of ' + totalMarks + ' marks (' + pct + '%)' : 'Marks to be added';

    list.forEach(function (x) {
      var m = x.m;
      timeline.append(el('li', { class: 'tl-item is-' + x.s.key, 'data-reveal': true }, [
        el('span', { class: 'tl-node', 'aria-hidden': 'true' }),
        el('article', { class: 'card card--hover ms-card' }, [
          el('div', { class: 'ms-meta' }, [
            x.d ? el('time', { class: 'ms-date', datetime: isoDate(x.d), text: fmtDate(x.d) }) : null,
            el('span', { class: 'chip chip--dot ' + x.s.chip, text: x.s.label })
          ]),
          el('h4', { text: m.title || '' }),
          m.description ? el('p', { text: m.description }) : null,
          el('div', { class: 'ms-foot' }, [
            el('span', { class: 'marks' + (hasMarks(m) ? '' : ' marks--tba'), text: hasMarks(m) ? marksText(m.marks) : 'Marks TBA' }),
            docLink(m.docId)
          ])
        ])
      ]));
    });

    if (tableWrap) {
      var rows = list.map(function (x, i) {
        return el('tr', null, [
          el('td', { class: 'num', 'data-label': '#', text: String(i + 1) }),
          el('th', { scope: 'row', text: x.m.title || '' }),
          el('td', { 'data-label': 'Date' }, [el('span', { text: fmtDate(x.d) })]),
          el('td', { 'data-label': 'Marks' }, [el('span', { text: hasMarks(x.m) ? String(x.m.marks) : 'TBA' })]),
          el('td', { 'data-label': 'Status' }, [el('span', { class: 'chip chip--dot ' + x.s.chip, text: x.s.label })])
        ]);
      });
      tableWrap.append(el('table', { class: 'rtable ms-table' }, [
        el('caption', { class: 'sr-only', text: 'Assessments with dates, allocated marks and status' }),
        el('thead', null, [el('tr', null, ['#', 'Assessment', 'Date', 'Marks', 'Status'].map(function (h) { return el('th', { scope: 'col', text: h }); }))]),
        el('tbody', null, rows),
        el('tfoot', null, [el('tr', null, [
          el('th', { scope: 'row', colspan: '3', text: 'Total' }),
          el('td', { 'data-label': 'Marks' }, [el('span', { text: withMarks.length ? String(totalMarks) : 'TBA' })]),
          el('td')
        ])])
      ]));
    }

    var btns = $$('[data-view]');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-view');
        btns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        timeline.hidden = v !== 'timeline';
        if (tableWrap) tableWrap.hidden = v !== 'table';
      });
    });
  }

  /* ---------- documents ---------- */
  function isLocalUrl(u) { return !/^[a-z][a-z0-9+.-]*:/i.test(u) && u.indexOf('//') !== 0; }
  function docCard(item, iconName) {
    var url = safeUrl(item.url);
    var title = item.title || 'Untitled';
    var actions = el('div', { class: 'doc-actions' });
    if (url) {
      actions.append(el('a', { class: 'btn btn-primary btn-sm', href: url, target: '_blank', rel: 'noopener noreferrer' },
        ['Open', el('span', { class: 'sr-only', text: ' ' + title + ' (opens in a new tab)' }), icon('arrow-ne')]));
      if (isLocalUrl(url)) {
        actions.append(el('a', { class: 'doc-download', href: url, download: '' },
          [icon('download'), 'Download', el('span', { class: 'sr-only', text: ' ' + title })]));
      }
    } else {
      actions.append(el('button', { type: 'button', class: 'btn btn-sm', 'aria-disabled': 'true', text: 'Coming soon' }));
    }
    return el('article', { class: 'card doc-card', id: 'doc-' + item.id, 'data-search': (title + ' ' + (item.description || '') + ' ' + (item.type || '')).toLowerCase() }, [
      el('div', { class: 'doc-inner' }, [
        el('span', { class: 'icon-badge icon-badge--lg' }, [icon(iconName)]),
        el('div', { class: 'doc-body' }, [
          el('h4', { text: title }),
          item.description ? el('p', { text: item.description }) : null,
          el('div', { class: 'chips' }, [
            el('span', { class: 'chip', text: item.type || 'File' }),
            url ? null : el('span', { class: 'chip chip--soon chip--dot', text: 'Upload pending' })
          ])
        ]),
        actions
      ])
    ]);
  }
  function renderDocuments() {
    var wrap = $('#doc-groups');
    if (!wrap) return;
    var docs = D.documents || {};
    var groups = [
      { key: 'documents', title: 'Documents', icon: 'file-text', items: arr(docs.documents) },
      { key: 'presentations', title: 'Presentations', icon: 'presentation', items: arr(docs.presentations) }
    ].filter(function (g) { return g.items.length; });
    var countText = function (n) { return n + (n === 1 ? ' item' : ' items'); };
    var sections = groups.map(function (g) {
      var count = el('span', { class: 'chip', text: countText(g.items.length) });
      var sec = el('div', { class: 'doc-group', id: 'doc-group-' + g.key }, [
        el('div', { class: 'doc-group-head' }, [el('span', { class: 'icon-badge' }, [icon(g.icon)]), el('h3', { text: g.title }), count]),
        el('div', { class: 'doc-grid' }, g.items.map(function (it) {
          var c = docCard(it, g.icon);
          c.setAttribute('data-reveal', '');
          return c;
        }))
      ]);
      sec._count = count;
      wrap.append(sec);
      return sec;
    });

    var input = $('#doc-search'), empty = $('#doc-empty'), status = $('#doc-status');
    if (!input) return;
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase(), total = 0;
      sections.forEach(function (sec) {
        var n = 0;
        $$('.doc-card', sec).forEach(function (c) {
          var show = !q || c.getAttribute('data-search').indexOf(q) !== -1;
          c.hidden = !show;
          if (show) n++;
        });
        sec.hidden = n === 0;
        sec._count.textContent = countText(n);
        total += n;
      });
      if (empty) empty.hidden = total > 0;
      if (status) status.textContent = q ? (total ? total + (total === 1 ? ' match' : ' matches') : 'No matches') : '';
    });
  }

  /* ---------- people ---------- */
  function initials(p) {
    if (!isMissing(p.initials)) return String(p.initials).slice(0, 3);
    var t = String(p.name || '').split(/[\s.]+/).filter(Boolean);
    if (!t.length) return '';
    var longest = t.reduce(function (a, b) { return b.length > a.length ? b : a; });
    var second = longest !== t[0] ? longest[0] : (t[1] || '')[0] || '';
    return (t[0][0] + second).toUpperCase();
  }
  function photo(p, cls) {
    var box = el('div', { class: 'photo ' + cls });
    box.append(isMissing(p.name) ? icon('user') : el('span', { 'aria-hidden': 'true', text: initials(p) }));
    var src = safeUrl(p.photo);
    if (src) {
      var img = el('img', { src: src, alt: isMissing(p.name) ? '' : 'Photo of ' + p.name, width: '480', height: '480', loading: 'lazy', decoding: 'async' });
      img.addEventListener('load', function () { img.classList.add('is-loaded'); });
      img.addEventListener('error', function () { img.remove(); });
      box.append(img);
    }
    return box;
  }
  function emailRow(email, name) {
    if (isMissing(email)) return el('p', { class: 'email-row' }, [el('span', { class: 'tba' }, [icon('mail'), 'Email to be added'])]);
    return el('p', { class: 'email-row' }, [
      el('a', { class: 'email-link', href: 'mailto:' + email }, [icon('mail'), el('span', { text: email })]),
      el('button', { type: 'button', class: 'icon-btn', 'data-copy': email, 'aria-label': 'Copy email address' + (isMissing(name) ? '' : ' of ' + name), title: 'Copy email' }, [icon('copy')])
    ]);
  }
  function socials(p) {
    var links = [['linkedin', 'LinkedIn'], ['github', 'GitHub']].filter(function (s) { return safeUrl(p[s[0]]); });
    if (!links.length) return null;
    return el('div', { class: 'socials' }, links.map(function (s) {
      return el('a', { class: 'icon-btn', href: safeUrl(p[s[0]]), target: '_blank', rel: 'noopener noreferrer', 'aria-label': s[1] + (isMissing(p.name) ? '' : ' profile of ' + p.name) }, [icon(s[0])]);
    }));
  }
  function renderPeople() {
    var people = D.people || {}, supWrap = $('#supervisors'), memWrap = $('#members');
    if (supWrap) {
      arr(people.supervisors).forEach(function (p) {
        supWrap.append(el('article', { class: 'card card--tint sup-card', 'data-reveal': true }, [
          photo(p, 'photo--sup'),
          el('div', { class: 'sup-body' }, [
            el('span', { class: 'chip chip--lime', text: p.role || 'Supervisor' }),
            el('h4', null, [textOr(p.name, 'Name to be added')]),
            el('p', { class: 'person-title' }, [textOr(p.title, 'Title to be added')]),
            isMissing(p.department) ? null : el('p', { class: 'person-dept', text: p.department }),
            emailRow(p.email, p.name),
            socials(p)
          ])
        ]));
      });
    }
    if (!memWrap) return;
    arr(people.members).forEach(function (m, i) {
      var id = 'component-' + i;
      var comp = el('p', { class: 'component', id: id }, [textOr(m.component, 'Research component to be added')]);
      var more = el('button', { type: 'button', class: 'read-more', 'aria-expanded': 'false', 'aria-controls': id, hidden: true, text: 'Read more' });
      more.addEventListener('click', function () {
        var open = comp.classList.toggle('is-expanded');
        more.setAttribute('aria-expanded', String(open));
        more.textContent = open ? 'Read less' : 'Read more';
      });
      memWrap.append(el('article', { class: 'card member-card', 'data-reveal': true }, [
        photo(m, 'photo--member'),
        el('div', { class: 'member-body' }, [
          el('h4', null, [textOr(m.name, 'Name to be added')]),
          isMissing(m.regNo) ? null : el('span', { class: 'chip', text: m.regNo }),
          el('span', { class: 'comp-label', text: 'Research component' }),
          comp, more,
          emailRow(m.email, m.name),
          socials(m)
        ])
      ]));
    });
    var check = function () {
      $$('.component', memWrap).forEach(function (c) {
        if (c.classList.contains('is-expanded')) return;
        c.nextElementSibling.hidden = c.scrollHeight <= c.clientHeight + 1;
      });
    };
    // Measure after first paint so rendering is not held up by a forced layout.
    window.addEventListener('load', check);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(check);
    var t;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(check, 150); });
  }

  /* ---------- contact ---------- */
  function teamEmails() {
    var list = arr(D.contact && D.contact.teamEmails).filter(function (e) { return !isMissing(e); });
    if (list.length) return list;
    return arr(D.people && D.people.members).map(function (m) { return m.email; }).filter(function (e) { return !isMissing(e); });
  }
  function renderContactDetails() {
    var c = D.contact || {}, emails = teamEmails();
    var sup = arr(D.people && D.people.supervisors)[0] || {};
    var teamHref = emails.length ? 'mailto:' + emails.join(',') : '';
    [$('#c-team-mail'), $('#footer-team-mail')].forEach(function (a) { if (a && teamHref) a.setAttribute('href', teamHref); });
    var addr = $('#c-address');
    if (addr && !isMissing(c.address)) addr.textContent = c.address;
    var supEl = $('#c-supervisor');
    if (supEl && !isMissing(sup.email)) {
      supEl.replaceChildren(el('a', { href: 'mailto:' + sup.email, text: sup.email }), isMissing(sup.name) ? '' : el('span', { class: 'small', text: ' (' + sup.name + ')' }));
    }
    var resp = $('#c-response');
    if (resp && !isMissing(c.responseTime)) resp.textContent = c.responseTime;
    var list = $('#c-members');
    if (list) {
      arr(D.people && D.people.members).forEach(function (m) {
        if (isMissing(m.email)) return;
        list.append(el('li', null, [
          el('span', null, [el('b', { text: m.name }), m.email]),
          el('button', { type: 'button', class: 'icon-btn', 'data-copy': m.email, 'aria-label': 'Copy email address of ' + m.name, title: 'Copy email' }, [icon('copy')])
        ]));
      });
    }
    var social = $('#footer-social');
    if (social) {
      var s = socials(D.social || {});
      if (s) social.replaceWith(s);
    }
  }

  function initContactForm() {
    var form = $('#contact-form');
    if (!form) return;
    var f = form.elements;
    // Messages and attachments are emailed by FormSubmit (formsubmit.co).
    var endpoint = safeUrl(D.contact && D.contact.formEndpoint);
    var files = [], sending = false;
    var status = $('#form-status'), sendBtn = $('#btn-send'), zone = $('#dropzone');

    function setErr(input, msg) {
      var e = $('#err-' + input.name);
      if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
      if (e) e.textContent = msg || '';
    }
    function validate() {
      var first = null;
      var name = f.yourName.value.trim(), email = f.yourEmail.value.trim();
      setErr(f.yourName, name ? '' : 'Please enter your name.');
      if (!name) first = f.yourName;
      var okEmail = EMAIL_RE.test(email) && f.yourEmail.validity.valid;
      setErr(f.yourEmail, okEmail ? '' : email ? 'Please enter a valid email address, like name@example.com.' : 'Please enter your email address.');
      if (!okEmail && !first) first = f.yourEmail;
      var hasMsg = !!f.message.value.trim();
      setErr(f.message, hasMsg ? '' : 'Please write your message.');
      if (!hasMsg && !first) first = f.message;
      var fileMsg = filesError();
      $('#err-files').textContent = fileMsg;
      if (fileMsg && !first) first = f.files;
      if (first) first.focus();
      return !first;
    }

    /* ---------- attachments ---------- */
    function fileKey(x) { return x.name + '|' + x.size + '|' + x.lastModified; }
    function fileExt(name) { var m = /\.([a-z0-9]+)$/i.exec(name); return m ? m[1].toLowerCase() : ''; }
    function fmtSize(b) { return b < 1024 * 1024 ? Math.max(1, Math.round(b / 1024)) + ' KB' : (b / 1048576).toFixed(1) + ' MB'; }
    function totalSize() { return files.reduce(function (s, x) { return s + x.size; }, 0); }
    function filesError() {
      if (files.length > MAX_FILES) return 'Please attach no more than ' + MAX_FILES + ' files.';
      if (totalSize() > MAX_BYTES) return 'Attachments add up to ' + fmtSize(totalSize()) + '. The limit is ' + fmtSize(MAX_BYTES) + ' in total.';
      return '';
    }
    function renderFiles() {
      var list = $('#file-list');
      list.replaceChildren.apply(list, files.map(function (x, i) {
        var rm = el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Remove ' + x.name, title: 'Remove' }, [icon('close')]);
        rm.addEventListener('click', function () {
          files.splice(i, 1);
          renderFiles();
          f.files.focus();
        });
        return el('li', null, [el('span', { class: 'file-name', text: x.name }), el('span', { class: 'file-size', text: fmtSize(x.size) }), rm]);
      }));
      var msg = filesError();
      $('#err-files').textContent = msg;
      if (msg) zone.setAttribute('aria-invalid', 'true'); else zone.removeAttribute('aria-invalid');
    }
    function addFiles(list) {
      var skipped = [];
      Array.prototype.forEach.call(list || [], function (x) {
        if (FILE_TYPES.indexOf(fileExt(x.name)) === -1) { skipped.push(x.name); return; }
        if (!files.some(function (y) { return fileKey(y) === fileKey(x); })) files.push(x);
      });
      renderFiles();
      if (skipped.length) toast('Not attached (file type not allowed): ' + skipped.join(', '));
    }
    /* ---------- sending ---------- */
    function showStatus(msg, ok) {
      status.textContent = msg;
      status.className = 'form-status ' + (ok ? 'is-ok' : 'is-error');
      status.hidden = false;
    }
    function setSending(on) {
      sending = on;
      sendBtn.setAttribute('aria-disabled', String(on));
      $('#btn-send-label').textContent = on ? 'Sending...' : 'Submit';
    }
    function resetForm() {
      form.reset();
      files = [];
      renderFiles();
      [f.yourName, f.yourEmail, f.message].forEach(function (x) { setErr(x, ''); });
    }
    function send() {
      if (!/^https:\/\//i.test(endpoint)) {
        showStatus('The message service has not been set up yet, so this message could not be sent. Please try again later.', false);
        return;
      }
      if (location.protocol === 'file:') {
        showStatus('Messages can only be sent from the published website, not from a file opened on this computer.', false);
        return;
      }
      var data = new FormData();
      data.append('_subject', '[' + f.topic.value + '] HeritageAR website message');
      data.append('_template', 'table');
      data.append('_captcha', 'false');
      data.append('_honey', f._honey.value);
      data.append('name', f.yourName.value.trim());
      data.append('email', f.yourEmail.value.trim()); // FormSubmit sets Reply-To from this field
      data.append('organisation', f.organisation.value.trim() || '-');
      data.append('topic', f.topic.value);
      data.append('message', f.message.value);
      files.forEach(function (x, i) { data.append('attachment' + (i + 1), x, x.name); });
      setSending(true);
      status.hidden = true;
      fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: data })
        .then(function (res) { return res.json(); })
        .then(function (r) {
          setSending(false);
          if (r && String(r.success) === 'true') {
            resetForm();
            showStatus('Thank you. Your message has been sent and the team will reply to your email address.', true);
            toast('Message sent');
          } else {
            showStatus('Sorry, the message could not be sent' + (r && r.message ? ': ' + r.message : '.'), false);
          }
        })
        .catch(function () {
          setSending(false);
          showStatus('Sorry, the message could not be sent. Check your connection and try again.', false);
        });
    }

    form.addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid')) setErr(e.target, '');
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending || !validate()) return;
      send();
    });
    $('#btn-reset').addEventListener('click', function () {
      resetForm();
      status.hidden = true;
      f.yourName.focus();
    });
    f.files.addEventListener('change', function () { addFiles(f.files.files); f.files.value = ''; });
    ['dragenter', 'dragover'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.add('is-over'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.remove('is-over'); });
    });
    zone.addEventListener('drop', function (e) { if (e.dataTransfer) addFiles(e.dataTransfer.files); });
  }

  /* ---------- back to top ---------- */
  function initToTop() {
    var btn = $('#to-top');
    if (btn) {
      var onScroll = function () { btn.classList.toggle('is-visible', window.scrollY > 600); };
      requestAnimationFrame(onScroll);
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    $$('[data-top]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: scrollBehavior() });
        var brand = $('.brand');
        if (brand) brand.focus({ preventScroll: true });
      });
    });
  }

  /* ---------- init ---------- */
  function init() {
    [
      renderStats, renderFeatures, initImageSlots, renderTech, renderMilestones,
      renderDocuments, renderPeople, renderContactDetails, initContactForm,
      initNav, initScrollSpy, initSubnav, initAccordion, initCopyButtons, initToTop,
      initReveal, initCountUp
    ].forEach(function (fn) {
      try { fn(); } catch (err) { if (window.console) console.warn('HeritageAR: ' + fn.name + ' failed', err); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
