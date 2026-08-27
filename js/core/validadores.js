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
  const digitos = String(valor || "").replace(/\D/g, "");
  if (digitos.length === 11 || digitos.length === 14) return true;
  return "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido, SEM pontuação.";
});

registrarValidador("numeroPositivo", (valor) => {
  const n = Number(valor);
  return !Number.isNaN(n) && n > 0 ? true : "Informe um número maior que zero.";
});

window.resolverValidador = resolverValidador;
