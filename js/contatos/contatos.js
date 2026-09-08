/**
 * CONTATOS.JS
 * ---------------------------------------------------------------------------
 * Filtra e desenha a agenda de js/contatos/dados.js. Não sabe nada sobre
 * nenhum órgão — todo o conteúdo está lá, e é lá que se edita.
 *
 * A busca é a mesma da tipificação: termos soltos, sem acento e sem
 * pontuação, cada um precisando aparecer em algum lugar da entrada. Quem
 * digita "legista" acha o IML, e quem digita "plantao criança" acha o
 * Conselho Tutelar.
 *
 * COPIAR É A AÇÃO PRINCIPAL, e não ligar: isto roda num computador de
 * balcão, onde um link `tel:` não disca nada. O número é para ser
 * copiado e digitado no aparelho ao lado, ou colado num despacho. O
 * WhatsApp é a exceção — ali o link abre de verdade.
 *
 * Cada canal pode vir escrito como texto solto ou como { valor, nota }.
 * A nota diz PARA QUE serve aquele número, e é o que separa o 190 do
 * telefone interno que só atende em horário de expediente.
 * ---------------------------------------------------------------------------
 */
(function () {
  "use strict";

  const log = window.Log.criar("contatos");

  const DADOS = window.CONTATOS;
  const { DDI } = window.Config.CONTATOS;

  const el = {
    busca: document.getElementById("busca"),
    lista: document.getElementById("lista-contatos"),
    contagem: document.getElementById("contagem"),
    semResultados: document.getElementById("sem-resultados"),
  };

  const CATEGORIAS = {};
  DADOS.categorias.forEach((c) => {
    CATEGORIAS[c.chave] = c.label;
  });

  // Categoria escrita errado é entrada que some da tela sem erro nenhum:
  // ela simplesmente não cai em grupo algum. Daí conferir na carga.
  DADOS.itens.forEach((item) => {
    if (!CATEGORIAS[item.categoria]) {
      log.aviso(
        item.nome + ' está na categoria "' + item.categoria +
          '", que não existe em dados.js — o contato não aparece na tela.'
      );
    }
  });

  /**
   * Tira acento, pontuação e caixa. Mesma normalização de
   * js/tipificacao/tipificacao.js — são dez linhas de função pura, e
   * duas cópias ainda cabem. Quando uma terceira página precisar dela,
   * é hora de levar para js/comum/.
   */
  function normalizar(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Um canal escrito de qualquer das duas formas vira sempre a mesma
   * coisa aqui, e o resto do arquivo só conhece esta. `nota` vazia é o
   * caso comum: órgão com um número só não tem o que distinguir.
   */
  function normalizarCanal(canal) {
    if (canal === null || canal === undefined) return null;
    if (typeof canal === "string") return { valor: canal, nota: "" };
    return { valor: canal.valor || "", nota: canal.nota || "" };
  }

  /** A lista de um campo, já normalizada e sem os buracos. */
  function canais(lista) {
    return (lista || []).map(normalizarCanal).filter((c) => c && c.valor);
  }

  // Índice montado uma vez: refazer a concatenação a cada tecla seria
  // refazer o mesmo trabalho trinta vezes por letra.
  const INDICE = DADOS.itens.map((item) => ({
    item,
    texto: normalizar(
      [
        item.nome, item.descricao, item.obs, item.busca,
        CATEGORIAS[item.categoria],
        // O valor E a nota: quem procura "alternativo" ou "plantão" está
        // procurando pela nota, não pelo número.
        canais([item.endereco, item.site])
          .concat(canais(item.telefones), canais(item.whatsapp), canais(item.emails))
          .map((c) => c.valor + " " + c.nota)
          .join(" "),
      ].filter(Boolean).join(" ")
    ),
  }));

  /**
   * Só os dígitos, com o DDI na frente — é o que o wa.me espera.
   * Devolve null para o que não dá para discar de fora: 190, 193 e
   * companhia têm três dígitos e não são WhatsApp de ninguém.
   */
  function numeroDoWhatsapp(bruto) {
    const digitos = String(bruto || "").replace(/\D/g, "");
    if (digitos.length < 10 || digitos.length > 11) return null;
    return DDI + digitos;
  }

  function criarBotaoCopiar(valor) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "contato-copiar";
    botao.textContent = "copiar";
    botao.title = "Copiar " + valor;
    botao.addEventListener("click", () => {
      window.Copiar.copiarComFeedback(botao, valor);
    });
    return botao;
  }

  /**
   * Uma linha do cartão: o rótulo, o valor, para que ele serve e o que
   * dá para fazer com ele. `link` é opcional — quando existe, o valor
   * vira âncora.
   */
  function criarLinha(rotulo, canal, link) {
    const linha = document.createElement("div");
    linha.className = "contato-linha";

    const nome = document.createElement("span");
    nome.className = "contato-rotulo";
    nome.textContent = rotulo;

    const corpo = document.createElement("span");
    corpo.className = "contato-valor";
    if (link) {
      const a = document.createElement("a");
      a.href = link;
      a.textContent = canal.valor;
      a.rel = "noopener";
      if (/^https?:/.test(link)) a.target = "_blank";
      corpo.appendChild(a);
    } else {
      corpo.textContent = canal.valor;
    }

    linha.appendChild(nome);
    linha.appendChild(corpo);

    // Ao lado do número, e não numa linha própria: um contato com três
    // telefones viraria seis linhas, e a agenda se lê de relance.
    if (canal.nota) {
      const nota = document.createElement("span");
      nota.className = "contato-nota";
      nota.textContent = canal.nota;
      linha.appendChild(nota);
    }

    // O botão copia só o valor. A nota explica para quem está lendo; o
    // que vai ser digitado no aparelho é o número, e mais nada.
    linha.appendChild(criarBotaoCopiar(canal.valor));
    return linha;
  }

  function criarCartao(item) {
    const cartao = document.createElement("article");
    cartao.className = "contato-cartao";

    const cabecalho = document.createElement("div");
    cabecalho.className = "contato-cabecalho";

    const nome = document.createElement("h3");
    nome.className = "contato-nome";
    nome.textContent = item.nome;
    cabecalho.appendChild(nome);

    if (item.horario) {
      const horario = document.createElement("span");
      horario.className = "etiqueta";
      horario.textContent = item.horario;
      cabecalho.appendChild(horario);
    }
    cartao.appendChild(cabecalho);

    if (item.descricao) {
      const descricao = document.createElement("p");
      descricao.className = "contato-descricao";
      descricao.textContent = item.descricao;
      cartao.appendChild(descricao);
    }

    canais(item.telefones).forEach((c) =>
      cartao.appendChild(criarLinha("Telefone", c, null))
    );

    canais(item.whatsapp).forEach((c) => {
      const numero = numeroDoWhatsapp(c.valor);
      cartao.appendChild(
        criarLinha("WhatsApp", c, numero ? "https://wa.me/" + numero : null)
      );
    });

    canais(item.emails).forEach((c) =>
      cartao.appendChild(criarLinha("E-mail", c, "mailto:" + c.valor))
    );

    canais([item.endereco]).forEach((c) =>
      cartao.appendChild(criarLinha("Endereço", c, null))
    );

    canais([item.site]).forEach((c) => {
      const endereco = c.valor.replace(/^https?:\/\//, "");
      cartao.appendChild(
        criarLinha("Site", { valor: endereco, nota: c.nota }, "https://" + endereco)
      );
    });

    if (item.obs) {
      const obs = document.createElement("p");
      obs.className = "contato-obs";
      obs.textContent = item.obs;
      cartao.appendChild(obs);
    }

    return cartao;
  }

  function filtrar() {
    const termos = normalizar(el.busca.value).split(" ").filter(Boolean);
    const encontrados = INDICE
      .filter(({ texto }) => termos.every((termo) => texto.includes(termo)))
      .map((i) => i.item);

    el.lista.innerHTML = "";

    // Um bloco por categoria, na ordem declarada em dados.js. Categoria
    // que ficou sem ninguém depois do filtro não vira título vazio.
    DADOS.categorias.forEach((categoria) => {
      const doGrupo = encontrados.filter((i) => i.categoria === categoria.chave);
      if (doGrupo.length === 0) return;

      const bloco = document.createElement("section");
      bloco.className = "contato-grupo";

      const titulo = document.createElement("h2");
      titulo.className = "contato-grupo-titulo";
      titulo.textContent = categoria.label;
      bloco.appendChild(titulo);

      doGrupo.forEach((item) => bloco.appendChild(criarCartao(item)));
      el.lista.appendChild(bloco);
    });

    // O termo buscado é nome de órgão, não dado de ninguém — pode ir junto.
    log.debug('Busca "' + el.busca.value + '":', encontrados.length, "de", DADOS.itens.length);

    el.semResultados.classList.toggle("escondido", encontrados.length > 0);
    el.contagem.textContent =
      encontrados.length === DADOS.itens.length
        ? DADOS.itens.length + " contatos na agenda"
        : encontrados.length + " de " + DADOS.itens.length;
  }

  log.info(
    "Agenda carregada:", DADOS.itens.length, "contatos em",
    DADOS.categorias.length, "categorias."
  );

  el.busca.addEventListener("input", filtrar);

  filtrar();
  el.busca.focus();
})();
