/**
 * ENGINE.JS
 * ---------------------------------------------------------------------------
 * Orquestrador. Não sabe desenhar nenhum tipo de pergunta específico (isso
 * é dos renderers em js/renderers/), não sabe o que é "exibirSe" (isso é
 * de core/visibilidade.js), não guarda respostas (isso é de
 * core/estado.js). Aqui só decide: o que está visível agora, como isso
 * vira DOM, e o que ainda falta responder.
 * ---------------------------------------------------------------------------
 */

const Engine = (() => {
  // Toda pergunta é obrigatória quando visível (não existe "opcional" —
  // ver nota em schema.js). Uma pergunta está "satisfeita" quando o
  // usuário já interagiu com ela (tocada), o renderer considera o valor
  // preenchido, e — se houver "validador" — ele aprova o valor.
  function perguntaSatisfeita(pergunta, valor) {
    const renderer = window.RENDERERS[pergunta.tipo];
    if (!renderer) return true; // schema quebrado — linter já avisou, engine não trava
    if (!Estado.foiTocada(pergunta.id)) return false;
    if (!renderer.estaPreenchida(valor)) return false;
    if (renderer.estaTudoValido && !renderer.estaTudoValido(pergunta, valor)) return false;
    const validador = resolverValidador(pergunta);
    if (validador) {
      const respostas = Estado.obterRespostas();
      return validador(valor, respostas) === true;
    }
    return true;
  }

  function validarEMostrarErro(pergunta, valor, erroEl) {
    const renderer = window.RENDERERS[pergunta.tipo];
    let mensagem = null;

    if (Estado.foiTocada(pergunta.id) && !renderer.estaPreenchida(valor)) {
      mensagem = "Esta pergunta precisa de uma resposta.";
    } else if (renderer.estaPreenchida(valor)) {
      if (renderer.estaTudoValido && !renderer.estaTudoValido(pergunta, valor)) {
        mensagem = "Revise os itens abaixo — algum campo está incompleto ou inválido.";
      } else {
        const validador = resolverValidador(pergunta);
        if (validador) {
          const resultado = validador(valor, Estado.obterRespostas());
          if (resultado !== true) mensagem = resultado;
        }
      }
    }

    erroEl.textContent = mensagem || "";
    erroEl.classList.toggle("visivel", !!mensagem);
  }

  function criarWrapper(pergunta) {
    const wrapper = document.createElement("div");
    wrapper.className = "pergunta";
    wrapper.id = `bloco-${pergunta.id}`;
    wrapper.dataset.id = pergunta.id;
    wrapper.tabIndex = -1;

    const label = document.createElement("label");
    label.className = "pergunta-texto";
    label.textContent = pergunta.texto;
    wrapper.appendChild(label);

    if (pergunta.ajuda) {
      const ajuda = document.createElement("p");
      ajuda.className = "pergunta-ajuda";
      ajuda.textContent = pergunta.ajuda;
      wrapper.appendChild(ajuda);
    }
    return wrapper;
  }

  function renderPergunta(pergunta) {
    const renderer = window.RENDERERS[pergunta.tipo];
    const wrapper = criarWrapper(pergunta);

    if (!renderer) {
      const aviso = document.createElement("p");
      aviso.className = "pergunta-erro visivel";
      aviso.textContent = `Tipo de pergunta "${pergunta.tipo}" não tem renderer registrado.`;
      wrapper.appendChild(aviso);
      return wrapper;
    }

    const valorAtual = Estado.obterResposta(pergunta.id) ?? renderer.valorPadrao(pergunta);

    const erroEl = document.createElement("p");
    erroEl.className = "pergunta-erro";

    const aoMudar = (novoValor, opcoes = {}) => {
      Estado.definirResposta(pergunta.id, novoValor);
      Estado.marcarTocada(pergunta.id);
      validarEMostrarErro(pergunta, novoValor, erroEl);
      const precisaRebuild = opcoes.estrutural ?? renderer.revalidaVisibilidade;
      if (precisaRebuild) {
        renderTudo();
      } else {
        atualizarChecklistEBotao();
      }
    };

    wrapper.appendChild(renderer.criar(pergunta, valorAtual, aoMudar));
    wrapper.appendChild(erroEl);

    // Se já existe valor (ex.: voltando de uma pergunta que ficou
    // escondida e voltou a aparecer), mostra o estado de validação atual.
    if (Estado.foiTocada(pergunta.id)) validarEMostrarErro(pergunta, valorAtual, erroEl);

    return wrapper;
  }

  function renderTudo() {
    const container = document.getElementById("perguntas");
    const perguntasAtivas = window.SCHEMA.getPerguntas(Estado.obterRespostas());
    const idsAtivos = new Set(perguntasAtivas.map((p) => p.id));

    Estado.limparNaoAtivas(idsAtivos);

    container.innerHTML = "";
    perguntasAtivas.forEach((pergunta) => {
      if (!Visibilidade.perguntaVisivel(pergunta, Estado.obterRespostas())) {
        Estado.removerResposta(pergunta.id);
        return;
      }
      container.appendChild(renderPergunta(pergunta));
    });

    atualizarChecklistEBotao();
  }

  function calcularPendencias() {
    const respostas = Estado.obterRespostas();
    const perguntasAtivas = window.SCHEMA.getPerguntas(respostas);
    return perguntasAtivas.filter(
      (p) => Visibilidade.perguntaVisivel(p, respostas) && !perguntaSatisfeita(p, respostas[p.id])
    );
  }

  function atualizarChecklistEBotao() {
    const pendencias = calcularPendencias();
    const btn = document.getElementById("btn-gerar");
    const painel = document.getElementById("pendencias");

    if (btn) btn.disabled = pendencias.length > 0;

    if (!painel) return;
    painel.innerHTML = "";

    if (pendencias.length === 0) {
      painel.classList.add("escondido");
      return;
    }
    painel.classList.remove("escondido");

    const titulo = document.createElement("p");
    titulo.className = "pendencias-titulo";
    titulo.textContent =
      pendencias.length === 1 ? "Falta 1 pergunta:" : `Faltam ${pendencias.length} perguntas:`;
    painel.appendChild(titulo);

    const lista = document.createElement("div");
    lista.className = "pendencias-lista";
    pendencias.forEach((p) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "pendencia-chip";
      chip.textContent = p.texto;
      chip.addEventListener("click", () => irParaPergunta(p.id));
      lista.appendChild(chip);
    });
    painel.appendChild(lista);
  }

  function irParaPergunta(id) {
    const bloco = document.getElementById(`bloco-${id}`);
    if (!bloco) return;
    bloco.scrollIntoView({ behavior: "smooth", block: "center" });
    const focavel = bloco.querySelector("input, textarea, button");
    (focavel || bloco).focus({ preventScroll: true });
  }

  function reset() {
    Estado.reset();
    renderTudo();
    document.getElementById("saida-wrapper")?.classList.add("escondido");
  }

  return {
    init: renderTudo,
    reset,
    calcularPendencias,
  };
})();
