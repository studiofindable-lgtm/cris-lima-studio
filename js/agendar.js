/* Cris Lima Studio – agendamento online
   1. A cliente escolhe os serviços (o tempo e o valor somam).
   2. A agenda mostra só os horários em que o atendimento cabe inteiro,
      dentro do expediente e sem bater com horários já ocupados.
   3. O pedido fica reservado no sistema (se a agenda automática estiver
      ligada em js/dados.js) e a mensagem segue pronta para o WhatsApp.
   Todos os horários são calculados no fuso do studio (Curitiba). */
(function () {
  var root = document.getElementById('bk');
  if (!root) return;
  var D = window.DADOS, CL = window.CL, el = CL.el;
  var FUSO = D.fusoMin || -180;
  var SB = D.supabase && D.supabase.url && D.supabase.chave ? D.supabase : null;

  var todos = CL.servicos();
  var porId = {}, agendaDaCat = {};
  D.categorias.forEach(function (c) { agendaDaCat[c.id] = c.agenda || 'geral'; });
  todos.forEach(function (s) { s.agenda = agendaDaCat[s.cat]; porId[s.id] = s; });

  var DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  var DIAS_LONGO = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  // dia = minuto (no relógio do studio) da meia-noite daquele dia
  var st = { sel: [], tab: D.categorias[0].id, dia: null, hora: null, passo: 1, ocupado: [], agendaOk: !SB, pedido: null };

  var q = new URLSearchParams(location.search).get('s');
  if (q) q.split(',').forEach(function (id) {
    if (porId[id] && st.sel.indexOf(id) === -1) { if (!st.sel.length) st.tab = porId[id].cat; st.sel.push(id); }
  });

  var $ = function (s) { return root.querySelector(s); };
  var tabs = $('.bk-tabs'), list = $('.bk-list'), sum = $('.bk-sum .s'), next = $('#bk-next');
  var daysBox = $('.bk-days'), monthBox = $('.bk-month'), timesBox = $('.bk-times');
  var form = $('.bk-form'), review = $('.bk-review'), erro = $('.bk-err'), enviar = $('#bk-send');

  /* ---------- tempo no relógio do studio ---------- */
  function agoraStudio() { return Math.floor(Date.now() / 60000) + FUSO; }
  function partes(diaMin) { return new Date(diaMin * 60000); }   // ler com getUTC*
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmtHora(m) { m = ((m % 1440) + 1440) % 1440; return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
  function fmtData(diaMin) { var d = partes(diaMin); return DIAS_LONGO[d.getUTCDay()] + ', ' + d.getUTCDate() + ' de ' + MESES[d.getUTCMonth()]; }
  function fmtCurta(diaMin) { var d = partes(diaMin); return pad(d.getUTCDate()) + '/' + pad(d.getUTCMonth() + 1); }
  function offsetIso() { var a = Math.abs(FUSO); return (FUSO <= 0 ? '-' : '+') + pad(Math.floor(a / 60)) + ':' + pad(a % 60); }
  function iso(diaMin, m) { var d = partes(diaMin); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + fmtHora(m) + ':00' + offsetIso(); }
  function hm(str) { var p = str.split(':'); return +p[0] * 60 + +p[1]; }

  function total() {
    var min = 0, preco = 0, aPartir = false, ags = [];
    st.sel.forEach(function (id) {
      var s = porId[id]; min += s.min; preco += s.preco;
      if (s.aPartir) aPartir = true;
      if (ags.indexOf(s.agenda) === -1) ags.push(s.agenda);
    });
    return { min: min, preco: preco, aPartir: aPartir, agendas: ags };
  }

  /* ---------- API da agenda automática ---------- */
  function rpc(nome, corpo) {
    return fetch(SB.url.replace(/\/$/, '') + '/rest/v1/rpc/' + nome, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SB.chave },
      body: JSON.stringify(corpo)
    }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (j) {
        if (!r.ok) { var e = new Error((j && j.message) || 'ERRO_' + r.status); throw e; }
        return j;
      });
    });
  }
  function carregarOcupados() {
    if (!SB) return Promise.resolve();
    var de = new Date(), ate = new Date(Date.now() + ((D.diasAgenda || 30) + 1) * 864e5);
    return rpc('cl_horarios_ocupados', { p_de: de.toISOString(), p_ate: ate.toISOString() }).then(function (rows) {
      st.ocupado = (rows || []).map(function (r) {
        return { agenda: r.agenda, ini: Math.floor(Date.parse(r.inicio) / 60000) + FUSO, fim: Math.ceil(Date.parse(r.fim) / 60000) + FUSO };
      });
      st.agendaOk = true;
    }).catch(function () { st.ocupado = []; st.agendaOk = false; });
  }

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
  function slotsDoDia(dia) {
    var h = D.horarios[partes(dia).getUTCDay()];
    if (!h) return [];
    var t = total(), dur = t.min, abre = hm(h[0]), fecha = hm(h[1]), passo = D.passoAgendaMin || 30;
    var minimo = agoraStudio() + (D.antecedenciaHoras || 0) * 60;
    var ocup = st.ocupado.filter(function (o) { return t.agendas.indexOf(o.agenda) !== -1; });
    var out = [];
    for (var m = abre; m + dur <= fecha; m += passo) {
      var ini = dia + m, fim = ini + dur;
      if (ini < minimo) continue;
      var bate = ocup.some(function (o) { return ini < o.fim && fim > o.ini; });
      if (!bate) out.push(m);
    }
    return out;
  }
  function renderDias() {
    daysBox.innerHTML = '';
    var hoje = Math.floor(agoraStudio() / 1440) * 1440;
    var primeiro = null;
    for (var i = 0; i < (D.diasAgenda || 30); i++) {
      var dia = hoje + i * 1440, d = partes(dia);
      var livre = slotsDoDia(dia).length > 0;
      if (livre && primeiro === null) primeiro = dia;
      var b = el('button', 'bk-day');
      b.type = 'button';
      b.disabled = !livre;
      b.appendChild(el('small', null, i === 0 ? 'hoje' : i === 1 ? 'amanhã' : DIAS[d.getUTCDay()]));
      b.appendChild(el('b', null, String(d.getUTCDate())));
      b.appendChild(el('small', null, MESES[d.getUTCMonth()].slice(0, 3)));
      b.setAttribute('aria-label', fmtData(dia) + (livre ? '' : ' (sem horários)'));
      b._dia = dia;
      b.addEventListener('click', function () { st.dia = this._dia; st.hora = null; marcarDia(); renderHoras(); renderSum(); });
      daysBox.appendChild(b);
    }
    if (st.dia === null || !slotsDoDia(st.dia).length) { st.dia = primeiro; st.hora = null; }
    marcarDia();
    renderHoras();
  }
  function marcarDia() {
    daysBox.querySelectorAll('.bk-day').forEach(function (b) {
      var on = b._dia === st.dia;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) daysBox.scrollTo({ left: b.offsetLeft - 8, behavior: 'smooth' });
    });
    if (st.dia === null) { monthBox.textContent = ''; return; }
    var d = partes(st.dia), mes = MESES[d.getUTCMonth()];
    monthBox.textContent = mes[0].toUpperCase() + mes.slice(1) + ' ' + d.getUTCFullYear();
  }
  function renderHoras() {
    timesBox.innerHTML = '';
    if (st.aviso) { timesBox.appendChild(el('p', 'bk-err', st.aviso)); st.aviso = null; }
    if (!st.agendaOk && SB) {
      timesBox.appendChild(el('p', 'bk-warn', 'Não conseguimos consultar a agenda agora. Escolha um horário e a gente confirma a disponibilidade pelo WhatsApp.'));
    }
    if (st.dia === null) {
      timesBox.appendChild(el('div', 'bk-empty', 'Não encontramos um dia em que o atendimento caiba inteiro na agenda. Fale com a gente no WhatsApp que encontramos um horário para você.'));
      return;
    }
    var slots = slotsDoDia(st.dia), dur = total().min;
    [['Manhã', 0, 720], ['Tarde', 720, 1080], ['Noite', 1080, 1440]].forEach(function (p) {
      var ss = slots.filter(function (m) { return m >= p[1] && m < p[2]; });
      if (!ss.length) return;
      var box = el('div', 'bk-period');
      box.appendChild(el('h4', null, p[0]));
      var grid = el('div', 'bk-slots');
      ss.forEach(function (m) {
        var b = el('button', 'bk-slot', fmtHora(m));
        b.type = 'button';
        b.setAttribute('aria-pressed', st.hora === m ? 'true' : 'false');
        b.setAttribute('aria-label', fmtHora(m) + ' até ' + fmtHora(m + dur));
        b.addEventListener('click', function () {
          st.hora = m;
          timesBox.querySelectorAll('.bk-slot').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true');
          renderSum();
        });
        grid.appendChild(b);
      });
      box.appendChild(grid);
      timesBox.appendChild(box);
    });
  }
  function carregarPasso2() {
    daysBox.innerHTML = ''; monthBox.textContent = '';
    timesBox.innerHTML = '';
    if (SB) timesBox.appendChild(el('div', 'bk-empty', 'Consultando os horários livres…'));
    next.disabled = true;
    return carregarOcupados().then(function () { if (st.passo === 2) { renderDias(); renderSum(); } });
  }

  /* ---------- resumo e navegação ---------- */
  function renderSum() {
    var t = total();
    sum.innerHTML = '';
    if (st.passo === 1) {
      if (!st.sel.length) sum.textContent = 'Escolha pelo menos um serviço';
      else {
        sum.appendChild(el('b', null, st.sel.length + (st.sel.length > 1 ? ' serviços' : ' serviço')));
        sum.appendChild(document.createTextNode(' · ⏱ ' + CL.duracao(t.min) + ' · ' + (t.aPartir ? 'a partir de' : '')));
        sum.appendChild(el('strong', null, CL.preco(t.preco)));
      }
      next.disabled = !st.sel.length;
    } else if (st.passo === 2) {
      if (st.dia !== null && st.hora !== null) {
        sum.appendChild(el('b', null, fmtData(st.dia)));
        sum.appendChild(document.createTextNode(' · ' + fmtHora(st.hora) + ' às ' + fmtHora(st.hora + t.min)));
      } else sum.textContent = 'Escolha o dia e o horário';
      next.disabled = !(st.dia !== null && st.hora !== null);
    }
  }
  function irPara(n) {
    st.passo = n;
    root.querySelectorAll('[data-panel]').forEach(function (p) { p.hidden = +p.getAttribute('data-panel') !== n; });
    root.querySelectorAll('.bk-steps li').forEach(function (li) {
      var k = +li.getAttribute('data-step');
      li.classList.toggle('on', k === n || (n === 4 && k === 3));
      li.classList.toggle('done', k < n);
      if (k === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    $('.bk-sum').hidden = n > 2;
    if (n === 2) carregarPasso2();
    if (n === 3) { renderReview(); erro.hidden = true; }
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
  function mensagem(f, pedido) {
    var msg = [(pedido ? 'Olá! Acabei de reservar um horário pelo site do ' : 'Olá! Quero agendar no ') + D.nome + ':', ''];
    if (pedido) msg.push('• Pedido: #' + pedido);
    linhas().forEach(function (l) { msg.push('• ' + l[0] + ': ' + l[1]); });
    msg.push('• Nome: ' + f.get('nome'));
    if (f.get('fone')) msg.push('• WhatsApp: ' + f.get('fone'));
    if (f.get('obs')) msg.push('• Observação: ' + f.get('obs'));
    msg.push('', 'Li e concordo com a política de agendamento.');
    return msg.join('\n');
  }
  function concluir(f, pedido) {
    var link = CL.waLink(mensagem(f, pedido));
    $('#bk-again').href = link;
    $('#bk-done-title').textContent = pedido ? 'Horário reservado!' : 'Quase lá!';
    $('#bk-done-text').textContent = pedido
      ? 'Seu horário de ' + fmtData(st.dia) + ', às ' + fmtHora(st.hora) + ', ficou guardado para você (pedido #' + pedido + '). Agora envie a mensagem no WhatsApp para a gente confirmar e combinar a reserva de 30%.'
      : 'Envie a mensagem no WhatsApp para a gente confirmar o seu horário de ' + fmtData(st.dia) + ', às ' + fmtHora(st.hora) + '.';
    irPara(4);
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    var f = new FormData(form);
    erro.hidden = true;
    if (!SB) { concluir(f, null); return; }

    var t = total();
    enviar.disabled = true;
    var rotulo = enviar.innerHTML;
    enviar.textContent = 'Reservando…';
    rpc('cl_solicitar_agendamento', {
      p_inicio: iso(st.dia, st.hora),
      p_duracao_min: t.min,
      p_servicos: st.sel.slice(),
      p_descricao: st.sel.map(function (id) { return porId[id].nome; }).join(' + '),
      p_agendas: t.agendas,
      p_valor: t.preco,
      p_nome: String(f.get('nome') || ''),
      p_telefone: String(f.get('fone') || ''),
      p_obs: String(f.get('obs') || '')
    }).then(function (id) {
      concluir(f, String(id).slice(0, 6).toUpperCase());
    }).catch(function (err) {
      var m = String(err && err.message || '');
      if (m.indexOf('HORARIO_OCUPADO') !== -1) {
        st.aviso = 'Poxa, esse horário acabou de ser reservado por outra cliente. Escolha outro horário, por favor.';
        st.hora = null;
        irPara(2);
      } else if (m.indexOf('MUITOS_PEDIDOS') !== -1 || m.indexOf('DATA_INVALIDA') !== -1) {
        erro.textContent = 'Não conseguimos reservar esse horário agora. Toque em enviar de novo para mandar o pedido pelo WhatsApp.';
        erro.hidden = false;
        SB = null;
      } else {
        // sem conexão com a agenda: segue pelo WhatsApp
        concluir(f, null);
      }
    }).then(function () { enviar.disabled = false; enviar.innerHTML = rotulo; });
  });
  $('#bk-new').addEventListener('click', function () {
    st.sel = []; st.dia = null; st.hora = null; form.reset();
    renderTabs(); renderList(); irPara(1);
  });

  renderTabs(); renderList(); irPara(1);
})();
