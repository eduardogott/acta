/**
 * CONVERSAS.JS
 * ---------------------------------------------------------------------------
 * Transforma a exportação bruta de uma conversa numa transcrição
 * numerada, pronta para anexar.
 *
 * O problema que resolve: a vítima chega com o "Exportar conversa" do
 * WhatsApp — centenas de linhas com data, hora, telefone e o texto tudo
 * junto — e alguém teria de reescrever isso à mão, numerando e trocando
 * os nomes. Aqui é colar de um lado e copiar do outro.
 *
 * Nada é enviado a lugar nenhum: o texto colado só existe nesta aba.
 *
 * FORMATOS RECONHECIDOS
 * O WhatsApp muda a pontuação conforme o sistema e a região, então em vez
 * de uma expressão por versão há uma lista de padrões tentados em ordem.
 * Uma linha que não casa com nenhum é tratada como continuação da
 * mensagem anterior — é assim que mensagens de várias linhas sobrevivem.
 * ---------------------------------------------------------------------------
 */
(function () {
  "use strict";

  /**
   * Cada padrão devolve, nos grupos: data, hora, autor, texto.
   *
   * 1. Android e exportação por e-mail:  "06/09/2026 14:32 - Fulano: oi"
   * 2. iPhone e Android recentes:        "[06/09/2026 14:32:10] Fulano: oi"
   *
   * Ambos aceitam data com "/" ou ".", hora com ou sem segundos, e AM/PM.
   * O "‎" invisível no começo do segundo padrão é a marca de direção que
   * o iOS insere no início de cada linha — sem ela na expressão, nenhuma
   * linha de export de iPhone casaria.
   */
  const PADROES = [
    {
      nome: "whatsapp-hifen",
      re: /^(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})[,]?\s+(\d{1,2}:\d{2}(?::\d{2})?)\s*(?:[AaPp]\.?[Mm]\.?)?\s*[-–—]\s*([^:]{1,80}?):\s?([\s\S]*)$/,
      grupos: { data: 1, hora: 2, autor: 3, texto: 4 },
    },
    {
      nome: "whatsapp-colchete",
      re: /^‎?\[(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})[,]?\s+(\d{1,2}:\d{2}(?::\d{2})?)\s*(?:[AaPp]\.?[Mm]\.?)?\]\s*([^:]{1,80}?):\s?([\s\S]*)$/,
      grupos: { data: 1, hora: 2, autor: 3, texto: 4 },
    },
  ];

  // Linhas que o WhatsApp insere sozinho e que não são mensagem de
  // ninguém. Não somem: viram nota, porque "a criptografia mudou" pode
  // significar troca de aparelho, e isso às vezes importa.
  const RE_SISTEMA = /(criptografia de ponta a ponta|Mensagens e ligações são protegidas|adicionou|saiu do grupo|criou o grupo|mudou o nome|alterou o código de segurança|Você foi adicionado)/i;

  // Marcadores de anexo. Viram uma nota explícita, porque um "arquivo de
  // mídia oculto" no meio da conversa é justamente o que a autoridade
  // precisa saber que existe.
  const RE_ANEXO = /(<M[ií]dia oculta>|<anexado:|arquivo de m[ií]dia oculto|imagem ocultada|áudio ocultado|v[ií]deo omitido|figurinha omitida|GIF omitido|documento omitido)/i;

  const el = {
    entrada: document.getElementById("entrada"),
    autores: document.getElementById("autores"),
    numerar: document.getElementById("op-numerar"),
    unificar: document.getElementById("op-unificar"),
    ocultarSistema: document.getElementById("op-sistema"),
    cabecalho: document.getElementById("op-cabecalho"),
    rotuloFormato: document.getElementById("rotulo-formato"),
    rotuloSaida: document.getElementById("rotulo-saida"),
    saida: document.getElementById("saida"),
    resumo: document.getElementById("resumo"),
    painelSaida: document.getElementById("painel-saida"),
    btnCopiar: document.getElementById("btn-copiar"),
    btnBaixar: document.getElementById("btn-baixar"),
    btnLimpar: document.getElementById("btn-limpar"),
  };

  // Papel atribuído a cada autor encontrado, na ordem em que aparecem.
  // Vive fora do parse porque o usuário edita depois de ver a lista.
  const papeis = new Map();

  // ------------------------------------------------------------- parse ---

  function casar(linha) {
    for (const padrao of PADROES) {
      const achado = padrao.re.exec(linha);
      if (achado) {
        return {
          data: achado[padrao.grupos.data],
          hora: achado[padrao.grupos.hora],
          autor: achado[padrao.grupos.autor].trim(),
          texto: achado[padrao.grupos.texto],
        };
      }
    }
    return null;
  }

  /** Data em qualquer separador → "dd/mm/aaaa", com ano de quatro dígitos. */
  function normalizarData(data) {
    const partes = data.split(/[\/.]/);
    if (partes.length !== 3) return data;
    let [d, m, a] = partes;
    if (a.length === 2) a = (Number(a) > 70 ? "19" : "20") + a;
    return d.padStart(2, "0") + "/" + m.padStart(2, "0") + "/" + a;
  }

  function analisar(bruto) {
    const linhas = String(bruto || "").split(/\r?\n/);
    const mensagens = [];

    linhas.forEach((linha) => {
      const casado = casar(linha);
      if (casado) {
        mensagens.push({
          data: normalizarData(casado.data),
          hora: casado.hora,
          autor: casado.autor,
          texto: casado.texto,
          sistema: false,
        });
        return;
      }

      const limpa = linha.trim();
      if (!limpa) return;

      if (mensagens.length === 0) {
        // Antes da primeira mensagem datada só costuma vir o aviso de
        // criptografia; guardamos como linha de sistema sem autor.
        mensagens.push({ data: null, hora: null, autor: null, texto: limpa, sistema: true });
        return;
      }
      // Continuação: mensagem de várias linhas.
      const ultima = mensagens[mensagens.length - 1];
      ultima.texto += "\n" + limpa;
    });

    // O aviso de criptografia costuma vir grudado na primeira mensagem
    // real; marcá-lo depois do parse é mais simples que prevê-lo antes.
    mensagens.forEach((m) => {
      if (!m.sistema && m.autor === null) m.sistema = true;
      if (RE_SISTEMA.test(m.texto) && m.texto.length < 200) m.sistema = true;
    });

    return mensagens;
  }

  // ----------------------------------------------------------- autores ---

  function autoresDe(mensagens) {
    const vistos = [];
    mensagens.forEach((m) => {
      if (m.sistema || !m.autor) return;
      if (!vistos.includes(m.autor)) vistos.push(m.autor);
    });
    return vistos;
  }

  /**
   * Desenha um campo por autor, para o usuário trocar "Fulano" e
   * "+55 51 9…" por COMUNICANTE e AUTOR. É o passo que transforma um
   * despejo de conversa em peça de inquérito.
   */
  function renderAutores(lista) {
    el.autores.innerHTML = "";
    if (lista.length === 0) return;

    lista.forEach((autor, i) => {
      const linha = document.createElement("div");
      linha.className = "campo-inline autor-linha";

      const rotulo = document.createElement("label");
      rotulo.textContent = autor;
      rotulo.htmlFor = "autor-" + i;

      const campo = document.createElement("input");
      campo.type = "text";
      campo.id = "autor-" + i;
      campo.placeholder = i === 0 ? "COMUNICANTE" : "AUTOR";
      campo.value = papeis.get(autor) || "";
      campo.addEventListener("input", () => {
        papeis.set(autor, campo.value);
        renderSaida();
      });

      linha.appendChild(rotulo);
      linha.appendChild(campo);
      el.autores.appendChild(linha);
    });
  }

  function nomeExibido(autor) {
    const papel = (papeis.get(autor) || "").trim();
    return papel || autor;
  }

  // ------------------------------------------------------------ saída ---

  function montarTexto(mensagens) {
    const numerar = el.numerar.checked;
    const unificar = el.unificar.checked;
    const semSistema = el.ocultarSistema.checked;

    const linhas = [];
    let n = 0;
    let dataAnterior = null;
    let autorAnterior = null;

    mensagens.forEach((m) => {
      if (m.sistema) {
        if (semSistema) return;
        linhas.push("(sistema) " + m.texto.replace(/\n/g, " "));
        autorAnterior = null;
        return;
      }

      // Um cabeçalho por dia: repetir a data em cada linha de uma
      // conversa de três meses só atrapalha a leitura.
      if (m.data && m.data !== dataAnterior) {
        if (linhas.length > 0) linhas.push("");
        linhas.push("— " + m.data + " —");
        dataAnterior = m.data;
        autorAnterior = null;
      }

      const texto = RE_ANEXO.test(m.texto)
        ? m.texto.replace(/\n/g, " ") + "  [ANEXO — o arquivo não vem na exportação]"
        : m.texto.replace(/\n/g, " ");

      const prefixo = numerar ? ++n + ". " : "";
      // "unificar" agrupa mensagens seguidas da mesma pessoa: no
      // WhatsApp uma frase costuma sair em cinco balões.
      const cabecalho =
        unificar && m.autor === autorAnterior
          ? " ".repeat(prefixo.length) + "  "
          : prefixo + "[" + m.hora + "] " + nomeExibido(m.autor) + ": ";

      linhas.push(cabecalho + texto);
      autorAnterior = m.autor;
    });

    if (!el.cabecalho.checked) return linhas.join("\n");

    const comMensagem = mensagens.filter((m) => !m.sistema && m.data);
    const primeira = comMensagem[0];
    const ultima = comMensagem[comMensagem.length - 1];
    const cabecalho = [
      "TRANSCRIÇÃO DE CONVERSA",
      "",
      "Mensagens: " + comMensagem.length,
      "Período: " +
        (primeira ? primeira.data + " " + primeira.hora : "?") +
        " a " +
        (ultima ? ultima.data + " " + ultima.hora : "?"),
      "Participantes: " + autoresDe(mensagens).map(nomeExibido).join(", "),
      "",
      "Transcrição fiel do arquivo apresentado, sem alteração de conteúdo.",
      "",
      "----------------------------------------",
      "",
    ];
    return cabecalho.join("\n") + linhas.join("\n");
  }

  let ultimaAnalise = [];

  /**
   * O passo "quem é quem" só existe depois de reconhecer alguém, então a
   * numeração dos passos seguintes anda junto — sem isso a tela mostra
   * 1, 3, 4, o que faz parecer que algo sumiu.
   */
  function renumerarPassos() {
    const temParticipantes = el.autores.children.length > 0;
    el.rotuloFormato.textContent = (temParticipantes ? "3." : "2.") + " Formato";
    el.rotuloSaida.textContent =
      (temParticipantes ? "4." : "3.") + " Transcrição — confira antes de usar";
  }

  function renderSaida() {
    const texto = montarTexto(ultimaAnalise);
    el.saida.value = texto;
    el.painelSaida.classList.toggle("escondido", ultimaAnalise.length === 0);
    renumerarPassos();
  }

  function processar() {
    const bruto = el.entrada.value;
    if (!bruto.trim()) {
      ultimaAnalise = [];
      papeis.clear();
      el.autores.innerHTML = "";
      el.resumo.textContent = "";
      el.painelSaida.classList.add("escondido");
      renumerarPassos();
      return;
    }

    ultimaAnalise = analisar(bruto);
    const reais = ultimaAnalise.filter((m) => !m.sistema);
    const autores = autoresDe(ultimaAnalise);

    // Autores que sumiram entre uma colagem e outra não devem manter o
    // papel antigo pendurado.
    Array.from(papeis.keys()).forEach((a) => {
      if (!autores.includes(a)) papeis.delete(a);
    });

    if (reais.length === 0) {
      el.resumo.className = "status-linha erro";
      el.resumo.textContent =
        "Não reconheci nenhuma mensagem. Esta página espera a exportação do WhatsApp " +
        '("Exportar conversa" → "Sem mídia"), em que cada linha começa com data e hora.';
      el.autores.innerHTML = "";
      el.painelSaida.classList.add("escondido");
      renumerarPassos();
      return;
    }

    el.resumo.className = "status-linha";
    el.resumo.textContent =
      reais.length + " mensagens de " + autores.length + " participante(s)" +
      (reais[0].data ? ", de " + reais[0].data + " a " + reais[reais.length - 1].data : "") + ".";

    renderAutores(autores);
    renderSaida();
  }

  // ----------------------------------------------------------- eventos ---

  el.entrada.addEventListener("input", processar);
  [el.numerar, el.unificar, el.ocultarSistema, el.cabecalho].forEach((op) =>
    op.addEventListener("change", renderSaida)
  );

  el.btnCopiar.addEventListener("click", () => {
    window.Copiar.copiarComFeedback(el.btnCopiar, el.saida.value, { campo: el.saida });
  });

  el.btnBaixar.addEventListener("click", () => {
    const blob = new Blob([el.saida.value], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transcricao_conversa.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  });

  el.btnLimpar.addEventListener("click", () => {
    el.entrada.value = "";
    processar();
    el.entrada.focus();
  });

  el.entrada.focus();
})();
