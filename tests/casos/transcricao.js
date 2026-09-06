// Transcrição: a cadeia inteira, de verdade.
//
// Este caso é o mais caro do conjunto: cria o worker, importa a biblioteca
// do jsDelivr, baixa o modelo do Hugging Face e transcreve. É lento na
// primeira vez (uns 40 MB) e rápido depois, com o cache do perfil.
//
// Vale o custo porque é exatamente aqui que o projeto já tropeçou duas
// vezes na mesma pedra: o construtor Worker recusando URL de outra origem.
// Um teste que só olhasse a tela não pegaria isso.

manterVivo();

igual("modelos oferecidos", document.querySelectorAll('#modelo-lista input[name="modelo"]').length, 3);
igual("transcrever começa desabilitado", document.getElementById("btn-transcrever").disabled, true);
igual("página isolada (COOP/COEP)", window.crossOriginIsolated, true);
igual("SharedArrayBuffer disponível", typeof SharedArrayBuffer !== "undefined", true);

var worker;
try {
  worker = new Worker("js/transcricao/worker.js", { type: "module" });
  ok("worker criado", true);
} catch (err) {
  igual("criar o worker", "falhou: " + err.message, "sem erro");
  pronto();
}

if (worker) {
  var inicio = Date.now();
  var viuDownload = false;
  var threads = null;

  worker.onerror = function (e) {
    igual("worker sem erro", (e && e.message) || "evento vazio", "sem erro");
    pronto();
  };

  worker.onmessage = function (e) {
    var m = e.data || {};
    if (m.tipo === "download") {
      viuDownload = true;
      return;
    }
    if (m.tipo === "modo") {
      threads = m.threads;
      return;
    }
    if (m.tipo === "erro") {
      igual("transcrição sem erro", m.mensagem, "sem erro");
      return pronto();
    }
    if (m.tipo === "pronto") {
      ok("segundos até a resposta", Math.round((Date.now() - inicio) / 1000));
      ok("modelo baixado nesta execução", viuDownload);
      igual("o motor informou quantas threads usou", threads !== null, true);
      igual("usou mais de uma thread", threads > 1, true);
      igual("devolveu string de texto", typeof m.texto, "string");
      igual("devolveu trechos com tempo", Array.isArray(m.trechos), true);
      return pronto();
    }
  };

  // Três segundos de silêncio a 16 kHz. O que sai não interessa (o
  // Whisper inventa "[Música]" no vazio); interessa que a cadeia chegue
  // ao fim sem estourar.
  var audio = new Float32Array(16000 * 3);
  worker.postMessage(
    { tipo: "transcrever", audio: audio, modelo: "onnx-community/whisper-tiny" },
    [audio.buffer]
  );
}
