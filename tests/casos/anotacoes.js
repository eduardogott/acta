// Anotações: a estante de PDFs.
//
// Aqui não há o que calcular — a página só desenha o que está em
// dados.js. O que este caso guarda é a emenda entre as DUAS metades do
// conteúdo, que moram em lugares que não se falam: o PDF na pasta e a
// entrada que diz o que ele é. Nome digitado errado em qualquer das duas
// não dá erro nenhum: dá um cartão bonito que 404 na mão de quem clica.
//
// Por isso o caso é assíncrono: ele pede os arquivos ao servidor, um a
// um, e só então diz se a lista bate com a pasta.

manterVivo();

var DADOS = window.ANOTACOES;
var PASTA = window.Config.ANOTACOES.PASTA;

function cartoes() {
  return document.querySelectorAll("#lista-anotacoes .anotacao-cartao");
}
function endereco(arquivo) {
  return encodeURI(PASTA + arquivo);
}

ok("anotações cadastradas", DADOS.itens.length);

// --- categorias -------------------------------------------------------
// Categoria escrita errado não dá erro: o item some da tela, porque não
// cai em grupo nenhum. Mesma armadilha da agenda de contatos.
var validas = {};
DADOS.categorias.forEach(function (c) { validas[c.chave] = true; });

var orfaos = [];
DADOS.itens.forEach(function (i) {
  if (!validas[i.categoria]) orfaos.push(i.titulo + " -> " + i.categoria);
});
igual("nenhuma anotação órfã de categoria", orfaos, []);

var usadas = {};
DADOS.itens.forEach(function (i) { if (validas[i.categoria]) usadas[i.categoria] = true; });
igual("um bloco por categoria em uso",
      document.querySelectorAll("#lista-anotacoes .anotacao-grupo").length,
      Object.keys(usadas).length);

// --- a lista e a tela dizem a mesma coisa -----------------------------
igual("um cartão por anotação", cartoes().length, DADOS.itens.length - orfaos.length);
// Estante vazia é estado normal de quem acabou de instalar a página, e a
// mensagem tem de aparecer — sem ela a tela fica em branco sem explicação.
igual("o aviso de estante vazia segue a lista",
      vis("sem-anotacoes"), DADOS.itens.length === 0);

// --- o que toda entrada precisa ter -----------------------------------
var incompletas = [];
DADOS.itens.forEach(function (i) {
  if (!i.titulo || !i.arquivo) incompletas.push(i.titulo || i.arquivo || "(sem nome)");
});
igual("toda anotação tem título e arquivo", incompletas, []);

var naoPdf = DADOS.itens
  .filter(function (i) { return !/\.pdf$/i.test(i.arquivo || ""); })
  .map(function (i) { return i.arquivo; });
igual("todo arquivo é um PDF", naoPdf, []);

// Páginas, e não folhas: a impressora faz frente e verso, e quantas
// folhas saem depende de quem imprime. "2" escrito como texto viraria
// "2 páginas" na tela do mesmo jeito, e é exatamente por isso que passa
// batido — daí conferir o tipo.
var paginasTortas = DADOS.itens
  .filter(function (i) {
    return i.paginas !== undefined && (typeof i.paginas !== "number" || i.paginas < 1);
  })
  .map(function (i) { return i.titulo + " -> " + i.paginas; });
igual("páginas é um número, quando declarado", paginasTortas, []);

// --- o cartão ---------------------------------------------------------
if (cartoes().length > 0) {
  var primeiro = DADOS.itens.filter(function (i) { return validas[i.categoria]; })[0];
  var cartao = cartoes()[0];
  var link = cartao.querySelector(".anotacao-titulo a");

  igual("o título é o link do PDF",
        link.getAttribute("href"), endereco(primeiro.arquivo));
  // Abrir numa aba nova: quem imprime volta para a lista e pega a folha
  // seguinte sem refazer o caminho.
  igual("abre numa aba nova", link.getAttribute("target"), "_blank");
  igual("com rel noopener", link.getAttribute("rel"), "noopener");

  if (primeiro.paginas) {
    igual("a etiqueta conta páginas",
          cartao.querySelector(".etiqueta").textContent,
          primeiro.paginas === 1 ? "1 página" : primeiro.paginas + " páginas");
  }

  // O cartão diz o nome, para que serve e quantas páginas tem. Tipo,
  // tamanho e data saíram: todo arquivo daqui é PDF, o peso não muda o
  // que a pessoa faz, e a data envelhece sozinha.
  igual("sem rodapé de tipo, tamanho e data",
        document.querySelectorAll("#lista-anotacoes .anotacao-rodape, " +
                                  "#lista-anotacoes .anotacao-meta").length, 0);
}

// --- a emenda: o que está declarado está na pasta ----------------------
var faltando = [];
var semResposta = 0;

Promise.all(DADOS.itens.map(function (item) {
  return fetch(endereco(item.arquivo), { method: "HEAD" })
    .then(function (r) { if (!r.ok) faltando.push(item.arquivo); })
    // Servidor que não responde a HEAD não é anotação faltando; contamos
    // à parte para não acusar a pasta de um problema que é do servidor.
    .catch(function () { semResposta++; });
})).then(function () {
  igual("todo arquivo declarado existe em " + PASTA, faltando, []);
  igual("e todos responderam", semResposta, 0);

  // A garantia forte é a de cima, e é minha: as requisições acima saíram
  // DEPOIS das da página, então quando elas voltam a página já ouviu as
  // dela. Um cartão marcado aqui, com todos os arquivos existindo, é
  // defeito na conferência da própria página.
  igual("nenhum cartão marcado como ausente",
        document.querySelectorAll("#lista-anotacoes .anotacao-cartao.ausente").length, 0);
  pronto();
});
