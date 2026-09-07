/**
 * CONVERSOR-MOTOR.JS
 * ---------------------------------------------------------------------------
 * O ffmpeg.wasm: baixar o núcleo, carregá-lo e rodar comandos. Não conhece
 * a página — não lê nem escreve um elemento sequer, e recebe por parâmetro
 * quem quiser acompanhar o andamento.
 *
 * Junto vem o diagnóstico, que existe para responder "por que o motor não
 * carregou?" sem depurador. As duas coisas moram no mesmo arquivo porque
 * quase todo log daqui é sobre o carregamento do motor.
 *
 * OS GANCHOS
 * O ffmpeg entrega andamento e log por evento, e quem quer ouvir é a
 * página. Em vez de um parâmetro atravessando cinco funções, há um objeto
 * `ganchos` com dois campos que o chamador escreve e apaga:
 *
 *   ganchos.progresso = (evento) => …   // { progress, time }
 *   ganchos.log       = (linha)  => …   // uma linha do ffmpeg
 *
 * Sempre em par: quem escreve limpa no `finally`. Deixar um gancho vivo
 * depois do trabalho faz a barra de um arquivo mexer com o log de outro.
 * ---------------------------------------------------------------------------
 */
(function () {
  "use strict";

  const { humanSize } = window.Formatos;
  const {
    ARGS_PROGRESSO,
    ARQUIVOS_CORE,
    CACHE_MOTOR,
    LOADER_LOCAL,
    TIMEOUT_LOAD_MS,
    explicarFalha,
    parseMediaInfo,
  } = window.ConversorRegras;

  // ---------------------------------------------------------------------
  // Diagnóstico
  //
  // Os logs abaixo existem para responder "por que o motor não carregou?"
  // sem precisar de um depurador. O bloco resumido sai sempre; o log
  // linha-a-linha do próprio ffmpeg só sai com ?debug=1 na URL, porque são
  // centenas de linhas por conversão.
  //
  // A marca e o filtro de ?debug=1 vieram para js/comum/log.js quando as
  // outras ferramentas ganharam log: os nomes locais ficam como apelidos
  // para não reescrever as duas centenas de chamadas deste arquivo e do
  // conversor.js.
  // ---------------------------------------------------------------------

  const log = window.Log.criar("conversor");

  const VERBOSE = log.verbose;
  const diag = log.info;
  const diagAviso = log.aviso;
  const diagErro = log.erro;
  const desdeOInicio = log.desdeOInicio;

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
          "| mensagem:", ev.message || "(vazia — o script não chegou a rodar)",
          "| origem:", (ev.filename || "?") + ":" + (ev.lineno || "?")
        );
        // Um ErrorEvent vazio não distingue 404, 401 e falha de política.
        // Buscar a URL na hora responde qual dos três foi.
        if (alvo.startsWith("blob:")) return;
        fetch(alvo, { cache: "no-store" }).then(
          (resp) => {
            diagErro("Investigando " + alvo + ":", {
              status: resp.status,
              "Content-Type": resp.headers.get("content-type") || "(ausente)",
              "Cross-Origin-Embedder-Policy": resp.headers.get("cross-origin-embedder-policy") || "(AUSENTE)",
              "Cross-Origin-Resource-Policy": resp.headers.get("cross-origin-resource-policy") || "(ausente)",
            });
            if (resp.ok && !resp.headers.get("cross-origin-embedder-policy")) {
              diagErro(
                "O script do worker existe (" + resp.status + ") mas veio SEM " +
                "Cross-Origin-Embedder-Policy. Num documento isolado, o worker " +
                "precisa desse cabeçalho para poder usar SharedArrayBuffer — " +
                "aplique COOP/COEP a todas as rotas, não só à página."
              );
            }
          },
          (err) => diagErro("Nem o fetch de " + alvo + " passou:", err)
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
  // Auxiliares de carregamento
  // ---------------------------------------------------------------------

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

  // ---------------------------------------------------------------------
  // Motor ffmpeg (instância única, carregada sob demanda e cacheada)
  // ---------------------------------------------------------------------

  let ffmpegInstance = null;
  let ffmpegLoadingPromise = null;
  let ffmpegEmConstrucao = null;
  let logSink = null;
  // ultimas linhas do ffmpeg, para explicar uma falha
  const CAUDA_MAX = 40;
  let logCauda = [];
  // null = ainda nao sei se este core aceita -progress pipe:1
  let progressoSuportado = null;
  // Ver OS GANCHOS no cabeçalho.
  const ganchos = { progresso: null, log: null };

  function attachSinks(ffmpeg) {
    ffmpeg.on("log", ({ message }) => {
      if (logSink) logSink.push(message);
      logCauda.push(message);
      if (logCauda.length > CAUDA_MAX) logCauda.shift();
      if (ganchos.log) ganchos.log(message);
      if (VERBOSE) console.debug("[ffmpeg]", message);
    });
    // repassa o payload inteiro: o campo `time` (microssegundos) é o que
    // realmente serve para medir andamento — ver criarAcompanhante(),
    // em js/conversor/conversor.js
    ffmpeg.on("progress", (evento) => {
      if (ganchos.progresso) ganchos.progresso(evento || {});
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

    // O denominador tem de ser o tamanho DESCOMPRIMIDO, porque lerCorpo()
    // conta bytes já decodificados. O Content-Length do jsDelivr é o tamanho
    // comprimido (br/gzip) — usá-lo faria a barra bater 100% com um terço do
    // download. Por isso o valor declarado manda, e o Content-Length só
    // entra se não houver declaração.
    let total = 0;
    let origemDoTotal = "tamanhos declarados em ARQUIVOS_CORE";
    for (const f of fontes) {
      if (f.spec.bytes) {
        total += f.spec.bytes;
      } else {
        const n = Number(f.resp.headers.get("content-length"));
        total += Number.isFinite(n) && n > 0 ? n : 0;
        origemDoTotal = "Content-Length (pode estar comprimido)";
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
      // Comparação honesta: bytes efetivamente lidos (já descomprimidos)
      // contra o valor declarado. Pega constante desatualizada de verdade.
      if (f.spec.bytes && buf.byteLength !== f.spec.bytes) {
        diagAviso(
          "O tamanho declarado de " + f.spec.url.split("/").pop() + " (" + f.spec.bytes +
          " bytes) não bate com o recebido (" + buf.byteLength + " bytes). Atualize ARQUIVOS_CORE."
        );
      }
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
          diagErro("window.FFmpegWASM não existe — js/conversor/vendor/ffmpeg/ffmpeg.js não carregou.");
          throw new Error(
            "A biblioteca ffmpeg.js não carregou. Confira se js/conversor/vendor/ffmpeg/ffmpeg.js " +
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
        // Isso importa: elas são repassadas ao worker js/conversor/vendor/ffmpeg/
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
    ganchos.progresso = null;
    logSink = null;
  }

  /** Envolve ffmpeg.exec logando o argv, o código de saída e o tempo gasto. */
  async function execComLog(ffmpeg, args, opcoes) {
    // a sonda sai com código 1 de propósito (não há arquivo de saída),
    // então nesse caso o log não é sintoma de nada
    const falhaEsperada = !!(opcoes && opcoes.falhaEsperada);
    diag("ffmpeg", args.join(" "));
    const inicio = performance.now();
    logCauda = [];
    try {
      const code = await ffmpeg.exec(args);
      const ms = Math.round(performance.now() - inicio);
      if (code) {
        if (!falhaEsperada) {
          diagAviso("ffmpeg saiu com código", code, "em " + ms + "ms");
          despejarCauda();
        }
      } else {
        diag("ffmpeg ok em " + ms + "ms");
      }
      return code;
    } catch (err) {
      diagErro("ffmpeg lançou exceção em " + Math.round(performance.now() - inicio) + "ms:", err);
      despejarCauda();
      throw err;
    }
  }

  /** Mostra o fim do log do ffmpeg — é onde a razão da falha aparece. */
  function despejarCauda() {
    if (logCauda.length === 0) {
      diagAviso("O ffmpeg não deixou nenhuma linha de log.");
      return;
    }
    const explicacao = explicarFalha(logCauda);
    if (explicacao) diagErro("Provável causa:", explicacao);
    diagErro("Últimas " + logCauda.length + " linhas do ffmpeg:");
    for (const linha of logCauda) console.error("    " + linha);
  }

  /**
   * Roda a compressão pedindo andamento. Se falhar COM `-progress pipe:1`,
   * tenta uma vez sem: nem todo core aceita abrir esse pipe, e é melhor
   * perder a barra do que perder a conversão.
   */
  async function execCompressao(ffmpeg, args, outName) {
    const tentarProgresso = progressoSuportado !== false;
    let code = await execComLog(ffmpeg, tentarProgresso ? [...ARGS_PROGRESSO, ...args] : args);

    // Só vale repetir se o log realmente acusar o pipe. Repetir por
    // qualquer falha dobraria a espera de um encode longo à toa.
    const culpaDoPipe = logCauda.some((l) => /pipe:|progress/i.test(l) && /not found|Invalid|error/i.test(l));
    if (code && tentarProgresso && culpaDoPipe) {
      try { await ffmpeg.deleteFile(outName); } catch (e) {}
      diagAviso("O log acusa o -progress pipe:1. Repetindo sem ele…");
      code = await execComLog(ffmpeg, args);
      if (!code) {
        progressoSuportado = false;
        diagAviso(
          "Confirmado: este core recusa -progress pipe:1. O andamento detalhado " +
          "fica desativado nesta sessão; o tempo decorrido continua contando."
        );
      }
    } else if (!code && tentarProgresso) {
      progressoSuportado = true;
    }
    return code;
  }

  /** Sonda um arquivo que ja esta no FS do ffmpeg, sem reescreve-lo. */
  async function probeArquivoEscrito(ffmpeg, inName) {
    logSink = [];
    try {
      await execComLog(ffmpeg, ["-i", inName], { falhaEsperada: true });
    } catch (e) {
      // esperado: sem arquivo de saida, ffmpeg "falha" - so queremos o log
    }
    const texto = logSink.join(String.fromCharCode(10));
    logSink = null;
    return parseMediaInfo(texto);
  }

  /** Últimas linhas do log, para quem precisa explicar uma falha. */
  function cauda() {
    return logCauda.slice();
  }

  window.ConversorMotor = {
    VERBOSE,
    diag,
    diagAviso,
    diagnosticarIsolamento,
    diagnosticarArquivosDoMotor,
    fileToUint8,
    getFFmpeg,
    derrubarMotor,
    execComLog,
    execCompressao,
    probeArquivoEscrito,
    ganchos,
    cauda,
  };
})();
