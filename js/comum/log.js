/**
 * LOG.JS
 * ---------------------------------------------------------------------------
 * Um log por ferramenta, com a marca no começo de cada linha:
 *
 *   [acta.gerador]     Texto gerado: 9 frases, 1204 caracteres.
 *   [acta.conversor]   Motor carregado em +2841ms.
 *   [acta.conversas]   Conversa lida: 412 mensagens, 3 linhas ignoradas.
 *
 * Existe porque o console é o único relatório que sobra: a suíte roda
 * inteira no navegador, não há servidor para consultar depois, e um
 * "deu erro" relatado no dia seguinte precisa ser reconstituído a partir
 * do que a tela guardou. Filtrar por `acta.` no console mostra a suíte e
 * mais nada; por `acta.conversor`, só o conversor.
 *
 * COMO USAR
 *   const log = window.Log.criar("gerador");
 *   log.info("Schema carregado:", n, "tipos.");
 *   log.aviso("Rascunho ilegível, descartando.", erro);
 *   log.erro("Worker falhou.", evento);
 *   log.debug("Linha do ffmpeg…");     // só com ?debug=1 na URL
 *
 * `debug` é para o que sai às centenas — uma linha por quadro, por tecla,
 * por render. Sem o filtro, esse volume esconde justamente a linha que
 * interessa.
 *
 * O QUE NÃO ENTRA NO LOG
 * Nada que o usuário digitou: nome, CPF, telefone, endereço, o texto da
 * ocorrência, a conversa colada. As ferramentas lidam com dado de vítima,
 * e um console aberto numa máquina de balcão não é lugar para isso.
 * Registre a FORMA — quantos itens, qual pergunta, qual veredito —, nunca
 * o conteúdo. Onde a distinção é sutil, o comentário no ponto da chamada
 * explica por que aquilo pode aparecer.
 * ---------------------------------------------------------------------------
 */
window.Log = (function () {
  "use strict";

  const { PREFIXO, ESTILO, PARAMETRO_DEBUG, VALOR_DEBUG } = globalThis.Config.LOG;

  // O filtro vale para a página inteira, e não por ferramenta: quem está
  // depurando não sabe de antemão qual módulo vai falar.
  const VERBOSE =
    new URLSearchParams(location.search).get(PARAMETRO_DEBUG) === VALOR_DEBUG;
  const t0 = performance.now();

  /** "+2841ms" desde o carregamento da página. */
  function desdeOInicio() {
    return "+" + Math.round(performance.now() - t0) + "ms";
  }

  // O mesmo objeto para o mesmo nome. Os arquivos sem IIFE (registry.js,
  // validadores.js) não podem declarar `const log` no topo — scripts
  // clássicos dividem o escopo global e a segunda declaração seria um
  // SyntaxError —, então chamam criar() no próprio ponto da chamada.
  const criados = {};

  function criar(ferramenta) {
    if (criados[ferramenta]) return criados[ferramenta];

    const marca = "%c[" + PREFIXO + ferramenta + "]";

    function emitir(metodo, args) {
      console[metodo].apply(console, [marca, ESTILO].concat(Array.prototype.slice.call(args)));
    }

    const api = {
      info: function () { emitir("log", arguments); },
      aviso: function () { emitir("warn", arguments); },
      erro: function () { emitir("error", arguments); },
      debug: function () { if (VERBOSE) emitir("log", arguments); },

      /** Uma tabela, quando são muitos pares nome/valor de uma vez só. */
      tabela: function (rotulo, objeto) {
        emitir("log", [rotulo]);
        if (console.table) console.table(objeto);
        else emitir("log", [objeto]);
      },

      // Agrupam linhas relacionadas (a saída do linter, por exemplo).
      // Sempre em par, e o fecho no `finally` quando houver risco de
      // exceção no meio — grupo aberto engole tudo o que vier depois.
      grupo: function () { emitir("group", arguments); },
      fimDoGrupo: function () { console.groupEnd(); },

      desdeOInicio: desdeOInicio,
      verbose: VERBOSE,
    };

    criados[ferramenta] = api;
    return api;
  }

  return { criar, VERBOSE, desdeOInicio };
})();
