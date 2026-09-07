// Uma conversão de verdade, ponta a ponta.
//
// O outro caso do conversor (conversor.js) cobre a interface e nunca
// chama o ffmpeg — foi o que deixou a divisão em regras.js / motor.js /
// conversor.js sem rede de segurança nenhuma. Aqui o motor é baixado,
// carregado e usado: se um nome tiver ficado do lado errado da divisão,
// é neste caso que aparece.
//
// LENTO: baixa ~32 MB do núcleo do ffmpeg na primeira execução (depois
// vem do Cache API, no perfil reaproveitado). Fica de fora do
// -PularLentos junto com a transcrição.

manterVivo();

var NL = String.fromCharCode(10);

/**
 * Um WAV de verdade, montado à mão: 8000 Hz, mono, 16 bits, meio segundo
 * de uma senoide. Um arquivo de zeros seria decodificado do mesmo jeito,
 * mas o encoder de MP3 num silêncio absoluto produz um quadro mínimo que
 * diria pouco sobre a conversão ter funcionado.
 */
function wavDeTeste(segundos) {
  var taxa = 8000;
  var amostras = Math.round(taxa * segundos);
  var bytes = 44 + amostras * 2;
  var buf = new ArrayBuffer(bytes);
  var v = new DataView(buf);

  function texto(pos, s) {
    for (var i = 0; i < s.length; i++) v.setUint8(pos + i, s.charCodeAt(i));
  }

  texto(0, "RIFF");
  v.setUint32(4, bytes - 8, true);
  texto(8, "WAVE");
  texto(12, "fmt ");
  v.setUint32(16, 16, true); // tamanho do bloco fmt
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, taxa, true);
  v.setUint32(28, taxa * 2, true); // bytes por segundo
  v.setUint16(32, 2, true); // alinhamento do bloco
  v.setUint16(34, 16, true); // bits por amostra
  texto(36, "data");
  v.setUint32(40, amostras * 2, true);

  for (var i = 0; i < amostras; i++) {
    var amostra = Math.round(Math.sin((2 * Math.PI * 440 * i) / taxa) * 12000);
    v.setInt16(44 + i * 2, amostra, true);
  }
  return new File([buf], "tom.wav", { type: "audio/wav" });
}

// --- as contas, que agora dá para conferir sem motor nenhum -----------
// (regras.js não toca em DOM nem em ffmpeg: é só chamar.)
var R = window.ConversorRegras;

igual("regras.js está carregado", !!R, true);
igual("extensão sai em minúsculas", R.extOf("FOTO.JPG"), ".jpg");
// baseName tira a extensão e só ela: o caminho fica, porque é ele que a
// lista de resultados mostra quando os arquivos vieram de uma pasta.
igual("nome sem extensão", R.baseName("video.final.mp4"), "video.final");
igual("caminho sobrevive", R.baseName("pasta/x/v.mp4"), "pasta/x/v");
igual("largura par para o x264", R.roundEven(721), 720);
igual("tipo vem da extensão", R.tipoDoArquivo({ name: "a.MKV" }), "video");
igual(
  "fila mista não tem tipo comum",
  R.tipoComumDeCompressao([{ name: "a.mp4" }, { name: "b.mp3" }]),
  null
);

var info = R.parseMediaInfo(
  [
    "  Duration: 00:01:40.00, start: 0.000000, bitrate: 1200 kb/s",
    "  Stream #0:0: Video: h264 (High), yuv420p, 1280x720 [SAR 1:1 DAR 16:9], 1100 kb/s, 30 fps",
    "  Stream #0:1: Audio: aac (LC), 48000 Hz, stereo, fltp, 128 kb/s",
  ].join(NL)
);
igual("duração lida do log", info.duration, 100);
igual("resolução lida do log", [info.width, info.height], [1280, 720]);
igual("fps lido do log", info.fps, 30);
igual("áudio reconhecido", [info.hasAudio, info.aSampleRate], [true, 48000]);

// 100 MB para 100 s: 8 Mbps sustentam 720p com folga.
var folgado = R.planejarAlvo(info, 100, 100 * 1024 * 1024);
igual("alvo folgado cabe", folgado.cabe, true);
igual("alvo folgado mantém a resolução", [folgado.width, folgado.height], [1280, 720]);

// 10 MB para os mesmos 100 s dão ~700 kbps de vídeo, e 0,025 bit por pixel
// — abaixo do mínimo. A escada desce, que é o comportamento que interessa:
// 480p nítido vale mais que 720p borrado do mesmo tamanho.
var apertadinho = R.planejarAlvo(info, 100, 10 * 1024 * 1024);
igual("alvo apertado cabe, encolhendo", apertadinho.cabe, true);
igual("a escada desceu um degrau", [apertadinho.width, apertadinho.height], [854, 480]);

// 300 KB para os mesmos 100 s: não cabe nem no bitrate mínimo.
var apertado = R.planejarAlvo(info, 100, 300 * 1024);
igual("alvo impossível é sinalizado", apertado.cabe, false);

// --- e agora o motor de verdade ---------------------------------------
igual("motor.js está carregado", !!window.ConversorMotor, true);
igual("os ganchos começam vazios", [
  window.ConversorMotor.ganchos.progresso,
  window.ConversorMotor.ganchos.log,
], [null, null]);

/**
 * Espera a primeira linha de resultado chegar a "ok" ou "erro".
 * O ffmpeg não avisa quando terminou por nenhum evento que a página
 * exponha; a classe do status é o sinal que ela mesma usa.
 */
function esperarResultado(rotulo, depois) {
  var limite = Date.now() + 300000;
  var timer = setInterval(function () {
    var itens = document.querySelectorAll(".resultado-item");
    var item = itens[itens.length - 1];
    var status = item ? item.querySelector(".resultado-status") : null;
    var terminou = status && /ok|erro/.test(status.className);

    if (!terminou && Date.now() < limite) return;
    clearInterval(timer);

    if (!terminou) {
      igual(rotulo + ": terminou dentro do tempo", false, true);
      pronto();
      return;
    }
    ok(rotulo + ": status final", status.textContent);
    igual(rotulo + ": sem erro", status.className.indexOf("erro") < 0, true);
    depois(item);
  }, 500);
}

// --- 1. converter: WAV -> MP3 (opção 1) --------------------------------
clicar('[data-op="1"]');
selecionar("input-arquivos", [wavDeTeste(0.5)]);
igual("wav libera o botão iniciar", document.getElementById("btn-iniciar").disabled, false);
clicar("#btn-iniciar");

esperarResultado("conversao", function (item) {
  var baixar = item.querySelector(".resultado-download");
  igual("gerou um arquivo para baixar", !!baixar, true);
  igual("saiu um mp3", baixar.getAttribute("download"), "tom.mp3");
  igual(
    "mostrou a comparação de tamanhos",
    item.querySelector(".resultado-tamanhos").textContent.indexOf("→") > 0,
    true
  );

  // O gancho de progresso tem de ser desfeito no fim: deixá-lo vivo faria
  // a barra de um arquivo mexer com o log do próximo.
  igual("o gancho de progresso foi solto", window.ConversorMotor.ganchos.progresso, null);

  comprimir();
});

// --- 2. comprimir (opção 9) -------------------------------------------
// Caminho diferente do primeiro: passa por execCompressao (com o recuo do
// -progress pipe:1) e pela sonda, que ficou do lado da página justamente
// por depender dela. É a costura da divisão, e por isso vale exercitá-la.
function comprimir() {
  clicar("#btn-limpar");
  clicar('[data-op="9"]');
  selecionar("input-arquivos", [wavDeTeste(1)]);
  igual("áudio detectado na fila", txt("tipo-detectado"), "áudio detectado");
  marcar('input[name="nivel"][value="1"]');
  clicar("#btn-iniciar");

  esperarResultado("compressao", function (item) {
    var baixar = item.querySelector(".resultado-download");
    igual("compressão gerou arquivo", !!baixar, true);
    igual("compressão saiu em mp3", /\.mp3$/.test(baixar.getAttribute("download")), true);
    igual("ganchos soltos no fim", [
      window.ConversorMotor.ganchos.progresso,
      window.ConversorMotor.ganchos.log,
    ], [null, null]);
    pronto();
  });
}
