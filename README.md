# gaffe.pt

Site estático (HTML, CSS e JS). Os textos vivem em `content/*.json` e são editados pela equipa no
[Pages CMS](https://pagescms.org); um build pequeno (`build.mjs`, sem dependências) mete-os na página.

Para ver localmente:

```bash
node build.mjs
```

```bash
python -m http.server 5180 --directory _site
```

e abrir http://localhost:5180.

## Estrutura

- `src/index.html` — o modelo da página (home, história, What we make, About e os 3 cases feitos à medida).
  `{{pagina.secao.campo}}` mete um texto, `{{=…}}` o mesmo em atributos, `{{> nome}}` uma parte gerada
- `content/*.json` — os textos, um ficheiro por página e arrumados por secção; é isto que o Pages CMS edita
- `content/projetos.json` — a lista de projetos (ordem, nome, frase, imagem do preview, estado) e, nos projetos
  novos, a página feita com blocos (secção, óbvio vs gaffe, citação, números, texto, imagem, galeria)
- `content/servicos.json` — inclui a lista de serviços do What we make
- `.pages.yml` — o que aparece no Pages CMS (nomes, descrições e tipos de bloco)
- `build.mjs` — gera `_site/`: textos, lista de projetos, lista de serviços e páginas dos projetos novos; falha se faltar algum texto
- `css/style.css`, `js/main.js`, `img/` — estilos, comportamento e imagens

Nos textos dá para escrever `==palavra==` (sublinhado amarelo), `~~palavra~~` (riscado vermelho) e `**palavra**` (negrito);
Enter muda de linha e uma linha em branco começa um parágrafo novo.

Os projetos `ara`, `sanjo` e `aquainn` têm páginas feitas à medida em `src/index.html`; os outros são gerados a partir dos blocos.
Um bloco novo faz-se em três sítios: o tipo no `.pages.yml`, a função em `BLOCKS` no `build.mjs` e, se precisar, CSS.

## Back office (Pages CMS)

1. Cada pessoa da equipa cria uma conta GitHub e é adicionada como colaboradora do repositório.
2. Entram em https://app.pagescms.org com o GitHub e abrem o repositório `gaffe`.
3. Cada página do site aparece no menu; ao guardar, o GitHub Actions volta a gerar e publicar o site (cerca de 1 minuto).

## Formulário de contacto

Envia por [FormSubmit](https://formsubmit.co) para o email em `content/geral.json` (`email`).
A primeira mensagem enviada faz chegar um email de ativação a esse endereço, que tem de ser confirmado uma vez.
Se o envio falhar, o site oferece enviar o mesmo texto por email.

## Publicar (GitHub Pages)

1. Em Settings → Pages, Source: **GitHub Actions**. O workflow `.github/workflows/pages.yml` faz o build e publica a cada push para `main`.
2. Com o domínio comprado, criar `CNAME` com `gaffe.pt` (e copiá-lo no `build.mjs` para `_site/`), apontar o DNS para o GitHub Pages e trocar os URLs `og:url` e `og:image` no `src/index.html` para o domínio novo.
