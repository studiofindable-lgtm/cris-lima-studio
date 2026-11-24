/* Cris Lima Studio – agendamento online
   A cliente escolhe serviços, dia e horário. A agenda calcula sozinha os horários
   em que o atendimento cabe inteiro (usando o tempo médio de cada serviço) e,
   no fim, a solicitação chega pronta no WhatsApp do studio. */
(function () {
  var root = document.getElementById('bk');
  if (!root) return;
  var D = window.DADOS, CL = window.CL, el = CL.el;
  var todos = CL.servicos();
  var porId = {};
  todos.forEach(function (s) { porId[s.id] = s; });

  var DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  var DIAS_LONGO = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  var st = { sel: [], tab: D.categorias[0].id, dia: null, hora: null, passo: 1 };

  // serviços vindos do link (?s=truck,design)
  var q = new URLSearchParams(location.search).get('s');
  if (q) q.split(',').forEach(function (id) {
    if (porId[id] && st.sel.indexOf(id) === -1) { if (!st.sel.length) st.tab = porId[id].cat; st.sel.push(id); }
  });

  var $ = function (s) { return root.querySelector(s); };
  var tabs = $('.bk-tabs'), list = $('.bk-list'), sum = $('.bk-sum .s'), next = $('#bk-next');
  var daysBox = $('.bk-days'), monthBox = $('.bk-month'), timesBox = $('.bk-times');
  var form = $('.bk-form'), review = $('.bk-review');

  function total() {
    var min = 0, preco = 0, aPartir = false;
    st.sel.forEach(function (id) { var s = porId[id]; min += s.min; preco += s.preco; if (s.aPartir) aPartir = true; });
    return { min: min, preco: preco, aPartir: aPartir };
  }
  function hm(str) { var p = str.split(':'); return +p[0] * 60 + +p[1]; }
  function fmtHora(m) { var h = Math.floor(m / 60), mm = m % 60; return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm; }
  function fmtData(d) { return DIAS_LONGO[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()]; }

  /* ---------- passo 1: serviços ---------- */
  function renderTabs() {
    tabs.innerHTML = '';
    D.categorias.forEach(function (c) {
      var n = st.sel.filter(function (id) { return porId[id].cat === c.id; }).length;
      var b = el('button', null, c.nome);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', c.id === st.tab ? 'true' : 'false');
      if (n) b.appendChild(el('span', 'ct', String(n)));
      b.addEventListener('click', function () { st.tab = c.id; renderTabs(); renderList(); });
      tabs.appendChild(b);
    });
  }
  function renderList() {
    list.innerHTML = '';
    var c = D.categorias.filter(function (x) { return x.id === st.tab; })[0];
    var grupo = null;
    c.itens.forEach(function (s) {
      if (s.grupo && s.grupo !== grupo) { grupo = s.grupo; list.appendChild(el('div', 'bk-grp', s.grupo)); }
      var lab = el('label', 'bk-opt');
      var inp = el('input'); inp.type = 'checkbox'; inp.value = s.id; inp.checked = st.sel.indexOf(s.id) !== -1;
      inp.addEventListener('change', function () {
        var i = st.sel.indexOf(s.id);
        if (inp.checked && i === -1) st.sel.push(s.id);
        if (!inp.checked && i !== -1) st.sel.splice(i, 1);
        st.hora = null;
        renderTabs(); renderSum();
      });
      var t = el('span', 't'); t.appendChild(el('b', null, s.nome));
      t.appendChild(el('small', null, (s.det ? s.det + ' · ' : '') + '⏱ ' + CL.duracao(s.min)));
      var pr = el('span', 'pr', CL.preco(s.preco));
      if (c.aPartir) pr.appendChild(el('small', null, 'a partir de'));
      else if (s.sufixo) pr.appendChild(el('small', null, s.sufixo));
      lab.appendChild(inp); lab.appendChild(el('span', 'box')); lab.appendChild(t); lab.appendChild(pr);
      list.appendChild(lab);
    });
  }

  /* ---------- passo 2: dia e horário ---------- */
  function slotsDoDia(d) {
    var h = D.horarios[d.getDay()];
    if (!h) return [];
    var dur = total().min, abre = hm(h[0]), fecha = hm(h[1]), passo = D.passoAgendaMin || 30;
    var agora = new Date(), minimo = -1;
    if (d.toDateString() === agora.toDateString()) minimo = agora.getHours() * 60 + agora.getMinutes() + (D.antecedenciaHoras || 0) * 60;
    var out = [];
    for (var m = abre; m + dur <= fecha; m += passo) if (m >= minimo) out.push(m);
    return out;
  }
  function renderDias() {
    daysBox.innerHTML = '';
    var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    var primeiro = null;
    for (var i = 0; i < (D.diasAgenda || 30); i++) {
      var d = new Date(hoje); d.setDate(hoje.getDate() + i);
      var livre = slotsDoDia(d).length > 0;
      if (livre && !primeiro) primeiro = d;
      var b = el('button', 'bk-day');
      b.type = 'button';
      b.disabled = !livre;
      b.appendChild(el('small', null, i === 0 ? 'hoje' : i === 1 ? 'amanhã' : DIAS[d.getDay()]));
      b.appendChild(el('b', null, String(d.getDate())));
      b.appendChild(el('small', null, MESES[d.getMonth()].slice(0, 3)));
      b.setAttribute('aria-label', fmtData(d) + (livre ? '' : ' (indisponível)'));
      (function (dd, bb) {
        bb.addEventListener('click', function () { st.dia = dd; st.hora = null; marcarDia(); renderHoras(); renderSum(); });
      })(d, b);
      b._d = d;
      daysBox.appendChild(b);
    }
    if (!st.dia || !slotsDoDia(st.dia).length) st.dia = primeiro;
    marcarDia();
    renderHoras();
  }
  function marcarDia() {
    daysBox.querySelectorAll('.bk-day').forEach(function (b) {
      var on = st.dia && b._d.getTime() === st.dia.getTime();
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on && b.scrollIntoView) daysBox.scrollTo({ left: b.offsetLeft - 8, behavior: 'smooth' });
    });
    monthBox.textContent = st.dia ? MESES[st.dia.getMonth()][0].toUpperCase() + MESES[st.dia.getMonth()].slice(1) + ' ' + st.dia.getFullYear() : '';
  }
  function renderHoras() {
    timesBox.innerHTML = '';
    if (!st.dia) {
      var vazio = el('div', 'bk-empty', 'Não encontramos um dia em que o atendimento caiba inteiro na agenda. Fale com a gente no WhatsApp que encontramos um horário para você.');
      timesBox.appendChild(vazio);
      return;
    }
    var slots = slotsDoDia(st.dia);
    var per = [['Manhã', 0, 720], ['Tarde', 720, 1080], ['Noite', 1080, 1440]];
    per.forEach(function (p) {
      var ss = slots.filter(function (m) { return m >= p[1] && m < p[2]; });
      if (!ss.length) return;
      var box = el('div', 'bk-period');
      box.appendChild(el('h4', null, p[0]));
      var grid = el('div', 'bk-slots');
      ss.forEach(function (m) {
        var b = el('button', 'bk-slot', fmtHora(m));
        b.type = 'button';
        b.setAttribute('aria-pressed', st.hora === m ? 'true' : 'false');
        b.setAttribute('aria-label', fmtHora(m) + ' até ' + fmtHora(m + total().min));
        b.addEventListener('click', function () {
          st.hora = m;
          grid.parentNode.parentNode.querySelectorAll('.bk-slot').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true');
          renderSum();
        });
        grid.appendChild(b);
      });
      box.appendChild(grid);
      timesBox.appendChild(box);
    });
  }

  /* ---------- resumo e navegação ---------- */
  function renderSum() {
    var t = total();
    sum.innerHTML = '';
    if (st.passo === 1) {
      if (!st.sel.length) { sum.textContent = 'Escolha pelo menos um serviço'; }
      else {
        sum.appendChild(el('b', null, st.sel.length + (st.sel.length > 1 ? ' serviços' : ' serviço')));
        sum.appendChild(document.createTextNode(' · ⏱ ' + CL.duracao(t.min) + ' · ' + (t.aPartir ? 'a partir de' : '')));
        sum.appendChild(el('strong', null, CL.preco(t.preco)));
      }
      next.disabled = !st.sel.length;
    } else if (st.passo === 2) {
      if (st.dia && st.hora != null) {
        sum.appendChild(el('b', null, fmtData(st.dia)));
        sum.appendChild(document.createTextNode(' · ' + fmtHora(st.hora) + ' às ' + fmtHora(st.hora + t.min)));
      } else sum.textContent = 'Escolha o dia e o horário';
      next.disabled = !(st.dia && st.hora != null);
    }
  }
  function irPara(n) {
    st.passo = n;
    root.querySelectorAll('[data-panel]').forEach(function (p) { p.hidden = +p.getAttribute('data-panel') !== n; });
    root.querySelectorAll('.bk-steps li').forEach(function (li) {
      var k = +li.getAttribute('data-step');
      li.classList.toggle('on', k === n);
      li.classList.toggle('done', k < n);
      if (k === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    $('.bk-sum').hidden = n > 2;
    if (n === 2) renderDias();
    if (n === 3) renderReview();
    renderSum();
    var h = root.querySelector('[data-panel="' + n + '"] h3');
    if (h) h.focus({ preventScroll: true });
    var y = root.getBoundingClientRect().top + window.scrollY - 90;
    if (window.scrollY > y) window.scrollTo({ top: y, behavior: 'smooth' });
  }
  next.addEventListener('click', function () { if (!next.disabled) irPara(st.passo + 1); });
  root.querySelectorAll('.bk-back').forEach(function (b) { b.addEventListener('click', function () { irPara(st.passo - 1); }); });

  /* ---------- passo 3: confirmação ---------- */
  function linhas() {
    var t = total();
    return [
      ['Serviços', st.sel.map(function (id) { return porId[id].nome; }).join(' + ')],
      ['Data', fmtData(st.dia)],
      ['Horário', fmtHora(st.hora) + ' às ' + fmtHora(st.hora + t.min)],
      ['Duração estimada', CL.duracao(t.min)],
      ['Valor estimado', (t.aPartir ? 'a partir de ' : '') + CL.preco(t.preco)]
    ];
  }
  function renderReview() {
    review.innerHTML = '';
    linhas().forEach(function (l) {
      var d = el('div'); d.appendChild(el('span', null, l[0])); d.appendChild(el('b', null, l[1])); review.appendChild(d);
    });
  }
  var ultimoLink = '';
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    var f = new FormData(form);
    var msg = ['Olá! Quero agendar no ' + D.nome + ':', ''];
    linhas().forEach(function (l) { msg.push('• ' + l[0] + ': ' + l[1]); });
    msg.push('• Nome: ' + f.get('nome'));
    if (f.get('fone')) msg.push('• WhatsApp: ' + f.get('fone'));
    if (f.get('obs')) msg.push('• Observação: ' + f.get('obs'));
    msg.push('', 'Li e concordo com a política de agendamento.');
    ultimoLink = CL.waLink(msg.join('\n'));
    window.open(ultimoLink, '_blank', 'noopener');
    $('#bk-again').href = ultimoLink;
    irPara(4);
  });
  $('#bk-new').addEventListener('click', function () {
    st.sel = []; st.dia = null; st.hora = null; form.reset();
    renderTabs(); renderList(); irPara(1);
  });

  renderTabs(); renderList(); irPara(1);
})();
