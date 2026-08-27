/**
 * ESTADO.JS
 * ---------------------------------------------------------------------------
 * Única fonte de verdade das respostas. Nada de DOM aqui — é só um objeto
 * de dados + os controles mínimos pra saber quando uma pergunta já foi
 * "tocada" pelo usuário (diferente de "tem um valor padrão").
 *
 * Por que "tocado" importa: campos como dinheiro/número nascem com um
 * valor padrão (0 / ""), então "tem valor" sozinho não prova que o
 * usuário respondeu. "Tocado" é marcado só quando o usuário efetivamente
 * interage com o campo.
 * ---------------------------------------------------------------------------
 */

const Estado = (() => {
  const respostas = {};
  const tocadas = new Set();

  function obterResposta(id) {
    return respostas[id];
  }

  function obterRespostas() {
    return respostas;
  }

  function definirResposta(id, valor) {
    respostas[id] = valor;
  }

  function removerResposta(id) {
    delete respostas[id];
    tocadas.delete(id);
  }

  function marcarTocada(id) {
    tocadas.add(id);
  }

  function foiTocada(id) {
    return tocadas.has(id);
  }

  function limparNaoAtivas(idsAtivos) {
    Object.keys(respostas).forEach((id) => {
      if (!idsAtivos.has(id)) removerResposta(id);
    });
  }

  function reset() {
    Object.keys(respostas).forEach((id) => delete respostas[id]);
    tocadas.clear();
  }

  return {
    obterResposta,
    obterRespostas,
    definirResposta,
    removerResposta,
    marcarTocada,
    foiTocada,
    limparNaoAtivas,
    reset,
  };
})();
