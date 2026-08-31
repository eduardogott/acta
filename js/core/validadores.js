/**
 * VALIDADORES.JS
 * ---------------------------------------------------------------------------
 * Uma pergunta (ou um campo de multiplo-input) pode declarar:
 *
 *   validador: "nomeRegistrado"
 *   // ou
 *   validador: (valor, respostas) => true | "mensagem de erro"
 *
 * Um validador SEMPRE retorna `true` (válido) ou uma STRING (mensagem de
 * erro mostrada embaixo do campo). Registre os seus com
 * registrarValidador(nome, fn) — nunca precisa editar engine.js pra isso.
 * ---------------------------------------------------------------------------
 */

window.VALIDADORES = {};

window.registrarValidador = function registrarValidador(nome, fn) {
  window.VALIDADORES[nome] = fn;
};

function resolverValidador(pergunta) {
  if (!pergunta.validador) return null;
  if (typeof pergunta.validador === "function") return pergunta.validador;
  if (typeof pergunta.validador === "string") {
    const fn = window.VALIDADORES[pergunta.validador];
    if (!fn) {
      console.warn(
        `[validadores] "${pergunta.validador}" não está registrado (pergunta "${pergunta.id}").`
      );
    }
    return fn || null;
  }
  return null;
}

// --------------------------------------------------------------------------
// Validadores prontos
// --------------------------------------------------------------------------
registrarValidador("naoVazio", (valor) =>
  String(valor ?? "").trim() !== "" ? true : "Este campo não pode ficar em branco."
);

// Checa só a quantidade de dígitos (11 = CPF, 14 = CNPJ), ignorando
// pontuação. Não valida dígito verificador — é uma checagem de formato,
// suficiente pro caso de uso (evitar digitação claramente errada).
// OBS: uma chave Pix pode ser e-mail, telefone ou chave aleatória — use
// este validador só quando o campo específico for mesmo documento
// (CPF/CNPJ), ajuste/remova se o campo aceitar outros formatos de chave.
registrarValidador("cpfOuCnpj", (valor) => {
  // Normaliza pra maiúsculas: o CNPJ alfanumérico (formato novo) só é
  // reconhecido pelo regex abaixo em A-Z — sem isso, um CNPJ digitado em
  // minúsculas seria rejeitado incorretamente.
  const digitos = String(valor || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  if (!(digitos.length === 11 || digitos.length === 14)) {
    return "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido, SEM pontuação.";
  }

  // =========================
  // CPF
  // =========================
  if (digitos.length === 11) {
    if (!/^\d{11}$/.test(digitos)) {
      return "O CPF deve conter somente 11 algarismos, sem letras ou pontuação.";
    }

    if (/^(\d)\1{10}$/.test(digitos)) {
      return "CPF inválido: todos os dígitos são iguais.";
    }

    // Primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += Number(digitos[i]) * (10 - i);
    }
    let resto = soma % 11;
    const dv1 = resto < 2 ? 0 : 11 - resto;
    if (dv1 !== Number(digitos[9])) {
      return "CPF inválido: primeiro dígito verificador incorreto.";
    }

    // Segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += Number(digitos[i]) * (11 - i);
    }
    resto = soma % 11;
    const dv2 = resto < 2 ? 0 : 11 - resto;
    if (dv2 !== Number(digitos[10])) {
      return "CPF inválido: segundo dígito verificador incorreto.";
    }

    return true;
  }

  // =========================
  // CNPJ
  // =========================
  if (!/^[0-9A-Z]{12}\d{2}$/.test(digitos)) {
    return "O CNPJ deve conter 12 caracteres alfanuméricos seguidos de 2 algarismos verificadores, sem pontuação.";
  }

  function valorCNPJ(caractere) {
    if (caractere >= "A" && caractere <= "Z") {
      return caractere.charCodeAt(0) - 48;
    }
    return Number(caractere);
  }

  // Primeiro dígito verificador
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = 0;
  for (let i = 0; i < 12; i++) {
    soma += valorCNPJ(digitos[i]) * pesos1[i];
  }
  let resto = soma % 11;
  const dv1 = resto < 2 ? 0 : 11 - resto;
  if (dv1 !== Number(digitos[12])) {
    return "CNPJ inválido: primeiro dígito verificador incorreto.";
  }

  // Segundo dígito verificador
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  soma = 0;
  for (let i = 0; i < 13; i++) {
    soma += valorCNPJ(digitos[i]) * pesos2[i];
  }
  resto = soma % 11;
  const dv2 = resto < 2 ? 0 : 11 - resto;
  if (dv2 !== Number(digitos[13])) {
    return "CNPJ inválido: segundo dígito verificador incorreto.";
  }

  return true;
});

registrarValidador("numeroPositivo", (valor) => {
  const n = Number(valor);
  return !Number.isNaN(n) && n > 0 ? true : "Informe um número maior que zero.";
});

// IMEI: 15 dígitos, com dígito verificador calculado pelo algoritmo de
// Luhn sobre os 14 primeiros (mesmo algoritmo usado em cartões de
// crédito). Dobra o dígito, da direita pra esquerda, alternando a partir
// do dígito imediatamente anterior ao verificador.
registrarValidador("imei", (valor) => {
  const digitos = String(valor || "").replace(/\D/g, "");
  if (digitos.length !== 15) {
    return "O IMEI deve conter 15 algarismos, sem espaços ou pontuação.";
  }

  let soma = 0;
  let dobrar = true;
  for (let i = digitos.length - 2; i >= 0; i--) {
    let d = Number(digitos[i]);
    if (dobrar) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    soma += d;
    dobrar = !dobrar;
  }
  const dv = (10 - (soma % 10)) % 10;
  if (dv !== Number(digitos[14])) {
    return "IMEI inválido: dígito verificador incorreto.";
  }
  return true;
});

// Placa veicular: formato antigo (AAA9999) ou Mercosul (AAA9A99) —
// checagem só de formato, não existe dígito verificador em placas.
registrarValidador("placa", (valor) => {
  const v = String(valor || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (!/^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(v)) {
    return "Informe uma placa válida, no formato antigo (ABC1234) ou Mercosul (ABC1D23).";
  }
  return true;
});

window.resolverValidador = resolverValidador;
