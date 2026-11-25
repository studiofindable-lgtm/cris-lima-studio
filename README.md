# Cris Lima Studio – site

Site completo do **Cris Lima Studio** (especialista em loiros, cabelo, unhas, cílios, sobrancelhas e micropigmentação), na Rua Roraima, 1557, Cajuru, em Curitiba.

**Site no ar:** https://studiofindable-lgtm.github.io/cris-lima-studio/

## Páginas

| Arquivo | Página |
|---|---|
| `index.html` | Início |
| `loiros.html` | Especialidade em loiros (técnicas, preços, antes e depois, dúvidas) |
| `servicos.html` | Todos os serviços, preços e tempo médio |
| `galeria.html` | Antes e depois + trabalhos |
| `studio.html` | O espaço, horários, estacionamento, produtos, marcas e mapa |
| `agendar.html` | Agendamento online + WhatsApp + política de agendamento |
| `blog.html` e `blog/` | Blog com artigos |
| `404.html` | Página de erro |

## Como editar

- **Preços, serviços, tempo médio e horários:** tudo fica em `js/dados.js`. O site inteiro e a agenda online leem desse arquivo.
  - `min` é o tempo médio do serviço em minutos. A agenda usa esse valor para mostrar só os horários que cabem.
  - Horário atual: terça a sábado, das 9h às 18h (domingo e segunda fechado). Os tempos dos serviços seguem o app de agenda da Cris.
- **Textos das páginas:** edite o arquivo `.html` correspondente.
- **Fotos:** ficam em `img/` (em `.webp`): `trabalho-*` são os trabalhos da galeria, `studio-*` são as fotos do espaço (tiradas do vídeo de tour) e `antes-*` / `depois-*` formam o antes e depois.
- **Vídeos:** ficam em `video/` (`.mp4` sem som). Eles só tocam quando aparecem na tela, para não gastar a internet de quem abre o site pelo celular.
- **Visual (cores e fontes):** `css/style.css`.

No GitHub, dá para editar direto pelo navegador: abra o arquivo, clique no lápis (✏️) e salve com **Commit changes**. O site se atualiza em cerca de 1 minuto.

## Agenda automática

1. A cliente escolhe um ou mais serviços. O tempo e o valor somam na hora.
2. A agenda mostra os próximos 30 dias e só os horários em que o atendimento inteiro cabe no expediente **e não bate com nenhum horário já ocupado**.
3. Ao confirmar, o horário fica reservado no sistema (status *pendente*) e a cliente envia a mensagem pronta no WhatsApp.
4. Se duas clientes escolherem o mesmo horário ao mesmo tempo, o banco aceita só a primeira. A segunda é avisada e escolhe outro horário.

Os links das páginas de serviço já chegam com o serviço marcado, por exemplo `agendar.html?s=truck`.

**Profissionais:** cada profissional tem a própria agenda e atende as categorias listadas em `profissionais` no `js/dados.js`. Na agenda online a cliente escolhe a profissional ou **Sem preferência**. Nesse caso o sistema mostra todos os horários em que alguma profissional da área está livre e reserva com a primeira disponível. O painel mostra quem vai atender e avisa quando a cliente não teve preferência.

Para **adicionar ou renomear uma profissional**:
1. Edite a lista `profissionais` em `js/dados.js` (nome, cargo, categorias e, se quiser, `foto: "img/nome.webp"`).
2. Cadastre o mesmo `id` no banco, no SQL Editor:
   ```sql
   insert into public.cl_agendas (id, nome) values ('ana', 'Ana');
   ```
Um link pode já chegar com a profissional marcada: `agendar.html?p=cris`.

**Banco:** Supabase (projeto da agência). As tabelas usam o prefixo `cl_` e estão documentadas em `supabase/schema.sql`. O site só consegue ver os intervalos ocupados (sem nomes) e pedir horários; o resto exige login no painel.

## Painel do studio

Endereço: `painel.html` (fora do menu e escondido do Google).

- **Agenda do dia**, separada por agenda, com Confirmar, Cancelar, Concluído e um botão de WhatsApp com a confirmação pronta para a cliente.
- **Pedidos pendentes** de todos os dias.
- **Bloquear horário** para folga, almoço ou cliente que marcou por telefone. O horário some do site na hora.

**Dar acesso a alguém:**
1. No Supabase, vá em **Authentication → Users → Add user** e crie o usuário com e-mail e senha.
2. Rode no SQL Editor (trocando o e-mail):
   ```sql
   insert into public.cl_admins (user_id)
   select id from auth.users where email = 'email-da-cris@exemplo.com';
   ```
Quem entra no painel sem estar nessa lista vê a mensagem "Usuário sem permissão".

## Domínio próprio

Em **Settings → Pages → Custom domain**, informe o domínio (por exemplo, `crislimastudio.com.br`). Depois, troque `https://studiofindable-lgtm.github.io/cris-lima-studio/` pelo novo endereço nos arquivos `.html`, no `sitemap.xml` e no `robots.txt`.
