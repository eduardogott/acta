/**
 * CONVERSOR-REGRAS.JS
 * ---------------------------------------------------------------------------
 * As regras e as contas do conversor, sem navegador nenhum: nem DOM, nem
 * ffmpeg, nem rede. Só entra e sai valor.
 *
 * Está separado por isso mesmo. As decisões mais delicadas da ferramenta
 * são aritmética — quanto de bitrate cabe num alvo de tamanho, se a
 * conversão vale a pena, quando encolher a imagem em vez de insistir na
 * resolução — e, enquanto moravam no meio de duas mil linhas de interface,
 * não havia como exercitá-las sem abrir a página e converter um arquivo.
 * Aqui, um teste chama a função e confere o número.
 *
 * O que mora aqui:
 *   - a configuração (extensões, níveis de compressão, linha de base das
 *     conversões, endereços do núcleo do ffmpeg);
 *   - utilitários de nome de arquivo e de tipo;
 *   - a leitura do log do `ffmpeg -i` (parseMediaInfo, explicarFalha);
 *   - o planejamento de tamanho-alvo e a estimativa de saída.
 *
 * O que NÃO mora: carregar o motor e rodá-lo (js/conversor/motor.js) e a
 * página em si (js/conversor/conversor.js).
 * ---------------------------------------------------------------------------
 */
(function () {
  "use strict";

  // ---------------------------------------------------------------------
  // Configuração
  //
  // Os números moram em js/configuracoes.js, seção 8: extensões, níveis de
  // compressão, linha de base das conversões, alvos de tamanho, endereços
  // do núcleo do ffmpeg. Aqui ficam só as contas que os consomem — e a
  // reexportação abaixo, para motor.js e conversor.js continuarem pedindo
  // tudo a um lugar só.
  // ---------------------------------------------------------------------

  const {
    ALVO_AUDIO_KBPS,
    ALVO_BPP_MINIMO,
    ALVO_MARGEM,
    ALVO_MP3_KBPS,
    ALVO_MP3_KBPS_MINIMO,
    ALVO_VIDEO_KBPS_MINIMO,
    ARQUIVOS_CORE,
    AUDIO_EXTS,
    BPP_CRF23,
    CACHE_MOTOR,
    CDN_CORE,
    CONVERSAO_AUDIO,
    CONVERSAO_VIDEO,
    ESCADA_LARGURA,
    EXTENSION_MAP,
    FPS_PRESUMIDO,
    IMAGE_EXTS,
    LEVEL_AUDIO,
    LEVEL_AUDIO_ONLY,
    LEVEL_VIDEO,
    LIMITE_AVISO_MEMORIA,
    LOADER_LOCAL,
    QSCALE_JPEG_90,
    RESUMO_AUDIO,
    RESUMO_VIDEO,
    TIMEOUT_LOAD_MS,
    VIDEO_EXTS,
  } = window.Config.CONVERSOR;

  // Este não é configuração, é protocolo, e por isso fica aqui: como este
  // core não chama receiveProgress (o símbolo nem existe no .wasm), o
  // andamento vem de `-progress pipe:1` — o ffmpeg escreve blocos de
  // `chave=valor` no stdout, terminados em newline, que é o que o
  // Emscripten precisa para entregar a linha ao logger. As linhas de
  // estatística normais terminam em CR e ficam presas no buffer.
  const ARGS_PROGRESSO = ["-progress", "pipe:1"];

  // ---------------------------------------------------------------------
  // Nome de arquivo e tipo
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

  function tipoDoArquivo(file) {
    const ext = extOf(file.name);
    if (VIDEO_EXTS.includes(ext)) return "video";
    if (AUDIO_EXTS.includes(ext)) return "audio";
    return null;
  }

  /**
   * Tipo único de toda a seleção da opção 9, ou null.
   *
   * A fila exige que os arquivos sejam todos vídeo ou todos áudio: as
   * tabelas de nível são diferentes entre os dois, e os campos manuais na
   * tela são de um tipo só. Misturar significaria uma tela que fala de
   * duas coisas ao mesmo tempo — melhor pedir duas passadas.
   */
  function tipoComumDeCompressao(arquivos) {
    if (arquivos.length === 0) return null;
    const tipos = new Set(arquivos.map(tipoDoArquivo));
    if (tipos.size !== 1) return null;
    const unico = tipos.values().next().value;
    return unico === "video" || unico === "audio" ? unico : null;
  }

  // ---------------------------------------------------------------------
  // Leitura do que o ffmpeg escreve no log
  // ---------------------------------------------------------------------

  /**
   * Codecs de vídeo que este build não consegue decodificar.
   *
   * O @ffmpeg/core-mt 0.12.10 é compilado sem libdav1d, libaom e libgav1
   * (conferido na linha de configuration do .wasm). Sem elas, o decoder
   * "av1" do ffmpeg é só um invólucro para aceleração de hardware — que não
   * existe em WebAssembly. O sintoma é "Your platform doesn't suppport
   * hardware accelerated AV1 decoding" seguido de "Function not
   * implemented", e a conversão morre antes do primeiro quadro.
   */
  const CODECS_SEM_DECODER = {
    av1: "AV1",
  };

  /** Devolve a explicação se o arquivo não puder ser decodificado; senão null. */
  function problemaDeCodec(info) {
    if (!info || !info.vCodec) return null;
    const nome = CODECS_SEM_DECODER[info.vCodec];
    if (!nome) return null;
    return (
      "Este vídeo está codificado em " + nome + ", e o motor ffmpeg deste site " +
      "não traz decodificador de " + nome + " — não há como convertê-lo aqui. " +
      "Baixe o arquivo em H.264 na origem (o YouTube, por exemplo, oferece as " +
      "duas versões) ou converta antes num programa de desktop."
    );
  }

  /**
   * Traduz o fim do log do ffmpeg para uma frase útil. Serve para o caso em
   * que a falha não foi prevista pela checagem de codec.
   */
  function explicarFalha(linhas) {
    const texto = linhas.join("\n");
    const temAv1 = /\bav1\b/i.test(texto);

    if (/hardware accelerated AV1 decoding|Missing Sequence Header/i.test(texto) && temAv1) {
      return problemaDeCodec({ vCodec: "av1" });
    }
    if (/Protocol not found/i.test(texto)) {
      return "O ffmpeg recusou uma das URLs do comando (protocolo indisponível neste build).";
    }
    if (/Function not implemented/i.test(texto)) {
      return "O ffmpeg encontrou um recurso que este build não implementa — " +
             "normalmente um codec de entrada sem decodificador.";
    }
    if (/Cannot determine format of input stream/i.test(texto)) {
      return "O ffmpeg não conseguiu decodificar o vídeo de entrada. " +
             "O arquivo pode estar corrompido ou usar um codec sem suporte aqui.";
    }
    if (/No space left|Cannot allocate memory|out of memory/i.test(texto)) {
      return "Faltou memória. Arquivos grandes estouram o heap do WebAssembly — " +
             "tente cortar um trecho menor.";
    }
    if (/Invalid data found when processing input/i.test(texto)) {
      return "O ffmpeg achou dados inválidos na entrada. O arquivo pode estar " +
             "truncado ou incompleto.";
    }
    return null;
  }

  /**
   * Extrai o que interessa do log do `ffmpeg -i`.
   *
   * Trabalha uma linha de cada vez em vez de uma regex só. A versão anterior
   * tentava alcançar o fps a partir da resolução na mesma expressão, e só
   * funcionava quando havia exatamente um campo entre os dois — o ffmpeg
   * costuma intercalar dois ou três (`[SAR 1:1 DAR 16:9]`, `4988 kb/s`),
   * então o fps quase nunca era encontrado.
   */
  function parseMediaInfo(log) {
    const info = {
      width: null, height: null, fps: null, duration: null,
      vCodec: null, aCodec: null,
      hasAudio: false, aBitrate: null, aSampleRate: null, aChannels: null,
    };

    const linhaVideo = (log.match(/^.*\bVideo:.*$/m) || [])[0];
    if (linhaVideo) {
      const cv = linhaVideo.match(/Video:\s*([a-zA-Z0-9_]+)/);
      if (cv) info.vCodec = cv[1].toLowerCase();
      // a resolução precisa ser um token isolado: assim "0x31637661" (a tag
      // do codec) não é confundida com dimensões
      const dim = linhaVideo.match(/(?:^|[\s,(\[])(\d{2,5})x(\d{2,5})(?:[\s,)\]]|$)/);
      if (dim) {
        info.width = parseInt(dim[1], 10);
        info.height = parseInt(dim[2], 10);
      }
      // "29.97 fps" é o valor real; "tbr" é a base de tempo e serve de
      // segunda opção quando o fps não vem declarado
      const fps = linhaVideo.match(/([\d.]+)\s*fps\b/) || linhaVideo.match(/([\d.]+)\s*tbr\b/);
      if (fps) {
        const valor = parseFloat(fps[1]);
        if (Number.isFinite(valor) && valor > 0) info.fps = valor;
      }
    }

    const dur = log.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
    if (dur) {
      info.duration = Number(dur[1]) * 3600 + Number(dur[2]) * 60 + parseFloat(dur[3]);
    }

    const linhaAudio = (log.match(/^.*\bAudio:.*$/m) || [])[0];
    if (linhaAudio) {
      info.hasAudio = true;
      const ca = linhaAudio.match(/Audio:\s*([a-zA-Z0-9_]+)/);
      if (ca) info.aCodec = ca[1].toLowerCase();
      const hz = linhaAudio.match(/(\d+)\s*Hz\b/);
      if (hz) info.aSampleRate = parseInt(hz[1], 10);

      if (/\bmono\b/i.test(linhaAudio)) info.aChannels = 1;
      else if (/\bstereo\b/i.test(linhaAudio)) info.aChannels = 2;
      else {
        // formatos como "5.1", "7.1" ou "6 channels"
        const canais = linhaAudio.match(/(\d+)(?:\.(\d+))?\s*channels?\b/) ||
                       linhaAudio.match(/\b(\d)\.(\d)\b(?!\s*(?:kb|Hz))/);
        if (canais) {
          const principais = parseInt(canais[1], 10) || 0;
          const graves = canais[2] ? parseInt(canais[2], 10) : 0;
          info.aChannels = principais + graves || null;
        }
      }

      const kbps = linhaAudio.match(/(\d+)\s*kb\/s/);
      if (kbps) info.aBitrate = parseInt(kbps[1], 10);
    }

    return info;
  }

  // ---------------------------------------------------------------------
  // Planejamento de tamanho e estimativa
  // ---------------------------------------------------------------------

  /**
   * Traduz "este vídeo tem de caber em N bytes" em bitrate de vídeo, de
   * áudio e, se preciso, uma resolução menor.
   *
   * Devolve também `cabe: false` quando nem o bitrate mínimo utilizável
   * cabe no alvo — nesse caso o encode segue no mínimo e o arquivo sai
   * maior que o pedido, o que é melhor que devolver um borrão inútil do
   * tamanho certo.
   */
  function planejarAlvo(info, duracao, alvoBytes) {
    const kbpsTotal = (alvoBytes * 8 * ALVO_MARGEM) / duracao / 1000;

    // O áudio vem primeiro porque é a parte que não se comprime bem: fica
    // com no máximo um quinto do orçamento e nunca acima do original.
    let audioKbps = 0;
    if (info.hasAudio) {
      const teto = Math.max(16, kbpsTotal * 0.2);
      audioKbps = ALVO_AUDIO_KBPS.find((k) => k <= teto) || 16;
      if (info.aBitrate && info.aBitrate < audioKbps) audioKbps = info.aBitrate;
    }

    let videoKbps = Math.floor(kbpsTotal - audioKbps);
    let cabe = true;
    if (videoKbps < ALVO_VIDEO_KBPS_MINIMO) {
      videoKbps = ALVO_VIDEO_KBPS_MINIMO;
      cabe = false;
    }

    // Com bitrate curto, uma imagem menor e nítida serve melhor que a
    // resolução original cheia de blocos.
    let width = info.width;
    let height = info.height;
    const fps = info.fps || FPS_PRESUMIDO;
    if (width && height) {
      const bpp = () => (videoKbps * 1000) / (width * height * fps);
      for (const degrau of ESCADA_LARGURA) {
        if (bpp() >= ALVO_BPP_MINIMO) break;
        if (degrau >= width) continue; // a escada só desce
        // sempre a partir das dimensões originais, para o arredondamento
        // de um degrau não se acumular no seguinte
        height = roundEven((degrau * info.height) / info.width);
        width = roundEven(degrau);
      }
    }

    return {
      videoKbps,
      audioKbps,
      samplerate: audioKbps > 0 && audioKbps <= 64 ? 24000 : null,
      mono: audioKbps > 0 && audioKbps <= 64,
      width,
      height,
      cabe,
    };
  }

  /** Mesma ideia de planejarAlvo, para arquivo de áudio puro (saída MP3). */
  function planejarAlvoAudio(info, duracao, alvoBytes) {
    const bruto = (alvoBytes * 8 * ALVO_MARGEM) / duracao / 1000;
    const bitrate = ALVO_MP3_KBPS.find((k) => k <= bruto) || ALVO_MP3_KBPS_MINIMO;

    // Sample rate e canais acompanham o bitrate: 24 kbps em estéreo a
    // 44,1 kHz soa pior que 24 kbps em mono a 16 kHz — e o MP3 nem aceita
    // bitrate baixo com taxa de amostragem alta (MPEG-1 x MPEG-2).
    let samplerate = null;
    let mono = false;
    if (bitrate < 40) {
      samplerate = 16000;
      mono = true;
    } else if (bitrate < 64) {
      samplerate = 24000;
      mono = true;
    } else if (bitrate < 112) {
      samplerate = 32000;
    }

    return { bitrate, samplerate, mono, compressionLevel: 2, cabe: bruto >= ALVO_MP3_KBPS_MINIMO };
  }

  /** Piso de tamanho do nível Tamanho-alvo: abaixo disso o encoder não desce. */
  function pisoDoAlvo(tipo, duracao) {
    const kbps = tipo === "video" ? ALVO_VIDEO_KBPS_MINIMO + 16 : ALVO_MP3_KBPS_MINIMO;
    return ((kbps * 1000) / 8) * duracao;
  }

  /**
   * Argumentos da faixa AAC, com bitrate e sample rate limitados ao que o
   * arquivo já tem. Recomprimir para cima só aumentaria o arquivo sem
   * devolver nada do que a compressão anterior jogou fora.
   */
  function argsAudioAac(info, bitrateAlvo, samplerateAlvo, monoAlvo) {
    let bitrate = bitrateAlvo;
    if (info.aBitrate && info.aBitrate < bitrate) bitrate = info.aBitrate;
    let samplerate = samplerateAlvo;
    if (samplerate && info.aSampleRate && info.aSampleRate < samplerate) samplerate = info.aSampleRate;
    const mono = monoAlvo || info.aChannels === 1;
    const args = ["-c:a", "aac", "-b:a", bitrate + "k", "-ac", mono ? "1" : String(info.aChannels || 2)];
    if (samplerate) args.push("-ar", String(samplerate));
    return args;
  }

  /**
   * Bytes que a linha de base da opção 2 produziria neste vídeo, ou null
   * quando falta dado para calcular. Mesmo modelo de bits por pixel da
   * estimativa da tela — grosseiro, mas suficiente para a única decisão
   * que depende dele: recomprimir ou apenas remuxar.
   */
  function estimarConversaoVideo(info) {
    if (!info || !info.duration || !info.width || !info.height) return null;
    const fps = info.fps || FPS_PRESUMIDO;
    const bpp = BPP_CRF23 * Math.pow(2, (23 - CONVERSAO_VIDEO.crf) / 6);
    const audioBps = info.hasAudio
      ? (Math.min(CONVERSAO_VIDEO.audioKbps, info.aBitrate || CONVERSAO_VIDEO.audioKbps) * 1000) / 8
      : 0;
    return ((bpp * info.width * info.height * fps) / 8 + audioBps) * info.duration;
  }

  /** Estimativa grosseira do tamanho da saída, em bytes. null = não dá para estimar. */
  function estimarTamanho(tipo, meta, nivel, custom) {
    if (!meta || !meta.duracao) return null;

    // No Tamanho-alvo a estimativa é o próprio alvo — a menos que ele
    // esteja abaixo do que o bitrate mínimo produz nessa duração.
    if (nivel === "6") {
      if (!custom || !custom.alvoBytes) return null;
      return Math.max(custom.alvoBytes, pisoDoAlvo(tipo, meta.duracao));
    }

    if (tipo === "audio") {
      const alvo = nivel === "5" ? custom : LEVEL_AUDIO_ONLY[nivel];
      if (!alvo || !alvo.bitrate) return null;
      return ((alvo.bitrate * 1000) / 8) * meta.duracao;
    }

    if (!meta.largura || !meta.altura) return null;
    let crf;
    let largura = meta.largura;
    let altura = meta.altura;
    let fps = meta.fps || FPS_PRESUMIDO;
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
  window.ConversorRegras = {
    ALVO_AUDIO_KBPS,
    ALVO_BPP_MINIMO,
    ALVO_MARGEM,
    ALVO_MP3_KBPS,
    ALVO_MP3_KBPS_MINIMO,
    ALVO_VIDEO_KBPS_MINIMO,
    ARGS_PROGRESSO,
    ARQUIVOS_CORE,
    AUDIO_EXTS,
    BPP_CRF23,
    CACHE_MOTOR,
    CDN_CORE,
    CODECS_SEM_DECODER,
    CONVERSAO_AUDIO,
    CONVERSAO_VIDEO,
    ESCADA_LARGURA,
    EXTENSION_MAP,
    FPS_PRESUMIDO,
    IMAGE_EXTS,
    LEVEL_AUDIO,
    LEVEL_AUDIO_ONLY,
    LEVEL_VIDEO,
    LIMITE_AVISO_MEMORIA,
    LOADER_LOCAL,
    QSCALE_JPEG_90,
    RESUMO_AUDIO,
    RESUMO_VIDEO,
    TIMEOUT_LOAD_MS,
    VIDEO_EXTS,
    argsAudioAac,
    baseName,
    estimarConversaoVideo,
    estimarTamanho,
    explicarFalha,
    extOf,
    parseMediaInfo,
    pisoDoAlvo,
    planejarAlvo,
    planejarAlvoAudio,
    problemaDeCodec,
    roundEven,
    tipoComumDeCompressao,
    tipoDoArquivo,
  };
})();
