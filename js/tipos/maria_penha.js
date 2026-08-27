/**
 * TIPO: LEI MARIA DA PENHA (VIOLÊNCIA DOMÉSTICA E FAMILIAR)
 */
registrarTipoOcorrencia("maria_penha", {
  label: "Violência Doméstica (Lei Maria da Penha)",

  perguntas: [
    {
      id: "mp_vinculo_agressor",
      tipo: "multipla",
      texto: "Qual o vínculo entre a vítima e o agressor?",
      opcoes: [
        { valor: "conjuge", texto: "cônjuge" },
        { valor: "ex_conjuge", texto: "ex-cônjuge" },
        { valor: "companheiro", texto: "companheiro(a)" },
        { valor: "ex_companheiro", texto: "ex-companheiro(a)" },
        { valor: "namorado", texto: "namorado(a)" },
        { valor: "ex_namorado", texto: "ex-namorado(a)" },
        { valor: "familiar", texto: "familiar" },
        { valor: "outro", texto: "vínculo íntimo de afeto" },
      ],
      template: (r, _, h) =>
        `Informa que o agressor é seu(sua) ${h.textoOpcaoEm("mp_vinculo_agressor", r)}.`,
    },
    {
      id: "mp_tipos_violencia",
      tipo: "selecao",
      texto: "Que tipo(s) de violência foram relatados?",
      opcoes: [
        { valor: "fisica", texto: "física" },
        { valor: "psicologica", texto: "psicológica" },
        { valor: "moral", texto: "moral" },
        { valor: "patrimonial", texto: "patrimonial" },
        { valor: "sexual", texto: "sexual" },
      ],
      template: (r, _, h) =>
        `Relata ter sofrido violência de natureza ${h.juntarLista(
          r.map((v) => h.textoOpcaoEm("mp_tipos_violencia", v))
        )}.`,
    },
    {
      id: "mp_descricao_fato",
      tipo: "texto",
      texto: "Descreva resumidamente a dinâmica da agressão relatada",
      placeholder: "No dia [data], por volta das [hora], no interior da residência do casal...",
      template: (r, _, h) => h.garantirPonto(r),
    },
    {
      id: "mp_medida_protetiva_solicitada",
      tipo: "multipla",
      texto: "A vítima manifestou interesse em solicitar medida protetiva de urgência?",
      opcoes: [
        { valor: "sim", texto: "Sim" },
        { valor: "nao", texto: "Não" },
      ],
      template: (r) =>
        r === "nao"
          ? "Não manifesta, neste momento, interesse na concessão de medida protetiva de urgência."
          : "",
    },
    {
      id: "mp_medidas_solicitadas",
      tipo: "selecao",
      texto: "Quais medidas foram solicitadas?",
      exibirSe: { pergunta: "mp_medida_protetiva_solicitada", igual: "sim" },
      opcoes: [
        { valor: "afastamento_lar", texto: "afastamento do lar" },
        { valor: "proibicao_aproximacao", texto: "proibição de aproximação da vítima" },
        { valor: "proibicao_contato", texto: "proibição de contato por qualquer meio" },
        { valor: "restricao_armas", texto: "restrição/suspensão de porte de armas" },
        { valor: "prestacao_alimentos", texto: "prestação de alimentos provisórios" },
      ],
      template: (r, _, h) =>
        `Manifesta interesse na concessão das seguintes medidas protetivas de urgência: ${h.juntarLista(
          r.map((v) => h.textoOpcaoEm("mp_medidas_solicitadas", v))
        )}.`,
    },
  ],
});
