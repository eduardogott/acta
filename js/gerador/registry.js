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
 * 1. Crie js/gerador/tipos/nome_do_tipo.js
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
 * 3. Inclua o arquivo no gerador.html, ANTES de schema.js:
 *      <script src="js/gerador/tipos/nome_do_tipo.js"></script>
 *
 * É só isso. Nenhum outro arquivo precisa ser editado.
 *
 * CAMPO OPCIONAL "orientacoes"
 * ---------------------------------------------------------------------------
 * Liga este tipo à folha de orientações (orientacoes.html), para o gerador
 * poder oferecer, ao fim do texto, o papel que o comunicante leva embora:
 *
 *    orientacoes: {
 *      tipo: "perda",                       // chave em js/orientacoes/dados.js
 *      subtipo: (respostas) => "celular",   // opcional; null quando não se sabe
 *    },
 *
 * O mapeamento fica aqui, e não lá, porque é este módulo que sabe o que as
 * próprias respostas significam. Sem o campo, o gerador simplesmente não
 * mostra o link — nada quebra.
 * ---------------------------------------------------------------------------
 */

window.TIPOS_OCORRENCIA = {};

window.registrarTipoOcorrencia = function registrarTipoOcorrencia(chave, definicao) {
  if (window.TIPOS_OCORRENCIA[chave]) {
    window.Log.criar("gerador").aviso(
      `Tipo de ocorrência "${chave}" registrado mais de uma vez — sobrescrevendo.`
    );
  }
  window.TIPOS_OCORRENCIA[chave] = definicao;
};
