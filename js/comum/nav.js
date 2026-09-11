/**
 * NAV.JS
 * ---------------------------------------------------------------------------
 * A lista das ferramentas da suíte, e a barra de navegação montada a
 * partir dela. Com uma cópia por página, acrescentar uma ferramenta
 * significava editar todas — e bastava esquecer uma para o site ficar com
 * dois menus diferentes dependendo de onde o usuário estivesse.
 *
 * A mesma lista alimenta a página inicial (js/inicio/inicio.js), que
 * mostra um cartão por ferramenta. Por isso cada entrada tem quatro
 * campos, e não dois:
 *
 *   rotulo    — o nome curto, que cabe no menu
 *   titulo    — o nome por extenso, que encabeça o cartão
 *   descricao — uma linha dizendo o que a ferramenta faz; vira o texto do
 *               cartão e o title do link no menu
 *
 * Para acrescentar uma página nova: uma linha em PAGINAS e mais nada — o
 * menu e a página inicial se atualizam sozinhos.
 *
 * A ORDEM aqui é a ordem em que as duas coisas aparecem, e ela começa
 * pelo que mais se usa no balcão.
 *
 * O <nav> já existe no HTML com a altura certa, então preencher por
 * script não empurra o resto da página para baixo.
 * ---------------------------------------------------------------------------
 */
(function () {
  const log = window.Log.criar("comum");

  const INICIO = "index.html";

  const PAGINAS = [
    {
      arquivo: "gerador.html",
      rotulo: "Ocorrências",
      titulo: "Gerador de Ocorrências",
      descricao:
        "Monta o texto da narrativa a partir de um questionário que se ajusta às respostas.",
    },
    {
      arquivo: "roteiro.html",
      rotulo: "Roteiro",
      titulo: "Roteiro de Atendimento",
      descricao:
        "Mostra as perguntas suplementares que costumam fazer falta em cada fato.",
    },
    {
      arquivo: "conversor.html",
      rotulo: "Conversor",
      titulo: "Conversor de Mídia",
      descricao:
        "Converte e comprime áudio, vídeo e imagem até caberem no limite do destino.",
    },
    {
      arquivo: "orientacoes.html",
      rotulo: "Orientações",
      titulo: "Orientações ao Comunicante",
      descricao:
        "Monta a folha do que fazer depois do registro, para imprimir e entregar em mãos.",
    },
    {
      arquivo: "transcricao.html",
      rotulo: "Transcrição",
      titulo: "Transcrição de Áudio",
      descricao:
        "Transcreve áudio e vídeo em português, sem que nada saia do computador.",
    },
    {
      arquivo: "conversas.html",
      rotulo: "Conversas",
      titulo: "Transcrição de Conversas",
      descricao:
        "Transforma a conversa exportada do WhatsApp em transcrição numerada e datada.",
    },
    {
      arquivo: "conferidor.html",
      rotulo: "Conferidor",
      titulo: "Conferidor de Identificadores",
      descricao:
        "Diz o que um número solto pode ser e se o dígito verificador fecha.",
    },
    {
      arquivo: "tipificacao.html",
      rotulo: "Tipificação",
      titulo: "Consulta de Tipificação",
      descricao:
        "Procura o artigo pelo nome do fato, pelo número ou pelo jeito que a pessoa contou.",
    },
    {
      arquivo: "contatos.html",
      rotulo: "Contatos",
      titulo: "Contatos Úteis",
      descricao:
        "Telefone, WhatsApp e endereço do que se precisa durante o plantão.",
    },
    {
      arquivo: "anotacoes.html",
      rotulo: "Anotações",
      titulo: "Anotações para Imprimir",
      descricao:
        "A estante de PDFs da unidade: formulários, folhas de entrega e colas de balcão.",
    },
  ];

  /** Nome do arquivo da página atual. "" (raiz) conta como a inicial. */
  function paginaAtual() {
    const ultimo = location.pathname.split("/").pop();
    return ultimo === "" ? INICIO : ultimo;
  }

  /**
   * A marca no cabeçalho vira o caminho de volta para a página inicial.
   * Em toda página menos a própria inicial: link que recarrega onde já se
   * está não leva a lugar nenhum.
   */
  function ligarAMarca(atual) {
    const titulo = document.querySelector(".site-title");
    if (!titulo || atual === INICIO) return;

    const link = document.createElement("a");
    link.className = "site-home";
    link.href = INICIO;
    link.title = "Todas as ferramentas";
    while (titulo.firstChild) link.appendChild(titulo.firstChild);
    titulo.appendChild(link);
  }

  function montar() {
    const atual = paginaAtual();
    ligarAMarca(atual);

    const nav = document.querySelector(".site-nav");
    if (!nav) return;

    nav.innerHTML = "";
    PAGINAS.forEach((pagina) => {
      const a = document.createElement("a");
      a.href = pagina.arquivo;
      a.className = "nav-link" + (pagina.arquivo === atual ? " ativo" : "");
      a.textContent = pagina.rotulo;
      a.title = pagina.descricao;
      if (pagina.arquivo === atual) a.setAttribute("aria-current", "page");
      nav.appendChild(a);
    });

    // Uma página que não está em PAGINAS ainda funciona, mas fica sem
    // item ativo no menu — normalmente é um arquivo renomeado sem que a
    // lista tenha sido atualizada junto.
    const conhecida = PAGINAS.some((p) => p.arquivo === atual) || atual === INICIO;
    if (conhecida) log.info("Página", atual, "·", PAGINAS.length, "ferramentas no menu.");
    else log.aviso("Página", atual, "não está em PAGINAS (js/comum/nav.js) — menu sem item ativo.");
  }

  // A lista é pública porque a página inicial monta os cartões com ela.
  window.Ferramentas = { PAGINAS, INICIO, paginaAtual };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", montar);
  } else {
    montar();
  }
})();
