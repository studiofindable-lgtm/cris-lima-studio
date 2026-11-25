-- =====================================================================
-- Cris Lima Studio – agenda automática (Supabase / Postgres)
-- Todas as tabelas e funções usam o prefixo cl_ para conviver com outros
-- sistemas no mesmo projeto Supabase.
--
-- agendas       cada profissional que atende em paralelo (ids iguais aos de js/dados.js)
-- agendamentos  pedidos feitos pelo site (pendente → confirmado → concluído)
-- ocupacoes     intervalos ocupados em cada agenda; o banco impede dois
--               horários sobrepostos na mesma agenda (constraint EXCLUDE)
-- admins        usuários do painel do studio
--
-- O site público só consegue:
--   • ver os intervalos ocupados (sem nome nem telefone)  → horarios_ocupados()
--   • pedir um horário livre                              → solicitar_agendamento()
-- Todo o resto exige login de administrador no painel.
-- =====================================================================

create extension if not exists btree_gist with schema extensions;

create table public.cl_agendas (
  id   text primary key,
  nome text not null
);
insert into public.cl_agendas (id, nome) values
  ('cris',  'Cris Lima'),
  ('prof2', 'Profissional de unhas'),
  ('prof3', 'Profissional de cílios e sobrancelhas');

create table public.cl_agendamentos (
  id         uuid primary key default gen_random_uuid(),
  criado_em  timestamptz not null default now(),
  inicio     timestamptz not null,
  fim        timestamptz not null,
  servicos   text[] not null,
  descricao  text not null,
  agendas    text[] not null,
  valor      numeric(10,2),
  nome       text not null,
  telefone   text,
  obs        text,
  origem     text not null default 'site',
  sem_preferencia boolean not null default false,  -- cliente escolheu "sem preferência"
  status     text not null default 'pendente'
             check (status in ('pendente', 'confirmado', 'cancelado', 'concluido')),
  constraint cl_agendamentos_periodo_valido check (fim > inicio)
);
create index cl_agendamentos_inicio_idx on public.cl_agendamentos (inicio);

create table public.cl_ocupacoes (
  id             bigint generated always as identity primary key,
  agendamento_id uuid references public.cl_agendamentos (id) on delete cascade,
  agenda         text not null references public.cl_agendas (id),
  periodo        tstzrange not null,
  ativo          boolean not null default true,
  motivo         text,
  criado_em      timestamptz not null default now(),
  constraint cl_ocupacoes_sem_conflito
    exclude using gist (agenda with =, periodo with &&) where (ativo)
);
create index cl_ocupacoes_agendamento_idx on public.cl_ocupacoes (agendamento_id);

create table public.cl_admins (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Segurança (RLS): só administradores leem e alteram as tabelas
-- ---------------------------------------------------------------------
alter table public.cl_agendas      enable row level security;
alter table public.cl_agendamentos enable row level security;
alter table public.cl_ocupacoes    enable row level security;
alter table public.cl_admins       enable row level security;

create or replace function public.cl_eh_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.cl_admins a where a.user_id = (select auth.uid()));
$$;

create policy "agendas: leitura pública" on public.cl_agendas
  for select to anon, authenticated using (true);
create policy "agendas: admin altera" on public.cl_agendas
  for all to authenticated using ((select public.cl_eh_admin())) with check ((select public.cl_eh_admin()));

create policy "agendamentos: admin" on public.cl_agendamentos
  for all to authenticated using ((select public.cl_eh_admin())) with check ((select public.cl_eh_admin()));

create policy "ocupacoes: admin" on public.cl_ocupacoes
  for all to authenticated using ((select public.cl_eh_admin())) with check ((select public.cl_eh_admin()));

create policy "admins: vê o próprio registro" on public.cl_admins
  for select to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- Mantém as ocupações em dia quando o status ou o horário muda
-- ---------------------------------------------------------------------
create or replace function public.cl_sincroniza_ocupacoes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    update public.cl_ocupacoes
       set ativo = new.status <> 'cancelado'
     where agendamento_id = new.id;
  end if;
  if new.inicio is distinct from old.inicio or new.fim is distinct from old.fim then
    update public.cl_ocupacoes
       set periodo = tstzrange(new.inicio, new.fim)
     where agendamento_id = new.id;
  end if;
  return new;
end;
$$;

create trigger cl_agendamentos_sincroniza
  after update of status, inicio, fim on public.cl_agendamentos
  for each row execute function public.cl_sincroniza_ocupacoes();

-- ---------------------------------------------------------------------
-- Funções públicas usadas pelo site
-- ---------------------------------------------------------------------

-- Intervalos ocupados (sem dados pessoais) para montar a agenda.
create or replace function public.cl_horarios_ocupados(p_de timestamptz, p_ate timestamptz)
returns table (agenda text, inicio timestamptz, fim timestamptz)
language sql stable security definer
set search_path = ''
as $$
  select o.agenda, lower(o.periodo), upper(o.periodo)
    from public.cl_ocupacoes o
   where o.ativo
     and o.periodo && tstzrange(p_de, least(p_ate, p_de + interval '62 days'));
$$;

-- Registra um pedido de horário. Falha com HORARIO_OCUPADO se alguém
-- reservou o mesmo intervalo antes (o banco garante, sem corrida).
create or replace function public.cl_solicitar_agendamento(
  p_inicio       timestamptz,
  p_duracao_min  integer,
  p_servicos     text[],
  p_descricao    text,
  p_agendas      text[],
  p_valor        numeric,
  p_nome         text,
  p_telefone     text default null,
  p_obs          text default null,
  p_sem_preferencia boolean default false
)
returns uuid
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  v_id  uuid;
  v_fim timestamptz;
  v_ag  text;
begin
  if p_inicio is null or p_inicio < now() or p_inicio > now() + interval '62 days' then
    raise exception 'DATA_INVALIDA';
  end if;
  if p_duracao_min is null or p_duracao_min < 10 or p_duracao_min > 720 then
    raise exception 'DURACAO_INVALIDA';
  end if;
  if coalesce(array_length(p_servicos, 1), 0) not between 1 and 12
     or coalesce(array_length(p_agendas, 1), 0) not between 1 and 5 then
    raise exception 'SERVICOS_INVALIDOS';
  end if;
  if exists (select 1 from unnest(p_agendas) x where x not in (select id from public.cl_agendas)) then
    raise exception 'AGENDA_INVALIDA';
  end if;
  if char_length(btrim(coalesce(p_nome, ''))) not between 2 and 80
     or char_length(coalesce(p_telefone, '')) > 30
     or char_length(coalesce(p_obs, '')) > 500
     or char_length(coalesce(p_descricao, '')) > 600 then
    raise exception 'DADOS_INVALIDOS';
  end if;
  -- proteção simples contra excesso de pedidos automáticos
  if (select count(*) from public.cl_agendamentos
       where origem = 'site' and criado_em > now() - interval '1 hour') >= 30 then
    raise exception 'MUITOS_PEDIDOS';
  end if;

  v_fim := p_inicio + make_interval(mins => p_duracao_min);

  insert into public.cl_agendamentos (inicio, fim, servicos, descricao, agendas, valor, nome, telefone, obs, sem_preferencia)
  values (p_inicio, v_fim, p_servicos, p_descricao, p_agendas, p_valor,
          btrim(p_nome), nullif(btrim(p_telefone), ''), nullif(btrim(p_obs), ''), coalesce(p_sem_preferencia, false))
  returning id into v_id;

  for v_ag in select distinct x from unnest(p_agendas) x loop
    insert into public.cl_ocupacoes (agendamento_id, agenda, periodo)
    values (v_id, v_ag, tstzrange(p_inicio, v_fim));
  end loop;

  return v_id;
exception
  when exclusion_violation then
    raise exception 'HORARIO_OCUPADO';
end;
$$;

revoke execute on function public.cl_horarios_ocupados(timestamptz, timestamptz) from public;
revoke execute on function public.cl_solicitar_agendamento(timestamptz, integer, text[], text, text[], numeric, text, text, text, boolean) from public;
grant execute on function public.cl_horarios_ocupados(timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.cl_solicitar_agendamento(timestamptz, integer, text[], text, text[], numeric, text, text, text, boolean) to anon, authenticated;
revoke execute on function public.cl_eh_admin() from public, anon;
grant execute on function public.cl_eh_admin() to authenticated;
revoke execute on function public.cl_sincroniza_ocupacoes() from public, anon, authenticated;
