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

// Frase de abertura ("Comunica que sofreu estelionato, na modalidade do
// X.") — só existe pros subtipos listados aqui. Pra estender a outro
// subtipo, basta acrescentar uma entrada neste mapa.
const MODALIDADE_ABERTURA = {
  falso_advogado: "falso advogado",
  falso_parente: "falso parente",
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
      // Sem template por padrão (a classificação já fica registrada em
      // outro campo do sistema) — mas alguns subtipos não têm, no resto
      // da narrativa, nenhuma frase que deixe a modalidade implícita,
      // então vale declará-la explicitamente (ver MODALIDADE_ABERTURA).
      template: (r) =>
        MODALIDADE_ABERTURA[r] ? `Comunica que sofreu estelionato, na modalidade do ${MODALIDADE_ABERTURA[r]}.` : "",
    },

    // -------------------------------------------------- FALSO ADVOGADO ---
    {
      id: "fa_numeros_contato",
      tipo: "multiplo-input",
      texto: "Número(s) de telefone utilizado(s) pelos golpistas para contato",
      itemLabel: "Telefone",
      exibirSe: { pergunta: "tipo_estelionato", igual: "falso_advogado" },
      campos: [{ id: "numero", tipo: "texto", texto: "Número telefônico" }],
      template: () => "", // entra combinado na frase de fa_nome_advogado_alegado
    },
    {
      id: "fa_tipo_contato",
      tipo: "multipla",
      texto: "Qual foi o tipo de contato utilizado?",
      exibirSe: { pergunta: "tipo_estelionato", igual: "falso_advogado" },
      opcoes: [
        { valor: "ligacao", texto: "ligações telefônicas" },
        { valor: "mensagem_whats", texto: "mensagens via WhatsApp" },
        { valor: "outro_mensageiro", texto: "mensagens em aplicativo de mensagem" },
      ],
      template: () => "", // idem
    },
    {
      id: "fa_genero_advogado",
      tipo: "multipla",
      texto: "Gênero do(a) suposto(a) advogado(a) alegado(a)",
      exibirSe: { pergunta: "tipo_estelionato", igual: "falso_advogado" },
      opcoes: [
        { valor: "masculino", texto: "seu advogado" },
        { valor: "feminino", texto: "sua advogada" },
      ],
      template: () => "", // idem
    },
    {
      id: "fa_nome_advogado_alegado",
      tipo: "texto",
      texto: "Nome que os golpistas alegaram ser (do suposto advogado/advogada)",
      exibirSe: { pergunta: "tipo_estelionato", igual: "falso_advogado" },
      // Combina numeros_contato + tipo_contato + gênero + este nome numa
      // frase só — por isso as três perguntas acima não têm texto próprio.
      template: (r, respostas, h) => {
        const numeros = (respostas.fa_numeros_contato || []).map((item) => item.numero);
        const numerosTexto = h.juntarLista(numeros);
        const prefixo = numeros.length > 1 ? "dos números telefônicos" : "do número telefônico";
        const tipoContato = h.textoOpcaoEm("fa_tipo_contato", respostas.fa_tipo_contato);
        const papel =
          h.textoOpcaoEm("fa_genero_advogado", respostas.fa_genero_advogado) || "seu(sua) advogado(a)";
        return `Informa que recebeu ${tipoContato} ${prefixo} ${numerosTexto}, se passando por ${papel}, ${r}.`;
      },
    },
    {
      id: "fa_pretexto",
      tipo: "texto",
      texto: "Descreva o pretexto utilizado pelos golpistas (o que alegaram, o que solicitaram)",
      placeholder:
        "afirmaram que a vítima havia ganhado uma causa judicial no valor de R$ 16.000,00 e, como requisito ao pagamento, solicitaram que a vítima ingressasse em uma chamada de vídeo, afirmando estar fazendo alterações na conta bancária para pagar menos impostos",
      exibirSe: { pergunta: "tipo_estelionato", igual: "falso_advogado" },
      template: (r, _, h) => h.garantirPonto(`Estes indivíduos ${r}`),
    },
    {
      id: "fa_houve_acesso_remoto",
      tipo: "multipla",
      texto:
        "Os golpistas induziram a vítima a compartilhar a tela do dispositivo e/ou conceder acesso remoto à conta bancária?",
      exibirSe: { pergunta: "tipo_estelionato", igual: "falso_advogado" },
      opcoes: [
        { valor: "sim", texto: "Sim" },
        { valor: "nao", texto: "Não" },
      ],
      template: (r) =>
        r === "sim"
          ? "Os indivíduos induziram a vítima a compartilhar sua tela e liberar acesso à sua conta bancária e, após isso, foram realizadas transferências de sua conta para contas dos golpistas."
          : "",
    },
    {
      id: "fa_pagamentos",
      tipo: "multiplo-input",
      texto: "Transferências/pagamentos efetuados pela vítima",
      itemLabel: "Transferência",
      exibirSe: { pergunta: "tipo_estelionato", igual: "falso_advogado" },
      campos: [
        {
          id: "tipo_pagamento",
          tipo: "multipla",
          texto: "Modalidade",
          opcoes: [
            { valor: "pix", texto: "Pix" },
            { valor: "ted", texto: "TED" },
            { valor: "doc", texto: "DOC" },
            { valor: "boleto", texto: "Boleto" },
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
        { id: "banco_recebedor", tipo: "texto", texto: "Instituição recebedora (se souber)", obrigatoria: false },
      ],
      // Estilo próprio (ordinais: "sendo a primeira..., a segunda...")
      // em vez do "bem como" usado em fp_pagamentos — cada bloco de
      // pagamentos pode ter sua própria convenção de fraseado.
      template: (lista, _, h) => {
        const MODALIDADE_TXT = { pix: "Pix", ted: "TED", doc: "DOC", boleto: "boleto" };
        const clausula = (item) => {
          let c = `na modalidade ${MODALIDADE_TXT[item.tipo_pagamento] || item.tipo_pagamento}, no valor de ${h.formatMoney(
            item.valor
          )}, para o recebedor ${item.recebedor_nome}`;

          const identificadores = [];
          if (item.recebedor_documento) {
            const digitos = String(item.recebedor_documento).replace(/\D/g, "");
            const rotulo = digitos.length === 14 ? "CNPJ" : "CPF";
            identificadores.push(`${rotulo} ${item.recebedor_documento}`);
          }
          if (item.chave_pix) identificadores.push(`chave Pix ${item.chave_pix}`);
          if (identificadores.length) c += `, ${h.juntarLista(identificadores)}`;

          if (item.banco_recebedor) c += `, instituição recebedora ${item.banco_recebedor}`;
          return c;
        };

        if (lista.length === 1) {
          return `Esclarece que foi realizada 1 transferência, ${clausula(lista[0])}.`;
        }
        const comOrdinal = lista.map((item, i) => `a ${h.ordinal(i + 1, "f")} ${clausula(item)}`);
        return `Esclarece que foram realizadas ${lista.length} transferências, sendo ${h.juntarLista(comOrdinal)}.`;
      },
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
        { valor: "fotografia", texto: "fotografias" },
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
        "afirmou que estava tentando efetuar o pagamento de um boleto, entretanto, o aplicativo bancário não permitia a realização do pagamento",
      exibirSe: { pergunta: "tipo_estelionato", igual: "falso_parente" },
      template: (r) => `Informa que o indivíduo solicitou dinheiro, afirmando que ${r}.`,
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
        // "recebedor" no masculino como forma neutra padrão — ajuste
        // manualmente no texto final se o caso pedir concordância
        // diferente (o campo de saída é editável antes de copiar).
        const MODALIDADE_TXT = { pix: "Pix", boleto: "boleto", ted_doc: "TED/DOC" };
        const clausula = (item) => {
          let c = `na modalidade ${MODALIDADE_TXT[item.tipo_pagamento] || item.tipo_pagamento}, no valor de ${h.formatMoney(
            item.valor
          )}, tendo como recebedor ${item.recebedor_nome}`;

          const identificadores = [];
          if (item.recebedor_documento) {
            const digitos = String(item.recebedor_documento).replace(/\D/g, "");
            const rotulo = digitos.length === 14 ? "CNPJ" : "CPF";
            identificadores.push(`${rotulo} ${item.recebedor_documento}`);
          }
          if (item.chave_pix) identificadores.push(`chave Pix ${item.chave_pix}`);
          if (identificadores.length) c += `, ${h.juntarLista(identificadores)}`;

          if (item.banco_recebedor) c += `, junto à instituição ${item.banco_recebedor}`;
          return c;
        };

        if (lista.length === 1) {
          return `Relata que efetuou 1 pagamento, ${clausula(lista[0])}.`;
        }
        const comOrdinal = lista.map((item, i) => `o ${h.ordinal(i + 1, "m")} ${clausula(item)}`);
        return `Relata que efetuou ${lista.length} pagamentos, sendo ${h.juntarLista(comOrdinal)}.`;
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
        const clausula = (item) => {
          let c = `no valor de ${h.formatMoney(item.valor)} para a chave "${item.chave}"`;
          if (item.recebedor) c += `, em nome de ${item.recebedor}`;
          if (item.instituicao) c += `, junto à instituição ${item.instituicao}`;
          return c;
        };

        if (lista.length === 1) {
          return `Relata que efetuou 1 transferência via Pix, ${clausula(lista[0])}.`;
        }
        const comOrdinal = lista.map((item, i) => `a ${h.ordinal(i + 1, "f")} ${clausula(item)}`);
        return `Relata que efetuou ${lista.length} transferências via Pix, sendo ${h.juntarLista(comOrdinal)}.`;
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

    // Fica no fim de propósito: só faz sentido narrativamente depois de
    // já sabermos as transferências e o prejuízo total, não logo após a
    // pergunta de acesso remoto (por isso exibirSe aponta pra uma
    // pergunta declarada bem antes no array — isso é permitido, a ordem
    // de exibição/geração é a ordem de DECLARAÇÃO, não depende de onde a
    // pergunta que ela consulta foi declarada).
    {
      id: "fa_orientado_cancelar_acessos",
      tipo: "multipla",
      texto: "A vítima foi orientada a contatar o banco e cancelar os acessos à conta e aos cartões?",
      exibirSe: { pergunta: "fa_houve_acesso_remoto", igual: "sim" },
      opcoes: [
        { valor: "sim", texto: "Sim" },
        { valor: "nao", texto: "Não" },
      ],
      template: (r) =>
        r === "sim"
          ? "Foi orientado(a) a contatar o banco e providenciar o cancelamento dos acessos à conta e aos cartões bancários."
          : "",
    },
  ],
});