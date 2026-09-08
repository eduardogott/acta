/**
 * TRANSCRICAO.JS
 * ---------------------------------------------------------------------------
 * A página. Toda a inferência acontece em js/transcricao/worker.js — aqui
 * ficam a escolha do arquivo, a decodificação do áudio e a apresentação.
 *
 * A decodificação é feita pelo próprio navegador (Web Audio API), e não
 * pelo ffmpeg: o Whisper quer um vetor de amostras em 16 kHz mono, que é
 * exatamente o que sai de um OfflineAudioContext, e assim esta página não
 * precisa dos 32 MB do motor de conversão. O preço é que o navegador não
 * sabe abrir .mkv, .avi nem .wma — para esses, a página manda o usuário
 * extrair o áudio no conversor e voltar.
 * ---------------------------------------------------------------------------
 */
(function () {
  "use strict";

  const log = window.Log.criar("transcricao");

  // Taxa de amostragem do Whisper, lista de modelos e limite de duração:
  // js/configuracoes.js, seção 9.
  const { TAXA_ALVO, MODELOS, AVISO_DURACAO_S } = window.Config.TRANSCRICAO;

  const el = {
    painelArquivo: document.getElementById("painel-arquivo"),
    input: document.getElementById("input-arquivo"),
    infoArquivo: document.getElementById("info-arquivo"),
    modeloLista: document.getElementById("modelo-lista"),
    comTempos: document.getElementById("com-tempos"),
    btnTranscrever: document.getElementById("btn-transcrever"),
    btnParar: document.getElementById("btn-parar"),
    btnLimpar: document.getElementById("btn-limpar"),
    painelStatus: document.getElementById("painel-status"),
    statusTexto: document.getElementById("status-texto"),
    barra: document.getElementById("barra"),
    barraPreenchida: document.getElementById("barra-preenchida"),
    painelResultado: document.getElementById("painel-resultado"),
    texto: document.getElementById("texto-transcrito"),
    btnCopiar: document.getElementById("btn-copiar"),
    btnBaixar: document.getElementById("btn-baixar"),
  };

  // Última resposta do worker, para o botão "marcar tempos" reformatar o
  // texto sem rodar a transcrição de novo.
  let ultimaSaida = null;

  const estado = {
    arquivo: null,
    audio: null, // Float32Array em 16 kHz mono
    duracao: 0,
    modelo: (MODELOS.find((m) => m.padrao) || MODELOS[0]).id,
    rodando: false,
    inicio: 0,
    relogio: null,
  };

  let worker = null;

  // --------------------------------------------------------------- utilidades

  // Compartilhadas com o conversor — ver js/comum/formatos.js.
  const { humanSize, formatarTempo } = window.Formatos;


  function setStatus(texto, classe) {
    el.painelStatus.classList.remove("escondido");
    el.statusTexto.textContent = texto;
    el.statusTexto.className = "status-linha" + (classe ? " " + classe : "");
  }

  function setBarra(fracao) {
    if (fracao === null) {
      el.barra.classList.add("escondido");
      return;
    }
    el.barra.classList.remove("escondido");
    el.barraPreenchida.style.width = Math.round(Math.min(1, fracao) * 100) + "%";
  }

  // ------------------------------------------------------------- decodificação

  /**
   * Devolve as amostras em 16 kHz mono. O downmix de estéreo para mono é
   * feito pelo próprio OfflineAudioContext, que só tem um canal de saída.
   */
  async function decodificar(arquivo) {
    const dados = await arquivo.arrayBuffer();
    const contexto = new (window.AudioContext || window.webkitAudioContext)();
    let bruto;
    try {
      bruto = await contexto.decodeAudioData(dados);
    } finally {
      contexto.close();
    }

    const quadros = Math.ceil(bruto.duration * TAXA_ALVO);
    const offline = new OfflineAudioContext(1, quadros, TAXA_ALVO);
    const fonte = offline.createBufferSource();
    fonte.buffer = bruto;
    fonte.connect(offline.destination);
    fonte.start();
    const reamostrado = await offline.startRendering();
    return { amostras: reamostrado.getChannelData(0), duracao: bruto.duration };
  }

  async function receberArquivo(arquivo) {
    if (!arquivo) return;
    pararRelogio();
    estado.arquivo = arquivo;
    estado.audio = null;
    estado.duracao = 0;
    el.painelResultado.classList.add("escondido");
    el.btnTranscrever.disabled = true;
    el.infoArquivo.className = "status-linha";
    el.infoArquivo.textContent = "Lendo " + arquivo.name + "…";

    try {
      const { amostras, duracao } = await decodificar(arquivo);
      if (estado.arquivo !== arquivo) return; // trocaram o arquivo no meio
      estado.audio = amostras;
      estado.duracao = duracao;

      // O nome do arquivo vai junto: aqui ele é o identificador da mídia
      // que o agente escolheu, e sem ele não dá para ligar o log ao caso.
      log.info(
        "Decodificado:", arquivo.name, "·", humanSize(arquivo.size), "·",
        Math.round(duracao) + "s ·", amostras.length, "amostras a", TAXA_ALVO + "Hz."
      );

      let texto = arquivo.name + " · " + humanSize(arquivo.size) + " · " + formatarTempo(duracao);
      if (duracao > AVISO_DURACAO_S) {
        log.aviso(
          "Áudio de", Math.round(duracao) + "s, acima do limite de", AVISO_DURACAO_S +
          "s — risco de faltar memória."
        );
        texto += " — áudio longo: a transcrição pode levar bem mais que isso, e há risco " +
                 "de faltar memória. Considere cortar em partes no conversor.";
        el.infoArquivo.className = "status-linha erro";
      }
      el.infoArquivo.textContent = texto;
      el.btnTranscrever.disabled = false;
    } catch (err) {
      if (estado.arquivo !== arquivo) return;
      log.aviso("O navegador não decodificou", arquivo.name + ":", err);
      el.infoArquivo.className = "status-linha erro";
      el.infoArquivo.textContent =
        "Não foi possível abrir este arquivo (" + arquivo.name + "). " +
        "Formatos como .mkv, .avi e .wma não são reconhecidos aqui — use a opção " +
        "\"Extrair áudio\" do conversor e traga o MP3.";
    }
  }

  // ------------------------------------------------------------------- worker

  function garantirWorker() {
    if (worker) return worker;
    // type: "module" porque o worker importa a biblioteca do CDN, e
    // `import` dinâmico não vale em worker clássico.
    log.info("Criando o worker de transcrição.");
    worker = new Worker("js/transcricao/worker.js", { type: "module" });
    worker.onmessage = (evento) => tratarMensagem(evento.data || {});
    worker.onerror = (evento) => {
      log.erro("Worker falhou:", evento.message || evento);
      terminar("Não foi possível iniciar a transcrição. Recarregue a página e tente de novo.", true);
    };
    return worker;
  }

  function tratarMensagem(msg) {
    if (msg.tipo === "status") {
      setStatus(msg.texto + " " + textoDoRelogio());
      setBarra(null);
    } else if (msg.tipo === "download") {
      const pct = msg.total ? Math.round((msg.recebido / msg.total) * 100) : 0;
      setStatus(
        "Baixando o programa de transcrição — " + humanSize(msg.recebido) +
        (msg.total ? " de " + humanSize(msg.total) + " (" + pct + "%)" : "") +
        ". Isso só acontece na primeira vez."
      );
      setBarra(msg.total ? msg.recebido / msg.total : null);
      log.debug("Baixando o modelo:", msg.recebido, "de", msg.total || "?");
    } else if (msg.tipo === "modo") {
      // Só no console: quantas threads o motor conseguiu usar explica por
      // que uma transcrição demorou o que demorou, mas não é assunto de
      // quem está esperando o texto.
      log.info("Motor pronto em", msg.threads, msg.threads === 1 ? "thread." : "threads.");
    } else if (msg.tipo === "pronto") {
      mostrarResultado(msg.texto, msg.trechos);
    } else if (msg.tipo === "erro") {
      log.erro("O worker devolveu erro:", msg.mensagem);
      terminar("Falhou: " + msg.mensagem, true);
    }
  }

  // -------------------------------------------------------------- apresentação

  function montarTexto(texto, trechos) {
    if (!el.comTempos.checked) return texto;
    if (!trechos || trechos.length === 0) return texto;
    return trechos
      .map((t) => {
        const inicio = t.timestamp && t.timestamp[0] !== null ? formatarTempo(t.timestamp[0]) : "?";
        return "[" + inicio + "] " + (t.text || "").trim();
      })
      .join("\n");
  }

  function mostrarResultado(texto, trechos) {
    log.info(
      "Transcrição concluída em",
      Math.round((performance.now() - estado.inicio) / 1000) + "s:",
      (texto || "").length, "caracteres,", (trechos || []).length, "trechos."
    );
    ultimaSaida = { texto, trechos };
    const decorrido = (performance.now() - estado.inicio) / 1000;
    el.texto.value = montarTexto(texto, trechos) || "(nada foi reconhecido neste áudio)";
    el.painelResultado.classList.remove("escondido");
    terminar(
      "Concluído em " + formatarTempo(decorrido) + ", para " +
      formatarTempo(estado.duracao) + " de áudio. Revise antes de usar.",
      false
    );
    el.texto.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function textoDoRelogio() {
    return "(" + formatarTempo((performance.now() - estado.inicio) / 1000) + " decorrido)";
  }

  function pararRelogio() {
    if (estado.relogio) clearInterval(estado.relogio);
    estado.relogio = null;
  }

  function terminar(mensagem, erro) {
    pararRelogio();
    estado.rodando = false;
    el.btnTranscrever.disabled = !estado.audio;
    el.btnParar.classList.add("escondido");
    el.input.disabled = false;
    setBarra(null);
    setStatus(mensagem, erro ? "erro" : null);
  }

  // ------------------------------------------------------------------ eventos

  function renderModelos() {
    el.modeloLista.innerHTML = "";
    MODELOS.forEach((m) => {
      const label = document.createElement("label");
      label.className = "modelo-item";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = "modelo";
      input.value = m.id;
      input.checked = estado.modelo === m.id;
      input.addEventListener("change", () => {
        estado.modelo = m.id;
      });

      const corpo = document.createElement("div");
      const nome = document.createElement("span");
      nome.className = "modelo-nome";
      nome.textContent = m.nome;
      const detalhe = document.createElement("span");
      detalhe.className = "modelo-detalhe";
      detalhe.textContent = m.detalhe;
      corpo.appendChild(nome);
      corpo.appendChild(detalhe);

      label.appendChild(input);
      label.appendChild(corpo);
      el.modeloLista.appendChild(label);
    });
  }

  log.info(
    "Transcrição pronta:", MODELOS.length, "modelos,", TAXA_ALVO + "Hz,",
    "aviso de áudio longo a partir de", AVISO_DURACAO_S + "s."
  );

  el.input.addEventListener("change", () => receberArquivo(el.input.files[0]));

  ["dragenter", "dragover"].forEach((evt) => {
    el.painelArquivo.addEventListener(evt, (ev) => {
      ev.preventDefault();
      if (estado.rodando) return;
      el.painelArquivo.classList.add("arrastando");
    });
  });
  ["dragleave", "dragend"].forEach((evt) => {
    el.painelArquivo.addEventListener(evt, (ev) => {
      if (ev.target !== el.painelArquivo) return;
      el.painelArquivo.classList.remove("arrastando");
    });
  });
  el.painelArquivo.addEventListener("drop", (ev) => {
    ev.preventDefault();
    el.painelArquivo.classList.remove("arrastando");
    if (estado.rodando) return;
    const arquivo = ev.dataTransfer.files && ev.dataTransfer.files[0];
    if (arquivo) {
      el.input.value = "";
      receberArquivo(arquivo);
    }
  });
  window.addEventListener("dragover", (ev) => ev.preventDefault());
  window.addEventListener("drop", (ev) => ev.preventDefault());

  el.btnTranscrever.addEventListener("click", () => {
    if (!estado.audio || estado.rodando) return;
    estado.rodando = true;
    estado.inicio = performance.now();
    el.btnTranscrever.disabled = true;
    el.btnParar.classList.remove("escondido");
    el.input.disabled = true;
    el.painelResultado.classList.add("escondido");
    setStatus("Preparando…");

    // O relógio existe porque não há progresso por trecho para mostrar: a
    // biblioteca só avisa quando termina. Sem ele a tela pareceria travada.
    pararRelogio();
    estado.relogio = setInterval(() => {
      const atual = el.statusTexto.textContent.replace(/\s*\(\d+:\d{2}(:\d{2})? decorrido\)$/, "");
      if (atual.startsWith("Transcrevendo") || atual.startsWith("Carregando")) {
        el.statusTexto.textContent = atual + " " + textoDoRelogio();
      }
    }, 1000);

    // Uma cópia vai para o worker e é TRANSFERIDA (o buffer troca de dono
    // em vez de ser duplicado de novo do outro lado). A cópia existe para
    // o original sobreviver: transferir o vetor decodificado significaria
    // ter de decodificar o arquivo inteiro outra vez a cada nova tentativa.
    log.info(
      "Transcrevendo:", Math.round(estado.duracao) + "s de áudio, modelo", estado.modelo + "."
    );
    const copia = estado.audio.slice();
    garantirWorker().postMessage(
      {
        tipo: "transcrever",
        audio: copia,
        modelo: estado.modelo,
      },
      [copia.buffer]
    );
  });

  el.btnParar.addEventListener("click", () => {
    if (!worker) return;
    // Não há como interromper a inferência por dentro: a única saída é
    // matar o worker, o que também joga fora o modelo já carregado.
    log.aviso("Interrompido pelo usuário — o worker vai ser morto e o modelo, recarregado.");
    worker.terminate();
    worker = null;
    terminar("Interrompido. Na próxima vez a página leva alguns segundos para se preparar de novo.", false);
  });

  el.btnLimpar.addEventListener("click", () => {
    estado.arquivo = null;
    estado.audio = null;
    estado.duracao = 0;
    el.input.value = "";
    el.infoArquivo.textContent = "";
    el.infoArquivo.className = "status-linha";
    el.texto.value = "";
    el.painelResultado.classList.add("escondido");
    el.painelStatus.classList.add("escondido");
    el.btnTranscrever.disabled = true;
    ultimaSaida = null;
  });

  el.btnCopiar.addEventListener("click", () => {
    window.Copiar.copiarComFeedback(el.btnCopiar, el.texto.value, { campo: el.texto });
  });

  el.btnBaixar.addEventListener("click", () => {
    const nome = (estado.arquivo ? estado.arquivo.name.replace(/\.[^.]+$/, "") : "transcricao");
    const blob = new Blob([el.texto.value], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nome + "_transcricao.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  });

  el.comTempos.addEventListener("change", () => {
    // Ligar e desligar os tempos é só reformatar o que o worker já
    // devolveu — não custa rodar a transcrição de novo.
    if (ultimaSaida) el.texto.value = montarTexto(ultimaSaida.texto, ultimaSaida.trechos);
  });

  renderModelos();
})();
