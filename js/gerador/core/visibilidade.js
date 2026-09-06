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

  function perguntaVisivel(pergunta, respostas) {
    if (!pergunta.exibirSe) return true;
    if (typeof pergunta.exibirSe === "function") return pergunta.exibirSe(respostas);
    const condicoes = Array.isArray(pergunta.exibirSe)
      ? pergunta.exibirSe
      : [pergunta.exibirSe];
    return condicoes.every((c) => condicaoUnicaOk(c, respostas));
  }

  // Extrai os ids de pergunta referenciados num exibirSe (usado pelo linter).
  // Condições em forma de função não são inspecionáveis estaticamente —
  // o linter simplesmente não checa esse caso.
  function idsReferenciados(exibirSe) {
    if (!exibirSe || typeof exibirSe === "function") return [];
    const condicoes = Array.isArray(exibirSe) ? exibirSe : [exibirSe];
    return condicoes.map((c) => c.pergunta).filter(Boolean);
  }

  return { perguntaVisivel, idsReferenciados };
})();
