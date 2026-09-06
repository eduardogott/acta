registrarRenderer("selecao", {
  revalidaVisibilidade: true,
  valorPadrao: () => [],
  estaPreenchida: (v) => Array.isArray(v) && v.length > 0,

  criar(pergunta, valorAtual, aoMudar) {
    const grupo = document.createElement("div");
    grupo.className = "opcoes opcoes-selecao";
    const atual = valorAtual || [];

    pergunta.opcoes.forEach((op) => {
      const id = `${pergunta.id}__${op.valor}`;
      const item = document.createElement("label");
      item.className = "opcao-item";
      item.htmlFor = id;

      const input = document.createElement("input");
      input.type = "checkbox";
      input.id = id;
      input.value = op.valor;
      input.checked = atual.includes(op.valor);
      input.addEventListener("change", () => {
        const set = new Set(atual);
        input.checked ? set.add(op.valor) : set.delete(op.valor);
        aoMudar(Array.from(set));
      });

      item.appendChild(input);
      item.appendChild(document.createTextNode(op.texto));
      grupo.appendChild(item);
    });

    return grupo;
  },
});
