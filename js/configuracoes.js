/**
 * CONFIGURACOES.JS
 * ===========================================================================
 * Tudo que se ajusta sem precisar entender o código: o código da unidade,
 * os bitrates do conversor, os modelos da transcrição, os prazos de cache,
 * as chaves de armazenamento. Um arquivo só, para não ter de caçar um
 * número no meio de duas mil linhas de interface.
 *
 * Carrega ANTES de todo o resto, em toda página (é o primeiro <script> de
 * cada HTML), e o worker da transcrição o importa por conta própria. Cada
 * módulo pega o que é seu logo no topo:
 *
 *     const { CODIGO_UNIDADE } = window.Config.ORIENTACOES;
 *
 * Os nomes das chaves são os mesmos que as constantes tinham nos módulos —
 * assim procurar por CODIGO_UNIDADE ou LEVEL_VIDEO acha os dois lados.
 *
 * ---------------------------------------------------------------------------
 * O QUE NÃO MORA AQUI, E POR QUÊ
 *
 *   js/orientacoes/dados.js   o texto das orientações
 *   js/tipificacao/dados.js   a tabela de tipificação penal
 *   js/gerador/tipos/*.js     as perguntas de cada tipo de ocorrência
 *       Conteúdo, não configuração. São arquivos inteiros de texto, e o
 *       lugar deles é ao lado da ferramenta que os desenha.
 *
 *   js/comum/nav.js           a lista de páginas da suíte (PAGINAS)
 *       É o mapa do site: dela saem o menu E os cartões da página
 *       inicial. Acrescentar uma ferramenta continua sendo uma linha lá.
 *
 *   js/comum/identificadores.js   os pesos de CPF, CNPJ, PIS, chassi…
 *       Não é preferência: é a definição do dígito verificador. Mudar um
 *       peso não configura nada, só faz a conta dar errado.
 *
 *   js/conversas/conversas.js     os padrões de data/hora do WhatsApp
 *       Expressões regulares com índices de grupo de captura — mexer nelas
 *       é mexer no parser. As LISTAS de palavras que ele reconhece, essas
 *       sim, estão aqui embaixo, em CONVERSAS.
 * ===========================================================================
 */
globalThis.Config = (function () {
  "use strict";

  // =========================================================================
  // 1. A UNIDADE
  //
  // Mudou de delegacia? É aqui, e em nenhum outro lugar.
  // =========================================================================
  const UNIDADE = {
    // Entra no número da ocorrência impresso na folha de orientações:
    // "48271/2026/100930".
    CODIGO: "100930",
  };

  // =========================================================================
  // 2. RODAPÉ E IDENTIDADE
  //
  // Aparecem em todas as páginas, montados por js/comum/rodape.js.
  // =========================================================================
  const RODAPE = {
    ETIMOLOGIA_HTML:
      'Acta — do latim <em>Acta Diurna</em>, os registros públicos diários de Roma.',
    AUTOR: { nome: "Eduardo Gottert", url: "https://gttr.com.br", ano: "2026" },
    // Quantos caracteres do hash do commit aparecem no carimbo de versão.
    // O hash inteiro fica no title, que é o que serve num `git show`.
    CARACTERES_DO_HASH: 7,
  };

  // =========================================================================
  // 3. O CONSOLE
  //
  // A marca que abre toda linha de log (js/comum/log.js). Mexer no prefixo
  // muda o filtro que se digita no console — e o worker da transcrição
  // escreve a marca à mão, então mude lá também.
  // =========================================================================
  const LOG = {
    PREFIXO: "acta.",
    ESTILO: "color:#2d4a63;font-weight:bold",
    // O nível `debug` só sai quando a URL traz ?debug=1.
    PARAMETRO_DEBUG: "debug",
    VALOR_DEBUG: "1",
  };

  // =========================================================================
  // 4. O QUE O NAVEGADOR GUARDA
  //
  // Todas as chaves de armazenamento num lugar só — é esta a lista que
  // responde "o que este site deixa na máquina?".
  //
  // Trocar uma chave de cache (as duas últimas) invalida o cache antigo de
  // propósito: é assim que se força o download de uma versão nova do
  // ffmpeg ou do runtime da transcrição.
  // =========================================================================
  const ARMAZENAMENTO = {
    // localStorage: sobrevive ao fechar o navegador.
    TEMA: "ocorrencias-tema",
    // sessionStorage: morre com a aba, e é para morrer mesmo — o rascunho
    // é o depoimento de uma pessoa.
    RASCUNHO: "acta-rascunho",
    // Cache API: os 32 MB do núcleo do ffmpeg.
    CACHE_MOTOR: "acta-ffmpeg-v2",
    // Cache API: os ~11 MB do runtime onnx da transcrição.
    CACHE_RUNTIME: "acta-ort-v1",
  };

  // =========================================================================
  // 5. INTERFACE
  // =========================================================================
  const INTERFACE = {
    // Quanto tempo o botão de copiar fica dizendo "Copiado!" / a mensagem
    // de falha. A falha demora mais porque tem instrução para ler.
    MS_SUCESSO: 1600,
    MS_FALHA: 6000,
  };

  // =========================================================================
  // 6. GERADOR DE OCORRÊNCIAS
  // =========================================================================
  const GERADOR = {
    // Fecha todo texto gerado, quando alguma frase saiu.
    TEXTO_FECHO: "Nada mais.",
    CHAVE_RASCUNHO: ARMAZENAMENTO.RASCUNHO,
  };

  // =========================================================================
  // 7. ORIENTAÇÕES AO COMUNICANTE
  // =========================================================================
  const ORIENTACOES = {
    // O número impresso vira "{digitado}/{ano atual}/{CODIGO_UNIDADE}".
    CODIGO_UNIDADE: UNIDADE.CODIGO,
    // Título do grupo das orientações escritas à mão, na tela e no papel.
    TITULO_OUTRAS: "Outras orientações",
    // Sai no lugar do número quando ele não foi digitado, para preencher
    // à caneta.
    LINHA_EM_BRANCO: "______________________",
  };

  // =========================================================================
  // 8. CONVERSOR DE MÍDIA
  //
  // A seção maior, e a que mais se mexe. Está plana de propósito: os
  // módulos pegam o que precisam com uma desestruturação só, e quem
  // organiza são os blocos de comentário abaixo.
  // =========================================================================
  const CONVERSOR = {
    // ----------------------------------------------------------------- //
    // 8.1 Extensões reconhecidas
    // ----------------------------------------------------------------- //
    AUDIO_EXTS: [".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a", ".wma", ".opus", ".aiff", ".au"],
    VIDEO_EXTS: [".mp4", ".avi", ".mov", ".mkv", ".wmv", ".flv", ".webm", ".mpg", ".mpeg", ".m4v", ".3gp", ".ts"],
    // .heic ficou de fora de propósito: o build padrão do ffmpeg.wasm não
    // traz decodificador HEIC, e esses arquivos só produziriam um erro
    // obscuro. Acrescentar aqui não faz o decodificador existir.
    IMAGE_EXTS: [".jpg", ".jpeg", ".png", ".bmp", ".gif", ".tiff", ".tif", ".webp"],

    // Extensões que são a mesma coisa escrita de dois jeitos.
    EXTENSION_MAP: {
      ".jpeg": ".jpg",
      ".mpeg": ".mpg",
      ".tiff": ".tif",
      ".mpg4": ".mp4",
    },

    // ----------------------------------------------------------------- //
    // 8.2 Níveis de compressão (opção 9)
    //
    // Mexeu num nível? Mexa no RESUMO correspondente, em 8.3 — é o texto
    // que a tela mostra, e ele não se atualiza sozinho.
    // ----------------------------------------------------------------- //

    // Vídeo. "maxFps" é TETO, não alvo: vídeo já abaixo dele passa intacto.
    // "scale" null mantém a resolução original.
    LEVEL_VIDEO: {
      "1": { nome: "Baixa",   crf: 26, scale: null, maxFps: 30, preset: "medium" },
      "2": { nome: "Média",   crf: 30, scale: null, maxFps: 24, preset: "medium" },
      "3": { nome: "Alta",    crf: 32, scale: 0.75, maxFps: 24, preset: "medium" },
      "4": { nome: "Extrema", crf: 34, scale: 0.5,  maxFps: 19, preset: "slow" },
    },

    // A faixa de áudio DENTRO do vídeo (AAC). Bitrate e sample rate também
    // são tetos: nada sobe acima do que o arquivo já tem.
    LEVEL_AUDIO: {
      "1": { bitrate: 128, samplerate: null,  mono: false },
      "2": { bitrate: 96,  samplerate: 24000, mono: true },
      "3": { bitrate: 64,  samplerate: 22050, mono: true },
      "4": { bitrate: 32,  samplerate: 16000, mono: true },
    },

    // Arquivos de áudio puro. Saída sempre MP3.
    //
    // O libmp3lame não conhece -preset (isso é do x264): o equivalente é
    // -compression_level, a escala do LAME, em que 0 é o mais lento e
    // caprichado e 9 o mais apressado. Daí 1 fazer as vezes de "slower".
    //
    // Os quatro pares bitrate/sample rate são combinações VÁLIDAS de MP3:
    // 128 kbps a 32 kHz cai em MPEG-1, e os demais em MPEG-2 (16–24 kHz),
    // cuja faixa vai de 8 a 160 kbps. Inventar um par fora disso faz o
    // encoder recusar.
    LEVEL_AUDIO_ONLY: {
      "1": { nome: "Baixa",   bitrate: 128, samplerate: 32000, mono: false, compressionLevel: 3 },
      "2": { nome: "Média",   bitrate: 80,  samplerate: 24000, mono: true,  compressionLevel: 2 },
      "3": { nome: "Alta",    bitrate: 48,  samplerate: 24000, mono: true,  compressionLevel: 1 },
      "4": { nome: "Extrema", bitrate: 24,  samplerate: 16000, mono: true,  compressionLevel: 0 },
    },

    // ----------------------------------------------------------------- //
    // 8.3 O que a tela diz sobre cada nível
    // ----------------------------------------------------------------- //
    RESUMO_VIDEO: {
      "1": "Mexe pouco: a imagem continua como está e o arquivo diminui um pouco.",
      "2": "A imagem quase não muda e o arquivo já fica bem menor. Serve para quase tudo.",
      "3": "A imagem fica um pouco menor e menos nítida, e o arquivo encolhe bastante.",
      "4": "A perda de qualidade aparece, mas o vídeo fica pequeno. Para quando precisa caber de qualquer jeito.",
      "5": "Você ajusta cada item abaixo.",
      "6": "Você diz o tamanho máximo e a qualidade se ajusta sozinha para caber nele.",
    },
    RESUMO_AUDIO: {
      "1": "O som continua como está e o arquivo diminui um pouco.",
      "2": "Numa gravação de voz a diferença mal se nota, e o arquivo já fica bem menor.",
      "3": "A voz continua clara e o arquivo encolhe bastante.",
      "4": "O som fica abafado, mas dá para entender a fala. Para quando precisa caber de qualquer jeito.",
      "5": "Você ajusta cada item abaixo.",
      "6": "Você diz o tamanho máximo e a qualidade se ajusta sozinha para caber nele.",
    },

    // ----------------------------------------------------------------- //
    // 8.4 Linha de base das conversões (opções 1, 2 e 3)
    //
    // Converter e comprimir são a mesma operação aqui: o sistema de
    // destino aceita no máximo 20 MB por arquivo, e entregar um MP4
    // remuxado de 300 MB seria devolver o problema ao usuário. Estes
    // números são TETO — nenhuma conversão sobe bitrate, sample rate ou
    // resolução acima do que o arquivo já tem.
    // ----------------------------------------------------------------- //
    CONVERSAO_VIDEO: { crf: 23, preset: "medium", audioKbps: 128, audioHz: 32000 },
    CONVERSAO_AUDIO: { kbps: 128, hz: 32000 },

    // Qualidade das imagens convertidas para JPG. O mjpeg do ffmpeg não
    // conhece a escala 0–100 do libjpeg: o que ele aceita é o qscale, de 2
    // (melhor) a 31 (pior). O degrau 3 é o equivalente prático de
    // "qualidade 90"; o 2 fica em ~93/95 e praticamente não comprime.
    QSCALE_JPEG_90: "3",

    // ----------------------------------------------------------------- //
    // 8.5 Nível "Tamanho-alvo" (nível 6 da opção 9)
    //
    // Em vez de escolher a qualidade e descobrir o tamanho, o usuário diz
    // o tamanho e o bitrate sai da divisão.
    // ----------------------------------------------------------------- //

    // Sobra para o overhead do contêiner e para o erro do controle de taxa
    // do x264, que mira a média mas não a acerta na casa do byte.
    ALVO_MARGEM: 0.95,
    // Abaixo disto o vídeo vira um borrão sem serventia: o encode passa a
    // ignorar o alvo e o aviso vai para a estimativa.
    ALVO_VIDEO_KBPS_MINIMO: 64,
    // Bits por pixel por quadro. Abaixo disto compensa mais encolher a
    // imagem do que insistir na resolução original com bitrate de menos.
    ALVO_BPP_MINIMO: 0.04,
    // Degraus de largura para essa redução (só desce, nunca sobe).
    ESCADA_LARGURA: [1920, 1280, 854, 640, 480, 320],
    // Bitrates de áudio candidatos, do melhor para o pior.
    ALVO_AUDIO_KBPS: [128, 96, 64, 48, 32, 24, 16],
    // Bitrates que o libmp3lame aceita, na compressão de áudio puro.
    ALVO_MP3_KBPS: [320, 256, 192, 160, 128, 112, 96, 80, 64, 56, 48, 40, 32, 24, 16, 8],
    ALVO_MP3_KBPS_MINIMO: 8,

    // ----------------------------------------------------------------- //
    // 8.6 O motor ffmpeg
    // ----------------------------------------------------------------- //

    // O núcleo (32 MB) vem do jsDelivr, não deste site. Versão fixada de
    // propósito: a URL vira imutável e cacheável para sempre.
    //
    // O "bytes" de cada arquivo está declarado porque o jsDelivr responde
    // em chunks, sem Content-Length, e sem ele a barra de progresso ficaria
    // sem denominador. Ao trocar de versão, atualize os números E a chave
    // ARMAZENAMENTO.CACHE_MOTOR — o código avisa no console se os bytes
    // divergirem do que o servidor mandar.
    CDN_CORE: "https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.10/dist/umd",
    ARQUIVOS_CORE: {
      core:   { arquivo: "/ffmpeg-core.js",        tipo: "text/javascript",  bytes: 129115 },
      wasm:   { arquivo: "/ffmpeg-core.wasm",      tipo: "application/wasm", bytes: 32718323 },
      worker: { arquivo: "/ffmpeg-core.worker.js", tipo: "text/javascript",  bytes: 2213 },
    },
    // Os dois arquivos que continuam LOCAIS (7,6 KB somados). Precisam ser:
    // o construtor Worker recusa URL de outra origem — ver o README.
    LOADER_LOCAL: ["js/conversor/vendor/ffmpeg/ffmpeg.js", "js/conversor/vendor/ffmpeg/814.ffmpeg.js"],

    CACHE_MOTOR: ARMAZENAMENTO.CACHE_MOTOR,

    // ffmpeg.load() nunca rejeita sozinho se o worker morrer: sem um teto
    // de tempo a página fica "Inicializando…" para sempre.
    TIMEOUT_LOAD_MS: 90000,

    // O ffmpeg.wasm carrega o arquivo inteiro no heap do WebAssembly; acima
    // disso é comum a aba ficar sem memória com um erro pouco informativo.
    LIMITE_AVISO_MEMORIA: 500 * 1024 * 1024,

    // Quantas linhas do log do ffmpeg ficam guardadas para explicar uma
    // falha depois que ela acontece.
    CAUDA_MAX: 40,

    // ----------------------------------------------------------------- //
    // 8.7 Estimativa de tamanho
    //
    // Só serve para o número que a tela mostra ANTES de converter. Errar
    // aqui não estraga arquivo nenhum, só a previsão.
    // ----------------------------------------------------------------- //

    // Bits por pixel do x264 (preset medium) em CRF 23. Cada 6 pontos de
    // CRF dobram ou reduzem o bitrate pela metade.
    BPP_CRF23: 0.07,
    // Usado quando o arquivo não declara taxa de quadros.
    FPS_PRESUMIDO: 30,
  };

  // A URL de cada arquivo do núcleo sai da base. Declarar as três à mão é
  // como elas divergem numa troca de versão — uma fica para trás e o motor
  // carrega meio núcleo velho.
  Object.keys(CONVERSOR.ARQUIVOS_CORE).forEach((chave) => {
    const a = CONVERSOR.ARQUIVOS_CORE[chave];
    a.url = CONVERSOR.CDN_CORE + a.arquivo;
  });

  // =========================================================================
  // 9. TRANSCRIÇÃO DE ÁUDIO
  // =========================================================================
  const TRANSCRICAO = {
    // O Whisper trabalha nesta taxa; qualquer outra seria reamostrada do
    // outro lado de qualquer jeito.
    TAXA_ALVO: 16000,

    // Acima disto a decodificação inteira na memória fica arriscada, e a
    // espera deixa de ser razoável numa thread só. Em segundos.
    AVISO_DURACAO_S: 20 * 60,

    // Os tamanhos foram conferidos no Hugging Face e aparecem na tela: é
    // por esse número que a pessoa decide se espera ou não. Trocou de
    // modelo, confira o tamanho de novo.
    MODELOS: [
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
    ],

    // Lido dentro do worker (js/transcricao/worker.js), que importa este
    // arquivo por conta própria.
    MOTOR: {
      // ATENÇÃO: esta versão está escrita em DOIS lugares. O
      // js/transcricao/worker.js precisa dela num `import` estático, cujo
      // endereço tem de ser literal — mudou aqui, mude lá. É a única
      // duplicação da suíte, e o worker recusa a subir se as duas
      // divergirem, em vez de baixar runtime de uma versão e biblioteca de
      // outra.
      VERSAO_BIBLIOTECA: "3.7.5",
      // Acima de quatro threads o ganho no Whisper é pequeno e a memória
      // cresce rápido; abaixo de duas não vale preparar os blobs.
      TETO_THREADS: 4,
      CACHE_RUNTIME: ARMAZENAMENTO.CACHE_RUNTIME,
    },
  };

  // A base e os dois arquivos do runtime saem da versão — declarar as três
  // coisas à mão é como elas divergem.
  TRANSCRICAO.MOTOR.BASE_CDN =
    "https://cdn.jsdelivr.net/npm/@huggingface/transformers@" +
    TRANSCRICAO.MOTOR.VERSAO_BIBLIOTECA + "/dist/";
  TRANSCRICAO.MOTOR.ARQUIVOS_RUNTIME = {
    mjs: TRANSCRICAO.MOTOR.BASE_CDN + "ort-wasm-simd-threaded.jsep.mjs",
    wasm: TRANSCRICAO.MOTOR.BASE_CDN + "ort-wasm-simd-threaded.jsep.wasm",
  };

  // =========================================================================
  // 10. TRANSCRIÇÃO DE CONVERSAS
  //
  // As duas listas abaixo são FRAGMENTOS DE EXPRESSÃO REGULAR, e não texto
  // literal: "[ií]" casa com i e í, e é assim que uma entrada cobre a
  // exportação acentuada e a sem acento. Escrever um parêntese, colchete
  // ou ponto de interrogação aqui muda o casamento — para texto literal,
  // escape com contrabarra.
  // =========================================================================
  const CONVERSAS = {
    // Linhas que o WhatsApp insere sozinho e que não são mensagem de
    // ninguém. Não somem da transcrição: viram nota, porque "a criptografia
    // mudou" pode significar troca de aparelho, e isso às vezes importa.
    FRASES_DE_SISTEMA: [
      "criptografia de ponta a ponta",
      "Mensagens e ligações são protegidas",
      "adicionou",
      "saiu do grupo",
      "criou o grupo",
      "mudou o nome",
      "alterou o código de segurança",
      "Você foi adicionado",
    ],

    // Marcadores de anexo. Viram nota explícita, porque um "arquivo de
    // mídia oculto" no meio da conversa é justamente o que a autoridade
    // precisa saber que existe.
    MARCADORES_DE_ANEXO: [
      "<M[ií]dia oculta>",
      "<anexado:",
      "arquivo de m[ií]dia oculto",
      "imagem ocultada",
      "áudio ocultado",
      "v[ií]deo omitido",
      "figurinha omitida",
      "GIF omitido",
      "documento omitido",
    ],
  };

  return {
    UNIDADE,
    RODAPE,
    LOG,
    ARMAZENAMENTO,
    INTERFACE,
    GERADOR,
    ORIENTACOES,
    CONVERSOR,
    TRANSCRICAO,
    CONVERSAS,
  };
})();
