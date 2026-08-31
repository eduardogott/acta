/**
 * TIPO: PERDA
 * ---------------------------------------------------------------------------
 * Estilo do texto final: narrativa em 3ª pessoa, no estilo de transcrição
 * de depoimento ("Comunica que...", "Informa que...", "Relata que..."),
 * um parágrafo só, sem títulos de seção.
 * ---------------------------------------------------------------------------
 */

// Monta a frase do celular perdido a partir de marca/modelo/operadora/
// número (sempre presentes) + IMEI (opcional — omite a cláusula inteira
// quando não informado). Número é condensado (sem espaço/hífen) pro
// texto final independente de como foi digitado; IMEI idem.
function montarFraseCelular(respostas, h, imei) {
  const { perda_cel_marca: marca, perda_cel_modelo: modelo, perda_cel_operadora: operadora, perda_cel_numero: numero } =
    respostas;
  const clausulaImei = imei ? `, IMEI ${h.normalizarImei(imei)}` : "";
  return `Comunica que perdeu seu telefone celular. Informa que o celular consiste de um ${marca} ${modelo}, operadora ${operadora}, número telefônico ${h.normalizarTelefone(
    numero
  )}${clausulaImei}.`;
}

registrarTipoOcorrencia("perda", {
  label: "Perda",

  perguntas: [
    {
      id: "perda_o_que",
      tipo: "multipla",
      texto: "O que foi perdido?",
      opcoes: [
        { valor: "celular", texto: "Celular" },
        { valor: "documento_pessoal", texto: "Documento pessoal" },
        { valor: "documento_veicular", texto: "Documento veicular (DUT)" },
        { valor: "placa_veicular", texto: "Placa veicular" },
      ],
      // Sem template: é só um seletor de ramificação — cada ramo monta sua
      // própria frase de abertura combinada com os detalhes coletados.
      template: () => "",
    },

    // ------------------------------------------------------------ CELULAR ---
    {
      id: "perda_cel_marca",
      tipo: "texto",
      texto: "Marca do aparelho",
      placeholder: "Apple, Samsung, Motorola...",
      exibirSe: { pergunta: "perda_o_que", igual: "celular" },
      template: () => "", // entra combinado na frase de perda_cel_imei
    },
    {
      id: "perda_cel_modelo",
      tipo: "texto",
      texto: "Modelo do aparelho",
      placeholder: "iPhone 17",
      exibirSe: { pergunta: "perda_o_que", igual: "celular" },
      template: () => "", // idem
    },
    {
      id: "perda_cel_operadora",
      tipo: "texto",
      texto: "Empresa telefônica (operadora)",
      placeholder: "Vivo, Claro, Tim...",
      exibirSe: { pergunta: "perda_o_que", igual: "celular" },
      template: () => "", // idem
    },
    {
      id: "perda_cel_numero",
      tipo: "texto",
      texto: "Número telefônico",
      placeholder: "51 987654321",
      validador: "telefone",
      exibirSe: { pergunta: "perda_o_que", igual: "celular" },
      template: () => "", // idem
    },
    {
      id: "perda_cel_sabe_imei",
      tipo: "multipla",
      texto: "Sabe o IMEI do telefone perdido?",
      exibirSe: { pergunta: "perda_o_que", igual: "celular" },
      opcoes: [
        { valor: "sim", texto: "Sim" },
        { valor: "nao", texto: "Não" },
      ],
      // Se não sabe, a frase já sai completa aqui, sem a pergunta do IMEI
      // (que só é exibida no caso "sim") — por isso as quatro perguntas
      // acima não têm texto próprio.
      template: (r, respostas, h) => (r === "nao" ? montarFraseCelular(respostas, h) : ""),
    },
    {
      id: "perda_cel_imei",
      tipo: "texto",
      texto: "IMEI do aparelho",
      placeholder: "123456789098765",
      validador: "imei",
      exibirSe: { pergunta: "perda_cel_sabe_imei", igual: "sim" },
      // Combina marca + modelo + operadora + número + este IMEI numa
      // frase só (caso "sabe o IMEI" = sim, ver perda_cel_sabe_imei acima
      // pro caso "não").
      template: (r, respostas, h) => montarFraseCelular(respostas, h, r),
    },

    // --------------------------------------------------- DOCUMENTO PESSOAL ---
    {
      id: "perda_doc_quais",
      tipo: "selecao",
      texto: "Quais documentos foram perdidos?",
      exibirSe: { pergunta: "perda_o_que", igual: "documento_pessoal" },
      opcoes: [
        { valor: "identidade", texto: "Documento de Identidade" },
        { valor: "cnh", texto: "Carteira de Habilitação (CNH)" },
        { valor: "cartao_sus", texto: "Cartão do SUS" },
        { valor: "cartao_idoso", texto: "Cartão do Idoso" },
        { valor: "cartao_estacionamento_idoso", texto: "Cartão de Estacionamento do Idoso" },
        { valor: "ctps", texto: "Carteira de Trabalho" },
        { valor: "titulo_eleitor", texto: "Título de Eleitor" },
        { valor: "passaporte", texto: "Passaporte" },
        { valor: "certidaonasc", texto: "Certidão de Nascimento" },
        { valor: "cartao_bancario", texto: "Cartão bancário" },
      ],
      template: (r, _, h) =>
        `Comunica a perda dos seguintes documentos: ${h.juntarLista(
          r.map((v) => h.textoOpcaoEm("perda_doc_quais", v))
        )}.`,
    },

    // -------------------------------------------------- DOCUMENTO VEICULAR ---
    {
      id: "perda_doc_veic_placa",
      tipo: "texto",
      texto: "Qual é a placa do veículo?",
      placeholder: "ABC1234",
      validador: "placa",
      exibirSe: { pergunta: "perda_o_que", igual: "documento_veicular" },
      template: (r, _, h) =>
        `Comunica a perda do Certificado do Registro do Veículo (CRV/DUT) do veículo de placas ${h.normalizarPlaca(
          r
        )}, abaixo qualificado.`,
    },

    // ------------------------------------------------------ PLACA VEICULAR ---
    {
      id: "perda_placa_qual",
      tipo: "multipla",
      texto: "Qual placa foi perdida?",
      exibirSe: { pergunta: "perda_o_que", igual: "placa_veicular" },
      opcoes: [
        { valor: "dianteira", texto: "dianteira" },
        { valor: "traseira", texto: "traseira" },
        { valor: "ambas", texto: "ambas"}
      ],
      template: () => "", // entra combinado na frase de perda_placa_veiculo
    },
    {
      id: "perda_placa_veiculo",
      tipo: "texto",
      texto: "Qual é a placa do veículo?",
      placeholder: "ABC1234",
      validador: "placa",
      exibirSe: { pergunta: "perda_o_que", igual: "placa_veicular" },
      template: (r, respostas, h) => {
        const qual = h.textoOpcaoEm("perda_placa_qual", respostas.perda_placa_qual);
        const placa = h.normalizarPlaca(r);
        if (qual === "ambas") {
          return `Comunica a perda de ambas placas do veículo de placas ${placa}, abaixo qualificado.`;
        }
        return `Comunica a perda da placa ${qual} do veículo de placas ${placa}, abaixo qualificado.`;
      },
    },
  ],
});
