registrarRenderer("dinheiro", {
  revalidaVisibilidade: false,
  valorPadrao: () => 0,
  // Sempre "preenchido" numericamente (mesmo o padrão 0) — por isso o
  // engine só considera essa pergunta respondida quando, além disso,
  // ela foi "tocada" pelo usuário (ver estado.js / engine.js).
  estaPreenchida: (v) => typeof v === "number" && !Number.isNaN(v),

  criar(pergunta, valorAtual, aoMudar) {
    const box = document.createElement("div");
    box.className = "input-dinheiro";

    const prefixo = document.createElement("span");
    prefixo.textContent = "R$";

    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "numeric";
    input.id = pergunta.id;

    box.appendChild(prefixo);
    box.appendChild(input);

    function render(centavos) {
      const reais = centavos / 100;
      input.value = reais.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return reais;
    }

    render(Math.round((valorAtual || 0) * 100));

    input.addEventListener("input", () => {
      const digitos = input.value.replace(/\D/g, "");
      const reais = render(Number(digitos || 0));
      aoMudar(reais);
    });

    return box;
  },
});
