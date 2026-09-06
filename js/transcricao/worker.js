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
 * SOBRE UMA THREAD SÓ (NUM_THREADS):
 * O onnxruntime-web cria as threads de pthread com
 * `new Worker(new URL(import.meta.url), …)`, e nesse ponto
 * `import.meta.url` é a URL do jsDelivr — outra origem, logo
 * SecurityError. Como não há fallback para blob nesse build, subir o
 * número de threads quebraria o carregamento em vez de acelerá-lo. Para
 * usar mais de uma, seria preciso baixar `ort-wasm-simd-threaded.jsep.mjs`
 * e o `.wasm` por conta própria e transformá-los em blob: URLs, como
 * js/conversor/conversor.js faz com o núcleo do ffmpeg.
 * ---------------------------------------------------------------------------
 */

import {
  pipeline,
  env,
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.5/dist/transformers.min.js";

const NUM_THREADS = 1;

// Este site não serve modelos: tudo vem do Hugging Face, que responde
// devolvendo a nossa origem no Access-Control-Allow-Origin.
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = NUM_THREADS;

// Instância viva entre uma transcrição e outra: recarregar o modelo a
// cada áudio jogaria fora meio minuto de inicialização à toa.
let transcritor = null;
let modeloCarregado = null;

function avisar(mensagem) {
  self.postMessage(mensagem);
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

  avisar({ tipo: "status", texto: "Carregando o modelo…" });
  transcritor = await pipeline("automatic-speech-recognition", modeloId, {
    dtype: "q8",
    device: "wasm",
    progress_callback: criarAcompanhanteDeDownload(),
  });
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
