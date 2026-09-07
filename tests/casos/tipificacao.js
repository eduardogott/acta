// Tipificação: busca e a coluna de prescrição.

function buscar(termo) {
  digitar("busca", termo);
  return document.querySelectorAll("#corpo-tabela tr").length;
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
var soJecrim = document.querySelectorAll("#corpo-tabela tr").length;
igual("filtro JECRIM reduz a lista", soJecrim > 0 && soJecrim < window.TIPIFICACAO.length, true);
marcar("#filtro-jecrim", false);

// --- prescrição (art. 109 do CP) --------------------------------------
function prescricaoDe(fato) {
  buscar(fato);
  var linha = document.querySelector("#corpo-tabela tr");
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
document.querySelectorAll("#corpo-tabela tr").forEach(function (tr) {
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
