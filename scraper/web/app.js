/*
 * SAVORA — front-end do downloader.
 *
 * Padroes herdados da analise do sssinstagram que fazem sentido aqui:
 *   - cache client-side por URL   (evita refetch do mesmo link)
 *   - AbortController por busca   (uma busca nova cancela a anterior)
 *   - hooks de analytics nomeados (funil por etapa, sem rastreador acoplado)
 *   - mensagem de erro util       (em vez de "algo deu errado")
 */
(function () {
  "use strict";

  var forma = document.getElementById("forma");
  var entrada = document.getElementById("entrada");
  var btnBuscar = document.getElementById("btnBuscar");
  var btnColar = document.getElementById("btnColar");
  var btnTema = document.getElementById("btnTema");
  var elErro = document.getElementById("erro");
  var elResultado = document.getElementById("resultado");

  var cache = new Map();          // url normalizada -> payload
  var controle = null;            // AbortController da busca em voo
  var itemAtual = 0;
  var ultimo = null;

  var RE_IG = /instagram\.com\/(?:[^/]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/;

  // ---------------------------------------------------------------- analytics

  function evento(nome, dados) {
    // Ponto unico de integracao. Troque por GA4/Plausible/OpenReplay sem
    // espalhar chamadas de tracker pelo resto do codigo.
    if (typeof window.gtag === "function") window.gtag("event", nome, dados || {});
    if (window.SAVORA_DEBUG) console.log("[evento]", nome, dados || {});
  }

  // ---------------------------------------------------------------- utilidades

  function normalizar(url) {
    var m = RE_IG.exec(url || "");
    return m ? m[1] : null;
  }

  function mostrarErro(msg) {
    elErro.textContent = msg;
    elErro.hidden = false;
    elResultado.hidden = true;
  }

  function limparErro() {
    elErro.hidden = true;
    elErro.textContent = "";
  }

  function ocupado(estado) {
    btnBuscar.disabled = estado;
    btnBuscar.classList.toggle("ocupado", estado);
  }

  function escapar(txt) {
    var d = document.createElement("div");
    d.textContent = txt == null ? "" : txt;
    return d.innerHTML;
  }

  // ---------------------------------------------------------------- render

  function montarMidia(item) {
    if (item.tipo === "video") {
      return '<video src="' + escapar(item.download) + '" controls playsinline ' +
             'preload="metadata" poster=""></video>';
    }
    return '<img src="' + escapar(item.download) + '" alt="Mídia do Instagram" loading="lazy">';
  }

  function render(dados) {
    ultimo = dados;
    var item = dados.itens[itemAtual] || dados.itens[0];
    var varios = dados.itens.length > 1;

    var html =
      '<article class="cartao">' +
        '<div class="cartao__topo">' +
          '<span class="autor">' + escapar(dados.autor || "instagram") + "</span>" +
          '<span class="etiqueta">' + (item.tipo === "video" ? "Vídeo" : "Foto") +
            (varios ? " " + (itemAtual + 1) + "/" + dados.itens.length : "") +
          "</span>" +
        "</div>" +
        '<div class="midia">' + montarMidia(item) + "</div>" +
        (dados.legenda ? '<div class="legenda">' + escapar(dados.legenda) + "</div>" : "") +
        '<div class="acoes">' +
          '<a class="btn-baixar" id="btnBaixar" href="' + escapar(item.download) + '" ' +
             'download="' + escapar(item.nome) + '">Baixar ' +
             (item.tipo === "video" ? "vídeo" : "foto") + "</a>" +
          (dados.legenda
            ? '<button class="btn-secundario" id="btnLegenda" type="button">Copiar legenda</button>'
            : "") +
        "</div>" +
        (varios ? '<div class="carrossel" id="carrossel"></div>' : "") +
      "</article>";

    elResultado.innerHTML = html;
    elResultado.hidden = false;

    if (varios) montarCarrossel(dados);

    var bx = document.getElementById("btnBaixar");
    if (bx) {
      bx.addEventListener("click", function () {
        evento("download_click", { tipo: item.tipo, shortcode: dados.shortcode });
      });
    }

    var bl = document.getElementById("btnLegenda");
    if (bl) {
      bl.addEventListener("click", function () {
        navigator.clipboard.writeText(dados.legenda).then(function () {
          bl.textContent = "Copiada!";
          setTimeout(function () { bl.textContent = "Copiar legenda"; }, 1800);
          evento("caption_copy", { shortcode: dados.shortcode });
        });
      });
    }

    evento("result_show", { tipo: item.tipo, itens: dados.itens.length });
  }

  function montarCarrossel(dados) {
    var alvo = document.getElementById("carrossel");
    alvo.innerHTML = dados.itens.map(function (it, i) {
      return '<button type="button" data-i="' + i + '" aria-current="' +
             (i === itemAtual) + '" title="Item ' + (i + 1) + '">' +
             (it.tipo === "video" ? "▶" : "") + (i + 1) + "</button>";
    }).join("");

    alvo.addEventListener("click", function (ev) {
      var b = ev.target.closest("button[data-i]");
      if (!b) return;
      itemAtual = Number(b.dataset.i);
      evento("carousel_switch", { indice: itemAtual });
      render(dados);
      elResultado.querySelector(".midia").scrollIntoView({ block: "nearest" });
    });
  }

  // ---------------------------------------------------------------- busca

  function buscar(url) {
    var sc = normalizar(url);
    if (!sc) {
      mostrarErro("Esse link não parece ser de um post ou Reel do Instagram. " +
                  "Use um endereço com /p/, /reel/ ou /tv/.");
      evento("search_invalid");
      return;
    }

    limparErro();

    if (cache.has(sc)) {
      itemAtual = 0;
      evento("cache_hit", { shortcode: sc });
      render(cache.get(sc));
      return;
    }

    if (controle) controle.abort();
    controle = new AbortController();

    ocupado(true);
    evento("search_submit", { shortcode: sc });

    fetch("/api/extrair?url=" + encodeURIComponent(url), { signal: controle.signal })
      .then(function (r) {
        return r.json().then(function (corpo) {
          if (!r.ok) throw new Error(corpo.detail || "Falha na busca.");
          return corpo;
        });
      })
      .then(function (dados) {
        if (!dados.itens || !dados.itens.length) throw new Error("Nenhuma mídia encontrada.");
        cache.set(sc, dados);
        itemAtual = 0;
        render(dados);
      })
      .catch(function (e) {
        if (e.name === "AbortError") return;
        mostrarErro(e.message || "Não consegui buscar agora. Tente de novo.");
        evento("search_error", { motivo: String(e.message || e).slice(0, 120) });
      })
      .finally(function () {
        ocupado(false);
        controle = null;
      });
  }

  // ---------------------------------------------------------------- eventos

  forma.addEventListener("submit", function (ev) {
    ev.preventDefault();
    buscar(entrada.value.trim());
  });

  btnColar.addEventListener("click", function () {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      entrada.focus();
      return;
    }
    navigator.clipboard.readText().then(function (txt) {
      entrada.value = txt.trim();
      entrada.focus();
      if (normalizar(entrada.value)) buscar(entrada.value);
    }).catch(function () { entrada.focus(); });
  });

  // Colar direto no campo ja dispara a busca: menos um toque no celular.
  entrada.addEventListener("paste", function () {
    setTimeout(function () {
      var v = entrada.value.trim();
      if (normalizar(v)) buscar(v);
    }, 40);
  });

  // ---------------------------------------------------------------- tema

  function aplicarTema(t) {
    document.documentElement.setAttribute("data-tema", t);
    document.body.classList.toggle("escuro", t === "escuro");
    try { localStorage.setItem("savora_tema", t); } catch (e) {}
  }

  var salvo = null;
  try { salvo = localStorage.getItem("savora_tema"); } catch (e) {}
  if (salvo) {
    aplicarTema(salvo);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    aplicarTema("escuro");
  }

  btnTema.addEventListener("click", function () {
    var atual = document.documentElement.getAttribute("data-tema");
    aplicarTema(atual === "escuro" ? "claro" : "escuro");
  });

  // URL compartilhada: /?url=...  preenche e busca sozinho
  var param = new URLSearchParams(location.search).get("url");
  if (param) {
    entrada.value = param;
    buscar(param);
  }
})();
