/**
 * TIPO: ESTELIONATO
 * ---------------------------------------------------------------------------
 * Estilo do texto final: narrativa em 3ª pessoa, no estilo de transcrição
 * de depoimento ("Comunica que...", "Informa que...", "Relata que..."),
 * um parágrafo só, sem títulos de seção.
 * ---------------------------------------------------------------------------
 */

// Artigo possessivo por parentesco (concordância de gênero em "se passou
// por seu/sua ___"). Mantido local ao módulo — não precisa de infra
// genérica pra isso.
const FP_PRONOME = {
  irmao: "seu",
  irma: "sua",
  pai: "seu",
  mae: "sua",
  filho: "seu",
  filha: "sua",
  conjuge: "seu",
  amigo: "seu(sua)",
  outro_familiar: "seu(sua)",
};

// Pronome demonstrativo pra "foto de perfil deste/desta" — concordando
// com quem foi imitado, não com quem está registrando a ocorrência.
const FP_PRON_POSS = {
  irmao: "deste",
  irma: "desta",
  pai: "deste",
  mae: "desta",
  filho: "deste",
  filha: "desta",
  conjuge: "deste",
  amigo: "deste(a)",
  outro_familiar: "deste(a)",
};

registrarTipoOcorrencia("estelionato", {
  label: "Estelionato",

  perguntas: [
    {
      id: "tipo_estelionato",
      tipo: "multipla",
      texto: "Qual o tipo de estelionato?",
      opcoes: [
        { valor: "falso_advogado", texto: "Falso Advogado" },
        { valor: "falso_funcionario_banco", texto: "Falso Funcionário de Banco" },
        { valor: "falso_parente", texto: "Falso Parente/Conhecido (golpe do WhatsApp)" },
        { valor: "golpe_pix", texto: "Golpe do Pix / Falsa Central" },
        { valor: "venda_nao_entregue", texto: "Venda pela Internet não Entregue" },
      ],
      // Sem template: é só o seletor de ramificação — a classificação já
      // fica registrada em outro campo do sistema, o texto narrativo que
      // segue já deixa a modalidade implícita.
      template: () => "",
    },

    // ---------------------------------------------------- FALSO PARENTE ---
    {
      id: "fp_numeros_contato",
      tipo: "multiplo-input",
      texto: "Número(s) de telefone utilizado(s) pelo golpista para contato",
      itemLabel: "Telefone",
      exibirSe: { pergunta: "tipo_estelionato", igual: "falso_parente" },
      campos: [{ id: "numero", tipo: "texto", texto: "Número telefônico" }],
      template: () => "", // entra combinado na frase de fp_usou_foto_perfil
    },
    {
      id: "fp_tipo_contato",
      tipo: "multipla",
      texto: "Qual foi o tipo de contato utilizado?",
      exibirSe: { pergunta: "tipo_estelionato", igual: "falso_parente" },
      opcoes: [
        { valor: "mensagem_whats", texto: "mensagens via WhatsApp" },
        { valor: "outro_mensageiro", texto: "mensagens em aplicativo de mensagem" },
        { valor: "ligacao", texto: "ligações telefônicas" },
      ],
      template: () => "", // idem
    },
    {
      id: "fp_parentesco",
      tipo: "multipla",
      texto: "Por quem o golpista se passou?",
      exibirSe: { pergunta: "tipo_estelionato", igual: "falso_parente" },
      opcoes: [
        { valor: "irmao", texto: "irmão" },
        { valor: "irma", texto: "irmã" },
        { valor: "pai", texto: "pai" },
        { valor: "mae", texto: "mãe" },
        { valor: "filho", texto: "filho" },
        { valor: "filha", texto: "filha" },
        { valor: "conjuge", texto: "cônjuge" },
        { valor: "amigo", texto: "amigo(a)" },
        { valor: "outro_familiar", texto: "outro familiar" },
      ],
      template: () => "", // idem
    },
    {
      id: "fp_nome_alegado",
      tipo: "texto",
      texto: "Nome que o golpista utilizou (nome da pessoa que ele imitou)",
      exibirSe: { pergunta: "tipo_estelionato", igual: "falso_parente" },
      template: () => "", // idem
    },
    {
      id: "fp_usou_foto_perfil",
      tipo: "multipla",
      texto: "O golpista utilizou foto de perfil da pessoa que estava imitando?",
      exibirSe: { pergunta: "tipo_estelionato", igual: "falso_parente" },
      opcoes: [
        { valor: "sim", texto: "Sim" },
        { valor: "nao", texto: "Não" },
      ],
      // Combina numeros_contato + tipo_contato + parentesco + nome_alegado
      // + esta resposta numa frase só — é por isso que as perguntas acima
      // não têm texto próprio.
      template: (r, respostas, h) => {
        const parentesco = h.textoOpcaoEm("fp_parentesco", respostas.fp_parentesco);
        const artigo = FP_PRONOME[respostas.fp_parentesco] || "seu(sua)";
        const possessivo = FP_PRON_POSS[respostas.fp_parentesco] || "deste(a)";

        let foto = "";
        if (r === "sim") foto = `, utilizando, inclusive, foto de perfil ${possessivo}`;

        const tipoContato = h.textoOpcaoEm("fp_tipo_contato", respostas.fp_tipo_contato);
        const numeros = (respostas.fp_numeros_contato || []).map((item) => item.numero);
        const numerosTexto = h.juntarLista(numeros);
        const prefixoNumero = numeros.length > 1 ? "dos números telefônicos" : "do número telefônico";

        return `Comunica que recebeu ${tipoContato} ${prefixoNumero} ${numerosTexto}, de um indivíduo que se passou por ${artigo} ${parentesco}, ${respostas.fp_nome_alegado}${foto}.`;
      },
    },
    {
      id: "fp_sabia_outros_dados",
      tipo: "multipla",
      texto: "O golpista demonstrou conhecer outros dados pessoais da pessoa que estava imitando, além do nome?",
      exibirSe: { pergunta: "tipo_estelionato", igual: "falso_parente" },
      opcoes: [
        { valor: "sim", texto: "Sim" },
        { valor: "nao", texto: "Não" },
      ],
      template: () => "", // detalhe entra via fp_dados_utilizados
    },
    {
      id: "fp_dados_utilizados",
      tipo: "selecao",
      texto: "Quais dados pessoais da pessoa pela qual estava se passando o golpista demonstrou conhecer?",
      exibirSe: { pergunta: "fp_sabia_outros_dados", igual: "sim" },
      opcoes: [
        { valor: "nome_completo", texto: "nome completo" },
        { valor: "numero_cpf", texto: "número do CPF" },
        { valor: "endereco", texto: "endereço" },
        { valor: "informacoes_intimas", texto: "outras informações pessoais" },
        { valor: "outro", texto: "outro dado" },
      ],
      template: (r, _, h) =>
        `Acrescenta que o suspeito também demonstrou conhecer ${h.juntarLista(
          r.map((v) => h.textoOpcaoEm("fp_dados_utilizados", v))
        )} da pessoa pela qual se passava.`,
    },
    {
      id: "fp_dados_utilizados_outro",
      tipo: "texto",
      texto: "Descreva o(s) outro(s) dado(s) que o golpista demonstrou conhecer",
      exibirSe: { pergunta: "fp_dados_utilizados", incluiValor: "outro" },
      template: (r) => `Relata que o suspeito também sabia ${r}.`,
    },
    {
      id: "fp_justificativa_pedido",
      tipo: "texto",
      texto: "Qual foi a justificativa dada pelo golpista para pedir o dinheiro?",
      placeholder:
        "que estava tentando efetuar o pagamento de um boleto, entretanto, o aplicativo bancário não permitia a realização do pagamento",
      exibirSe: { pergunta: "tipo_estelionato", igual: "falso_parente" },
      template: (r) => `Informa que o indivíduo solicitou dinheiro, afirmando ${r}.`,
    },
    {
      id: "fp_pagamentos",
      tipo: "multiplo-input",
      texto: "Pagamentos efetuados pela vítima",
      itemLabel: "Pagamento",
      exibirSe: { pergunta: "tipo_estelionato", igual: "falso_parente" },
      campos: [
        {
          id: "tipo_pagamento",
          tipo: "multipla",
          texto: "Tipo de pagamento",
          opcoes: [
            { valor: "pix", texto: "Pix" },
            { valor: "boleto", texto: "Boleto" },
            { valor: "ted_doc", texto: "TED/DOC" },
          ],
        },
        { id: "valor", tipo: "dinheiro", texto: "Valor" },
        { id: "recebedor_nome", tipo: "texto", texto: "Nome do recebedor" },
        {
          id: "recebedor_documento",
          tipo: "texto",
          texto: "CPF/CNPJ do recebedor (se souber)",
          validador: "cpfOuCnpj",
          obrigatoria: false,
        },
        { id: "chave_pix", tipo: "texto", texto: "Chave Pix utilizada (se houver)", obrigatoria: false },
        { id: "banco_recebedor", tipo: "texto", texto: "Banco recebedor (se souber)", obrigatoria: false },
      ],
      template: (lista, _, h) => {
        // "recebedor"/"receptor" no masculino como forma neutra padrão —
        // ajuste manualmente no texto final se o caso pedir concordância
        // diferente (o campo de saída é editável antes de copiar).
        const ACAO_POR_TIPO = {
          pix: "efetuou um pagamento via Pix",
          boleto: "efetuou o pagamento de um boleto",
          ted_doc: "efetuou uma transferência",
        };
        const frases = lista.map((item) => {
          let frase = `${ACAO_POR_TIPO[item.tipo_pagamento] || "efetuou um pagamento"}, no valor de ${h.formatMoney(
            item.valor
          )}, tendo como recebedor ${item.recebedor_nome}`;

          const identificadores = [];
          if (item.recebedor_documento) {
            const digitos = String(item.recebedor_documento).replace(/\D/g, "");
            const rotulo = digitos.length === 14 ? "CNPJ n°" : "CPF";
            identificadores.push(`${rotulo} ${item.recebedor_documento}`);
          }
          if (item.chave_pix) identificadores.push(`chave Pix ${item.chave_pix}`);
          if (identificadores.length) frase += `, ${h.juntarLista(identificadores)}`;

          if (item.banco_recebedor) frase += `, com banco recebedor ${item.banco_recebedor}`;
          return frase;
        });
        return `Relata que ${h.juntarClausulas(frases, "bem como")}.`;
      },
    },

    // -------------------------------------------------------- GOLPE PIX ---
    {
      id: "golpe_pix_recebeu_ligacao",
      tipo: "multipla",
      texto: "A vítima recebeu ligação telefônica se passando por atendente do banco?",
      exibirSe: { pergunta: "tipo_estelionato", igual: "golpe_pix" },
      opcoes: [
        { valor: "sim", texto: "Sim" },
        { valor: "nao", texto: "Não" },
      ],
      template: (r) =>
        r === "sim"
          ? "Informa que recebeu ligação telefônica de um indivíduo que se apresentou como funcionário de instituição bancária."
          : "Informa que não houve contato telefônico prévio, apenas por mensagem.",
    },
    {
      id: "transferencias_pix",
      tipo: "multiplo-input",
      texto: "Transferências PIX realizadas pela vítima",
      itemLabel: "Transferência",
      exibirSe: { pergunta: "tipo_estelionato", igual: "golpe_pix" },
      campos: [
        { id: "valor", tipo: "dinheiro", texto: "Valor" },
        // Chave Pix também pode ser e-mail/telefone/aleatória — troque
        // por outro validador (ou remova) se aceitar outros formatos.
        { id: "chave", tipo: "texto", texto: "Chave Pix (CPF/CNPJ)", validador: "cpfOuCnpj" },
        { id: "recebedor", tipo: "texto", texto: "Nome do recebedor (se identificado)", obrigatoria: false },
        { id: "instituicao", tipo: "texto", texto: "Instituição financeira", obrigatoria: false },
      ],
      template: (lista, _, h) => {
        const frases = lista.map(
          (item) =>
            `efetuou transferência via Pix no valor de ${h.formatMoney(item.valor)} para a chave "${
              item.chave
            }"${item.recebedor ? `, em nome de ${item.recebedor}` : ""}${
              item.instituicao ? `, junto à instituição ${item.instituicao}` : ""
            }`
        );
        return `Relata que ${h.juntarClausulas(frases, "bem como")}.`;
      },
    },

    // ------------------------------------------------------- PREJUÍZO -----
    {
      id: "estelionato_sabe_prejuizo",
      tipo: "multipla",
      texto: "Sabe estimar o valor total do prejuízo?",
      opcoes: [
        { valor: "sim", texto: "Sim" },
        { valor: "nao", texto: "Não" },
      ],
      template: (r) => (r === "nao" ? "Esclarece não saber precisar o valor total do prejuízo." : ""),
    },
    {
      id: "valor_prejuizo",
      tipo: "dinheiro",
      texto: "Valor total do prejuízo estimado",
      exibirSe: { pergunta: "estelionato_sabe_prejuizo", igual: "sim" },
      template: (r, _, h) => `Estima o prejuízo total em ${h.formatMoney(r)}.`,
    },
  ],
});