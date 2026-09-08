/**
 * CONTATOS-DADOS.JS
 * ---------------------------------------------------------------------------
 * A agenda da unidade. A página (js/contatos/contatos.js) só filtra e
 * desenha — todo o conteúdo está aqui, e é só aqui que se edita.
 *
 * Isto substitui o papel colado na parede, que ninguém atualiza e que
 * some quando repintam a sala. E é uma COLA DE NÚMEROS, de uso interno:
 * quem lê já sabe o que é uma DPPA e para que serve o 193. Nada aqui
 * explica a função de órgão nenhum.
 *
 * Por isso todo campo é opcional menos dois: é melhor uma entrada com o
 * telefone e mais nada do que uma entrada que ninguém cria por faltar o
 * e-mail.
 *
 * FORMATO
 *
 *   categorias: [ { chave, label } ]     // a ordem aqui é a da tela
 *   itens: [
 *     {
 *       nome: "PML Novo Hamburgo",               // obrigatório
 *       categoria: "saude",                      // obrigatório, uma das acima
 *       descricao: "…",                          // raro, ver abaixo
 *       horario: "24 horas",                     // opcional
 *       telefones: ["(00) 0000-0000"],           // opcional, ver abaixo
 *       whatsapp: ["(00) 00000-0000"],           // opcional, ver abaixo
 *       emails: ["nome@dominio"],                // opcional, ver abaixo
 *       endereco: "Rua …, nº …",                 // opcional
 *       site: "exemplo.gov.br",                  // opcional
 *       obs: "Horários variam em festividade.",  // ressalva curta, opcional
 *       busca: "legista necropsia",              // sinônimos extras, opcional
 *     },
 *   ]
 *
 * PARA QUE SERVE CADA NÚMERO
 *
 * Órgão com um telefone só não precisa de explicação. Órgão com quatro
 * precisa, e muito: o 190 e o número administrativo atendem coisas
 * diferentes, e ligar no errado às 3h da manhã custa um tempo que
 * ninguém tem. Por isso todo campo de contato — `telefones`, `whatsapp`,
 * `emails`, `endereco` e `site` — aceita duas formas:
 *
 *     telefones: ["(51) 3597-0396"],              // texto solto
 *
 *     telefones: [                                // com a nota da linha
 *       { valor: "190", nota: "Emergência" },
 *       { valor: "(51) 3597-0396", nota: "Emergência, alternativo" },
 *       { valor: "(00) 0000-0000", nota: "Administrativo" },
 *     ],
 *
 * As duas convivem no mesmo arquivo, e até na mesma lista. Use a segunda
 * só quando houver o que distinguir: um número sozinho com a nota
 * "telefone principal" é ruído.
 *
 * O PADRÃO DA NOTA: uma ou duas palavras nomeando A LINHA — o setor
 * ("Cartório", "Investigação"), a unidade ("DEAM", "1ª Delegacia") ou o
 * tipo de atendimento ("Emergência", "Administrativo", "Plantão"). Não
 * repita o rótulo, que já está na tela ("WhatsApp do Plantão" numa linha
 * que começa com WhatsApp), nem o horário, que tem campo próprio.
 *
 * A nota sai em cinza ao lado do número, entra na busca (quem digita
 * "alternativo" acha) e NÃO é copiada junto — o botão copia só o número,
 * que é o que vai ser digitado no aparelho ao lado.
 *
 * COMO PREENCHER
 *
 *   - `descricao` é a exceção, não a regra. Ela existe para separar duas
 *     entradas que o nome sozinho não separa — CRAS e CREAS é o caso que
 *     sobrou. Escrever "SAMU: emergência médica" é gastar uma linha da
 *     tela com o que quem lê já sabe.
 *   - Telefone e WhatsApp: escreva como se lê, com DDD e a pontuação de
 *     sempre — "(51) 99999-0000". A página tira o que não é dígito
 *     sozinha para montar o link do WhatsApp, e o DDI sai de
 *     window.Config.CONTATOS.DDI. Número sem DDD não vira link de
 *     WhatsApp (não dá para adivinhar a região), mas continua na tela e
 *     continua copiável — é o caso dos 190, 193, dos ramais e afins.
 *   - `horario` é o que evita a ligação às 3h para quem atende das 9h às
 *     17h. Escreva "24 horas", "seg a sex, 9h–17h", "plantão fim de
 *     semana".
 *   - `obs` é a ressalva que muda o que se faz: "só com requisição",
 *     "não atende ligação, só WhatsApp", "horários variam em festividade".
 *   - `busca` existe pelo mesmo motivo da tipificação: quem procura
 *     digita "legista", não "Instituto Médico Legal". Escreva ali só o
 *     que é DESTA entrada — sinônimo copiado da entrada vizinha faz as
 *     duas aparecerem na mesma busca.
 *
 * ATENÇÃO A QUEM EDITA: os números com zeros — (00) 0000-0000 — são
 * espaço reservado, e não contato de ninguém. Troque-os pelos reais
 * antes de a página ir para o balcão. Os de três dígitos (190, 192, 193
 * e 153) são nacionais e já estão certos.
 *
 * E confira de tempos em tempos: agenda desatualizada custa mais caro que
 * agenda inexistente, porque quem liga acredita nela.
 * ---------------------------------------------------------------------------
 */

window.CONTATOS = {
  categorias: [
    { chave: "policia_civil", label: "Polícia Civil" },
    { chave: "emergencia", label: "Emergência" },
    { chave: "saude", label: "Saúde e perícia" },
    { chave: "protecao", label: "Proteção e assistência" },
    { chave: "justica", label: "Justiça e defesa" },
    { chave: "transito", label: "Trânsito e veículos" },
    { chave: "servicos", label: "Outros serviços" },
  ],

  itens: [
    // -------------------------------------------- POLÍCIA CIVIL ---
    // A casa: os ramais daqui dentro, esta unidade, e as outras a que se
    // recorre. É a categoria que mais cresce — divisão, delegacia
    // especializada, plantão de outra comarca. A ordem aqui é a da tela,
    // então o que mais se usa vem primeiro.
    {
      nome: "Ramais desta Delegacia",
      categoria: "policia_civil",
      telefones: [
        { valor: "6195", nota: "Nádia - Secretaria" },
        { valor: "6196", nota: "Estag. Mirela - Secretaria" },
        { valor: "6197", nota: "tbd" },
        { valor: "6198", nota: "tbd" },
        { valor: "6199", nota: "tbd" },
        { valor: "6200", nota: "tbd" },
        { valor: "6201", nota: "tbd" },
        { valor: "6202", nota: "tbd" },
        { valor: "6203", nota: "tbd" },
        { valor: "6204", nota: "Delegado - Gabinete" },
        { valor: "6205", nota: "Pozzobon - Investigação" },
        { valor: "6206", nota: "tbd" },
        { valor: "6207", nota: "tbd" },
        { valor: "6208", nota: "tbd" },
        { valor: "6209", nota: "Plantão" },
      ],
      busca: "ramal secretaria cartório plantão investigação si",
    },
    {
      nome: "Esta unidade",
      categoria: "policia_civil",
      horario: "08h30 às 12h00 e 13h30 às 18h00, dias de semana",
      telefones: [
        { valor: "(51) 3584-6514", nota: "Secretaria" },
      ],
      whatsapp: [
        { valor: "(51) 98585-5785", nota: "Plantão" },
        { valor: "(51) 98585-1234", nota: "Secretaria" },
        { valor: "(51) 98585-4567", nota: "Cartório" },
        { valor: "(51) 98585-6789", nota: "Investigação" },
        { valor: "(51) 98585-8901", nota: "Sala das Margaridas" },
      ],
      emails: ["campobom-dp@pc.rs.gov.br"],
      endereco: "Avenida Emilio Vetter, 422, Bairro Genuíno Sampaio, Campo Bom/RS",
      busca: "delegacia cartório plantão secretaria investigação margaridas",
    },
    {
      nome: "DPPA de Novo Hamburgo",
      categoria: "policia_civil",
      horario: "24 horas",
      telefones: ["(51) 3584-5848"],
      endereco: "Rua Júlio de Castilhos, 806, Bairro Centro, Novo Hamburgo/RS",
      busca: "dppa pronto atendimento plantão novo hamburgo flagrante",
    },
    {
      nome: "Demais Delegacias em Novo Hamburgo",
      categoria: "policia_civil",
      telefones: [
        { valor: "(51) 3584-5805", nota: "DEAM" },
        { valor: "(51) 3584-5800", nota: "1ª Delegacia" },
        { valor: "(51) 3584-5845", nota: "2ª Delegacia" },
        { valor: "(51) 3584-6539", nota: "3ª Delegacia" },
      ],
      busca: "deam mulher plantão 1dp 2dp 3dp novo hamburgo",
    },
    {
      nome: "DTIP — Departamento de Tecnologia de Informação Policial",
      categoria: "policia_civil",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      emails: ["dtip@pc.rs.gov.br"],
      busca: "dtip informática sistema senha acesso rede suporte tecnologia",
    },

    // ------------------------------------------------ EMERGÊNCIA ---
    // Os de três dígitos são nacionais e não mudam. Os locais, troque.
    {
      nome: "Brigada Militar",
      categoria: "emergencia",
      horario: "24 horas",
      telefones: [
        { valor: "190", nota: "Emergência" },
        { valor: "(51) 3597-0396", nota: "Emergência, alternativo" },
        { valor: "(00) 0000-0000", nota: "Administrativo" },
      ],
      busca: "policia militar brigada viatura socorro emergência",
    },
    {
      nome: "Guarda Municipal",
      categoria: "emergencia",
      horario: "PREENCHER",
      telefones: [
        { valor: "153", nota: "Emergência" },
        { valor: "(00) 0000-0000", nota: "Administrativo" },
      ],
      busca: "gm municipal",
    },
    {
      nome: "SAMU",
      categoria: "emergencia",
      horario: "24 horas",
      telefones: ["192"],
      busca: "ambulância socorro médico",
    },
    {
      nome: "Corpo de Bombeiros",
      categoria: "emergencia",
      horario: "24 horas",
      telefones: [
        { valor: "193", nota: "Emergência" },
        { valor: "(00) 0000-0000", nota: "Administrativo" },
      ],
      busca: "incêndio resgate salvamento",
    },

    // ---------------------------------------- SAÚDE E PERÍCIA ---
    {
      nome: "PML Novo Hamburgo",
      categoria: "saude",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      endereco: "Rua José de Alencar, 368, Bairro Rio Branco, Novo Hamburgo/RS",
      busca: "legista corpo de delito necropsia perícia lesões novo hamburgo",
    },
    {
      nome: "PML Canoas",
      categoria: "saude",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      endereco: "Avenida Farroupilha, 8001, Bairro São José, Canoas/RS",
      busca: "legista corpo de delito necropsia perícia lesões canoas",
    },
    {
      nome: "IML — Instituto Médico Legal",
      categoria: "saude",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      endereco: "PREENCHER",
      busca: "legista corpo de delito necropsia perícia lesões",
    },
    {
      nome: "Hospital Lauro Reus",
      categoria: "saude",
      telefones: ["(51) 3585-5000"],
      endereco: "Rua Osvaldo Cruz, 116, Bairro Bela Vista, Campo Bom/RS",
      busca: "hospital lauro reus",
    },

    // --------------------------- PROTEÇÃO E ASSISTÊNCIA ---
    {
      nome: "Conselho Tutelar",
      categoria: "protecao",
      telefones: [
        { valor: "(00) 0000-0000", nota: "Horário comercial" },
        { valor: "(00) 0000-0000", nota: "Plantão" },
      ],
      whatsapp: ["(00) 00000-0000"],
      endereco: "PREENCHER",
      busca: "criança adolescente menor eca plantão",
    },
    {
      nome: "Patrulha Maria da Penha — Brigada Militar",
      categoria: "protecao",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      busca: "patrulha maria da penha medida protetiva visita bm",
    },
    {
      nome: "Patrulha Maria da Penha — Guarda Municipal",
      categoria: "protecao",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      busca: "patrulha maria da penha medida protetiva visita gm",
    },
    {
      nome: "Patrulha Escolar — Guarda Municipal",
      categoria: "protecao",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      busca: "patrulha escolar escola colégio aluno gm",
    },
    {
      nome: "CREAS",
      categoria: "protecao",
      descricao: "Vítima de violência e violação de direitos.",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      endereco: "PREENCHER",
      busca: "assistência social vítima acompanhamento psicossocial",
    },
    {
      nome: "CRAS",
      categoria: "protecao",
      descricao: "Benefícios e assistência social do território.",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      endereco: "PREENCHER",
      busca: "assistência social benefício cadastro único",
    },

    // ----------------------------------- JUSTIÇA E DEFESA ---
    {
      nome: "Defensoria Pública",
      categoria: "justica",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      emails: ["preencher@exemplo"],
      endereco: "PREENCHER",
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
      horario: "12h00 às 19h00, dias de semana",
      telefones: [
        { valor: "(00) 0000-0000", nota: "1ª Vara Cível" },
        { valor: "(00) 0000-0000", nota: "2ª Vara Cível e JIJ" },
        { valor: "(00) 0000-0000", nota: "Vara Criminal" },
        { valor: "(00) 0000-0000", nota: "Plantão" },
      ],
      endereco: "PREENCHER",
      obs: "Horários variam, especialmente em períodos de festividade.",
      busca: "juiz plantão medida protetiva urgência",
    },

    // -------------------------------- TRÂNSITO E VEÍCULOS ---
    {
      nome: "Detran",
      categoria: "transito",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      busca: "veículo cnh licenciamento multa",
    },
    {
      nome: "Pátio / CRD Trevo",
      categoria: "transito",
      descricao: "Remoção e depósito de veículo.",
      horario: "PREENCHER",
      telefones: ["(00) 0000-0000"],
      endereco: "PREENCHER",
      busca: "reboque remoção depósito apreendido trevo crd pátio guincho",
    },

    // ------------------------------------- OUTROS SERVIÇOS ---
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
