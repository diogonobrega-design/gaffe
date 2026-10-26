# gaffe.pt

Site estático (HTML, CSS e JS, sem build). Para ver localmente:

```bash
python -m http.server 5180
```

e abrir http://localhost:5180.

## Estrutura

- `index.html` — todas as páginas (home, What we make, About e os cases), que o JS mostra e esconde conforme o `#hash`
- `css/style.css` — estilos; as alterações desta ronda estão no fim, no bloco `v9`
- `js/main.js` — scroll lateral, play, menu, pré-visualizações dos cases e formulário
- `img/` — imagens

## Formulário de contacto

Envia por [FormSubmit](https://formsubmit.co) para `info@gaffe.pt` (ver `data-endpoint` no `<form id="brief">`).
A primeira mensagem enviada faz chegar um email de ativação a `info@gaffe.pt`, que tem de ser confirmado uma vez.
Se o envio falhar, o site oferece enviar o mesmo texto por email.

## Publicar (GitHub Pages)

1. Pôr esta pasta num repositório no GitHub e ativar Pages (branch `main`, pasta `/`).
2. Com o domínio comprado, criar um ficheiro `CNAME` com `gaffe.pt`, apontar o DNS para o GitHub Pages e trocar os URLs `og:url` e `og:image` no `<head>` para o domínio novo.
