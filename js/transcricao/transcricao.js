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

  // Whisper trabalha nessa taxa; qualquer outra teria de ser reamostrada
  // do outro lado de qualquer jeito.
  const TAXA_ALVO = 16000;

  // Os tamanhos são a soma do codificador e do decodificador quantizados
  // em 8 bits, conferidos no Hugging Face. Se trocar de modelo, confira de
  // novo — é esse número que a pessoa usa para decidir se espera ou não.
  const MODELOS = [
    {
      id: "onnx-community/whisper-tiny",
      nome: "Rápido",
      detalhe: "~41 MB · o mais leve, erra bastante em português — bom para saber do que se trata",
    },
    {
      id: "onnx-community/whisper-base",
      nome: "Equilibrado",
      detalhe: "~77 MB · o padrão: texto aproveitável com revisão",
      padrao: true,
    },
    {
      id: "onnx-community/whisper-small",
      nome: "Preciso",
      detalhe: "~249 MB · o melhor dos três em português, e o mais demorado",
    },
  ];

  // Acima disso a decodificação inteira na memória fica arriscada, e a
  // espera deixa de ser razoável numa thread só.
  const AVISO_DURACAO_S = 20 * 60;

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

  function humanSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    const unidades = ["KB", "MB", "GB"];
    let i = -1;
    do {
      bytes /= 1024;
      i++;
    } while (bytes >= 1024 && i < unidades.length - 1);
    return bytes.toFixed(1) + " " + unidades[i];
  }

  function formatarTempo(segundos) {
    const total = Math.max(0, Math.round(segundos));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const dois = (n) => (n < 10 ? "0" + n : String(n));
    return h > 0 ? h + ":" + dois(m) + ":" + dois(s) : m + ":" + dois(s);
  }

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

      let texto = arquivo.name + " · " + humanSize(arquivo.size) + " · " + formatarTempo(duracao);
      if (duracao > AVISO_DURACAO_S) {
        texto += " — áudio longo: a transcrição pode levar bem mais que isso, e há risco " +
                 "de faltar memória. Considere cortar em partes no conversor.";
        el.infoArquivo.className = "status-linha erro";
      }
      el.infoArquivo.textContent = texto;
      el.btnTranscrever.disabled = false;
    } catch (err) {
      if (estado.arquivo !== arquivo) return;
      console.warn("[transcrição] não consegui decodificar:", err);
      el.infoArquivo.className = "status-linha erro";
      el.infoArquivo.textContent =
        "O navegador não conseguiu abrir este arquivo (" + arquivo.name + "). " +
        "Formatos como .mkv, .avi e .wma não são reconhecidos aqui — use a opção " +
        "\"Extrair áudio\" do conversor e traga o MP3.";
    }
  }

  // ------------------------------------------------------------------- worker

  function garantirWorker() {
    if (worker) return worker;
    // type: "module" porque o worker importa a biblioteca do CDN, e
    // `import` dinâmico não vale em worker clássico.
    worker = new Worker("js/transcricao/worker.js", { type: "module" });
    worker.onmessage = (evento) => tratarMensagem(evento.data || {});
    worker.onerror = (evento) => {
      console.error("[transcrição] worker falhou:", evento);
      terminar("Falha ao iniciar o motor de transcrição: " + (evento.message || "erro desconhecido"), true);
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
        "Baixando o modelo — " + humanSize(msg.recebido) +
        (msg.total ? " de " + humanSize(msg.total) + " (" + pct + "%)" : "") +
        ". Só na primeira vez."
      );
      setBarra(msg.total ? msg.recebido / msg.total : null);
    } else if (msg.tipo === "pronto") {
      mostrarResultado(msg.texto, msg.trechos);
    } else if (msg.tipo === "erro") {
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
    ultimaSaida = { texto, trechos };
    const decorrido = (performance.now() - estado.inicio) / 1000;
    el.texto.value = montarTexto(texto, trechos) || "(nada foi reconhecido neste áudio)";
    el.painelResultado.classList.remove("escondido");
    terminar(
      "Concluído em " + formatarTempo(decorrido) + " para " +
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
    worker.terminate();
    worker = null;
    terminar("Interrompido. O modelo será carregado de novo na próxima vez (do cache).", false);
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

  el.btnCopiar.addEventListener("click", async () => {
    const original = el.btnCopiar.textContent;
    const restaurar = (msg, classe) => {
      el.btnCopiar.textContent = msg;
      el.btnCopiar.classList.add(classe);
      setTimeout(() => {
        el.btnCopiar.textContent = original;
        el.btnCopiar.classList.remove(classe);
      }, 1800);
    };
    try {
      if (!navigator.clipboard) throw new Error("clipboard indisponível");
      await navigator.clipboard.writeText(el.texto.value);
      restaurar("Copiado!", "btn-ok");
    } catch (err) {
      el.texto.focus();
      el.texto.select();
      restaurar("Use Ctrl+C", "btn-falhou");
    }
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
