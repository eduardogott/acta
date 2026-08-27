/**
 * GENERATOR.JS
 * ---------------------------------------------------------------------------
 * Não agrupa mais por seção — é um parágrafo só. A ordem das frases segue
 * a ordem de window.SCHEMA.getPerguntas(respostas) (iniciais -> tipo
 * escolhido -> finais). Cada template já devolve a frase pronta (com
 * verbo de registro e pontuação); aqui só juntamos com espaço e
 * acrescentamos o fecho fixo no final.
 * ---------------------------------------------------------------------------
 */

const Generator = (() => {
  function gerar() {
    const respostas = Estado.obterRespostas();
    const perguntasAtivas = window.SCHEMA.getPerguntas(respostas);
    const frases = [];

    perguntasAtivas.forEach((pergunta) => {
      if (!Visibilidade.perguntaVisivel(pergunta, respostas)) return;
      const resposta = respostas[pergunta.id];
      const vazio =
        resposta === undefined ||
        resposta === null ||
        resposta === "" ||
        (Array.isArray(resposta) && resposta.length === 0);
      if (vazio || !pergunta.template) return;

      const texto = pergunta.template(resposta, respostas, TextoHelpers);
      if (texto && texto.trim()) frases.push(texto.trim());
    });

    if (frases.length === 0) return "";
    return `${frases.join(" ")} ${window.SCHEMA.TEXTO_FECHO}`;
  }

  return { gerar };
})();
