/**
 * ORIENTACOES-DADOS.JS
 * ---------------------------------------------------------------------------
 * O conteúdo da folha de orientações que sai com o comunicante. A página
 * (js/orientacoes/orientacoes.js) só monta e imprime — todo o texto está aqui.
 *
 * FORMATO
 *
 *   comuns: { titulo, itens }        // entram em toda folha
 *   tipos: [
 *     {
 *       chave: "estelionato",
 *       label: "Estelionato / golpe",
 *       itens: [ … ],                // valem para o tipo inteiro
 *       subtipos: [                  // escolha única, opcional
 *         { chave, label, itens: [ … ] },
 *       ],
 *       extras: [                    // marcáveis em conjunto, opcional
 *         { chave, label, itens: [ … ] },
 *       ],
 *     },
 *   ]
 *
 * Cada item é uma string OU { texto, prazo }. O `prazo` vira uma etiqueta
 * ao lado da frase — é o que a pessoa mais esquece e o que mais custa
 * caro quando esquece.
 *
 * Escreva os itens no imperativo e endereçados à pessoa que vai levar o
 * papel ("Peça ao banco…"), não ao policial que atende. É ela quem lê.
 *
 * E lembre que é PAPEL. A folha é impressa pelo agente e entregue em
 * mãos: quem lê não clica em nada. Endereço de site tem de ser curto o
 * bastante para se digitar à mão, e onde houver telefone, o telefone vem
 * junto. Onde o serviço exigir conta gov.br ou cadastro, diga — quem
 * esbarra num login inesperado, sozinho e com um papel na mão, desiste.
 *
 * E escreva do ponto de vista de DEPOIS do registro, que é quando o papel
 * chega às mãos dela. Orientação do momento do fato ("anote a placa do
 * outro condutor", "fotografe antes de remover os veículos") já nasce
 * vencida aqui: ou a pessoa fez, e a frase é ruído, ou não fez, e a folha
 * só informa que ela perdeu alguma coisa. O que se pede é sempre algo
 * que ainda dê para fazer hoje — inclusive levar à delegacia o que
 * ficou de fora do registro.
 * ---------------------------------------------------------------------------
 */

window.ORIENTACOES = {
  comuns: {
    titulo: "Em qualquer registro",
    itens: [
      "O número do seu boletim está no alto desta folha. Guarde-a: é por esse número que a ocorrência é localizada em qualquer consulta posterior.",
      "Se aparecerem provas novas — imagens, testemunhas, mensagens, notas fiscais —, leve-as à delegacia para serem juntadas.",
      "Nunca pague nada a quem ligar oferecendo recuperar seu dinheiro, adiantar o processo ou liberar valores. Nenhum órgão público cobra por isso.",
      {
        texto: "Se o crime for de ação penal condicionada ou privada, o prazo para representar ou dar queixa é de seis meses, contados do dia em que você soube quem foi o autor. Passado o prazo, o direito se perde. A exceção é para crimes de violência doméstica e familiar, onde o prazo é de um ano.",
        prazo: "6 meses",
      },
    ],
  },

  tipos: [
    // ================================================== ESTELIONATO ===
    {
      chave: "estelionato",
      label: "Estelionato / golpe",
      itens: [
        {
          texto: "Caso tenha efetuado alguma transferência, contate o banco imediatamente e solicite o estorno dos valores, por meio do Mecanismo Especial de Devolução do Pix. O mecanismo tem prazo contado.",
          prazo: "imediatamente",
        },
        {
          texto: "Se você compartilhou tela ou os golpistas obtiveram acesso à sua conta bancária, contate o banco e solicite o bloqueio imediato da conta e acessos.",
          prazo: "imediatamente",
        },
        "Denuncie também na plataforma onde o golpe aconteceu (WhatsApp, Instagram, Marketplace, banco). Isso ajuda a tirar o perfil do ar, mas não substitui este registro.",
        "Desconfie do golpe seguinte: é comum o mesmo grupo ligar depois se passando por banco, polícia ou advogado, prometendo recuperar o dinheiro mediante um pagamento.",
        "Consulte o Registrato, do Banco Central (registrato.bcb.gov.br), para ver se abriram contas, chaves Pix ou empréstimos no seu nome. É preciso entrar com a conta gov.br.",
        "Se os golpistas obtiveram acesso ao seu celular ou baixaram qualquer aplicativo, restaure o aparelho para as configurações de fábrica.",
      ],
      subtipos: [
        {
          chave: "falso_parente",
          label: "Falso parente ou conhecido (golpe do WhatsApp)",
          itens: [
            "Avise a família e os contatos por outro meio de que o número é falso, para ninguém mais pagar.",
          ],
        },
        {
          chave: "falso_advogado",
          label: "Falso advogado",
          itens: [
            "Contate seu advogado e informe que estão utilizando suas informações para aplicar golpes.",
            "Sempre contate seu advogado diretamente; nunca retorne pelo número que ligou para você.",
            "Não há mecanismo para pagar menos impostos ou \"agilizar\" processos; são pretextos de golpes.",
          ],
        },
        {
          chave: "falso_atendente",
          label: "Falsa central ou falso funcionário de banco",
          itens: [
            "Nunca retorne pelo número que ligou para você. Sempre retorne para o número oficial impresso no verso do cartão ou no site da instituição.",
            "Banco, cartório e polícia não pedem senha, código de aplicativo, foto de documento nem transferência via telefone.",
          ],
        },
        {
          chave: "venda_internet",
          label: "Compra ou venda pela internet não concluída",
          itens: [
            "Salve o anúncio enquanto ele existir: endereço da página, data, valor, fotos e o perfil do vendedor. Anúncio de golpe some em poucas horas — o que você conseguir salvar, leve à delegacia.",
            "Se pagou com cartão, peça o estorno (chargeback) ao banco emissor por escrito, dentro do prazo da bandeira.",
            "Registre a reclamação também no consumidor.gov.br (precisa criar cadastro) e no Procon — é o caminho da devolução do valor, que este boletim não resolve sozinho.",
          ],
        },
        {
          chave: "boleto",
          label: "Boleto adulterado",
          itens: [
            "Guarde o arquivo do boleto pago, não apenas a impressão. Os dados do beneficiário ficam registrados nele.",
            "Avise o credor verdadeiro imediatamente: a dívida original continua em aberto, e ele precisa saber que houve fraude.",
            "Leve o boleto e o comprovante de pagamento à delegacia. A divergência entre quem recebeu e quem deveria receber é o indício mais direto, e é por ela que a apuração começa.",
          ],
        },
      ],
      extras: [
        {
          chave: "coleta_dados",
          label: "Informou dados pessoais, senha ou foto de documento",
          itens: [
            "Troque agora as senhas de banco, e-mail e redes sociais, começando pelo e-mail — é por ele que se recupera todo o resto.",
            "Ative a verificação em duas etapas em todas as contas que permitirem.",
            "Avise o banco de que seus dados foram expostos e peça que a conta fique em observação.",
            "Cadastre alerta de CPF nos birôs de crédito (Serasa e SPC) para ser avisado se abrirem crédito no seu nome.",
            "Consulte o Registrato do Banco Central (registrato.bcb.gov.br, com a conta gov.br) de tempos em tempos nos próximos meses.",
          ],
        },
        {
          chave: "clonagem_whatsapp",
          label: "Conta de WhatsApp clonada ou tomada",
          itens: [
            "Ative a verificação em duas etapas assim que recuperar a conta. É o que impede a retomada, e sem ela o golpista volta.",
            "Peça a recuperação pelo próprio aplicativo, reinstalando e pedindo novo código por SMS. Se não chegar, escreva ao suporte do WhatsApp.",
            "Avise seus contatos por outro meio de que a conta foi tomada e de que pedidos de dinheiro em seu nome são falsos.",
            "Se você deixou de receber sinal no celular antes da clonagem, procure a operadora: pode ter havido troca fraudulenta do seu chip.",
          ],
        },
        {
          chave: "acesso_remoto",
          label: "Instalou aplicativo indicado pelo golpista (acesso remoto)",
          itens: [
            "Desinstale o aplicativo e não faça nenhuma transação bancária nesse aparelho até que ele seja verificado ou restaurado de fábrica.",
            "Troque as senhas de outro dispositivo, nunca do aparelho comprometido.",
            "Avise o banco de que houve acesso remoto ao seu aparelho: as transações feitas assim têm tratamento diferente.",
          ],
        },
        {
          chave: "uso_do_nome",
          label: "Usaram seus dados para abrir conta, crédito ou empresa",
          itens: [
            "Conteste formalmente e por escrito junto à instituição, guardando o protocolo. A contestação verbal não deixa rastro.",
            "Peça a exclusão de eventuais negativações, anexando cópia deste boletim.",
            "Se abriram empresa em seu nome, procure também a Junta Comercial e a Receita Federal.",
          ],
        },
      ],
    },

    // ========================================================= PERDA ===
    {
      chave: "perda",
      label: "Perda ou extravio",
      itens: [
        "Este registro serve para preservar seus direitos e comprovar a data em que o extravio foi comunicado. A segunda via depende do órgão que emitiu o documento.",
        "Se o objeto ou documento aparecer, comunique — evita que ele continue como extraviado nos sistemas.",
      ],
      subtipos: [
        {
          chave: "celular",
          label: "Celular",
          itens: [
            {
              texto: "Ligue para a operadora e peça o bloqueio do IMEI, não só do chip. O bloqueio do chip protege a linha; o do IMEI é o que impede o aparelho de funcionar em qualquer operadora.",
              prazo: "hoje",
            },
            "Acesse \"Encontre meu dispositivo\" (Android) ou \"Buscar\" (iPhone) de outro aparelho e apague os dados remotamente.",
            "Troque as senhas das contas que estavam logadas no aparelho: e-mail primeiro, depois banco e redes sociais.",
            "Avise o banco para bloquear o aplicativo instalado naquele celular.",
            "Registre o aparelho no Celular Seguro (gov.br/celularseguro, com a conta gov.br), que bloqueia contas e aplicativos de uma vez só.",
          ],
        },
        {
          chave: "documento_pessoal",
          label: "Documento pessoal (RG, CPF, CNH, passaporte)",
          itens: [
            "Peça a segunda via ao órgão emissor: identidade no instituto de identificação do seu estado, CNH no Detran, passaporte na Polícia Federal.",
            "Leve este boletim: quase todos os órgãos pedem o registro para emitir a segunda via.",
            "Se desconfiar que o documento foi usado por terceiros, cadastre alerta de CPF nos birôs de crédito e consulte o Registrato do Banco Central (registrato.bcb.gov.br, com a conta gov.br).",
          ],
        },
        {
          chave: "documento_veicular",
          label: "Documento do veículo (CRLV ou CRV/DUT)",
          itens: [
            "O CRLV (licenciamento) tem versão digital gratuita no aplicativo Carteira Digital de Trânsito — resolve a circulação enquanto a segunda via não sai.",
            "O CRV (o antigo DUT) exige procedimento próprio no Detran, com vistoria, e é o documento da transferência de propriedade.",
            "Nunca assine um CRV em branco, mesmo para venda. Perdido assinado, ele transfere o veículo para qualquer um.",
          ],
        },
        {
          chave: "placa",
          label: "Placa veicular",
          itens: [
            "Solicite a nova placa no Detran, por meio de empresa estampadora credenciada. Leve este boletim.",
            "Circular sem a placa é infração de trânsito, com remoção do veículo — evite usar o veículo até a reposição.",
          ],
        },
        {
          chave: "cartao",
          label: "Cartão bancário",
          itens: [
            "Bloqueie o cartão pelo aplicativo ou pela central do banco, se ainda não fez, e anote o protocolo.",
            "Confira a fatura e o extrato dos últimos dias e conteste por escrito tudo o que não reconhecer.",
          ],
        },
      ],
    },

    // ================================================ FURTO E ROUBO ===
    {
      chave: "furto_roubo",
      label: "Furto ou roubo",
      itens: [
        "Se lembrar de outros bens levados, leve a relação à delegacia para complementar o registro. Objeto sem marca, modelo e número de série é praticamente irrecuperável, mesmo quando encontrado.",
        {
          texto: "Procure câmeras na vizinhança e peça ao responsável que preserve as imagens. A maioria dos sistemas apaga sozinho em poucos dias, e depois disso não há como recuperar.",
          prazo: "poucos dias",
        },
        "Procure em casa as notas fiscais, as fotos dos bens e as embalagens com número de série, e leve à delegacia. É o que identifica o objeto na investigação e o que o seguro pede.",
        "Se você localizar o bem à venda em algum site ou rede social, não vá ao encontro do anunciante: leve o anúncio à delegacia.",
      ],
      subtipos: [
        {
          chave: "celular",
          label: "Celular",
          itens: [
            {
              texto: "Peça à operadora o bloqueio do IMEI, além do bloqueio do chip.",
              prazo: "hoje",
            },
            "Apague os dados remotamente por \"Encontre meu dispositivo\" ou \"Buscar\", e troque as senhas a partir de outro aparelho.",
            "Registre no Celular Seguro (gov.br/celularseguro, com a conta gov.br) e avise o banco.",
            "Se o aparelho foi levado desbloqueado, trate como se as contas tivessem sido abertas: confira extratos e limites de crédito nos próximos dias.",
          ],
        },
        {
          chave: "veiculo",
          label: "Veículo",
          itens: [
            "Comunique a seguradora imediatamente; a maioria das apólices tem prazo curto para o aviso de sinistro.",
            "Com o registro, o veículo entra em alerta nos sistemas policiais em todo o país.",
            "Se houver rastreador, acione a central e informe à delegacia os dados que ela fornecer.",
          ],
        },
        {
          chave: "residencia",
          label: "Residência ou estabelecimento",
          itens: [
            "Enquanto a perícia não for feita, não limpe nem reorganize o local: marca de arrombamento e objeto revirado são vestígio, e um pano passado apaga os dois.",
            "Fotografe os danos e o local antes de qualquer reparo.",
            "Confira se documentos, cartões e talões também sumiram — costumam ser levados junto e usados depois.",
          ],
        },
        {
          chave: "documentos",
          label: "Documentos e cartões",
          itens: [
            "Bloqueie os cartões e avise o banco, se ainda não fez. É a providência que não pode esperar o resto.",
            "Peça as segundas vias nos órgãos emissores, apresentando este boletim.",
            "Cadastre alerta de CPF nos birôs de crédito: documento levado costuma reaparecer em tentativa de crédito.",
          ],
        },
      ],
    },

    // ==================================== AMEAÇA E PERSEGUIÇÃO ===
    {
      chave: "ameaca",
      label: "Ameaça ou perseguição",
      itens: [
        "Guarde as mensagens exportando a conversa inteira, com data e hora. Captura de tela isolada vale menos como prova.",
        "Evite responder e evite contato. Responder alimenta a conduta e costuma piorar a situação.",
        "Avise pessoas de confiança, o trabalho e, havendo filhos, a escola, sobre quem é a pessoa e sobre o risco.",
        "Em situação de risco imediato, ligue 190. Não espere o horário da delegacia.",
        {
          texto: "Ameaça e perseguição dependem da sua representação para o processo seguir. O prazo é de seis meses.",
          prazo: "6 meses",
        },
      ],
      extras: [
        {
          chave: "vinculo_domestico",
          label: "O autor é cônjuge, companheiro, ex ou familiar",
          itens: [
            "Sendo violência doméstica contra a mulher, você tem direito a medidas protetivas de urgência — afastamento do lar, proibição de aproximação e de contato —, pedidas na delegacia sem advogado e sem custo. Se não pediu no registro, pode voltar e pedir a qualquer tempo.",
            "Descumprir medida protetiva é crime, com prisão em flagrante. Se acontecer, ligue 190 na hora e registre.",
            "Central de Atendimento à Mulher: 180, 24 horas, gratuito e sigiloso.",
          ],
        },
        {
          chave: "internet",
          label: "A ameaça veio pela internet ou por rede social",
          itens: [
            "Preserve o endereço da página ou do perfil (a URL completa), além do conteúdo. Sem ela, a plataforma não localiza o registro.",
            "Denuncie o perfil na própria plataforma, mas só depois de guardar as provas — a denúncia pode derrubar o conteúdo antes de você copiá-lo.",
            "Para conteúdo que possa sumir, a ata notarial feita em cartório é a forma de prova mais difícil de contestar.",
          ],
        },
      ],
    },

    // ============================================ VIOLÊNCIA DOMÉSTICA ===
    {
      chave: "violencia_domestica",
      label: "Violência doméstica",
      itens: [
        "Você tem direito a medidas protetivas de urgência, pedidas na delegacia sem advogado e sem custo. Se não pediu no registro, pode voltar e pedir a qualquer tempo — o juiz deve decidir em até 48 horas.",
        "Não é preciso ter marca no corpo. Violência psicológica, moral, patrimonial e sexual também são previstas na Lei Maria da Penha.",
        "Havendo lesão, faça o exame de corpo de delito no IML o quanto antes: as marcas desaparecem em poucos dias e com elas a prova.",
        {
          texto: "Fotografe as lesões hoje e nos dias seguintes, com data e de vários ângulos, e guarde atestados, receitas e prontuários.",
          prazo: "hoje",
        },
        "Descumprimento de medida protetiva é crime e admite prisão em flagrante. Ligue 190 no momento em que acontecer.",
        "Central de Atendimento à Mulher: 180. Emergência: 190. A Defensoria Pública atende gratuitamente na parte cível (divórcio, guarda, alimentos).",
        "Monte um plano de saída: documentos, cópia das chaves, algum dinheiro e um endereço de confiança guardados fora de casa.",
      ],
    },

    // ============================================ LESÃO CORPORAL ===
    {
      chave: "lesao",
      label: "Lesão corporal / agressão",
      itens: [
        {
          texto: "Leve ao IML a requisição de exame de corpo de delito entregue com este registro, e faça o exame assim que possível. É a prova central, e as lesões somem em dias.",
          prazo: "primeiras 72 h",
        },
        "Fotografe as lesões com data, de mais de um ângulo, todos os dias enquanto durarem.",
        "Guarde atestados, receitas, prontuários e comprovantes de despesas médicas.",
        "Se souber quem presenciou, leve nome e contato à delegacia. Testemunha procurada semanas depois raramente é localizada.",
        {
          texto: "Lesão leve depende de representação sua, no prazo de seis meses. Em contexto de violência doméstica contra a mulher, o processo corre independentemente disso.",
          prazo: "6 meses",
        },
      ],
    },

    // ================================================= HONRA ===
    {
      chave: "honra",
      label: "Calúnia, difamação ou injúria",
      itens: [
        {
          texto: "Calúnia, difamação e injúria são de ação penal privada: o processo depende de queixa-crime, apresentada por advogado ou pela Defensoria Pública, no prazo de seis meses. Este registro sozinho não instaura o processo.",
          prazo: "6 meses",
        },
        "Preserve a publicação com o endereço completo (URL), data e hora, além do conteúdo.",
        "Para conteúdo publicado na internet, a ata notarial em cartório é a prova mais sólida, porque registra o que estava no ar naquele momento.",
        "Peça a remoção diretamente à plataforma — mas só depois de guardar a prova.",
        "Se a ofensa foi de conteúdo racial, de cor, etnia, religião ou origem, o caso é outro: injúria racial é crime de ação pública, não prescreve e não depende de queixa.",
      ],
    },

    // ==================================================== DANO ===
    {
      chave: "dano",
      label: "Dano ao patrimônio",
      itens: [
        "Fotografe o dano antes de consertar, de longe e de perto.",
        "Junte dois orçamentos de reparo: é o que dimensiona o prejuízo para efeito de ressarcimento.",
        {
          texto: "No dano simples a ação é privada: depende de queixa-crime em seis meses, por advogado ou pela Defensoria.",
          prazo: "6 meses",
        },
        "O ressarcimento do prejuízo se busca no juizado cível, e não depende do resultado da apuração criminal.",
      ],
    },

    // ======================================= ACIDENTE DE TRÂNSITO ===
    {
      chave: "transito",
      label: "Acidente de trânsito",
      itens: [
        "Leve à delegacia o que você anotou no local e não entrou neste registro: placa, modelo e seguradora do outro veículo, e o nome de quem presenciou.",
        "As fotos feitas no local — posição dos veículos, danos, sinalização da via — valem mais que a descrição escrita. Guarde-as e leve-as, ainda que estejam só no celular.",
        "Comunique a seguradora dentro do prazo da apólice, que costuma ser curto.",
        "Havendo pessoa ferida, o caso deixa de ser apenas administrativo: lesão corporal na direção é crime, e o ferido deve fazer exame de corpo de delito.",
        "Se o outro condutor fugiu, qualquer detalhe lembrado depois ainda serve — placa parcial, cor, adesivo, direção da fuga. Comunique: a ocorrência pode ser complementada.",
      ],
    },
  ],
};
