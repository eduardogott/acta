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
 *   9 - Comprimir um arquivo de vídeo OU de áudio
 *       (baixa/média/alta/extrema/personalizada; o tipo é detectado
 *        automaticamente pela extensão do arquivo escolhido)
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
  // .heic ficou de fora de propósito: o build padrão do ffmpeg.wasm não traz
  // decodificador HEIC, então esses arquivos só produziriam um erro obscuro.
  const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".bmp", ".gif", ".tiff", ".tif", ".webp"];

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

  // Compressão de arquivos de áudio (opção 9 quando o arquivo é um áudio).
  // Saída sempre MP3; bitrate/sample rate nunca sobem acima do original.
  const LEVEL_AUDIO_ONLY = {
    "1": { nome: "Baixa",   bitrate: 160, samplerate: null,  mono: false },
    "2": { nome: "Média",   bitrate: 96,  samplerate: 44100, mono: false },
    "3": { nome: "Alta",    bitrate: 64,  samplerate: 32000, mono: true },
    "4": { nome: "Extrema", bitrate: 32,  samplerate: 22050, mono: true },
  };

  const RESUMO_VIDEO = {
    "1": "CRF 24 · resolução e FPS originais · áudio AAC 128 kbps",
    "2": "CRF 28 · resolução e FPS originais · áudio AAC 96 kbps mono 16 kHz",
    "3": "CRF 30 · 75% da resolução · até 24 fps · áudio AAC 64 kbps mono 16 kHz",
    "4": "CRF 32 · 50% da resolução · até 20 fps · áudio AAC 48 kbps mono 16 kHz",
    "5": "Você define cada parâmetro abaixo.",
  };

  const RESUMO_AUDIO = {
    "1": "MP3 160 kbps · canais e sample rate originais",
    "2": "MP3 96 kbps · canais originais · até 44,1 kHz",
    "3": "MP3 64 kbps · mono · até 32 kHz",
    "4": "MP3 32 kbps · mono · até 22,05 kHz",
    "5": "Você define cada parâmetro abaixo.",
  };

  // O núcleo do ffmpeg (32 MB) vem do jsDelivr, não deste site. Versões
  // fixadas de propósito: a URL vira imutável e cacheável para sempre.
  //
  // O "bytes" de cada arquivo está declarado porque o jsDelivr responde em
  // chunks, sem Content-Length, e sem ele a barra de progresso ficaria sem
  // denominador. Ao trocar de versão, atualize os números — o código avisa
  // no console se divergirem do que o servidor mandar.
  const CDN_CORE = "https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.10/dist/umd";
  const ARQUIVOS_CORE = {
    core:   { url: CDN_CORE + "/ffmpeg-core.js",        tipo: "text/javascript",  bytes: 129115 },
    wasm:   { url: CDN_CORE + "/ffmpeg-core.wasm",      tipo: "application/wasm", bytes: 32718323 },
    worker: { url: CDN_CORE + "/ffmpeg-core.worker.js", tipo: "text/javascript",  bytes: 2213 },
  };
  // Os dois arquivos que continuam locais (7,6 KB somados) — ver README.
  const LOADER_LOCAL = ["js/vendor/ffmpeg/ffmpeg.js", "js/vendor/ffmpeg/814.ffmpeg.js"];

  // v2: as chaves do cache mudaram de caminhos locais para URLs do jsDelivr.
  const CACHE_MOTOR = "acta-ffmpeg-v2";

  // ffmpeg.load() nunca rejeita sozinho se o worker morrer: sem um teto de
  // tempo a página fica "Inicializando…" para sempre.
  const TIMEOUT_LOAD_MS = 90000;

  // O ffmpeg.wasm carrega o arquivo inteiro no heap do WebAssembly; acima
  // disso é comum a aba ficar sem memória com um erro pouco informativo.
  const LIMITE_AVISO_MEMORIA = 500 * 1024 * 1024;

  // Bits por pixel do x264 (preset medium) em CRF 23, usado só na estimativa
  // de tamanho. Cada 6 pontos de CRF dobram ou reduzem o bitrate pela metade.
  const BPP_CRF23 = 0.07;
  const FPS_PRESUMIDO = 30;

  // ---------------------------------------------------------------------
  // Diagnóstico
  //
  // Os logs abaixo existem para responder "por que o motor não carregou?"
  // sem precisar de um depurador. O bloco resumido sai sempre; o log
  // linha-a-linha do próprio ffmpeg só sai com ?debug=1 na URL, porque são
  // centenas de linhas por conversão.
  // ---------------------------------------------------------------------

  const VERBOSE = new URLSearchParams(location.search).get("debug") === "1";
  const ESTILO_DIAG = "color:#2d4a63;font-weight:bold";

  function diag(...args) {
    console.log("%c[conversor]", ESTILO_DIAG, ...args);
  }

  function diagAviso(...args) {
    console.warn("%c[conversor]", ESTILO_DIAG, ...args);
  }

  function diagErro(...args) {
    console.error("%c[conversor]", ESTILO_DIAG, ...args);
  }

  const t0 = performance.now();
  function desdeOInicio() {
    return "+" + Math.round(performance.now() - t0) + "ms";
  }

  /**
   * Diz se a página está isolada e, se não estiver, por quê: mostra o que o
   * navegador reporta e o que o servidor realmente devolveu no documento.
   */
  async function diagnosticarIsolamento() {
    const ambiente = {
      url: location.href,
      protocolo: location.protocol,
      origem: location.origin,
      "isSecureContext": window.isSecureContext,
      "crossOriginIsolated": window.crossOriginIsolated,
      "SharedArrayBuffer disponível": typeof SharedArrayBuffer !== "undefined",
      "dentro de iframe": window.self !== window.top,
    };
    diag("Ambiente da página:");
    if (console.table) console.table(ambiente);
    else diag(ambiente);

    if (location.protocol === "file:") {
      diagAviso(
        "A página foi aberta via file://. COOP/COEP só existem em resposta HTTP, " +
        "então o isolamento nunca vai ligar assim. Sirva a pasta por HTTP " +
        "(ex.: `python -m http.server`) com os cabeçalhos, ou use o deploy."
      );
      return ambiente;
    }

    // Refaz a requisição do próprio documento para ler os cabeçalhos que o
    // servidor mandou. cache:"no-store" evita ler uma cópia antiga do disco.
    try {
      const resp = await fetch(location.href, { cache: "no-store" });
      const coop = resp.headers.get("cross-origin-opener-policy");
      const coep = resp.headers.get("cross-origin-embedder-policy");
      diag("Resposta do servidor para este documento:", {
        status: resp.status,
        "Cross-Origin-Opener-Policy": coop || "(ausente)",
        "Cross-Origin-Embedder-Policy": coep || "(ausente)",
      });

      if (coop === "same-origin" && coep === "require-corp") {
        if (!window.crossOriginIsolated) {
          diagAviso(
            "Os dois cabeçalhos chegaram corretos, mas a página ainda não está " +
            "isolada. Isso costuma ser um documento carregado ANTES de os " +
            "cabeçalhos existirem (cache do navegador ou bfcache): recarregue " +
            "com Ctrl+Shift+R. Se a página estiver dentro de um iframe, o pai " +
            "também precisa mandar COEP."
          );
        }
      } else {
        diagAviso(
          "O servidor não mandou o par COOP/COEP neste documento — é esta a " +
          "causa do erro. Caminho pedido: " + location.pathname
        );
        if (location.pathname !== "/conversor.html") {
          diagAviso(
            "Atenção: functions/_middleware.js só aplica os cabeçalhos quando o " +
            "pathname é exatamente \"/conversor.html\", e este é \"" +
            location.pathname + "\". Acesse /conversor.html ou ajuste a " +
            "condição do middleware."
          );
        }
      }
    } catch (err) {
      diagErro("Não consegui reler o documento para inspecionar os cabeçalhos:", err);
    }

    return ambiente;
  }

  /**
   * Envolve o construtor Worker para logar cada worker criado e, sobretudo,
   * para escutar o evento "error" — o ffmpeg.js não escuta, então um worker
   * que morre ao carregar deixa o load() pendurado sem nenhuma pista.
   */
  function instrumentarWorkers() {
    if (typeof Worker !== "function" || Worker.__actaInstrumentado) return;
    const Original = Worker;
    const Envolvido = function (url, opcoes) {
      const alvo = String(url);
      diag("Novo Worker:", alvo, opcoes || "");
      const w = new Original(url, opcoes);
      w.addEventListener("error", (ev) => {
        diagErro(
          "Worker falhou:", alvo,
          "| mensagem:", ev.message || "(vazia — tipicamente 404 ou erro de sintaxe no script do worker)",
          "| origem:", (ev.filename || "?") + ":" + (ev.lineno || "?")
        );
      });
      w.addEventListener("messageerror", (ev) => diagErro("Worker messageerror:", alvo, ev));
      return w;
    };
    Envolvido.prototype = Original.prototype;
    Envolvido.__actaInstrumentado = true;
    try {
      window.Worker = Envolvido;
    } catch (e) {
      diagAviso("Não consegui instrumentar o construtor Worker:", e);
    }
  }

  /** Confere se os arquivos do motor estão realmente no ar (locais e do CDN). */
  async function diagnosticarArquivosDoMotor() {
    const alvos = LOADER_LOCAL.concat(
      Object.keys(ARQUIVOS_CORE).map((k) => ARQUIVOS_CORE[k].url)
    );

    const linhas = {};
    await Promise.all(
      alvos.map(async (url) => {
        try {
          const ehCDN = url.startsWith("http");
          const resp = await fetch(url, {
            method: "HEAD",
            cache: "no-store",
            mode: ehCDN ? "cors" : "same-origin",
            credentials: ehCDN ? "omit" : "same-origin",
          });
          linhas[url] = {
            status: resp.status,
            bytes: resp.headers.get("content-length") || "(sem content-length)",
            tipo: resp.headers.get("content-type") || "(sem content-type)",
            CORP: resp.headers.get("cross-origin-resource-policy") || "-",
          };
        } catch (err) {
          linhas[url] = { status: "ERRO", bytes: "-", tipo: String(err.message || err) };
        }
      })
    );
    diag("Arquivos do motor ffmpeg:");
    if (console.table) console.table(linhas);
    else diag(linhas);
  }

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

  /** Caminho a exibir: arquivos vindos de pasta (input ou arrasto) mostram o caminho. */
  function caminhoDe(file) {
    return file.caminhoRelativo || file.webkitRelativePath || file.name;
  }

  /** Rejeita a promessa depois de `ms` caso ela não resolva sozinha. */
  function comTeto(promessa, ms, mensagem) {
    let timer;
    const estouro = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(mensagem)), ms);
    });
    return Promise.race([promessa, estouro]).finally(() => clearTimeout(timer));
  }

  async function fileToUint8(file) {
    return new Uint8Array(await file.arrayBuffer());
  }

  function tipoDoArquivo(file) {
    const ext = extOf(file.name);
    if (VIDEO_EXTS.includes(ext)) return "video";
    if (AUDIO_EXTS.includes(ext)) return "audio";
    return null;
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

  /**
   * Lê duração e dimensões pelo próprio elemento <video>/<audio> do navegador.
   * É instantâneo e não depende do ffmpeg — serve para estimar o tamanho da
   * saída antes de o usuário baixar os 30 MB do motor. Devolve null quando o
   * navegador não sabe demuxar o formato (.avi, .mkv, .wmv…).
   */
  function lerMetadadosNativos(file) {
    return new Promise((resolve) => {
      const media = document.createElement(tipoDoArquivo(file) === "audio" ? "audio" : "video");
      const url = URL.createObjectURL(file);
      let resolvido = false;
      const terminar = (info) => {
        if (resolvido) return;
        resolvido = true;
        clearTimeout(timer);
        media.removeAttribute("src");
        URL.revokeObjectURL(url);
        resolve(info);
      };
      const timer = setTimeout(() => terminar(null), 5000);
      media.preload = "metadata";
      media.muted = true;
      media.addEventListener("loadedmetadata", () => {
        terminar({
          duracao: isFinite(media.duration) && media.duration > 0 ? media.duration : null,
          largura: media.videoWidth || null,
          altura: media.videoHeight || null,
        });
      });
      media.addEventListener("error", () => terminar(null));
      media.src = url;
    });
  }

  /** Estimativa grosseira do tamanho da saída, em bytes. null = não dá para estimar. */
  function estimarTamanho(tipo, meta, nivel, custom) {
    if (!meta || !meta.duracao) return null;

    if (tipo === "audio") {
      const alvo = nivel === "5" ? custom : LEVEL_AUDIO_ONLY[nivel];
      if (!alvo || !alvo.bitrate) return null;
      return ((alvo.bitrate * 1000) / 8) * meta.duracao;
    }

    if (!meta.largura || !meta.altura) return null;
    let crf;
    let largura = meta.largura;
    let altura = meta.altura;
    let fps = FPS_PRESUMIDO;
    let audioKbps;

    if (nivel === "5") {
      crf = custom.crf;
      if (custom.width) {
        altura = Math.round((custom.width * meta.altura) / meta.largura);
        largura = custom.width;
      }
      if (custom.fps) fps = Math.min(fps, custom.fps);
      audioKbps = custom.removeAudio ? 0 : custom.audioBitrate;
    } else {
      const v = LEVEL_VIDEO[nivel];
      if (!v) return null;
      crf = v.crf;
      if (v.scale) {
        largura = Math.round(largura * v.scale);
        altura = Math.round(altura * v.scale);
      }
      if (v.maxFps) fps = Math.min(fps, v.maxFps);
      audioKbps = LEVEL_AUDIO[nivel].bitrate;
    }

    const bpp = BPP_CRF23 * Math.pow(2, (23 - crf) / 6);
    const bytesPorSegundo = (bpp * largura * altura * fps) / 8 + (audioKbps * 1000) / 8;
    return bytesPorSegundo * meta.duracao;
  }

  // ---------------------------------------------------------------------
  // Motor ffmpeg (instância única, carregada sob demanda e cacheada)
  // ---------------------------------------------------------------------

  let ffmpegInstance = null;
  let ffmpegLoadingPromise = null;
  let ffmpegEmConstrucao = null;
  let logSink = null;
  let progressCallback = null;
  let cancelado = false;

  function attachSinks(ffmpeg) {
    ffmpeg.on("log", ({ message }) => {
      if (logSink) logSink.push(message);
      if (VERBOSE) console.debug("[ffmpeg]", message);
    });
    ffmpeg.on("progress", ({ progress }) => {
      if (progressCallback) progressCallback(Math.min(1, Math.max(0, progress || 0)));
    });
  }

  async function abrirCache() {
    if (!("caches" in window)) {
      diagAviso("Cache API indisponível — o motor será baixado toda vez.");
      return null;
    }
    try {
      return await caches.open(CACHE_MOTOR);
    } catch (e) {
      // modo privado / storage bloqueado: segue sem cache
      diagAviso("Não consegui abrir o cache \"" + CACHE_MOTOR + "\":", e);
      return null;
    }
  }

  /** Lê o corpo de uma Response reportando cada pedaço recebido. */
  async function lerCorpo(resp, onDelta) {
    if (!resp.body || typeof resp.body.getReader !== "function") {
      const buf = await resp.arrayBuffer();
      onDelta(buf.byteLength);
      return buf;
    }
    const leitor = resp.body.getReader();
    const pedacos = [];
    let tamanho = 0;
    for (;;) {
      const { done, value } = await leitor.read();
      if (done) break;
      pedacos.push(value);
      tamanho += value.length;
      onDelta(value.length);
    }
    const out = new Uint8Array(tamanho);
    let pos = 0;
    for (const p of pedacos) {
      out.set(p, pos);
      pos += p.length;
    }
    return out.buffer;
  }

  /**
   * Baixa do jsDelivr (ou recupera do cache) os três arquivos do núcleo e
   * devolve blob: URLs para cada um, reportando o progresso em bytes.
   *
   * Por que blob: URL e não a URL do CDN direto? Porque o Emscripten cria os
   * workers de pthread com `new Worker(workerURL)`, e o construtor Worker
   * rejeita qualquer URL de outra origem — nem CORS nem CORP mudam isso. Um
   * blob: URL pertence à nossa origem e passa. De quebra, buscar nós mesmos
   * mantém a barra de progresso e o cache.
   */
  async function baixarCoreComoBlobURLs(onProgresso) {
    const cache = await abrirCache();
    const chaves = ["core", "worker", "wasm"]; // wasm por último: é o pesado
    const totalDeclarado = chaves.reduce((n, k) => n + ARQUIVOS_CORE[k].bytes, 0);

    // Resolve as três respostas antes de ler qualquer corpo: assim os
    // Content-Length somados dão o denominador da barra, e o que faltar
    // baixa em paralelo em vez de um depois do outro.
    const fontes = await Promise.all(
      chaves.map(async (chave) => {
        const spec = ARQUIVOS_CORE[chave];
        let doCache = null;
        if (cache) {
          try { doCache = await cache.match(spec.url); } catch (e) { doCache = null; }
        }
        if (doCache) return { chave, spec, resp: doCache, veioDoCache: true };
        // credentials omitidas: o site fica atrás de Basic Auth, e mandar
        // credenciais para uma origem que responde ACAO:* quebra o CORS.
        const resp = await fetch(spec.url, { mode: "cors", credentials: "omit" });
        if (!resp.ok) throw new Error("Falha ao baixar " + spec.url + " (" + resp.status + ")");
        return { chave, spec, resp, veioDoCache: false };
      })
    );

    const todasEmCache = fontes.every((f) => f.veioDoCache);
    diag(
      "Núcleo do ffmpeg:",
      fontes
        .map((f) => f.spec.url.split("/").pop() + (f.veioDoCache ? " (cache)" : " (jsDelivr " + f.resp.status + ")"))
        .join(", ")
    );

    // Preferimos o Content-Length real; o jsDelivr responde em chunks e não
    // manda esse cabeçalho, então caímos nos tamanhos declarados.
    let total = 0;
    let origemDoTotal = "Content-Length";
    for (const f of fontes) {
      const n = Number(f.resp.headers.get("content-length"));
      if (Number.isFinite(n) && n > 0) {
        total += n;
        if (!f.veioDoCache && n !== f.spec.bytes) {
          diagAviso(
            "O tamanho declarado de " + f.spec.url.split("/").pop() + " (" + f.spec.bytes +
            " bytes) não bate com o servidor (" + n + " bytes). Atualize ARQUIVOS_CORE."
          );
        }
      } else {
        total = totalDeclarado;
        origemDoTotal = "tamanhos declarados em ARQUIVOS_CORE";
        break;
      }
    }
    diag("Total do download:", humanSize(total), "(via " + origemDoTotal + ")");

    let recebido = 0;
    const urls = {};
    for (const f of fontes) {
      const buf = await lerCorpo(f.resp, (delta) => {
        recebido += delta;
        if (onProgresso) onProgresso(recebido, total, todasEmCache);
      });
      if (!f.veioDoCache && cache) {
        try {
          await cache.put(f.spec.url, new Response(buf, { headers: { "Content-Type": f.spec.tipo } }));
        } catch (e) {
          // cota estourada ou storage bloqueado: só perde o cache
        }
      }
      urls[f.chave] = URL.createObjectURL(new Blob([buf], { type: f.spec.tipo }));
    }

    diag("Núcleo pronto:", humanSize(recebido), "convertido em blob: URLs", desdeOInicio());
    return { coreURL: urls.core, wasmURL: urls.wasm, workerURL: urls.worker };
  }

  async function getFFmpeg(onStatus, onProgresso) {
    if (ffmpegInstance) return ffmpegInstance;
    if (!ffmpegLoadingPromise) {
      ffmpegLoadingPromise = (async () => {
        if (!window.crossOriginIsolated) {
          diagErro("Abortando: a página não está isolada. Diagnóstico completo abaixo.");
          await diagnosticarIsolamento();
          await diagnosticarArquivosDoMotor();
          throw new Error(
            "A página não está isolada (COOP/COEP). O motor de conversão multi-thread " +
            "não pode ser carregado. Abra o console do navegador (F12) — há um " +
            "diagnóstico detalhado lá dizendo qual cabeçalho faltou."
          );
        }
        diag("Iniciando o carregamento do motor.", desdeOInicio());
        if (onStatus) onStatus("Carregando o motor de conversão (ffmpeg)…");
        if (!window.FFmpegWASM || !window.FFmpegWASM.FFmpeg) {
          diagErro("window.FFmpegWASM não existe — js/vendor/ffmpeg/ffmpeg.js não carregou.");
          throw new Error(
            "A biblioteca ffmpeg.js não carregou. Confira se js/vendor/ffmpeg/ffmpeg.js " +
            "está sendo servido (aba Network do navegador)."
          );
        }
        instrumentarWorkers();
        const { FFmpeg } = window.FFmpegWASM;
        const ffmpeg = new FFmpeg();
        ffmpegEmConstrucao = ffmpeg;
        attachSinks(ffmpeg);
        const urlsDoCore = await baixarCoreComoBlobURLs(onProgresso);
        if (onStatus) onStatus("Inicializando o motor de conversão…");
        // Todas as URLs aqui são blob:, logo absolutas e da nossa origem.
        // Isso importa: elas são repassadas ao worker js/vendor/ffmpeg/
        // 814.ffmpeg.js, que faz importScripts(coreURL) — um caminho
        // relativo resolveria contra a pasta do worker, não a da página — e
        // o Emscripten faz new Worker(workerURL), que recusa outra origem.
        diag("Carregando o core:", urlsDoCore);

        await comTeto(
          ffmpeg.load(urlsDoCore),
          TIMEOUT_LOAD_MS,
          "O motor não respondeu em " + TIMEOUT_LOAD_MS / 1000 + "s. Isso costuma " +
          "significar que o worker do ffmpeg morreu ao carregar o core — veja no " +
          "console se houve erro de Worker ou um 404 em ffmpeg-core.js."
        );
        ffmpegEmConstrucao = null;
        ffmpegInstance = ffmpeg;
        diag("Motor pronto.", desdeOInicio());
        if (onStatus) onStatus("");
        return ffmpeg;
      })();
      // permite uma nova tentativa depois de um erro ou de um cancelamento
      ffmpegLoadingPromise.catch((err) => {
        diagErro("Falha ao carregar o motor:", err);
        ffmpegLoadingPromise = null;
        ffmpegEmConstrucao = null;
      });
    }
    return ffmpegLoadingPromise;
  }

  /** Mata o worker do ffmpeg; a instância recarrega (do cache) na próxima vez. */
  function derrubarMotor() {
    diag("Derrubando o worker do ffmpeg.");
    const alvo = ffmpegInstance || ffmpegEmConstrucao;
    if (alvo) {
      try { alvo.terminate(); } catch (e) {}
    }
    ffmpegInstance = null;
    ffmpegLoadingPromise = null;
    ffmpegEmConstrucao = null;
    progressCallback = null;
    logSink = null;
  }

  /** Envolve ffmpeg.exec logando o argv, o código de saída e o tempo gasto. */
  async function execComLog(ffmpeg, args) {
    diag("ffmpeg", args.join(" "));
    const inicio = performance.now();
    try {
      const code = await ffmpeg.exec(args);
      const ms = Math.round(performance.now() - inicio);
      if (code) diagAviso("ffmpeg saiu com código", code, "em " + ms + "ms");
      else diag("ffmpeg ok em " + ms + "ms");
      return code;
    } catch (err) {
      diagErro("ffmpeg lançou exceção em " + Math.round(performance.now() - inicio) + "ms:", err);
      throw err;
    }
  }

  async function probeMediaInfo(ffmpeg, file) {
    const inName = "probe" + extOf(file.name);
    await ffmpeg.writeFile(inName, await fileToUint8(file));
    logSink = [];
    try {
      await execComLog(ffmpeg, ["-i", inName]);
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

  async function convertAudioFile(ffmpeg, file, onProgress) {
    const ext = extOf(file.name);
    if (ext === ".mp3") return { skipped: true, reason: "já é mp3" };
    const inName = "in" + ext;
    const outName = baseName(file.name) + ".mp3";
    await ffmpeg.writeFile(inName, await fileToUint8(file));
    progressCallback = onProgress || null;
    let code;
    try {
      code = await execComLog(ffmpeg, ["-i", inName, "-vn", "-codec:a", "libmp3lame", "-q:a", "0", outName]);
    } finally {
      progressCallback = null;
      try { await ffmpeg.deleteFile(inName); } catch (e) {}
    }
    if (code) throw new Error("ffmpeg retornou erro ao converter áudio");
    const data = await ffmpeg.readFile(outName);
    await ffmpeg.deleteFile(outName);
    return { blob: new Blob([data.buffer], { type: "audio/mpeg" }), outName };
  }

  async function convertVideoFile(ffmpeg, file, onProgress) {
    const ext = extOf(file.name);
    if (ext === ".mp4") return { skipped: true, reason: "já é mp4" };
    const inName = "in" + ext;
    const outName = baseName(file.name) + ".mp4";
    await ffmpeg.writeFile(inName, await fileToUint8(file));
    progressCallback = onProgress || null;
    let code;
    try {
      // tenta remuxar primeiro: copia os streams, sem recodificar (sem perda).
      code = await execComLog(ffmpeg, ["-i", inName, "-map", "0", "-c", "copy", "-movflags", "+faststart", outName]);
      if (code) {
        try { await ffmpeg.deleteFile(outName); } catch (e) {}
        code = await execComLog(ffmpeg, [
          "-i", inName, "-c:v", "libx264", "-crf", "18", "-preset", "medium",
          "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k", outName,
        ]);
      }
    } finally {
      progressCallback = null;
      try { await ffmpeg.deleteFile(inName); } catch (e) {}
    }
    if (code) throw new Error("ffmpeg retornou erro ao converter vídeo");
    const data = await ffmpeg.readFile(outName);
    await ffmpeg.deleteFile(outName);
    return { blob: new Blob([data.buffer], { type: "video/mp4" }), outName };
  }

  async function convertImageFile(ffmpeg, file, onProgress) {
    const ext = extOf(file.name);
    if (ext === ".jpg") return { skipped: true, reason: "já é jpg" };
    const inName = "in" + ext;
    const outName = baseName(file.name) + ".jpg";
    await ffmpeg.writeFile(inName, await fileToUint8(file));
    progressCallback = onProgress || null;
    let code;
    try {
      code = await execComLog(ffmpeg, ["-i", inName, "-q:v", "2", outName]);
    } finally {
      progressCallback = null;
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
  // Compressão (opção 9) — vídeo ou áudio, conforme o arquivo escolhido
  // ---------------------------------------------------------------------

  async function compressAudioFile(ffmpeg, file, level, custom, onProgress) {
    const info = await probeMediaInfo(ffmpeg, file);
    const ext = extOf(file.name);
    const inName = "ain" + ext;
    const outName = baseName(file.name) + "_comprimido.mp3";
    await ffmpeg.writeFile(inName, await fileToUint8(file));

    const alvo = level === "5"
      ? { bitrate: custom.bitrate, samplerate: custom.samplerate, mono: custom.mono }
      : LEVEL_AUDIO_ONLY[level];

    // Nunca sobe acima do original: recomprimir para cima só aumenta o arquivo.
    let bitrate = alvo.bitrate;
    if (info.aBitrate && info.aBitrate < bitrate) bitrate = info.aBitrate;
    let samplerate = alvo.samplerate;
    if (samplerate && info.aSampleRate && info.aSampleRate < samplerate) samplerate = info.aSampleRate;
    const mono = alvo.mono || info.aChannels === 1;

    const args = ["-i", inName, "-vn", "-c:a", "libmp3lame", "-b:a", bitrate + "k",
                  "-ac", mono ? "1" : String(info.aChannels || 2)];
    if (samplerate) args.push("-ar", String(samplerate));
    args.push(outName);

    progressCallback = onProgress || null;
    let code;
    try {
      code = await execComLog(ffmpeg, args);
    } finally {
      progressCallback = null;
      try { await ffmpeg.deleteFile(inName); } catch (e) {}
    }
    if (code) throw new Error("ffmpeg retornou erro ao comprimir o áudio");
    const data = await ffmpeg.readFile(outName);
    await ffmpeg.deleteFile(outName);
    return { blob: new Blob([data.buffer], { type: "audio/mpeg" }), outName };
  }

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
      const args = ["-c:a", "aac", "-b:a", bitrate + "k", "-ac", mono ? "1" : String(info.aChannels || 2)];
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
      vArgs.push("-vf", "scale=" + newW + ":" + newH);
    }
    if (targetFps) vArgs.push("-r", String(targetFps));

    progressCallback = onProgress || null;
    let code;
    try {
      code = await execComLog(ffmpeg, ["-i", inName, ...vArgs, ...audioArgs, outName]);
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
    // Opção 9: "video" | "audio" | null — detectado pela extensão do arquivo.
    tipoCompressao: null,
    // Duração/dimensões do arquivo da opção 9, lidas sem o ffmpeg.
    meta: null,
    // Descarta leituras de metadados de seleções que já foram trocadas.
    tokenMeta: 0,
    // Saídas geradas na última execução, para "Baixar tudo".
    saidas: [],
    rodando: false,
  };

  const el = {
    opcoes: document.getElementById("opcoes-conversor"),
    painelArquivos: document.getElementById("painel-arquivos"),
    rotuloArquivos: document.getElementById("rotulo-arquivos"),
    inputArquivos: document.getElementById("input-arquivos"),
    inputPasta: document.getElementById("input-pasta"),
    labelPasta: document.getElementById("label-pasta"),
    listaSelecionados: document.getElementById("lista-selecionados"),
    avisoMemoria: document.getElementById("aviso-memoria"),
    painelCompressao: document.getElementById("painel-compressao"),
    tipoDetectado: document.getElementById("tipo-detectado"),
    nivelResumo: document.getElementById("nivel-resumo"),
    estimativa: document.getElementById("estimativa"),
    personalizadaVideo: document.getElementById("personalizada-video"),
    personalizadaAudioOnly: document.getElementById("personalizada-audio-only"),
    personalizadaAudio: document.getElementById("personalizada-audio"),
    pRemoverAudio: document.getElementById("p-remover-audio"),
    btnIniciar: document.getElementById("btn-iniciar"),
    btnCancelar: document.getElementById("btn-cancelar"),
    btnLimpar: document.getElementById("btn-limpar"),
    statusMotor: document.getElementById("status-motor"),
    statusMotorTexto: document.getElementById("status-motor-texto"),
    barraMotor: document.getElementById("barra-motor"),
    barraMotorPreenchida: document.getElementById("barra-motor-preenchida"),
    resultadosWrapper: document.getElementById("resultados-wrapper"),
    progressoLote: document.getElementById("progresso-lote"),
    acoesResultados: document.getElementById("acoes-resultados"),
    btnBaixarTudo: document.getElementById("btn-baixar-tudo"),
    btnSalvarPasta: document.getElementById("btn-salvar-pasta"),
    listaResultados: document.getElementById("lista-resultados"),
  };

  function setStatus(texto) {
    if (!texto) {
      el.statusMotor.classList.add("escondido");
      el.statusMotorTexto.textContent = "";
      setBarraMotor(null);
    } else {
      el.statusMotor.classList.remove("escondido");
      el.statusMotorTexto.textContent = texto;
    }
  }

  /** fracao null esconde a barra; 0..1 preenche. */
  function setBarraMotor(fracao) {
    if (fracao === null || fracao === undefined) {
      el.barraMotor.classList.add("escondido");
      el.barraMotorPreenchida.style.width = "0%";
      return;
    }
    el.barraMotor.classList.remove("escondido");
    el.barraMotorPreenchida.style.width = Math.round(Math.min(1, fracao) * 100) + "%";
  }

  function onProgressoMotor(recebido, total, todasEmCache) {
    if (todasEmCache) {
      setStatus("Recuperando o motor de conversão do cache do navegador…");
      setBarraMotor(total ? recebido / total : 1);
      return;
    }
    if (total) {
      const pct = Math.round((recebido / total) * 100);
      setStatus(
        "Baixando o motor de conversão — " + humanSize(recebido) + " de " +
        humanSize(total) + " (" + pct + "%). Só na primeira visita."
      );
      setBarraMotor(recebido / total);
    } else {
      setStatus("Baixando o motor de conversão — " + humanSize(recebido) + " recebidos…");
      setBarraMotor(null);
    }
  }

  // ---------------------------------------------------------------------
  // Seleção de arquivos (inputs + arrastar e soltar)
  // ---------------------------------------------------------------------

  function definirArquivos(lista) {
    estado.arquivos = lista;
    atualizarListaSelecionados();
  }

  function atualizarListaSelecionados() {
    el.listaSelecionados.innerHTML = "";
    estado.arquivos.forEach((f) => {
      const li = document.createElement("li");
      const nome = document.createElement("span");
      nome.textContent = caminhoDe(f);
      const tam = document.createElement("span");
      tam.className = "tam";
      tam.textContent = humanSize(f.size);
      li.appendChild(nome);
      li.appendChild(tam);
      el.listaSelecionados.appendChild(li);
    });
    atualizarAvisoMemoria();
    atualizarPainelCompressao();
    carregarMetadados();
    atualizarBotaoIniciar();
  }

  /** Avisa quando algum arquivo é grande o bastante para estourar a memória da aba. */
  function atualizarAvisoMemoria() {
    if (estado.arquivos.length === 0) {
      el.avisoMemoria.classList.add("escondido");
      return;
    }
    let maior = estado.arquivos[0];
    for (const f of estado.arquivos) if (f.size > maior.size) maior = f;
    if (maior.size < LIMITE_AVISO_MEMORIA) {
      el.avisoMemoria.classList.add("escondido");
      el.avisoMemoria.textContent = "";
      return;
    }
    el.avisoMemoria.classList.remove("escondido");
    el.avisoMemoria.textContent =
      "⚠ O arquivo " + maior.name + " tem " + humanSize(maior.size) +
      ". O ffmpeg carrega o arquivo inteiro na memória do navegador, e acima de " +
      "~500 MB é comum a aba ficar sem memória no meio do processo. Se falhar, " +
      "corte o arquivo em partes menores antes.";
  }

  /** Percorre uma entrada arrastada (arquivo ou pasta) acumulando os arquivos. */
  function percorrerEntrada(entrada, prefixo, saida) {
    return new Promise((resolve) => {
      if (entrada.isFile) {
        entrada.file(
          (f) => {
            // o input de pasta preenche webkitRelativePath, que é só-leitura;
            // aqui o caminho vai num campo próprio
            try {
              Object.defineProperty(f, "caminhoRelativo", { value: prefixo + f.name });
            } catch (e) {}
            saida.push(f);
            resolve();
          },
          () => resolve()
        );
        return;
      }
      if (!entrada.isDirectory) return resolve();

      const leitor = entrada.createReader();
      const filhos = [];
      const lerLote = () => {
        leitor.readEntries(
          async (entradas) => {
            if (entradas.length === 0) {
              for (const filho of filhos) {
                await percorrerEntrada(filho, prefixo + entrada.name + "/", saida);
              }
              return resolve();
            }
            // readEntries devolve no máximo 100 por chamada: repete até esvaziar
            filhos.push(...entradas);
            lerLote();
          },
          () => resolve()
        );
      };
      lerLote();
    });
  }

  async function arquivosDoArrasto(dataTransfer) {
    const itens = Array.from(dataTransfer.items || []);
    const raizes = itens
      .map((it) => (typeof it.webkitGetAsEntry === "function" ? it.webkitGetAsEntry() : null))
      .filter(Boolean);
    if (raizes.length === 0) return Array.from(dataTransfer.files || []);
    const arquivos = [];
    for (const raiz of raizes) await percorrerEntrada(raiz, "", arquivos);
    return arquivos;
  }

  ["dragenter", "dragover"].forEach((evt) => {
    el.painelArquivos.addEventListener(evt, (ev) => {
      ev.preventDefault();
      if (estado.rodando) return;
      ev.dataTransfer.dropEffect = "copy";
      el.painelArquivos.classList.add("arrastando");
    });
  });

  ["dragleave", "dragend"].forEach((evt) => {
    el.painelArquivos.addEventListener(evt, (ev) => {
      if (ev.target !== el.painelArquivos) return;
      el.painelArquivos.classList.remove("arrastando");
    });
  });

  el.painelArquivos.addEventListener("drop", async (ev) => {
    ev.preventDefault();
    el.painelArquivos.classList.remove("arrastando");
    if (estado.rodando) return;
    const arquivos = await arquivosDoArrasto(ev.dataTransfer);
    if (arquivos.length === 0) return;
    el.inputArquivos.value = "";
    el.inputPasta.value = "";
    definirArquivos(arquivos);
  });

  // Impede que soltar um arquivo fora da zona faça o navegador abri-lo.
  window.addEventListener("dragover", (ev) => ev.preventDefault());
  window.addEventListener("drop", (ev) => ev.preventDefault());

  // ---------------------------------------------------------------------
  // Painel de compressão (opção 9)
  // ---------------------------------------------------------------------

  function atualizarBotaoIniciar() {
    if (estado.rodando) {
      el.btnIniciar.disabled = true;
      return;
    }
    let ok = estado.opcao && estado.arquivos.length > 0;
    if (estado.opcao === "9" && (estado.arquivos.length !== 1 || !estado.tipoCompressao)) ok = false;
    el.btnIniciar.disabled = !ok;
  }

  function nivelSelecionado() {
    const marcado = document.querySelector('input[name="nivel"]:checked');
    return marcado ? marcado.value : "1";
  }

  /**
   * Mostra o painel de compressão só quando há exatamente um arquivo de
   * vídeo ou de áudio selecionado, e exibe apenas os campos manuais do tipo
   * detectado — e ainda assim somente no nível "Personalizada".
   */
  function atualizarPainelCompressao() {
    if (estado.opcao !== "9") {
      estado.tipoCompressao = null;
      el.painelCompressao.classList.add("escondido");
      return;
    }

    estado.tipoCompressao =
      estado.arquivos.length === 1 ? tipoDoArquivo(estado.arquivos[0]) : null;

    if (estado.arquivos.length === 0) {
      el.painelCompressao.classList.add("escondido");
      return;
    }

    if (!estado.tipoCompressao) {
      el.painelCompressao.classList.remove("escondido");
      el.tipoDetectado.textContent =
        estado.arquivos.length > 1
          ? "selecione um único arquivo"
          : "tipo não reconhecido — escolha um vídeo ou um áudio";
      el.tipoDetectado.className = "tipo-detectado invalido";
      el.nivelResumo.textContent = "";
      el.estimativa.classList.add("escondido");
      el.personalizadaVideo.classList.add("escondido");
      el.personalizadaAudioOnly.classList.add("escondido");
      return;
    }

    const nivel = nivelSelecionado();
    const ehVideo = estado.tipoCompressao === "video";

    el.painelCompressao.classList.remove("escondido");
    el.tipoDetectado.textContent = ehVideo ? "vídeo detectado" : "áudio detectado";
    el.tipoDetectado.className = "tipo-detectado";
    el.nivelResumo.textContent = (ehVideo ? RESUMO_VIDEO : RESUMO_AUDIO)[nivel] || "";

    const personalizada = nivel === "5";
    el.personalizadaVideo.classList.toggle("escondido", !(personalizada && ehVideo));
    el.personalizadaAudioOnly.classList.toggle("escondido", !(personalizada && !ehVideo));

    atualizarEstimativa();
  }

  /** Lê os metadados nativos do arquivo da opção 9 e atualiza a estimativa. */
  function carregarMetadados() {
    estado.meta = null;
    const token = ++estado.tokenMeta;
    if (estado.opcao !== "9" || estado.arquivos.length !== 1 || !estado.tipoCompressao) {
      atualizarEstimativa();
      return;
    }
    lerMetadadosNativos(estado.arquivos[0]).then((meta) => {
      if (token !== estado.tokenMeta) return; // a seleção mudou nesse meio-tempo
      estado.meta = meta;
      atualizarEstimativa();
    });
  }

  function atualizarEstimativa() {
    if (estado.opcao !== "9" || !estado.tipoCompressao || !estado.meta) {
      el.estimativa.classList.add("escondido");
      el.estimativa.textContent = "";
      return;
    }
    const nivel = nivelSelecionado();
    const ehVideo = estado.tipoCompressao === "video";
    const custom = nivel !== "5"
      ? null
      : ehVideo ? lerNivelPersonalizado() : lerNivelPersonalizadoAudio();
    const bytes = estimarTamanho(estado.tipoCompressao, estado.meta, nivel, custom);
    if (!bytes) {
      el.estimativa.classList.add("escondido");
      el.estimativa.textContent = "";
      return;
    }
    const original = estado.arquivos[0].size;
    const variacao = Math.round((1 - bytes / original) * 100);
    const sinal = variacao >= 0 ? "−" + variacao + "%" : "+" + -variacao + "%";
    el.estimativa.classList.remove("escondido");
    el.estimativa.textContent =
      "Estimativa: " + humanSize(original) + " → ~" + humanSize(bytes) + " (" + sinal + "). " +
      "É um cálculo aproximado — o resultado real depende do conteúdo do arquivo.";
  }

  // ---------------------------------------------------------------------
  // Eventos da seleção de operação e dos campos
  // ---------------------------------------------------------------------

  function selecionarOpcao(opcao) {
    estado.opcao = opcao;
    document.querySelectorAll(".opcao-conversor").forEach((btn) => {
      btn.classList.toggle("ativo", btn.dataset.op === opcao);
    });
    el.painelArquivos.classList.remove("escondido");
    el.rotuloArquivos.textContent =
      opcao === "9"
        ? "2. Selecione um único arquivo de vídeo ou de áudio"
        : "2. Selecione o(s) arquivo(s) ou a pasta";
    el.labelPasta.classList.toggle("escondido", opcao === "9");
    atualizarPainelCompressao();
    carregarMetadados();
    atualizarBotaoIniciar();
  }

  el.opcoes.addEventListener("click", (ev) => {
    const btn = ev.target.closest(".opcao-conversor");
    if (!btn) return;
    selecionarOpcao(btn.dataset.op);
  });

  el.inputArquivos.addEventListener("change", () => {
    el.inputPasta.value = "";
    definirArquivos(Array.from(el.inputArquivos.files));
  });

  el.inputPasta.addEventListener("change", () => {
    el.inputArquivos.value = "";
    definirArquivos(Array.from(el.inputPasta.files));
  });

  document.getElementById("niveis-compressao").addEventListener("change", (ev) => {
    if (ev.target.name !== "nivel") return;
    atualizarPainelCompressao();
  });

  // Mexer nos campos da personalizada recalcula a estimativa na hora.
  ["personalizada-video", "personalizada-audio-only"].forEach((id) => {
    const bloco = document.getElementById(id);
    bloco.addEventListener("input", atualizarEstimativa);
    bloco.addEventListener("change", atualizarEstimativa);
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
    estado.tipoCompressao = null;
    estado.meta = null;
    estado.tokenMeta++;
    limparSaidas();
    el.inputArquivos.value = "";
    el.inputPasta.value = "";
    document.querySelectorAll(".opcao-conversor").forEach((btn) => btn.classList.remove("ativo"));
    el.painelArquivos.classList.add("escondido");
    el.painelCompressao.classList.add("escondido");
    el.listaSelecionados.innerHTML = "";
    el.avisoMemoria.classList.add("escondido");
    el.estimativa.classList.add("escondido");
    el.resultadosWrapper.classList.add("escondido");
    el.listaResultados.innerHTML = "";
    el.progressoLote.textContent = "";
    setStatus("");
    atualizarBotaoIniciar();
  });

  function lerNivelPersonalizadoAudio() {
    return {
      bitrate: parseInt(document.getElementById("pa-bitrate").value, 10) || 96,
      samplerate: parseInt(document.getElementById("pa-samplerate").value, 10) || null,
      mono: document.getElementById("pa-mono").checked,
    };
  }

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

  function limparSaidas() {
    for (const s of estado.saidas) {
      if (s.url) URL.revokeObjectURL(s.url);
    }
    estado.saidas = [];
    el.acoesResultados.classList.add("escondido");
  }

  function criarLinhaResultado(nomeOriginal, tamanhoOriginal) {
    const li = document.createElement("li");
    li.className = "resultado-item";

    const info = document.createElement("div");
    info.className = "resultado-info";

    const nome = document.createElement("div");
    nome.className = "resultado-nome";
    nome.textContent = nomeOriginal;

    const status = document.createElement("div");
    status.className = "resultado-status";
    status.textContent = "Aguardando…";

    const tamanhos = document.createElement("div");
    tamanhos.className = "resultado-tamanhos";

    const barra = document.createElement("div");
    barra.className = "resultado-barra";
    const preenchida = document.createElement("div");
    preenchida.className = "resultado-barra-preenchida";
    barra.appendChild(preenchida);

    info.appendChild(nome);
    info.appendChild(status);
    info.appendChild(tamanhos);
    info.appendChild(barra);
    li.appendChild(info);
    el.listaResultados.appendChild(li);

    return {
      setStatus(texto, classe) {
        status.textContent = texto;
        status.className = "resultado-status" + (classe ? " " + classe : "");
      },
      setProgresso(fracao) {
        preenchida.style.width = Math.round(fracao * 100) + "%";
      },
      esconderBarra() {
        barra.classList.add("escondido");
      },
      adicionarDownload(blob, outName) {
        barra.classList.add("escondido");

        // Comparação de tamanhos: é o número que interessa numa compressão.
        const variacao = Math.round((1 - blob.size / tamanhoOriginal) * 100);
        const rotulo = variacao >= 0 ? "−" + variacao + "%" : "+" + -variacao + "%";
        tamanhos.textContent =
          humanSize(tamanhoOriginal) + " → " + humanSize(blob.size) + " (" + rotulo + ")";
        tamanhos.classList.add(variacao > 0 ? "menor" : "maior");

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.className = "btn-secondary resultado-download";
        a.href = url;
        a.download = outName;
        a.textContent = "Baixar";
        a.title = "Baixar " + outName;
        li.appendChild(a);

        estado.saidas.push({ nome: outName, blob: blob, url: url });
        el.acoesResultados.classList.remove("escondido");
      },
    };
  }

  // ---------------------------------------------------------------------
  // "Baixar tudo" — zip client-side ou gravação direta numa pasta
  // ---------------------------------------------------------------------

  el.btnBaixarTudo.addEventListener("click", async () => {
    if (estado.saidas.length === 0) return;
    const textoOriginal = el.btnBaixarTudo.textContent;
    el.btnBaixarTudo.disabled = true;
    try {
      const zip = await window.ActaZip.criarZip(
        estado.saidas.map((s) => ({ nome: s.nome, blob: s.blob })),
        (feito, total) => {
          el.btnBaixarTudo.textContent = "Compactando " + feito + "/" + total + "…";
        }
      );
      const url = URL.createObjectURL(zip);
      const a = document.createElement("a");
      a.href = url;
      a.download = "acta-convertidos.zip";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      setStatus("Não foi possível montar o zip: " + err.message);
    } finally {
      el.btnBaixarTudo.textContent = textoOriginal;
      el.btnBaixarTudo.disabled = false;
    }
  });

  if (typeof window.showDirectoryPicker === "function") {
    el.btnSalvarPasta.classList.remove("escondido");
    el.btnSalvarPasta.addEventListener("click", async () => {
      if (estado.saidas.length === 0) return;
      let pasta;
      try {
        pasta = await window.showDirectoryPicker({ mode: "readwrite" });
      } catch (err) {
        return; // usuário fechou o seletor
      }
      const textoOriginal = el.btnSalvarPasta.textContent;
      el.btnSalvarPasta.disabled = true;
      try {
        let i = 0;
        for (const saida of estado.saidas) {
          i++;
          el.btnSalvarPasta.textContent = "Gravando " + i + "/" + estado.saidas.length + "…";
          const handle = await pasta.getFileHandle(saida.nome, { create: true });
          const escrita = await handle.createWritable();
          await escrita.write(saida.blob);
          await escrita.close();
        }
        setStatus(estado.saidas.length + " arquivo(s) gravados na pasta escolhida.");
      } catch (err) {
        setStatus("Falha ao gravar na pasta: " + err.message);
      } finally {
        el.btnSalvarPasta.textContent = textoOriginal;
        el.btnSalvarPasta.disabled = false;
      }
    });
  }

  // ---------------------------------------------------------------------
  // Orquestração — o que roda quando o usuário clica em "Iniciar"
  // ---------------------------------------------------------------------

  async function processarArquivoConversao(ffmpeg, file, opcao, linha) {
    const ext = extOf(file.name);
    const tarefas = [];
    if (opcao === "1" || opcao === "4" || opcao === "8") {
      if (AUDIO_EXTS.includes(ext)) tarefas.push(["áudio", (p) => convertAudioFile(ffmpeg, file, p)]);
    }
    if (opcao === "2" || opcao === "4" || opcao === "8") {
      if (VIDEO_EXTS.includes(ext)) tarefas.push(["vídeo", (p) => convertVideoFile(ffmpeg, file, p)]);
    }
    if (opcao === "3" || opcao === "4" || opcao === "8") {
      if (IMAGE_EXTS.includes(ext)) tarefas.push(["imagem", (p) => convertImageFile(ffmpeg, file, p)]);
    }
    if (opcao === "5" || opcao === "8") {
      tarefas.push(["extensão", () => Promise.resolve(standardizeExtensionFile(file))]);
    }

    if (tarefas.length === 0) {
      linha.esconderBarra();
      linha.setStatus("Tipo não reconhecido para esta operação — ignorado.", "erro");
      return;
    }

    for (const tarefa of tarefas) {
      const rotulo = tarefa[0];
      const executar = tarefa[1];
      if (cancelado) return;
      try {
        linha.setStatus("Processando (" + rotulo + ")…");
        const resultado = await executar((p) => linha.setProgresso(p));
        if (resultado.skipped) {
          linha.esconderBarra();
          linha.setStatus("Sem alteração (" + resultado.reason + ").", "ok");
          continue;
        }
        linha.setStatus("Concluído (" + rotulo + ").", "ok");
        linha.adicionarDownload(resultado.blob, resultado.outName);
      } catch (err) {
        if (cancelado) return;
        linha.esconderBarra();
        linha.setStatus("Falha ao processar (" + rotulo + "): " + err.message, "erro");
      }
    }
  }

  function entrarModoExecucao() {
    estado.rodando = true;
    cancelado = false;
    el.btnIniciar.disabled = true;
    el.btnCancelar.classList.remove("escondido");
    el.btnCancelar.disabled = false;
    el.btnLimpar.disabled = true;
  }

  function sairModoExecucao() {
    estado.rodando = false;
    el.btnCancelar.classList.add("escondido");
    el.btnLimpar.disabled = false;
    el.progressoLote.textContent = "";
    atualizarBotaoIniciar();
  }

  el.btnCancelar.addEventListener("click", () => {
    if (!estado.rodando) return;
    cancelado = true;
    el.btnCancelar.disabled = true;
    setStatus(
      "Cancelando… O motor de conversão é encerrado; na próxima execução ele " +
      "volta do cache do navegador."
    );
    setBarraMotor(null);
    derrubarMotor();
  });

  async function iniciar() {
    entrarModoExecucao();
    limparSaidas();
    el.resultadosWrapper.classList.remove("escondido");
    el.listaResultados.innerHTML = "";

    let ffmpeg;
    try {
      ffmpeg = await getFFmpeg(setStatus, onProgressoMotor);
    } catch (err) {
      setStatus(
        cancelado
          ? "Cancelado antes de o motor terminar de carregar."
          : "Erro ao carregar o motor de conversão: " + err.message
      );
      setBarraMotor(null);
      sairModoExecucao();
      return;
    }
    if (cancelado) {
      setStatus("Cancelado.");
      sairModoExecucao();
      return;
    }
    setStatus("");

    try {
      if (estado.opcao === "9") {
        const file = estado.arquivos[0];
        const ehVideo = estado.tipoCompressao === "video";
        const linha = criarLinhaResultado(caminhoDe(file), file.size);
        const nivel = nivelSelecionado();
        const custom = nivel !== "5"
          ? null
          : ehVideo ? lerNivelPersonalizado() : lerNivelPersonalizadoAudio();
        try {
          linha.setStatus(ehVideo ? "Analisando o vídeo…" : "Analisando o áudio…");
          const comprimir = ehVideo ? compressVideoFile : compressAudioFile;
          const resultado = await comprimir(ffmpeg, file, nivel, custom, (p) => linha.setProgresso(p));
          linha.setStatus("Concluído.", "ok");
          linha.adicionarDownload(resultado.blob, resultado.outName);
        } catch (err) {
          linha.esconderBarra();
          linha.setStatus(cancelado ? "Cancelado." : "Falha: " + err.message, "erro");
        }
      } else {
        const total = estado.arquivos.length;
        for (let i = 0; i < total; i++) {
          if (cancelado) break;
          const file = estado.arquivos[i];
          el.progressoLote.textContent = "arquivo " + (i + 1) + " de " + total;
          const linha = criarLinhaResultado(caminhoDe(file), file.size);
          await processarArquivoConversao(ffmpeg, file, estado.opcao, linha);
        }
      }
    } finally {
      if (cancelado) {
        setStatus("Cancelado. Os arquivos já concluídos continuam disponíveis abaixo.");
      }
      sairModoExecucao();
    }
  }

  el.btnIniciar.addEventListener("click", iniciar);

  document.addEventListener("DOMContentLoaded", async () => {
    diag(
      "Conversor carregado.",
      VERBOSE ? "Modo verboso ligado (?debug=1)." : "Use ?debug=1 na URL para ver o log linha-a-linha do ffmpeg."
    );

    const ambiente = await diagnosticarIsolamento();

    if (!window.crossOriginIsolated) {
      await diagnosticarArquivosDoMotor();
      setStatus(
        "Aviso: esta página não está isolada (COOP/COEP) — o motor de conversão " +
        "não vai carregar. Abra o console do navegador (F12) para ver o " +
        "diagnóstico de qual cabeçalho faltou."
      );
    } else {
      diag("Página isolada — SharedArrayBuffer disponível, motor pode carregar.", ambiente.url);
    }
  });
})();
