/**
 * TIPO: FURTO DE CELULAR
 */
registrarTipoOcorrencia("furto_celular", {
  label: "Furto de Celular",

  perguntas: [
    {
      id: "furto_local",
      tipo: "texto",
      texto: "Onde ocorreu o furto do celular?",
      placeholder: "no interior do ônibus da linha 215, sentido Centro",
      template: (r) => `Relata que o fato ocorreu ${r}.`,
    },
    {
      id: "furto_percebeu_quando",
      tipo: "multipla",
      texto: "Quando a vítima percebeu a subtração?",
      opcoes: [
        { valor: "no_momento", texto: "no momento em que ocorreu" },
        { valor: "pouco_depois", texto: "pouco tempo depois" },
        { valor: "so_em_casa", texto: "somente ao chegar em casa/outro local" },
      ],
      template: (r, _, h) =>
        `Informa que percebeu a falta do aparelho ${h.textoOpcaoEm("furto_percebeu_quando", r)}.`,
    },
    {
      id: "objetos_furtados",
      tipo: "multiplo-input",
      texto: "Objetos subtraídos",
      itemLabel: "Objeto",
      campos: [
        { id: "descricao", tipo: "texto", texto: "Descrição do objeto (marca, modelo, cor)" },
        // Campo dentro de um item de lista, não uma "pergunta" solta —
        // aqui faz sentido continuar opcional (nem sempre a vítima sabe
        // estimar de cabeça).
        { id: "valor", tipo: "dinheiro", texto: "Valor estimado", obrigatoria: false },
      ],
      template: (lista, _, h) => {
        const frases = lista.map(
          (item) => `foi subtraído ${item.descricao}${item.valor ? `, avaliado em ${h.formatMoney(item.valor)}` : ""}`
        );
        return `Aduz que ${h.juntarClausulas(frases, "bem como")}.`;
      },
    },
  ],
});
