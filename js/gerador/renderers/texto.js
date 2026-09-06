registrarRenderer("texto", {
  revalidaVisibilidade: false,
  valorPadrao: (pergunta) => pergunta.valorPadrao ?? "",
  estaPreenchida: (v) => typeof v === "string" && v.trim() !== "",

  criar(pergunta, valorAtual, aoMudar) {
    const input = document.createElement("textarea");
    input.className = "input-texto";
    input.id = pergunta.id;
    input.rows = 2;
    input.placeholder = pergunta.placeholder || "";
    input.value = valorAtual ?? "";
    input.addEventListener("input", () => aoMudar(input.value));
    return input;
  },
});
