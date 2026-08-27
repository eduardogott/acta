/**
 * TIPO: DESCUMPRIMENTO DE MEDIDA PROTETIVA DE URGÊNCIA (MPU)
 */
registrarTipoOcorrencia("descumprimento_mpu", {
  label: "Descumprimento de Medida Protetiva de Urgência",

  perguntas: [
    {
      id: "mpu_sabe_numero_processo",
      tipo: "multipla",
      texto: "Sabe o número do processo/medida protetiva descumprida?",
      opcoes: [
        { valor: "sim", texto: "Sim" },
        { valor: "nao", texto: "Não" },
      ],
      template: () => "",
    },
    {
      id: "mpu_numero_processo",
      tipo: "texto",
      texto: "Número do processo/medida protetiva",
      exibirSe: { pergunta: "mpu_sabe_numero_processo", igual: "sim" },
      template: (r) => `Informa que a medida protetiva descumprida refere-se ao processo n° ${r}.`,
    },
    {
      id: "mpu_sabe_vara_origem",
      tipo: "multipla",
      texto: "Sabe a Vara/Juizado de origem da medida?",
      opcoes: [
        { valor: "sim", texto: "Sim" },
        { valor: "nao", texto: "Não" },
      ],
      template: () => "",
    },
    {
      id: "mpu_vara_origem",
      tipo: "texto",
      texto: "Vara/Juizado de origem da medida",
      exibirSe: { pergunta: "mpu_sabe_vara_origem", igual: "sim" },
      template: (r) => `Aduz que a medida foi concedida pela ${r}.`,
    },
    {
      id: "mpu_tipo_descumprimento",
      tipo: "selecao",
      texto: "De que forma a medida foi descumprida?",
      opcoes: [
        { valor: "aproximacao_fisica", texto: "aproximação física da vítima" },
        { valor: "contato_telefonico", texto: "contato telefônico" },
        { valor: "contato_redes_sociais", texto: "contato por redes sociais/aplicativos" },
        { valor: "contato_terceiros", texto: "contato por meio de terceiros" },
        { valor: "permanencia_local_proibido", texto: "permanência em local com distância mínima determinada" },
        { valor: "outro", texto: "outra forma" },
      ],
      template: (r, _, h) =>
        `Relata que o descumprimento se deu por meio de ${h.juntarLista(
          r.map((v) => h.textoOpcaoEm("mpu_tipo_descumprimento", v))
        )}.`,
    },
    {
      id: "mpu_descricao_fato",
      tipo: "texto",
      texto: "Descreva como ocorreu o descumprimento",
      placeholder: "No dia [data], por volta das [hora], o autor...",
      template: (r, _, h) => h.garantirPonto(r),
    },
    {
      id: "mpu_ha_testemunhas",
      tipo: "multipla",
      texto: "Há testemunhas do descumprimento?",
      opcoes: [
        { valor: "sim", texto: "Sim" },
        { valor: "nao", texto: "Não" },
      ],
      template: (r) => (r === "sim" ? "Informa haver testemunhas do fato." : ""),
    },
    {
      id: "mpu_dados_testemunhas",
      tipo: "texto",
      texto: "Nome e contato das testemunhas",
      exibirSe: { pergunta: "mpu_ha_testemunhas", igual: "sim" },
      template: (r) => `Indica como testemunha(s): ${r}.`,
    },
  ],
});
