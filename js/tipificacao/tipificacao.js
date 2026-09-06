/**
 * TIPIFICACAO.JS
 * ---------------------------------------------------------------------------
 * Filtra e desenha a tabela de js/tipificacao/dados.js. Não sabe nada
 * sobre direito penal — todo o conteúdo está lá, e é lá que se edita.
 *
 * A busca é por termos soltos e sem acento: quem digita "art 155" acha o
 * "Art. 155", e quem digita "furto qualificado" só vê as linhas que têm
 * as duas palavras. Cada termo precisa aparecer em algum lugar da
 * entrada, na ordem que for.
 * ---------------------------------------------------------------------------
 */
(function () {
  "use strict";

  const el = {
    busca: document.getElementById("busca"),
    jecrim: document.getElementById("filtro-jecrim"),
    condicionada: document.getElementById("filtro-condicionada"),
    corpo: document.getElementById("corpo-tabela"),
    contagem: document.getElementById("contagem"),
    semResultados: document.getElementById("sem-resultados"),
  };

  // -------------------------------------------------------------------
  // Prescrição da pretensão punitiva, pelo art. 109 do CP
  //
  // Calculada a partir da pena MÁXIMA em abstrato, que é o que a tabela
  // já traz — assim não há um segundo campo para manter em sincronia e
  // envelhecer separado do primeiro.
  //
  // O que este cálculo NÃO considera, e está dito na página: causas de
  // aumento e de diminuição, que mudam a pena máxima; e o art. 115, que
  // reduz o prazo à metade para quem era menor de 21 ao tempo do fato ou
  // maior de 70 na data da sentença.
  // -------------------------------------------------------------------

  const MESES_POR_UNIDADE = { dia: 1 / 30, dias: 1 / 30, mes: 1, mês: 1, meses: 1, ano: 12, anos: 12 };

  // "de 3 meses a 1 ano", "de 15 dias a 2 meses", "de 2 a 4 anos".
  // A unidade do limite inferior pode faltar ("de 2 a 4 anos"); a do
  // superior nunca falta, e é a que interessa.
  const FAIXA_DE_PENA = /de\s+\d+\s*(?:dias?|m[eê]s|meses|anos?)?\s+a\s+(\d+)\s*(dias?|m[eê]s|meses|anos?)/gi;

  /** Maior pena máxima citada no texto, em meses. null = não deu para ler. */
  function penaMaximaEmMeses(pena) {
    let maior = null;
    let achado;
    FAIXA_DE_PENA.lastIndex = 0;
    while ((achado = FAIXA_DE_PENA.exec(pena)) !== null) {
      const quantidade = Number(achado[1]);
      const unidade = achado[2].toLowerCase().replace(/s$/, "");
      const fator = MESES_POR_UNIDADE[unidade] ?? MESES_POR_UNIDADE[unidade + "s"];
      if (!fator) continue;
      const meses = quantidade * fator;
      if (maior === null || meses > maior) maior = meses;
    }
    return maior;
  }

  /** Art. 109 do CP: da pena máxima para o prazo prescricional. */
  function prazoDoArt109(meses) {
    const anos = meses / 12;
    if (anos > 12) return "20 anos";
    if (anos > 8) return "16 anos";
    if (anos > 4) return "12 anos";
    if (anos > 2) return "8 anos";
    if (anos >= 1) return "4 anos";
    return "3 anos";
  }

  /** O que mostrar na coluna. A entrada pode trazer o valor pronto. */
  function prescricaoDe(entrada) {
    if (entrada.prescricao) return entrada.prescricao;
    const meses = penaMaximaEmMeses(entrada.pena);
    return meses === null ? "—" : prazoDoArt109(meses);
  }

  const ROTULO_ACAO = {
    incondicionada: "Pública incondicionada",
    condicionada: "Pública condicionada",
    privada: "Privada (queixa)",
    outra: "—",
  };

  /**
   * Tira acento, pontuação e caixa, para "art. 155", "Art 155" e
   * "ART.155" caírem todos na mesma string.
   */
  function normalizar(texto) {
    return String(texto || "")
      .normalize("NFD")
      // U+0300–U+036F é o bloco dos acentos que o NFD separou da letra
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Índice de busca montado uma vez: refazer a concatenação a cada tecla
  // digitada seria refazer o mesmo trabalho oitenta vezes por letra.
  const INDICE = window.TIPIFICACAO.map((entrada) => {
    const texto = normalizar(
      [entrada.fato, entrada.artigo, entrada.diploma, entrada.pena, entrada.busca, entrada.obs]
        .filter(Boolean)
        .join(" ")
    );
    // Segunda cópia sem espaço nenhum: "Art. 155" normalizado fica
    // "art 155", e quem digita "art155" (sem ponto e sem espaço, que é o
    // jeito rápido) não acharia nada sem isto.
    return { entrada, texto, colado: texto.replace(/ /g, "") };
  });

  function criarEtiqueta(texto, classe) {
    const span = document.createElement("span");
    span.className = "etiqueta " + classe;
    span.textContent = texto;
    return span;
  }

  function criarLinha(e) {
    const tr = document.createElement("tr");

    const tdFato = document.createElement("td");
    const nome = document.createElement("span");
    nome.className = "tipificacao-fato";
    nome.textContent = e.fato;
    tdFato.appendChild(nome);
    if (e.jecrim) {
      tdFato.appendChild(document.createTextNode(" "));
      tdFato.appendChild(criarEtiqueta("jecrim", "jecrim"));
    }
    if (e.obs) {
      const obs = document.createElement("span");
      obs.className = "tipificacao-obs";
      obs.textContent = e.obs;
      tdFato.appendChild(obs);
    }

    const tdArtigo = document.createElement("td");
    tdArtigo.className = "tipificacao-artigo";
    tdArtigo.textContent = e.artigo;
    const diploma = document.createElement("span");
    diploma.className = "tipificacao-obs";
    diploma.textContent = e.diploma;
    tdArtigo.appendChild(diploma);

    const tdPena = document.createElement("td");
    tdPena.textContent = e.pena;

    const tdPrescricao = document.createElement("td");
    tdPrescricao.className = "tipificacao-artigo";
    tdPrescricao.textContent = prescricaoDe(e);

    const tdAcao = document.createElement("td");
    if (e.acao === "incondicionada" || e.acao === "outra") {
      tdAcao.textContent = ROTULO_ACAO[e.acao];
    } else {
      tdAcao.appendChild(criarEtiqueta(ROTULO_ACAO[e.acao], e.acao));
    }

    tr.appendChild(tdFato);
    tr.appendChild(tdArtigo);
    tr.appendChild(tdPena);
    tr.appendChild(tdPrescricao);
    tr.appendChild(tdAcao);
    return tr;
  }

  function filtrar() {
    const termos = normalizar(el.busca.value).split(" ").filter(Boolean);
    const soJecrim = el.jecrim.checked;
    const soCondicionada = el.condicionada.checked;

    const encontrados = INDICE.filter(({ entrada, texto, colado }) => {
      if (soJecrim && !entrada.jecrim) return false;
      if (soCondicionada && entrada.acao !== "condicionada" && entrada.acao !== "privada") return false;
      return termos.every((termo) => texto.includes(termo) || colado.includes(termo));
    }).map((i) => i.entrada);

    el.corpo.innerHTML = "";
    encontrados.forEach((e) => el.corpo.appendChild(criarLinha(e)));

    el.semResultados.classList.toggle("escondido", encontrados.length > 0);
    el.contagem.textContent =
      encontrados.length === window.TIPIFICACAO.length
        ? window.TIPIFICACAO.length + " fatos na tabela"
        : encontrados.length + " de " + window.TIPIFICACAO.length;
  }

  el.busca.addEventListener("input", filtrar);
  el.jecrim.addEventListener("change", filtrar);
  el.condicionada.addEventListener("change", filtrar);

  filtrar();
  el.busca.focus();
})();
