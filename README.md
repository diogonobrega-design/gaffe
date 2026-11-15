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

- `src/index.html` — o modelo da página (home, história, What we make, About e os cases), com `{{pagina.chave}}` onde entra cada texto
- `content/*.json` — os textos, um ficheiro por página; é isto que o Pages CMS edita
- `.pages.yml` — o que aparece no Pages CMS (nome e descrição de cada campo)
- `build.mjs` — gera `_site/` a partir do modelo e dos textos; falha se faltar algum texto
- `css/style.css`, `js/main.js`, `img/` — estilos, comportamento e imagens

Para tornar um texto novo editável: escrever `{{pagina.chave}}` em `src/index.html`, acrescentar a chave ao
`content/pagina.json` e o campo ao `.pages.yml`.

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
