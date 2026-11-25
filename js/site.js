/* Cris Lima Studio – comportamento comum a todas as páginas */
(function () {
  var D = window.DADOS || { categorias: [] };
  var base = document.body.getAttribute('data-base') || '';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- utilidades (também usadas no agendamento) ---------- */
  var CL = window.CL = {
    preco: function (v) {
      return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    duracao: function (min) {
      var h = Math.floor(min / 60), m = min % 60;
      if (!h) return m + ' min';
      return h + 'h' + (m ? (m < 10 ? '0' : '') + m : '');
    },
    servicos: function () {
      var out = [];
      D.categorias.forEach(function (c) {
        c.itens.forEach(function (s) { out.push(Object.assign({ cat: c.id, catNome: c.nome, aPartir: !!c.aPartir }, s)); });
      });
      return out;
    },
    waLink: function (texto) {
      return 'https://wa.me/' + D.whatsapp + '?text=' + encodeURIComponent(texto || 'Olá! Quero agendar um horário no Cris Lima Studio.');
    },
    el: function (tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = text;
      return e;
    }
  };
  var el = CL.el;

  /* ---------- cabeçalho ---------- */
  var top = document.querySelector('.top');
  function onScroll() { if (top) top.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var burger = document.querySelector('.burger');
  if (burger) {
    var fechar = function () { document.documentElement.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); };
    burger.addEventListener('click', function () {
      var open = document.documentElement.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.menu a').forEach(function (a) { a.addEventListener('click', fechar); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fechar(); });
  }

  /* ---------- aparecer ao rolar ---------- */
  var rev = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rev.forEach(function (r) { io.observe(r); });
  } else {
    rev.forEach(function (r) { r.classList.add('in'); });
  }

  /* ---------- brilhos no topo ---------- */
  document.querySelectorAll('[data-sparkles]').forEach(function (box) {
    var n = Number(box.getAttribute('data-sparkles')) || 14;
    for (var i = 0; i < n; i++) {
      var a = Math.abs(Math.sin(1 + i * 12.9898) * 43758.5453) % 1;
      var b = Math.abs(Math.sin(1 + i * 78.233) * 12345.6789) % 1;
      var s = el('span', 'sparkle');
      s.setAttribute('aria-hidden', 'true');
      s.style.left = (a * 94 + 3) + '%';
      s.style.top = (b * 90 + 4) + '%';
      s.style.setProperty('--s', (2.5 + a * 3.5).toFixed(1) + 'px');
      s.style.animationDelay = (b * 3).toFixed(2) + 's';
      box.appendChild(s);
    }
  });

  /* ---------- barra fixa do celular: some enquanto os botões do topo ou o rodapé estão na tela ---------- */
  var mbar = document.querySelector('.mbar');
  if (mbar && 'IntersectionObserver' in window) {
    var vis = {};
    [document.querySelector('.foot'), document.querySelector('.hero .btns')].forEach(function (alvo, i) {
      if (!alvo) return;
      new IntersectionObserver(function (es) {
        vis[i] = es[0].isIntersecting;
        mbar.classList.toggle('hide', !!(vis[0] || vis[1]));
      }).observe(alvo);
    });
  }

  /* ---------- vídeos: tocam sem som só quando aparecem na tela ---------- */
  document.querySelectorAll('video[data-auto]').forEach(function (v) {
    v.muted = true;
    if (reduce || !('IntersectionObserver' in window)) { v.controls = true; v.preload = 'metadata'; return; }
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () { v.controls = true; }); }
        else v.pause();
      });
    }, { threshold: 0.25 }).observe(v);
  });

  /* ---------- antes e depois ---------- */
  document.querySelectorAll('.ba').forEach(function (ba) {
    var r = ba.querySelector('input[type=range]');
    if (!r) return;
    var set = function () { ba.style.setProperty('--pos', r.value + '%'); };
    r.addEventListener('input', set);
    set();
  });

  /* ---------- "a partir de" nos cards ---------- */
  document.querySelectorAll('[data-from]').forEach(function (n) {
    var c = D.categorias.filter(function (x) { return x.id === n.getAttribute('data-from'); })[0];
    if (!c) return;
    var min = Math.min.apply(null, c.itens.map(function (s) { return s.preco; }));
    n.textContent = CL.preco(min);
  });

  /* ---------- tabelas de preço ---------- */
  document.querySelectorAll('[data-list]').forEach(function (box) {
    var c = D.categorias.filter(function (x) { return x.id === box.getAttribute('data-list'); })[0];
    if (!c) return;
    var grupo = null, so = box.getAttribute('data-grupos');
    so = so ? so.split('|') : null; // data-grupos: só estes grupos da categoria
    c.itens.forEach(function (s) {
      if (so && so.indexOf(s.grupo) === -1) return;
      if (s.grupo && s.grupo !== grupo) {
        grupo = s.grupo;
        var g = el('div', 'pgroup', s.grupo);
        if (s.grupoDet) g.appendChild(el('small', null, s.grupoDet));
        box.appendChild(g);
      }
      var row = el('div', 'prow');
      var n = el('div', 'n');
      n.appendChild(el('b', null, s.nome));
      if (s.det) n.appendChild(el('small', null, s.det));
      var meta = el('div', 'meta', '⏱ ' + CL.duracao(s.min) + ' em média');
      n.appendChild(meta);
      var p = el('div', 'p');
      if (c.aPartir) p.appendChild(el('small', null, 'a partir de'));
      p.appendChild(document.createTextNode(CL.preco(s.preco) + (s.sufixo ? ' ' + s.sufixo : '')));
      var go = el('a', 'go', 'Agendar');
      go.href = base + 'agendar.html?s=' + encodeURIComponent(s.id);
      go.setAttribute('aria-label', 'Agendar ' + s.nome);
      row.appendChild(n); row.appendChild(p); row.appendChild(go);
      box.appendChild(row);
    });
  });

  /* ---------- menu de categorias (página de serviços) ---------- */
  var catLinks = document.querySelectorAll('.cat-nav a');
  if (catLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    catLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var cur = null, strip = document.querySelector('.cat-nav .wrap');
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var a = map[e.target.id];
        if (!a || a === cur) return;
        if (cur) cur.classList.remove('on');
        a.classList.add('on'); cur = a;
        strip.scrollTo({ left: a.offsetLeft - (strip.clientWidth - a.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) co.observe(s); });
  }

  /* ---------- horários ---------- */
  var DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  document.querySelectorAll('[data-hours]').forEach(function (ul) {
    var hoje = new Date().getDay();
    [1, 2, 3, 4, 5, 6, 0].forEach(function (d) {
      var h = D.horarios[d];
      var li = el('li', h ? '' : 'off');
      if (d === hoje) li.classList.add('today');
      li.appendChild(el('span', null, DIAS[d]));
      li.appendChild(el('span', null, h ? h[0].replace(':00', 'h') + ' às ' + h[1].replace(':00', 'h') : 'Fechado'));
      ul.appendChild(li);
    });
    if (!D.horariosConfirmados) {
      var note = el('p', 'note', 'Horários sujeitos a confirmação pelo WhatsApp.');
      ul.parentNode.insertBefore(note, ul.nextSibling);
    }
  });

  /* ---------- links de WhatsApp ---------- */
  document.querySelectorAll('[data-wa]').forEach(function (a) {
    a.href = CL.waLink(a.getAttribute('data-wa') || undefined);
    a.target = '_blank';
    a.rel = 'noopener';
  });

  /* ---------- ano ---------- */
  document.querySelectorAll('[data-year]').forEach(function (n) { n.textContent = new Date().getFullYear(); });
})();
