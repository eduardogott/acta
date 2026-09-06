/**
 * CONFERIDOR.JS
 * ---------------------------------------------------------------------------
 * Roda TODOS os verificadores de core/identificadores.js sobre o mesmo
 * valor e mostra o veredito de cada um. É de propósito: quem atende no
 * balcão costuma receber um número solto, sem saber o que ele é — dizer
 * "isto passa como IMEI e não passa como CPF" resolve mais do que exigir
 * que a pessoa escolha o tipo antes de colar.
 *
 * Os que passam sobem para o topo da lista; o resto fica embaixo, em
 * cinza, para não competir com a resposta.
 * ---------------------------------------------------------------------------
 */
(function () {
  "use strict";

  const el = {
    entrada: document.getElementById("entrada"),
    resumo: document.getElementById("resumo"),
    lista: document.getElementById("lista-conferencia"),
  };

  /**
   * Um tipo é "candidato" quando o valor tem a cara dele — mesmo número de
   * caracteres úteis. Serve só para ordenar a tela: um CPF errado merece
   * aparecer em cima com o motivo, enquanto "não é um UUID" é ruído.
   */
  function ehCandidato(chave, valor) {
    const digitos = valor.replace(/\D/g, "").length;
    const alfa = valor.replace(/[^a-zA-Z0-9]/g, "").length;
    switch (chave) {
      case "cpf": return digitos === 11;
      case "cnpj": return alfa === 14;
      case "imei": return digitos === 15;
      case "chassi": return alfa === 17;
      case "placa": return alfa === 7;
      case "titulo": return digitos === 12;
      case "pis": return digitos === 11;
      case "pix": return valor.includes("-") && alfa >= 30;
      default: return false;
    }
  }

  function criarLinha(tipo, resultado, candidato) {
    const li = document.createElement("li");
    li.className = "conferencia-item " +
      (resultado.ok ? "valido" : candidato ? "invalido" : "neutro");

    const marca = document.createElement("span");
    marca.className = "conferencia-marca";
    marca.textContent = resultado.ok ? "✓" : candidato ? "✕" : "–";
    marca.setAttribute("aria-hidden", "true");

    const corpo = document.createElement("div");
    corpo.className = "conferencia-corpo";

    const rotulo = document.createElement("div");
    rotulo.className = "conferencia-rotulo";
    rotulo.textContent = tipo.rotulo;

    const motivo = document.createElement("div");
    motivo.className = "conferencia-motivo";
    // Para os que nem são candidatos, o motivo técnico não interessa —
    // basta dizer que o formato é outro.
    motivo.textContent = resultado.ok || candidato ? resultado.motivo : "Formato diferente.";

    corpo.appendChild(rotulo);
    corpo.appendChild(motivo);
    li.appendChild(marca);
    li.appendChild(corpo);
    return li;
  }

  function conferir() {
    const valor = el.entrada.value.trim();
    el.lista.innerHTML = "";

    if (!valor) {
      el.resumo.textContent = "";
      el.resumo.className = "conferidor-resumo";
      return;
    }

    const linhas = window.Identificadores.TIPOS.map((tipo) => {
      const resultado = tipo.verificar(valor);
      return { tipo, resultado, candidato: ehCandidato(tipo.chave, valor) };
    });

    // Válidos primeiro, depois os que tinham a cara certa e falharam, e
    // por último os que nem se aplicam.
    const peso = (l) => (l.resultado.ok ? 0 : l.candidato ? 1 : 2);
    linhas.sort((a, b) => peso(a) - peso(b));

    const validos = linhas.filter((l) => l.resultado.ok);
    const quaseLa = linhas.filter((l) => !l.resultado.ok && l.candidato);

    if (validos.length > 0) {
      el.resumo.textContent = "Confere como " +
        validos.map((l) => l.tipo.rotulo).join(" ou ") + ".";
      el.resumo.className = "conferidor-resumo ok";
    } else if (quaseLa.length > 0) {
      el.resumo.textContent = "Tem o tamanho de " +
        quaseLa.map((l) => l.tipo.rotulo).join(" ou ") + ", mas não confere.";
      el.resumo.className = "conferidor-resumo erro";
    } else {
      el.resumo.textContent = "Não bate com nenhum dos formatos conhecidos.";
      el.resumo.className = "conferidor-resumo neutro";
    }

    linhas.forEach((l) => el.lista.appendChild(criarLinha(l.tipo, l.resultado, l.candidato)));
  }

  el.entrada.addEventListener("input", conferir);
  el.entrada.focus();
})();
