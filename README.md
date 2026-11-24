# Cris Lima Studio – site

Site de uma página do **Cris Lima Studio** (cabelo, unhas, cílios, sobrancelhas e micropigmentação), na Rua Roraima, 1557, Cajuru, em Curitiba.

**Site no ar:** https://studiofindable-lgtm.github.io/cris-lima-studio/

## Estrutura

```
index.html      página (textos, seções, política de agendamento, rodapé)
css/style.css   cores, fontes e animações
js/precos.js    TABELA DE PREÇOS: edite aqui para mudar valores e serviços
js/main.js      monta a tabela, abertura animada, menu e botão do WhatsApp
img/            logo e fotos (formato .webp)
```

## Como editar

- **Preços e serviços:** abra `js/precos.js`. Cada linha é `["Nome", "detalhe", preço]`.
- **Textos e política de agendamento:** abra `index.html`.
- **Fotos:** coloque a nova imagem em `img/` (de preferência `.webp`, 480×640) e troque o nome dela no `index.html`.
- **WhatsApp:** o número aparece nos links `https://wa.me/5541995499770` do `index.html`.

No GitHub, dá para editar direto pelo navegador: abra o arquivo, clique no lápis (✏️), salve com **Commit changes**, e o site se atualiza em cerca de 1 minuto.

## Domínio próprio (opcional)

Para usar um domínio como `crislimastudio.com.br`, vá em **Settings → Pages → Custom domain**. Depois, troque o endereço `https://studiofindable-lgtm.github.io/cris-lima-studio/` em `index.html` (nas tags `canonical`, `og:url`, `og:image` e no bloco `application/ld+json`).
