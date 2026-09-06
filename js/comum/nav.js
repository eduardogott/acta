/**
 * NAV.JS
 * ---------------------------------------------------------------------------
 * A barra de navegação é montada aqui, e não copiada nas seis páginas.
 * Com uma cópia por página, acrescentar uma ferramenta significava editar
 * todas — e bastava esquecer uma para o site ficar com dois menus
 * diferentes dependendo de onde o usuário estivesse.
 *
 * Para acrescentar uma página nova: uma linha em PAGINAS e mais nada.
 *
 * O <nav> já existe no HTML com a altura certa, então preencher por
 * script não empurra o resto da página para baixo.
 * ---------------------------------------------------------------------------
 */
(function () {
  const PAGINAS = [
    { arquivo: "index.html", rotulo: "Ocorrências", titulo: "Gerador de texto de ocorrência" },
    { arquivo: "conversor.html", rotulo: "Conversor", titulo: "Conversor e compressor de mídia" },
    { arquivo: "transcricao.html", rotulo: "Transcrição", titulo: "Transcrição de áudio no navegador" },
    { arquivo: "conversas.html", rotulo: "Conversas", titulo: "Transcrição de conversas exportadas do WhatsApp" },
    { arquivo: "orientacoes.html", rotulo: "Orientações", titulo: "Orientações para entregar ao comunicante" },
    { arquivo: "conferidor.html", rotulo: "Conferidor", titulo: "Conferidor de CPF, CNPJ, IMEI, chassi, placa…" },
    { arquivo: "tipificacao.html", rotulo: "Tipificação", titulo: "Consulta rápida de tipificação penal" },
  ];

  /** Nome do arquivo da página atual. "" (raiz) conta como index.html. */
  function paginaAtual() {
    const ultimo = location.pathname.split("/").pop();
    return ultimo === "" ? "index.html" : ultimo;
  }

  function montar() {
    const nav = document.querySelector(".site-nav");
    if (!nav) return;
    const atual = paginaAtual();

    nav.innerHTML = "";
    PAGINAS.forEach((pagina) => {
      const a = document.createElement("a");
      a.href = pagina.arquivo;
      a.className = "nav-link" + (pagina.arquivo === atual ? " ativo" : "");
      a.textContent = pagina.rotulo;
      a.title = pagina.titulo;
      if (pagina.arquivo === atual) a.setAttribute("aria-current", "page");
      nav.appendChild(a);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", montar);
  } else {
    montar();
  }
})();
