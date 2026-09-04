/**
 * CONVERSOR.JS
 * Conversor de mídia client-side (ffmpeg.wasm) — sem upload, tudo roda no
 * navegador. Espelha as regras do script Python de mesmo propósito:
 *
 *   1 - Converter áudios para MP3
 *   2 - Converter vídeos para MP4
 *   3 - Converter imagens para JPG
 *   4 - Todas as conversões (1, 2 e 3)
 *   5 - Padronizar extensões (jpeg->jpg, mpeg->mpg, etc)
 *   8 - Efetuar todos (4 e 5)
 *   9 - Comprimir um vídeo (baixa/média/alta/extrema/personalizada)
 *
 * As opções 1/2/3 não recomprimem: vídeo tenta remux (-c copy, sem perda);
 * áudio usa VBR de qualidade máxima; imagem usa qualidade JPEG máxima.
 */

(function () {
  "use strict";

  // ---------------------------------------------------------------------
  // Configuração (mesmas regras do script Python)
  // ---------------------------------------------------------------------

  const AUDIO_EXTS = [".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a", ".wma", ".opus", ".aiff", ".au"];
  const VIDEO_EXTS = [".mp4", ".avi", ".mov", ".mkv", ".wmv", ".flv", ".webm", ".mpg", ".mpeg", ".m4v", ".3gp", ".ts"];
  const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".bmp", ".gif", ".tiff", ".tif", ".webp", ".heic"];

  const EXTENSION_MAP = {
    ".jpeg": ".jpg",
    ".mpeg": ".mpg",
    ".tiff": ".tif",
    ".mpg4": ".mp4",
  };

  const LEVEL_VIDEO = {
    "1": { nome: "Baixa", crf: 24, scale: null, maxFps: null, preset: "medium" },
    "2": { nome: "Média", crf: 28, scale: null, maxFps: null, preset: "medium" },
    "3": { nome: "Alta", crf: 30, scale: 0.75, maxFps: 24, preset: "medium" },
    "4": { nome: "Extrema", crf: 32, scale: 0.5, maxFps: 20, preset: "slow" },
  };

  const LEVEL_AUDIO = {
    "1": { bitrate: 128, samplerate: null, mono: false },
    "2": { bitrate: 96, samplerate: 16000, mono: true },
    "3": { bitrate: 64, samplerate: 16000, mono: true },
    "4": { bitrate: 48, samplerate: 16000, mono: true },
  };

  const CORE_BASE = "js/vendor/ffmpeg/core-mt";

  // ---------------------------------------------------------------------
  // Utilitários
  // ---------------------------------------------------------------------

  function extOf(name) {
    const idx = name.lastIndexOf(".");
    return idx === -1 ? "" : name.slice(idx).toLowerCase();
  }

  function baseName(name) {
    const idx = name.lastIndexOf(".");
    return idx === -1 ? name : name.slice(0, idx);
  }

  function roundEven(n) {
    n = Math.round(n);
    if (n % 2 !== 0) n -= 1;
    return Math.max(n, 2);
  }

  function humanSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    const units = ["KB", "MB", "GB"];
    let i = -1;
    do {
      bytes /= 1024;
      i++;
    } while (bytes >= 1024 && i < units.length - 1);
    return bytes.toFixed(1) + " " + units[i];
  }

  async function fileToUint8(file) {
    return new Uint8Array(await file.arrayBuffer());
  }

  function parseMediaInfo(log) {
    const info = {
      width: null, height: null, fps: null,
      hasAudio: false, aBitrate: null, aSampleRate: null, aChannels: null,
    };
    const videoMatch = log.match(/Video:.*?(\d{2,5})x(\d{2,5})(?:[^,\n]*,\s*([\d.]+)\s*fps)?/);
    if (videoMatch) {
      info.width = parseInt(videoMatch[1], 10);
      info.height = parseInt(videoMatch[2], 10);
      if (videoMatch[3]) info.fps = parseFloat(videoMatch[3]);
    }
    const audioMatch = log.match(/Audio:.*?(\d+)\s*Hz,\s*([a-zA-Z0-9.() ]+?),/);
    if (audioMatch) {
      info.hasAudio = true;
      info.aSampleRate = parseInt(audioMatch[1], 10);
      const chanStr = audioMatch[2].trim();
      if (/mono/i.test(chanStr)) info.aChannels = 1;
      else if (/stereo/i.test(chanStr)) info.aChannels = 2;
      else {
        const chanNum = chanStr.match(/(\d+)/);
        info.aChannels = chanNum ? parseInt(chanNum[1], 10) : 2;
      }
    } else if (/Stream #\d+:\d+.*?: Audio:/.test(log)) {
      // stream de áudio existe mas não bateu com o formato esperado da linha
      info.hasAudio = true;
    }
    const bitrateMatch = log.match(/Audio:.*?(\d+)\s*kb\/s/);
    if (bitrateMatch) info.aBitrate = parseInt(bitrateMatch[1], 10);
    return info;
  }

  // ---------------------------------------------------------------------
  // Motor ffmpeg (instância única, carregada sob demanda)
  // ---------------------------------------------------------------------

  let ffmpegInstance = null;
  let ffmpegLoadingPromise = null;
  let logSink = null;
  let progressCallback = null;

  function attachSinks(ffmpeg) {
    ffmpeg.on("log", ({ message }) => {
      if (logSink) logSink.push(message);
    });
    ffmpeg.on("progress", ({ progress }) => {
      if (progressCallback) progressCallback(Math.min(1, Math.max(0, progress || 0)));
    });
  }

  async function getFFmpeg(onStatus) {
    if (ffmpegInstance) return ffmpegInstance;
    if (!ffmpegLoadingPromise) {
      ffmpegLoadingPromise = (async () => {
        if (!window.crossOriginIsolated) {
          throw new Error(
            "A página não está isolada (COOP/COEP). O motor de conversão multi-thread " +
            "não pode ser carregado. Verifique o arquivo _headers do Cloudflare Pages."
          );
        }
        if (onStatus) onStatus("Carregando o motor de conversão (ffmpeg, ~30 MB, só na primeira vez)…");
        const { FFmpeg } = window.FFmpegWASM;
        const ffmpeg = new FFmpeg();
        attachSinks(ffmpeg);
        await ffmpeg.load({
          coreURL: `${CORE_BASE}/ffmpeg-core.js`,
          wasmURL: `${CORE_BASE}/ffmpeg-core.wasm`,
          workerURL: `${CORE_BASE}/ffmpeg-core.worker.js`,
        });
        ffmpegInstance = ffmpeg;
        if (onStatus) onStatus("");
        return ffmpeg;
      })();
    }
    return ffmpegLoadingPromise;
  }

  async function probeMediaInfo(ffmpeg, file) {
    const inName = "probe" + extOf(file.name);
    await ffmpeg.writeFile(inName, await fileToUint8(file));
    logSink = [];
    try {
      await ffmpeg.exec(["-i", inName]);
    } catch (e) {
      // esperado: sem arquivo de saída, ffmpeg "falha" — só queremos o log
    }
    const text = logSink.join("\n");
    logSink = null;
    try { await ffmpeg.deleteFile(inName); } catch (e) {}
    return parseMediaInfo(text);
  }

  // ---------------------------------------------------------------------
  // Operações (opções 1, 2, 3, 5)
  // ---------------------------------------------------------------------

  async function convertAudioFile(ffmpeg, file) {
    const ext = extOf(file.name);
    if (ext === ".mp3") return { skipped: true, reason: "já é mp3" };
    const inName = "in" + ext;
    const outName = baseName(file.name) + ".mp3";
    await ffmpeg.writeFile(inName, await fileToUint8(file));
    let code;
    try {
      code = await ffmpeg.exec(["-i", inName, "-vn", "-codec:a", "libmp3lame", "-q:a", "0", outName]);
    } finally {
      try { await ffmpeg.deleteFile(inName); } catch (e) {}
    }
    if (code) throw new Error("ffmpeg retornou erro ao converter áudio");
    const data = await ffmpeg.readFile(outName);
    await ffmpeg.deleteFile(outName);
    return { blob: new Blob([data.buffer], { type: "audio/mpeg" }), outName };
  }

  async function convertVideoFile(ffmpeg, file) {
    const ext = extOf(file.name);
    if (ext === ".mp4") return { skipped: true, reason: "já é mp4" };
    const inName = "in" + ext;
    const outName = baseName(file.name) + ".mp4";
    await ffmpeg.writeFile(inName, await fileToUint8(file));
    let code;
    try {
      // tenta remuxar primeiro: copia os streams, sem recodificar (sem perda).
      code = await ffmpeg.exec(["-i", inName, "-map", "0", "-c", "copy", "-movflags", "+faststart", outName]);
      if (code) {
        try { await ffmpeg.deleteFile(outName); } catch (e) {}
        code = await ffmpeg.exec([
          "-i", inName, "-c:v", "libx264", "-crf", "18", "-preset", "medium",
          "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k", outName,
        ]);
      }
    } finally {
      try { await ffmpeg.deleteFile(inName); } catch (e) {}
    }
    if (code) throw new Error("ffmpeg retornou erro ao converter vídeo");
    const data = await ffmpeg.readFile(outName);
    await ffmpeg.deleteFile(outName);
    return { blob: new Blob([data.buffer], { type: "video/mp4" }), outName };
  }

  async function convertImageFile(ffmpeg, file) {
    const ext = extOf(file.name);
    if (ext === ".jpg") return { skipped: true, reason: "já é jpg" };
    const inName = "in" + ext;
    const outName = baseName(file.name) + ".jpg";
    await ffmpeg.writeFile(inName, await fileToUint8(file));
    let code;
    try {
      code = await ffmpeg.exec(["-i", inName, "-q:v", "2", outName]);
    } finally {
      try { await ffmpeg.deleteFile(inName); } catch (e) {}
    }
    if (code) throw new Error("ffmpeg retornou erro ao converter imagem");
    const data = await ffmpeg.readFile(outName);
    await ffmpeg.deleteFile(outName);
    return { blob: new Blob([data.buffer], { type: "image/jpeg" }), outName };
  }

  function standardizeExtensionFile(file) {
    const ext = extOf(file.name);
    const newExt = EXTENSION_MAP[ext];
    if (!newExt) return { skipped: true, reason: "sem mapeamento de extensão" };
    const outName = baseName(file.name) + newExt;
    return { blob: file, outName };
  }

  // ---------------------------------------------------------------------
  // Compressão de vídeo (opção 9)
  // ---------------------------------------------------------------------

  async function compressVideoFile(ffmpeg, file, level, custom, onProgress) {
    const info = await probeMediaInfo(ffmpeg, file);
    const ext = extOf(file.name);
    const inName = "cin" + ext;
    const outName = baseName(file.name) + "_comprimido.mp4";
    await ffmpeg.writeFile(inName, await fileToUint8(file));

    let crf, preset;
    let newW = info.width, newH = info.height, targetFps = null;
    let audioArgs = ["-an"];

    function montarAudio(bitrateAlvo, samplerateAlvo, monoAlvo) {
      let bitrate = bitrateAlvo;
      if (info.aBitrate && info.aBitrate < bitrate) bitrate = info.aBitrate;
      let samplerate = samplerateAlvo;
      if (samplerate && info.aSampleRate && info.aSampleRate < samplerate) samplerate = info.aSampleRate;
      const mono = monoAlvo || info.aChannels === 1;
      const args = ["-c:a", "aac", "-b:a", `${bitrate}k`, "-ac", mono ? "1" : String(info.aChannels || 2)];
      if (samplerate) args.push("-ar", String(samplerate));
      return args;
    }

    if (level !== "5") {
      const v = LEVEL_VIDEO[level];
      crf = v.crf;
      preset = v.preset;
      if (v.scale && info.width && info.height) {
        newW = roundEven(info.width * v.scale);
        newH = roundEven(info.height * v.scale);
      }
      if (v.maxFps && info.fps) {
        targetFps = info.fps > v.maxFps ? v.maxFps : null;
      }
      if (info.hasAudio) {
        const a = LEVEL_AUDIO[level];
        audioArgs = montarAudio(a.bitrate, a.samplerate, a.mono);
      }
    } else {
      crf = custom.crf;
      preset = "slow";
      if (custom.width && info.width && info.height) {
        newW = roundEven(custom.width);
        newH = roundEven((custom.width * info.height) / info.width);
      }
      if (custom.fps && (!info.fps || custom.fps < info.fps)) targetFps = custom.fps;
      if (info.hasAudio && !custom.removeAudio) {
        audioArgs = montarAudio(custom.audioBitrate, custom.audioSampleRate, custom.mono);
      }
    }

    const vArgs = ["-c:v", "libx264", "-crf", String(crf), "-preset", preset, "-pix_fmt", "yuv420p"];
    if (newW && newH && info.width && info.height && (newW !== info.width || newH !== info.height)) {
      vArgs.push("-vf", `scale=${newW}:${newH}`);
    }
    if (targetFps) vArgs.push("-r", String(targetFps));

    progressCallback = onProgress || null;
    let code;
    try {
      code = await ffmpeg.exec(["-i", inName, ...vArgs, ...audioArgs, outName]);
    } finally {
      progressCallback = null;
      try { await ffmpeg.deleteFile(inName); } catch (e) {}
    }
    if (code) throw new Error("ffmpeg retornou erro ao comprimir o vídeo");
    const data = await ffmpeg.readFile(outName);
    await ffmpeg.deleteFile(outName);
    return { blob: new Blob([data.buffer], { type: "video/mp4" }), outName };
  }

  // ---------------------------------------------------------------------
  // Estado da UI
  // ---------------------------------------------------------------------

  const estado = {
    opcao: null,
    arquivos: [],
  };

  const el = {
    opcoes: document.getElementById("opcoes-conversor"),
    painelArquivos: document.getElementById("painel-arquivos"),
    rotuloArquivos: document.getElementById("rotulo-arquivos"),
    inputArquivos: document.getElementById("input-arquivos"),
    inputPasta: document.getElementById("input-pasta"),
    listaSelecionados: document.getElementById("lista-selecionados"),
    painelCompressao: document.getElementById("painel-compressao"),
    personalizadaCampos: document.getElementById("personalizada-campos"),
    personalizadaAudio: document.getElementById("personalizada-audio"),
    pRemoverAudio: document.getElementById("p-remover-audio"),
    btnIniciar: document.getElementById("btn-iniciar"),
    btnLimpar: document.getElementById("btn-limpar"),
    statusMotor: document.getElementById("status-motor"),
    resultadosWrapper: document.getElementById("resultados-wrapper"),
    listaResultados: document.getElementById("lista-resultados"),
  };

  function setStatus(texto) {
    if (!texto) {
      el.statusMotor.classList.add("escondido");
      el.statusMotor.textContent = "";
    } else {
      el.statusMotor.classList.remove("escondido");
      el.statusMotor.textContent = texto;
    }
  }

  function atualizarListaSelecionados() {
    el.listaSelecionados.innerHTML = "";
    estado.arquivos.forEach((f) => {
      const li = document.createElement("li");
      const nome = document.createElement("span");
      nome.textContent = f.webkitRelativePath || f.name;
      const tam = document.createElement("span");
      tam.className = "tam";
      tam.textContent = humanSize(f.size);
      li.appendChild(nome);
      li.appendChild(tam);
      el.listaSelecionados.appendChild(li);
    });
    atualizarBotaoIniciar();
  }

  function atualizarBotaoIniciar() {
    let ok = estado.opcao && estado.arquivos.length > 0;
    if (estado.opcao === "9" && estado.arquivos.length !== 1) ok = false;
    el.btnIniciar.disabled = !ok;
  }

  function selecionarOpcao(opcao) {
    estado.opcao = opcao;
    document.querySelectorAll(".opcao-conversor").forEach((btn) => {
      btn.classList.toggle("ativo", btn.dataset.op === opcao);
    });
    el.painelArquivos.classList.remove("escondido");
    el.painelCompressao.classList.toggle("escondido", opcao !== "9");
    el.rotuloArquivos.textContent =
      opcao === "9"
        ? "Selecione um único arquivo de vídeo"
        : "Selecione o(s) arquivo(s) ou a pasta";
    atualizarBotaoIniciar();
  }

  el.opcoes.addEventListener("click", (ev) => {
    const btn = ev.target.closest(".opcao-conversor");
    if (!btn) return;
    selecionarOpcao(btn.dataset.op);
  });

  el.inputArquivos.addEventListener("change", () => {
    estado.arquivos = Array.from(el.inputArquivos.files);
    el.inputPasta.value = "";
    atualizarListaSelecionados();
  });

  el.inputPasta.addEventListener("change", () => {
    estado.arquivos = Array.from(el.inputPasta.files);
    el.inputArquivos.value = "";
    atualizarListaSelecionados();
  });

  document.getElementById("niveis-compressao").addEventListener("change", (ev) => {
    if (ev.target.name !== "nivel") return;
    el.personalizadaCampos.classList.toggle("escondido", ev.target.value !== "5");
  });

  el.pRemoverAudio.addEventListener("change", () => {
    const desabilitado = el.pRemoverAudio.checked;
    el.personalizadaAudio.querySelectorAll("input:not(#p-remover-audio)").forEach((i) => {
      i.disabled = desabilitado;
    });
  });

  el.btnLimpar.addEventListener("click", () => {
    estado.opcao = null;
    estado.arquivos = [];
    el.inputArquivos.value = "";
    el.inputPasta.value = "";
    document.querySelectorAll(".opcao-conversor").forEach((btn) => btn.classList.remove("ativo"));
    el.painelArquivos.classList.add("escondido");
    el.painelCompressao.classList.add("escondido");
    el.listaSelecionados.innerHTML = "";
    el.resultadosWrapper.classList.add("escondido");
    el.listaResultados.innerHTML = "";
    atualizarBotaoIniciar();
  });

  function lerNivelPersonalizado() {
    return {
      crf: parseInt(document.getElementById("p-crf").value, 10) || 23,
      width: parseFloat(document.getElementById("p-largura").value) || null,
      fps: parseFloat(document.getElementById("p-fps").value) || null,
      removeAudio: el.pRemoverAudio.checked,
      audioBitrate: parseInt(document.getElementById("p-audio-bitrate").value, 10) || 96,
      audioSampleRate: parseInt(document.getElementById("p-audio-samplerate").value, 10) || 24000,
      mono: document.getElementById("p-audio-mono").checked,
    };
  }

  // ---------------------------------------------------------------------
  // Resultados (uma linha por arquivo, com botão de download individual)
  // ---------------------------------------------------------------------

  function criarLinhaResultado(nomeOriginal) {
    const li = document.createElement("li");
    li.className = "resultado-item";
    li.innerHTML = `
      <div class="resultado-info">
        <div class="resultado-nome">${nomeOriginal}</div>
        <div class="resultado-status">Aguardando…</div>
        <div class="resultado-barra"><div class="resultado-barra-preenchida"></div></div>
      </div>
    `;
    el.listaResultados.appendChild(li);
    return {
      setStatus(texto, classe) {
        const s = li.querySelector(".resultado-status");
        s.textContent = texto;
        s.className = "resultado-status" + (classe ? " " + classe : "");
      },
      setProgresso(fracao) {
        li.querySelector(".resultado-barra-preenchida").style.width = Math.round(fracao * 100) + "%";
      },
      adicionarDownload(blob, outName) {
        li.querySelector(".resultado-barra").remove();
        const a = document.createElement("a");
        a.className = "btn-secondary resultado-download";
        a.href = URL.createObjectURL(blob);
        a.download = outName;
        a.textContent = "Baixar " + outName;
        li.appendChild(a);
      },
    };
  }

  // ---------------------------------------------------------------------
  // Orquestração — o que roda quando o usuário clica em "Iniciar"
  // ---------------------------------------------------------------------

  async function processarArquivoConversao(ffmpeg, file, opcao, linha) {
    const ext = extOf(file.name);
    const tarefas = [];
    if (opcao === "1" || opcao === "4" || opcao === "8") {
      if (AUDIO_EXTS.includes(ext)) tarefas.push(["áudio", () => convertAudioFile(ffmpeg, file)]);
    }
    if (opcao === "2" || opcao === "4" || opcao === "8") {
      if (VIDEO_EXTS.includes(ext)) tarefas.push(["vídeo", () => convertVideoFile(ffmpeg, file)]);
    }
    if (opcao === "3" || opcao === "4" || opcao === "8") {
      if (IMAGE_EXTS.includes(ext)) tarefas.push(["imagem", () => convertImageFile(ffmpeg, file)]);
    }
    if (opcao === "5" || opcao === "8") {
      tarefas.push(["extensão", () => Promise.resolve(standardizeExtensionFile(file))]);
    }

    if (tarefas.length === 0) {
      linha.setStatus("Tipo não reconhecido para esta operação — ignorado.", "erro");
      return;
    }

    let algumSucesso = false;
    for (const [rotulo, executar] of tarefas) {
      try {
        linha.setStatus(`Processando (${rotulo})…`);
        const resultado = await executar();
        if (resultado.skipped) {
          linha.setStatus(`Sem alteração (${resultado.reason}).`, "ok");
          continue;
        }
        linha.setStatus(`Concluído (${rotulo}).`, "ok");
        linha.adicionarDownload(resultado.blob, resultado.outName);
        algumSucesso = true;
      } catch (err) {
        linha.setStatus(`Falha ao processar (${rotulo}): ${err.message}`, "erro");
      }
    }
    if (!algumSucesso && tarefas.length > 0) {
      // já reportado por linha (sem alteração ou falha); nada mais a fazer.
    }
  }

  async function iniciar() {
    el.btnIniciar.disabled = true;
    el.resultadosWrapper.classList.remove("escondido");
    el.listaResultados.innerHTML = "";

    let ffmpeg;
    try {
      ffmpeg = await getFFmpeg(setStatus);
    } catch (err) {
      setStatus("Erro ao carregar o motor de conversão: " + err.message);
      el.btnIniciar.disabled = false;
      return;
    }
    setStatus("");

    if (estado.opcao === "9") {
      const file = estado.arquivos[0];
      const linha = criarLinhaResultado(file.name);
      const nivel = document.querySelector('input[name="nivel"]:checked').value;
      const custom = nivel === "5" ? lerNivelPersonalizado() : null;
      try {
        linha.setStatus("Analisando o vídeo…");
        const resultado = await compressVideoFile(ffmpeg, file, nivel, custom, (p) => linha.setProgresso(p));
        linha.setStatus("Concluído.", "ok");
        linha.adicionarDownload(resultado.blob, resultado.outName);
      } catch (err) {
        linha.setStatus("Falha: " + err.message, "erro");
      }
    } else {
      for (const file of estado.arquivos) {
        const linha = criarLinhaResultado(file.webkitRelativePath || file.name);
        await processarArquivoConversao(ffmpeg, file, estado.opcao, linha);
      }
    }

    el.btnIniciar.disabled = false;
  }

  el.btnIniciar.addEventListener("click", iniciar);

  document.addEventListener("DOMContentLoaded", () => {
    if (!window.crossOriginIsolated) {
      setStatus(
        "Aviso: esta página não está isolada (COOP/COEP) — o motor de conversão " +
        "provavelmente não vai carregar. Recarregue a página; se persistir, é um " +
        "problema de configuração do _headers no Cloudflare Pages."
      );
    }
  });
})();
