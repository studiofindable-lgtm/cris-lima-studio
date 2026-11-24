(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* ---------- Tabela de preços (dados em js/precos.js) ---------- */
  function preco(v) {
    return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  document.querySelectorAll('[data-list]').forEach(function (box) {
    var key = box.getAttribute('data-list');
    var lista = (window.PRECOS || {})[key] || [];
    var aPartir = (window.A_PARTIR_DE || []).indexOf(key) !== -1;

    lista.forEach(function (r) {
      if (typeof r[2] !== 'number') {            // subtítulo
        var sub = el('div', 'sub', r[0]);
        if (r[2]) sub.appendChild(el('small', null, r[2]));
        box.appendChild(sub);
        return;
      }
      var row = el('div', 'row');
      var nome = el('span', 'n', r[0]);
      if (r[1]) nome.appendChild(el('small', null, r[1]));
      var valor = el('b');
      if (aPartir) valor.appendChild(el('span', 'ap', 'a partir de'));
      valor.appendChild(document.createTextNode(preco(r[2]) + (r[3] ? ' ' + r[3] : '')));
      row.appendChild(nome);
      row.appendChild(el('i'));
      row.appendChild(valor);
      box.appendChild(row);
    });
  });

  /* ---------- Partículas brilhantes ---------- */
  function particulas(box, n, seed) {
    if (!box) return;
    for (var i = 0; i < n; i++) {
      var a = Math.abs(Math.sin(seed + i * 12.9898) * 43758.5453) % 1;
      var b = Math.abs(Math.sin(seed + i * 78.233) * 12345.6789) % 1;
      var s = el('span', 'sp' + (i % 3 === 0 ? ' g2' : ''));
      s.setAttribute('aria-hidden', 'true');
      s.style.left = (a * 92 + 2) + '%';
      s.style.top = (b * 92 + 2) + '%';
      s.style.setProperty('--s', (2 + a * 3.5).toFixed(1) + 'px');
      s.style.animationDelay = (b * 3.4).toFixed(2) + 's';
      box.appendChild(s);
    }
  }
  particulas(document.querySelector('.hero'), 20, 1);
  particulas(document.querySelector('#intro .l'), 8, 5);
  particulas(document.querySelector('#intro .r'), 8, 9);

  /* ---------- Frase animada ---------- */
  var FRASE = 'Onde sua beleza se torna digna de princesa';

  function frase(cls) {
    var p = el('p', 'tag ' + cls);
    p.appendChild(el('span', 'sr', FRASE));       // leitores de tela leem a frase inteira
    var vis = el('span');
    vis.setAttribute('aria-hidden', 'true');
    var n = 0;
    FRASE.split(' ').forEach(function (w, wi) {
      if (wi) vis.appendChild(document.createTextNode(' '));
      var word = el('span', 'w');
      w.split('').forEach(function (c) {
        var ch = el('span', 'ch', c);
        ch.style.setProperty('--d', (n++ * 0.04).toFixed(2) + 's');
        word.appendChild(ch);
      });
      vis.appendChild(word);
    });
    p.appendChild(vis);

    function pop(e) {
      var c = e.target;
      if (!c.classList || !c.classList.contains('ch') || reduce) return;
      c.classList.add('pop');
      setTimeout(function () { c.classList.remove('pop'); }, 450);
      var r = c.getBoundingClientRect(), q = p.getBoundingClientRect();
      for (var k = 0; k < 4; k++) {
        var b = el('span', 'bur');
        b.style.left = (r.left - q.left + r.width / 2) + 'px';
        b.style.top = (r.top - q.top + r.height / 2) + 'px';
        var ang = k / 4 * 6.283 + Math.random(), d = 18 + Math.random() * 22;
        b.style.setProperty('--dx', (Math.cos(ang) * d).toFixed(0) + 'px');
        b.style.setProperty('--dy', (Math.sin(ang) * d).toFixed(0) + 'px');
        p.appendChild(b);
        setTimeout(function (x) { x.remove(); }, 800, b);
      }
    }
    p.addEventListener('pointerover', pop);
    p.addEventListener('pointerdown', pop);
    return p;
  }

  var intro = document.getElementById('intro');
  var btn = document.querySelector('.hero .btn');
  btn.parentNode.insertBefore(frase('ht'), btn);

  /* ---------- Abertura: pular ao tocar, rolar ou apertar tecla ---------- */
  if (root.classList.contains('intro-on')) {
    intro.appendChild(frase('it'));
    var pular = function (e) {
      if (e && e.target && e.target.classList && e.target.classList.contains('ch')) return;
      root.classList.remove('intro-on');
      ['click', 'wheel', 'touchmove', 'keydown'].forEach(function (t) {
        (t === 'click' ? intro : window).removeEventListener(t, pular);
      });
    };
    intro.addEventListener('click', pular);
    window.addEventListener('wheel', pular, { passive: true });
    window.addEventListener('touchmove', pular, { passive: true });
    window.addEventListener('keydown', pular);
    setTimeout(function () { intro.remove(); }, 4200);
  } else if (intro) {
    intro.remove();
  }

  /* ---------- Botão flutuante aparece depois do topo ---------- */
  var wa = document.querySelector('.wa-float');
  var hero = document.querySelector('.hero');
  if (wa && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      wa.classList.toggle('show', !es[0].isIntersecting);
    }, { threshold: 0.15 }).observe(hero);
  } else if (wa) {
    wa.classList.add('show');
  }

  /* ---------- Menu: destaca a seção visível ---------- */
  var navBox = document.querySelector('nav div');
  var links = {};
  document.querySelectorAll('nav a[href^="#"]').forEach(function (a) {
    links[a.getAttribute('href').slice(1)] = a;
  });
  if ('IntersectionObserver' in window) {
    var atual = null;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var a = links[e.target.id];
        if (!a || a === atual) return;
        if (atual) { atual.classList.remove('on'); atual.removeAttribute('aria-current'); }
        a.classList.add('on');
        a.setAttribute('aria-current', 'true');
        atual = a;
        navBox.scrollTo({ left: a.offsetLeft - (navBox.clientWidth - a.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) io.observe(s);
    });
  }

  /* ---------- Ano no rodapé ---------- */
  var ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();
})();
