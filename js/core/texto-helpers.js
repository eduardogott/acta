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

  // Concorda um par masculino/feminino com um valor de gênero (ex.:
  // resposta de "comunicante_genero", onde existir essa pergunta —
  // atualmente só dentro de estelionato). "neutro/outro" ou não
  // informado cai no masculino, como padrão.
  function concordarGenero(genero, masculino, feminino) {
    return genero === "fem" ? feminino : masculino;
  }

  // Condensa uma placa veicular pro formato final (sem espaço/hífen,
  // maiúscula): "abc-1234" ou "abc 1234" -> "ABC1234". Usar sempre que a
  // placa for para o texto final — o campo aceita o valor como o usuário
  // digitou, quem normaliza é o template.
  function normalizarPlaca(valor) {
    return String(valor || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  }

  // Condensa um IMEI pro formato final (só dígitos, sem espaço/hífen).
  function normalizarImei(valor) {
    return String(valor || "").replace(/\D/g, "");
  }

  // Condensa um telefone pro formato final "DDD número" (ex.: "51
  // 987654321"), aceitando entrada com parênteses/espaço/hífen em
  // qualquer combinação — usar sempre que o telefone for para o texto
  // final.
  function normalizarTelefone(valor) {
    const digitos = String(valor || "").replace(/\D/g, "");
    if (digitos.length <= 2) return digitos;
    return `${digitos.slice(0, 2)} ${digitos.slice(2)}`;
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
    concordarGenero,
    normalizarPlaca,
    normalizarImei,
    normalizarTelefone,
  };
})();
