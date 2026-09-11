// Contatos úteis: busca, agrupamento e os links que a página monta.
//
// ESTE CASO NÃO NOMEIA CONTATO NENHUM, de propósito. Ele nomeava — o
// Conselho Tutelar tinha de ter WhatsApp, a Brigada tinha de ter três
// linhas, o primeiro botão tinha de copiar o 190 — e passou a falhar a
// cada número novo cadastrado. Falhava por causa da AGENDA, não por
// causa da página, que é o que ele deveria estar protegendo; e teste que
// falha por motivo errado é teste que se aprende a ignorar.
//
// Agora os cenários saem da própria agenda: o caso procura nela o
// primeiro contato que tem o que cada verificação precisa (um WhatsApp
// discável, um número curto, uma nota) e afirma o comportamento da
// página sobre ele. Preencher a agenda deixou de mexer aqui.

var DADOS = window.CONTATOS;
var DDI = window.Config.CONTATOS.DDI;

function cartoes() {
  return document.querySelectorAll("#lista-contatos .contato-cartao").length;
}
function buscar(termo) {
  digitar("busca", termo);
  return cartoes();
}
function digitos(v) {
  return String(v).replace(/\D/g, "");
}
function semAcento(t) {
  return String(t).normalize("NFD").replace(/[̀-ͯ]/g, "");
}
/**
 * A mesma normalização de canal da página: texto solto ou { valor, nota }.
 *
 * Com uma diferença: aqui um campo que não é lista é embrulhado em vez
 * de estourar. A página morre nesse caso, e é isso que a verificação
 * acima denuncia — mas o caso precisa seguir vivo para contar o resto do
 * que está errado, em vez de parar no primeiro achado.
 */
function canais(lista) {
  if (lista === null || lista === undefined) lista = [];
  if (!Array.isArray(lista)) lista = [lista];
  return lista
    .map(function (c) {
      if (c === null || c === undefined) return null;
      if (typeof c === "string") return { valor: c, nota: "" };
      return { valor: c.valor || "", nota: c.nota || "" };
    })
    .filter(function (c) { return c && c.valor; });
}
/** Todos os canais de um contato, na ordem em que a página os desenha. */
function todosOsCanais(i) {
  return canais(i.telefones)
    .concat(canais(i.whatsapp), canais(i.emails), canais([i.endereco]), canais([i.site]));
}
/** O cartão de um contato específico, para não depender do que a busca trouxe junto. */
function cartaoDe(nome) {
  var achado = null;
  [].forEach.call(document.querySelectorAll("#lista-contatos .contato-cartao"), function (c) {
    var h = c.querySelector(".contato-nome");
    if (h && h.textContent === nome) achado = c;
  });
  // Sem cartão — agenda em branco, contato órfão de categoria — devolve
  // um nó vazio. Assim a verificação falha dizendo o que faltou, em vez
  // de estourar num null e levar o resto do caso junto.
  return achado || document.createElement("div");
}
/** Texto (ou atributo) de um filho que pode não existir. */
function textoDe(raiz, seletor, atributo) {
  var e = raiz.querySelector(seletor);
  if (!e) return "(não desenhado)";
  return atributo ? e[atributo] : e.textContent;
}

var validas = {};
DADOS.categorias.forEach(function (c) { validas[c.chave] = true; });
function naVitrine(i) { return !!validas[i.categoria]; }
function acha(teste) {
  return DADOS.itens.filter(function (i) { return naVitrine(i) && teste(i); })[0];
}

ok("contatos na agenda", DADOS.itens.length);

// --- a forma da agenda ------------------------------------------------
// Campo de canal que não é lista MATA A PÁGINA INTEIRA: contatos.js faz
// .map() nele para montar o índice de busca, na carga, antes do primeiro
// cartão nascer. O sintoma é a agenda em branco — nenhum erro na tela,
// nenhum cartão, e a impressão de que a ferramenta simplesmente sumiu.
var LISTAS = ["telefones", "whatsapp", "emails"];
var tortos = [];
DADOS.itens.forEach(function (i) {
  LISTAS.forEach(function (k) {
    if (i[k] !== undefined && !Array.isArray(i[k])) tortos.push(i.nome + " -> " + k);
  });
});
igual("todo campo de canal é uma lista", tortos, []);

// Categoria escrita errado não dá erro: o contato some da tela, porque
// não cai em grupo nenhum.
var orfaos = [];
DADOS.itens.forEach(function (i) {
  if (!naVitrine(i)) orfaos.push(i.nome + " -> " + i.categoria);
});
igual("nenhum contato órfão de categoria", orfaos, []);

var mudos = [];
DADOS.itens.forEach(function (i) {
  if (todosOsCanais(i).length === 0) mudos.push(i.nome);
});
igual("nenhum contato sem forma de contato", mudos, []);

// --- a agenda desenhou ------------------------------------------------
var visiveis = DADOS.itens.filter(naVitrine).length;
igual("a agenda não está em branco", cartoes() > 0, true);
igual("todos aparecem sem filtro", buscar(""), visiveis);
igual("a contagem confere", txt("contagem"), DADOS.itens.length + " contatos na agenda");

var usadas = {};
DADOS.itens.forEach(function (i) { if (naVitrine(i)) usadas[i.categoria] = true; });
igual("um bloco por categoria em uso",
      document.querySelectorAll("#lista-contatos .contato-grupo").length,
      Object.keys(usadas).length);

// --- busca ------------------------------------------------------------
var comNomeLongo = acha(function (i) {
  return semAcento(i.nome).split(/\s+/)[0].length >= 4;
});
var termo = semAcento(comNomeLongo.nome).split(/\s+/)[0].toLowerCase();
ok("termo tirado da agenda", termo);
igual("busca pelo nome do órgão", buscar(termo) > 0, true);

var comAcento = acha(function (i) { return semAcento(i.nome) !== i.nome; });
if (comAcento) {
  igual("busca ignora acento", buscar(semAcento(comAcento.nome).toLowerCase()) > 0, true);
}

var comDuasPalavras = acha(function (i) {
  return semAcento(i.nome).split(/\s+/).filter(function (p) { return p.length >= 3; }).length >= 2;
});
if (comDuasPalavras) {
  var duas = semAcento(comDuasPalavras.nome)
    .toLowerCase().split(/\s+/).filter(function (p) { return p.length >= 3; }).slice(0, 2);
  igual("busca por dois termos", buscar(duas.join(" ")) > 0, true);
}

igual("termo inexistente não traz nada", buscar("zzzznada"), 0);
igual("aviso de vazio aparece", vis("sem-resultados"), true);
buscar("");

// --- WhatsApp ---------------------------------------------------------
var comZap = acha(function (i) {
  return canais(i.whatsapp).some(function (c) {
    var d = digitos(c.valor);
    return d.length >= 10 && d.length <= 11;
  });
});
if (comZap) {
  ok("contato com WhatsApp discável", comZap.nome);
  var alvo = ".contato-valor a[href^='https://wa.me/']";
  igual("o WhatsApp vira link", !!cartaoDe(comZap.nome).querySelector(alvo), true);
  igual("montado com o DDI da configuração",
        textoDe(cartaoDe(comZap.nome), alvo, "href").indexOf("https://wa.me/" + DDI), 0);
}

// 190, 193, ramais e afins não são WhatsApp de ninguém — e sem DDD não
// daria para adivinhar a região de qualquer forma.
var soCurtos = acha(function (i) {
  return canais(i.whatsapp).length === 0 &&
    canais(i.telefones).length > 0 &&
    canais(i.telefones).every(function (c) { return digitos(c.valor).length < 10; });
});
if (soCurtos) {
  ok("contato só com número curto", soCurtos.nome);
  var cartaoCurto = cartaoDe(soCurtos.nome);
  igual("número curto não vira link de WhatsApp",
        cartaoCurto.querySelectorAll("a[href^='https://wa.me/']").length, 0);
  igual("mas continua na tela",
        cartaoCurto.querySelectorAll(".contato-valor").length > 0, true);
}

// --- para que serve cada número ---------------------------------------
// Um canal pode ser texto solto ou { valor, nota }. As duas formas
// convivem no mesmo arquivo, e é isso que se confere aqui.
var comNota = acha(function (i) {
  return todosOsCanais(i).some(function (c) { return !!c.nota; });
});
if (comNota) {
  ok("contato com nota de linha", comNota.nome);
  var primeiraNota = todosOsCanais(comNota).filter(function (c) { return !!c.nota; })[0];
  var cartaoNota = cartaoDe(comNota.nome);
  igual("a nota do número é desenhada",
        cartaoNota.querySelectorAll(".contato-nota").length > 0, true);
  // A página desenha telefones, WhatsApp, e-mails, endereço e site nessa
  // ordem, que é a de todosOsCanais: a primeira nota da tela é a primeira
  // nota da agenda.
  igual("e diz qual linha é",
        textoDe(cartaoNota, ".contato-nota"), primeiraNota.nota);
  igual("a busca alcança a nota", buscar(semAcento(primeiraNota.nota).toLowerCase()) > 0, true);
  buscar("");
}

var soTextoSolto = acha(function (i) {
  var todos = todosOsCanais(i);
  return todos.length > 0 && todos.every(function (c) { return !c.nota; });
});
if (soTextoSolto) {
  ok("contato escrito como texto solto", soTextoSolto.nome);
  igual("texto solto continua valendo",
        cartaoDe(soTextoSolto.nome).querySelectorAll(".contato-valor").length > 0, true);
  igual("e não inventa nota onde não há",
        cartaoDe(soTextoSolto.nome).querySelectorAll(".contato-nota").length, 0);
}

// --- uma linha por canal, um copiar por linha -------------------------
// Era aqui que o caso dizia "três telefones rendem três linhas", com o
// três escrito à mão. O número agora sai da agenda, e o contato usado é
// o mais cheio dela — que é o que tem mais o que dar errado.
var maisCheio = DADOS.itens.filter(naVitrine).slice().sort(function (a, b) {
  return todosOsCanais(b).length - todosOsCanais(a).length;
})[0];
ok("contato mais cheio da agenda", maisCheio.nome + " (" + todosOsCanais(maisCheio).length + " canais)");
igual("uma linha por canal",
      cartaoDe(maisCheio.nome).querySelectorAll(".contato-linha").length,
      todosOsCanais(maisCheio).length);
igual("cada uma com seu copiar",
      cartaoDe(maisCheio.nome).querySelectorAll(".contato-copiar").length,
      todosOsCanais(maisCheio).length);

// O botão copia o número, nunca a nota: o que se digita no aparelho é o
// número, e mais nada.
igual("o copiar mira só o valor",
      textoDe(cartaoDe(maisCheio.nome), ".contato-copiar", "title"),
      "Copiar " + todosOsCanais(maisCheio)[0].valor);

// Copiar é a ação principal desta página: num computador de balcão o
// link `tel:` não disca nada, e o número existe para ser copiado.
igual("cada linha da agenda tem seu botão de copiar",
      document.querySelectorAll("#lista-contatos .contato-copiar").length,
      document.querySelectorAll("#lista-contatos .contato-linha").length);
igual("e há linhas para copiar",
      document.querySelectorAll("#lista-contatos .contato-linha").length > 0, true);
