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

clicar("#btn-limpar");
igual("limpar desabilita imprimir", document.getElementById("btn-imprimir").disabled, true);
igual("limpar volta ao aviso de vazio", vis("saida-vazio"), true);
