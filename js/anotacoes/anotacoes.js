/**
 * ANOTACOES.JS
 * ---------------------------------------------------------------------------
 * Desenha a estante de PDFs de js/anotacoes/dados.js. Não sabe o nome de
 * papel nenhum — todo o conteúdo está lá, e é lá que se edita.
 *
 * A página não converte, não gera e não abre o PDF por conta própria: o
 * visualizador do navegador já faz isso melhor do que qualquer coisa que
 * coubesse aqui, e é dele o botão de imprimir. O que esta tela resolve é
 * ACHAR a folha certa — um cartão por papel, agrupado, dizendo o que é e
 * quantas páginas tem.
 *
 * A CONFERÊNCIA DOS ARQUIVOS
 *
 * O conteúdo mora em dois lugares que não se falam: o PDF na pasta e a
 * entrada em dados.js. Um nome digitado errado num deles daria um cartão
 * perfeito que só falha na mão de quem clica — e num plantão isso é
 * descobrir o problema no pior momento possível. Por isso, ao carregar,
 * cada arquivo declarado leva um HEAD:
 *
 *   - respondeu: nada acontece, que é o caso normal;
 *   - respondeu 404: o cartão ganha a linha "arquivo não encontrado" e o
 *     console avisa qual nome não existe na pasta;
 *   - não respondeu (file://, rede fora, servidor sem HEAD): o cartão
 *     fica como está. Não dá para distinguir "não existe" de "não deu
 *     para perguntar", e marcar tudo por causa do segundo caso seria
 *     pior do que não conferir.
 *
 * A conferência é assíncrona e não segura a tela: os cartões nascem
 * completos, e a marca de ausente chega depois.
 * ---------------------------------------------------------------------------
 */
(function () {
  "use strict";

  const log = window.Log.criar("anotacoes");

  const DADOS = window.ANOTACOES;
  const { PASTA } = window.Config.ANOTACOES;

  const el = {
    lista: document.getElementById("lista-anotacoes"),
    vazio: document.getElementById("sem-anotacoes"),
  };

  const CATEGORIAS = {};
  DADOS.categorias.forEach((c) => {
    CATEGORIAS[c.chave] = c.label;
  });

  /**
   * O endereço do PDF. encodeURI, e não encodeURIComponent: o nome vem
   * do Office como a pessoa salvou — "Auto de Prisão.pdf", com espaço e
   * acento —, e a barra continua valendo caso alguém organize a pasta
   * em subpastas.
   */
  function endereco(item) {
    return encodeURI(PASTA + item.arquivo);
  }

  /**
   * "2 páginas", "1 página", ou nada quando dados.js não disse.
   *
   * Páginas, e não folhas: a impressora daqui faz frente e verso, então
   * quantas folhas saem depende de quem imprime escolher. O que o
   * arquivo sabe dizer é quantas páginas ele tem.
   */
  function textoPaginas(item) {
    if (!item.paginas) return "";
    return item.paginas === 1 ? "1 página" : item.paginas + " páginas";
  }

  function criarCartao(item) {
    const cartao = document.createElement("article");
    cartao.className = "anotacao-cartao";

    const cabecalho = document.createElement("div");
    cabecalho.className = "anotacao-cabecalho";

    // O título é o link, e não o cartão inteiro: o cartão tem a segunda
    // ação (baixar) dentro dele, e âncora dentro de âncora não existe.
    const titulo = document.createElement("h3");
    titulo.className = "anotacao-titulo";
    const link = document.createElement("a");
    link.href = endereco(item);
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = item.titulo;
    link.title = "Abrir " + item.arquivo + " numa aba nova";
    titulo.appendChild(link);
    cabecalho.appendChild(titulo);

    const paginas = textoPaginas(item);
    if (paginas) {
      const etiqueta = document.createElement("span");
      etiqueta.className = "etiqueta";
      etiqueta.textContent = paginas;
      cabecalho.appendChild(etiqueta);
    }
    cartao.appendChild(cabecalho);

    if (item.descricao) {
      const descricao = document.createElement("p");
      descricao.className = "anotacao-descricao";
      descricao.textContent = item.descricao;
      cartao.appendChild(descricao);
    }

    if (item.obs) {
      const obs = document.createElement("p");
      obs.className = "anotacao-obs";
      obs.textContent = item.obs;
      cartao.appendChild(obs);
    }

    // Nada de rodapé com tipo, tamanho e data: todo arquivo daqui é PDF,
    // o peso não muda o que a pessoa faz, e a data se desatualiza sozinha
    // no papel. O cartão diz o nome, para que serve e quantas páginas tem.

    // Guardado para a conferência assíncrona, que precisa achar de volta
    // o item deste cartão.
    cartao.dadosDoItem = { item };
    return cartao;
  }

  /** Um bloco por categoria, na ordem de dados.js. Grupo vazio não nasce. */
  function montar() {
    const cartoes = [];
    el.lista.innerHTML = "";

    DADOS.categorias.forEach((categoria) => {
      const doGrupo = DADOS.itens.filter((i) => i.categoria === categoria.chave);
      if (doGrupo.length === 0) return;

      const bloco = document.createElement("section");
      bloco.className = "anotacao-grupo";

      const titulo = document.createElement("h2");
      titulo.className = "anotacao-grupo-titulo";
      titulo.textContent = categoria.label;
      bloco.appendChild(titulo);

      const grade = document.createElement("div");
      grade.className = "anotacao-grade";
      doGrupo.forEach((item) => {
        const cartao = criarCartao(item);
        grade.appendChild(cartao);
        cartoes.push(cartao);
      });

      bloco.appendChild(grade);
      el.lista.appendChild(bloco);
    });

    // Estante vazia é o estado normal de quem acabou de instalar a
    // página, e não um defeito: a mensagem diz o que fazer, e não que
    // algo quebrou.
    el.vazio.classList.toggle("escondido", cartoes.length > 0);
    return cartoes;
  }

  /**
   * Pergunta ao servidor se o arquivo existe. Devolve o nome do arquivo
   * quando ele não existe, e null nos outros dois desfechos — ver o
   * comentário do topo.
   */
  function conferir(cartao) {
    const { item } = cartao.dadosDoItem;

    return fetch(endereco(item), { method: "HEAD" })
      .then((resposta) => {
        if (resposta.ok) return null;

        cartao.classList.add("ausente");
        const aviso = document.createElement("p");
        aviso.className = "anotacao-ausente";
        aviso.textContent = "arquivo não encontrado em " + PASTA + item.arquivo;
        cartao.appendChild(aviso);
        return item.arquivo;
      })
      .catch(() => null);
  }

  const cartoes = montar();

  log.info(DADOS.itens.length, "anotações em", DADOS.categorias.length, "categorias.");

  // Categoria escrita errado é item que some da tela sem erro nenhum: ele
  // simplesmente não cai em grupo algum. Mesmo aviso da agenda.
  DADOS.itens.forEach((item) => {
    if (!CATEGORIAS[item.categoria]) {
      log.aviso(
        item.titulo + ' está na categoria "' + item.categoria +
          '", que não existe em dados.js — a anotação não aparece na tela.'
      );
    }
  });

  Promise.all(cartoes.map(conferir)).then((faltando) => {
    const ausentes = faltando.filter(Boolean);
    if (ausentes.length === 0) return;
    log.aviso(
      ausentes.length + " de " + cartoes.length +
        " anotações apontam para arquivo que não existe em " + PASTA + ":",
      ausentes.join(", ")
    );
  });
})();
