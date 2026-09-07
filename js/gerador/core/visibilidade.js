/**
 * VISIBILIDADE.JS
 * ---------------------------------------------------------------------------
 * Avalia "exibirSe" de forma pura: recebe as respostas como parâmetro, não
 * depende de estado escondido. Usado pelo engine (pra decidir o que
 * desenhar), pelo generator (pra decidir o que entra no texto) e pelo
 * linter (pra validar se as condições apontam pra ids que existem).
 * ---------------------------------------------------------------------------
 */

const Visibilidade = (() => {
  function condicaoUnicaOk(cond, respostas) {
    const valorAtual = respostas[cond.pergunta];

    if ("preenchida" in cond) {
      const preenchida =
        valorAtual !== undefined &&
        valorAtual !== null &&
        valorAtual !== "" &&
        !(Array.isArray(valorAtual) && valorAtual.length === 0);
      return cond.preenchida ? preenchida : !preenchida;
    }
    if ("igual" in cond) return valorAtual === cond.igual;
    if ("diferente" in cond) return valorAtual !== cond.diferente;
    if ("umDe" in cond) return cond.umDe.includes(valorAtual);
    if ("incluiValor" in cond)
      return Array.isArray(valorAtual) && valorAtual.includes(cond.incluiValor);
    return true;
  }

  // Um exibirSe pode vir sozinho ou dentro de um array; quem consome não
  // deveria precisar saber disso, então sai sempre em forma de lista.
  // Condições em forma de FUNÇÃO não são inspecionáveis estaticamente:
  // devolvem lista vazia, e o linter simplesmente não checa esse caso.
  function condicoesDe(exibirSe) {
    if (!exibirSe || typeof exibirSe === "function") return [];
    return Array.isArray(exibirSe) ? exibirSe : [exibirSe];
  }

  function perguntaVisivel(pergunta, respostas) {
    if (!pergunta.exibirSe) return true;
    if (typeof pergunta.exibirSe === "function") return pergunta.exibirSe(respostas);
    return condicoesDe(pergunta.exibirSe).every((c) => condicaoUnicaOk(c, respostas));
  }

  return { perguntaVisivel, condicoesDe };
})();
