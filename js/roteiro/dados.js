/**
 * ROTEIRO-DADOS.JS
 * ---------------------------------------------------------------------------
 * As perguntas suplementares de cada fato. A página
 * (js/roteiro/roteiro.js) só escolhe e desenha — todo o conteúdo está
 * aqui, e é aqui que se edita.
 *
 * O QUE ESTA LISTA É, E O QUE ELA NÃO É
 *
 * Não é roteiro de entrevista, e não ensina a atender: quem usa já sabe
 * fazer isso, e uma lista que começasse por "pergunte o nome da vítima"
 * seria fechada no primeiro dia. O que entra aqui é o contrário — a
 * pergunta que NÃO é óbvia e que, esquecida, custa caro depois:
 *
 *   - a que muda a tipificação  ("a arma foi vista ou só mencionada?");
 *   - a que dispara uma providência hoje ("ele tem acesso a arma de
 *     fogo?", numa violência doméstica);
 *   - a que salva uma diligência que amanhã já não dá para fazer
 *     ("há câmera na via? quem guarda a imagem?").
 *
 * Se a resposta não muda nada — não muda o tipo, não muda o que se faz
 * hoje, não muda o que se pede a quem —, a pergunta não pertence a esta
 * lista. O valor dela está em ser curta o bastante para se ler inteira
 * de pé, no balcão, com alguém esperando do outro lado.
 *
 * FORMATO
 *
 *   comuns: { titulo, perguntas }     // entram em todo fato
 *   fatos: [
 *     {
 *       chave: "furto_roubo",
 *       label: "Furto e roubo",
 *       nota: "…",                    // um lembrete, opcional
 *       orientacoes: "furto_roubo",   // folha do comunicante, opcional
 *       busca: "…",                   // sinônimos, hoje só documentam
 *       grupos: [
 *         { titulo: "O objeto", perguntas: [ … ] },
 *       ],
 *     },
 *   ]
 *
 * Cada pergunta é uma string OU { texto, nota }. A `nota` é o POR QUÊ —
 * o que a resposta muda. Ela é a metade que faz a lista valer: sem ela,
 * "houve estrangulamento?" é mais uma pergunta; com ela, é a pergunta
 * que aponta risco de feminicídio. Escreva a nota curta, e só quando
 * houver de fato uma consequência a nomear.
 *
 * A `nota` do FATO (a de cima, fora dos grupos) é para o que não é
 * pergunta e ainda assim precisa estar na tela — "não existe prazo de 24
 * horas para registrar um desaparecimento" é o exemplo que motivou o
 * campo.
 *
 * Os `grupos` existem porque a lista da violência doméstica tem quinze
 * perguntas, e quinze itens corridos não se leem em pé. Fato curto pode
 * ter um grupo só.
 *
 * COMO ESCREVER
 *
 * Endereçado ao POLICIAL, não ao comunicante — é o inverso de
 * js/orientacoes/dados.js, que é o papel que a pessoa leva embora. Aqui
 * se escreve "pergunte se…", ou a própria pergunta na forma direta; lá
 * se escreve "procure o banco…". As duas páginas são o mesmo
 * atendimento, vistas dos dois lados do balcão.
 *
 * `orientacoes` é a chave de um tipo de window.ORIENTACOES: quando
 * existe, a tela oferece o link para a folha daquele fato. É opcional —
 * há fato com roteiro e sem folha (desaparecimento) e folha sem roteiro.
 * A página confere na carga que a chave apontada existe.
 *
 * ATENÇÃO A QUEM EDITA: isto é apoio de memória, não protocolo. Não
 * substitui procedimento operacional padrão, nem ordem de serviço, nem
 * o que a autoridade determinar no caso concreto.
 * ---------------------------------------------------------------------------
 */

window.ROTEIRO = {
  comuns: {
    titulo: "Em qualquer atendimento",
    perguntas: [
      {
        texto: "Há imagem do fato? Câmera da via, do comércio vizinho, de campainha, de veículo, do próprio celular de alguém.",
        nota: "Gravação de sistema particular costuma ser sobrescrita em dias. Quanto antes se pede, mais chance de ainda existir.",
      },
      {
        texto: "Mais alguém presenciou? Nome e telefone de contato de cada um.",
        nota: "Testemunha sem telefone é testemunha que não se localiza depois.",
      },
      {
        texto: "A vítima é menor de 18, maior de 60 ou tem alguma deficiência?",
        nota: "Muda tipificação, competência e, no estelionato, a própria ação penal.",
      },
      {
        texto: "A pessoa já traz hoje algum documento, laudo, nota fiscal ou print?",
        nota: "O que não é juntado no atendimento costuma nunca ser juntado.",
      },
      {
        texto: "O telefone e o endereço do cadastro estão certos e atuais?",
        nota: "É por onde a intimação do inquérito vai sair.",
      },
    ],
  },

  fatos: [
    // ======================================= VIOLÊNCIA DOMÉSTICA ===
    {
      chave: "violencia_domestica",
      label: "Violência doméstica e familiar",
      orientacoes: "violencia_domestica",
      busca: "maria da penha companheiro marido esposa agressão em casa",
      grupos: [
        {
          titulo: "Risco imediato",
          perguntas: [
            {
              texto: "O agressor tem acesso a arma de fogo? Registro próprio, CAC, atividade que exija arma, ou arma de outra pessoa da casa.",
              nota: "Entra na medida protetiva e pode gerar a comunicação para suspensão do porte e apreensão.",
            },
            {
              texto: "Já houve ameaça de morte, uso de arma, ou tentativa de enforcamento/estrangulamento?",
              nota: "Estrangulamento e ameaça com arma estão entre os marcadores mais fortes de risco de feminicídio.",
            },
            {
              texto: "Ele já descumpriu medida protetiva antes, aqui ou em outra comarca?",
            },
            {
              texto: "Há uso de álcool ou drogas, ciúme constante, controle de celular, de dinheiro ou de com quem ela fala?",
            },
            {
              texto: "A própria vítima acredita que ele é capaz de matá-la?",
              nota: "A avaliação dela sobre o próprio risco é o item de maior peso no formulário nacional de risco.",
            },
          ],
        },
        {
          titulo: "Onde ela vai dormir hoje",
          perguntas: [
            {
              texto: "Ele mora na mesma casa? Há para onde ir hoje, e ela quer ir?",
            },
            {
              texto: "Há crianças ou adolescentes na casa, e eles presenciaram?",
              nota: "Quem presencia também é vítima, e a resposta abre o encaminhamento ao Conselho Tutelar.",
            },
            {
              texto: "Há animal de estimação em casa?",
              nota: "Ameaçar ou machucar o animal é forma comum de coagir, e a proteção dele pode entrar no pedido.",
            },
            {
              texto: "Ela depende financeiramente dele? Está com documentos, cartões e celular em mãos?",
            },
          ],
        },
        {
          titulo: "Para o pedido de medida protetiva",
          perguntas: [
            {
              texto: "Endereço onde ele mora, onde trabalha e horários em que costuma estar em cada lugar.",
              nota: "Sem isso a medida sai sem onde ser cumprida.",
            },
            {
              texto: "Ela precisa voltar em casa para buscar pertences?",
              nota: "O acompanhamento policial para a retirada de pertences é uma das medidas que se pode pedir.",
            },
            {
              texto: "Quais medidas ela quer: afastamento do lar, proibição de aproximação e de contato, restrição de visitas aos filhos, alimentos provisórios?",
            },
          ],
        },
      ],
    },

    // ================================================ ESTELIONATO ===
    {
      chave: "estelionato",
      label: "Estelionato e golpes",
      orientacoes: "estelionato",
      busca: "golpe pix fraude falso advogado parente venda internet",
      grupos: [
        {
          titulo: "Por onde o dinheiro saiu",
          perguntas: [
            {
              texto: "Comprovante de cada transferência: valor, data e hora, chave usada, nome e CPF/CNPJ de quem recebeu, instituição.",
              nota: "É o que permite pedir o bloqueio. Sem os dados do recebedor não há a quem pedir.",
            },
            {
              texto: "Ela já avisou o banco? Em que dia e hora?",
              nota: "O Mecanismo Especial de Devolução do Pix tem prazo contado a partir do aviso.",
            },
            {
              texto: "A conta de destino é de pessoa física ou de empresa, e o nome bate com o de quem se apresentou?",
            },
          ],
        },
        {
          titulo: "Por onde veio o contato",
          perguntas: [
            {
              texto: "Guardou as conversas? Número, perfil, link do anúncio, e-mail, nome usado.",
              nota: "Print sem o número à vista e sem data serve para pouco. Peça a conversa, não só a foto da tela.",
            },
            {
              texto: "Quem procurou quem, e por onde: anúncio, ligação recebida, mensagem em grupo, site de busca?",
              nota: "Separa a fraude eletrônica (art. 171, § 2º-A) do estelionato comum e indica onde pedir os registros.",
            },
            {
              texto: "Ela chegou a instalar aplicativo, clicar em link ou compartilhar a tela?",
              nota: "Se sim, o aparelho e a conta podem continuar acessíveis agora — muda o que se orienta hoje.",
            },
          ],
        },
        {
          titulo: "Se usaram o nome dela",
          perguntas: [
            {
              texto: "Abriram conta, empréstimo, consórcio ou compra em nome dela? Já consultou o Registrato do Banco Central?",
              nota: "É comum a vítima só descobrir o segundo prejuízo semanas depois.",
            },
          ],
        },
      ],
    },

    // ============================================= FURTO E ROUBO ===
    {
      chave: "furto_roubo",
      label: "Furto e roubo",
      orientacoes: "furto_roubo",
      busca: "levaram subtração assalto arrombamento celular veículo",
      grupos: [
        {
          titulo: "O que foi levado",
          perguntas: [
            {
              texto: "IMEI do celular, chassi e placa do veículo, número de série do que for numerado.",
              nota: "É o que permite bloqueio e localização. O conferidor da suíte confere o número antes de ele entrar no boletim.",
            },
            {
              texto: "Há nota fiscal, caixa do aparelho, foto do bem ou anúncio antigo de venda?",
            },
            {
              texto: "Havia documento, cartão ou chave junto? O cartão já foi usado depois, e onde?",
              nota: "Compra feita depois do fato dá horário, local e imagem de câmera do estabelecimento.",
            },
          ],
        },
        {
          titulo: "Como aconteceu",
          perguntas: [
            {
              texto: "Houve arma? Qual, e ela foi vista, encostada, ou apenas mencionada?",
              nota: "Separa roubo de furto e, sendo arma de fogo, muda a pena.",
            },
            {
              texto: "Houve arrombamento, chave falsa, escalada, ou mais de uma pessoa agindo junto?",
              nota: "São as qualificadoras do art. 155, § 4º.",
            },
            {
              texto: "O fato foi durante o repouso noturno?",
              nota: "Aumento de um terço no furto (§ 1º).",
            },
            {
              texto: "A vítima chegou a ser presa, amarrada ou levada por algum tempo?",
              nota: "Pode configurar a restrição de liberdade do art. 157, § 2º, V.",
            },
          ],
        },
      ],
    },

    // ================================== AMEAÇA E PERSEGUIÇÃO ===
    {
      chave: "ameaca",
      label: "Ameaça e perseguição",
      orientacoes: "ameaca",
      busca: "ameaçou intimidou stalking perseguindo mensagem",
      grupos: [
        {
          titulo: "O que foi dito, e como",
          perguntas: [
            {
              texto: "O que exatamente foi dito ou escrito? Registre nas palavras da vítima, não em resumo.",
              nota: "O teor é o que separa mal injusto e grave de bravata.",
            },
            {
              texto: "Por qual meio, e há registro guardado: áudio, mensagem, e-mail, testemunha?",
            },
            {
              texto: "Foi uma vez só, ou vem se repetindo?",
              nota: "Conduta reiterada pode ser perseguição (art. 147-A), com pena maior, e não ameaça.",
            },
          ],
        },
        {
          titulo: "Quem é o autor",
          perguntas: [
            {
              texto: "Qual o vínculo entre os dois?",
              nota: "Vínculo doméstico, familiar ou afetivo muda a lei aplicável e afasta o JECRIM.",
            },
            {
              texto: "Ele tem acesso a arma de fogo?",
            },
            {
              texto: "Há registro anterior entre as mesmas pessoas, aqui ou em outra delegacia?",
              nota: "Duas ameaças isoladas em anos diferentes contam uma história; duas em uma semana contam outra.",
            },
          ],
        },
      ],
    },

    // =========================================== LESÃO CORPORAL ===
    {
      chave: "lesao",
      label: "Lesão corporal e agressão",
      orientacoes: "lesao",
      busca: "agressão bateu machucou briga socou",
      grupos: [
        {
          titulo: "A lesão",
          perguntas: [
            {
              texto: "Onde foi atingida, com o quê, e quantas vezes?",
            },
            {
              texto: "Procurou atendimento médico? Onde, em que dia, e há atestado ou prontuário?",
              nota: "O exame de corpo de delito é o que sustenta a lesão. Sem ele, sobra a palavra de cada um.",
            },
            {
              texto: "Há foto da lesão feita hoje?",
              nota: "Marca some em dias, e o exame nem sempre acontece a tempo.",
            },
            {
              texto: "Ficou algum efeito que ainda dure: ponto, imobilização, afastamento do trabalho, dente perdido?",
              nota: "Incapacidade por mais de trinta dias leva à lesão grave, com outra pena e outro rito.",
            },
          ],
        },
        {
          titulo: "O contexto",
          perguntas: [
            {
              texto: "Qual o vínculo com o autor, e onde os dois estavam?",
              nota: "Define se é o § 9º (violência doméstica) em vez do caput.",
            },
            {
              texto: "Foi agressão de um lado só, ou os dois se agrediram?",
              nota: "Muda quem é vítima e quem é autor, e pode ser rixa ou vias de fato.",
            },
            {
              texto: "A vítima quer representar?",
              nota: "Lesão leve é condicionada à representação — salvo na violência doméstica contra a mulher.",
            },
          ],
        },
      ],
    },

    // ======================================== ACIDENTE DE TRÂNSITO ===
    {
      chave: "transito",
      label: "Acidente de trânsito",
      orientacoes: "transito",
      busca: "colisão batida acidente carro moto atropelamento",
      grupos: [
        {
          titulo: "Os condutores",
          perguntas: [
            {
              texto: "Todos estavam habilitados, e na categoria compatível com o veículo?",
            },
            {
              texto: "Houve sinal de álcool ou droga? Foi feito teste do etilômetro, e qual o resultado?",
              nota: "Sem prova do estado — teste, exame ou os sinais descritos por quem viu — a embriaguez ao volante não se sustenta.",
            },
            {
              texto: "Alguém se feriu, mesmo levemente, ou foi levado ao hospital?",
              nota: "Havendo lesão, sai do acidente sem vítima e vai para os arts. 302/303 do CTB.",
            },
            {
              texto: "Algum condutor deixou o local sem se identificar, ou deixou de prestar socorro?",
              nota: "Arts. 304 e 305 do CTB, com apuração própria.",
            },
          ],
        },
        {
          titulo: "O local",
          perguntas: [
            {
              texto: "Os veículos foram removidos antes de alguém chegar? Há foto de como estavam?",
            },
            {
              texto: "Há câmera na via, em comércio próximo ou em algum dos veículos?",
            },
            {
              texto: "Como estavam sinalização, iluminação e pista no momento?",
            },
          ],
        },
      ],
    },

    // ============================================ DESAPARECIMENTO ===
    {
      chave: "desaparecimento",
      label: "Desaparecimento de pessoa",
      nota: "Não existe prazo de 24 horas: o registro e a busca começam no momento em que a comunicação é feita.",
      busca: "sumiu não voltou desaparecida procurada",
      grupos: [
        {
          titulo: "Para a busca de hoje",
          perguntas: [
            {
              texto: "Foto recente, roupa que vestia, altura, e sinais que identifiquem: tatuagem, cicatriz, prótese, falha dentária.",
              nota: "A foto antiga é a que mais atrasa busca.",
            },
            {
              texto: "Faz uso de medicação contínua, ou tem condição de saúde física ou mental que exija cuidado hoje?",
              nota: "Define a urgência e entra na difusão.",
            },
            {
              texto: "Levou celular, documento, dinheiro ou cartão? O celular continua ligado ou dando sinal?",
            },
            {
              texto: "Onde e a que horas foi vista pela última vez, e por quem?",
            },
          ],
        },
        {
          titulo: "O contexto",
          perguntas: [
            {
              texto: "Já desapareceu antes? Voltou por conta própria, e em quanto tempo?",
            },
            {
              texto: "Houve discussão, ameaça, dívida, relação abusiva ou mudança recente de comportamento?",
            },
            {
              texto: "Tem redes sociais? Alguém acessou, ou houve movimentação, depois do desaparecimento?",
              nota: "Movimentação depois da hora do sumiço muda inteiramente a linha de busca.",
            },
            {
              texto: "Quem já foi procurado: hospitais, parentes, trabalho, amigos?",
              nota: "Evita repetir a diligência que a família já fez, e mostra o que falta.",
            },
          ],
        },
      ],
    },
  ],
};
