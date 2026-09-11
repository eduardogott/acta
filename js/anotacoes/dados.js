/**
 * ANOTACOES-DADOS.JS
 * ---------------------------------------------------------------------------
 * A estante de papéis da unidade: o que se imprime e se entrega, o que se
 * cola na parede, o formulário que se preenche à caneta. A página
 * (js/anotacoes/anotacoes.js) só desenha os cartões — todo o conteúdo
 * está aqui, e é só aqui que se edita.
 *
 * SÃO DUAS COISAS, EM DOIS LUGARES
 *
 *   1. o PDF, feito no Office e salvo em js/anotacoes/pdfs/
 *   2. a entrada abaixo, que diz o que aquele arquivo é
 *
 * Nada varre a pasta sozinho — um site estático não tem como listar um
 * diretório. Arquivo jogado na pasta sem entrada aqui não aparece na
 * tela; entrada aqui apontando para arquivo que não existe vira um
 * cartão marcado "arquivo não encontrado", e um aviso no console. É de
 * propósito: o silêncio seria pior, porque o cartão continuaria bonito e
 * só falharia na mão de quem clicasse.
 *
 * FORMATO
 *
 *   categorias: [ { chave, label } ]        // a ordem aqui é a da tela
 *   itens: [
 *     {
 *       titulo: "Termo de Compromisso",     // obrigatório
 *       arquivo: "termo-compromisso.pdf",   // obrigatório, dentro de pdfs/
 *       categoria: "balcao",                // obrigatório, uma das acima
 *       descricao: "Para quem…",            // opcional, uma linha
 *       paginas: 2,                         // opcional, ver abaixo
 *       obs: "Imprimir em duas vias.",      // ressalva curta, opcional
 *     },
 *   ]
 *
 * COMO PREENCHER
 *
 *   - `arquivo` é o nome exato do arquivo, com a extensão, do jeito que
 *     ele está na pasta. Espaço e acento podem — a página monta o
 *     endereço com encodeURI, e "Auto de Prisão.pdf" funciona. Copie e
 *     cole o nome em vez de redigitar: é aqui que nasce o cartão morto.
 *   - `titulo` é o nome pelo qual a folha é pedida no balcão, não o nome
 *     do arquivo. "Termo de Compromisso", e não "termo_v3_final.pdf".
 *   - `descricao` responde "quando se usa isto?" numa linha. Título
 *     óbvio dispensa descrição; na dúvida, escreva.
 *   - `paginas` é quantas páginas o PDF tem, e existe porque esta é uma
 *     lista para IMPRIMIR: doze páginas por engano é um cartucho e uma
 *     fila. PÁGINAS, e não folhas — quantas folhas saem da impressora
 *     depende de quem imprime escolher frente ou frente e verso, e isso
 *     o arquivo não sabe.
 *   - `obs` é a ressalva que muda o que se faz: "duas vias", "imprimir só
 *     em frente", "só com o carimbo do plantão".
 *
 * Categoria que fica sem nenhum item não vira título vazio na tela —
 * pode deixar declarada esperando o primeiro papel.
 * ---------------------------------------------------------------------------
 */
window.ANOTACOES = {
  categorias: [
    { chave: "formularios", label: "Formulários para preencher" },
    { chave: "interno", label: "Uso interno" },
  ],

  itens: [
    {
      titulo: "Kit Preso/APF",
      arquivo: "kitpreso_apf.pdf",
      categoria: "interno",
      descricao:
        "Kit preso e lista de documentos para APF.",
      paginas: 1,
    },
    {
      titulo: "Kit Preso/APF mini",
      arquivo: "kitpreso_apf_mini.pdf",
      categoria: "interno",
      descricao:
        "Kit preso e lista de documentos para APF. Versão miniaturizada.",
      paginas: 1,
    },
  ],
};
