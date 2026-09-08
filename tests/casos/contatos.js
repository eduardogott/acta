// Contatos úteis: busca, agrupamento e os links que a página monta.

function cartoes() {
  return document.querySelectorAll("#lista-contatos .contato-cartao").length;
}
function buscar(termo) {
  digitar("busca", termo);
  return cartoes();
}

ok("contatos na agenda", window.CONTATOS.itens.length);
igual("todos aparecem sem filtro", buscar(""), window.CONTATOS.itens.length);
igual("busca por nome", buscar("defensoria") > 0, true);
igual("busca por sinônimo da narrativa", buscar("legista") > 0, true);
igual("busca ignora acento", buscar("policia") > 0, true);
igual("busca por dois termos", buscar("conselho tutelar") > 0, true);
igual("termo inexistente não traz nada", buscar("zzzznada"), 0);
igual("aviso de vazio aparece", vis("sem-resultados"), true);
buscar("");

// --- agrupamento ------------------------------------------------------
// Categoria escrita errado não dá erro: o contato simplesmente some da
// tela, porque não cai em grupo nenhum.
var validas = {};
window.CONTATOS.categorias.forEach(function (c) { validas[c.chave] = true; });
var orfaos = [];
window.CONTATOS.itens.forEach(function (i) {
  if (!validas[i.categoria]) orfaos.push(i.nome + " -> " + i.categoria);
});
igual("nenhum contato órfão de categoria", orfaos, []);

var usadas = {};
window.CONTATOS.itens.forEach(function (i) { usadas[i.categoria] = true; });
igual("um bloco por categoria em uso",
      document.querySelectorAll("#lista-contatos .contato-grupo").length,
      Object.keys(usadas).length);

// --- todo contato tem por onde ser contatado --------------------------
var mudos = [];
window.CONTATOS.itens.forEach(function (i) {
  var canais = (i.telefones || []).length + (i.whatsapp || []).length +
               (i.emails || []).length + (i.site ? 1 : 0) + (i.endereco ? 1 : 0);
  if (canais === 0) mudos.push(i.nome);
});
igual("nenhum contato sem forma de contato", mudos, []);

// --- WhatsApp ---------------------------------------------------------
buscar("conselho tutelar");
var zap = document.querySelector("#lista-contatos .contato-valor a[href^='https://wa.me/']");
igual("o WhatsApp vira link", !!zap, true);
igual("montado com o DDI da configuração",
      zap.getAttribute("href").indexOf("https://wa.me/" + window.Config.CONTATOS.DDI), 0);

// 190, 193 e afins não são WhatsApp de ninguém — e sem DDD não daria para
// adivinhar a região de qualquer forma.
buscar("polícia militar");
igual("número curto não vira link de WhatsApp",
      document.querySelectorAll("#lista-contatos a[href^='https://wa.me/']").length, 0);
igual("mas continua na tela",
      document.querySelectorAll("#lista-contatos .contato-valor").length > 0, true);

// --- para que serve cada número ---------------------------------------
// Um canal pode ser texto solto ou { valor, nota }. As duas formas
// convivem no mesmo arquivo, e é isso que se confere aqui.
buscar("brigada");
igual("a nota do número é desenhada",
      document.querySelectorAll("#lista-contatos .contato-nota").length > 0, true);
igual("e diz para que serve",
      document.querySelector("#lista-contatos .contato-nota").textContent,
      "Padrão de emergências");
igual("um contato com três números rende três linhas",
      document.querySelectorAll("#lista-contatos .contato-linha").length, 3);
igual("cada uma com seu copiar",
      document.querySelectorAll("#lista-contatos .contato-copiar").length, 3);
// O botão copia o número, nunca a nota: o que se digita no aparelho é o
// número, e mais nada.
igual("o copiar mira só o número",
      document.querySelector("#lista-contatos .contato-copiar").title, "Copiar 190");
igual("a busca alcança a nota", buscar("alternativo") > 0, true);

buscar("anônima");
igual("texto solto continua valendo",
      document.querySelectorAll("#lista-contatos .contato-valor").length > 0, true);
igual("e não inventa nota onde não há",
      document.querySelectorAll("#lista-contatos .contato-nota").length, 0);

// --- copiar -----------------------------------------------------------
// É a ação principal desta página: num computador de balcão o link `tel:`
// não disca nada, e o número existe para ser copiado.
buscar("");
igual("cada linha tem seu botão de copiar",
      document.querySelectorAll("#lista-contatos .contato-copiar").length,
      document.querySelectorAll("#lista-contatos .contato-linha").length);
igual("e há linhas para copiar",
      document.querySelectorAll("#lista-contatos .contato-linha").length > 0, true);
