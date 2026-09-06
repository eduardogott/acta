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

clicar('#opcoes-subtipo input[value="pix"]');
igual("subtipo acrescenta um grupo", document.querySelectorAll("#saida-grupos .orientacoes-grupo").length, base + 1);
igual("subtítulo mostra o subtipo", txt("saida-subtitulo"), "Pix ou transferência bancária");

clicar('#opcoes-extras input[value="clonagem_whatsapp"]');
clicar('#opcoes-extras input[value="coleta_dados"]');
igual("dois extras acrescentam dois grupos", document.querySelectorAll("#saida-grupos .orientacoes-grupo").length, base + 3);
igual("etiquetas de prazo aparecem", document.querySelectorAll(".orientacoes-prazo").length > 0, true);

igual(
  "URL reflete a escolha",
  location.search,
  "?tipo=estelionato&sub=pix&extras=clonagem_whatsapp,coleta_dados"
);

clicar('#opcoes-tipo input[value="violencia_domestica"]');
igual("tipo sem subtipo esconde o bloco", vis("bloco-subtipo"), false);
igual("tipo sem extras esconde o bloco", vis("bloco-extras"), false);
igual("trocar de tipo limpa o subtipo da URL", location.search, "?tipo=violencia_domestica");

clicar('#opcoes-tipo input[value="perda"]');
clicar('#opcoes-subtipo input[value="celular"]');
igual("perda/celular tem itens", document.querySelectorAll("#saida-grupos li").length > 5, true);

clicar("#btn-limpar");
igual("limpar desabilita imprimir", document.getElementById("btn-imprimir").disabled, true);
igual("limpar volta ao aviso de vazio", vis("saida-vazio"), true);
