/**
 * CONTATOS-DADOS.JS
 * ---------------------------------------------------------------------------
 * A agenda da unidade. A página (js/contatos/contatos.js) só filtra e
 * desenha — todo o conteúdo está aqui, e é só aqui que se edita.
 *
 * Isto substitui o papel colado na parede, que ninguém atualiza e que
 * some quando repintam a sala. Por isso todo campo é opcional menos dois:
 * é melhor uma entrada com o telefone e mais nada do que uma entrada que
 * ninguém cria por faltar o e-mail.
 *
 * FORMATO
 *
 *   categorias: [ { chave, label } ]     // a ordem aqui é a da tela
 *   itens: [
 *     {
 *       nome: "IML — Instituto Médico Legal",   // obrigatório
 *       categoria: "saude",                     // obrigatório, uma das acima
 *       descricao: "Exame de corpo de delito.", // uma linha, opcional
 *       horario: "24 horas",                    // opcional
 *       telefones: ["(00) 0000-0000"],          // opcional, ver abaixo
 *       whatsapp: ["(00) 00000-0000"],          // opcional, ver abaixo
 *       emails: ["nome@dominio"],               // opcional, ver abaixo
 *       endereco: "Rua …, nº …",                // opcional
 *       site: "exemplo.gov.br",                 // opcional
 *       obs: "Só com requisição.",              // ressalva curta, opcional
 *       busca: "legista necropsia",             // sinônimos extras, opcional
 *     },
 *   ]
 *
 * PARA QUE SERVE CADA NÚMERO
 *
 * Órgão com um telefone só não precisa de explicação. Órgão com três
 * precisa, e muito: o 190 e o número do quartel atendem coisas
 * diferentes, e ligar no errado às 3h da manhã custa um tempo que
 * ninguém tem. Por isso todo campo de contato — `telefones`, `whatsapp`,
 * `emails`, `endereco` e `site` — aceita duas formas:
 *
 *     telefones: ["(51) 3597-0396"],                  // texto solto
 *
 *     telefones: [                                    // com explicação
 *       { valor: "190", nota: "Padrão de emergências" },
 *       { valor: "(51) 3597-0396", nota: "Alternativo para emergências" },
 *       { valor: "(51) 1234-5678", nota: "Interno, não emergencial" },
 *     ],
 *
 * As duas convivem no mesmo arquivo, e até na mesma lista. Use a segunda
 * só quando houver o que distinguir: um número sozinho com a nota
 * "telefone principal" é ruído.
 *
 * A `nota` sai em cinza ao lado do número, entra na busca (quem digita
 * "alternativo" acha) e NÃO é copiada junto — o botão copia só o número,
 * que é o que vai ser digitado no aparelho ao lado.
 *
 * Escreva-a dizendo QUANDO usar aquele número, e não o que o órgão faz:
 * isso já é a `descricao` do contato.
 *
 * COMO PREENCHER
 *
 *   - Telefone e WhatsApp: escreva como se lê, com DDD e a pontuação de
 *     sempre — "(51) 99999-0000". A página tira o que não é dígito
 *     sozinha para montar o link do WhatsApp, e o DDI sai de
 *     window.Config.CONTATOS.DDI. Número sem DDD não vira link de
 *     WhatsApp (não dá para adivinhar a região), mas continua na tela e
 *     continua copiável — é o caso dos 190, 193 e afins.
 *   - `horario` é o que evita a ligação às 3h para quem atende das 9h às
 *     17h. Escreva "24 horas", "seg a sex, 9h–17h", "plantão fim de
 *     semana".
 *   - `obs` é a ressalva que muda o que se faz: "só com requisição",
 *     "não atende ligação, só WhatsApp", "para criança, use o Conselho".
 *   - `busca` existe pelo mesmo motivo da tipificação: quem procura
 *     digita "legista", não "Instituto Médico Legal".
 *
 * ATENÇÃO A QUEM EDITA: os números abaixo com zeros — (00) 0000-0000 —
 * são espaço reservado, e não contato de ninguém. Troque-os pelos reais
 * antes de a página ir para o balcão. Os de três dígitos (190, 192, 193,
 * 180, 181, 100) são nacionais e já estão certos.
 *
 * E confira de tempos em tempos: agenda desatualizada custa mais caro que
 * agenda inexistente, porque quem liga acredita nela.
 * ---------------------------------------------------------------------------
 */

window.CONTATOS = {
  categorias: [
    { chave: "emergencia", label: "Emergência e denúncia" },
    { chave: "policia", label: "Polícia e unidades" },
    { chave: "saude", label: "Saúde e perícia" },
    { chave: "protecao", label: "Proteção e assistência" },
    { chave: "justica", label: "Justiça e defesa" },
    { chave: "transito", label: "Trânsito e veículos" },
    { chave: "servicos", label: "Outros serviços" },
  ],

  itens: [
    // ------------------------------------------------ EMERGÊNCIA ---
    // Os de três dígitos são nacionais e não mudam. Os locais, troque.
    {
      nome: "Brigada Militar",
      categoria: "emergencia",
      horario: "24 horas",
      telefones: [
        { valor: "190", nota: "Padrão de emergências" },
        { valor: "(51) 3597-0396", nota: "Alternativo para emergências" },
        { valor: "(51) 1234-5678", nota: "Interno, não emergencial" },
      ],
      busca: "policia militar brigada viatura socorro emergência",
    },
    {
      nome: "SAMU",
      categoria: "emergencia",
      descricao: "Emergência médica e remoção.",
      horario: "24 horas",
      telefones: ["192"],
      busca: "ambulância socorro médico",
    },
    {
      nome: "Corpo de Bombeiros",
      categoria: "emergencia",
      descricao: "Incêndio, resgate, salvamento e afogamento.",
      horario: "24 horas",
      telefones: [
        { valor: "193", nota: "Padrão de emergências" },
        { valor: "(00) 0000-0000", nota: "Quartel local, não emergencial" },
      ],
      busca: "incêndio resgate salvamento",
    },
    {
      nome: "Central de Atendimento à Mulher",
      categoria: "emergencia",
      descricao: "Orientação e denúncia de violência contra a mulher.",
      horario: "24 horas",
      telefones: ["180"],
      busca: "ligue 180 mulher violência doméstica denúncia",
    },
    {
      nome: "Disque Direitos Humanos",
      categoria: "emergencia",
      descricao: "Denúncia de violação contra criança, idoso e pessoa com deficiência.",
      horario: "24 horas",
      telefones: ["100"],
      busca: "disque 100 criança idoso deficiente denúncia",
    },
    {
      nome: "Disque Denúncia",
      categoria: "emergencia",
      descricao: "Denúncia anônima.",
      telefones: ["181"],
      busca: "denúncia anônima",
    },

    // -------------------------------------- POLÍCIA E UNIDADES ---
    {
      nome: "Esta unidade",
      categoria: "policia",
      descricao: "Cartório, plantão e telefone do balcão.",
      horario: "PREENCHER",
      telefones: [
        { valor: "(00) 0000-0000", nota: "Cartório, em horário de expediente" },
        { valor: "(00) 0000-0000", nota: "Plantão, fora do expediente" },
      ],
      emails: ["preencher@exemplo"],
      endereco: "PREENCHER",
      obs: "Espaço reservado: troque pelos dados reais em js/contatos/dados.js.",
      busca: "delegacia cartório plantão",
    },
    {
      nome: "Delegacia da Mulher",
      categoria: "policia",
      descricao: "Atendimento especializado em violência doméstica e familiar.",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      whatsapp: ["(00) 00000-0000"],
      endereco: "PREENCHER",
      busca: "ddm deam maria da penha mulher",
    },
    {
      nome: "Plantão regional",
      categoria: "policia",
      descricao: "Para onde vai o flagrante fora do horário da unidade.",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      endereco: "PREENCHER",
      busca: "plantão flagrante madrugada",
    },
    {
      nome: "Guarda Municipal",
      categoria: "policia",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      busca: "gm municipal",
    },
    {
      nome: "Polícia Rodoviária Federal",
      categoria: "policia",
      descricao: "Ocorrências em rodovia federal.",
      horario: "24 horas",
      telefones: ["191"],
      busca: "prf rodovia federal br",
    },

    // ---------------------------------------- SAÚDE E PERÍCIA ---
    {
      nome: "IML — Instituto Médico Legal",
      categoria: "saude",
      descricao: "Exame de corpo de delito, lesões e necropsia.",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      endereco: "PREENCHER",
      obs: "Confirme se o exame exige requisição e se há horário próprio para criança e adolescente.",
      busca: "legista corpo de delito necropsia perícia lesões",
    },
    {
      nome: "Perícia criminalística",
      categoria: "saude",
      descricao: "Local de crime, veículos e exames técnicos.",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      busca: "perito local de crime criminalística",
    },
    {
      nome: "Hospital de referência",
      categoria: "saude",
      descricao: "Pronto-socorro que atende a região.",
      horario: "24 horas",
      telefones: ["(00) 0000-0000"],
      endereco: "PREENCHER",
      busca: "pronto socorro emergência hospital",
    },
    {
      nome: "CAPS",
      categoria: "saude",
      descricao: "Saúde mental e dependência química.",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      endereco: "PREENCHER",
      busca: "saúde mental surto psiquiátrico dependência álcool droga",
    },

    // --------------------------- PROTEÇÃO E ASSISTÊNCIA ---
    {
      nome: "Conselho Tutelar",
      categoria: "protecao",
      descricao: "Criança e adolescente em situação de risco.",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      whatsapp: ["(00) 00000-0000"],
      endereco: "PREENCHER",
      obs: "Anote o número do plantão, que costuma ser diferente do número do horário comercial.",
      busca: "criança adolescente menor eca plantão",
    },
    {
      nome: "CREAS",
      categoria: "protecao",
      descricao: "Acompanhamento de vítima de violência e violação de direitos.",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      endereco: "PREENCHER",
      busca: "assistência social vítima acompanhamento psicossocial",
    },
    {
      nome: "CRAS",
      categoria: "protecao",
      descricao: "Assistência social do território, benefícios e encaminhamentos.",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      endereco: "PREENCHER",
      busca: "assistência social benefício cadastro único",
    },
    {
      nome: "Casa de acolhimento / abrigo",
      categoria: "protecao",
      descricao: "Para quem não tem onde dormir hoje.",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      obs: "Confirme se aceita entrada à noite e se recebe com filhos e com animal.",
      busca: "abrigo acolhimento mulher casa passagem",
    },

    // ----------------------------------- JUSTIÇA E DEFESA ---
    {
      nome: "Defensoria Pública",
      categoria: "justica",
      descricao: "Assistência jurídica gratuita a quem não pode pagar advogado.",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      emails: ["preencher@exemplo"],
      endereco: "PREENCHER",
      site: "preencher.def.br",
      busca: "defensor advogado gratuito assistência jurídica",
    },
    {
      nome: "Ministério Público",
      categoria: "justica",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      emails: ["preencher@exemplo"],
      endereco: "PREENCHER",
      busca: "promotoria promotor mp",
    },
    {
      nome: "Fórum / plantão judiciário",
      categoria: "justica",
      descricao: "Medida protetiva de urgência fora do expediente.",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      endereco: "PREENCHER",
      obs: "Anote como o pedido é enviado no plantão — costuma ser por sistema ou por e-mail próprio.",
      busca: "juiz plantão medida protetiva urgência",
    },
    {
      nome: "OAB — subseção",
      categoria: "justica",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      busca: "advogado ordem prerrogativas",
    },

    // -------------------------------- TRÂNSITO E VEÍCULOS ---
    {
      nome: "Detran",
      categoria: "transito",
      descricao: "Registro de veículo, habilitação e restrições.",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      site: "preencher.gov.br",
      busca: "veículo cnh licenciamento multa",
    },
    {
      nome: "Pátio / guincho credenciado",
      categoria: "transito",
      descricao: "Remoção e depósito de veículo.",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      endereco: "PREENCHER",
      busca: "reboque remoção depósito apreendido",
    },
    {
      nome: "Concessionária da rodovia",
      categoria: "transito",
      descricao: "Socorro e sinalização em rodovia.",
      horario: "24 horas",
      telefones: ["(00) 0000-0000"],
      busca: "rodovia pedágio socorro estrada",
    },

    // ------------------------------------- OUTROS SERVIÇOS ---
    {
      nome: "SVO — Serviço de Verificação de Óbito",
      categoria: "servicos",
      descricao: "Morte natural sem assistência médica.",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      busca: "óbito morte natural atestado",
    },
    {
      nome: "Zoonoses / proteção animal",
      categoria: "servicos",
      descricao: "Maus-tratos a animais e recolhimento.",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      busca: "animal cachorro gato maus tratos canil",
    },
    {
      nome: "Concessionária de energia",
      categoria: "servicos",
      descricao: "Fio caído, poste danificado, furto de cabo.",
      horario: "24 horas",
      telefones: ["(00) 0000-0000"],
      busca: "luz energia poste fio cabo",
    },
    {
      nome: "Prefeitura — plantão",
      categoria: "servicos",
      descricao: "Via interditada, árvore caída, iluminação.",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      busca: "prefeitura município via pública",
    },
  ],
};
