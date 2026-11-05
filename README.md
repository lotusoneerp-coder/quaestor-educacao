# Quaestor Educação — site institucional

`https://quaestoreducacao.com.br` · HTML/CSS/JS estático, sem build e sem dependências (mesma linha do front do ERP).
Hospedagem: HostGator, Plano M (cPanel `br982`), domínio adicional com raiz **`/home3/quaest62/quaestoreducacao.com.br`**
(não é a `public_html`, que pertence a `quaestorinvestimentos.com.br`).

| Arquivo | O quê |
|---|---|
| `index.html` | Home: narrativa, Sobre nós + Equipe, Diferenciais, Neurovendas (destaque), Soluções (abas), NR-1, Educação corporativa, Como funciona, Perguntas, Contato |
| `neurovendas/index.html` | Neurovendas (treinamento) e Neurovendas IA (Quaestor Profile) |
| `privacidade/index.html` | Aviso de Privacidade (LGPD) do formulário — versão `2026.11` (= `data-privacidade` do form) |
| `404.html` | Página de erro (`ErrorDocument` no `.htaccess`) |
| `.htaccess` | HTTPS + sem www, redirecionamentos do WordPress antigo, CSP e cabeçalhos de segurança, cache, gzip |
| `assets/css/site.css` | Fontes auto-hospedadas + identidade (tokens em `:root`) + componentes + responsivo |
| `assets/js/site.js` | Menu, abas, revelação ao rolar, `?solucao=` pré-seleciona o formulário, envio do formulário |
| `assets/img/quaestor-educacao-{branco,petroleo}.png` | Assinatura QUAESTOR EDUCAÇÃO (wordmark oficial + “EDUCAÇÃO” nas proporções do “ADVISORS”) |

## Formulário (leads)
Envia para o **Quaestor Profile**: `POST https://profile.quaestoradvisors.com.br/api/leads/educacao` (origem autorizada:
`quaestoreducacao.com.br`). Contrato, antispam, retenção e integração com o ERP: `quaestor-profile/LEADS.md`.
Se o endereço mudar, atualize o `data-endpoint` do `<form>` **e** o `connect-src` da CSP no `.htaccess`.

## Aviso por e-mail (governança)
Cada pedido também é enviado para **governanca@quaestoradvisors.com.br** por `api/notificar.php` (PHP `mail()` da
HostGator, remetente `nao-responda@quaestoreducacao.com.br`, "Responder" vai para quem preencheu). O destino é fixo no
script (não aceita destinatário do navegador). Mesmas validações do Profile + armadilha, tempo mínimo, origem obrigatória
e limite de 5 envios/10 min por IP e 200/dia (contadores em `/home3/quaest62/qe-dados`, fora da pasta pública).
Se o Profile estiver fora do ar, o pedido segue só por e-mail (sem protocolo). Permissão do PHP: `0644`.

## Neurovendas IA
Textos dos quatro perfis vêm do método real (`quaestor-profile/qprofile/profiles.py` e `modules/neurovendas/methodology.py`
no ERP). Não é diagnóstico psicológico nem suitability — manter o aviso se o texto mudar.

## Equipe — fotos
Os cards mostram monogramas até as fotos chegarem. Para cada pessoa: WebP 800×1000 (4:5), ≤ 120 KB, em
`assets/img/equipe/<slug>.webp` (`pedro`, `evandro-matias`, `vitor-pereira`, `lucas-neves`) e, no card
(`data-foto="<slug>"`), troque o `<span>` do monograma por
`<img src="/assets/img/equipe/<slug>.webp" width="800" height="1000" alt="<Nome>" loading="lazy">`.
Não usar imagens geradas nem editar a fisionomia.

## Dados institucionais
Endereço e telefone exibidos são os da Quaestor Advisors (Av. Ibirapuera, 2332 · (11) 91281-6811), aprovados para a
Educação. O telefone não está ligado a WhatsApp: confirme antes de trocar o `tel:` por `https://wa.me/5511912816811`.

## Testar localmente
```powershell
python -m http.server 8090 --directory "G:\Meu Drive\MANUS 2.0\quaestor-educacao"
```
(O `.htaccess` só vale no Apache: CSP, redirecionamentos e 404 só aparecem no servidor real.)

## Publicar (HostGator)
1. Gere um `.zip` desta pasta **sem** `README.md` e `.gitattributes`.
2. cPanel → Gerenciador de Arquivos → `/home3/quaest62/quaestoreducacao.com.br` → Carregar o zip → Extrair (sobrescrever).
3. Preserve `.well-known/` (certificado) e os `google*.html` (verificação do Search Console).
4. Ao mudar CSS/JS, troque o `?v=` nas páginas (cache de 30 dias no `.htaccess`).
5. Confira: `https://quaestoreducacao.com.br/`, `/neurovendas/`, um envio de teste do formulário.

Cópia Git (fora do Google Drive): `C:\Users\Quaestor 1\Documents\quaestor-educacao` → `github.com/lotusoneerp-coder/quaestor-educacao`.
