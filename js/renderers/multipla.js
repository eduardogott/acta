registrarRenderer("multipla", {
  revalidaVisibilidade: true,
  valorPadrao: () => undefined,
  estaPreenchida: (v) => v !== undefined && v !== null && v !== "",

  criar(pergunta, valorAtual, aoMudar) {
    const grupo = document.createElement("div");
    grupo.className = "opcoes opcoes-multipla";

    pergunta.opcoes.forEach((op) => {
      const id = `${pergunta.id}__${op.valor}`;
      const item = document.createElement("label");
      item.className = "opcao-item";
      item.htmlFor = id;

      const input = document.createElement("input");
      input.type = "radio";
      input.name = pergunta.id;
      input.id = id;
      input.value = op.valor;
      input.checked = valorAtual === op.valor;
      input.addEventListener("change", () => aoMudar(op.valor));

      item.appendChild(input);
      item.appendChild(document.createTextNode(op.texto));
      grupo.appendChild(item);
    });

    return grupo;
  },
});
