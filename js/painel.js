/* Cris Lima Studio – painel da agenda (área restrita) */
(function () {
  var D = window.DADOS, CL = window.CL, el = CL.el;
  var FUSO = D.fusoMin || -180;
  var $ = function (s) { return document.querySelector(s); };
  var views = ['login', 'config', 'negado', 'app'];
  function mostrar(v) { views.forEach(function (x) { $('#v-' + x).hidden = x !== v; }); }

  if (!D.supabase || !D.supabase.url || !D.supabase.chave || !window.supabase) { mostrar('config'); return; }
  var sb = window.supabase.createClient(D.supabase.url, D.supabase.chave);

  /* ---------- datas no fuso do studio ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function agoraStudio() { return Math.floor(Date.now() / 60000) + FUSO; }
  function minStudio(isoStr) { return Math.round(Date.parse(isoStr) / 60000) + FUSO; }
  function fmtHora(m) { m = ((m % 1440) + 1440) % 1440; return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
  function chave(dia) { var d = new Date(dia * 60000); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }
  function offsetIso() { var a = Math.abs(FUSO); return (FUSO <= 0 ? '-' : '+') + pad(Math.floor(a / 60)) + ':' + pad(a % 60); }
  function isoDe(dataStr, horaStr) { return dataStr + 'T' + horaStr + ':00' + offsetIso(); }
  function diaDe(dataStr) { var p = dataStr.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]) / 60000; }
  var SEM = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  var MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  function fmtDia(dia) { var d = new Date(dia * 60000); return SEM[d.getUTCDay()] + ', ' + d.getUTCDate() + ' ' + MES[d.getUTCMonth()]; }

  var hoje = Math.floor(agoraStudio() / 1440) * 1440;
  var st = { dia: hoje, tab: 'dia' };

  function aviso(txt, tipo) {
    var m = $('#msg');
    m.textContent = txt; m.className = 'pn-msg ' + (tipo || 'ok'); m.hidden = !txt;
    if (txt) setTimeout(function () { if (m.textContent === txt) m.hidden = true; }, 5000);
  }
  function erroTxt(e) {
    var s = String((e && (e.message || e.code)) || e);
    if (/23P01|ocupacoes_sem_conflito|HORARIO_OCUPADO/.test(s)) return 'Já existe um horário ocupado nesse intervalo.';
    return 'Não foi possível salvar: ' + s;
  }

  /* ---------- login ---------- */
  $('#f-login').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = new FormData(e.target), err = $('#login-err');
    err.hidden = true;
    sb.auth.signInWithPassword({ email: f.get('email'), password: f.get('senha') }).then(function (r) {
      if (r.error) { err.textContent = 'E-mail ou senha incorretos.'; err.hidden = false; return; }
      iniciar(r.data.session);
    });
  });
  $('#sair').addEventListener('click', function () { sb.auth.signOut().then(function () { location.reload(); }); });

  function iniciar(sessao) {
    if (!sessao) { mostrar('login'); $('#sair').hidden = true; $('#who').textContent = ''; return; }
    $('#who').textContent = sessao.user.email || '';
    $('#sair').hidden = false;
    sb.from('cl_admins').select('user_id').eq('user_id', sessao.user.id).maybeSingle().then(function (r) {
      if (!r.data) { $('#uid').textContent = sessao.user.id; mostrar('negado'); return; }
      mostrar('app');
      montarApp();
    });
  }
  sb.auth.getSession().then(function (r) { iniciar(r.data.session); });

  /* ---------- app ---------- */
  var montado = false;
  function montarApp() {
    if (montado) return; montado = true;
    document.querySelectorAll('.pn-tabs button').forEach(function (b) {
      b.addEventListener('click', function () { trocarTab(b.getAttribute('data-tab')); });
    });
    $('#dia-ant').addEventListener('click', function () { st.dia -= 1440; carregarDia(); });
    $('#dia-prox').addEventListener('click', function () { st.dia += 1440; carregarDia(); });
    $('#dia-hoje').addEventListener('click', function () { st.dia = hoje; carregarDia(); });
    $('#dia-escolher').addEventListener('change', function (e) { if (e.target.value) { st.dia = diaDe(e.target.value); carregarDia(); } });

    var sel = $('#bloq-agenda');
    sel.appendChild(new Option('Todas as agendas', '*'));
    Object.keys(D.agendas).forEach(function (k) { sel.appendChild(new Option(D.agendas[k], k)); });
    $('#f-bloq').addEventListener('submit', bloquear);

    carregarDia(); carregarPendentes();
    setInterval(function () { if (!document.hidden) { carregarDia(); carregarPendentes(); } }, 60000);
  }
  function trocarTab(t) {
    st.tab = t;
    document.querySelectorAll('.pn-tabs button').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-tab') === t ? 'true' : 'false'); });
    document.querySelectorAll('[data-view]').forEach(function (v) { v.hidden = v.getAttribute('data-view') !== t; });
    if (t === 'pend') carregarPendentes();
  }

  function waCliente(a, texto) {
    var dig = String(a.telefone || '').replace(/\D/g, '');
    if (!dig) return null;
    if (dig.length <= 11) dig = '55' + dig;
    return 'https://wa.me/' + dig + '?text=' + encodeURIComponent(texto);
  }
  function mudarStatus(a, status) {
    if (status === 'cancelado' && !confirm('Cancelar o horário de ' + a.nome + '? O horário volta a ficar livre no site.')) return;
    sb.from('cl_agendamentos').update({ status: status }).eq('id', a.id).then(function (r) {
      if (r.error) { aviso(erroTxt(r.error), 'err'); return; }
      aviso('Agendamento de ' + a.nome + ' marcado como ' + status + '.');
      carregarDia(); carregarPendentes();
    });
  }

  function cardAgendamento(a) {
    var ini = minStudio(a.inicio), fim = minStudio(a.fim);
    var c = el('div', 'pn-item ' + a.status);
    var h = el('div', 'h');
    h.appendChild(el('b', null, fmtHora(ini) + ' – ' + fmtHora(fim)));
    h.appendChild(el('span', 'pn-pill ' + a.status, a.status));
    c.appendChild(h);
    c.appendChild(el('div', 'n', a.nome + (a.telefone ? ' · ' + a.telefone : '')));
    c.appendChild(el('div', 's', a.descricao + (a.valor != null ? ' · ' + CL.preco(a.valor) : '')));
    if (a.obs) c.appendChild(el('div', 's', '“' + a.obs + '”'));
    c.appendChild(el('div', 's', 'Pedido #' + a.id.slice(0, 6).toUpperCase() + ' · via ' + a.origem));
    var acts = el('div', 'acts');
    function btn(txt, cls, fn) { var b = el('button', cls, txt); b.type = 'button'; b.addEventListener('click', fn); acts.appendChild(b); }
    if (a.status === 'pendente') btn('Confirmar', 'ok', function () { mudarStatus(a, 'confirmado'); });
    if (a.status === 'confirmado') btn('Concluído', 'ok', function () { mudarStatus(a, 'concluido'); });
    if (a.status === 'pendente' || a.status === 'confirmado') btn('Cancelar', '', function () { mudarStatus(a, 'cancelado'); });
    if (a.status === 'cancelado') btn('Reativar', '', function () { mudarStatus(a, 'pendente'); });
    var dia = Math.floor(ini / 1440) * 1440;
    var link = waCliente(a, 'Olá, ' + a.nome.split(' ')[0] + '! Seu horário no ' + D.nome + ' está confirmado: ' + fmtDia(dia) + ', às ' + fmtHora(ini) + ' (' + a.descricao + '). Te esperamos! 💕');
    if (link) { var w = el('a', 'wa', 'WhatsApp'); w.href = link; w.target = '_blank'; w.rel = 'noopener'; acts.appendChild(w); }
    c.appendChild(acts);
    return c;
  }
  function cardBloqueio(o) {
    var r = o.periodo.replace(/[\[\]()"]/g, '').split(',');
    var c = el('div', 'pn-item bloqueio');
    var h = el('div', 'h');
    h.appendChild(el('b', null, fmtHora(minStudio(r[0])) + ' – ' + fmtHora(minStudio(r[1]))));
    h.appendChild(el('span', 'pn-pill', 'bloqueado'));
    c.appendChild(h);
    c.appendChild(el('div', 'n', o.motivo || 'Horário bloqueado'));
    var acts = el('div', 'acts');
    var b = el('button', null, 'Liberar'); b.type = 'button';
    b.addEventListener('click', function () {
      if (!confirm('Liberar este horário?')) return;
      sb.from('cl_ocupacoes').delete().eq('id', o.id).then(function (x) {
        if (x.error) { aviso(erroTxt(x.error), 'err'); return; }
        aviso('Horário liberado.'); carregarDia();
      });
    });
    acts.appendChild(b); c.appendChild(acts);
    return c;
  }

  function carregarDia() {
    var k = chave(st.dia), k2 = chave(st.dia + 1440);
    var de = isoDe(k, '00:00'), ate = isoDe(k2, '00:00');
    $('#dia-titulo').textContent = (st.dia === hoje ? 'Hoje, ' : '') + fmtDia(st.dia);
    $('#dia-escolher').value = k;
    Promise.all([
      sb.from('cl_agendamentos').select('*').lt('inicio', ate).gt('fim', de).order('inicio'),
      sb.from('cl_ocupacoes').select('id, agenda, periodo, motivo').is('agendamento_id', null).eq('ativo', true).filter('periodo', 'ov', '[' + de + ',' + ate + ')')
    ]).then(function (res) {
      if (res[0].error || res[1].error) { aviso(erroTxt(res[0].error || res[1].error), 'err'); return; }
      var cols = $('#cols'); cols.innerHTML = '';
      Object.keys(D.agendas).forEach(function (ag) {
        var col = el('div', 'pn-col');
        col.appendChild(el('h3', null, D.agendas[ag]));
        var itens = [];
        res[0].data.filter(function (a) { return a.agendas.indexOf(ag) !== -1; }).forEach(function (a) { itens.push([minStudio(a.inicio), cardAgendamento(a)]); });
        res[1].data.filter(function (o) { return o.agenda === ag; }).forEach(function (o) {
          itens.push([minStudio(o.periodo.replace(/[\[\]()"]/g, '').split(',')[0]), cardBloqueio(o)]);
        });
        itens.sort(function (x, y) { return x[0] - y[0]; });
        if (!itens.length) col.appendChild(el('div', 'pn-empty', 'Nenhum horário ocupado.'));
        itens.forEach(function (i) { col.appendChild(i[1]); });
        cols.appendChild(col);
      });
    });
  }

  function carregarPendentes() {
    sb.from('cl_agendamentos').select('*').eq('status', 'pendente').gte('fim', new Date().toISOString()).order('inicio').then(function (r) {
      if (r.error) return;
      $('#ct-pend').textContent = r.data.length;
      var box = $('#pend'); box.innerHTML = '';
      if (!r.data.length) { box.appendChild(el('div', 'pn-empty', 'Nenhum pedido aguardando confirmação. 🎉')); return; }
      var ultimo = null;
      r.data.forEach(function (a) {
        var dia = Math.floor(minStudio(a.inicio) / 1440) * 1440;
        if (dia !== ultimo) { box.appendChild(el('div', 'd', fmtDia(dia))); ultimo = dia; }
        box.appendChild(cardAgendamento(a));
      });
    });
  }

  function bloquear(e) {
    e.preventDefault();
    var f = new FormData(e.target);
    var ini = isoDe(f.get('data'), f.get('ini')), fim = isoDe(f.get('data'), f.get('fim'));
    if (Date.parse(fim) <= Date.parse(ini)) { aviso('O fim precisa ser depois do início.', 'err'); return; }
    var ags = f.get('agenda') === '*' ? Object.keys(D.agendas) : [f.get('agenda')];
    var linhas = ags.map(function (ag) { return { agenda: ag, periodo: '[' + ini + ',' + fim + ')', motivo: f.get('motivo') || null }; });
    sb.from('cl_ocupacoes').insert(linhas).then(function (r) {
      if (r.error) { aviso(erroTxt(r.error), 'err'); return; }
      aviso('Horário bloqueado.');
      e.target.reset();
      st.dia = diaDe(f.get('data')); trocarTab('dia'); carregarDia();
    });
  }
})();
