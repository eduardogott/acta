/**
 * ROTEIRO.JS
 * ---------------------------------------------------------------------------
 * Monta a lista de perguntas a partir de js/roteiro/dados.js. Não tem
 * conteúdo próprio: acrescentar um fato é mexer só no arquivo de dados.
 *
 * A lista é acumulativa como a das orientações — o que vale para o fato
 * escolhido, mais o que vale para qualquer atendimento. E como lá, os
 * grupos ficam separados: quinze perguntas corridas não se leem em pé,
 * com alguém do outro lado do balcão esperando.
 *
 * A diferença entre as duas páginas é o destinatário. As orientações são
 * o papel que a pessoa leva embora, escritas para ela. Isto aqui fica na
 * tela e é escrito para quem atende. Daí o link de uma para a outra: são
 * o mesmo atendimento, vistos dos dois lados.
 * ---------------------------------------------------------------------------
 */
(function () {
  "use strict";

  const log = window.Log.criar("roteiro");

  const DADOS = window.ROTEIRO;

  const el = {
    opcoesFato: document.getElementById("opcoes-fato"),
    saida: document.getElementById("roteiro-saida"),
    vazio: document.getElementById("saida-vazio"),
    titulo: document.getElementById("saida-titulo"),
    nota: document.getElementById("saida-nota"),
    linkOrientacoes: document.getElementById("link-orientacoes"),
    grupos: document.getElementById("saida-grupos"),
    btnCopiar: document.getElementById("btn-copiar"),
    btnLimpar: document.getElementById("btn-limpar"),
  };

  const estado = { fato: null };

  function contarPerguntas(fato) {
    return fato.grupos.reduce((n, g) => n + g.perguntas.length, 0);
  }

  log.info(
    "Perguntas prontas:", DADOS.fatos.length, "fatos,",
    DADOS.fatos.reduce((n, f) => n + contarPerguntas(f), 0), "perguntas,",
    DADOS.comuns.perguntas.length, "comuns a todo atendimento."
  );

  // -------------------------------------------------------------------
  // Ponte para as orientações
  //
  // Mesmo arranjo da tipificação: a página carrega
  // js/orientacoes/dados.js só para ter o rótulo da folha e conferir, na
  // carga, que toda chave apontada existe. Sem essa conferência, um tipo
  // renomeado lá vira link quebrado que ninguém percebe até o balcão.
  // -------------------------------------------------------------------

  const FOLHAS = {};
  (window.ORIENTACOES ? window.ORIENTACOES.tipos : []).forEach((t) => {
    FOLHAS[t.chave] = t.label;
  });

  DADOS.fatos.forEach((f) => {
    if (f.orientacoes && !FOLHAS[f.orientacoes]) {
      log.aviso(
        f.label + ' aponta para a folha "' + f.orientacoes +
          '", que não existe em js/orientacoes/dados.js — o fato fica sem link.'
      );
    }
  });

  /**
   * Estado inicial vindo da URL: ?fato=violencia_domestica
   *
   * Serve ao atalho que se salva para o fato que se atende toda semana,
   * e ao link que um colega manda para outro. Chave que não existe mais
   * é ignorada em silêncio na tela — link velho deve abrir a página, não
   * uma mensagem de erro —, mas nunca no console.
   */
  function lerDaURL() {
    const pedido = new URLSearchParams(location.search).get("fato");
    if (!pedido) return;
    const fato = DADOS.fatos.find((f) => f.chave === pedido);
    if (fato) estado.fato = fato.chave;
    else log.aviso('Parâmetro fato="' + pedido + '" ignorado: não existe em dados.js.');
  }

  /** O inverso: a barra de endereços reflete a escolha atual. */
  function escreverNaURL() {
    // replaceState, e não pushState: cada clique num rádio virando uma
    // entrada de histórico faria o botão "voltar" andar de um em um.
    history.replaceState(
      null, "",
      estado.fato ? "?fato=" + encodeURIComponent(estado.fato) : location.pathname
    );
  }

  function fatoAtual() {
    return DADOS.fatos.find((f) => f.chave === estado.fato) || null;
  }

  function renderEscolhas() {
    el.opcoesFato.innerHTML = "";
    DADOS.fatos.forEach((f) => {
      const label = document.createElement("label");
      label.className = "opcao-item";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = "fato";
      input.value = f.chave;
      input.checked = estado.fato === f.chave;
      input.addEventListener("change", () => {
        estado.fato = f.chave;
        renderTudo();
      });

      label.appendChild(input);
      label.appendChild(document.createTextNode(f.label));
      el.opcoesFato.appendChild(label);
    });
  }

  /** Os grupos que entram na tela, na ordem em que devem ser lidos. */
  function gruposDaTela() {
    const fato = fatoAtual();
    if (!fato) return [];
    // O que vale para qualquer atendimento fecha a lista: é o menos
    // específico, e ler primeiro o que é deste fato importa mais.
    return fato.grupos.concat([
      { titulo: DADOS.comuns.titulo, perguntas: DADOS.comuns.perguntas },
    ]);
  }

  function renderGrupos() {
    const grupos = gruposDaTela();
    el.grupos.innerHTML = "";

    grupos.forEach((g) => {
      const bloco = document.createElement("section");
      bloco.className = "roteiro-grupo";

      const h3 = document.createElement("h3");
      h3.textContent = g.titulo;
      bloco.appendChild(h3);

      const ol = document.createElement("ol");
      g.perguntas.forEach((pergunta) => {
        const li = document.createElement("li");
        li.appendChild(
          document.createTextNode(
            typeof pergunta === "string" ? pergunta : pergunta.texto
          )
        );
        // O "por quê" é a metade que faz a lista valer: sem ele, cada
        // linha é só mais uma pergunta.
        if (pergunta.nota) {
          const porque = document.createElement("span");
          porque.className = "roteiro-porque";
          porque.textContent = pergunta.nota;
          li.appendChild(porque);
        }
        ol.appendChild(li);
      });
      bloco.appendChild(ol);
      el.grupos.appendChild(bloco);
    });

    log.debug(
      "Tela montada:", grupos.length, "grupos,",
      grupos.reduce((n, g) => n + g.perguntas.length, 0), "perguntas."
    );
  }

  function renderSaida() {
    const fato = fatoAtual();

    el.vazio.classList.toggle("escondido", !!fato);
    el.saida.classList.toggle("escondido", !fato);
    el.btnCopiar.disabled = !fato;

    if (!fato) {
      el.grupos.innerHTML = "";
      return;
    }

    el.titulo.textContent = "O que perguntar — " + fato.label.toLowerCase();

    el.nota.textContent = fato.nota || "";
    el.nota.classList.toggle("escondido", !fato.nota);

    if (fato.orientacoes && FOLHAS[fato.orientacoes]) {
      el.linkOrientacoes.href =
        "orientacoes.html?tipo=" + encodeURIComponent(fato.orientacoes);
      el.linkOrientacoes.textContent = "Folha para entregar: " + FOLHAS[fato.orientacoes];
      el.linkOrientacoes.classList.remove("escondido");
    } else {
      el.linkOrientacoes.classList.add("escondido");
    }

    renderGrupos();
  }

  function renderTudo() {
    renderEscolhas();
    renderSaida();
    escreverNaURL();
  }

  /** A mesma lista em texto puro, para colar numa anotação ou num e-mail. */
  function comoTexto() {
    const fato = fatoAtual();
    if (!fato) return "";
    const linhas = [el.titulo.textContent];
    if (fato.nota) linhas.push(fato.nota);
    gruposDaTela().forEach((g) => {
      linhas.push("");
      linhas.push(g.titulo.toUpperCase());
      g.perguntas.forEach((pergunta, i) => {
        const texto = typeof pergunta === "string" ? pergunta : pergunta.texto;
        linhas.push(i + 1 + ". " + texto);
        if (pergunta.nota) linhas.push("   (" + pergunta.nota + ")");
      });
    });
    return linhas.join("\n");
  }

  el.btnCopiar.addEventListener("click", () => {
    window.Copiar.copiarComFeedback(el.btnCopiar, comoTexto());
  });

  el.btnLimpar.addEventListener("click", () => {
    estado.fato = null;
    log.info("Lista limpa.");
    renderTudo();
  });

  lerDaURL();
  renderTudo();
})();
