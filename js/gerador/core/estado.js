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
 *
 * RASCUNHO
 * As respostas são espelhadas em sessionStorage, e não em localStorage.
 * A escolha é deliberada: sessionStorage sobrevive ao F5 e à navegação
 * dentro da mesma aba — que é o acidente que se quer cobrir, perder meia
 * hora de preenchimento num toque de tecla —, mas morre quando a aba
 * fecha. Nada de dado de vítima ficando em disco depois do atendimento.
 *
 * (Ressalva honesta: o navegador restaura sessionStorage ao reabrir uma
 * aba fechada por engano, ou depois de um travamento. É pouco, mas não é
 * zero.)
 * ---------------------------------------------------------------------------
 */

const Estado = (() => {
  const log = window.Log.criar("gerador");

  const CHAVE_RASCUNHO = "acta-rascunho";

  const respostas = {};
  const tocadas = new Set();

  // ------------------------------------------------------------ rascunho ---

  function persistir() {
    try {
      // Nada respondido ainda não é rascunho: gravar um objeto vazio faria
      // a próxima visita anunciar "rascunho recuperado" sem ter nada.
      if (Object.keys(respostas).length === 0) {
        sessionStorage.removeItem(CHAVE_RASCUNHO);
        return;
      }
      sessionStorage.setItem(
        CHAVE_RASCUNHO,
        JSON.stringify({ respostas, tocadas: Array.from(tocadas), em: Date.now() })
      );
    } catch (e) {
      // storage bloqueado (aba anônima, cota cheia): segue sem rascunho
    }
  }

  function descartarRascunho() {
    try {
      sessionStorage.removeItem(CHAVE_RASCUNHO);
    } catch (e) {}
  }

  /**
   * Repõe o rascunho no estado. Devolve true se havia algo para repor.
   * Chamado uma vez, antes do primeiro render.
   */
  function restaurar() {
    let bruto = null;
    try {
      bruto = sessionStorage.getItem(CHAVE_RASCUNHO);
    } catch (e) {
      return false;
    }
    if (!bruto) return false;

    try {
      const salvo = JSON.parse(bruto);
      if (!salvo || typeof salvo.respostas !== "object" || salvo.respostas === null) return false;
      Object.assign(respostas, salvo.respostas);
      (salvo.tocadas || []).forEach((id) => tocadas.add(id));
      return Object.keys(respostas).length > 0;
    } catch (e) {
      // rascunho corrompido não pode impedir o uso da ferramenta
      log.aviso("Rascunho ilegível no sessionStorage, descartando:", e);
      descartarRascunho();
      return false;
    }
  }

  function obterResposta(id) {
    return respostas[id];
  }

  function obterRespostas() {
    return respostas;
  }

  function definirResposta(id, valor) {
    respostas[id] = valor;
    persistir();
  }

  function removerResposta(id) {
    delete respostas[id];
    tocadas.delete(id);
    persistir();
  }

  function marcarTocada(id) {
    tocadas.add(id);
    persistir();
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
    descartarRascunho();
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
    restaurar,
    descartarRascunho,
  };
})();
