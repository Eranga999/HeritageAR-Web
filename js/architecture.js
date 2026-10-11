/* HeritageAR - architecture.js
   "How we work together": draws the isometric architecture diagram from
   SITE_DATA.collaboration and runs the member tabs (WAI-ARIA tabs pattern)
   that light up each person's components. Text is set with textContent only. */
(function () {
  'use strict';

  var D = window.SITE_DATA || {};
  var C = D.collaboration || {};
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var phoneMq = window.matchMedia('(max-width: 639.98px)');
  var wideMq = window.matchMedia('(min-width: 1024px)');
  var S = 40, CX = 500, CY = 410, K = 0.8660254;
  var VIEW = { full: [0, 0, 1000, 760], compact: [0, -45, 1000, 850] };
  var AUTOPLAY_MS = 7000, FADE_MS = 225;

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function isMissing(v) {
    if (v === null || v === undefined) return true;
    var s = String(v).trim();
    return s === '' || /^placeholder/i.test(s);
  }
  function el(tag, props, kids) {
    var n = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      var v = props[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else n.setAttribute(k, v === true ? '' : v);
    });
    arr(kids).forEach(function (c) { if (c !== null && c !== undefined && c !== false) n.append(c); });
    return n;
  }
  function sv(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }
  function icon(name) {
    var s = sv('svg', { class: 'icon', 'aria-hidden': 'true', focusable: 'false' });
    s.appendChild(sv('use', { href: '#i-' + name }));
    return s;
  }
  function initials(p) {
    if (!isMissing(p.initials)) return String(p.initials).slice(0, 3);
    var t = String(p.name || '').split(/[\s.]+/).filter(Boolean);
    if (!t.length) return '';
    var longest = t.reduce(function (a, b) { return b.length > a.length ? b : a; });
    return (t[0][0] + (longest !== t[0] ? longest[0] : (t[1] || '')[0] || '')).toUpperCase();
  }
  function avatar(p, cls) {
    var box = el('span', { class: 'hw-avatar ' + (cls || ''), 'aria-hidden': 'true' });
    box.append(isMissing(p.name) ? icon('user') : initials(p));
    var src = isMissing(p.photo) ? '' : String(p.photo).trim();
    if (src && !/^(javascript|data|vbscript):/i.test(src)) {
      var img = el('img', { src: src, alt: '', width: '64', height: '64', loading: 'lazy', decoding: 'async' });
      img.addEventListener('error', function () { img.remove(); });
      box.append(img);
    }
    return box;
  }
  function nameOf(m) { return isMissing(m.name) ? 'Team member' : m.name; }
  function joinList(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }

  /* ---------- isometric drawing primitives ---------- */
  function f(n) { return Math.round(n * 10) / 10; }
  // World (x, y on the floor in grid units, z height in pixels) -> screen.
  function P(x, y, z) { return [CX + (x - y) * K * S, CY + (x + y) * 0.5 * S - (z || 0)]; }
  function pt(p) { return f(p[0]) + ' ' + f(p[1]); }
  function pts(list) { return list.map(function (p) { return f(p[0]) + ',' + f(p[1]); }).join(' '); }
  function poly(g, list, cls) { g.appendChild(sv('polygon', { points: pts(list), class: cls })); }
  function path(g, d, cls) { g.appendChild(sv('path', { d: d, class: cls })); }
  function seg(g, a, b, cls) { g.appendChild(sv('line', { x1: f(a[0]), y1: f(a[1]), x2: f(b[0]), y2: f(b[1]), class: cls || 'f-line' })); }
  function dot(g, p, r, cls) { g.appendChild(sv('circle', { cx: f(p[0]), cy: f(p[1]), r: r, class: cls })); }
  // Point on the left (front-left) face plane of an object at x, y with half-depth hd.
  function onFace(x, y, hd) { return function (u, v) { return P(x + u, y + hd, v); }; }
  function faceCircle(F, u, v, ru, rv) {
    var list = [];
    for (var i = 0; i < 18; i++) { var a = i / 18 * Math.PI * 2; list.push(F(u + Math.cos(a) * ru, v + Math.sin(a) * rv)); }
    return list;
  }
  function box(g, x, y, z, hw, hd, h) {
    var t = z + h;
    poly(g, [P(x - hw, y + hd, z), P(x + hw, y + hd, z), P(x + hw, y + hd, t), P(x - hw, y + hd, t)], 'f-left');
    poly(g, [P(x + hw, y + hd, z), P(x + hw, y - hd, z), P(x + hw, y - hd, t), P(x + hw, y + hd, t)], 'f-right');
    poly(g, [P(x - hw, y - hd, t), P(x + hw, y - hd, t), P(x + hw, y + hd, t), P(x - hw, y + hd, t)], 'f-top');
  }
  function cyl(g, x, y, z, r, h) {
    var c = P(x, y, z), rx = f(1.2247 * r * S), ry = f(0.7071 * r * S);
    var L = f(c[0] - rx), R = f(c[0] + rx), M = f(c[0]), b = f(c[1]), t = f(c[1] - h), A = 'A' + rx + ' ' + ry + ' 0 0 ';
    path(g, 'M' + L + ' ' + b + 'V' + t + A + '0 ' + M + ' ' + f(t + ry) + 'V' + f(b + ry) + A + '1 ' + L + ' ' + b + 'Z', 'f-left f-flat');
    path(g, 'M' + M + ' ' + f(t + ry) + A + '0 ' + R + ' ' + t + 'V' + b + A + '1 ' + M + ' ' + f(b + ry) + 'Z', 'f-right f-flat');
    path(g, 'M' + L + ' ' + t + 'V' + b + A + '0 ' + R + ' ' + b + 'V' + t, 'f-edge');
    g.appendChild(sv('ellipse', { cx: M, cy: t, rx: rx, ry: ry, class: 'f-top' }));
  }
  function dome(g, x, y, z, r, h) {
    var c = P(x, y, z), rx = f(1.2247 * r * S), ry = f(0.7071 * r * S), L = f(c[0] - rx), R = f(c[0] + rx), b = f(c[1]);
    path(g, 'M' + L + ' ' + b + 'A' + rx + ' ' + h + ' 0 0 1 ' + R + ' ' + b + 'A' + rx + ' ' + ry + ' 0 0 1 ' + L + ' ' + b + 'Z', 'f-glass');
    path(g, 'M' + f(c[0] - rx * 0.62) + ' ' + f(b - h * 0.4) + 'A' + f(rx * 0.7) + ' ' + f(h * 0.75) + ' 0 0 1 ' + f(c[0] - rx * 0.08) + ' ' + f(b - h * 0.88), 'f-shine');
  }

  /* ---------- object shapes (hw / hd: half footprint in grid units, top: height in px) ---------- */
  var SHAPES = {
    stack: { hw: 1.8, hd: 1.8, top: 124, draw: function (g, x, y) {
      cyl(g, x, y, 0, 1.8, 16);
      var c = P(x, y, 16);
      g.appendChild(sv('ellipse', { cx: f(c[0]), cy: f(c[1]), rx: f(1.2247 * 1.35 * S), ry: f(0.7071 * 1.35 * S), class: 'f-line' }));
      for (var i = 0; i < 3; i++) {
        var z = 22 + i * 36, F = onFace(x, y, 0.85);
        box(g, x, y, z, 0.85, 0.85, 30);
        seg(g, F(-0.6, z + 11), F(0.3, z + 11));
        seg(g, F(-0.6, z + 19), F(0.3, z + 19));
        for (var j = 0; j < 3; j++) dot(g, P(x + 0.85, y + 0.45 - j * 0.3, z + 15), 2.6, 'f-led');
      }
    } },
    dome: { hw: 1.15, hd: 1.15, top: 74, draw: function (g, x, y) {
      cyl(g, x, y, 0, 1.15, 14);
      box(g, x, y, 14, 0.3, 0.3, 24);
      dome(g, x, y, 14, 0.98, 58);
    } },
    rack: { hw: 0.85, hd: 0.75, top: 92, draw: function (g, x, y) {
      box(g, x, y, 0, 0.85, 0.75, 8);
      box(g, x, y, 8, 0.7, 0.6, 84);
      var F = onFace(x, y, 0.6);
      for (var v = 22; v <= 80; v += 12) seg(g, F(-0.55, v), F(0.55, v));
      for (var k = 0; k < 4; k++) dot(g, P(x + 0.7, y + 0.3, 26 + k * 14), 2.4, 'f-led');
    } },
    panel: { hw: 0.95, hd: 0.4, top: 90, draw: function (g, x, y) {
      box(g, x, y, 0, 0.95, 0.4, 8);
      box(g, x, y, 8, 0.85, 0.06, 82);
      var F = onFace(x, y, 0.06), a = 0.62, d = 0.18, dv = 9;
      [[-a, 22, 1, 1], [a, 22, -1, 1], [-a, 78, 1, -1], [a, 78, -1, -1]].forEach(function (c) {
        path(g, 'M' + pt(F(c[0] + d * c[2], c[1])) + 'L' + pt(F(c[0], c[1])) + 'L' + pt(F(c[0], c[1] + dv * c[3])), 'f-line f-thick');
      });
      poly(g, [F(-0.45, 58), F(0.15, 58), F(0.15, 65), F(-0.45, 65)], 'f-accent');
    } },
    pedestal: { hw: 0.8, hd: 0.8, top: 74, draw: function (g, x, y) {
      cyl(g, x, y, 0, 0.8, 30);
      box(g, x, y, 30, 0.5, 0.38, 24);
      var F = onFace(x, y, 0.38);
      poly(g, faceCircle(F, -0.05, 42, 0.2, 8), 'f-lens');
      poly(g, faceCircle(F, -0.05, 42, 0.1, 4), 'f-ink');
      seg(g, P(x + 0.28, y - 0.2, 54), P(x + 0.28, y - 0.2, 70));
      dot(g, P(x + 0.28, y - 0.2, 72), 3.2, 'f-led');
    } },
    signpost: { hw: 0.7, hd: 0.7, top: 96, draw: function (g, x, y) {
      cyl(g, x, y, 0, 0.7, 10);
      box(g, x, y - 0.42, 46, 0.04, 0.4, 18);
      box(g, x, y, 10, 0.06, 0.06, 86);
      box(g, x + 0.46, y, 68, 0.46, 0.04, 20);
      var F = onFace(x + 0.46, y, 0.04);
      path(g, 'M' + pt(F(-0.26, 78)) + 'L' + pt(F(0.24, 78)) + 'M' + pt(F(0.08, 83)) + 'L' + pt(F(0.26, 78)) + 'L' + pt(F(0.08, 73)), 'f-line f-thick');
    } },
    board: { hw: 0.95, hd: 0.3, top: 88, draw: function (g, x, y) {
      box(g, x - 0.72, y, 0, 0.06, 0.06, 32);
      box(g, x + 0.72, y, 0, 0.06, 0.06, 32);
      box(g, x, y, 30, 0.95, 0.07, 58);
      var F = onFace(x, y, 0.07);
      [[76, 0.35], [66, 0.6], [54, 0.1], [44, 0.45]].forEach(function (r) { seg(g, F(-0.75, r[0]), F(r[1], r[0])); });
    } },
    crate: { hw: 0.85, hd: 0.85, top: 52, draw: function (g, x, y) {
      box(g, x, y, 0, 0.85, 0.85, 50);
      var F = onFace(x, y, 0.85), R = function (u, v) { return P(x + 0.85, y + u, v); };
      [17, 33].forEach(function (v) { seg(g, F(-0.85, v), F(0.85, v)); seg(g, R(0.85, v), R(-0.85, v)); });
      seg(g, F(-0.85, 3), F(0.85, 47));
      seg(g, R(0.85, 3), R(-0.85, 47));
      var T = function (u, w) { return P(x + u, y + w, 50.5); };
      poly(g, [T(-0.6, -0.55), T(-0.2, -0.65), T(0.2, -0.55), T(0.6, -0.65), T(0.6, 0.55), T(0.2, 0.65), T(-0.2, 0.55), T(-0.6, 0.65)], 'f-map');
      seg(g, T(-0.2, -0.65), T(-0.2, 0.55));
      seg(g, T(0.2, -0.55), T(0.2, 0.65));
      path(g, 'M' + pt(T(-0.45, 0.35)) + 'L' + pt(T(-0.05, -0.05)) + 'L' + pt(T(0.42, -0.3)), 'f-route');
    } },
    warning: { hw: 0.75, hd: 0.75, top: 122, draw: function (g, x, y) {
      box(g, x, y, 0, 0.75, 0.75, 10);
      box(g, x, y, 10, 0.06, 0.06, 62);
      var F = onFace(x, y, 0.08);
      poly(g, [F(-0.62, 70), F(0.62, 70), F(0, 122)], 'f-sign');
      seg(g, F(0, 86), F(0, 106), 'f-line f-thick');
      dot(g, F(0, 79), 3, 'f-ink');
    } }
  };

  /* ---------- data ---------- */
  var nodes = arr(C.nodes).filter(function (n) { return n && n.id && SHAPES[n.shape]; });
  var byId = {};
  nodes.forEach(function (n) { byId[n.id] = n; n.x = +n.x || 0; n.y = +n.y || 0; });
  var links = arr(C.links).filter(function (l) { return byId[l.from] && byId[l.to]; });
  var people = arr(D.people && D.people.members);
  var assign = arr(C.members);
  function idsOf(i) { return arr((assign[i] || {}).nodeIds).filter(function (id) { return byId[id]; }); }
  var owner = {};
  people.forEach(function (m, i) { idsOf(i).forEach(function (id) { owner[id] = i; }); });

  /* ---------- diagram ---------- */
  var svgRoot, hotLayer, tip, compact = false;

  function linkPath(l) {
    var a = byId[l.from], b = byId[l.to], list = [[a.x, a.y]];
    if (Array.isArray(l.via)) l.via.forEach(function (v) { list.push(v); });
    else list.push(l.route === 'yx' ? [a.x, b.y] : [b.x, a.y]);
    list.push([b.x, b.y]);
    return 'M' + list.map(function (q) { return pt(P(q[0], q[1])); }).join('L');
  }
  function addLabel(g, n, ext) {
    var lb = (compact && n.labelCompact) || n.label || { dx: 0, dy: -14 };
    var up = (+lb.dy || 0) < 0;
    var o = up ? P(n.x, n.y, ext.top + 6) : [P(n.x, n.y)[0], P(n.x + ext.hw, n.y + ext.hd)[1] + 6];
    var d = [o[0] + (+lb.dx || 0), o[1] + (+lb.dy || 0)];
    var align = lb.align || 'middle';
    var lg = sv('g', { class: 'arch-label', 'data-id': n.id });
    seg(lg, o, d, 'arch-leader');
    dot(lg, d, 4, 'arch-dot');
    var x = align === 'start' ? d[0] + 12 : align === 'end' ? d[0] - 12 : d[0];
    var anchor = align === 'start' ? 'start' : align === 'end' ? 'end' : 'middle';
    var ty, cy;
    if (align !== 'middle') { ty = d[1] + (compact ? 13 : -3); cy = d[1] + 17; }
    else if (up) { ty = d[1] - (compact ? 14 : 33); cy = d[1] - 13; }
    else { ty = d[1] + (compact ? 44 : 28); cy = d[1] + 48; }
    var t = sv('text', { x: f(x), y: f(ty), 'text-anchor': anchor, class: 't' });
    t.textContent = compact ? (n.short || n.title) : n.title;
    lg.appendChild(t);
    if (!compact && !isMissing(n.caption)) {
      var c = sv('text', { x: f(x), y: f(cy), 'text-anchor': anchor, class: 'c' });
      c.textContent = n.caption;
      lg.appendChild(c);
    }
    g.appendChild(lg);
  }
  function buildSvg() {
    var vb = compact ? VIEW.compact : VIEW.full;
    var root = sv('svg', {
      class: 'arch' + (compact ? ' is-compact' : ''), viewBox: vb.join(' '), preserveAspectRatio: 'xMidYMid meet',
      role: 'img', 'aria-label': 'Isometric architecture diagram of the HeritageAR offline system'
    });
    var defs = sv('defs');
    var rg = sv('radialGradient', { id: 'arch-fade-g' });
    rg.appendChild(sv('stop', { offset: '0.55', 'stop-color': '#fff' }));
    rg.appendChild(sv('stop', { offset: '1', 'stop-color': '#000' }));
    var mask = sv('mask', { id: 'arch-fade' });
    mask.appendChild(sv('rect', { x: vb[0], y: vb[1], width: vb[2], height: vb[3], fill: 'url(#arch-fade-g)' }));
    var sg = sv('radialGradient', { id: 'arch-sh' });
    sg.appendChild(sv('stop', { offset: '0', 'stop-color': '#000', 'stop-opacity': '0.16' }));
    sg.appendChild(sv('stop', { offset: '0.6', 'stop-color': '#000', 'stop-opacity': '0.07' }));
    sg.appendChild(sv('stop', { offset: '1', 'stop-color': '#000', 'stop-opacity': '0' }));
    defs.append(rg, mask, sg);
    root.appendChild(defs);

    // Floor grid along both isometric axes, faded at the edges.
    var floor = sv('g', { class: 'arch-floor', mask: 'url(#arch-fade)' });
    for (var i = -9; i <= 9; i++) {
      seg(floor, P(i, -9), P(i, 9), 'arch-grid');
      seg(floor, P(-9, i), P(9, i), 'arch-grid');
    }
    root.appendChild(floor);

    // Soft long shadows falling towards the lower right.
    var shadows = sv('g', { class: 'arch-shadows', 'aria-hidden': 'true' });
    nodes.forEach(function (n) {
      var e = SHAPES[n.shape], L = e.top / S * 0.8, c = P(n.x + L * 0.45, n.y + 0.1);
      shadows.appendChild(sv('ellipse', {
        cx: f(c[0]), cy: f(c[1]), rx: f((e.hw + L * 0.55) * S), ry: f(Math.max(e.hw, e.hd) * S * 0.55),
        transform: 'rotate(30 ' + f(c[0]) + ' ' + f(c[1]) + ')', fill: 'url(#arch-sh)'
      }));
    });
    root.appendChild(shadows);

    // Connectors: a light rail with a dashed flow on top.
    var lg = sv('g', { class: 'arch-links' });
    links.forEach(function (l) {
      if (l.draw === false) return;
      var g = sv('g', { class: 'arch-link', 'data-from': l.from, 'data-to': l.to }), d = linkPath(l);
      path(g, d, 'arch-rail');
      path(g, d, 'arch-flow');
      lg.appendChild(g);
    });
    root.appendChild(lg);

    // Objects, back to front.
    var ng = sv('g', { class: 'arch-nodes' });
    nodes.slice().sort(function (a, b) { return (a.x + a.y) - (b.x + b.y); }).forEach(function (n) {
      var g = sv('g', { class: 'arch-node', 'data-id': n.id });
      SHAPES[n.shape].draw(g, n.x, n.y);
      ng.appendChild(g);
    });
    root.appendChild(ng);

    var labels = sv('g', { class: 'arch-labels' });
    nodes.forEach(function (n) { addLabel(labels, n, SHAPES[n.shape]); });
    root.appendChild(labels);
    return root;
  }
  function hotspotBox(n) {
    var e = SHAPES[n.shape], vb = compact ? VIEW.compact : VIEW.full;
    var l = P(n.x - e.hw, n.y + e.hd)[0], r = P(n.x + e.hw, n.y - e.hd)[0];
    var t = P(n.x - e.hw, n.y - e.hd, e.top)[1], b = P(n.x + e.hw, n.y + e.hd)[1];
    return {
      left: (l - vb[0]) / vb[2] * 100, top: (t - vb[1]) / vb[3] * 100,
      width: (r - l) / vb[2] * 100, height: (b - t) / vb[3] * 100
    };
  }
  // Screen-reader list of every node and connector (cheap, built straight away).
  function renderList(wrap) {
    var list = el('ul', { class: 'sr-only' });
    nodes.forEach(function (n) {
      var who = owner[n.id] !== undefined ? ' Built by ' + nameOf(people[owner[n.id]]) + '.' : '';
      list.append(el('li', { text: n.title + ': ' + (n.description || '') + who }));
    });
    links.forEach(function (l) { list.append(el('li', { text: byId[l.from].title + ' sends data to ' + byId[l.to].title + '.' })); });
    wrap.append(list);
  }
  function renderDiagram(wrap) {
    compact = phoneMq.matches;
    [svgRoot, hotLayer, tip].forEach(function (n) { if (n) n.remove(); });
    svgRoot = buildSvg();
    hotLayer = el('div', { class: 'arch-hots' });
    nodes.forEach(function (n) {
      var b = hotspotBox(n), who = owner[n.id] !== undefined ? people[owner[n.id]] : null;
      var btn = el('button', {
        type: 'button', class: 'arch-hot', 'data-id': n.id,
        style: 'left:' + f(b.left) + '%;top:' + f(b.top) + '%;width:' + f(b.width) + '%;height:' + f(b.height) + '%',
        'aria-label': n.title + '. ' + (n.description || '') + (who ? ' Built by ' + nameOf(who) + '. Select to show their part.' : '')
      });
      hotLayer.append(btn);
    });
    tip = el('div', { class: 'hw-tip', id: 'hw-tip', role: 'tooltip', hidden: true });
    wrap.prepend(svgRoot, hotLayer, tip);
  }
  function highlight(ids, mode) {
    if (!svgRoot) return;
    var on = {};
    ids.forEach(function (id) { on[id] = true; });
    svgRoot.classList.toggle('is-all', mode === 'all');
    svgRoot.classList.toggle('has-sel', ids.length > 0);
    Array.prototype.forEach.call(svgRoot.querySelectorAll('.arch-node, .arch-label'), function (g) {
      g.classList.toggle('is-on', !!on[g.getAttribute('data-id')]);
    });
    Array.prototype.forEach.call(svgRoot.querySelectorAll('.arch-link'), function (g) {
      g.classList.toggle('is-on', !!(on[g.getAttribute('data-from')] || on[g.getAttribute('data-to')]));
    });
  }
  function showTip(n, btn, wrap) {
    if (!tip) return;
    tip.replaceChildren(el('b', { text: n.title }), el('span', { text: n.description || '' }));
    tip.hidden = false;
    var W = wrap.clientWidth, half = tip.offsetWidth / 2;
    var cx = btn.offsetLeft + btn.offsetWidth / 2;
    tip.style.left = Math.min(Math.max(cx, half + 8), W - half - 8) + 'px';
    tip.style.top = btn.offsetTop + 'px';
    var g = svgRoot.querySelector('.arch-node[data-id="' + n.id + '"]');
    if (g) g.classList.add('is-hover');
  }
  function hideTip() {
    if (tip) tip.hidden = true;
    if (svgRoot) Array.prototype.forEach.call(svgRoot.querySelectorAll('.is-hover'), function (g) { g.classList.remove('is-hover'); });
  }

  /* ---------- description panel ---------- */
  function uniq(list) { return list.filter(function (v, i) { return list.indexOf(v) === i; }); }
  function chips(list) { return el('ul', { class: 'chips hw-chips' }, list.map(function (t) { return el('li', { class: 'chip', text: t }); })); }
  function personHead(p, extra) {
    return el('div', { class: 'hw-person' }, [avatar(p, 'hw-avatar--lg'), el('div', null, [el('b', { text: nameOf(p) }), extra])]);
  }
  function wholePanel() {
    var w = C.wholeSystem || {};
    return [
      el('div', { class: 'hw-person' }, [el('span', { class: 'hw-avatar hw-avatar--lg hw-avatar--sys', 'aria-hidden': 'true' }, [icon('layers')]), el('div', null, [el('b', { text: 'Whole system' }), el('span', { class: 'hw-muted', text: 'All four components together' })])]),
      el('h3', { text: w.title || 'One offline pipeline' }),
      w.text ? el('p', { class: 'hw-text', text: w.text }) : null,
      arr(w.steps).length ? el('h4', { class: 'hw-sub', text: w.listTitle || 'A typical visit' }) : null,
      arr(w.steps).length ? el('ol', { class: 'hw-steps' }, w.steps.map(function (s) { return el('li', { text: s }); })) : null
    ];
  }
  function memberPanel(i) {
    var p = people[i] || {}, a = assign[i] || {}, ids = idsOf(i);
    var head = personHead(p, isMissing(p.regNo) ? null : el('span', { class: 'chip', text: p.regNo }));
    if (!ids.length) {
      return [head, el('h3', { text: 'To be added' }), el('p', { class: 'hw-text', text: "This member's component will be described here." })];
    }
    var mine = {};
    ids.forEach(function (id) { mine[id] = true; });
    var from = [], to = [], neighbours = [];
    links.forEach(function (l) {
      if (mine[l.to] && !mine[l.from]) { from.push(byId[l.from].title); neighbours.push(l.from); }
      if (mine[l.from] && !mine[l.to]) { to.push(byId[l.to].title); neighbours.push(l.to); }
    });
    from = uniq(from); to = uniq(to); neighbours = uniq(neighbours);
    var mates = uniq(neighbours.filter(function (id) { return owner[id] !== undefined && owner[id] !== i; }).map(function (id) { return nameOf(people[owner[id]]); }));
    var shared = neighbours.filter(function (id) { return owner[id] === undefined; }).map(function (id) { return byId[id].title; });
    var footText = mates.length ? 'Works together with: ' + mates.join(', ') + '.'
      : shared.length ? 'Connected to the rest of the system through the ' + shared.join(', ') + '.' : '';
    var tech = uniq([].concat.apply([], ids.map(function (id) { return arr(byId[id].tech); })));
    return [
      head,
      el('h3', { text: isMissing(p.component) ? joinList(ids.map(function (id) { return byId[id].title; })) : p.component }),
      el('p', { class: 'hw-text', text: isMissing(a.description) ? "This member's component will be described here." : a.description }),
      el('h4', { class: 'hw-sub', text: 'What I build' }),
      el('ul', { class: 'hw-build' }, ids.map(function (id) { return el('li', { text: byId[id].title }); })),
      tech.length ? el('h4', { class: 'hw-sub', text: 'Technology' }) : null,
      tech.length ? chips(tech) : null,
      el('dl', { class: 'hw-flow' }, [
        el('dt', { text: 'Receives from' }), el('dd', { text: from.length ? from.join(', ') : 'Nothing else in the system' }),
        el('dt', { text: 'Hands over to' }), el('dd', { text: to.length ? to.join(', ') : 'Shows results directly to the visitor' })
      ]),
      footText ? el('p', { class: 'hw-foot', text: footText }) : null
    ];
  }

  /* ---------- tabs, autoplay, wiring ---------- */
  function init() {
    var section = $('#how-we-work'), card = $('#hw-card'), wrap = $('#hw-diagram'), list = $('#hw-tabs'), panel = $('#hw-panel');
    if (!section || !card || !wrap || !list || !panel) return;
    if (!nodes.length) { section.hidden = true; return; }

    var tabsData = [{ id: 'all', name: 'Whole system', hint: 'How all the parts connect', person: null }];
    people.forEach(function (m, i) {
      var a = assign[i] || {};
      tabsData.push({ id: 'member-' + (i + 1), name: nameOf(m), hint: !isMissing(a.hint) ? a.hint : !isMissing(m.component) && idsOf(i).length ? m.component : idsOf(i).length ? joinList(idsOf(i).map(function (id) { return byId[id].title; })) : 'Component to be added', person: m });
    });
    var tabs = tabsData.map(function (t, i) {
      return el('button', {
        type: 'button', role: 'tab', id: 'hw-tab-' + t.id, class: 'hw-tab', 'aria-selected': String(i === 0),
        'aria-controls': 'hw-panel', tabindex: i === 0 ? '0' : '-1'
      }, [
        t.person ? avatar(t.person) : el('span', { class: 'hw-avatar hw-avatar--sys', 'aria-hidden': 'true' }, [icon('layers')]),
        el('span', { class: 'hw-tab-text' }, [el('span', { class: 'hw-tab-name', text: t.name }), el('span', { class: 'hw-tab-hint', text: t.hint })])
      ]);
    });
    tabs.forEach(function (b) { list.append(b); });
    var setOrientation = function () { list.setAttribute('aria-orientation', wideMq.matches ? 'vertical' : 'horizontal'); };
    setOrientation();

    var current = 0, fadeTimer;
    function idsFor(i) { return i === 0 ? [] : idsOf(i - 1); }
    function fill(i) {
      panel.replaceChildren.apply(panel, (i === 0 ? wholePanel() : memberPanel(i - 1)).filter(Boolean));
      panel.setAttribute('aria-labelledby', tabs[i].id);
    }
    function select(i, how) {
      if (i === current && how !== 'init') return;
      current = i;
      tabs.forEach(function (b, k) {
        b.setAttribute('aria-selected', String(k === i));
        b.setAttribute('tabindex', k === i ? '0' : '-1');
      });
      panel.setAttribute('aria-live', how === 'auto' ? 'off' : 'polite');
      highlight(idsFor(i), i === 0 ? 'all' : 'member');
      clearTimeout(fadeTimer);
      if (reduce.matches || how === 'init') fill(i);
      else {
        panel.classList.add('is-fading');
        fadeTimer = setTimeout(function () { fill(i); panel.classList.remove('is-fading'); }, FADE_MS);
      }
      if (how !== 'init' && list.scrollWidth > list.clientWidth + 1) {
        list.scrollTo({ left: tabs[i].offsetLeft - 16, behavior: reduce.matches ? 'auto' : 'smooth' });
      }
    }

    renderList(wrap);
    select(0, 'init');

    // The SVG is built only when the section comes near the viewport, so it
    // adds nothing to the initial page load.
    var built = false, visible = false;
    function build() {
      if (built) return;
      built = true;
      renderDiagram(wrap);
      highlight(idsFor(current), current === 0 ? 'all' : 'member');
      if (svgRoot) svgRoot.classList.toggle('is-live', visible);
    }
    if ('IntersectionObserver' in window) {
      var near = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { near.disconnect(); build(); }
      }, { rootMargin: '600px 0px' });
      near.observe(section);
    } else build();

    // Autoplay: starts once the section is seen, stops for good on interaction.
    // Connector animation also runs only while the section is on screen.
    var stopped = reduce.matches, paused = false, timer = null, pointerIn = false;
    function stop() { stopped = true; clearInterval(timer); timer = null; }
    function tick() { if (!paused && visible && !stopped) select((current + 1) % tabs.length, 'auto'); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) build();
        if (svgRoot) svgRoot.classList.toggle('is-live', visible);
        if (visible && !stopped && !timer) timer = setInterval(tick, AUTOPLAY_MS);
      }, { threshold: 0.2 }).observe(section);
    }
    [list, wrap].forEach(function (zone) {
      ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { zone.addEventListener(ev, stop, { passive: true }); });
    });
    card.addEventListener('pointerenter', function () { pointerIn = true; paused = true; });
    card.addEventListener('pointerleave', function () { pointerIn = false; paused = card.contains(document.activeElement); });
    card.addEventListener('focusin', function () { paused = true; });
    card.addEventListener('focusout', function (e) { if (!card.contains(e.relatedTarget)) paused = pointerIn; });

    // Tabs: click and keyboard (arrows, Home, End).
    list.addEventListener('click', function (e) {
      var b = e.target.closest('[role="tab"]');
      if (b) select(tabs.indexOf(b), 'user');
    });
    list.addEventListener('keydown', function (e) {
      var step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key], i;
      if (step) i = (current + step + tabs.length) % tabs.length;
      else if (e.key === 'Home') i = 0;
      else if (e.key === 'End') i = tabs.length - 1;
      else return;
      e.preventDefault();
      select(i, 'user');
      tabs[i].focus();
    });

    // Diagram nodes: tooltip on hover / focus / tap, click selects the owner.
    wrap.addEventListener('pointerover', function (e) {
      var b = e.target.closest('.arch-hot');
      if (b) showTip(byId[b.getAttribute('data-id')], b, wrap);
    });
    wrap.addEventListener('pointerout', function (e) {
      var b = e.target.closest('.arch-hot');
      if (b && !b.contains(e.relatedTarget) && document.activeElement !== b) hideTip();
    });
    wrap.addEventListener('focusin', function (e) {
      var b = e.target.closest('.arch-hot');
      if (b) { hideTip(); showTip(byId[b.getAttribute('data-id')], b, wrap); }
    });
    wrap.addEventListener('focusout', hideTip);
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('.arch-hot');
      if (!b) return;
      var id = b.getAttribute('data-id');
      if (owner[id] !== undefined) select(owner[id] + 1, 'user');
      showTip(byId[id], b, wrap);
    });

    var onPhone = function () {
      if (!built) return;
      hideTip();
      renderDiagram(wrap);
      highlight(idsFor(current), current === 0 ? 'all' : 'member');
      svgRoot.classList.toggle('is-live', visible);
    };
    var onWide = setOrientation;
    if (phoneMq.addEventListener) { phoneMq.addEventListener('change', onPhone); wideMq.addEventListener('change', onWide); }
    else { phoneMq.addListener(onPhone); wideMq.addListener(onWide); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
