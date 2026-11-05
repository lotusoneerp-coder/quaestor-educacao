# Quaestor Educação — site institucional

`https://educacao.quaestoradvisors.com.br` · HTML/CSS/JS estático, sem build e sem dependências (mesma linha do front do ERP).

| Arquivo | O quê |
|---|---|
| `index.html` | Landing page: Home (narrativa), Sobre nós, Diferenciais, Soluções (abas), NR-1, Para empresas, Como funciona, Perguntas, Contato |
| `privacidade/index.html` | Aviso de Privacidade (LGPD) do formulário — versão `2026.11` (mesma do `data-privacidade` do form) |
| `404.html` | Página de erro (GitHub Pages usa sozinho) |
| `assets/css/site.css` | Fontes auto-hospedadas + identidade (tokens em `:root`) + componentes + responsivo |
| `assets/js/site.js` | Menu, abas, revelação ao rolar, CTAs que pré-selecionam a solução, formulário |
| `CNAME`, `robots.txt`, `sitemap.xml`, `site.webmanifest`, `.nojekyll` | Domínio do Pages e SEO técnico |

## Formulário (leads)
Envia para o **Quaestor Profile** (`data-endpoint` no `<form>`): `POST https://profile.quaestoradvisors.com.br/api/leads/educacao`.
Contrato, antispam, retenção e integração com o ERP: `quaestor-profile/LEADS.md`. Se o endereço mudar, atualize também o
`connect-src` do `Content-Security-Policy` no `<head>` do `index.html`.

## Dados institucionais
Endereço e telefone exibidos são os da Quaestor Advisors (Av. Ibirapuera, 2332 · (11) 91281-6811). Estão no `index.html`
(seção `#contato`) e nas mensagens de erro de `site.js`. O telefone não está ligado a WhatsApp no site: confirme antes de
trocar o `tel:` por `https://wa.me/5511912816811`.

## Fotos e provas sociais (fase futura)
Não há fotos de consultores, empresas atendidas, logos de clientes nem depoimentos — só podem entrar com material **real e
autorizado** (direito de imagem/uso de marca). Para incluir:
1. imagens em `assets/img/empresas/` (WebP, ≤ 200 KB, `width`/`height` no `<img>`, `loading="lazy"`);
2. ativar o bloco comentado `data-slot="empresas-atendidas"` em `#empresas` do `index.html`;
3. depoimentos: só com autorização escrita do autor; nada de resultados não comprovados.

## Testar localmente
```powershell
python -m http.server 8090 --directory "G:\Meu Drive\MANUS 2.0\quaestor-educacao"
```
O envio real só funciona a partir do domínio autorizado (CORS do Profile). Para testar ponta a ponta, rode o Profile local
com `PROFILE_LEADS_ALLOWED_ORIGINS=http://localhost:8090` e aponte `data-endpoint`/`connect-src` para ele numa cópia.

## Publicar (GitHub Pages)
A cópia Git fica fora do Google Drive (o Drive corrompe `.git`):
```powershell
robocopy "G:\Meu Drive\MANUS 2.0\quaestor-educacao" "C:\Users\Quaestor 1\Documents\quaestor-educacao" /E /XD .git
cd "C:\Users\Quaestor 1\Documents\quaestor-educacao"; git add -A; git commit -m "..."; git push
```
Ao mudar CSS/JS, troque o `?v=AAAAMMDD` nas páginas (cache do navegador).
DNS (Hostinger → Domínios → DNS): registro **CNAME** `educacao` → `lotusoneerp-coder.github.io` (não mexer em `@`, `www`,
`profile`, MX). Depois, no GitHub: Settings → Pages → *Enforce HTTPS*.
