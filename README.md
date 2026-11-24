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
  - Quando os horários estiverem confirmados, troque `horariosConfirmados: false` por `true` para tirar o aviso.
- **Textos das páginas:** edite o arquivo `.html` correspondente.
- **Fotos:** coloque em `img/` (de preferência `.webp`). Os quadros escritos "Foto em breve" são os lugares reservados para as fotos do espaço e do antes e depois.
- **Visual (cores e fontes):** `css/style.css`.

No GitHub, dá para editar direto pelo navegador: abra o arquivo, clique no lápis (✏️) e salve com **Commit changes**. O site se atualiza em cerca de 1 minuto.

## Como funciona o agendamento online

1. A cliente escolhe um ou mais serviços. O tempo e o valor somam na hora.
2. A agenda mostra os próximos 30 dias e só os horários em que o atendimento inteiro cabe dentro do expediente.
3. Ao confirmar, o WhatsApp abre com a mensagem pronta (serviços, data, horário, duração, valor e nome).

Os links das páginas de serviço já chegam com o serviço marcado, por exemplo `agendar.html?s=truck`.

**Próxima etapa (agenda automática):** para bloquear sozinho os horários já ocupados, é preciso ligar a agenda a um banco de dados (por exemplo, Supabase ou Google Agenda).

## Domínio próprio

Em **Settings → Pages → Custom domain**, informe o domínio (por exemplo, `crislimastudio.com.br`). Depois, troque `https://studiofindable-lgtm.github.io/cris-lima-studio/` pelo novo endereço nos arquivos `.html`, no `sitemap.xml` e no `robots.txt`.
