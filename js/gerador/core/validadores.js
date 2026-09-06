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

// Delegam a aritmética a core/identificadores.js — a mesma usada pelo
// conferidor. Aqui fica só a tradução do veredito para a mensagem que
// aparece embaixo do campo.
//
// OBS: uma chave Pix pode ser e-mail, telefone ou chave aleatória — use
// "cpfOuCnpj" só quando o campo for mesmo documento.
registrarValidador("cpfOuCnpj", (valor) => {
  const bruto = String(valor || "").replace(/[^a-zA-Z0-9]/g, "");
  if (bruto.length === 11) {
    const r = Identificadores.cpf(valor);
    return r.ok ? true : "CPF inválido: " + r.motivo.charAt(0).toLowerCase() + r.motivo.slice(1);
  }
  if (bruto.length === 14) {
    const r = Identificadores.cnpj(valor);
    return r.ok ? true : "CNPJ inválido: " + r.motivo.charAt(0).toLowerCase() + r.motivo.slice(1);
  }
  return "Informe um CPF (11 dígitos) ou CNPJ (14 caracteres) válido, SEM pontuação.";
});

registrarValidador("numeroPositivo", (valor) => {
  const n = Number(valor);
  return !Number.isNaN(n) && n > 0 ? true : "Informe um número maior que zero.";
});

// IMEI: 15 algarismos com dígito de Luhn (ver core/identificadores.js).
registrarValidador("imei", (valor) => {
  const r = Identificadores.imei(valor);
  if (r.ok) return true;
  return String(valor || "").replace(/\D/g, "").length !== 15
    ? "O IMEI deve conter 15 algarismos, sem espaços ou pontuação."
    : "IMEI inválido: dígito verificador incorreto.";
});

// Telefone: DDD (2 dígitos) + número (8 dígitos fixo ou 9 dígitos
// celular) = 10 ou 11 dígitos no total. Aceita qualquer formatação de
// entrada (parênteses, espaço, hífen) — só a quantidade de dígitos
// importa aqui; a normalização pro texto final é feita por
// h.normalizarTelefone (texto-helpers.js), não por este validador.
registrarValidador("telefone", (valor) => {
  const digitos = String(valor || "").replace(/\D/g, "");
  if (!(digitos.length === 10 || digitos.length === 11)) {
    return "Informe um telefone válido, com DDD (10 ou 11 dígitos, ex.: 51 987654321).";
  }
  return true;
});

// Placa veicular: só formato — placa não tem dígito verificador.
registrarValidador("placa", (valor) => {
  return Identificadores.placa(valor).ok
    ? true
    : "Informe uma placa válida, no formato antigo (ABC1234) ou Mercosul (ABC1D23).";
});

// Chassi (VIN): 17 caracteres com dígito verificador na 9ª posição. Como
// esse dígito é opcional fora da América do Norte, o validador recusa
// apenas o que está claramente malformado e deixa passar o dígito que não
// fecha — barrar um chassi verdadeiro seria pior que registrá-lo.
registrarValidador("chassi", (valor) => {
  const v = String(valor || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (v.length !== 17) return "O chassi (VIN) tem 17 caracteres.";
  if (/[IOQ]/.test(v)) return "O chassi não usa as letras I, O e Q — confira se não é 1 ou 0.";
  return true;
});

window.resolverValidador = resolverValidador;
