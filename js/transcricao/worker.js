/**
 * TRANSCRICAO-WORKER.JS
 * ---------------------------------------------------------------------------
 * O Whisper roda aqui dentro, e não na página, porque a inferência ocupa a
 * thread inteira por minutos: na página, a aba congelaria — sem barra,
 * sem botão de cancelar, sem nem rolar a tela.
 *
 * ESTE ARQUIVO PRECISA CONTINUAR LOCAL. O construtor Worker recusa
 * qualquer URL de outra origem, então não dá para servi-lo de um CDN — a
 * mesma restrição já documentada para o carregador do ffmpeg. O que vem
 * do CDN é a biblioteca, importada aqui de dentro: `import` cruza origem
 * sem problema quando o servidor manda CORS, e o jsDelivr manda.
 *
 * COMO AS THREADS FUNCIONAM AQUI
 *
 * O onnxruntime-web é compilado com pthreads, e cria cada thread com
 * `new Worker(new URL(import.meta.url), { type: "module" })`. Se o
 * `.mjs` do runtime for carregado direto do jsDelivr, `import.meta.url`
 * é a URL do CDN e o construtor recusa:
 *
 *     SecurityError: Script at 'https://cdn.jsdelivr.net/…' cannot be
 *     accessed from origin '…'
 *
 * A saída é a mesma que js/conversor/conversor.js usa para o núcleo do
 * ffmpeg: baixar `ort-wasm-simd-threaded.jsep.mjs` e o `.wasm` por conta
 * própria e entregá-los como `blob:` URLs. Um blob pertence à nossa
 * origem, então `import.meta.url` passa a ser um blob e as threads
 * nascem sem reclamação.
 *
 * Se qualquer parte disso falhar, o worker refaz o carregamento em uma
 * thread só, com os caminhos padrão. Perder velocidade é melhor que
 * perder a transcrição.
 * ---------------------------------------------------------------------------
 */

import {
  pipeline,
  env,
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.5/dist/transformers.min.js";

const VERSAO_BIBLIOTECA = "3.7.5";
const BASE_CDN = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@" + VERSAO_BIBLIOTECA + "/dist/";

// Os dois arquivos do runtime que precisam virar blob para as threads
// poderem nascer. O `.mjs` é o glue de 44 KB; o `.wasm` tem ~11 MB.
const ARQUIVOS_RUNTIME = {
  mjs: BASE_CDN + "ort-wasm-simd-threaded.jsep.mjs",
  wasm: BASE_CDN + "ort-wasm-simd-threaded.jsep.wasm",
};

// Acima de quatro o ganho no Whisper é pequeno e a memória cresce rápido;
// abaixo de dois não vale o trabalho de preparar os blobs.
const TETO_THREADS = 4;

// Cache do navegador para os dois arquivos do runtime, no mesmo espírito
// do cache do núcleo do ffmpeg. Trocar VERSAO_BIBLIOTECA invalida.
const CACHE_RUNTIME = "acta-ort-v1";

// Este site não serve modelos: tudo vem do Hugging Face, que responde
// devolvendo a nossa origem no Access-Control-Allow-Origin.
env.allowLocalModels = false;

// Instância viva entre uma transcrição e outra: recarregar o modelo a
// cada áudio jogaria fora meio minuto de inicialização à toa.
let transcritor = null;
let modeloCarregado = null;
// null = ainda não sei se as threads funcionam nesta sessão.
let threadsOk = null;

function avisar(mensagem) {
  self.postMessage(mensagem);
}

function quantasThreads() {
  const nucleos = self.navigator && self.navigator.hardwareConcurrency;
  return Math.max(1, Math.min(TETO_THREADS, nucleos || 1));
}

/**
 * Baixa um arquivo do runtime e devolve uma blob: URL. Usa o Cache API
 * para o `.wasm` de 11 MB não ser rebaixado a cada visita.
 */
async function comoBlobURL(url, tipo) {
  let resposta = null;
  let cache = null;
  try {
    cache = await caches.open(CACHE_RUNTIME);
    resposta = await cache.match(url);
  } catch (e) {
    // storage bloqueado: segue sem cache
  }

  if (!resposta) {
    // credentials omit: o site fica atrás de Basic Auth, e mandar
    // credenciais para uma origem que responde ACAO:* quebraria o CORS.
    resposta = await fetch(url, { credentials: "omit" });
    if (!resposta.ok) throw new Error("HTTP " + resposta.status + " em " + url);
    if (cache) {
      try {
        await cache.put(url, resposta.clone());
      } catch (e) {}
    }
  }

  const dados = await resposta.blob();
  return URL.createObjectURL(new Blob([dados], { type: tipo }));
}

/**
 * Prepara os blobs do runtime e aponta o onnxruntime para eles.
 * Devolve o número de threads efetivamente configurado.
 */
async function prepararThreads() {
  const [mjs, wasm] = await Promise.all([
    comoBlobURL(ARQUIVOS_RUNTIME.mjs, "text/javascript"),
    comoBlobURL(ARQUIVOS_RUNTIME.wasm, "application/wasm"),
  ]);

  // A forma de objeto é a que o onnxruntime aceita para apontar os dois
  // arquivos separadamente — com um prefixo em string ele tentaria
  // derivar o nome do .wasm, o que não existe num blob.
  env.backends.onnx.wasm.wasmPaths = { mjs, wasm };
  env.backends.onnx.wasm.numThreads = quantasThreads();
  return env.backends.onnx.wasm.numThreads;
}

/** Volta para o caminho seguro: uma thread, arquivos direto do CDN. */
function voltarParaUmaThread() {
  env.backends.onnx.wasm.wasmPaths = BASE_CDN;
  env.backends.onnx.wasm.numThreads = 1;
}

/**
 * O progress_callback da biblioteca fala por arquivo baixado, várias
 * vezes por segundo. Aqui os arquivos são somados num número só — é isso
 * que a barra da página mostra.
 */
function criarAcompanhanteDeDownload() {
  const arquivos = new Map();

  return (evento) => {
    if (!evento || !evento.file) return;

    if (evento.status === "progress" || evento.status === "download") {
      arquivos.set(evento.file, {
        recebido: evento.loaded || 0,
        total: evento.total || 0,
      });
    } else if (evento.status === "done") {
      const atual = arquivos.get(evento.file);
      if (atual) atual.recebido = atual.total;
    } else {
      return;
    }

    let recebido = 0;
    let total = 0;
    arquivos.forEach((a) => {
      recebido += a.recebido;
      total += a.total;
    });
    avisar({ tipo: "download", recebido, total, arquivo: evento.file });
  };
}

function construirPipeline(modeloId) {
  return pipeline("automatic-speech-recognition", modeloId, {
    dtype: "q8",
    device: "wasm",
    progress_callback: criarAcompanhanteDeDownload(),
  });
}

async function carregarModelo(modeloId) {
  if (transcritor && modeloCarregado === modeloId) return transcritor;

  // Trocar de modelo joga fora o anterior: dois Whisper carregados ao
  // mesmo tempo estouram a memória da aba sem necessidade.
  if (transcritor) {
    try {
      await transcritor.dispose();
    } catch (e) {
      /* nada a fazer: o que importa é soltar a referência abaixo */
    }
    transcritor = null;
    modeloCarregado = null;
  }

  if (threadsOk !== false) {
    try {
      avisar({ tipo: "status", texto: "Preparando o motor…" });
      const threads = await prepararThreads();
      avisar({ tipo: "status", texto: "Carregando o modelo…" });
      transcritor = await construirPipeline(modeloId);
      threadsOk = true;
      avisar({ tipo: "modo", threads });
    } catch (err) {
      // Uma falha aqui é quase sempre o navegador recusando as threads
      // (SharedArrayBuffer ausente, isolamento de origem cruzada
      // desligado) ou o CDN inacessível. Vale tentar do jeito simples.
      console.warn("[transcrição] threads indisponíveis, caindo para uma só:", err);
      threadsOk = false;
      transcritor = null;
    }
  }

  if (!transcritor) {
    voltarParaUmaThread();
    avisar({ tipo: "status", texto: "Carregando o modelo…" });
    transcritor = await construirPipeline(modeloId);
    avisar({ tipo: "modo", threads: 1 });
  }

  modeloCarregado = modeloId;
  return transcritor;
}

self.onmessage = async (evento) => {
  const pedido = evento.data || {};
  if (pedido.tipo !== "transcrever") return;

  try {
    const asr = await carregarModelo(pedido.modelo);

    avisar({ tipo: "status", texto: "Transcrevendo…" });
    const saida = await asr(pedido.audio, {
      language: "portuguese",
      task: "transcribe",
      // O Whisper só enxerga 30 segundos por vez; a biblioteca fatia o
      // áudio nesse tamanho e usa a sobreposição para costurar as
      // fronteiras sem cortar palavra no meio.
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: true,
    });

    avisar({
      tipo: "pronto",
      texto: (saida.text || "").trim(),
      trechos: saida.chunks || [],
    });
  } catch (err) {
    avisar({ tipo: "erro", mensagem: (err && err.message) || String(err) });
  }
};
