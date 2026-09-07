/**
 * INICIO.JS
 * ---------------------------------------------------------------------------
 * Um cartão por ferramenta, lidos de window.Ferramentas.PAGINAS (que mora
 * em js/comum/nav.js). A página inicial não tem lista própria de
 * propósito: duas listas divergem, e quem acrescenta uma ferramenta não
 * deveria precisar lembrar da segunda — foi exatamente esse o problema que
 * o nav.js resolveu quando o menu estava copiado em cada página.
 * ---------------------------------------------------------------------------
 */
(function () {
  "use strict";

  const log = window.Log.criar("inicio");

  function montar() {
    const grade = document.getElementById("cartoes");
    if (!grade) return;

    const paginas = (window.Ferramentas && window.Ferramentas.PAGINAS) || [];
    if (paginas.length === 0) {
      log.erro("Nenhuma ferramenta para listar — js/comum/nav.js não carregou antes desta página.");
      return;
    }

    grade.innerHTML = "";
    paginas.forEach((pagina) => {
      // O cartão inteiro é o link: o alvo de clique é o cartão que a
      // pessoa está vendo, e não só as palavras do título.
      const cartao = document.createElement("a");
      cartao.className = "cartao";
      cartao.href = pagina.arquivo;

      const titulo = document.createElement("h2");
      titulo.className = "cartao-titulo";
      titulo.textContent = pagina.titulo;

      const descricao = document.createElement("p");
      descricao.className = "cartao-descricao";
      descricao.textContent = pagina.descricao;

      cartao.appendChild(titulo);
      cartao.appendChild(descricao);
      grade.appendChild(cartao);
    });

    log.info(paginas.length, "ferramentas listadas.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", montar);
  } else {
    montar();
  }
})();
