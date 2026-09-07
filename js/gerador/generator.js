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
  const log = window.Log.criar("gerador");

  function gerar() {
    const respostas = Estado.obterRespostas();
    const perguntasAtivas = window.SCHEMA.getPerguntas(respostas);
    const frases = [];

    // Contadas para o log: quando o texto sai menor do que se esperava, a
    // pergunta é sempre "quantas perguntas entraram e quantas viraram
    // frase?" — a diferença são os templates vazios, que são normais em
    // pergunta de bifurcação e sintoma em qualquer outra.
    let visiveis = 0;
    let respondidas = 0;

    perguntasAtivas.forEach((pergunta) => {
      if (!Visibilidade.perguntaVisivel(pergunta, respostas)) return;
      visiveis++;
      const resposta = respostas[pergunta.id];
      const vazio =
        resposta === undefined ||
        resposta === null ||
        resposta === "" ||
        (Array.isArray(resposta) && resposta.length === 0);
      if (vazio || !pergunta.template) return;
      respondidas++;

      const texto = pergunta.template(resposta, respostas, TextoHelpers);
      if (texto && texto.trim()) frases.push(texto.trim());
      else log.debug("Sem frase:", pergunta.id, "(template vazio).");
    });

    if (frases.length === 0) {
      log.aviso(
        "Nada gerado:", perguntasAtivas.length, "perguntas ativas,", visiveis,
        "visíveis,", respondidas, "com resposta e template — nenhuma produziu frase."
      );
      return "";
    }

    const texto = `${frases.join(" ")} ${window.SCHEMA.TEXTO_FECHO}`;
    log.info(
      "Texto gerado:", frases.length, "frases,", texto.length, "caracteres, de",
      visiveis, "perguntas visíveis."
    );
    return texto;
  }

  return { gerar };
})();
