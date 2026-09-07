/**
 * ORIENTACOES.JS
 * ---------------------------------------------------------------------------
 * Monta a folha a partir de js/orientacoes/dados.js. Não tem conteúdo
 * próprio: acrescentar um tipo de fato é mexer só no arquivo de dados.
 *
 * A folha é acumulativa — o que vale para todo registro, mais o que vale
 * para o tipo, mais o subtipo escolhido, mais cada situação marcada. Os
 * grupos ficam separados na tela porque a pessoa lê em pé, no balcão, e
 * uma lista corrida de vinte itens não se lê assim.
 * ---------------------------------------------------------------------------
 */
(function () {
  "use strict";

  const log = window.Log.criar("orientacoes");

  const DADOS = window.ORIENTACOES;

  log.info(
    "Orientações prontas:", DADOS.tipos.length, "fatos,",
    DADOS.tipos.reduce(
      (n, t) => n + (t.itens || []).length +
        (t.subtipos || []).reduce((k, s) => k + s.itens.length, 0) +
        (t.extras || []).reduce((k, x) => k + x.itens.length, 0),
      DADOS.comuns.itens.length
    ),
    "itens no total."
  );

  const el = {
    opcoesTipo: document.getElementById("opcoes-tipo"),
    blocoSubtipo: document.getElementById("bloco-subtipo"),
    rotuloSubtipo: document.getElementById("rotulo-subtipo"),
    opcoesSubtipo: document.getElementById("opcoes-subtipo"),
    blocoExtras: document.getElementById("bloco-extras"),
    opcoesExtras: document.getElementById("opcoes-extras"),
    outrasLista: document.getElementById("outras-lista"),
    btnNovaOutra: document.getElementById("btn-nova-outra"),
    titulo: document.getElementById("saida-titulo"),
    subtitulo: document.getElementById("saida-subtitulo"),
    grupos: document.getElementById("saida-grupos"),
    numero: document.getElementById("numero-ocorrencia"),
    numeroPrevia: document.getElementById("numero-previa"),
    cabecalhoNumero: document.getElementById("cabecalho-numero"),
    cabecalhoData: document.getElementById("cabecalho-data"),
    vazio: document.getElementById("saida-vazio"),
    btnImprimir: document.getElementById("btn-imprimir"),
    btnCopiar: document.getElementById("btn-copiar"),
    btnLimpar: document.getElementById("btn-limpar"),
  };

  const estado = {
    tipo: null,
    subtipo: null,
    extras: new Set(),
    outras: [],
  };

  /**
   * Estado inicial vindo da URL: ?tipo=perda&sub=celular&extras=a,b
   *
   * Serve a duas coisas: o link que o gerador de ocorrências oferece ao
   * fim do texto ("entregar as orientações deste caso"), e o atalho que
   * se salva para o fato que se atende toda semana.
   *
   * Uma chave que não existe mais nos dados é ignorada em silêncio — um
   * link velho deve abrir a página, não uma mensagem de erro.
   */
  function lerDaURL() {
    const params = new URLSearchParams(location.search);

    const pedidoTipo = params.get("tipo");
    const tipo = DADOS.tipos.find((t) => t.chave === pedidoTipo);
    if (!tipo) {
      // Em silêncio na tela, mas nunca no console: link velho que abre a
      // página em branco é indistinguível de link certo com dados quebrados.
      if (pedidoTipo) log.aviso('Parâmetro tipo="' + pedidoTipo + '" ignorado: não existe em dados.js.');
      return;
    }
    estado.tipo = tipo.chave;

    const pedidoSub = params.get("sub");
    const subtipo = (tipo.subtipos || []).find((x) => x.chave === pedidoSub);
    if (subtipo) estado.subtipo = subtipo.chave;
    else if (pedidoSub) log.aviso('Parâmetro sub="' + pedidoSub + '" ignorado: não é subtipo de ' + tipo.chave + ".");

    const pedidos = (params.get("extras") || "").split(",").filter(Boolean);
    (tipo.extras || []).forEach((x) => {
      if (pedidos.includes(x.chave)) estado.extras.add(x.chave);
    });
    pedidos.forEach((chave) => {
      if (!estado.extras.has(chave)) log.aviso('Extra "' + chave + '" ignorado: não existe em ' + tipo.chave + ".");
    });

    log.info("Estado lido da URL:", location.search || "(vazio)");
  }

  /**
   * O inverso: mantém a barra de endereços refletindo a escolha atual.
   *
   * As orientações escritas à mão ficam de fora de propósito — ver a
   * seção "Outras orientações", mais abaixo.
   */
  function escreverNaURL() {
    const params = new URLSearchParams();
    if (estado.tipo) params.set("tipo", estado.tipo);
    if (estado.subtipo) params.set("sub", estado.subtipo);
    if (estado.extras.size > 0) params.set("extras", Array.from(estado.extras).join(","));
    // A vírgula da lista de extras volta a ser vírgula: ela é permitida
    // sem escape numa query, e este endereço existe para ser guardado e
    // mandado a um colega — "%2C" no meio atrapalha a leitura.
    const busca = params.toString().replace(/%2C/g, ",");
    // replaceState, e não pushState: cada clique num rádio virando uma
    // entrada de histórico faria o botão "voltar" andar de um em um.
    history.replaceState(null, "", busca ? "?" + busca : location.pathname);
  }

  function tipoAtual() {
    return DADOS.tipos.find((t) => t.chave === estado.tipo) || null;
  }

  /** Um <label class="opcao-item"> com rádio ou caixa dentro. */
  function criarOpcao(nome, valor, rotulo, tipoControle, marcado, aoMudar) {
    const label = document.createElement("label");
    label.className = "opcao-item";

    const input = document.createElement("input");
    input.type = tipoControle;
    input.name = nome;
    input.value = valor;
    input.checked = marcado;
    input.addEventListener("change", () => aoMudar(input.checked));

    label.appendChild(input);
    label.appendChild(document.createTextNode(rotulo));
    return label;
  }

  function renderEscolhas() {
    el.opcoesTipo.innerHTML = "";
    DADOS.tipos.forEach((t) => {
      el.opcoesTipo.appendChild(
        criarOpcao("tipo", t.chave, t.label, "radio", estado.tipo === t.chave, () => {
          estado.tipo = t.chave;
          estado.subtipo = null;
          estado.extras.clear();
          renderTudo();
        })
      );
    });

    const tipo = tipoAtual();
    const subtipos = (tipo && tipo.subtipos) || [];
    el.blocoSubtipo.classList.toggle("escondido", subtipos.length === 0);
    el.opcoesSubtipo.innerHTML = "";
    subtipos.forEach((s) => {
      el.opcoesSubtipo.appendChild(
        criarOpcao("subtipo", s.chave, s.label, "radio", estado.subtipo === s.chave, () => {
          estado.subtipo = s.chave;
          renderTudo();
        })
      );
    });

    const extras = (tipo && tipo.extras) || [];
    // Quando o tipo não tem subtipo, as situações adicionais passam a ser
    // o passo 2 — numerar "3" sem existir um "2" confunde mais do que ajuda.
    document.querySelector("#bloco-extras .progresso").textContent =
      (subtipos.length > 0 ? "3." : "2.") + " Também aconteceu (marque o que couber)";
    el.blocoExtras.classList.toggle("escondido", extras.length === 0);
    el.opcoesExtras.innerHTML = "";
    extras.forEach((x) => {
      el.opcoesExtras.appendChild(
        criarOpcao("extra", x.chave, x.label, "checkbox", estado.extras.has(x.chave), (marcado) => {
          if (marcado) estado.extras.add(x.chave);
          else estado.extras.delete(x.chave);
          renderTudo();
        })
      );
    });
  }

  /** Os grupos que entram na folha, na ordem em que devem ser lidos. */
  function gruposDaFolha() {
    const tipo = tipoAtual();
    const grupos = [];

    if (tipo) {
      grupos.push({ titulo: tipo.label, itens: tipo.itens || [] });

      const subtipo = (tipo.subtipos || []).find((s) => s.chave === estado.subtipo);
      if (subtipo) grupos.push({ titulo: subtipo.label, itens: subtipo.itens });

      (tipo.extras || []).forEach((x) => {
        if (estado.extras.has(x.chave)) grupos.push({ titulo: x.label, itens: x.itens });
      });
    }

    // As escritas à mão são o mais específico que a folha tem: valem para
    // este caso e mais nenhum. Daí virem depois do que saiu dos dados e
    // antes do que vale para todos.
    const escritas = outrasEscritas();
    if (escritas.length > 0) grupos.push({ titulo: TITULO_OUTRAS, itens: escritas });

    // Nem fato escolhido nem linha escrita: não há folha. O que vale para
    // qualquer registro, sozinho, não é orientação de caso nenhum.
    if (grupos.length === 0) return [];

    // O que vale para qualquer registro fecha a folha: é o menos
    // específico, e ler primeiro o que é do seu caso importa mais.
    grupos.push({ titulo: DADOS.comuns.titulo, itens: DADOS.comuns.itens });
    return grupos.filter((g) => g.itens && g.itens.length > 0);
  }

  function renderFolha() {
    const tipo = tipoAtual();
    const grupos = gruposDaFolha();

    el.grupos.innerHTML = "";
    el.vazio.classList.toggle("escondido", grupos.length > 0);
    el.btnImprimir.disabled = grupos.length === 0;
    el.btnCopiar.disabled = grupos.length === 0;

    if (grupos.length === 0) {
      el.titulo.textContent = "";
      el.subtitulo.textContent = "";
      return;
    }

    // Sem fato escolhido a folha ainda pode existir, feita só das linhas
    // escritas à mão — daí o título sem complemento.
    const subtipo = ((tipo && tipo.subtipos) || []).find((s) => s.chave === estado.subtipo);
    el.titulo.textContent = tipo
      ? "O que fazer agora — " + tipo.label.toLowerCase()
      : "O que fazer agora";
    el.subtitulo.textContent = subtipo ? subtipo.label : "";

    grupos.forEach((g) => {
      // Cada grupo é uma linha da tabela da folha — ver o comentário em
      // orientacoes.html. Na tela isto se comporta como uma pilha de
      // blocos; só no papel vira tabela.
      const linha = document.createElement("tr");
      const celula = document.createElement("td");

      const bloco = document.createElement("div");
      bloco.className = "orientacoes-grupo";

      const h3 = document.createElement("h3");
      h3.textContent = g.titulo;
      bloco.appendChild(h3);

      const ol = document.createElement("ol");
      g.itens.forEach((item) => {
        const li = document.createElement("li");
        const texto = typeof item === "string" ? item : item.texto;
        li.appendChild(document.createTextNode(texto));
        if (item.prazo) {
          const etiqueta = document.createElement("span");
          etiqueta.className = "orientacoes-prazo";
          etiqueta.textContent = item.prazo;
          li.appendChild(etiqueta);
        }
        ol.appendChild(li);
      });
      bloco.appendChild(ol);
      celula.appendChild(bloco);
      linha.appendChild(celula);
      el.grupos.appendChild(linha);
    });

    log.debug(
      "Folha montada:", grupos.length, "grupos,",
      grupos.reduce((n, g) => n + g.itens.length, 0), "itens."
    );
  }


  // -------------------------------------------------------------------
  // Outras orientações
  //
  // O que os dados não preveem: o caso que pede uma linha só dele, ou o
  // fato cuja folha ainda não existe. Entra como um grupo igual aos
  // demais, e não como um rodapé à parte — quem recebe o papel não
  // precisa saber o que veio do sistema e o que o atendente escreveu.
  //
  // Não vai para a URL, e não sobrevive a um F5. As duas coisas são de
  // propósito: o endereço existe para ser guardado e reaberto no fato que
  // se atende toda semana, e texto de um caso só não tem o que fazer ali.
  // Guardar também seria pior que redigitar — orientação escrita para
  // uma pessoa reaparecendo na folha da próxima é exatamente o erro que
  // ninguém confere antes de entregar.
  // -------------------------------------------------------------------

  const { TITULO_OUTRAS } = window.Config.ORIENTACOES;

  /** As não vazias, aparadas: caixa em branco não vira item impresso. */
  function outrasEscritas() {
    return estado.outras.map((t) => t.trim()).filter(Boolean);
  }

  function focarCaixa(i) {
    const caixas = el.outrasLista.querySelectorAll("textarea");
    if (caixas[i]) caixas[i].focus();
  }

  function renderOutras() {
    // Sempre uma caixa disponível: uma seção sem onde escrever obrigaria
    // a clicar em "+ Nova orientação" antes de começar a primeira.
    if (estado.outras.length === 0) estado.outras.push("");

    el.outrasLista.innerHTML = "";
    estado.outras.forEach((texto, i) => {
      const linha = document.createElement("div");
      linha.className = "outra-linha";

      const campo = document.createElement("textarea");
      campo.className = "input-texto";
      campo.rows = 2;
      campo.value = texto;
      campo.placeholder = "Procure a Defensoria Pública para…";

      // Digitar mexe no estado e na folha, mas NÃO refaz esta lista:
      // reconstruir as caixas a cada tecla tiraria o cursor de dentro
      // daquela em que se está escrevendo.
      campo.addEventListener("input", () => {
        estado.outras[i] = campo.value;
        renderFolha();
      });

      // Enter abre a próxima orientação em vez de quebrar linha dentro
      // desta. A folha numera um item por caixa, e uma quebra de linha
      // aqui viraria um espaço no papel, sem aviso nenhum.
      campo.addEventListener("keydown", (evento) => {
        if (evento.key !== "Enter" || evento.shiftKey) return;
        evento.preventDefault();
        estado.outras.splice(i + 1, 0, "");
        renderOutras();
        focarCaixa(i + 1);
      });

      const remover = document.createElement("button");
      remover.type = "button";
      remover.className = "btn-remover";
      remover.textContent = "remover";
      remover.addEventListener("click", () => {
        estado.outras.splice(i, 1);
        renderOutras();
        renderFolha();
      });

      linha.appendChild(campo);
      linha.appendChild(remover);
      el.outrasLista.appendChild(linha);
    });
  }


  // -------------------------------------------------------------------
  // Número da ocorrência e data, no alto da primeira folha
  //
  // O primeiro item de toda folha manda guardar o número do boletim, e
  // até aqui a linha vinha em branco para o agente preencher à caneta —
  // o que quase sempre significava não preencher.
  //
  // O número digitado é só o sequencial: o resto do formato é sempre o
  // mesmo, e pedir que alguém redigite "/2026/100930" oitenta vezes por
  // semana é pedir erro de digitação.
  // -------------------------------------------------------------------

  const { CODIGO_UNIDADE, LINHA_EM_BRANCO } = window.Config.ORIENTACOES;

  /** "12345" -> "12345/2026/100930". Vazio devolve a linha para preencher. */
  function numeroFormatado() {
    const digitado = (el.numero.value || "").trim();
    if (!digitado) return null;
    return digitado + "/" + new Date().getFullYear() + "/" + CODIGO_UNIDADE;
  }

  /**
   * A data é sempre a de hoje, e não a do fato nem a do registro: o que
   * ela data é ESTA folha, entregue agora. Recalculada a cada render (e
   * antes de imprimir) para a página aberta desde ontem não imprimir
   * ontem.
   */
  function dataDeHoje() {
    return new Date().toLocaleDateString("pt-BR");
  }

  function renderCabecalho() {
    const numero = numeroFormatado();
    el.cabecalhoNumero.textContent = numero || LINHA_EM_BRANCO;
    el.cabecalhoData.textContent = dataDeHoje();
    el.numeroPrevia.textContent = numero ? "Sai impresso: " + numero : "";
  }

  function renderTudo() {
    renderEscolhas();
    renderOutras();
    renderFolha();
    renderCabecalho();
    escreverNaURL();
  }

  /** A mesma folha em texto puro, para colar num e-mail ou no sistema. */
  function folhaComoTexto() {
    const linhas = [el.titulo.textContent];
    if (el.subtitulo.textContent) linhas.push(el.subtitulo.textContent);
    gruposDaFolha().forEach((g) => {
      linhas.push("");
      linhas.push(g.titulo.toUpperCase());
      g.itens.forEach((item, i) => {
        const texto = typeof item === "string" ? item : item.texto;
        const prazo = item.prazo ? " [" + item.prazo + "]" : "";
        linhas.push(i + 1 + ". " + texto + prazo);
      });
    });
    return linhas.join("\n");
  }

  el.btnNovaOutra.addEventListener("click", () => {
    estado.outras.push("");
    renderOutras();
    focarCaixa(estado.outras.length - 1);
  });

  el.numero.addEventListener("input", renderCabecalho);

  // Também no beforeprint: pega o Ctrl+P do navegador, que não passa
  // pelo botão, e a página que virou a noite aberta.
  window.addEventListener("beforeprint", renderCabecalho);

  el.btnImprimir.addEventListener("click", () => {
    renderCabecalho();
    const grupos = gruposDaFolha();
    log.info(
      "Imprimindo:", grupos.length, "grupos,",
      grupos.reduce((n, g) => n + g.itens.length, 0), "itens, boletim",
      numeroFormatado() || "(sem número)"
    );
    window.print();
  });

  el.btnCopiar.addEventListener("click", () => {
    window.Copiar.copiarComFeedback(el.btnCopiar, folhaComoTexto());
  });

  el.btnLimpar.addEventListener("click", () => {
    estado.tipo = null;
    estado.subtipo = null;
    estado.extras.clear();
    // Vazia, e não [""]: renderOutras devolve a caixa em branco.
    estado.outras = [];
    log.info("Folha limpa.");
    renderTudo();
  });

  lerDaURL();
  renderTudo();
})();
