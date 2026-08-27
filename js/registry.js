/**
 * REGISTRY.JS
 * ---------------------------------------------------------------------------
 * Cadastro central dos "tipos de ocorrência". Cada arquivo em /js/tipos/
 * chama registrarTipoOcorrencia(...) para se inscrever aqui. A pergunta
 * inicial ("Qual é o fato da ocorrência?") monta suas opções lendo este
 * objeto — então adicionar um tipo novo NUNCA exige tocar em schema.js.
 *
 * COMO CRIAR UM TIPO DE OCORRÊNCIA NOVO
 * ---------------------------------------------------------------------------
 * 1. Crie js/tipos/nome_do_tipo.js
 * 2. Nele, chame:
 *
 *    registrarTipoOcorrencia("chave_unica", {
 *      label: "Texto mostrado na primeira pergunta",
 *      perguntas: [ ... array de perguntas, no mesmo formato de sempre ... ],
 *    });
 *
 *    Essas perguntas só entram em cena quando o usuário escolhe esse tipo
 *    na primeira pergunta — não precisam de "exibirSe" apontando pra
 *    tipo_ocorrencia, isso já é implícito. Mas PODEM usar "exibirSe" entre
 *    si, pra ramificações internas do próprio tipo (ex: subtipo de
 *    estelionato -> golpe do Pix -> lista de transferências).
 *
 * 3. Inclua o arquivo no index.html, ANTES de schema.js:
 *      <script src="js/tipos/nome_do_tipo.js"></script>
 *
 * É só isso. Nenhum outro arquivo precisa ser editado.
 * ---------------------------------------------------------------------------
 */

window.TIPOS_OCORRENCIA = {};

window.registrarTipoOcorrencia = function registrarTipoOcorrencia(chave, definicao) {
  if (window.TIPOS_OCORRENCIA[chave]) {
    console.warn(`Tipo de ocorrência "${chave}" registrado mais de uma vez — sobrescrevendo.`);
  }
  window.TIPOS_OCORRENCIA[chave] = definicao;
};
