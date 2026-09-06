// Gerador de ocorrências: schema saudável, validadores e rascunho.

igual("linter não acusou nada", document.querySelectorAll(".linter-banner, .aviso-linter").length, 0);
ok("perguntas visíveis no início", document.querySelectorAll("#perguntas .pergunta").length);
igual("botão gerar começa desabilitado", document.getElementById("btn-gerar").disabled, true);

// --- validadores (delegam a js/comum/identificadores.js) --------------
igual("CPF válido", window.VALIDADORES.cpfOuCnpj("529.982.247-25"), true);
igual("CPF de dígito errado é recusado", window.VALIDADORES.cpfOuCnpj("529.982.247-26") === true, false);
igual("CPF de dígitos iguais é recusado", window.VALIDADORES.cpfOuCnpj("111.111.111-11") === true, false);
igual("CNPJ válido", window.VALIDADORES.cpfOuCnpj("11.222.333/0001-81"), true);
igual("IMEI válido", window.VALIDADORES.imei("490154203237518"), true);
igual("IMEI de Luhn errado é recusado", window.VALIDADORES.imei("490154203237519") === true, false);
igual("placa Mercosul", window.VALIDADORES.placa("ABC1D23"), true);
igual("placa antiga", window.VALIDADORES.placa("ABC1234"), true);
igual("placa curta é recusada", window.VALIDADORES.placa("AB123") === true, false);
igual("chassi de 17 caracteres", window.VALIDADORES.chassi("9BWZZZ377VT004251"), true);
igual("chassi com I é recusado", window.VALIDADORES.chassi("9BWZZZ377VT00425I") === true, false);
igual("telefone com DDD", window.VALIDADORES.telefone("51987654321"), true);

// --- ponte para as orientações ----------------------------------------
// O botão "Gerar" só destrava com o questionário inteiro respondido, e é
// no clique dele que o link é montado — daí preencher tudo aqui.
igual("link de orientações começa escondido", vis("link-orientacoes"), false);
clicar('input[name="tipo_ocorrencia"][value="perda"]');
clicar('input[name="perda_o_que"][value="celular"]');
digitar("perda_cel_marca", "Samsung");
digitar("perda_cel_modelo", "Galaxy A54");
digitar("perda_cel_operadora", "Vivo");
digitar("perda_cel_numero", "51987654321");
clicar('input[name="perda_cel_sabe_imei"][value="nao"]');
clicar('input[name="motivo_registro"][value="preservar_direitos"]');
clicar('input[name="deseja_representar"][value="incondicionada"]');
clicar('input[name="outra_orientacao_houve"][value="nao"]');
igual("questionário completo destrava o gerar", document.getElementById("btn-gerar").disabled, false);

clicar("#btn-gerar");
igual("texto foi gerado", document.getElementById("saida-texto").value.length > 40, true);
igual("link aparece depois de gerar", vis("link-orientacoes"), true);
igual(
  "link leva ao subtipo certo",
  document.getElementById("link-orientacoes").getAttribute("href"),
  "orientacoes.html?tipo=perda&sub=celular"
);

// --- rascunho em sessionStorage ---------------------------------------
ok("rascunho gravado", sessionStorage.getItem("acta-rascunho") !== null);
var salvo = JSON.parse(sessionStorage.getItem("acta-rascunho"));
igual("rascunho guarda o tipo escolhido", salvo.respostas.tipo_ocorrencia, "perda");
igual("rascunho guarda as tocadas", salvo.tocadas.indexOf("perda_o_que") >= 0, true);

Estado.reset();
igual("reset apaga o rascunho", sessionStorage.getItem("acta-rascunho"), null);
