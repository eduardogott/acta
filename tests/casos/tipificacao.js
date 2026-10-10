// Tipificação: busca e relevância, a coluna de prescrição, a fiança, a
// referência compacta e a gaveta com o texto do artigo.

// O corpo da tabela tem quatro tipos de <tr>: a do fato, a gaveta
// escondida logo abaixo dela, o título de cada grupo (Vida, Honra…) e a
// linha que separa uma camada de relevância da seguinte. Contar "tr" sem
// mais nada contaria as quatro.
var LINHAS = "#corpo-tabela tr:not(.tipificacao-texto-linha):not(.tipificacao-grupo):not(.tipificacao-camada)";

function buscar(termo) {
  digitar("busca", termo);
  return document.querySelectorAll(LINHAS).length;
}

ok("fatos na tabela", window.TIPIFICACAO.length);
igual("tudo aparece sem filtro", buscar(""), window.TIPIFICACAO.length);
igual("busca por nome", buscar("furto") > 0, true);
igual("busca por artigo com pontuação", buscar("art. 155") > 0, true);
igual("busca por artigo colado", buscar("art155") > 0, true);
igual("busca ignora acento", buscar("ameaca") > 0, true);
igual("busca por sinônimo da narrativa", buscar("arrombamento") > 0, true);
igual("busca pela marca", buscar("hediondo") > 0, true);
igual("busca pelo nome curto da lei", buscar("maria da penha") > 0, true);
igual("busca pela referência", buscar("DL2848") > 0, true);
igual("termo inexistente não traz nada", buscar("zzzznada"), 0);
igual("aviso de vazio aparece", vis("sem-resultados"), true);

// --- relevância ----------------------------------------------------------
// "ameaça" está no texto de dezenas de artigos ("grave ameaça"). O que se
// chama ameaça vem primeiro; o constrangimento ilegal, que vem antes na
// tabela mas só casa pelo texto da lei, vem depois.
function refsNaTela() {
  return Array.prototype.map.call(document.querySelectorAll(LINHAS), function (tr) {
    return tr.dataset.ref;
  });
}
buscar("ameaça");
var refs = refsNaTela();
igual("o nome do fato vem primeiro", refs[0], "Art. 147 - DL2848");
igual("o que só casa pelo texto da lei vem depois",
      refs.indexOf("Art. 146 - DL2848") > refs.indexOf("Art. 147 - DL2848"), true);
var camadas = Array.prototype.map.call(document.querySelectorAll("#corpo-tabela tr.tipificacao-camada"),
  function (tr) { return tr.textContent; });
igual("uma linha avisa onde começa o que só está no texto do artigo",
      camadas.some(function (t) { return t.indexOf("texto do artigo") >= 0; }), true);
buscar("");
igual("sem busca, não há camada nenhuma",
      document.querySelectorAll("#corpo-tabela tr.tipificacao-camada").length, 0);

// --- realce ----------------------------------------------------------------
// A busca casa sem acento, mas o realce cai no texto original, com acento.
buscar("ameaca");
var realce = document.querySelector("#corpo-tabela tr[data-ref='Art. 147 - DL2848'] .tipificacao-fato mark");
igual("o termo aparece realçado no nome, com o acento original", realce && realce.textContent, "Ameaça");
igual("com o termo à vista na linha, o botão não leva realce",
      document.querySelector("#corpo-tabela tr[data-ref='Art. 147 - DL2848'] .tipificacao-ver-texto")
        .classList.contains("com-termo"), false);
buscar("coisa alheia movel");
var furto = document.querySelector("#corpo-tabela tr[data-ref='Art. 155 - DL2848']");
igual("quando o termo está só na gaveta, o botão dela leva o realce",
      furto && furto.querySelector(".tipificacao-ver-texto").classList.contains("com-termo"), true);
igual("e dentro da gaveta cada termo vem marcado",
      furto && Array.prototype.map.call(furto.nextElementSibling.querySelectorAll(".tipificacao-texto mark"),
        function (m) { return m.textContent; }).join("|"),
      "coisa|alheia|móvel");
buscar("");
igual("sem busca, nada realçado", document.querySelectorAll("#corpo-tabela mark").length, 0);

buscar("");
marcar("#filtro-jecrim", true);
var soJecrim = document.querySelectorAll(LINHAS).length;
igual("filtro JECRIM reduz a lista", soJecrim > 0 && soJecrim < window.TIPIFICACAO.length, true);
marcar("#filtro-jecrim", false);

marcar("#filtro-domestica", true);
var domesticas = window.TIPIFICACAO.filter(function (e) {
  return (e.marcas || []).indexOf("domestica") >= 0;
}).length;
igual("filtro de violência doméstica mostra só as marcadas",
      document.querySelectorAll(LINHAS).length, domesticas);
igual("e elas existem", domesticas > 0, true);
marcar("#filtro-domestica", false);

var selecao = document.getElementById("filtro-diploma");
selecao.value = "ECA (Lei 8.069/1990)";
selecao.dispatchEvent(new Event("change"));
var doEca = window.TIPIFICACAO.filter(function (e) { return e.diploma === "ECA (Lei 8.069/1990)"; }).length;
igual("filtro de lei mostra só aquela lei", document.querySelectorAll(LINHAS).length, doEca);
igual("o ECA está na tabela", doEca > 0, true);
selecao.value = "";
selecao.dispatchEvent(new Event("change"));

// --- grupos ------------------------------------------------------------
buscar("");
var grupos = {};
window.TIPIFICACAO.forEach(function (e) { grupos[e.grupo] = true; });
igual("toda entrada tem grupo", window.TIPIFICACAO.every(function (e) { return !!e.grupo; }), true);
igual("um título por grupo", document.querySelectorAll("#corpo-tabela tr.tipificacao-grupo").length,
      Object.keys(grupos).length);
buscar("latrocínio");
igual("o filtro leva junto só o título do grupo que sobrou",
      document.querySelectorAll("#corpo-tabela tr.tipificacao-grupo").length, 1);

// --- a referência compacta ---------------------------------------------
// Formato "Art. 121, §2, II - DL2848". Confere-se a forma, que o código
// bate com o diploma da entrada e que aponta para o mesmo dispositivo do
// campo `artigo` — os dois são digitados à mão, e divergir é o erro que
// ninguém vê até colar no sistema.
var FORMATO_REF = /^Art\. \d+(-[A-Z])?(, (§\d+(-[A-Z])?|p\.u\.))?(, [IVXL]+)? - (DL|L)\d+$/;
var CODIGO = {};
window.TIPIFICACAO_DIPLOMAS.forEach(function (d) { CODIGO[d.nome] = d.codigo; });

/** "Art. 163, parágrafo único, III" → "Art. 163, p.u., III". */
function refDoArtigo(artigo) {
  return artigo
    .replace(/º/g, "")
    .replace(/, caput$/, "")
    .replace(/parágrafo único/, "p.u.")
    .replace(/§ /g, "§");
}

var semRef = [], foraDoFormato = [], codigoErrado = [], divergentes = [];
window.TIPIFICACAO.forEach(function (e) {
  if (!e.ref) { semRef.push(e.fato); return; }
  if (!FORMATO_REF.test(e.ref)) foraDoFormato.push(e.ref);
  var partes = e.ref.split(" - ");
  if (CODIGO[e.diploma] !== partes[1]) codigoErrado.push(e.ref + " (" + e.diploma + ")");
  if (refDoArtigo(e.artigo) !== partes[0]) divergentes.push(e.artigo + " ≠ " + e.ref);
});
igual("toda entrada tem ref", semRef, []);
igual("toda ref está no formato", foraDoFormato, []);
igual("o código da ref é o do diploma", codigoErrado, []);
igual("ref e artigo apontam para o mesmo dispositivo", divergentes, []);

var vistas = {}, repetidas = [];
window.TIPIFICACAO.forEach(function (e) {
  if (vistas[e.ref]) repetidas.push(e.ref);
  vistas[e.ref] = true;
});
igual("nenhuma ref repetida", repetidas, []);

buscar("");
igual("cada entrada rende um artigo que copia a ref",
      document.querySelectorAll("#corpo-tabela .tipificacao-ref").length, window.TIPIFICACAO.length);
var exemplo = document.querySelector('#corpo-tabela tr[data-ref="Art. 121, §2, II - DL2848"]');
igual("a linha do exemplo do pedido existe", !!exemplo, true);
// Na coluna vai só o dispositivo e, embaixo, o diploma pelo número; a
// ref inteira fica no título do botão, que é o que se copia.
igual("o botão mostra só o artigo", exemplo && exemplo.querySelector(".tipificacao-ref").textContent,
      "Art. 121, § 2º, II");
igual("e leva a ref no título", exemplo && exemplo.querySelector(".tipificacao-ref").title,
      "Copiar Art. 121, §2, II - DL2848");
igual("o diploma vai pelo número", exemplo && exemplo.querySelector(".tipificacao-diploma").textContent,
      "DL 2848");
igual("a lei especial também", linhaDe("Art. 33 - L11343").querySelector(".tipificacao-diploma").textContent,
      "L 11343");

// --- campos fechados ---------------------------------------------------
var ACOES = ["incondicionada", "condicionada", "privada", "outra"];
var MARCAS = ["hediondo", "equiparado", "inafiancavel", "domestica"];
var invalidas = [];
window.TIPIFICACAO.forEach(function (e) {
  if (ACOES.indexOf(e.acao) < 0) invalidas.push(e.fato + ": acao " + e.acao);
  if (typeof e.jecrim !== "boolean") invalidas.push(e.fato + ": jecrim");
  (e.marcas || []).forEach(function (m) {
    if (MARCAS.indexOf(m) < 0) invalidas.push(e.fato + ": marca " + m);
  });
  if (e.fianca && e.fianca !== "juiz") invalidas.push(e.fato + ": fianca " + e.fianca);
});
igual("ação, jecrim, marcas e fiança só com valores conhecidos", invalidas, []);

// --- prescrição (art. 109 do CP) --------------------------------------
function linhaDe(ref) {
  buscar("");
  return document.querySelector('#corpo-tabela tr[data-ref="' + ref + '"]');
}
function prescricaoDe(ref) {
  var linha = linhaDe(ref);
  return linha ? linha.children[3].textContent.trim() : null;
}

igual("furto (máx 6 anos) prescreve em 12", prescricaoDe("Art. 155 - DL2848"), "12 anos");
igual("furto qualificado (máx 8) prescreve em 12", prescricaoDe("Art. 155, §4, I - DL2848"), "12 anos");
igual("ameaça (máx 6 meses) prescreve em 3", prescricaoDe("Art. 147 - DL2848"), "3 anos");
igual("ameaça contra a mulher (máx 1 ano) prescreve em 4", prescricaoDe("Art. 147, §1 - DL2848"), "4 anos");
igual("homicídio simples (máx 20) prescreve em 20", prescricaoDe("Art. 121 - DL2848"), "20 anos");
igual("estelionato (máx 5) prescreve em 12", prescricaoDe("Art. 171 - DL2848"), "12 anos");
igual("roubo majorado pela arma (máx 16a8m) prescreve em 20", prescricaoDe("Art. 157, §2-A, I - DL2848"), "20 anos");
igual("vias de fato (contravenção) prescreve em 3", prescricaoDe("Art. 21 - DL3688"), "3 anos");
igual("vias de fato contra a mulher (máx 9 meses) prescreve em 3", prescricaoDe("Art. 21, §2 - DL3688"), "3 anos");
igual("bullying (só multa) prescreve em 2", prescricaoDe("Art. 146-A - DL2848"), "2 anos");
igual("injúria racial é imprescritível", prescricaoDe("Art. 2-A - L7716"), "imprescritível");
igual("uso de documento falso depende do documento", prescricaoDe("Art. 304 - DL2848"), "conforme o documento");

buscar("");
var semPrescricao = [];
document.querySelectorAll(LINHAS).forEach(function (tr) {
  if (tr.children[3].textContent.trim() === "—") semPrescricao.push(tr.dataset.ref);
});
igual("nenhum fato ficou sem prescrição", semPrescricao, []);

// --- fiança ------------------------------------------------------------
function fiancaDe(ref) {
  var linha = linhaDe(ref);
  var span = linha && linha.querySelector(".tipificacao-fianca");
  return span ? span.textContent.trim() : null;
}
igual("JECRIM é termo circunstanciado", fiancaDe("Art. 147 - DL2848"), "termo circunstanciado");
igual("até 4 anos, o delegado arbitra", fiancaDe("Art. 168 - DL2848"), "fiança pelo delegado");
igual("furto (máx 6) saiu da fiança do delegado", fiancaDe("Art. 155 - DL2848"), "fiança só pelo juiz");
igual("hediondo é inafiançável", fiancaDe("Art. 213 - DL2848"), "inafiançável");
igual("tráfico (equiparado) é inafiançável", fiancaDe("Art. 33 - L11343"), "inafiançável");
igual("24-A: só o juiz, apesar da pena", fiancaDe("Art. 24-A - L11340"), "fiança só pelo juiz");

// --- etiquetas -----------------------------------------------------------
var latrocinio = linhaDe("Art. 157, §3, II - DL2848");
igual("hediondo vira etiqueta", !!latrocinio.querySelector(".etiqueta.hediondo"), true);
var ameaca = linhaDe("Art. 147 - DL2848");
igual("ação condicionada vira etiqueta", !!ameaca.querySelector(".etiqueta.condicionada"), true);
igual("e o jecrim também", !!ameaca.querySelector(".etiqueta.jecrim"), true);
var ameacaMulher = linhaDe("Art. 147, §1 - DL2848");
igual("violência doméstica vira etiqueta", !!ameacaMulher.querySelector(".etiqueta.domestica"), true);
igual("a forma contra a mulher não é JECRIM", !!ameacaMulher.querySelector(".etiqueta.jecrim"), false);

// --- ponte para as orientações ----------------------------------------
// O link para a folha saiu da linha, mas o mapa continua em
// js/tipificacao/dados.js e o alvo em js/orientacoes/dados.js. Conferi-lo
// mesmo sem link é o que deixa o mapa pronto para quando o link voltar.
buscar("");
var chaves = {};
window.ORIENTACOES.tipos.forEach(function (t) { chaves[t.chave] = t.label; });

var quebrados = [];
window.TIPIFICACAO.forEach(function (e) {
  if (e.orientacoes && !chaves[e.orientacoes]) quebrados.push(e.fato + " -> " + e.orientacoes);
});
igual("toda folha apontada existe", quebrados, []);

var comFolha = window.TIPIFICACAO.filter(function (e) { return e.orientacoes; }).length;
igual("há fatos com folha", comFolha > 0, true);
igual("mas a linha não mostra link para a folha",
      document.querySelectorAll('#corpo-tabela a[href^="orientacoes.html"]').length, 0);

// --- texto do artigo ---------------------------------------------------
// O campo é opcional: o que se confere aqui é o mecanismo, não quantos
// artigos já foram copiados.
var comTexto = window.TIPIFICACAO.filter(function (e) { return e.texto; }).length;

// O texto abre pelo mesmo dispositivo da ref: entrada de parágrafo começa
// pelo parágrafo ("§ 2º", "Parágrafo único"), entrada de caput não começa
// por parágrafo nenhum. É o erro de colar o texto do vizinho na linha.
var textoTrocado = [];
window.TIPIFICACAO.forEach(function (e) {
  if (!e.texto) return;
  var m = /^Art\. [\dA-Z-]+(?:, (§(\d+)(?:-([A-Z]))?|p\.u\.))?/.exec(e.ref);
  var abre = e.texto.split("\n")[0];
  var certo;
  if (!m[1]) certo = !/^(§|Parágrafo único)/.test(abre);
  else if (m[1] === "p.u.") certo = /^Parágrafo único/.test(abre);
  else certo = new RegExp("^§ " + m[2] + "º?" + (m[3] ? "-" + m[3] : "") + "(?![\\d-])").test(abre);
  if (!certo) textoTrocado.push(e.ref + " → " + abre.slice(0, 30));
});
igual("o texto abre pelo mesmo dispositivo da ref", textoTrocado, []);
igual("há fatos com o texto do artigo", comTexto > 0, true);

buscar("");
var semBotao = [];
window.TIPIFICACAO.forEach(function (e) {
  if (!e.texto) return;
  var tr = document.querySelector('#corpo-tabela tr[data-ref="' + e.ref + '"]');
  if (!tr || !tr.querySelector(".tipificacao-ver-texto")) semBotao.push(e.ref);
});
igual("toda linha com o texto do artigo tem o botão da gaveta", semBotao, []);
var botoes = document.querySelectorAll("#corpo-tabela .tipificacao-ver-texto").length;
igual("cada botão, uma gaveta",
      document.querySelectorAll("#corpo-tabela .tipificacao-texto-linha").length, botoes);
igual("toda gaveta começa fechada",
      document.querySelectorAll("#corpo-tabela .tipificacao-texto-linha.escondido").length, botoes);

// --- a observação na linha ---------------------------------------------
// Na linha fica só a primeira frase da `obs`; o resto vai para a gaveta.
var linhaFurto = linhaDe("Art. 155 - DL2848");
igual("na linha, só a primeira frase da observação",
      linhaFurto.querySelector(".tipificacao-obs").textContent,
      "Repouso noturno (§ 1º): aumento de metade.");
igual("o resto está na gaveta",
      linhaFurto.nextElementSibling.querySelector(".tipificacao-detalhe").textContent.indexOf("Pena da Lei 15.397/2026") >= 0,
      true);

// A regra do cabeçalho do dados.js: a primeira frase é a que importa no
// balcão, e a citação da lei vai no fim. Uma `obs` que abre com "Lei
// 15.358/2026." mostraria só isso na linha.
var FIM_DE_FRASE = /(?<=[.!?…])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/;
var CITACAO = /^(?:Penas? (?:mínima )?da )?Lei [\d.]+\/\d{4}(?: \([^)]*\))?\.$/;
var abremPelaLei = [];
window.TIPIFICACAO.forEach(function (e) {
  if (!e.obs) return;
  var frases = e.obs.split(FIM_DE_FRASE);
  if (frases.length > 1 && CITACAO.test(frases[0])) abremPelaLei.push(e.ref);
});
igual("nenhuma observação abre só com a citação da lei", abremPelaLei, []);

buscar("art. 155");
clicar("#corpo-tabela .tipificacao-ver-texto");
igual("o clique abre a gaveta",
      document.querySelector("#corpo-tabela .tipificacao-texto-linha").classList.contains("escondido"),
      false);
igual("e dentro está o dispositivo",
      document.querySelector("#corpo-tabela .tipificacao-texto").textContent.indexOf("coisa alheia móvel") > 0,
      true);

// A tabela é redesenhada inteira a cada tecla. O que estava aberto tem de
// continuar aberto, senão digitar mais uma letra fecharia o artigo.
buscar("art. 155 furto");
igual("a gaveta sobrevive ao filtro seguinte",
      document.querySelector("#corpo-tabela .tipificacao-texto-linha").classList.contains("escondido"),
      false);

igual("o dispositivo também entra na busca", buscar("coisa alheia movel") > 0, true);
buscar("");
