// Orientações: acúmulo de grupos e estado por URL.

igual("tipos oferecidos", document.querySelectorAll("#opcoes-tipo input").length, window.ORIENTACOES.tipos.length);
igual("imprimir começa desabilitado", document.getElementById("btn-imprimir").disabled, true);
igual("aviso de vazio aparece", vis("saida-vazio"), true);

clicar('#opcoes-tipo input[value="estelionato"]');
igual("estelionato tem subtipos", vis("bloco-subtipo"), true);
igual("estelionato tem situações extras", vis("bloco-extras"), true);
igual("imprimir habilita", document.getElementById("btn-imprimir").disabled, false);
var base = document.querySelectorAll("#saida-grupos .orientacoes-grupo").length;
igual("tipo sozinho rende dois grupos (tipo + comuns)", base, 2);

clicar('#opcoes-subtipo input[value="falso_advogado"]');
igual("subtipo acrescenta um grupo", document.querySelectorAll("#saida-grupos .orientacoes-grupo").length, base + 1);
igual("subtítulo mostra o subtipo", txt("saida-subtitulo"), "Falso advogado");

clicar('#opcoes-extras input[value="clonagem_whatsapp"]');
clicar('#opcoes-extras input[value="coleta_dados"]');
igual("dois extras acrescentam dois grupos", document.querySelectorAll("#saida-grupos .orientacoes-grupo").length, base + 3);
igual("etiquetas de prazo aparecem", document.querySelectorAll(".orientacoes-prazo").length > 0, true);

igual(
  "URL reflete a escolha",
  location.search,
  "?tipo=estelionato&sub=falso_advogado&extras=clonagem_whatsapp,coleta_dados"
);

clicar('#opcoes-tipo input[value="violencia_domestica"]');
igual("tipo sem subtipo esconde o bloco", vis("bloco-subtipo"), false);
igual("tipo sem extras esconde o bloco", vis("bloco-extras"), false);
igual("trocar de tipo limpa o subtipo da URL", location.search, "?tipo=violencia_domestica");

clicar('#opcoes-tipo input[value="perda"]');
clicar('#opcoes-subtipo input[value="celular"]');
igual("perda/celular tem itens", document.querySelectorAll("#saida-grupos li").length > 5, true);

// dados.js e alimentado a mao. Em vez de confiar no caminho que este
// caso percorre, passa por todo tipo e todo subtipo: chave repetida,
// rótulo repetido ou grupo que não renderiza aparecem aqui.
var problemas = [];
window.ORIENTACOES.tipos.forEach(function (tipo) {
  var vistas = {};
  (tipo.subtipos || []).concat(tipo.extras || []).forEach(function (s) {
    if (vistas[s.chave]) problemas.push(tipo.chave + "/" + s.chave + ": chave repetida");
    vistas[s.chave] = true;
  });
  clicar('#opcoes-tipo input[value="' + tipo.chave + '"]');
  (tipo.subtipos || []).forEach(function (sub) {
    clicar('#opcoes-subtipo input[value="' + sub.chave + '"]');
    if (txt("saida-subtitulo") !== sub.label) {
      problemas.push(tipo.chave + "/" + sub.chave + ": subtítulo não bateu");
    }
    if (document.querySelectorAll("#saida-grupos .orientacoes-grupo").length < 2) {
      problemas.push(tipo.chave + "/" + sub.chave + ": não rendeu grupos");
    }
  });
});
igual("todo tipo e subtipo renderiza", problemas, []);

// --- número da ocorrência e data no alto da folha ------------------
// Só o sequencial é digitado; ano e código da unidade são sempre os
// mesmos, e redigitar "/2026/100930" oitenta vezes por semana é pedir
// erro de digitação.
clicar('#opcoes-tipo input[value="estelionato"]');
igual("sem número, fica a linha para preencher à mão",
      txt("cabecalho-numero"), "______________________");

digitar("numero-ocorrencia", "48271");
igual("número sai no formato da unidade",
      txt("cabecalho-numero"), "48271/" + new Date().getFullYear() + "/100930");
igual("a prévia mostra o mesmo",
      txt("numero-previa"), "Sai impresso: 48271/" + new Date().getFullYear() + "/100930");

igual("a data é sempre a de hoje",
      txt("cabecalho-data"), new Date().toLocaleDateString("pt-BR"));

digitar("numero-ocorrencia", "");
igual("apagar devolve a linha", txt("cabecalho-numero"), "______________________");

// --- impressão de várias páginas -------------------------------------
// O cabeçalho corrido só repete porque está num <thead> e a folha tem uma
// linha de tabela POR GRUPO (ver o comentário em orientacoes.html). As
// duas coisas são fáceis de desfazer sem perceber.
igual("o cabeçalho corrido vive num thead",
      document.querySelectorAll(".folha-impressa thead .impressao-corrida").length, 1);
clicar('#opcoes-extras input[value="coleta_dados"]');
igual("cada grupo é uma linha da tabela",
      document.querySelectorAll("#saida-grupos > tr").length,
      document.querySelectorAll("#saida-grupos .orientacoes-grupo").length);
igual("e há mais de um grupo",
      document.querySelectorAll("#saida-grupos > tr").length > 1, true);

// --- outras orientações, escritas à mão --------------------------------
// Entram como um grupo igual aos demais e no MEIO da folha, não como
// rodapé: valem para este caso e mais nenhum, então vêm depois do que
// saiu dos dados e antes do que vale para qualquer registro.
function escreverOutra(i, texto) {
  var caixa = document.querySelectorAll("#outras-lista textarea")[i];
  caixa.value = texto;
  caixa.dispatchEvent(new Event("input", { bubbles: true }));
}
function titulosDaFolha() {
  return [].map.call(document.querySelectorAll("#saida-grupos .orientacoes-grupo h3"),
                     function (h) { return h.textContent; });
}
function itensDasOutras() {
  var grupos = document.querySelectorAll("#saida-grupos .orientacoes-grupo");
  for (var i = 0; i < grupos.length; i++) {
    if (grupos[i].querySelector("h3").textContent === "Outras orientações") {
      return [].map.call(grupos[i].querySelectorAll("li"),
                         function (li) { return li.textContent; });
    }
  }
  return null;
}

clicar("#btn-limpar");
clicar('#opcoes-tipo input[value="perda"]');
var semOutras = document.querySelectorAll("#saida-grupos .orientacoes-grupo").length;
igual("a seção começa com uma caixa em branco",
      document.querySelectorAll("#outras-lista textarea").length, 1);
igual("caixa em branco não vira grupo",
      document.querySelectorAll("#saida-grupos .orientacoes-grupo").length, semOutras);

escreverOutra(0, "Procure a Defensoria Pública na Rua X, nº 100.");
igual("o que se escreve vira um grupo",
      document.querySelectorAll("#saida-grupos .orientacoes-grupo").length, semOutras + 1);
igual("o grupo se chama Outras orientações",
      titulosDaFolha().indexOf("Outras orientações") >= 0, true);
igual("e fecha a folha logo antes do que vale para qualquer registro",
      titulosDaFolha().indexOf("Outras orientações"), titulosDaFolha().length - 2);
igual("cada grupo continua sendo uma linha da tabela",
      document.querySelectorAll("#saida-grupos > tr").length,
      document.querySelectorAll("#saida-grupos .orientacoes-grupo").length);

clicar("#btn-nova-outra");
igual("+ Nova orientação abre outra caixa",
      document.querySelectorAll("#outras-lista textarea").length, 2);
escreverOutra(1, "Leve o boletim ao IGP em até 30 dias.");
igual("as duas saem na folha, na ordem em que foram escritas", itensDasOutras(),
      ["Procure a Defensoria Pública na Rua X, nº 100.", "Leve o boletim ao IGP em até 30 dias."]);

// A lista de caixas só é refeita ao adicionar/remover — mas trocar de
// fato refaz a página inteira, e aí o texto tem que sobreviver.
clicar('#opcoes-tipo input[value="estelionato"]');
igual("trocar de fato não apaga o que foi escrito",
      document.querySelectorAll("#outras-lista textarea")[1].value,
      "Leve o boletim ao IGP em até 30 dias.");

escreverOutra(0, "   ");
igual("caixa apagada some da folha e a outra fica", itensDasOutras(),
      ["Leve o boletim ao IGP em até 30 dias."]);

clicar("#outras-lista .outra-linha:nth-child(1) .btn-remover");
igual("remover tira a caixa", document.querySelectorAll("#outras-lista textarea").length, 1);
igual("e não leva junto a que ficou", itensDasOutras(),
      ["Leve o boletim ao IGP em até 30 dias."]);

clicar("#btn-limpar");
igual("limpar apaga o que foi escrito",
      document.querySelectorAll("#outras-lista textarea")[0].value, "");

// Sem fato escolhido a folha ainda existe, feita só do que foi escrito —
// serve ao tipo de ocorrência que ainda não tem folha própria.
escreverOutra(0, "Compareça à Delegacia na segunda-feira, às 14h.");
igual("só com o que foi escrito, já dá para imprimir",
      document.getElementById("btn-imprimir").disabled, false);
igual("e o título sai sem complemento", txt("saida-titulo"), "O que fazer agora");
igual("o que vale para qualquer registro vem junto", titulosDaFolha(),
      ["Outras orientações", window.ORIENTACOES.comuns.titulo]);

clicar("#btn-limpar");
igual("limpar desabilita imprimir", document.getElementById("btn-imprimir").disabled, true);
igual("limpar volta ao aviso de vazio", vis("saida-vazio"), true);
