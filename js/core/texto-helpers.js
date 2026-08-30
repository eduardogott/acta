/**
 * TEXTO-HELPERS.JS
 * ---------------------------------------------------------------------------
 * Funções utilitárias passadas como terceiro argumento (h) pra todo
 * template(resposta, respostas, h) do schema.
 * ---------------------------------------------------------------------------
 */

const TextoHelpers = (() => {
  function getPergunta(id, respostas) {
    return window.SCHEMA.getPerguntas(respostas).find((p) => p.id === id);
  }

  function textoOpcaoEm(perguntaId, valor, respostas) {
    const p = getPergunta(perguntaId, respostas);
    if (!p || !p.opcoes) return valor;
    const op = p.opcoes.find((o) => o.valor === valor);
    return op ? op.texto : valor;
  }

  // Atalho pra "multipla" (valor único) — assinatura enxuta pro caso comum.
  function textoOpcao(perguntaId, valor) {
    return textoOpcaoEm(perguntaId, valor, Estado.obterRespostas());
  }

  function textoOpcaoEmAtual(perguntaId, valor) {
    return textoOpcaoEm(perguntaId, valor, Estado.obterRespostas());
  }

  function formatMoney(valorEmReais) {
    const n = Number(valorEmReais || 0);
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  /**
   * Junta uma lista em português, com vírgula entre os itens e o
   * conectivo (padrão "e") só antes do último:
   *   juntarLista(["a"])              -> "a"
   *   juntarLista(["a", "b"])         -> "a e b"
   *   juntarLista(["a", "b", "c"])    -> "a, b e c"
   *   juntarLista(["a", "b", "c"], "ou") -> "a, b ou c"
   */
  function juntarLista(itens, conectivo = "e") {
    const lista = (itens || []).filter((i) => i !== undefined && i !== null && i !== "");
    if (lista.length === 0) return "";
    if (lista.length === 1) return lista[0];
    if (lista.length === 2) return `${lista[0]} ${conectivo} ${lista[1]}`;
    return `${lista.slice(0, -1).join(", ")} ${conectivo} ${lista[lista.length - 1]}`;
  }

  /**
   * Como juntarLista, mas pra CLÁUSULAS completas (frases inteiras, que
   * já têm vírgulas internas) em vez de palavras soltas — por isso separa
   * com vírgula/ponto-e-vírgula antes do conectivo, em vez de só espaço:
   *   juntarClausulas(["efetuou X", "efetuou Y"])
   *     -> "efetuou X, bem como efetuou Y"
   *   juntarClausulas(["efetuou X", "efetuou Y", "efetuou Z"])
   *     -> "efetuou X; efetuou Y; bem como efetuou Z"
   */
  function juntarClausulas(itens, conectivo = "bem como") {
    const lista = (itens || []).filter((i) => i !== undefined && i !== null && i !== "");
    if (lista.length === 0) return "";
    if (lista.length === 1) return lista[0];
    if (lista.length === 2) return `${lista[0]}, ${conectivo} ${lista[1]}`;
    return `${lista.slice(0, -1).join("; ")}; ${conectivo} ${lista[lista.length - 1]}`;
  }

  // Garante que um texto livre digitado pelo usuário termine com pontuação
  // — necessário porque o texto final é um parágrafo corrido: sem isso,
  // a frase seguinte gruda sem separação nenhuma.
  function garantirPonto(texto) {
    const t = (texto || "").trim();
    if (!t) return t;
    return /[.!?]$/.test(t) ? t : `${t}.`;
  }

  // Ordinal por extenso em português ("a primeira transferência", "o
  // segundo pagamento"...), usado pra enumerar itens de multiplo-input.
  // `num` é 1-based (ordinal(1, "f") -> "primeira"). `genero` é "f" ou
  // "m" (default "f"). Além do décimo, cai num fallback numérico
  // (11º/11ª...) — mais que isso na prática seria incomum, mas não
  // quebra se acontecer.
  const ORDINAIS = {
    f: ["primeira", "segunda", "terceira", "quarta", "quinta", "sexta", "sétima", "oitava", "nona", "décima"],
    m: ["primeiro", "segundo", "terceiro", "quarto", "quinto", "sexto", "sétimo", "oitavo", "nono", "décimo"],
  };
  function ordinal(num, genero = "f") {
    const lista = ORDINAIS[genero] || ORDINAIS.f;
    return lista[num - 1] || `${num}º${genero === "m" ? "" : "ª"}`;
  }

  return {
    textoOpcao,
    textoOpcaoEm: textoOpcaoEmAtual,
    formatMoney,
    juntarLista,
    juntarClausulas,
    garantirPonto,
    ordinal,
  };
})();
