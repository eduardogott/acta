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
 *   9 - Comprimir vídeos OU áudios, em fila
 *       (baixa/média/alta/extrema/personalizada/tamanho-alvo; o tipo é
 *        detectado pela extensão e precisa ser o mesmo em toda a seleção)
 *
 * Acrescentadas aqui, sem correspondência no script Python:
 *
 *   6 - Extrair a faixa de áudio de um vídeo para MP3
 *   7 - Extrair um quadro do vídeo (instante à escolha) para JPG
 *
 * As opções 1/2/3 já entregam o arquivo comprimido (ver CONVERSAO_*): o
 * destino desses arquivos tem limite de 20 MB, então converter sem
 * comprimir só adiaria o problema. O que elas nunca fazem é AUMENTAR o
 * arquivo — bitrate, sample rate e resolução nunca sobem acima do
 * original, e um vídeo que já esteja abaixo da linha de base é apenas
 * remuxado, sem recompressão nenhuma.
 *
 * TRÊS ARQUIVOS
 * Este é o da página: as operações (que montam as linhas de comando do
 * ffmpeg) e a interface. Os outros dois não conhecem a página:
 *
 *   js/conversor/regras.js  configuração, planejamento de tamanho e
 *                           leitura do log — só contas, testáveis sozinhas
 *   js/conversor/motor.js   baixar o núcleo do ffmpeg, carregá-lo e rodar
 *                           comandos, mais o diagnóstico do carregamento
 *
 * A ordem no HTML importa: regras, motor, e só então este.
 */

(function () {
  "use strict";

  // Formatação de tamanho e de tempo mora em js/comum/formatos.js: a
  // transcrição usa as mesmas funções.
  const { humanSize, formatarTempo, parseTempo } = window.Formatos;

  // As regras e as contas — configuração, planejamento de tamanho, leitura
  // do log do ffmpeg — moram em js/conversor/regras.js, longe do DOM, para
  // poderem ser testadas sem abrir a página.
  const {
    AUDIO_EXTS,
    CONVERSAO_AUDIO,
    CONVERSAO_VIDEO,
    EXTENSION_MAP,
    IMAGE_EXTS,
    LEVEL_AUDIO,
    LEVEL_AUDIO_ONLY,
    LEVEL_VIDEO,
    LIMITE_AVISO_MEMORIA,
    QSCALE_JPEG_90,
    RESUMO_AUDIO,
    RESUMO_VIDEO,
    VIDEO_EXTS,
    argsAudioAac,
    baseName,
    estimarConversaoVideo,
    estimarTamanho,
    extOf,
    planejarAlvo,
    planejarAlvoAudio,
    problemaDeCodec,
    roundEven,
    tipoComumDeCompressao,
    tipoDoArquivo,
  } = window.ConversorRegras;

  // O ffmpeg.wasm — baixar, carregar e rodar — mora em
  // js/conversor/motor.js, que não conhece esta página.
  const {
    VERBOSE,
    cauda,
    derrubarMotor,
    diag,
    diagAviso,
    diagnosticarArquivosDoMotor,
    diagnosticarIsolamento,
    execComLog,
    execCompressao,
    fileToUint8,
    ganchos,
    getFFmpeg,
    probeArquivoEscrito,
  } = window.ConversorMotor;

  /** Caminho a exibir: arquivos vindos de pasta (input ou arrasto) mostram o caminho. */
  function caminhoDe(file) {
    return file.caminhoRelativo || file.webkitRelativePath || file.name;
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

  async function probeMediaInfo(ffmpeg, file) {
    const inName = "probe" + extOf(file.name);
    await etapa("Sonda: escrever " + humanSize(file.size) + " no FS",
                async () => ffmpeg.writeFile(inName, await fileToUint8(file)));
    try {
      return await probeArquivoEscrito(ffmpeg, inName);
    } finally {
      try { await ffmpeg.deleteFile(inName); } catch (e) {}
    }
  }

  // ---------------------------------------------------------------------
  // Operações (opções 1, 2, 3, 5)
  // ---------------------------------------------------------------------

  /**
   * Converte qualquer áudio para MP3 na linha de base (CONVERSAO_AUDIO).
   *
   * Bitrate e sample rate são TETO, não alvo: um arquivo que já esteja
   * abaixo deles sai com os próprios números. Reencodar um áudio de
   * 64 kbps a 128 kbps dobraria o arquivo sem recuperar nada do que a
   * compressão anterior descartou.
   *
   * Um .mp3 de entrada continua passando intacto. Recomprimi-lo aqui
   * atingiria também as opções 4 e 8, que varrem pastas inteiras — quem
   * quer encolher um MP3 que já é MP3 usa a opção 9.
   */
  async function convertAudioFile(ffmpeg, file, onProgress) {
    const ext = extOf(file.name);
    if (ext === ".mp3") return { skipped: true, reason: "já é mp3" };
    const inName = "in" + ext;
    const outName = baseName(file.name) + ".mp3";
    await ffmpeg.writeFile(inName, await fileToUint8(file));
    ganchos.progresso = onProgress
      ? (ev) => onProgress(Math.min(1, Math.max(0, (ev && ev.progress) || 0)))
      : null;
    let code;
    try {
      // sonda o arquivo que já está no FS, para não escrevê-lo duas vezes
      const info = await probeArquivoEscrito(ffmpeg, inName);
      const bitrate = Math.min(CONVERSAO_AUDIO.kbps, info.aBitrate || CONVERSAO_AUDIO.kbps);
      const samplerate = Math.min(CONVERSAO_AUDIO.hz, info.aSampleRate || CONVERSAO_AUDIO.hz);
      diag("Converter áudio:", {
        origem: (info.aBitrate || "?") + " kbps / " + (info.aSampleRate || "?") + " Hz",
        saída: bitrate + " kbps / " + samplerate + " Hz",
      });
      code = await execComLog(ffmpeg, [
        "-i", inName, "-vn", "-codec:a", "libmp3lame",
        "-b:a", bitrate + "k", "-ar", String(samplerate), outName,
      ]);
    } finally {
      ganchos.progresso = null;
      try { await ffmpeg.deleteFile(inName); } catch (e) {}
    }
    if (code) throw new Error("ffmpeg retornou erro ao converter áudio");
    const data = await ffmpeg.readFile(outName);
    await ffmpeg.deleteFile(outName);
    return { blob: new Blob([data.buffer], { type: "audio/mpeg" }), outName };
  }

  /**
   * Converte para MP4, já na linha de base de compressão (CONVERSAO_VIDEO).
   *
   * O `-c copy` cego era um problema: um webm de AV1 (o que o yt-dlp costuma
   * baixar do YouTube) era simplesmente empacotado num MP4, gerando um
   * arquivo que este mesmo motor não consegue reabrir — e que contraria a
   * regra de sair sempre em H.264/AAC por compatibilidade.
   *
   * A escolha do caminho tem duas perguntas. A primeira é se dá para
   * copiar o vídeo (só h264). A segunda é se vale a pena: se a linha de
   * base produziria um arquivo MAIOR que o original — vídeo curto, já
   * comprimido, ou de bitrate baixo —, recomprimir seria perder qualidade
   * para ganhar tamanho, então o arquivo é apenas remuxado.
   *
   *   h264 já enxuto + aac/mp3   → `-c copy`, sem perda nenhuma
   *   h264 já enxuto + outro som → copia o vídeo, recodifica só o áudio
   *   qualquer outro caso        → recodifica em CRF 23 + AAC 128k/32 kHz
   */
  async function convertVideoFile(ffmpeg, file, onProgress) {
    const ext = extOf(file.name);
    if (ext === ".mp4") return { skipped: true, reason: "já é mp4" };
    const inName = "in" + ext;
    const outName = baseName(file.name) + ".mp4";
    await ffmpeg.writeFile(inName, await fileToUint8(file));

    let code;
    try {
      // sonda o arquivo que já está no FS, para não escrevê-lo duas vezes
      const info = await probeArquivoEscrito(ffmpeg, inName);
      const problema = problemaDeCodec(info);
      if (problema) throw new Error(problema);

      const somCompativel = !info.hasAudio || info.aCodec === "aac" || info.aCodec === "mp3";
      const podeCopiarVideo = info.vCodec === "h264";

      // Sem duração ou dimensões não dá para estimar; nesse caso a dúvida
      // se resolve a favor de não mexer no que já está em h264.
      const estimativa = estimarConversaoVideo(info);
      const valeRecomprimir = estimativa !== null && estimativa < file.size;
      const copiar = podeCopiarVideo && !valeRecomprimir;

      diag("Converter vídeo:", {
        vídeo: info.vCodec || "?", áudio: info.aCodec || "(sem áudio)",
        original: humanSize(file.size),
        "linha de base estimada": estimativa === null ? "indeterminada" : humanSize(estimativa),
        estratégia: copiar ? (somCompativel ? "remux" : "copiar vídeo, recodificar áudio")
                           : "recodificar em CRF " + CONVERSAO_VIDEO.crf,
      });

      ganchos.progresso = onProgress
        ? (ev) => onProgress(Math.min(1, Math.max(0, (ev && ev.progress) || 0)))
        : null;

      if (copiar && somCompativel) {
        code = await execComLog(ffmpeg, [
          "-i", inName, "-map", "0", "-c", "copy", "-movflags", "+faststart", outName,
        ]);
      } else if (copiar) {
        code = await execComLog(ffmpeg, [
          "-i", inName, "-c:v", "copy",
          ...argsAudioAac(info, CONVERSAO_VIDEO.audioKbps, CONVERSAO_VIDEO.audioHz, false),
          "-movflags", "+faststart", outName,
        ]);
      } else {
        code = 1; // força o caminho de recodificação abaixo
      }

      if (code) {
        try { await ffmpeg.deleteFile(outName); } catch (e) {}
        const audioArgs = info.hasAudio
          ? argsAudioAac(info, CONVERSAO_VIDEO.audioKbps, CONVERSAO_VIDEO.audioHz, false)
          : ["-an"];
        code = await execComLog(ffmpeg, [
          "-i", inName,
          "-c:v", "libx264", "-crf", String(CONVERSAO_VIDEO.crf),
          "-preset", CONVERSAO_VIDEO.preset, "-pix_fmt", "yuv420p",
          ...audioArgs, "-movflags", "+faststart", outName,
        ]);
      }
    } finally {
      ganchos.progresso = null;
      try { await ffmpeg.deleteFile(inName); } catch (e) {}
    }
    if (code) throw new Error("ffmpeg retornou erro ao converter vídeo");
    const data = await ffmpeg.readFile(outName);
    await ffmpeg.deleteFile(outName);
    return { blob: new Blob([data.buffer], { type: "video/mp4" }), outName };
  }

  /**
   * Converte qualquer imagem para JPG já comprimido (QSCALE_JPEG_90).
   *
   * `-frames:v 1` protege contra GIF animado: sem isso o mjpeg escreveria
   * todos os quadros concatenados num arquivo .jpg só.
   *
   * Um .jpg de entrada continua passando intacto — recomprimi-lo aqui
   * atingiria também as opções 4 e 8, que varrem pastas inteiras, e
   * degradaria em silêncio fotos que já estavam boas.
   */
  async function convertImageFile(ffmpeg, file, onProgress) {
    const ext = extOf(file.name);
    if (ext === ".jpg") return { skipped: true, reason: "já é jpg" };
    const inName = "in" + ext;
    const outName = baseName(file.name) + ".jpg";
    await ffmpeg.writeFile(inName, await fileToUint8(file));
    ganchos.progresso = onProgress
      ? (ev) => onProgress(Math.min(1, Math.max(0, (ev && ev.progress) || 0)))
      : null;
    let code;
    try {
      code = await execComLog(ffmpeg, ["-i", inName, "-frames:v", "1", "-q:v", QSCALE_JPEG_90, outName]);
    } finally {
      ganchos.progresso = null;
      try { await ffmpeg.deleteFile(inName); } catch (e) {}
    }
    if (code) throw new Error("ffmpeg retornou erro ao converter imagem");
    const data = await ffmpeg.readFile(outName);
    await ffmpeg.deleteFile(outName);
    return { blob: new Blob([data.buffer], { type: "image/jpeg" }), outName };
  }

  // ---------------------------------------------------------------------
  // Extrações (opções 6 e 7)
  // ---------------------------------------------------------------------

  /**
   * Tira só a faixa de áudio de um vídeo e entrega um MP3.
   *
   * `-q:a 2` (VBR, ~190 kbps) e não `-q:a 0` como na opção 1: aqui a
   * origem é uma faixa já comprimida dentro do vídeo, e o ajuste mais
   * caprichado gastaria o dobro do espaço guardando fielmente o ruído da
   * compressão anterior.
   */
  async function extractAudioFile(ffmpeg, file, onProgress) {
    const ext = extOf(file.name);
    const inName = "ex" + ext;
    const outName = baseName(file.name) + ".mp3";
    await ffmpeg.writeFile(inName, await fileToUint8(file));
    ganchos.progresso = onProgress
      ? (ev) => onProgress(Math.min(1, Math.max(0, (ev && ev.progress) || 0)))
      : null;
    let code;
    try {
      code = await execComLog(ffmpeg, ["-i", inName, "-vn", "-c:a", "libmp3lame", "-q:a", "2", outName]);
    } finally {
      ganchos.progresso = null;
      try { await ffmpeg.deleteFile(inName); } catch (e) {}
    }
    if (code) {
      // O caso comum de falha aqui é o vídeo simplesmente não ter som —
      // vale dizer isso em vez de repetir "o ffmpeg deu erro".
      const semSom = cauda().some((l) => /does not contain any stream|Output file .* empty/i.test(l));
      throw new Error(semSom ? "Este vídeo não tem faixa de áudio." : "ffmpeg retornou erro ao extrair o áudio");
    }
    const data = await ffmpeg.readFile(outName);
    await ffmpeg.deleteFile(outName);
    return { blob: new Blob([data.buffer], { type: "audio/mpeg" }), outName };
  }

  /**
   * Captura um único quadro do vídeo, no instante pedido (em segundos).
   *
   * `-ss` vem antes do `-i` pelo mesmo motivo do corte de trecho: o seek
   * fica rápido em vez de decodificar o vídeo inteiro até chegar lá.
   */
  async function extractFrameFile(ffmpeg, file, instante) {
    const ext = extOf(file.name);
    const inName = "fr" + ext;
    const outName = baseName(file.name) + "_quadro_" + formatarTempo(instante).replace(/:/g, "-") + ".jpg";
    await ffmpeg.writeFile(inName, await fileToUint8(file));
    let code;
    try {
      const antes = instante > 0 ? ["-ss", String(instante)] : [];
      code = await execComLog(ffmpeg, [
        ...antes, "-i", inName, "-frames:v", "1", "-q:v", QSCALE_JPEG_90, outName,
      ]);
    } finally {
      try { await ffmpeg.deleteFile(inName); } catch (e) {}
    }
    // Um instante além do fim do vídeo não é erro para o ffmpeg: ele
    // termina em paz sem escrever quadro nenhum. Por isso a leitura da
    // saída é que decide se deu certo.
    let data = null;
    try {
      data = await ffmpeg.readFile(outName);
    } catch (e) {}
    if (!data || data.length === 0) {
      try { await ffmpeg.deleteFile(outName); } catch (e) {}
      if (code) throw new Error("ffmpeg retornou erro ao extrair o quadro");
      throw new Error(
        "Nenhum quadro em " + formatarTempo(instante) + " — o vídeo é mais curto que isso."
      );
    }
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

  async function compressAudioFile(ffmpeg, file, level, custom, opcoes) {
    const { info: infoConhecida, corte, onAndamento } = opcoes || {};
    const info = infoConhecida || (await probeMediaInfo(ffmpeg, file));
    const ext = extOf(file.name);
    const inName = "ain" + ext;
    const outName = baseName(file.name) + "_comprimido.mp3";
    await etapa("Escrever " + humanSize(file.size) + " no FS do ffmpeg",
                async () => ffmpeg.writeFile(inName, await fileToUint8(file)));

    let alvo;
    if (level === "5") {
      alvo = { bitrate: custom.bitrate, samplerate: custom.samplerate, mono: custom.mono,
               // no nivel manual vale o ajuste mais caprichado do LAME
               compressionLevel: 0 };
    } else if (level === "6") {
      const duracao = duracaoDoTrabalho(info, corte);
      if (!duracao) {
        throw new Error(
          "Não consegui descobrir a duração deste áudio, e o Tamanho-alvo depende dela. " +
          "Use um dos níveis fixos."
        );
      }
      alvo = planejarAlvoAudio(info, duracao, custom.alvoBytes);
      diag("Tamanho-alvo (áudio):", {
        "alvo": humanSize(custom.alvoBytes), "duração (s)": Math.round(duracao),
        "bitrate (kbps)": alvo.bitrate, "sample rate": alvo.samplerate || "original",
        "mono": alvo.mono, "cabe no alvo": alvo.cabe,
      });
      if (!alvo.cabe) {
        diagAviso("O alvo é menor do que o bitrate mínimo do MP3 produz nessa duração — " +
                  "o arquivo vai sair maior que o pedido.");
      }
    } else {
      alvo = LEVEL_AUDIO_ONLY[level];
    }

    // Nunca sobe acima do original: recomprimir para cima só aumenta o arquivo.
    let bitrate = alvo.bitrate;
    if (info.aBitrate && info.aBitrate < bitrate) bitrate = info.aBitrate;
    let samplerate = alvo.samplerate;
    if (samplerate && info.aSampleRate && info.aSampleRate < samplerate) samplerate = info.aSampleRate;
    const mono = alvo.mono || info.aChannels === 1;

    const recorte = argumentosDeCorte(corte);
    const args = [...recorte.antes, "-i", inName, ...recorte.depois,
                  "-vn", "-c:a", "libmp3lame", "-b:a", bitrate + "k",
                  "-ac", mono ? "1" : String(info.aChannels || 2)];
    if (samplerate) args.push("-ar", String(samplerate));
    if (alvo.compressionLevel !== undefined && alvo.compressionLevel !== null) {
      args.push("-compression_level", String(alvo.compressionLevel));
    }
    args.push(outName);

    const pararAcompanhamento = acompanharEncode(duracaoDoTrabalho(info, corte), onAndamento);
    let code;
    try {
      code = await execCompressao(ffmpeg, args, outName);
    } finally {
      pararAcompanhamento();
      try { await ffmpeg.deleteFile(inName); } catch (e) {}
    }
    if (code) throw new Error("ffmpeg retornou erro ao comprimir o áudio");
    const data = await etapa("Ler a saída", () => ffmpeg.readFile(outName));
    await ffmpeg.deleteFile(outName);
    return { blob: new Blob([data.buffer], { type: "audio/mpeg" }), outName };
  }

  async function compressVideoFile(ffmpeg, file, level, custom, opcoes) {
    const { info: infoConhecida, corte, onAndamento } = opcoes || {};
    const info = infoConhecida || (await probeMediaInfo(ffmpeg, file));

    // Falhar aqui, com explicação, é melhor que deixar o ffmpeg morrer
    // depois de escrever o arquivo inteiro no FS.
    const problema = problemaDeCodec(info);
    if (problema) throw new Error(problema);
    const ext = extOf(file.name);
    const inName = "cin" + ext;
    const outName = baseName(file.name) + "_comprimido.mp4";
    await etapa("Escrever " + humanSize(file.size) + " no FS do ffmpeg",
                async () => ffmpeg.writeFile(inName, await fileToUint8(file)));

    let crf, preset;
    // Preenchido só no nível Tamanho-alvo: lá o controle é por bitrate, e
    // não por CRF — é a única forma de mirar num tamanho.
    let bitrateVideo = null;
    let newW = info.width, newH = info.height, targetFps = null;
    let audioArgs = ["-an"];

    const montarAudio = (bitrate, samplerate, mono) => argsAudioAac(info, bitrate, samplerate, mono);

    if (level === "6") {
      const duracao = duracaoDoTrabalho(info, corte);
      if (!duracao) {
        throw new Error(
          "Não consegui descobrir a duração deste vídeo, e o Tamanho-alvo depende dela. " +
          "Use um dos níveis fixos."
        );
      }
      const plano = planejarAlvo(info, duracao, custom.alvoBytes);
      preset = "medium";
      bitrateVideo = plano.videoKbps;
      newW = plano.width;
      newH = plano.height;
      if (info.hasAudio && plano.audioKbps) {
        audioArgs = montarAudio(plano.audioKbps, plano.samplerate, plano.mono);
      }
      diag("Tamanho-alvo (vídeo):", {
        "alvo": humanSize(custom.alvoBytes), "duração (s)": Math.round(duracao),
        "vídeo (kbps)": plano.videoKbps, "áudio (kbps)": plano.audioKbps || "sem áudio",
        "resolução": newW && newH ? newW + "x" + newH : "original", "cabe no alvo": plano.cabe,
      });
      if (!plano.cabe) {
        diagAviso("O alvo é menor do que o bitrate mínimo utilizável produz nessa duração — " +
                  "o arquivo vai sair maior que o pedido. Cortar um trecho resolve.");
      }
    } else if (level !== "5") {
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
      preset = "medium";
      if (custom.width && info.width && info.height) {
        newW = roundEven(custom.width);
        newH = roundEven((custom.width * info.height) / info.width);
      }
      if (custom.fps && (!info.fps || custom.fps < info.fps)) targetFps = custom.fps;
      if (info.hasAudio && !custom.removeAudio) {
        audioArgs = montarAudio(custom.audioBitrate, custom.audioSampleRate, custom.mono);
      }
    }

    // No Tamanho-alvo o encode é por bitrate médio (ABR de uma passada). O
    // -maxrate/-bufsize existe para o pico não estourar o alvo num trecho
    // agitado; duas passadas seriam mais exatas, mas dobrariam um encode
    // que aqui já é lento.
    const vArgs = bitrateVideo
      ? ["-c:v", "libx264", "-b:v", bitrateVideo + "k",
         "-maxrate", Math.round(bitrateVideo * 1.25) + "k",
         "-bufsize", Math.round(bitrateVideo * 2) + "k",
         "-preset", preset, "-pix_fmt", "yuv420p"]
      : ["-c:v", "libx264", "-crf", String(crf), "-preset", preset, "-pix_fmt", "yuv420p"];
    if (newW && newH && info.width && info.height && (newW !== info.width || newH !== info.height)) {
      vArgs.push("-vf", "scale=" + newW + ":" + newH);
    }
    if (targetFps) vArgs.push("-r", String(targetFps));

    const pararAcompanhamento = acompanharEncode(duracaoDoTrabalho(info, corte), onAndamento);
    let code;
    try {
      const recorte = argumentosDeCorte(corte);
      code = await execCompressao(ffmpeg, [
        ...recorte.antes, "-i", inName, ...recorte.depois,
        ...vArgs, ...audioArgs, outName,
      ], outName);
    } finally {
      pararAcompanhamento();
      try { await ffmpeg.deleteFile(inName); } catch (e) {}
    }
    if (code) throw new Error("ffmpeg retornou erro ao comprimir o vídeo");
    const data = await etapa("Ler a saída", () => ffmpeg.readFile(outName));
    await ffmpeg.deleteFile(outName);
    return { blob: new Blob([data.buffer], { type: "video/mp4" }), outName };
  }

  // ---------------------------------------------------------------------
  // Estado da UI
  // ---------------------------------------------------------------------

  // Vivia junto do motor, mas nunca foi dele: quem cancela é o usuário, e
  // quem consulta são os laços da fila.
  let cancelado = false;

  const estado = {
    opcao: null,
    arquivos: [],
    // Opção 9: "video" | "audio" | null — detectado pela extensão dos
    // arquivos. A fila exige um tipo só para toda a seleção.
    tipoCompressao: null,
    // Duração/dimensões do PRIMEIRO arquivo da opção 9, lidas sem o
    // ffmpeg. É dele que falam o painel "Arquivo original" e o corte.
    meta: null,
    // O mesmo para cada arquivo da fila, na ordem da seleção (posições
    // podem ser null quando o navegador não sabe demuxar o formato). Só
    // serve à estimativa somada do lote.
    metas: [],
    // Sonda completa do ffmpeg (fps, sample rate, bitrate, canais). So e
    // buscada quando o usuario entra no nivel "Personalizada", porque
    // exige carregar o motor.
    info: null,
    infoCarregando: false,
    tokenInfo: 0,
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
    listaSelecionados: document.getElementById("lista-selecionados"),
    avisoMemoria: document.getElementById("aviso-memoria"),
    painelCompressao: document.getElementById("painel-compressao"),
    tipoDetectado: document.getElementById("tipo-detectado"),
    nivelResumo: document.getElementById("nivel-resumo"),
    estimativa: document.getElementById("estimativa"),
    painelOriginal: document.getElementById("painel-original"),
    origCarregando: document.getElementById("original-carregando"),
    origRotulo: document.getElementById("original-rotulo"),
    linhaResolucao: document.getElementById("linha-resolucao"),
    linhaFps: document.getElementById("linha-fps"),
    origResolucao: document.getElementById("orig-resolucao"),
    origFps: document.getElementById("orig-fps"),
    origSamplerate: document.getElementById("orig-samplerate"),
    origBitrate: document.getElementById("orig-bitrate"),
    corte: document.getElementById("corte"),
    corteAtivo: document.getElementById("corte-ativo"),
    corteCampos: document.getElementById("corte-campos"),
    corteInicio: document.getElementById("corte-inicio"),
    corteFim: document.getElementById("corte-fim"),
    corteInfo: document.getElementById("corte-info"),
    corteErro: document.getElementById("corte-erro"),
    previa: document.getElementById("previa"),
    previaPalco: document.getElementById("previa-palco"),
    previaNome: document.getElementById("previa-nome"),
    previaFechar: document.getElementById("previa-fechar"),
    camposAlvo: document.getElementById("campos-alvo"),
    alvoMb: document.getElementById("alvo-mb"),
    painelQuadro: document.getElementById("painel-quadro"),
    quadroInstante: document.getElementById("quadro-instante"),
    quadroErro: document.getElementById("quadro-erro"),
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
    // As leituras da seleção anterior não valem mais e ficariam
    // desalinhadas com a nova lista até o carregarMetadados() terminar.
    estado.metas = [];
    estado.meta = null;
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
    if (estado.opcao === "9") {
      if (!estado.tipoCompressao) ok = false;
      const corte = lerCorte();
      if (ok && corte && corte.erro) ok = false;
      if (ok && nivelSelecionado() === "6" && !lerNivelAlvo().alvoBytes) ok = false;
    }
    if (estado.opcao === "7" && instanteDoQuadro() === null) ok = false;
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

    estado.tipoCompressao = tipoComumDeCompressao(estado.arquivos);

    if (estado.arquivos.length === 0) {
      el.painelCompressao.classList.add("escondido");
      return;
    }

    if (!estado.tipoCompressao) {
      const tipos = new Set(estado.arquivos.map(tipoDoArquivo));
      // Selecionar uma pasta inteira costuma trazer junto o que não é
      // mídia; dizer quantos são ajuda mais que "tipo não reconhecido".
      const foraDaLista = estado.arquivos.filter((f) => !tipoDoArquivo(f)).length;
      el.painelCompressao.classList.remove("escondido");
      el.tipoDetectado.textContent = foraDaLista
        ? foraDaLista + " arquivo(s) que não são vídeo nem áudio na seleção"
        : tipos.has("video") && tipos.has("audio")
          ? "a fila não mistura tipos — escolha só vídeos ou só áudios"
          : "tipo não reconhecido — escolha vídeos ou áudios";
      el.tipoDetectado.className = "tipo-detectado invalido";
      el.nivelResumo.textContent = "";
      el.estimativa.classList.add("escondido");
      el.personalizadaVideo.classList.add("escondido");
      el.personalizadaAudioOnly.classList.add("escondido");
      el.camposAlvo.classList.add("escondido");
      el.painelOriginal.classList.add("escondido");
      return;
    }

    const nivel = nivelSelecionado();
    const ehVideo = estado.tipoCompressao === "video";
    const quantos = estado.arquivos.length;

    el.painelCompressao.classList.remove("escondido");
    el.tipoDetectado.textContent = quantos > 1
      ? quantos + (ehVideo ? " vídeos na fila" : " áudios na fila")
      : (ehVideo ? "vídeo detectado" : "áudio detectado");
    el.tipoDetectado.className = "tipo-detectado";
    el.nivelResumo.textContent = (ehVideo ? RESUMO_VIDEO : RESUMO_AUDIO)[nivel] || "";

    // Cortar um trecho é uma escolha sobre UM arquivo: os mesmos segundos
    // aplicados a uma fila inteira quase nunca são o que se quer, e não
    // haveria como validar o intervalo contra durações diferentes.
    const podeCortar = quantos === 1;
    el.corte.classList.toggle("escondido", !podeCortar);
    if (!podeCortar && el.corteAtivo.checked) {
      el.corteAtivo.checked = false;
      atualizarPainelCorte();
    }

    const personalizada = nivel === "5";
    el.personalizadaVideo.classList.toggle("escondido", !(personalizada && ehVideo));
    el.personalizadaAudioOnly.classList.toggle("escondido", !(personalizada && !ehVideo));
    el.camposAlvo.classList.toggle("escondido", nivel !== "6");
    // O painel "Arquivo original" fala do primeiro arquivo da fila; com um
    // só, fala do arquivo — por isso o rótulo muda.
    el.painelOriginal.classList.toggle("escondido", !personalizada);

    if (personalizada) {
      renderizarInfoOriginal();
      carregarInfoDetalhada();
    }

    atualizarEstimativa();
  }

  /**
   * Lê os metadados nativos dos arquivos da opção 9 e atualiza a
   * estimativa. Vai um de cada vez, na ordem da fila, publicando o
   * resultado a cada arquivo: a leitura é rápida (só o cabeçalho, de um
   * blob local), e assim uma pasta com dezenas de arquivos não abre
   * dezenas de elementos <video> ao mesmo tempo.
   */
  function carregarMetadados() {
    estado.meta = null;
    estado.metas = [];
    el.corteAtivo.checked = false;
    el.corteInicio.value = "";
    el.corteFim.value = "";
    atualizarPainelCorte();
    estado.info = null;
    estado.infoCarregando = false;
    estado.tokenInfo++;
    const token = ++estado.tokenMeta;
    if (estado.opcao !== "9" || !estado.tipoCompressao) {
      atualizarEstimativa();
      return;
    }

    const arquivos = estado.arquivos.slice();
    (async () => {
      const metas = [];
      for (const arquivo of arquivos) {
        const meta = await lerMetadadosNativos(arquivo);
        if (token !== estado.tokenMeta) return; // a seleção mudou nesse meio-tempo
        metas.push(meta);
        estado.metas = metas.slice();
        if (metas.length === 1) {
          // o corte e o painel "Arquivo original" falam do primeiro
          estado.meta = meta;
          atualizarPainelCorte();
        }
        atualizarEstimativa();
      }
    })();
  }

  function atualizarEstimativa() {
    const esconder = () => {
      el.estimativa.classList.add("escondido");
      el.estimativa.textContent = "";
    };
    if (estado.opcao !== "9" || !estado.tipoCompressao || estado.metas.length === 0) return esconder();

    const nivel = nivelSelecionado();
    const ehVideo = estado.tipoCompressao === "video";
    const custom = nivel === "5"
      ? (ehVideo ? lerNivelPersonalizado() : lerNivelPersonalizadoAudio())
      : nivel === "6" ? lerNivelAlvo() : null;
    if (nivel === "6" && !custom.alvoBytes) return esconder();

    const corte = lerCorte();
    let somaOriginal = 0;
    let somaSaida = 0;
    let estimados = 0;
    let estourouOAlvo = false;

    estado.metas.forEach((meta, i) => {
      const arquivo = estado.arquivos[i];
      // meta null = formato que o navegador não sabe demuxar; arquivo
      // ausente = leitura de uma seleção anterior, ainda não descartada
      if (!meta || !arquivo) return;
      const ajustada = Object.assign({}, meta);
      // a sonda do ffmpeg só existe para o primeiro arquivo da fila
      if (i === 0 && estado.info && estado.info.fps) ajustada.fps = estado.info.fps;
      if (corte && !corte.erro && corte.duracao) ajustada.duracao = corte.duracao;
      const bytes = estimarTamanho(estado.tipoCompressao, ajustada, nivel, custom);
      if (!bytes) return;
      if (nivel === "6" && bytes > custom.alvoBytes) estourouOAlvo = true;
      somaSaida += bytes;
      somaOriginal += arquivo.size;
      estimados++;
    });

    if (estimados === 0) return esconder();

    const variacao = Math.round((1 - somaSaida / somaOriginal) * 100);
    const sinal = variacao >= 0 ? "−" + variacao + "%" : "+" + -variacao + "%";
    const total = estado.arquivos.length;
    const escopo = total > 1 ? "Estimativa do lote (" + estimados + " de " + total + ")" : "Estimativa";

    let texto = escopo + ": " + humanSize(somaOriginal) + " → ~" + humanSize(somaSaida) +
                " (" + sinal + "). É um cálculo aproximado — o resultado real depende do " +
                "conteúdo do arquivo.";
    if (estourouOAlvo) {
      texto += " Atenção: nesta duração o alvo pedido fica abaixo do bitrate mínimo " +
               "utilizável, então a saída vai passar do tamanho. Cortar um trecho resolve.";
    }
    el.estimativa.classList.remove("escondido");
    el.estimativa.textContent = texto;
  }

  // ---------------------------------------------------------------------
  // Painel "Arquivo original" e atalhos de fração (nível Personalizada)
  // ---------------------------------------------------------------------

  /** Sample rate escolhido num dos grupos de rádio; null = manter o original. */
  function lerSampleRate(nomeDoGrupo) {
    const marcado = document.querySelector('input[name="' + nomeDoGrupo + '"]:checked');
    const valor = marcado ? parseInt(marcado.value, 10) : NaN;
    return Number.isFinite(valor) ? valor : null;
  }

  function nomeDosCanais(n) {
    if (n === 1) return "mono";
    if (n === 2) return "estéreo";
    return n ? n + " canais" : null;
  }

  /** Valor original que serve de base para os botões 2/3, 1/2 e 1/3. */
  function baseDoAtalho(chave) {
    const meta = estado.meta || {};
    const info = estado.info || {};
    if (chave === "largura") return info.width || meta.largura || null;
    if (chave === "fps") return info.fps || null;
    if (chave === "abitrate") return info.aBitrate || null;
    return null;
  }

  /** Desabilita os atalhos cujo valor original ainda não é conhecido. */
  function atualizarAtalhos() {
    document.querySelectorAll(".atalhos").forEach((grupo) => {
      const base = baseDoAtalho(grupo.dataset.base);
      grupo.classList.toggle("sem-base", !base);
      grupo.querySelectorAll(".btn-fracao").forEach((btn) => {
        btn.disabled = !base;
        btn.title = base
          ? "Definir como " + btn.textContent.trim() + " do original"
          : "O valor original deste campo ainda não foi lido";
      });
    });
  }

  function preencherLinha(elemento, texto) {
    elemento.textContent = texto === null || texto === undefined ? "—" : texto;
  }

  /**
   * Mostra o que se sabe do arquivo. A resolução aparece na hora (vem do
   * elemento <video> nativo); fps, sample rate e bitrate só depois da sonda
   * do ffmpeg, e enquanto isso ficam como "—".
   */
  function renderizarInfoOriginal() {
    // Numa fila, o painel só sabe falar do primeiro arquivo — a sonda é
    // cara e os campos manuais valem para todos igualmente.
    el.origRotulo.textContent =
      estado.arquivos.length > 1 ? "Primeiro arquivo da fila" : "Arquivo original";
    const meta = estado.meta || {};
    const info = estado.info || {};
    const ehVideo = estado.tipoCompressao === "video";
    const sondou = !!estado.info;

    const largura = info.width || meta.largura;
    const altura = info.height || meta.altura;
    preencherLinha(el.origResolucao, largura && altura ? largura + " × " + altura : null);
    preencherLinha(
      el.origFps,
      info.fps ? String(Math.round(info.fps * 100) / 100).replace(".", ",") : null
    );
    // arquivo de áudio não tem resolução nem fps para mostrar
    el.linhaResolucao.hidden = !ehVideo;
    el.linhaFps.hidden = !ehVideo;

    if (sondou && !info.hasAudio) {
      preencherLinha(el.origSamplerate, "sem faixa de áudio");
      preencherLinha(el.origBitrate, null);
    } else {
      const canais = nomeDosCanais(info.aChannels);
      preencherLinha(
        el.origSamplerate,
        info.aSampleRate
          ? info.aSampleRate.toLocaleString("pt-BR") + " Hz" + (canais ? " · " + canais : "")
          : null
      );
      preencherLinha(el.origBitrate, info.aBitrate ? info.aBitrate + " kbps" : null);
    }

    atualizarAtalhos();
  }

  /**
   * Roda a sonda do ffmpeg para descobrir fps, sample rate, bitrate e canais.
   * Só é chamada ao entrar no nível "Personalizada": exige o motor carregado,
   * e não faz sentido pagar esse custo em quem vai usar um preset.
   */
  async function carregarInfoDetalhada() {
    if (estado.opcao !== "9" || estado.arquivos.length !== 1 || !estado.tipoCompressao) return;
    if (estado.info || estado.infoCarregando) return;

    const token = ++estado.tokenInfo;
    estado.infoCarregando = true;
    el.origCarregando.classList.remove("escondido");
    try {
      const ffmpeg = await getFFmpeg(setStatus, onProgressoMotor);
      if (token !== estado.tokenInfo) return;
      const info = await probeMediaInfo(ffmpeg, estado.arquivos[0]);
      if (token !== estado.tokenInfo) return;
      estado.info = info;
      diag("Sonda do arquivo:", info);
      setStatus("");
      renderizarInfoOriginal();
      atualizarEstimativa();
    } catch (err) {
      diagAviso("Não consegui analisar o arquivo:", err);
      if (token === estado.tokenInfo) {
        setStatus("Não foi possível ler os dados do arquivo: " + err.message);
      }
    } finally {
      if (token === estado.tokenInfo) {
        estado.infoCarregando = false;
        el.origCarregando.classList.add("escondido");
      }
    }
  }

  // Atalhos 2/3, 1/2, 1/3 e "original" nos campos numéricos.
  document.addEventListener("click", (ev) => {
    const btn = ev.target.closest ? ev.target.closest(".btn-fracao") : null;
    if (!btn || btn.disabled) return;
    const grupo = btn.closest(".atalhos");
    const base = baseDoAtalho(grupo.dataset.base);
    if (!base) return;
    const campo = document.getElementById(grupo.dataset.alvo);
    const fracao = parseFloat(btn.dataset.fracao);

    // Nos campos cujo rotulo diz "vazio = original" (largura e fps), voltar
    // ao original e limpar, nao gravar um numero: escrever 30 num video de
    // 29,97 seria uma reamostragem disfarcada de "sem mudanca".
    if (fracao === 1 && campo.placeholder === "original") {
      campo.value = "";
      atualizarEstimativa();
      return;
    }

    const bruto = base * fracao;
    // largura tem de ser par: o x264 recusa dimensão ímpar em yuv420p
    campo.value = String(
      grupo.dataset.base === "largura" ? roundEven(bruto) : Math.max(1, Math.round(bruto))
    );
    atualizarEstimativa();
  });

  // ---------------------------------------------------------------------
  // Corte de trecho (opção 9, vale para qualquer nível)
  // ---------------------------------------------------------------------

  /**
   * Acompanha um encode.
   *
   * A fonte é o campo `time` do evento "progress" — o core chama
   * receiveProgress(progress, time) de dentro do C, com o tempo já
   * processado em MICROSSEGUNDOS. Usamos esse tempo contra a duração que
   * nós conhecemos, e não o campo `progress`, porque o core calcula essa
   * fração sobre a duração do arquivo de ENTRADA: com `-t 15` num vídeo de
   * cinco minutos ela empaca em 5%.
   *
   * As linhas de log ficam como reserva, mas não dá para depender delas: o
   * ffmpeg termina a linha de andamento com `\r`, e o Emscripten só entrega
   * ao logger quando encontra `\n` — na prática elas só aparecem no fim.
   */
  function criarAcompanhante(duracaoAlvo) {
    const inicio = performance.now();
    const atual = {
      segundos: 0, fracao: 0, fonte: null,
      eventos: 0, linhas: 0, linhasComTempo: 0, velocidadeRelatada: 0,
    };

    function registrar(segundos, fonte) {
      if (!Number.isFinite(segundos) || segundos < 0) return;
      atual.segundos = segundos;
      atual.fonte = fonte;
      if (duracaoAlvo > 0) atual.fracao = Math.min(1, segundos / duracaoAlvo);
    }

    return {
      observarProgresso(evento) {
        atual.eventos++;
        // AV_NOPTS_VALUE (INT64_MAX) chega como "sem timestamp" e viraria
        // 9223372036854 segundos de mídia processada
        if (evento && Number.isFinite(evento.time) && evento.time > 0 && evento.time < 9e15) {
          registrar(evento.time / 1e6, "evento progress");
        }
      },

      observarLog(mensagem) {
        atual.linhas++;
        // bloco do -progress: out_time_us vem em microssegundos
        const us = mensagem.match(/out_time_us=(\d+)/);
        if (us) {
          atual.linhasComTempo++;
          registrar(Number(us[1]) / 1e6, "-progress");
        } else {
          // out_time=HH:MM:SS.ffffff, e a linha de estatistica com time=
          const t = mensagem.match(/(?:out_time|time)=\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
          if (t) {
            atual.linhasComTempo++;
            registrar(Number(t[1]) * 3600 + Number(t[2]) * 60 + parseFloat(t[3]), "-progress");
          }
        }
        const v = mensagem.match(/speed=\s*([\d.]+)x/);
        if (v) atual.velocidadeRelatada = parseFloat(v[1]);
      },

      decorrido() {
        return (performance.now() - inicio) / 1000;
      },

      /** Segundos de mídia processados por segundo de relógio. */
      velocidade() {
        // a velocidade que o proprio ffmpeg relata e mais estavel que a
        // media desde o inicio, que fica distorcida pelo tempo de partida
        if (atual.velocidadeRelatada > 0) return atual.velocidadeRelatada;
        const d = this.decorrido();
        return d > 0.5 && atual.segundos > 0 ? atual.segundos / d : 0;
      },

      fracao() {
        return atual.fracao;
      },

      /** Números crus para o diagnóstico. */
      metricas() {
        return {
          "tempo processado (s)": Math.round(atual.segundos * 100) / 100,
          "duração alvo (s)": Math.round(duracaoAlvo * 100) / 100,
          "fração": Math.round(atual.fracao * 1000) / 1000,
          "fonte": atual.fonte || "(nenhuma ainda)",
          "eventos progress": atual.eventos,
          "linhas de log": atual.linhas,
          "linhas com tempo": atual.linhasComTempo,
          "decorrido (s)": Math.round(this.decorrido()),
          "velocidade (x)": Math.round(this.velocidade() * 1000) / 1000,
        };
      },

      texto() {
        if (duracaoAlvo > 0 && atual.segundos > 0) {
          let s = "Comprimindo… " + formatarTempo(atual.segundos) + " de " +
                  formatarTempo(duracaoAlvo) + " (" + Math.round(atual.fracao * 100) + "%)";
          const v = this.velocidade();
          if (v > 0 && atual.fracao < 1) {
            const restante = (duracaoAlvo - atual.segundos) / v;
            if (restante >= 1) s += " · faltam ~" + formatarTempo(restante);
          }
          return s;
        }
        return "Comprimindo… " + formatarTempo(this.decorrido()) + " decorrido";
      },
    };
  }

  /**
   * Liga o acompanhante ao ffmpeg e mantém a linha de resultado atualizada.
   * Devolve a função que desliga tudo.
   */
  function acompanharEncode(duracaoAlvo, onAndamento) {
    const acompanhante = criarAcompanhante(duracaoAlvo);
    let ultimaPublicacao = 0;
    let ultimoRelatorio = 0;
    let avisouSemSinal = false;

    diag("Encode começou. Duração alvo:",
         duracaoAlvo > 0 ? formatarTempo(duracaoAlvo) : "desconhecida");

    const publicar = () => {
      ultimaPublicacao = performance.now();
      if (onAndamento) onAndamento({ fracao: acompanhante.fracao(), texto: acompanhante.texto() });
    };

    /** Despeja as métricas no console de tempos em tempos. */
    const relatar = (forcado) => {
      const agora = performance.now();
      if (!forcado && agora - ultimoRelatorio < 5000) return;
      ultimoRelatorio = agora;
      const m = acompanhante.metricas();
      diag("Andamento:", m);
      // Sem nenhum evento depois de 10 s, algo está errado no canal —
      // vale dizer isso em vez de deixar a barra parada em silêncio.
      const semSinal = m["eventos progress"] === 0 && m["linhas com tempo"] === 0;
      if (!avisouSemSinal && semSinal && acompanhante.decorrido() > 10) {
        avisouSemSinal = true;
        diagAviso(
          "Nenhum evento de progresso em " + Math.round(acompanhante.decorrido()) + "s. " +
          "O encode pode estar rodando sem reportar; o tempo decorrido continua contando."
        );
      }
    };

    ganchos.progresso = (evento) => {
      acompanhante.observarProgresso(evento);
      if (performance.now() - ultimaPublicacao >= 250) publicar();
      relatar(false);
    };
    ganchos.log = (mensagem) => {
      acompanhante.observarLog(mensagem);
      if (performance.now() - ultimaPublicacao >= 250) publicar();
    };

    publicar();
    // mantém o relógio andando mesmo se o ffmpeg ficar mudo
    const timer = setInterval(() => {
      publicar();
      relatar(false);
    }, 1000);

    return () => {
      clearInterval(timer);
      relatar(true);
      diag("Encode terminou em", formatarTempo(acompanhante.decorrido()), "de relógio.");
      ganchos.log = null;
      ganchos.progresso = null;
    };
  }

  /**
   * Trecho pedido pelo usuário, já validado.
   * Devolve { inicio, fim, duracao } ou null quando o corte está desligado.
   * Em caso de erro devolve { erro: "..." }.
   */
  function lerCorte() {
    if (!el.corteAtivo.checked) return null;

    const inicio = parseTempo(el.corteInicio.value);
    const fimBruto = el.corteFim.value.trim();
    const fim = fimBruto ? parseTempo(fimBruto) : null;
    const duracaoTotal = estado.meta && estado.meta.duracao ? estado.meta.duracao : null;

    if (el.corteInicio.value.trim() && inicio === null) {
      return { erro: "Não entendi o início. Use 0:30, 1:02:03 ou só os segundos." };
    }
    if (fimBruto && fim === null) {
      return { erro: "Não entendi o fim. Use 0:30, 1:02:03 ou só os segundos." };
    }

    const de = inicio || 0;
    if (fim !== null && fim <= de) {
      return { erro: "O fim precisa vir depois do início." };
    }
    if (duracaoTotal && de >= duracaoTotal) {
      return { erro: "O início está além do fim do arquivo (" + formatarTempo(duracaoTotal) + ")." };
    }

    // sem fim informado, vai até o fim do arquivo
    const ate = fim !== null ? (duracaoTotal ? Math.min(fim, duracaoTotal) : fim) : duracaoTotal;
    return { inicio: de, fim: fim !== null ? fim : null, duracao: ate ? ate - de : null };
  }

  /** Argumentos de corte. Precisam vir ANTES do -i para o seek ser rápido. */
  /** Roda uma etapa medindo quanto demorou, e conta isso no console. */
  async function etapa(rotulo, executar) {
    const t = performance.now();
    const r = await executar();
    diag(rotulo, "levou", Math.round(performance.now() - t) + "ms");
    return r;
  }

  /** Quantos segundos de mídia este trabalho vai produzir. 0 = não sei. */
  function duracaoDoTrabalho(info, corte) {
    if (corte && !corte.erro && corte.duracao) return corte.duracao;
    if (info && info.duration) return info.duration;
    return 0;
  }

  function argumentosDeCorte(corte) {
    if (!corte || corte.erro) return { antes: [], depois: [] };
    const antes = [];
    const depois = [];
    if (corte.inicio > 0) antes.push("-ss", String(corte.inicio));
    // -t (duração) em vez de -to: combinado com um -ss de entrada, é o que
    // se comporta igual em toda versão do ffmpeg.
    if (corte.fim !== null) depois.push("-t", String(corte.fim - corte.inicio));
    return { antes, depois };
  }

  function atualizarPainelCorte() {
    const ligado = el.corteAtivo.checked;
    el.corteCampos.classList.toggle("escondido", !ligado);

    const duracaoTotal = estado.meta && estado.meta.duracao ? estado.meta.duracao : null;
    if (!ligado) {
      el.corteErro.classList.add("escondido");
      el.corteInfo.textContent = "";
      atualizarBotaoIniciar();
      return;
    }

    const corte = lerCorte();
    if (corte && corte.erro) {
      el.corteErro.textContent = corte.erro;
      el.corteErro.classList.remove("escondido");
      el.corteInfo.textContent = "";
    } else {
      el.corteErro.classList.add("escondido");
      const partes = [];
      partes.push("Duração original: " + (duracaoTotal ? formatarTempo(duracaoTotal) : "desconhecida"));
      if (corte && corte.duracao) partes.push("trecho selecionado: " + formatarTempo(corte.duracao));
      else if (!duracaoTotal) partes.push("informe o fim para saber o tamanho do trecho");
      el.corteInfo.textContent = partes.join(" · ");
    }
    atualizarBotaoIniciar();
  }

  /** Preenche os campos com o arquivo inteiro na primeira vez que se liga. */
  function semearCamposDeCorte() {
    const duracaoTotal = estado.meta && estado.meta.duracao ? estado.meta.duracao : null;
    if (!el.corteInicio.value.trim()) el.corteInicio.value = "0:00";
    if (!el.corteFim.value.trim() && duracaoTotal) el.corteFim.value = formatarTempo(duracaoTotal);
  }

  el.corteAtivo.addEventListener("change", () => {
    if (el.corteAtivo.checked) semearCamposDeCorte();
    atualizarPainelCorte();
    atualizarEstimativa();
  });

  [el.corteInicio, el.corteFim].forEach((campo) => {
    campo.addEventListener("input", () => {
      atualizarPainelCorte();
      atualizarEstimativa();
    });
  });

  // ---------------------------------------------------------------------
  // Prévia em tela cheia
  // ---------------------------------------------------------------------

  /** Elemento adequado ao tipo do blob, ou null se não dá para exibir. */
  function elementoDePrevia(blob, url) {
    const tipo = blob.type || "";
    if (tipo.startsWith("video/")) {
      const v = document.createElement("video");
      v.src = url;
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      v.className = "previa-midia";
      return v;
    }
    if (tipo.startsWith("audio/")) {
      const a = document.createElement("audio");
      a.src = url;
      a.controls = true;
      a.autoplay = true;
      a.className = "previa-midia previa-audio";
      return a;
    }
    if (tipo.startsWith("image/")) {
      const i = document.createElement("img");
      i.src = url;
      i.alt = "Prévia do arquivo convertido";
      i.className = "previa-midia";
      return i;
    }
    return null;
  }

  function fecharPrevia() {
    // solta o decodificador antes de esconder, senão o vídeo segue tocando
    const midia = el.previaPalco.querySelector("video, audio");
    if (midia) {
      try { midia.pause(); } catch (e) {}
      midia.removeAttribute("src");
      try { midia.load(); } catch (e) {}
    }
    el.previaPalco.innerHTML = "";
    el.previa.classList.add("escondido");
    if (document.fullscreenElement === el.previa) {
      // sair da tela cheia dispara fullscreenchange, que já chamaria daqui
      document.exitFullscreen().catch(() => {});
    }
  }

  function abrirPrevia(blob, url, nome) {
    const midia = elementoDePrevia(blob, url);
    if (!midia) return;

    el.previaPalco.innerHTML = "";
    el.previaPalco.appendChild(midia);
    el.previaNome.textContent = nome;
    el.previa.classList.remove("escondido");

    // requestFullscreen só é aceito dentro do gesto do usuário — este
    // caminho vem sempre de um clique. Se o navegador recusar, o modal
    // continua servindo como visualização normal.
    if (el.previa.requestFullscreen) {
      el.previa.requestFullscreen().catch((err) => {
        diagAviso("Tela cheia recusada, exibindo em janela:", err && err.message);
      });
    }
  }

  el.previaFechar.addEventListener("click", fecharPrevia);

  // clicar no fundo fecha; clicar na mídia, não
  el.previa.addEventListener("click", (ev) => {
    if (ev.target === el.previa || ev.target === el.previaPalco) fecharPrevia();
  });

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && !el.previa.classList.contains("escondido")) fecharPrevia();
  });

  // sair da tela cheia pelo Esc do navegador também fecha o modal
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && !el.previa.classList.contains("escondido")) fecharPrevia();
  });

  // ---------------------------------------------------------------------
  // Eventos da seleção de operação e dos campos
  // ---------------------------------------------------------------------

  // O que a etapa 2 pede, por operação. O padrão serve para as opções que
  // aceitam qualquer mídia (1 a 5 e 8).
  const ROTULO_ARQUIVOS = {
    "6": "2. Selecione o(s) vídeo(s) ou a pasta",
    "7": "2. Selecione o(s) vídeo(s) ou a pasta",
    "9": "2. Selecione os arquivos de vídeo ou de áudio (todos do mesmo tipo)",
  };

  function selecionarOpcao(opcao) {
    estado.opcao = opcao;
    document.querySelectorAll(".opcao-conversor").forEach((btn) => {
      btn.classList.toggle("ativo", btn.dataset.op === opcao);
    });
    el.painelArquivos.classList.remove("escondido");
    el.rotuloArquivos.textContent =
      ROTULO_ARQUIVOS[opcao] || "2. Selecione o(s) arquivo(s) ou a pasta";
    el.painelQuadro.classList.toggle("escondido", opcao !== "7");
    atualizarPainelCompressao();
    atualizarPainelQuadro();
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
    // o Tamanho-alvo tem campo próprio, e um campo vazio bloqueia o botão
    atualizarBotaoIniciar();
  });

  // Mexer nos campos da personalizada recalcula a estimativa na hora.
  ["personalizada-video", "personalizada-audio-only"].forEach((id) => {
    const bloco = document.getElementById(id);
    bloco.addEventListener("input", atualizarEstimativa);
    bloco.addEventListener("change", atualizarEstimativa);
  });

  el.pRemoverAudio.addEventListener("change", () => {
    const desabilitado = el.pRemoverAudio.checked;
    el.personalizadaAudio
      .querySelectorAll("input:not(#p-remover-audio), button")
      .forEach((campo) => {
        campo.disabled = desabilitado;
      });
    if (!desabilitado) atualizarAtalhos(); // devolve o estado real dos atalhos
  });

  el.btnLimpar.addEventListener("click", () => {
    estado.opcao = null;
    estado.arquivos = [];
    estado.tipoCompressao = null;
    estado.meta = null;
    estado.metas = [];
    estado.tokenMeta++;
    limparSaidas();
    el.inputArquivos.value = "";
    el.inputPasta.value = "";
    document.querySelectorAll(".opcao-conversor").forEach((btn) => btn.classList.remove("ativo"));
    el.painelArquivos.classList.add("escondido");
    el.painelCompressao.classList.add("escondido");
    el.painelQuadro.classList.add("escondido");
    el.camposAlvo.classList.add("escondido");
    el.quadroInstante.value = "";
    el.quadroErro.classList.add("escondido");
    el.corte.classList.remove("escondido");
    el.listaSelecionados.innerHTML = "";
    el.avisoMemoria.classList.add("escondido");
    el.estimativa.classList.add("escondido");
    el.painelOriginal.classList.add("escondido");
    el.corteAtivo.checked = false;
    el.corteInicio.value = "";
    el.corteFim.value = "";
    el.corteCampos.classList.add("escondido");
    el.corteErro.classList.add("escondido");
    el.resultadosWrapper.classList.add("escondido");
    el.listaResultados.innerHTML = "";
    el.progressoLote.textContent = "";
    setStatus("");
    atualizarBotaoIniciar();
  });

  /** Tamanho máximo por arquivo, em bytes. alvoBytes null = campo inválido. */
  function lerNivelAlvo() {
    const mb = parseFloat(String(el.alvoMb.value || "").trim().replace(",", "."));
    // MB aqui é MiB, como em humanSize — o número na tela e o número no
    // resultado precisam falar a mesma língua.
    return { alvoBytes: Number.isFinite(mb) && mb > 0 ? mb * 1024 * 1024 : null };
  }

  /** Instante do quadro em segundos; 0 quando vazio, null quando ilegível. */
  function instanteDoQuadro() {
    const bruto = el.quadroInstante.value.trim();
    if (!bruto) return 0; // sem nada digitado, o primeiro quadro
    return parseTempo(bruto);
  }

  function atualizarPainelQuadro() {
    const ilegivel = estado.opcao === "7" && instanteDoQuadro() === null;
    el.quadroErro.textContent = ilegivel
      ? "Não entendi o instante. Use 0:30, 1:02:03 ou só os segundos."
      : "";
    el.quadroErro.classList.toggle("escondido", !ilegivel);
    atualizarBotaoIniciar();
  }

  el.quadroInstante.addEventListener("input", atualizarPainelQuadro);

  el.alvoMb.addEventListener("input", () => {
    atualizarEstimativa();
    atualizarBotaoIniciar();
  });

  function lerNivelPersonalizadoAudio() {
    return {
      bitrate: parseInt(document.getElementById("pa-bitrate").value, 10) || 96,
      samplerate: lerSampleRate("pa-sr"),
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
      audioSampleRate: lerSampleRate("p-sr"),
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

        const acoes = document.createElement("div");
        acoes.className = "resultado-acoes";

        // so oferece previa do que o navegador sabe tocar/exibir
        const tipo = blob.type || "";
        if (/^(video|audio|image)\//.test(tipo)) {
          const previa = document.createElement("button");
          previa.type = "button";
          previa.className = "btn-secondary resultado-previa";
          previa.textContent = "Prévia";
          previa.title = "Ver " + outName + " em tela cheia";
          previa.addEventListener("click", () => abrirPrevia(blob, url, outName));
          acoes.appendChild(previa);
        }

        const a = document.createElement("a");
        a.className = "btn-secondary resultado-download";
        a.href = url;
        a.download = outName;
        a.textContent = "Baixar";
        a.title = "Baixar " + outName;
        acoes.appendChild(a);
        li.appendChild(acoes);

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

  async function processarArquivoConversao(ffmpeg, file, opcao, linha, opcoes) {
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
    if (opcao === "6") {
      if (VIDEO_EXTS.includes(ext)) tarefas.push(["áudio", (p) => extractAudioFile(ffmpeg, file, p)]);
    }
    if (opcao === "7") {
      if (VIDEO_EXTS.includes(ext)) {
        tarefas.push(["quadro", () => extractFrameFile(ffmpeg, file, opcoes.instante)]);
      }
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
      const total = estado.arquivos.length;

      if (estado.opcao === "9") {
        const ehVideo = estado.tipoCompressao === "video";
        const nivel = nivelSelecionado();
        const custom = nivel === "5"
          ? (ehVideo ? lerNivelPersonalizado() : lerNivelPersonalizadoAudio())
          : nivel === "6" ? lerNivelAlvo() : null;
        // O corte só existe com um arquivo selecionado (ver
        // atualizarPainelCompressao), então na fila ele é sempre null.
        const corte = total === 1 ? lerCorte() : null;
        if (corte && corte.duracao) {
          diag("Cortando trecho:", formatarTempo(corte.inicio), "→",
               corte.fim !== null ? formatarTempo(corte.fim) : "fim do arquivo");
        }
        const comprimir = ehVideo ? compressVideoFile : compressAudioFile;

        for (let i = 0; i < total; i++) {
          if (cancelado) break;
          const file = estado.arquivos[i];
          if (total > 1) el.progressoLote.textContent = "arquivo " + (i + 1) + " de " + total;
          const linha = criarLinhaResultado(caminhoDe(file), file.size);
          try {
            linha.setStatus(ehVideo ? "Analisando o vídeo…" : "Analisando o áudio…");
            const resultado = await comprimir(ffmpeg, file, nivel, custom, {
              // a sonda guardada é do primeiro arquivo (é dele que o painel
              // "Arquivo original" fala); os demais são sondados na hora
              info: i === 0 ? estado.info : null,
              corte,
              // o texto e a barra passam a vir do log do ffmpeg, não do
              // evento "progress" — ver acompanharEncode()
              onAndamento: (a) => {
                linha.setStatus(a.texto);
                linha.setProgresso(a.fracao);
              },
            });
            linha.setStatus("Concluído.", "ok");
            linha.adicionarDownload(resultado.blob, resultado.outName);
          } catch (err) {
            linha.esconderBarra();
            linha.setStatus(cancelado ? "Cancelado." : "Falha: " + err.message, "erro");
          }
        }
      } else {
        const opcoes = { instante: estado.opcao === "7" ? instanteDoQuadro() : 0 };
        for (let i = 0; i < total; i++) {
          if (cancelado) break;
          const file = estado.arquivos[i];
          el.progressoLote.textContent = "arquivo " + (i + 1) + " de " + total;
          const linha = criarLinhaResultado(caminhoDe(file), file.size);
          await processarArquivoConversao(ffmpeg, file, estado.opcao, linha, opcoes);
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
