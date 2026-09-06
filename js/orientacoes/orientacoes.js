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

  const DADOS = window.ORIENTACOES;

  const el = {
    opcoesTipo: document.getElementById("opcoes-tipo"),
    blocoSubtipo: document.getElementById("bloco-subtipo"),
    rotuloSubtipo: document.getElementById("rotulo-subtipo"),
    opcoesSubtipo: document.getElementById("opcoes-subtipo"),
    blocoExtras: document.getElementById("bloco-extras"),
    opcoesExtras: document.getElementById("opcoes-extras"),
    titulo: document.getElementById("saida-titulo"),
    subtitulo: document.getElementById("saida-subtitulo"),
    grupos: document.getElementById("saida-grupos"),
    vazio: document.getElementById("saida-vazio"),
    btnImprimir: document.getElementById("btn-imprimir"),
    btnCopiar: document.getElementById("btn-copiar"),
    btnLimpar: document.getElementById("btn-limpar"),
  };

  const estado = {
    tipo: null,
    subtipo: null,
    extras: new Set(),
  };

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
    if (!tipo) return [];

    const grupos = [{ titulo: tipo.label, itens: tipo.itens || [] }];

    const subtipo = (tipo.subtipos || []).find((s) => s.chave === estado.subtipo);
    if (subtipo) grupos.push({ titulo: subtipo.label, itens: subtipo.itens });

    (tipo.extras || []).forEach((x) => {
      if (estado.extras.has(x.chave)) grupos.push({ titulo: x.label, itens: x.itens });
    });

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

    if (!tipo) {
      el.titulo.textContent = "";
      el.subtitulo.textContent = "";
      return;
    }

    const subtipo = (tipo.subtipos || []).find((s) => s.chave === estado.subtipo);
    el.titulo.textContent = "O que fazer agora — " + tipo.label.toLowerCase();
    el.subtitulo.textContent = subtipo ? subtipo.label : "";

    grupos.forEach((g) => {
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
      el.grupos.appendChild(bloco);
    });
  }

  function renderTudo() {
    renderEscolhas();
    renderFolha();
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

  el.btnImprimir.addEventListener("click", () => window.print());

  el.btnCopiar.addEventListener("click", async () => {
    const original = el.btnCopiar.textContent;
    const texto = folhaComoTexto();
    const restaurar = (msg, classe) => {
      el.btnCopiar.textContent = msg;
      el.btnCopiar.classList.add(classe);
      setTimeout(() => {
        el.btnCopiar.textContent = original;
        el.btnCopiar.classList.remove(classe);
      }, 1800);
    };
    try {
      if (!navigator.clipboard) throw new Error("clipboard indisponível");
      await navigator.clipboard.writeText(texto);
      restaurar("Copiado!", "btn-ok");
    } catch (err) {
      console.warn("[orientacoes] não consegui copiar:", err);
      restaurar("Não consegui copiar", "btn-falhou");
    }
  });

  el.btnLimpar.addEventListener("click", () => {
    estado.tipo = null;
    estado.subtipo = null;
    estado.extras.clear();
    renderTudo();
  });

  renderTudo();
})();
