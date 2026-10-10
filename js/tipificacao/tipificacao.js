/**
 * TIPIFICACAO.JS
 * ---------------------------------------------------------------------------
 * Filtra e desenha a tabela de js/tipificacao/dados.js. Não sabe nada
 * sobre direito penal — todo o conteúdo está lá, e é lá que se edita.
 *
 * A busca é por termos soltos e sem acento: quem digita "art 155" acha o
 * "Art. 155", e quem digita "furto qualificado" só vê as linhas que têm
 * as duas palavras. Cada termo precisa aparecer em algum lugar da
 * entrada, na ordem que for. O resultado vem por relevância — primeiro o
 * que bate no nome do fato — e o termo aparece realçado onde casou.
 *
 * Na linha vai só a primeira frase da observação. O resto dela e o texto
 * do artigo (campo `texto`) ficam numa gaveta logo abaixo — a página
 * manda conferir no texto legal antes de tipificar, e é o mínimo que ela
 * tenha o texto à mão.
 *
 * Na coluna do artigo vai só o dispositivo ("Art. 121, § 2º, II") e,
 * embaixo, o diploma pelo número ("DL 2848"). Clicar no dispositivo copia
 * a referência compacta (campo `ref`, "Art. 121, §2, II - DL2848"): é o
 * formato que se cola no sistema de registro, e redigitá-lo à mão é onde
 * o parágrafo errado entra.
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
  // A linha já levou à folha de orientações do fato (campo `orientacoes`
  // da entrada). O link saiu da tela em outubro de 2026 — pesava na linha
  // —, mas o campo continua preenchido, e a página carrega
  // js/orientacoes/dados.js só para conferir que toda chave apontada
  // existe. Assim, se o link voltar, volta sobre um mapa que não
  // apodreceu; o código dele está no histórico do git.
  // -------------------------------------------------------------------

  const FOLHAS = {};
  (window.ORIENTACOES ? window.ORIENTACOES.tipos : []).forEach((t) => {
    FOLHAS[t.chave] = t.label;
  });

  window.TIPIFICACAO.forEach((e) => {
    if (e.orientacoes && !FOLHAS[e.orientacoes]) {
      log.aviso(
        e.fato + ' aponta para a folha "' + e.orientacoes +
          '", que não existe em js/orientacoes/dados.js.'
      );
    }
    if (!e.ref) log.aviso(e.fato + " está sem `ref` — clicar no artigo não copia nada.");
  });

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
   * O diploma pelo número, como vai embaixo do artigo: "DL 2848",
   * "L 11343". É o `codigo` da ref com um espaço depois da sigla — o
   * mesmo dado, para não haver um segundo a manter.
   */
  const NUMERO = {};
  DIPLOMAS.forEach((d) => { NUMERO[d.nome] = d.codigo.replace(/^([A-Z]+)(\d)/, "$1 $2"); });

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

  // -------------------------------------------------------------------
  // Busca em três camadas
  //
  // Com o texto do artigo em todas as linhas, "ameaça" passou a achar o
  // roubo e o estupro, que dizem "grave ameaça" no dispositivo — e a
  // tabela os mostrava antes da própria ameaça, só por virem antes no
  // Código. Agora cada termo é procurado camada por camada, e a linha vale
  // pela pior camada de que precisou:
  //
  //   0  o nome do fato e os sinônimos (`busca`) — o que a pessoa disse
  //   1  artigo, lei, grupo, pena, marcas e observação
  //   2  o texto do artigo
  //
  // Dentro de cada camada a ordem continua a da tabela, com os títulos de
  // grupo; entre uma camada e a seguinte, uma linha diz por que o resto
  // apareceu. O texto do artigo continua na busca: quem lembra "coisa
  // alheia móvel" e não lembra "furto" acha do mesmo jeito, só que no fim.
  //
  // O índice é montado uma vez: refazer as concatenações a cada tecla
  // seria refazer o mesmo trabalho trezentas vezes por letra.
  // -------------------------------------------------------------------

  /**
   * Uma camada normalizada, mais uma cópia sem espaço nenhum: "Art. 155"
   * normalizado fica "art 155", e quem digita "art155" (sem ponto e sem
   * espaço, que é o jeito rápido) não acharia nada sem ela.
   */
  function camada(partes) {
    const texto = normalizar(partes.filter(Boolean).join(" "));
    return { texto, colado: texto.replace(/ /g, "") };
  }

  const INDICE = window.TIPIFICACAO.map((entrada) => ({
    entrada,
    camadas: [
      camada([entrada.fato, entrada.busca]),
      // As marcas e o nome curto da lei entram para "hediondo" e "maria
      // da penha" acharem alguma coisa.
      camada([entrada.artigo, entrada.diploma, CURTO[entrada.diploma], entrada.ref,
              entrada.grupo, entrada.pena, entrada.obs,
              (entrada.marcas || []).map((m) => ROTULO_MARCA[m]).join(" ")]),
      camada([entrada.texto]),
    ],
  }));

  /** A pior camada de que a busca precisou, ou -1 se algum termo faltou. */
  function relevancia(camadas, termos) {
    let pior = 0;
    for (const termo of termos) {
      const onde = camadas.findIndex((c) => c.texto.includes(termo) || c.colado.includes(termo));
      if (onde < 0) return -1;
      if (onde > pior) pior = onde;
    }
    return pior;
  }

  // O que a linha entre uma camada e a seguinte diz.
  const ROTULO_CAMADA = [
    null,
    "Também casam pelo artigo, pela lei ou pela observação",
    "O termo só aparece no texto do artigo",
  ];

  // -------------------------------------------------------------------
  // Realce do termo buscado
  //
  // A busca casa no texto normalizado (sem acento, sem pontuação), mas o
  // realce tem de cair no texto original. Normalizando letra a letra, cada
  // posição do original tem a sua no normalizado — "Ameaça" vira "ameaca",
  // com o mesmo comprimento —, e o trecho achado lá é o trecho a marcar
  // aqui. Termo de uma letra só não se realça: marcaria a tela inteira.
  // -------------------------------------------------------------------

  function letraNormalizada(c) {
    const n = c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    return n.length === 1 && /[a-z0-9]/.test(n) ? n : " ";
  }

  /** O texto, com cada trecho que casa com um termo dentro de um <mark>. */
  function comRealce(texto, termos) {
    const fragmento = document.createDocumentFragment();
    let plano = "";
    for (let i = 0; i < texto.length; i++) plano += letraNormalizada(texto[i]);

    const trechos = [];
    termos.filter((t) => t.length > 1).forEach((termo) => {
      for (let i = plano.indexOf(termo); i >= 0; i = plano.indexOf(termo, i + 1)) {
        trechos.push([i, i + termo.length]);
      }
    });
    trechos.sort((a, b) => a[0] - b[0]);

    let pos = 0;
    trechos.forEach(([ini, fim]) => {
      if (fim <= pos) return;
      ini = Math.max(ini, pos);
      if (ini > pos) fragmento.appendChild(document.createTextNode(texto.slice(pos, ini)));
      const mark = document.createElement("mark");
      mark.textContent = texto.slice(ini, fim);
      fragmento.appendChild(mark);
      pos = fim;
    });
    if (pos < texto.length) fragmento.appendChild(document.createTextNode(texto.slice(pos)));
    return fragmento;
  }

  /** Algum termo casa com este texto? (para marcar o botão da gaveta) */
  function casa(texto, termos) {
    const n = normalizar(texto);
    return termos.some((t) => t.length > 1 && n.includes(t));
  }

  // -------------------------------------------------------------------
  // A observação na linha
  //
  // Só a primeira frase fica na linha; o resto vai para a gaveta, junto
  // com o texto do artigo. Por isso a primeira frase de cada `obs` é a que
  // mais importa no balcão, e citação de lei e mudança de pena vão no fim
  // (ver o cabeçalho do dados.js). Frase acaba em ponto seguido de
  // maiúscula: "art. 129" e "Lei 9.099/1995)," não cortam nada.
  // -------------------------------------------------------------------

  const FIM_DE_FRASE = /(?<=[.!?…])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/;

  function dividirObs(obs) {
    const m = FIM_DE_FRASE.exec(obs || "");
    if (!m) return { linha: obs || "", resto: "" };
    return { linha: obs.slice(0, m.index), resto: obs.slice(m.index + m[0].length) };
  }

  // -------------------------------------------------------------------
  // A gaveta: o resto da observação e o texto do artigo
  //
  // Escondida atrás de um botão porque a tabela existe para ACHAR o
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

  /** A linha escondida, na largura da tabela inteira. */
  function criarGaveta(e, resto, termos) {
    const tr = document.createElement("tr");
    tr.className = "tipificacao-texto-linha";

    const td = document.createElement("td");
    td.colSpan = colunas();

    if (resto) {
      const detalhe = document.createElement("p");
      detalhe.className = "tipificacao-detalhe";
      detalhe.appendChild(comRealce(resto, termos));
      td.appendChild(detalhe);
    }

    if (e.texto) {
      const fonte = document.createElement("span");
      fonte.className = "tipificacao-obs";
      fonte.textContent = e.artigo + " · " + (NUMERO[e.diploma] || e.diploma);

      const bloco = document.createElement("blockquote");
      bloco.className = "tipificacao-texto";
      // As quebras escritas no dados.js viram quebras na tela pelo CSS
      // (white-space: pre-line), sem montar um <p> por parágrafo aqui.
      bloco.appendChild(comRealce(e.texto, termos));

      td.appendChild(fonte);
      td.appendChild(bloco);
    }
    tr.appendChild(td);
    return tr;
  }

  /**
   * O botão que abre e fecha aquela gaveta, e mais nenhuma. Quando o termo
   * buscado não aparece na linha mas está lá dentro, o botão leva o mesmo
   * realce: é o aviso de que a linha apareceu por algo fora da vista. Se
   * o termo já está à vista, o aviso seria só barulho — o texto da lei
   * repete "ameaça" e "violência" em quase toda linha.
   */
  function criarBotaoDaGaveta(e, gaveta, resto, termos, avisar) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "tipificacao-ver-texto";
    if (avisar) botao.classList.add("com-termo");

    const oQue = resto && e.texto ? "mais e o texto do artigo"
      : e.texto ? "o texto do artigo"
      : "mais";

    const definir = (aberto) => {
      gaveta.classList.toggle("escondido", !aberto);
      botao.setAttribute("aria-expanded", String(aberto));
      botao.textContent = aberto ? "esconder" : "ver " + oQue;
      if (aberto) abertos.add(e);
      else abertos.delete(e);
    };

    botao.addEventListener("click", () => definir(gaveta.classList.contains("escondido")));
    definir(abertos.has(e));
    return botao;
  }

  /**
   * O dispositivo, que copia a referência compacta ao clicar. Tem cara de
   * texto e não de botão: a coluna mostra o artigo uma vez só, e a ref
   * fica no título, para quem passar o mouse.
   */
  function criarBotaoDaRef(e) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "tipificacao-ref";
    botao.textContent = e.artigo;
    botao.title = "Copiar " + e.ref;
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

  /** A linha que separa uma camada de relevância da seguinte. */
  function criarLinhaDaCamada(nivel) {
    const tr = document.createElement("tr");
    tr.className = "tipificacao-camada";
    const td = document.createElement("td");
    td.colSpan = colunas();
    td.textContent = ROTULO_CAMADA[nivel];
    tr.appendChild(td);
    return tr;
  }

  /**
   * A linha do fato e, quando há o que esconder, a gaveta logo abaixo.
   * Duas linhas de tabela, e não um bloco dentro da primeira: dentro da
   * célula "Fato" o texto ficaria espremido na largura daquela coluna.
   */
  function criarLinhas(e, termos) {
    const fragmento = document.createDocumentFragment();
    const tr = document.createElement("tr");
    if (e.ref) tr.dataset.ref = e.ref;

    const tdFato = document.createElement("td");
    const nome = document.createElement("span");
    nome.className = "tipificacao-fato";
    nome.appendChild(comRealce(e.fato, termos));
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

    const { linha, resto } = dividirObs(e.obs);
    if (linha) {
      const obs = document.createElement("span");
      obs.className = "tipificacao-obs";
      obs.appendChild(comRealce(linha, termos));
      tdFato.appendChild(obs);
    }
    // A gaveta nasce antes do botão porque é o botão que a conhece — e
    // mais ninguém.
    const gaveta = resto || e.texto ? criarGaveta(e, resto, termos) : null;
    if (gaveta) {
      const avisar = !casa(e.fato + " " + linha, termos) && casa(resto + " " + (e.texto || ""), termos);
      tdFato.appendChild(criarBotaoDaGaveta(e, gaveta, resto, termos, avisar));
    }

    const tdArtigo = document.createElement("td");
    tdArtigo.className = "tipificacao-artigo";
    tdArtigo.appendChild(e.ref ? criarBotaoDaRef(e) : document.createTextNode(e.artigo));
    const diploma = document.createElement("span");
    diploma.className = "tipificacao-diploma";
    diploma.textContent = NUMERO[e.diploma] || e.diploma;
    diploma.title = CURTO[e.diploma] || e.diploma;
    tdArtigo.appendChild(diploma);

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
    if (gaveta) fragmento.appendChild(gaveta);
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

    const encontrados = [];
    INDICE.forEach(({ entrada, camadas }) => {
      if (soJecrim && !entrada.jecrim) return;
      if (soCondicionada && entrada.acao !== "condicionada" && entrada.acao !== "privada") return;
      if (soDomestica && !(entrada.marcas || []).includes("domestica")) return;
      if (diploma && entrada.diploma !== diploma) return;
      const nivel = relevancia(camadas, termos);
      if (nivel >= 0) encontrados.push({ e: entrada, nivel });
    });
    // O sort é estável: dentro da mesma camada, fica a ordem da tabela.
    encontrados.sort((a, b) => a.nivel - b.nivel);

    // O título de grupo conta só os fatos daquela camada, que são os que
    // vêm logo abaixo dele.
    const porGrupo = {};
    encontrados.forEach(({ e, nivel }) => {
      const chave = nivel + "|" + e.grupo;
      porGrupo[chave] = (porGrupo[chave] || 0) + 1;
    });

    el.corpo.innerHTML = "";
    let nivelAtual = null;
    let grupoAtual = null;
    encontrados.forEach(({ e, nivel }) => {
      if (nivel !== nivelAtual) {
        // A primeira camada da tela não precisa de explicação.
        if (nivelAtual !== null) el.corpo.appendChild(criarLinhaDaCamada(nivel));
        nivelAtual = nivel;
        grupoAtual = null;
      }
      if (e.grupo && e.grupo !== grupoAtual) {
        grupoAtual = e.grupo;
        el.corpo.appendChild(criarLinhaDoGrupo(e.grupo, porGrupo[nivel + "|" + e.grupo]));
      }
      el.corpo.appendChild(criarLinhas(e, termos));
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
