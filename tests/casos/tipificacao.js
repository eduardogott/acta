// Tipificação: busca, a coluna de prescrição, a fiança, a referência
// compacta e o texto do artigo.

// O corpo da tabela tem três tipos de <tr>: a do fato, a gaveta escondida
// com o texto do artigo logo abaixo dela, e o título de cada grupo
// (Vida, Honra…). Contar "tr" sem mais nada contaria as três.
var LINHAS = "#corpo-tabela tr:not(.tipificacao-texto-linha):not(.tipificacao-grupo)";

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
igual("cada entrada rende um botão de copiar a ref",
      document.querySelectorAll("#corpo-tabela .tipificacao-ref").length, window.TIPIFICACAO.length);
var exemplo = document.querySelector('#corpo-tabela tr[data-ref="Art. 121, §2, II - DL2848"]');
igual("a linha do exemplo do pedido existe", !!exemplo, true);
igual("e o botão mostra a ref", exemplo && exemplo.querySelector(".tipificacao-ref").textContent,
      "Art. 121, §2, II - DL2848");

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
// O mapa vive em js/tipificacao/dados.js e o alvo em
// js/orientacoes/dados.js. Um tipo renomeado lá só apareceria no balcão.
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
igual(
  "cada um rende um link",
  document.querySelectorAll("#corpo-tabela .tipificacao-folha").length,
  comFolha
);

buscar("lesão corporal leve");
var link = document.querySelector("#corpo-tabela .tipificacao-folha");
igual("link aponta para a folha certa", link.getAttribute("href"), "orientacoes.html?tipo=lesao");
igual("link diz qual folha é", link.textContent, "Orientações: Lesão corporal / agressão");
buscar("");

// --- texto do artigo ---------------------------------------------------
// O campo é opcional e a tabela é preenchida aos poucos: o que se confere
// aqui é o mecanismo, não quantos artigos já foram digitados.
var comTexto = window.TIPIFICACAO.filter(function (e) { return e.texto; }).length;
igual("há fatos com o texto do artigo", comTexto > 0, true);
igual("cada um rende um botão",
      document.querySelectorAll("#corpo-tabela .tipificacao-ver-texto").length, comTexto);
igual("e uma gaveta",
      document.querySelectorAll("#corpo-tabela .tipificacao-texto-linha").length, comTexto);
igual("toda gaveta começa fechada",
      document.querySelectorAll("#corpo-tabela .tipificacao-texto-linha.escondido").length, comTexto);

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
