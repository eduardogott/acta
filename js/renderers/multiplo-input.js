/**
 * Reaproveita os OUTROS renderers pra desenhar cada campo de um item (ex.:
 * o campo "valor" de uma transferência Pix usa o mesmo renderer do tipo
 * "dinheiro" que uma pergunta comum usaria). Cada campo pode ter seu
 * próprio "validador" — é aqui que, por exemplo, o campo "chave" de um
 * Pix pode validar CPF/CNPJ sem o engine genérico saber nada sobre isso.
 *
 * Duas operações são "estruturais" (adicionar/remover item — podem mudar
 * quantos itens existem, então refazem a tela inteira via aoMudar(...,
 * {estrutural:true})); editar um campo de um item já existente NÃO é
 * (aoMudar(..., {estrutural:false}), só atualiza o estado — evita perder
 * o foco a cada tecla digitada).
 */
function validarCampoIndividual(campo, valor) {
  const vazio = String(valor ?? "").trim() === "";
  if (vazio) {
    return campo.obrigatoria !== false ? "Campo obrigatório." : null;
  }
  const validador = resolverValidador(campo);
  if (validador) {
    const resultado = validador(valor, Estado.obterRespostas());
    if (resultado !== true) return resultado;
  }
  return null;
}

registrarRenderer("multiplo-input", {
  revalidaVisibilidade: true,
  valorPadrao: () => [],
  estaPreenchida: (v) => Array.isArray(v) && v.length > 0,

  // Chamado pelo engine (calcularPendencias) além de estaPreenchida — é
  // aqui que erros dentro dos itens passam a bloquear o botão "Gerar
  // texto", não só a aparência visual do campo.
  estaTudoValido(pergunta, valor) {
    const lista = valor || [];
    if (lista.length === 0) return false;
    return lista.every((item) =>
      pergunta.campos.every((campo) => validarCampoIndividual(campo, item[campo.id]) === null)
    );
  },

  criar(pergunta, valorAtual, aoMudar) {
    const lista = valorAtual ? [...valorAtual] : [];

    const raiz = document.createElement("div");
    const container = document.createElement("div");
    container.className = "multiplo-input-lista";
    raiz.appendChild(container);

    function renderItem(item, index) {
      const card = document.createElement("div");
      card.className = "multiplo-input-item";

      const cabecalho = document.createElement("div");
      cabecalho.className = "multiplo-input-cabecalho";
      const rotulo = document.createElement("span");
      rotulo.textContent = `${pergunta.itemLabel || "Item"} ${index + 1}`;
      cabecalho.appendChild(rotulo);

      const btnRemover = document.createElement("button");
      btnRemover.type = "button";
      btnRemover.className = "btn-remover";
      btnRemover.textContent = "Remover";
      btnRemover.addEventListener("click", () => {
        lista.splice(index, 1);
        aoMudar(lista, { estrutural: true });
      });
      cabecalho.appendChild(btnRemover);
      card.appendChild(cabecalho);

      pergunta.campos.forEach((campo) => {
        const campoWrapper = document.createElement("div");
        campoWrapper.className = "campo-inline";

        const label = document.createElement("label");
        label.textContent = campo.texto;
        campoWrapper.appendChild(label);

        const renderer = window.RENDERERS[campo.tipo];
        if (!renderer) {
          campoWrapper.appendChild(
            document.createTextNode(`[tipo de campo desconhecido: "${campo.tipo}"]`)
          );
          card.appendChild(campoWrapper);
          return;
        }

        const erroEl = document.createElement("p");
        erroEl.className = "campo-erro";

        const idUnico = `${pergunta.id}__${index}__${campo.id}`;
        const controle = renderer.criar(
          { ...campo, id: idUnico },
          item[campo.id] ?? renderer.valorPadrao(campo),
          (novoValor) => {
            item[campo.id] = novoValor;
            const mensagem = validarCampoIndividual(campo, novoValor);
            erroEl.textContent = mensagem || "";
            erroEl.classList.toggle("visivel", !!mensagem);
            // edição de campo NÃO é estrutural: não refaz a tela, só o
            // estado — preserva o foco enquanto o usuário digita.
            aoMudar(lista, { estrutural: false });
          }
        );

        campoWrapper.appendChild(controle);
        campoWrapper.appendChild(erroEl);
        card.appendChild(campoWrapper);
      });

      container.appendChild(card);
    }

    lista.forEach(renderItem);

    const btnAdicionar = document.createElement("button");
    btnAdicionar.type = "button";
    btnAdicionar.className = "btn-adicionar";
    btnAdicionar.textContent = `+ Adicionar ${pergunta.itemLabel || "item"}`;
    btnAdicionar.addEventListener("click", () => {
      const novoItem = {};
      pergunta.campos.forEach((c) => {
        novoItem[c.id] = window.RENDERERS[c.tipo] ? window.RENDERERS[c.tipo].valorPadrao(c) : "";
      });
      lista.push(novoItem);
      aoMudar(lista, { estrutural: true });
    });
    raiz.appendChild(btnAdicionar);

    return raiz;
  },
});
