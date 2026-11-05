/* Quaestor Educação — interações do site (sem dependências). */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var reduz = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function pronto(fn) {
    if (document.readyState !== "loading") fn(); else document.addEventListener("DOMContentLoaded", fn);
  }

  pronto(function () {
    /* ------------------------------------------------------------ topo: estado ao rolar */
    var topo = document.querySelector("[data-topo]");
    function rolagem() { if (topo) topo.classList.toggle("rolou", window.scrollY > 24); }
    rolagem();
    window.addEventListener("scroll", rolagem, { passive: true });

    /* ------------------------------------------------------------ menu móvel */
    var menu = document.querySelector("[data-menu]");
    var botao = document.querySelector("[data-menu-btn]");
    function fecharMenu() {
      if (!menu || !botao) return;
      menu.classList.remove("aberto");
      botao.setAttribute("aria-expanded", "false");
      botao.querySelector(".sr").textContent = "Abrir menu";
      document.body.classList.remove("menu-aberto");
    }
    if (menu && botao) {
      botao.addEventListener("click", function () {
        var abrir = botao.getAttribute("aria-expanded") !== "true";
        menu.classList.toggle("aberto", abrir);
        botao.setAttribute("aria-expanded", String(abrir));
        botao.querySelector(".sr").textContent = abrir ? "Fechar menu" : "Abrir menu";
        document.body.classList.toggle("menu-aberto", abrir);
        if (abrir) { var a = menu.querySelector("a"); if (a) a.focus(); }
      });
      menu.addEventListener("click", function (e) { if (e.target.closest("a")) fecharMenu(); });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && menu.classList.contains("aberto")) { fecharMenu(); botao.focus(); }
      });
      window.addEventListener("resize", function () { if (window.innerWidth > 1080) fecharMenu(); });
    }

    /* ------------------------------------------------------------ link ativo no menu */
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav ul a[href^='#']"));
    if ("IntersectionObserver" in window && links.length) {
      var mapa = {};
      links.forEach(function (a) { mapa[a.getAttribute("href").slice(1)] = a; });
      var obsSecao = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (a) { a.removeAttribute("aria-current"); });
          var a = mapa[en.target.id];
          if (a) a.setAttribute("aria-current", "true");
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      Object.keys(mapa).forEach(function (id) { var s = document.getElementById(id); if (s) obsSecao.observe(s); });
    }

    /* ------------------------------------------------------------ revelação ao rolar */
    var revelaveis = document.querySelectorAll(".revela");
    if (reduz || !("IntersectionObserver" in window)) {
      revelaveis.forEach(function (el) { el.classList.add("visivel"); });
    } else {
      var obs = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("visivel"); obs.unobserve(en.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      revelaveis.forEach(function (el, i) {
        el.style.transitionDelay = ((i % 3) * 70) + "ms";
        obs.observe(el);
      });
    }

    /* ------------------------------------------------------------ abas das soluções (ARIA tabs) */
    document.querySelectorAll("[data-abas]").forEach(function (abas) {
      var tabs = Array.prototype.slice.call(abas.querySelectorAll("[role='tab']"));
      function ativar(tab, foco) {
        tabs.forEach(function (t) {
          var sel = t === tab;
          t.setAttribute("aria-selected", String(sel));
          t.tabIndex = sel ? 0 : -1;
          var p = document.getElementById(t.getAttribute("aria-controls"));
          if (p) p.hidden = !sel;
        });
        if (foco) tab.focus();
        tab.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduz ? "auto" : "smooth" });
      }
      tabs.forEach(function (tab, i) {
        tab.addEventListener("click", function () { ativar(tab, false); });
        tab.addEventListener("keydown", function (e) {
          var n = null;
          if (e.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
          else if (e.key === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
          else if (e.key === "Home") n = tabs[0];
          else if (e.key === "End") n = tabs[tabs.length - 1];
          if (n) { e.preventDefault(); ativar(n, true); }
        });
      });
    });

    /* ------------------------------------------------------------ CTAs: pré-selecionam a solução */
    var select = document.getElementById("f-solucao");
    document.querySelectorAll("[data-solucao]").forEach(function (a) {
      a.addEventListener("click", function () {
        if (select) { select.value = a.getAttribute("data-solucao"); limparErro(select); }
      });
    });

    var ano = document.querySelector("[data-ano]");
    if (ano) ano.textContent = String(new Date().getFullYear());

    /* ------------------------------------------------------------ formulário de proposta */
    var form = document.querySelector("[data-form]");
    if (form) iniciarFormulario(form);
  });

  /* ================================================================ formulário */
  var MSG = {
    nome: "Informe seu nome completo.",
    empresa: "Informe o nome da empresa.",
    email: "Informe um e-mail válido.",
    whatsapp: "Informe o WhatsApp com DDD.",
    solucao: "Escolha uma solução de interesse.",
    participantes: "Informe um número entre 1 e 100.000.",
    mensagem: "Escreva uma mensagem com pelo menos 10 caracteres.",
    consentimento: "É preciso concordar com o Aviso de Privacidade."
  };
  var EMAIL_RE = /^[^@\s]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,62}[A-Za-z0-9])?(?:\.[A-Za-z0-9-]{1,63})+$/;

  function digitos(v) { return String(v || "").replace(/\D/g, ""); }

  function mascaraFone(v) {
    var d = digitos(v);
    if (d.length > 11 && d.indexOf("55") === 0) d = d.slice(2);
    d = d.slice(0, 11);
    if (d.length <= 2) return d.length ? "(" + d : "";
    if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }

  function erroEl(campo) { return document.getElementById("e-" + campo.name); }
  function limparErro(campo) {
    campo.removeAttribute("aria-invalid");
    var e = erroEl(campo);
    if (e) e.textContent = "";
  }
  function marcarErro(campo, msg) {
    campo.setAttribute("aria-invalid", "true");
    var e = erroEl(campo);
    if (e) { e.textContent = msg; campo.setAttribute("aria-describedby", e.id); }
  }

  function validar(campo) {
    var v = campo.type === "checkbox" ? campo.checked : String(campo.value || "").trim();
    var ok = true;
    switch (campo.name) {
      case "nome": ok = v.length >= 3 && /\s/.test(v); break;
      case "empresa": ok = v.length >= 2; break;
      case "email": ok = EMAIL_RE.test(v); break;
      case "whatsapp": var d = digitos(v); ok = (d.length === 10 || d.length === 11) && d[0] !== "0"; break;
      case "solucao": ok = !!v; break;
      case "participantes": ok = v === "" || (/^\d+$/.test(v) && +v >= 1 && +v <= 100000); break;
      case "mensagem": ok = v.length >= 10; break;
      case "consentimento": ok = v === true; break;
      default: return true;
    }
    if (ok) limparErro(campo); else marcarErro(campo, MSG[campo.name]);
    return ok;
  }

  function iniciarFormulario(form) {
    var endpoint = form.getAttribute("data-endpoint");
    var status = form.querySelector("[data-status]");
    var enviar = form.querySelector("[data-enviar]");
    var rotulo = form.querySelector("[data-rotulo]");
    var sucesso = document.querySelector("[data-sucesso]");
    var inicio = 0;
    var acordado = false;
    var campos = Array.prototype.slice.call(form.querySelectorAll("input[name], select[name], textarea[name]"))
      .filter(function (c) { return c.name !== "site"; });

    // O serviço de recebimento pode estar "dormindo": acorda-o assim que a pessoa começa a preencher.
    function acordar() {
      if (!inicio) inicio = Date.now();
      if (acordado || !endpoint) return;
      acordado = true;
      try { fetch(new URL("/healthz", endpoint).href, { mode: "no-cors", cache: "no-store" }).catch(function () {}); } catch (e) { /* sem rede */ }
    }
    form.addEventListener("focusin", acordar);
    form.addEventListener("input", acordar);

    var fone = form.querySelector("[name='whatsapp']");
    if (fone) fone.addEventListener("input", function () { fone.value = mascaraFone(fone.value); });

    campos.forEach(function (c) {
      c.addEventListener("blur", function () { if (c.value || c.type === "checkbox") validar(c); });
      c.addEventListener(c.type === "checkbox" || c.tagName === "SELECT" ? "change" : "input", function () {
        if (c.getAttribute("aria-invalid") === "true") validar(c);
      });
    });

    function situacao(msg, erro) {
      status.textContent = msg || "";
      status.classList.toggle("erro-geral", !!erro);
    }
    function ocupado(sim) {
      enviar.disabled = sim;
      rotulo.textContent = sim ? "Enviando…" : "Enviar solicitação";
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      situacao("");
      var invalidos = campos.filter(function (c) { return !validar(c); });
      if (invalidos.length) {
        invalidos[0].focus();
        situacao("Revise os campos destacados.", true);
        return;
      }
      if (!endpoint) { situacao("Envio indisponível no momento. Ligue para (11) 91281-6811.", true); return; }

      var dados = new FormData(form);
      var corpo = {
        nome: String(dados.get("nome") || "").trim(),
        empresa: String(dados.get("empresa") || "").trim(),
        email: String(dados.get("email") || "").trim(),
        whatsapp: digitos(dados.get("whatsapp")),
        solucao: String(dados.get("solucao") || ""),
        participantes: dados.get("participantes") ? parseInt(dados.get("participantes"), 10) : null,
        mensagem: String(dados.get("mensagem") || "").trim(),
        consentimento: !!form.querySelector("[name='consentimento']").checked,
        privacidade_versao: form.getAttribute("data-privacidade") || "",
        pagina: location.origin + location.pathname,
        tempo_ms: inicio ? Date.now() - inicio : 0,
        site: String(dados.get("site") || "")
      };

      ocupado(true);
      var lento = setTimeout(function () { situacao("Estamos conectando ao servidor; isso pode levar alguns segundos…"); }, 4000);
      var ctrl = "AbortController" in window ? new AbortController() : null;
      var limite = setTimeout(function () { if (ctrl) ctrl.abort(); }, 90000);

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
        credentials: "omit",
        cache: "no-store",
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { return { r: r, j: j }; });
      }).then(function (res) {
        clearTimeout(lento); clearTimeout(limite);
        if (res.r.ok && res.j.ok) {
          form.hidden = true;
          if (sucesso) {
            var p = sucesso.querySelector("[data-protocolo]");
            if (p) p.textContent = res.j.protocolo ? "Protocolo: " + res.j.protocolo : "";
            sucesso.hidden = false;
            sucesso.focus();
          }
          return;
        }
        ocupado(false);
        if (res.r.status === 422 && res.j.campos) {
          var primeiro = null;
          Object.keys(res.j.campos).forEach(function (k) {
            var c = form.querySelector("[name='" + k + "']");
            if (c) { marcarErro(c, MSG[k] || res.j.campos[k]); primeiro = primeiro || c; }
          });
          if (primeiro) primeiro.focus();
          situacao("Revise os campos destacados.", true);
        } else if (res.j.mensagem) {
          situacao(res.j.mensagem, true);
        } else {
          situacao("Não foi possível enviar agora. Tente novamente em instantes ou ligue para (11) 91281-6811.", true);
        }
      }).catch(function () {
        clearTimeout(lento); clearTimeout(limite);
        ocupado(false);
        situacao("Não foi possível conectar. Verifique sua internet e tente novamente, ou ligue para (11) 91281-6811.", true);
      });
    });
  }
})();
