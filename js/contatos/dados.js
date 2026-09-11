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
        { valor: "6197", nota: "Silveira - Cartório" },
        { valor: "6198", nota: "Estág. Mariana - Cartório" },
        { valor: "6199", nota: "Magali - Cart. Vulneráveis (temp. vago)" },
        { valor: "6200", nota: "Prates" },
        { valor: "6201", nota: "Rogério Dale - Crim. Ambientais" },
        { valor: "6202", nota: "Airton Barcellos" },
        { valor: "6203", nota: "Danielle - Sala das Margaridas" },
        { valor: "6204", nota: "Delegado - Gabinete" },
        { valor: "6205", nota: "Pozzobon - Investigação" },
        { valor: "6206", nota: "Deisi - Investigação" },
        { valor: "6207", nota: "André - Investigação" },
        { valor: "6208", nota: "Sala de Monitoramento (temp. Magali)" },
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
        { valor: "(51) 98416-8897", nota: "Secretaria" },
        { valor: "(51) 98682-4885", nota: "Cartório" },
        { valor: "(51) 98401-3237", nota: "Investigação" },
        { valor: "(51) 98503-8802", nota: "Sala das Margaridas" },
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
      whatsapp: ["(51) 98411-8873"],
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
      telefones: ["(51) 3288-2307"],
      emails: ["dtip@pc.rs.gov.br"],
      busca: "sac dtip informática sistema senha acesso rede suporte tecnologia",
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
        { valor: "198", nota: "Polícia Rodoviária Estadual" },
      ],
      whatsapp: [{ valor: "(51) 98413-9809", nota: "Administrativo" }],
      busca: "policia militar brigada viatura socorro emergência rodoviaria",
    },
    {
      nome: "Guarda Municipal",
      categoria: "emergencia",
      horario: "PREENCHER",
      telefones: [
        { valor: "153", nota: "Emergência" },
        { valor: "(00) 0000-0000", nota: "Administrativo" },
      ],
      whatsapp: ["(51) 98058-8838"],
      busca: "gm guarda municipal",
    },
    {
      nome: "SAMU",
      categoria: "emergencia",
      horario: "24 horas",
      telefones: ["192"],
      busca: "ambulância socorro médico",
    },

    // ---------------------------------------- SAÚDE E PERÍCIA ---
    {
      nome: "PML Novo Hamburgo",
      categoria: "saude",
      horario: "QUARTA e SEXTA, 13h30 às 17h00",
      telefones: ["(51) 98682-9748"],
      whatsapp: ["(51) 98682-9748"],
      endereco: "Rua José de Alencar, 368, Bairro Rio Branco, Novo Hamburgo/RS",
      obs: "Frequentemente altera horários. Melhor ligar antes para confirmar",
      busca: "legista corpo de delito perícia lesões novo hamburgo",
    },
    {
      nome: "PML Canoas",
      categoria: "saude",
      horario: "SEGUNDA, TERÇA e SEXTA, 07h00 às 19h00",
      telefones: ["(51) 3328-8515", "(51) 3347-8805", "(51) 9868-27055"],
      endereco: "Avenida Farroupilha, 8001, Bairro São José, Canoas/RS",
      busca: "legista corpo de delito perícia lesões canoas",
    },
    {
      nome: "Perícias DCCI/CIOSP",
      categoria: "saude",
      horario: "PREENCHER",
      whatsapp: ["(51) 98594-3172", "(51) 98617-6472"],
      endereco: "PREENCHER",
      busca: "legista corpo de delito necropsia perícia lesões",
    },
    {
      nome: "Remoção de cadáver",
      categoria: "saude",
      horario: "PREENCHER",
      telefones: ["0800-510-0909"],
      endereco: "PREENCHER",
      busca: "remoção corpo cadáver necropsia",
    },
    {
      nome: "Hospital Lauro Reus/Pronto Atendimento",
      categoria: "saude",
      telefones: [
        { valor: "(51) 3585-5000", nota: "Administrativo" },
        { valor: "(51) 3191-3601", nota: "Alternativo" },
        { valor: "(51) 3598-8691", nota: "Pronto Atendimento (24h)" },
      ],
      endereco: "Rua Osvaldo Cruz, 116, Bairro Bela Vista, Campo Bom/RS",
      busca: "hospital lauro reus pronto atendimento",
    },

    // --------------------------- PROTEÇÃO E ASSISTÊNCIA ---
    {
      nome: "Conselho Tutelar",
      categoria: "protecao",
      telefones: [
        { valor: "(51) 3597-3211", nota: "Horário comercial" },
        { valor: "(51) 99703-0018", nota: "Plantão" },
      ],
      endereco: "Rua Dolores Alcaraz Caldas, 194, Bairro Celeste, Campo Bom/RS",
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
      telefones: ["(51) 3597-1248"],
      endereco: "Rua Rui Barbosa, 197, Bairro Centro, Campo Bom/RS",
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
      horario: "12h00 às 18h00, dias de semana",
      telefones: ["(51) 2121-0358", "(51) 3597-0522"],
      emails: ["campobom@defensoria.rs.def.br"],
      endereco: "Avenida dos Estados, 780, Bairro Centro, Campo Bom/RS",
      busca: "defensor advogado gratuito assistência jurídica",
    },
    {
      nome: "Ministério Público",
      categoria: "justica",
      horario: "PREENCHER",
      telefones: [
        { valor: "(51) 3295-2860", nota: "Horário comercial" },
        { valor: "(51) 93295-2860", nota: "Plantão" },
      ],
      whatsapp: ["(51) 93295-2860"],
      emails: [
        { valor:"mpcampobom@mprs.mp.br", nota: "Ministério Público de Campo Bom" },
        { valor:"ivanda@mprs.mp.br", nota: "Promotora Dra. Ivanda Grapiglia Valiati" },
      ],
      endereco: "Avenida dos Estados, 850, Bairro 25 de Julho, Campo Bom/RS",
      busca: "promotoria promotor mp",
    },
    {
      nome: "Fórum / plantão judiciário",
      categoria: "justica",
      horario: "12h00 às 19h00, dias de semana",
      telefones: [
        { valor: "(51) 3098-3398", nota: "Horário comercial" },
        { valor: "(51) 99991-6350", nota: "Plantão" },
      ],
      whatsapp: [
        { valor: "(51) 99552-8405", nota: "1ª Vara Cível e JEC" },
        { valor: "(51) 99686-8708", nota: "2ª Vara Cível e JIJ" },
        { valor: "(51) 99683-7096", nota: "Vara Criminal e JECrim" },
        { valor: "(51) 99991-6350", nota: "Plantão" },
      ],
      emails: [
        { valor:"frcampobom1vciv@tjrs.jus.br", nota: "1ª Vara Cível e JEC" },
        { valor:"frcampobom2vciv@tjrs.jus.br", nota: "2ª Vara Cível e JIJ" },
        { valor:"frcampobom1vcri@tjrs.jus.br", nota: "Vara Criminal e JECrim" },
        { valor:"frcampobomplantao@tjrs.jus.br", nota: "Plantão" },
      ],
      endereco: "Avenida dos Estados, 800, Bairro Centro, Campo Bom/RS",
      obs: "Horários variam, especialmente em períodos de festividade.",
      busca: "juiz plantão medida protetiva urgência",
    },
    {
      nome: "NUGESP",
      categoria: "justica",
      horario: "PREENCHER",
      telefones: [{ valor: "(51) 3288-7349", nota: "Polícia Penal/NUGESP" }],
      emails: [{ valor: "frpoacentnugesp@tjrs.jus.br", nota: "Vara Criminal do NUGESP" }],
      endereco: "Rua Dr. Salvador França, 296, Bairro Jardim Botânico, Porto Alegre/RS",
      busca: "nugesp gestão prisional preso polícia penal vara criminal",
    },

    // -------------------------------- TRÂNSITO E VEÍCULOS ---
    {
      nome: "Detran/CRVA",
      categoria: "transito",
      horario: "09h00 às 17h30, dias de semana",
      telefones: ["(51) 3134-8840"],
      endereco: "Rua Aimoré, 345, Bairro Centro, Campo Bom/RS",
      busca: "veículo cnh licenciamento multa certidao registro",
    },
    {
      nome: "Pátio / CRD Trevo",
      categoria: "transito",
      descricao: "Depósito de veículo.",
      horario: "09h00 às 17h00, dias de semana",
      telefones: ["(51) 3598-2225"],
      whatsapp: ["(51) 99880-0550"],
      endereco: "Rua Leão XIII, 1865, Bairro Mônaco, Campo Bom/RS",
      busca: "reboque remoção depósito apreendido trevo crd pátio guincho",
    },
    {
      nome: "Remoção de veículo",
      categoria: "transito",
      telefones: ["0800-906-6006"],
      endereco: "PREENCHER",
      busca: "reboque remoção depósito apreendido trevo crd pátio guincho",
    },

    // ------------------------------------- OUTROS SERVIÇOS ---
    {
      nome: "SINE/Identidades",
      categoria: "servicos",
      horario: "PREENCHER",
      telefones: ["(51) 3597-0823"],
      endereco: "Avenida dos Estados, 902, Bairro Centro, Campo Bom/RS",
      busca: "sine identidades igp",
    },
    {
      nome: "Procon",
      categoria: "servicos",
      horario: "PREENCHER",
      telefones: ["(51) 3597-4203"],
      endereco: "Avenida dos Estados, 902, Bairro Centro, Campo Bom/RS",
      busca: "procon direitos consumidor cdc",
    },
  ],
};
