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
 *
 * E cada contato pode ser IMPRESSO para entregar, inteiro ou só nas
 * partes marcadas — ver a seção "Imprimir um contato", lá embaixo.
 * ---------------------------------------------------------------------------
 */
(function () {
  "use strict";

  const log = window.Log.criar("contatos");

  const DADOS = window.CONTATOS;
  const { DDI, AVISO_IMPRESSO } = window.Config.CONTATOS;

  const el = {
    busca: document.getElementById("busca"),
    lista: document.getElementById("lista-contatos"),
    contagem: document.getElementById("contagem"),
    semResultados: document.getElementById("sem-resultados"),
    impressao: document.getElementById("impressao-contato"),
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
   * Espaço reservado, e não dado: o número só de zeros — "(00) 0000-0000"
   * — e o "PREENCHER" que dados.js usa onde o dado ainda não foi
   * cadastrado (ver "ATENÇÃO A QUEM EDITA" lá).
   *
   * Na tela eles tinham cara de número de verdade, com botão de copiar e
   * tudo; o risco não era a página quebrar, era alguém copiar um número
   * que não existe e discar. Agora aparecem como "não cadastrado", o
   * copiar avisa em vez de copiar, e a impressão os deixa de fora.
   */
  function ehProvisorio(valor) {
    const texto = String(valor || "");
    if (texto.indexOf("PREENCHER") >= 0) return true;
    const digitos = texto.replace(/\D/g, "");
    return digitos.length > 0 && /^0+$/.test(digitos);
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

  /**
   * O link de cada tipo de canal, pelo rótulo. Telefone e endereço não
   * têm: num computador de balcão, `tel:` não disca nada.
   */
  const LINKS = {
    WhatsApp: (valor) => {
      const numero = numeroDoWhatsapp(valor);
      return numero ? "https://wa.me/" + numero : null;
    },
    "E-mail": (valor) => "mailto:" + valor,
    Site: (valor) => "https://" + valor,
  };

  /**
   * Tudo o que um contato tem, como uma lista de partes, na ordem em que
   * se lê: descrição, horário, os canais (telefones, WhatsApp, e-mails,
   * endereço, site) e a observação. O cartão desenha os canais a partir
   * daqui, e a impressão escolhe entre as mesmas partes — uma ordem só
   * para as duas, e não duas que divergem com o tempo.
   */
  function partesDoContato(item) {
    const partes = [];
    const parte = (tipo, rotulo, valor, nota) =>
      partes.push({ tipo, rotulo, valor, nota: nota || "", provisorio: ehProvisorio(valor) });

    if (item.descricao) parte("descricao", "Descrição", item.descricao);
    if (item.horario) parte("horario", "Horário", item.horario);
    canais(item.telefones).forEach((c) => parte("canal", "Telefone", c.valor, c.nota));
    canais(item.whatsapp).forEach((c) => parte("canal", "WhatsApp", c.valor, c.nota));
    canais(item.emails).forEach((c) => parte("canal", "E-mail", c.valor, c.nota));
    canais([item.endereco]).forEach((c) => parte("canal", "Endereço", c.valor, c.nota));
    canais([item.site]).forEach((c) =>
      parte("canal", "Site", c.valor.replace(/^https?:\/\//, ""), c.nota)
    );
    if (item.obs) parte("obs", "Observação", item.obs);
    return partes;
  }

  function criarBotaoCopiar(parte) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "contato-copiar";
    botao.textContent = "copiar";

    // O botão continua lá, para a linha não parecer diferente das outras
    // à primeira vista — mas avisa em vez de copiar. Texto vazio é o que
    // faz o Copiar mostrar a mensagem de `vazio`, sem tocar na área de
    // transferência.
    if (parte.provisorio) {
      botao.classList.add("contato-copiar-vazio");
      botao.title = "Não cadastrado: não há o que copiar";
      botao.addEventListener("click", () => {
        log.aviso("Copiar recusado: a linha", parte.rotulo, "ainda é espaço reservado em dados.js.");
        window.Copiar.copiarComFeedback(botao, "", { vazio: "Não cadastrado" });
      });
      return botao;
    }

    botao.title = "Copiar " + parte.valor;
    botao.addEventListener("click", () => {
      window.Copiar.copiarComFeedback(botao, parte.valor);
    });
    return botao;
  }

  /**
   * Uma linha do cartão: o rótulo, o valor, para que ele serve e o que
   * dá para fazer com ele. Canal provisório não vira link, nem mostra o
   * número de zeros: mostra que falta.
   */
  function criarLinha(parte) {
    const linha = document.createElement("div");
    linha.className = "contato-linha";

    const nome = document.createElement("span");
    nome.className = "contato-rotulo";
    nome.textContent = parte.rotulo;

    const corpo = document.createElement("span");
    corpo.className = "contato-valor";
    const link = !parte.provisorio && LINKS[parte.rotulo] ? LINKS[parte.rotulo](parte.valor) : null;
    if (parte.provisorio) {
      corpo.classList.add("contato-provisorio");
      corpo.textContent = "não cadastrado";
    } else if (link) {
      const a = document.createElement("a");
      a.href = link;
      a.textContent = parte.valor;
      a.rel = "noopener";
      if (/^https?:/.test(link)) a.target = "_blank";
      corpo.appendChild(a);
    } else {
      corpo.textContent = parte.valor;
    }

    linha.appendChild(nome);
    linha.appendChild(corpo);

    // Ao lado do número, e não numa linha própria: um contato com três
    // telefones viraria seis linhas, e a agenda se lê de relance.
    if (parte.nota) {
      const nota = document.createElement("span");
      nota.className = "contato-nota";
      nota.textContent = parte.nota;
      linha.appendChild(nota);
    }

    // O botão copia só o valor. A nota explica para quem está lendo; o
    // que vai ser digitado no aparelho é o número, e mais nada.
    linha.appendChild(criarBotaoCopiar(parte));
    return linha;
  }

  function criarCartao(item) {
    const cartao = document.createElement("article");
    cartao.className = "contato-cartao";
    const partes = partesDoContato(item);

    const cabecalho = document.createElement("div");
    cabecalho.className = "contato-cabecalho";

    const nome = document.createElement("h3");
    nome.className = "contato-nome";
    nome.textContent = item.nome;
    cabecalho.appendChild(nome);

    partes.filter((p) => p.tipo === "horario").forEach((p) => {
      const horario = document.createElement("span");
      horario.className = "etiqueta";
      if (p.provisorio) {
        horario.classList.add("contato-provisorio");
        horario.textContent = "horário não cadastrado";
      } else {
        horario.textContent = p.valor;
      }
      cabecalho.appendChild(horario);
    });

    const imprimir = document.createElement("button");
    imprimir.type = "button";
    imprimir.className = "contato-imprimir";
    imprimir.textContent = "imprimir";
    imprimir.title = "Imprimir este contato para entregar";
    imprimir.setAttribute("aria-expanded", "false");
    imprimir.addEventListener("click", () => alternarPainel(item, partes, cartao, imprimir));
    cabecalho.appendChild(imprimir);

    cartao.appendChild(cabecalho);

    partes.filter((p) => p.tipo === "descricao").forEach((p) => {
      const descricao = document.createElement("p");
      descricao.className = "contato-descricao";
      descricao.textContent = p.valor;
      cartao.appendChild(descricao);
    });

    partes.filter((p) => p.tipo === "canal").forEach((p) => cartao.appendChild(criarLinha(p)));

    partes.filter((p) => p.tipo === "obs").forEach((p) => {
      const obs = document.createElement("p");
      obs.className = "contato-obs";
      obs.textContent = p.valor;
      cartao.appendChild(obs);
    });

    return cartao;
  }


  // -------------------------------------------------------------------
  // Imprimir um contato
  //
  // Para entregar a quem está no balcão: o endereço do IML, o telefone do
  // CRAS, o horário da Defensoria. Anotar à mão num papelzinho é onde o
  // número sai com um dígito trocado.
  //
  // "imprimir" abre, dentro do próprio cartão, uma caixa por parte do
  // contato — horário, cada número com a sua nota, endereço, observação —
  // todas marcadas. Desmarca-se o que não interessa (o ramal interno, o
  // e-mail da vara) e imprime-se o resto. A parte provisória nem pode ser
  // marcada: papel entregue com número inexistente é pior que papel
  // nenhum.
  //
  // O papel sai só com o contato, num quadro tracejado que dá para
  // recortar, e com a data de hoje: quem guarda o papel precisa saber de
  // quando é a informação. O resto da página fica de fora pela classe
  // `imprimindo-contato` no <body> — sem ela, o Ctrl+P de sempre continua
  // imprimindo a agenda inteira, como antes.
  // -------------------------------------------------------------------

  /** O painel aberto agora, se houver: um de cada vez. */
  let aberto = null;

  function fecharPainel() {
    if (!aberto) return;
    aberto.painel.remove();
    aberto.botao.setAttribute("aria-expanded", "false");
    aberto.cartao.classList.remove("contato-selecionando");
    aberto = null;
  }

  /** Rótulo da caixa: o que é, e qual — ou que falta. */
  function rotuloDaCaixa(parte) {
    // Descrição e observação são frases inteiras; na caixa basta o nome,
    // e a frase vai no title.
    if (parte.tipo === "descricao" || parte.tipo === "obs") return parte.rotulo;
    const valor = parte.provisorio ? "não cadastrado" : parte.valor;
    return parte.rotulo + " " + valor + (parte.nota ? " · " + parte.nota : "");
  }

  function alternarPainel(item, partes, cartao, botao) {
    const eraEste = aberto && aberto.cartao === cartao;
    fecharPainel();
    if (eraEste) return;

    const painel = document.createElement("div");
    painel.className = "contato-impressao";

    const titulo = document.createElement("p");
    titulo.className = "contato-impressao-titulo";
    titulo.textContent = "O que vai para o papel — desmarque o que não interessa a quem vai levar.";
    painel.appendChild(titulo);

    const opcoes = document.createElement("div");
    opcoes.className = "contato-impressao-opcoes";
    const caixas = partes.map((parte) => {
      const label = document.createElement("label");
      label.className = "opcao-item";
      if (parte.tipo === "descricao" || parte.tipo === "obs") label.title = parte.valor;

      const caixa = document.createElement("input");
      caixa.type = "checkbox";
      caixa.checked = !parte.provisorio;
      caixa.disabled = parte.provisorio;
      caixa.addEventListener("change", atualizar);

      label.appendChild(caixa);
      label.appendChild(document.createTextNode(rotuloDaCaixa(parte)));
      opcoes.appendChild(label);
      return caixa;
    });
    painel.appendChild(opcoes);

    const acoes = document.createElement("div");
    acoes.className = "contato-impressao-acoes";

    const btnImprimir = document.createElement("button");
    btnImprimir.type = "button";
    btnImprimir.className = "btn-primary";
    btnImprimir.textContent = "Imprimir";

    const btnTodas = document.createElement("button");
    btnTodas.type = "button";
    btnTodas.className = "btn-secondary";

    const btnFechar = document.createElement("button");
    btnFechar.type = "button";
    btnFechar.className = "btn-secondary";
    btnFechar.textContent = "Cancelar";

    acoes.appendChild(btnImprimir);
    acoes.appendChild(btnTodas);
    acoes.appendChild(btnFechar);
    painel.appendChild(acoes);

    const marcaveis = () => caixas.filter((c) => !c.disabled);
    const escolhidas = () => partes.filter((_, i) => caixas[i].checked);

    function atualizar() {
      const todas = marcaveis().every((c) => c.checked);
      btnTodas.textContent = todas ? "Desmarcar tudo" : "Marcar tudo";
      // Só o nome não é contato: sem nenhuma parte, não há o que imprimir.
      btnImprimir.disabled = escolhidas().length === 0;
    }

    btnTodas.addEventListener("click", () => {
      const marcar = !marcaveis().every((c) => c.checked);
      marcaveis().forEach((c) => { c.checked = marcar; });
      atualizar();
    });
    btnFechar.addEventListener("click", fecharPainel);
    btnImprimir.addEventListener("click", () => {
      prepararImpressao();
      log.info("Imprimindo", item.nome + ":", escolhidas().length, "de", partes.length, "partes.");
      window.print();
    });

    cartao.appendChild(painel);
    cartao.classList.add("contato-selecionando");
    botao.setAttribute("aria-expanded", "true");
    aberto = { item, escolhidas, painel, botao, cartao };
    atualizar();
  }

  /** Monta o papel com o contato aberto e as partes marcadas. */
  function prepararImpressao() {
    if (!aberto || aberto.escolhidas().length === 0) return false;
    const { item } = aberto;
    el.impressao.innerHTML = "";

    const nome = document.createElement("h2");
    nome.className = "impresso-nome";
    nome.textContent = item.nome;
    el.impressao.appendChild(nome);

    // A ordem é a de partesDoContato: descrição logo abaixo do nome,
    // observação por último.
    aberto.escolhidas().forEach((parte) => {
      if (parte.tipo === "descricao" || parte.tipo === "obs") {
        const p = document.createElement("p");
        p.className = parte.tipo === "obs" ? "impresso-obs" : "impresso-descricao";
        p.textContent = parte.valor;
        el.impressao.appendChild(p);
        return;
      }
      const linha = document.createElement("div");
      linha.className = "impresso-linha";
      const rotulo = document.createElement("span");
      rotulo.className = "impresso-rotulo";
      rotulo.textContent = parte.rotulo;
      const valor = document.createElement("span");
      valor.className = "impresso-valor";
      valor.textContent = parte.valor;
      linha.appendChild(rotulo);
      linha.appendChild(valor);
      if (parte.nota) {
        const nota = document.createElement("span");
        nota.className = "impresso-nota";
        nota.textContent = parte.nota;
        linha.appendChild(nota);
      }
      el.impressao.appendChild(linha);
    });

    // A data de hoje, recalculada a cada impressão, como na folha de
    // orientações: a página aberta desde ontem não imprime ontem.
    const rodape = document.createElement("p");
    rodape.className = "impresso-rodape";
    rodape.textContent =
      "Entregue em " + new Date().toLocaleDateString("pt-BR") + ". " + AVISO_IMPRESSO;
    el.impressao.appendChild(rodape);

    document.body.classList.add("imprimindo-contato");
    return true;
  }

  // O Ctrl+P com um painel aberto imprime o contato, como o botão. Sem
  // painel aberto, imprime a agenda inteira — o comportamento de sempre.
  window.addEventListener("beforeprint", prepararImpressao);
  window.addEventListener("afterprint", () => {
    document.body.classList.remove("imprimindo-contato");
  });


  function filtrar() {
    const termos = normalizar(el.busca.value).split(" ").filter(Boolean);
    const encontrados = INDICE
      .filter(({ texto }) => termos.every((termo) => texto.includes(termo)))
      .map((i) => i.item);

    // Os cartões vão ser refeitos, e o painel aberto iria junto sem
    // avisar ninguém — fecha-se de verdade, para `aberto` não apontar
    // para um cartão que não existe mais.
    fecharPainel();
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

  const provisorios = DADOS.itens.reduce(
    (n, item) => n + partesDoContato(item).filter((p) => p.provisorio).length, 0
  );
  log.info(
    "Agenda carregada:", DADOS.itens.length, "contatos em",
    DADOS.categorias.length, "categorias,", provisorios, "dados ainda não cadastrados."
  );

  el.busca.addEventListener("input", filtrar);

  filtrar();
  el.busca.focus();
})();
