// O texto gerado, palavra por palavra.
//
// POR QUE ESTE CASO EXISTE
// index.js exercita o formulário (as perguntas aparecem, o validador
// recusa um CPF errado, o botão destrava) e conferia da saída apenas que
// ela tinha mais de 40 caracteres. Mas o produto do gerador é o
// PARÁGRAFO, que vai colado dentro de um boletim — e um template
// quebrado não dá erro nenhum: dá uma frase que parece certa e diz outra
// coisa. É a falha que ninguém percebe.
//
// COMO ESTENDER (é o ponto do arranjo)
// Um tipo novo em js/gerador/tipos/ = um bloco cenario() aqui, com as
// respostas de um lado e o parágrafo esperado do outro. Não há DOM
// envolvido: Generator.gerar() lê o Estado direto, e Visibilidade
// continua valendo, então uma resposta de pergunta escondida não entra
// no texto (há um cenário abaixo só para garantir isso).
//
// Quando uma frase mudar de propósito, o teste falha, você lê o diff e
// atualiza a expectativa. É o que se quer de um texto com valor
// jurídico: nada muda sem alguém ver mudando.

/**
 * Zera o estado, responde o que foi pedido e compara o parágrafo inteiro.
 * `esperado` é um array de frases só para caber na largura da tela — o
 * que se compara é a string toda, junta por espaço, como o gerador monta.
 */
function cenario(nome, respostas, esperado) {
  Estado.reset();
  Object.keys(respostas).forEach(function (id) {
    Estado.definirResposta(id, respostas[id]);
  });
  igual(nome, Generator.gerar(), esperado.join(" "));
}

// O Intl do navegador separa "R$" do número com espaço NÃO quebrável
// (U+00A0), não com espaço comum. Escrever o caractere de verdade aqui é
// o que faz a comparação bater — e deixa visível que é assim que o
// valor sai no texto final.
var NBSP = " ";
function real(texto) {
  return "R$" + NBSP + texto;
}

// Respostas de fechamento que quase todo cenário repete.
var FECHO_SIMPLES = {
  motivo_registro: "preservar_direitos",
  deseja_representar: "incondicionada",
  outra_orientacao_houve: "nao",
};

function com(base, extra) {
  var saida = {};
  Object.keys(base).forEach(function (k) { saida[k] = base[k]; });
  Object.keys(extra).forEach(function (k) { saida[k] = extra[k]; });
  return saida;
}

// --- nada respondido ---------------------------------------------------
Estado.reset();
igual("sem respostas, texto vazio", Generator.gerar(), "");

// --- PERDA -------------------------------------------------------------

cenario("perda/celular sem IMEI", com(FECHO_SIMPLES, {
  tipo_ocorrencia: "perda",
  perda_o_que: "celular",
  perda_cel_marca: "Samsung",
  perda_cel_modelo: "Galaxy A54",
  perda_cel_operadora: "Vivo",
  perda_cel_numero: "51 98765-4321",
  perda_cel_sabe_imei: "nao",
}), [
  "Comunica que perdeu seu telefone celular.",
  "Informa que o celular consiste de um Samsung Galaxy A54, operadora Vivo,",
  "número telefônico 51 987654321.",
  "Registra para preservar seus direitos.",
  "Nada mais.",
]);

cenario("perda/celular com IMEI, sem representação", {
  tipo_ocorrencia: "perda",
  perda_o_que: "celular",
  perda_cel_marca: "Apple",
  perda_cel_modelo: "iPhone 15",
  perda_cel_operadora: "Claro",
  perda_cel_numero: "(51) 99999-8888",
  perda_cel_sabe_imei: "sim",
  perda_cel_imei: "49-0154 20323751 8",
  motivo_registro: "seguro",
  deseja_representar: "naorepresenta",
  outra_orientacao_houve: "sim",
  outra_orientacao: "Comunicante orientado a solicitar o bloqueio do IMEI junto à operadora",
}, [
  "Comunica que perdeu seu telefone celular.",
  "Informa que o celular consiste de um Apple iPhone 15, operadora Claro,",
  "número telefônico 51 999998888, IMEI 490154203237518.",
  "Registra para fins de acionamento de seguro.",
  "Cientificado(a) acerca do prazo decadencial de seis meses,",
  "não deseja representar criminalmente.",
  "Comunicante orientado a solicitar o bloqueio do IMEI junto à operadora.",
  "Nada mais.",
]);

cenario("perda/documentos pessoais", com(FECHO_SIMPLES, {
  tipo_ocorrencia: "perda",
  perda_o_que: "documento_pessoal",
  perda_doc_quais: ["identidade", "cnh", "cartao_sus"],
  motivo_registro: "segundavia",
}), [
  "Comunica a perda dos seguintes documentos: Documento de Identidade,",
  "Carteira de Habilitação (CNH) e Cartão do SUS.",
  "Registra para solicitar segunda via.",
  "Nada mais.",
]);

cenario("perda/documento veicular", com(FECHO_SIMPLES, {
  tipo_ocorrencia: "perda",
  perda_o_que: "documento_veicular",
  perda_doc_veic_placa: "abc-1234",
}), [
  "Comunica a perda do Certificado do Registro do Veículo (CRV/DUT)",
  "do veículo de placas ABC1234, abaixo qualificado.",
  "Registra para preservar seus direitos.",
  "Nada mais.",
]);

cenario("perda/placa dianteira", com(FECHO_SIMPLES, {
  tipo_ocorrencia: "perda",
  perda_o_que: "placa_veicular",
  perda_placa_qual: "dianteira",
  perda_placa_veiculo: "abc1d23",
}), [
  "Comunica a perda da placa dianteira do veículo de placas ABC1D23,",
  "abaixo qualificado.",
  "Registra para preservar seus direitos.",
  "Nada mais.",
]);

cenario("perda/ambas as placas", com(FECHO_SIMPLES, {
  tipo_ocorrencia: "perda",
  perda_o_que: "placa_veicular",
  perda_placa_qual: "ambas",
  perda_placa_veiculo: "ABC1D23",
}), [
  "Comunica a perda de ambas placas do veículo de placas ABC1D23,",
  "abaixo qualificado.",
  "Registra para preservar seus direitos.",
  "Nada mais.",
]);

// Resposta de pergunta escondida não pode vazar para o texto: aqui o
// ramo do celular está todo preenchido, mas o que foi perdido é
// documento. É o acidente clássico de quem troca de ramo no meio do
// atendimento.
cenario("ramo abandonado não vaza", com(FECHO_SIMPLES, {
  tipo_ocorrencia: "perda",
  perda_o_que: "documento_veicular",
  perda_doc_veic_placa: "ABC1234",
  perda_cel_marca: "Samsung",
  perda_cel_modelo: "Galaxy A54",
  perda_cel_operadora: "Vivo",
  perda_cel_numero: "51987654321",
  perda_cel_sabe_imei: "nao",
}), [
  "Comunica a perda do Certificado do Registro do Veículo (CRV/DUT)",
  "do veículo de placas ABC1234, abaixo qualificado.",
  "Registra para preservar seus direitos.",
  "Nada mais.",
]);

// --- ESTELIONATO -------------------------------------------------------

cenario("estelionato/falso advogado, duas transferências", {
  comunicante_genero: "fem",
  tipo_ocorrencia: "estelionato",
  tipo_estelionato: "falso_advogado",
  fa_numeros_contato: [{ numero: "51988887777" }, { numero: "51977776666" }],
  fa_tipo_contato: "ligacao",
  fa_genero_advogado: "feminino",
  fa_nome_advogado_alegado: "Dra. Marina Alves",
  fa_pretexto:
    "afirmaram que a vítima havia ganhado uma causa judicial e solicitaram uma chamada de vídeo",
  fa_houve_acesso_remoto: "sim",
  fa_pagamentos: [
    {
      tipo_pagamento: "pix",
      valor: 1500,
      recebedor_nome: "João da Silva",
      recebedor_documento: "529.982.247-25",
      chave_pix: "joao@exemplo.com",
      banco_recebedor: "Banco Exemplo",
    },
    { tipo_pagamento: "ted", valor: 300.5, recebedor_nome: "Maria Souza" },
  ],
  estelionato_sabe_prejuizo: "sim",
  valor_prejuizo: 1800.5,
  fa_orientado_cancelar_acessos: "sim",
  motivo_registro: "estorno_bancario",
  deseja_representar: "representa",
  outra_orientacao_houve: "nao",
}, [
  "Comunica que sofreu estelionato, na modalidade do falso advogado.",
  "Informa que recebeu ligações telefônicas dos números telefônicos",
  "51988887777 e 51977776666, se passando por sua advogada, Dra. Marina Alves.",
  "Estes indivíduos afirmaram que a vítima havia ganhado uma causa judicial",
  "e solicitaram uma chamada de vídeo.",
  "Os indivíduos induziram a vítima a compartilhar sua tela e liberar acesso",
  "à sua conta bancária e, após isso, foram realizadas transferências de sua",
  "conta para contas dos golpistas.",
  "Esclarece que foram realizadas 2 transferências, sendo a primeira na",
  "modalidade Pix, no valor de " + real("1.500,00") + ", para o recebedor João da Silva,",
  "CPF 529.982.247-25 e chave Pix joao@exemplo.com, instituição recebedora",
  "Banco Exemplo e a segunda na modalidade TED, no valor de " + real("300,50") + ",",
  "para o recebedor Maria Souza.",
  "Estima o prejuízo total em " + real("1.800,50") + ".",
  "Foi orientada a contatar o banco e providenciar o cancelamento dos acessos",
  "à conta e aos cartões bancários.",
  "Registra para preservar seus direitos e solicitar ao banco o estorno dos",
  "valores transferidos.",
  "Manifesta desejo em representar criminalmente.",
  "Nada mais.",
]);

cenario("estelionato/falso parente, um pagamento", {
  comunicante_genero: "masc",
  tipo_ocorrencia: "estelionato",
  tipo_estelionato: "falso_parente",
  fp_numeros_contato: [{ numero: "51999990000" }],
  fp_tipo_contato: "mensagem_whats",
  fp_parentesco: "filha",
  fp_nome_alegado: "Ana",
  fp_usou_foto_perfil: "sim",
  fp_sabia_outros_dados: "sim",
  fp_dados_utilizados: ["nome_completo", "endereco", "outro"],
  fp_dados_utilizados_outro: "o nome da escola dos netos",
  fp_justificativa_pedido: "não conseguia pagar um boleto pelo aplicativo do banco",
  fp_pagamentos: [
    {
      tipo_pagamento: "pix",
      valor: 800,
      recebedor_nome: "Carlos Lima",
      recebedor_documento: "529.982.247-25",
      banco_recebedor: "Nubank",
    },
  ],
  estelionato_sabe_prejuizo: "nao",
  motivo_registro: "preservar_direitos",
  deseja_representar: "representa",
  outra_orientacao_houve: "nao",
}, [
  "Comunica que sofreu estelionato, na modalidade do falso parente.",
  "Informa que recebeu mensagens via WhatsApp do número telefônico 51999990000,",
  "de um indivíduo que se passou por sua filha, Ana, utilizando, inclusive,",
  "foto de perfil desta.",
  "Acrescenta que o suspeito também demonstrou conhecer nome completo, endereço",
  "e outro dado da pessoa pela qual se passava.",
  "Relata que o suspeito também sabia o nome da escola dos netos.",
  "Informa que o indivíduo solicitou dinheiro, afirmando que não conseguia",
  "pagar um boleto pelo aplicativo do banco.",
  "Relata que efetuou 1 pagamento, na modalidade Pix, no valor de " + real("800,00") + ",",
  "tendo como recebedor Carlos Lima, CPF 529.982.247-25, junto à instituição Nubank.",
  "Esclarece não saber precisar o valor total do prejuízo.",
  "Registra para preservar seus direitos.",
  "Manifesta desejo em representar criminalmente.",
  "Nada mais.",
]);

// O aviso de cancelar acessos depende de acesso remoto = sim, e a
// concordância vem de comunicante_genero — duas coisas que se perdem
// facilmente numa edição.
cenario("sem acesso remoto, sem aviso de cancelar acessos", com(FECHO_SIMPLES, {
  comunicante_genero: "masc",
  tipo_ocorrencia: "estelionato",
  tipo_estelionato: "falso_advogado",
  fa_numeros_contato: [{ numero: "51988887777" }],
  fa_tipo_contato: "mensagem_whats",
  fa_genero_advogado: "masculino",
  fa_nome_advogado_alegado: "Dr. Paulo Reis",
  fa_pretexto: "alegaram um precatório a receber",
  fa_houve_acesso_remoto: "nao",
  fa_pagamentos: [{ tipo_pagamento: "boleto", valor: 250, recebedor_nome: "Empresa X" }],
  fa_orientado_cancelar_acessos: "sim",
  estelionato_sabe_prejuizo: "nao",
}), [
  "Comunica que sofreu estelionato, na modalidade do falso advogado.",
  "Informa que recebeu mensagens via WhatsApp do número telefônico 51988887777,",
  "se passando por seu advogado, Dr. Paulo Reis.",
  "Estes indivíduos alegaram um precatório a receber.",
  "Esclarece que foi realizada 1 transferência, na modalidade boleto,",
  "no valor de " + real("250,00") + ", para o recebedor Empresa X.",
  "Esclarece não saber precisar o valor total do prejuízo.",
  "Registra para preservar seus direitos.",
  "Nada mais.",
]);

// --- FECHAMENTO (perguntas comuns a todo tipo) -------------------------
// Base curta de propósito: aqui o que se confere é a última frase.

var BASE_CURTA = {
  tipo_ocorrencia: "perda",
  perda_o_que: "documento_veicular",
  perda_doc_veic_placa: "ABC1234",
};

var ABERTURA = [
  "Comunica a perda do Certificado do Registro do Veículo (CRV/DUT)",
  "do veículo de placas ABC1234, abaixo qualificado.",
];

cenario("motivo de registro livre", com(BASE_CURTA, {
  motivo_registro: "outro",
  motivo_registro_outro: "Registra para instruir ação de indenização",
  deseja_representar: "incondicionada",
  outra_orientacao_houve: "nao",
}), ABERTURA.concat([
  "Registra para instruir ação de indenização.",
  "Nada mais.",
]));

cenario("ação penal privada", com(BASE_CURTA, {
  motivo_registro: "preservar_direitos",
  deseja_representar: "acaoprivada",
  outra_orientacao_houve: "nao",
}), ABERTURA.concat([
  "Registra para preservar seus direitos.",
  "É crime de ação penal privada e a vítima informou que moverá queixa-crime.",
  "Nada mais.",
]));

cenario("fato atípico não gera frase de representação", com(BASE_CURTA, {
  motivo_registro: "preservar_direitos",
  deseja_representar: "atipico",
  outra_orientacao_houve: "nao",
}), ABERTURA.concat([
  "Registra para preservar seus direitos.",
  "Nada mais.",
]));

// Deixa o estado limpo: o caso roda na página de verdade, e um rascunho
// sobrevivente confundiria quem abrisse o build depois.
Estado.reset();
