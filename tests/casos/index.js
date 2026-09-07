// Página inicial: um cartão por ferramenta, na mesma lista do menu.
//
// O que este caso protege é a lista única. A página inicial e o menu saem
// os dois de window.Ferramentas.PAGINAS (js/comum/nav.js) justamente para
// não divergirem — e uma segunda lista escrita em qualquer lugar aparece
// aqui como diferença entre as duas ordens.

var ORDEM = [
  "gerador.html",
  "conversor.html",
  "orientacoes.html",
  "transcricao.html",
  "conversas.html",
  "conferidor.html",
  "tipificacao.html",
];

function hrefs(seletor) {
  return [].map.call(document.querySelectorAll(seletor), function (a) {
    return a.getAttribute("href");
  });
}

igual("a lista de ferramentas é pública", typeof window.Ferramentas, "object");
igual("um cartão por ferramenta",
      document.querySelectorAll("#cartoes .cartao").length,
      window.Ferramentas.PAGINAS.length);
igual("os cartões saem na ordem declarada", hrefs("#cartoes .cartao"), ORDEM);
igual("o menu sai da mesma lista", hrefs(".site-nav .nav-link"), hrefs("#cartoes .cartao"));

// Cartão sem título ou sem descrição é cartão pela metade, e o sintoma na
// tela é discreto o bastante para passar batido: um retângulo vazio.
var incompletos = [];
[].forEach.call(document.querySelectorAll("#cartoes .cartao"), function (cartao) {
  var titulo = cartao.querySelector(".cartao-titulo");
  var descricao = cartao.querySelector(".cartao-descricao");
  var onde = cartao.getAttribute("href");
  if (!titulo || !titulo.textContent.trim()) incompletos.push(onde + ": sem título");
  if (!descricao || !descricao.textContent.trim()) incompletos.push(onde + ": sem descrição");
});
igual("todo cartão tem título e descrição", incompletos, []);

// Cada arquivo apontado precisa existir de verdade: um cartão que leva a
// 404 é o modo de falha mais provável depois de renomear uma página.
var pendentes = window.Ferramentas.PAGINAS.length;
window.manterVivo();
window.Ferramentas.PAGINAS.forEach(function (pagina) {
  fetch("/" + pagina.arquivo, { method: "HEAD" })
    .then(function (r) {
      igual("existe " + pagina.arquivo, r.ok, true);
    })
    .catch(function (e) {
      igual("existe " + pagina.arquivo, String(e), true);
    })
    .then(function () {
      if (--pendentes === 0) window.pronto();
    });
});

// Na própria inicial a marca não vira link: recarregar onde já se está não
// leva a lugar nenhum (ver ligarAMarca em js/comum/nav.js).
igual("a marca não é link na página inicial",
      document.querySelectorAll(".site-title .site-home").length, 0);
