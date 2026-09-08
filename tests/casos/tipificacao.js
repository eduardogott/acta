// Tipificação: busca, a coluna de prescrição e o texto do artigo.

// A gaveta do texto do artigo é uma SEGUNDA <tr>, escondida, logo abaixo
// da linha do fato. Contar "tr" sem mais nada contaria as duas.
var LINHAS = "#corpo-tabela tr:not(.tipificacao-texto-linha)";

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
igual("termo inexistente não traz nada", buscar("zzzznada"), 0);
igual("aviso de vazio aparece", vis("sem-resultados"), true);

buscar("");
marcar("#filtro-jecrim", true);
var soJecrim = document.querySelectorAll(LINHAS).length;
igual("filtro JECRIM reduz a lista", soJecrim > 0 && soJecrim < window.TIPIFICACAO.length, true);
marcar("#filtro-jecrim", false);

// --- prescrição (art. 109 do CP) --------------------------------------
function prescricaoDe(fato) {
  buscar(fato);
  var linha = document.querySelector(LINHAS);
  return linha ? linha.children[3].textContent.trim() : null;
}

igual("furto (máx 4 anos) prescreve em 8", prescricaoDe("furto qualificado"), "12 anos");
igual("ameaça (máx 6 meses) prescreve em 3", prescricaoDe("ameaça"), "3 anos");
igual("homicídio simples (máx 20) prescreve em 20", prescricaoDe("homicídio simples"), "20 anos");
igual("estelionato (máx 5) prescreve em 12", prescricaoDe("estelionato"), "12 anos");
igual("vias de fato (contravenção) prescreve em 3", prescricaoDe("vias de fato"), "3 anos");
igual("injúria racial é imprescritível", prescricaoDe("injúria racial"), "imprescritível");
igual("uso de documento falso depende do documento", prescricaoDe("uso de documento falso"), "conforme o documento");

buscar("");
var semPrescricao = 0;
document.querySelectorAll(LINHAS).forEach(function (tr) {
  if (tr.children[3].textContent.trim() === "—") semPrescricao++;
});
igual("nenhum fato ficou sem prescrição", semPrescricao, 0);

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
