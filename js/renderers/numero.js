registrarRenderer("numero", {
  revalidaVisibilidade: false,
  valorPadrao: () => "",
  estaPreenchida: (v) => v !== "" && v !== undefined && v !== null && !Number.isNaN(Number(v)),

  criar(pergunta, valorAtual, aoMudar) {
    const input = document.createElement("input");
    input.type = "number";
    input.className = "input-numero";
    input.id = pergunta.id;
    input.placeholder = pergunta.placeholder || "";
    input.value = valorAtual ?? "";
    input.addEventListener("input", () => {
      aoMudar(input.value === "" ? "" : Number(input.value));
    });
    return input;
  },
});
