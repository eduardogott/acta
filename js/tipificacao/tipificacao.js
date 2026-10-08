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
 *
 * A linha também leva à folha de orientações do fato, quando existe uma
 * (campo `orientacoes` da entrada). Quem consulta a tipificação está
 * atendendo alguém, e essa pessoa sai da delegacia com um papel na mão
 * — as duas páginas são o mesmo atendimento.
 *
 * E abre o texto do artigo, quando a entrada o traz (campo `texto`) — a
 * página manda conferir no texto legal antes de tipificar, e é o mínimo
 * que ela tenha o texto à mão.
 *
 * A referência compacta (campo `ref`, "Art. 121, §2, II - DL2848") vira
 * um botão que a copia: é o formato que se cola no sistema de registro,
 * e redigitá-lo à mão é onde o parágrafo errado entra.
 * ---------------------------------------------------------------------------
 */
(function () {
  "use strict";

  const log = window.Log.criar("tipificacao");

  const el = {
    busca: document.getElementById("busca"),
    jecrim: document.getElementById("filtro-jecrim"),
    condicionada: document.getElementById("filtro-condicionada"),
    domestica: document.getElementById("filtro-domestica"),
    diploma: document.getElementById("filtro-diploma"),
    corpo: document.getElementById("corpo-tabela"),
    contagem: document.getElementById("contagem"),
    semResultados: document.getElementById("sem-resultados"),
  };

  const DIPLOMAS = window.TIPIFICACAO_DIPLOMAS || [];

  // -------------------------------------------------------------------
  // Ponte para as orientações
  //
  // A página carrega js/orientacoes/dados.js só para isto: ter o rótulo
  // da folha e poder conferir, na carga, que toda chave apontada existe.
  // É a conferência que falta quando o mapa vive num arquivo e o alvo
  // noutro — sem ela, um tipo renomeado vira link quebrado que ninguém
  // percebe até o balcão.
  // -------------------------------------------------------------------

  const FOLHAS = {};
  (window.ORIENTACOES ? window.ORIENTACOES.tipos : []).forEach((t) => {
    FOLHAS[t.chave] = t.label;
  });

  window.TIPIFICACAO.forEach((e) => {
    if (e.orientacoes && !FOLHAS[e.orientacoes]) {
      log.aviso(
        e.fato + ' aponta para a folha "' + e.orientacoes +
          '", que não existe em js/orientacoes/dados.js — a linha fica sem link.'
      );
    }
    if (!e.ref) log.aviso(e.fato + " está sem `ref` — a linha fica sem o botão de copiar.");
  });

  /** Link para a folha do fato, ou null quando não há folha. */
  function linkDaFolha(e) {
    if (!e.orientacoes || !FOLHAS[e.orientacoes]) return null;
    const a = document.createElement("a");
    a.className = "tipificacao-folha";
    a.href = "orientacoes.html?tipo=" + encodeURIComponent(e.orientacoes);
    a.textContent = "Orientações: " + FOLHAS[e.orientacoes];
    a.title = "Abre a folha para imprimir e entregar ao comunicante";
    return a;
  }

  // -------------------------------------------------------------------
  // Prescrição da pretensão punitiva, pelo art. 109 do CP
  //
  // Calculada a partir da pena MÁXIMA em abstrato, que é o que a tabela
  // já traz — assim não há um segundo campo para manter em sincronia e
  // envelhecer separado do primeiro.
  //
  // O que este cálculo NÃO considera, e está dito na página: causas de
  // aumento e de diminuição que a entrada não trouxer já aplicadas na
  // faixa; e o art. 115, que reduz o prazo à metade para quem era menor
  // de 21 ao tempo do fato ou maior de 70 na data da sentença.
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

  // -------------------------------------------------------------------
  // Quem arbitra a fiança
  //
  // Deduzido, como a prescrição, da pena máxima: o delegado só concede
  // fiança até 4 anos (art. 322 do CPP); acima disso, só o juiz. Hediondo,
  // equiparado e o que a lei declara inafiançável não têm fiança nenhuma
  // (art. 5º, XLII a XLIV, da Constituição; art. 323 do CPP). No JECRIM
  // não há auto de prisão, há termo circunstanciado (art. 69 da Lei
  // 9.099/1995). E a entrada pode forçar o juiz quando a lei manda.
  //
  // É o ponto de partida, não a decisão: o art. 324 do CPP e o concurso
  // de crimes mudam a resposta no caso concreto, e a página diz isso.
  // -------------------------------------------------------------------

  const INAFIANCAVEIS = ["hediondo", "equiparado", "inafiancavel"];
  const LIMITE_FIANCA_DELEGADO = 4 * 12;

  /** { texto, classe } para a linha de baixo da pena, ou null. */
  function fiancaDe(e) {
    if (e.jecrim) return { texto: "termo circunstanciado", classe: "tc" };
    if ((e.marcas || []).some((m) => INAFIANCAVEIS.includes(m))) {
      return { texto: "inafiançável", classe: "inafiancavel" };
    }
    if (e.fianca === "juiz") return { texto: "fiança só pelo juiz", classe: "juiz" };
    const meses = penaMaximaEmMeses(e.pena);
    if (meses === null) return null;
    return meses <= LIMITE_FIANCA_DELEGADO
      ? { texto: "fiança pelo delegado", classe: "delegado" }
      : { texto: "fiança só pelo juiz", classe: "juiz" };
  }

  // Sem o "pública" na frente: a coluna já se chama "Ação penal", e a
  // etiqueta curta cabe sem empurrar a pena para fora da tela.
  const ROTULO_ACAO = {
    incondicionada: "incondicionada",
    condicionada: "condicionada",
    privada: "privada (queixa)",
    outra: "—",
  };

  // As marcas que viram etiqueta ao lado do nome, na ordem em que
  // aparecem. "jecrim" não é marca da entrada (é o campo booleano), mas
  // se desenha do mesmo jeito.
  const ROTULO_MARCA = {
    hediondo: "hediondo",
    equiparado: "equiparado a hediondo",
    inafiancavel: "inafiançável",
    domestica: "violência doméstica",
  };

  /** Nome curto do diploma, para o filtro e para a busca. */
  const CURTO = {};
  DIPLOMAS.forEach((d) => { CURTO[d.nome] = d.curto; });

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
  // digitada seria refazer o mesmo trabalho duzentas vezes por letra.
  const INDICE = window.TIPIFICACAO.map((entrada) => {
    // O dispositivo entra na busca: quem lembra "coisa alheia móvel" e
    // não lembra "furto" acha do mesmo jeito. As marcas e o nome curto da
    // lei também, para "hediondo" e "maria da penha" acharem alguma coisa.
    const texto = normalizar(
      [entrada.fato, entrada.artigo, entrada.diploma, CURTO[entrada.diploma],
       entrada.ref, entrada.grupo, entrada.pena, entrada.busca, entrada.obs,
       entrada.texto, (entrada.marcas || []).map((m) => ROTULO_MARCA[m]).join(" ")]
        .filter(Boolean)
        .join(" ")
    );
    // Segunda cópia sem espaço nenhum: "Art. 155" normalizado fica
    // "art 155", e quem digita "art155" (sem ponto e sem espaço, que é o
    // jeito rápido) não acharia nada sem isto.
    return { entrada, texto, colado: texto.replace(/ /g, "") };
  });

  // -------------------------------------------------------------------
  // O texto do artigo
  //
  // Escondido atrás de um botão porque a tabela existe para ACHAR o
  // artigo: o dispositivo inteiro em toda linha empurraria as outras
  // quatro colunas para fora da tela e transformaria uma consulta de dez
  // segundos numa leitura.
  //
  // Quais linhas estão abertas é lembrado enquanto a página vive. Sem
  // isso, digitar mais uma letra na busca fecharia o artigo que a pessoa
  // acabou de abrir — a tabela é redesenhada inteira a cada tecla.
  // -------------------------------------------------------------------

  const abertos = new Set();

  /** Quantas colunas uma linha que atravessa a tabela precisa ocupar. */
  function colunas() {
    return document.querySelectorAll(".tabela-tipificacao thead th").length || 1;
  }

  /** A linha escondida com o dispositivo, na largura da tabela inteira. */
  function criarLinhaDoTexto(e) {
    const tr = document.createElement("tr");
    tr.className = "tipificacao-texto-linha";

    const td = document.createElement("td");
    td.colSpan = colunas();

    const fonte = document.createElement("span");
    fonte.className = "tipificacao-obs";
    fonte.textContent = e.artigo + " · " + e.diploma;

    const bloco = document.createElement("blockquote");
    bloco.className = "tipificacao-texto";
    // As quebras escritas no dados.js viram quebras na tela pelo CSS
    // (white-space: pre-line), sem montar um <p> por parágrafo aqui.
    bloco.textContent = e.texto;

    td.appendChild(fonte);
    td.appendChild(bloco);
    tr.appendChild(td);
    return tr;
  }

  /** O botão que abre e fecha aquela linha, e mais nenhuma. */
  function criarBotaoDoTexto(e, linhaTexto) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "tipificacao-ver-texto";

    const definir = (aberto) => {
      linhaTexto.classList.toggle("escondido", !aberto);
      botao.setAttribute("aria-expanded", String(aberto));
      botao.textContent = aberto ? "esconder o texto do artigo" : "ver o texto do artigo";
      if (aberto) abertos.add(e);
      else abertos.delete(e);
    };

    botao.addEventListener("click", () => definir(linhaTexto.classList.contains("escondido")));
    definir(abertos.has(e));
    return botao;
  }

  /** O botão com a referência compacta, que a copia ao clicar. */
  function criarBotaoDaRef(e) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "tipificacao-ref";
    botao.textContent = e.ref;
    botao.title = "Copiar a referência";
    botao.addEventListener("click", () => window.Copiar.copiarComFeedback(botao, e.ref));
    return botao;
  }

  function criarEtiqueta(texto, classe) {
    const span = document.createElement("span");
    span.className = "etiqueta " + classe;
    span.textContent = texto;
    return span;
  }

  /** A linha de título de um grupo, com quantos fatos dele estão na tela. */
  function criarLinhaDoGrupo(nome, quantos) {
    const tr = document.createElement("tr");
    tr.className = "tipificacao-grupo";
    const th = document.createElement("th");
    th.colSpan = colunas();
    th.scope = "colgroup";
    th.textContent = nome;
    const n = document.createElement("span");
    n.className = "tipificacao-grupo-n";
    n.textContent = quantos;
    th.appendChild(n);
    tr.appendChild(th);
    return tr;
  }

  /**
   * A linha do fato e, quando a entrada traz o dispositivo, a linha
   * escondida com ele logo abaixo. Duas linhas de tabela, e não um bloco
   * dentro da primeira: dentro da célula "Fato" o texto ficaria espremido
   * na largura daquela coluna.
   */
  function criarLinhas(e) {
    const fragmento = document.createDocumentFragment();
    const tr = document.createElement("tr");
    if (e.ref) tr.dataset.ref = e.ref;

    const tdFato = document.createElement("td");
    const nome = document.createElement("span");
    nome.className = "tipificacao-fato";
    nome.textContent = e.fato;
    tdFato.appendChild(nome);

    const etiquetas = [];
    if (e.jecrim) etiquetas.push(criarEtiqueta("jecrim", "jecrim"));
    Object.keys(ROTULO_MARCA).forEach((m) => {
      if ((e.marcas || []).includes(m)) etiquetas.push(criarEtiqueta(ROTULO_MARCA[m], m));
    });
    if (etiquetas.length) {
      const linha = document.createElement("span");
      linha.className = "tipificacao-etiquetas";
      etiquetas.forEach((et) => linha.appendChild(et));
      tdFato.appendChild(linha);
    }

    if (e.obs) {
      const obs = document.createElement("span");
      obs.className = "tipificacao-obs";
      obs.textContent = e.obs;
      tdFato.appendChild(obs);
    }
    // A linha do texto nasce antes do botão porque é o botão que a
    // conhece — e mais ninguém.
    const linhaTexto = e.texto ? criarLinhaDoTexto(e) : null;
    if (linhaTexto) tdFato.appendChild(criarBotaoDoTexto(e, linhaTexto));

    const folha = linkDaFolha(e);
    if (folha) tdFato.appendChild(folha);

    const tdArtigo = document.createElement("td");
    tdArtigo.className = "tipificacao-artigo";
    tdArtigo.appendChild(document.createTextNode(e.artigo));
    const diploma = document.createElement("span");
    diploma.className = "tipificacao-obs";
    diploma.textContent = e.diploma;
    tdArtigo.appendChild(diploma);
    if (e.ref) tdArtigo.appendChild(criarBotaoDaRef(e));

    const tdPena = document.createElement("td");
    tdPena.appendChild(document.createTextNode(e.pena));
    const fianca = fiancaDe(e);
    if (fianca) {
      const span = document.createElement("span");
      span.className = "tipificacao-fianca " + fianca.classe;
      span.textContent = fianca.texto;
      tdPena.appendChild(span);
    }

    const tdPrescricao = document.createElement("td");
    tdPrescricao.className = "tipificacao-artigo";
    tdPrescricao.textContent = prescricaoDe(e);

    const tdAcao = document.createElement("td");
    if (e.acao === "outra") {
      tdAcao.textContent = ROTULO_ACAO.outra;
    } else {
      tdAcao.appendChild(criarEtiqueta(ROTULO_ACAO[e.acao], e.acao));
    }

    tr.appendChild(tdFato);
    tr.appendChild(tdArtigo);
    tr.appendChild(tdPena);
    tr.appendChild(tdPrescricao);
    tr.appendChild(tdAcao);

    fragmento.appendChild(tr);
    if (linhaTexto) fragmento.appendChild(linhaTexto);
    return fragmento;
  }

  // O filtro de diploma só oferece o que a tabela tem: lei cadastrada em
  // DIPLOMAS sem nenhuma entrada seria uma opção que sempre volta vazia.
  const presentes = new Set(window.TIPIFICACAO.map((e) => e.diploma));
  DIPLOMAS.filter((d) => presentes.has(d.nome)).forEach((d) => {
    const opcao = document.createElement("option");
    opcao.value = d.nome;
    opcao.textContent = d.curto;
    el.diploma.appendChild(opcao);
  });

  function filtrar() {
    const termos = normalizar(el.busca.value).split(" ").filter(Boolean);
    const soJecrim = el.jecrim.checked;
    const soCondicionada = el.condicionada.checked;
    const soDomestica = el.domestica.checked;
    const diploma = el.diploma.value;

    const encontrados = INDICE.filter(({ entrada, texto, colado }) => {
      if (soJecrim && !entrada.jecrim) return false;
      if (soCondicionada && entrada.acao !== "condicionada" && entrada.acao !== "privada") return false;
      if (soDomestica && !(entrada.marcas || []).includes("domestica")) return false;
      if (diploma && entrada.diploma !== diploma) return false;
      return termos.every((termo) => texto.includes(termo) || colado.includes(termo));
    }).map((i) => i.entrada);

    const porGrupo = {};
    encontrados.forEach((e) => { porGrupo[e.grupo] = (porGrupo[e.grupo] || 0) + 1; });

    el.corpo.innerHTML = "";
    let grupoAtual = null;
    encontrados.forEach((e) => {
      if (e.grupo && e.grupo !== grupoAtual) {
        grupoAtual = e.grupo;
        el.corpo.appendChild(criarLinhaDoGrupo(e.grupo, porGrupo[e.grupo]));
      }
      el.corpo.appendChild(criarLinhas(e));
    });

    // O termo buscado é nome de crime, não dado de vítima — pode ir junto.
    log.debug('Busca "' + el.busca.value + '":', encontrados.length, "de", window.TIPIFICACAO.length);

    el.semResultados.classList.toggle("escondido", encontrados.length > 0);
    el.contagem.textContent =
      encontrados.length === window.TIPIFICACAO.length
        ? window.TIPIFICACAO.length + " fatos na tabela"
        : encontrados.length + " de " + window.TIPIFICACAO.length;
  }

  log.info(
    "Tabela carregada:", window.TIPIFICACAO.length, "fatos,",
    window.TIPIFICACAO.filter((e) => e.orientacoes).length, "com folha de orientações,",
    window.TIPIFICACAO.filter((e) => e.texto).length, "com o texto do artigo."
  );

  el.busca.addEventListener("input", filtrar);
  el.jecrim.addEventListener("change", filtrar);
  el.condicionada.addEventListener("change", filtrar);
  el.domestica.addEventListener("change", filtrar);
  el.diploma.addEventListener("change", filtrar);

  filtrar();
  el.busca.focus();
})();
