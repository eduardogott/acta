"""Monta as paginas de teste em tests/build/.

Cada caso em tests/casos/<pagina>.js e injetado dentro da PAGINA REAL do
site -- nao numa copia simplificada. E o ponto do arranjo: o teste exercita
o mesmo HTML, o mesmo CSS e os mesmos scripts que o usuario carrega, e
qualquer um deles quebrando aparece aqui.

    python tests/gerar.py
"""
import io
import os
import re

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
CASOS = os.path.join(AQUI, "casos")
BUILD = os.path.join(AQUI, "build")

# caso -> pagina do site que ele exercita
PAGINAS = {
    # a pagina inicial: o nome do caso e "index" para que o arquivo
    # gerado se chame index.html e nav.js se reconheca como a inicial
    "index": "index.html",
    "gerador": "gerador.html",
    # mesma pagina, outro caso: este confere o paragrafo gerado, frase a frase
    "texto": "gerador.html",
    "conversor": "conversor.html",
    # mesma pagina, outro caso: este roda o ffmpeg de verdade (lento)
    "conversao": "conversor.html",
    "conferidor": "conferidor.html",
    "tipificacao": "tipificacao.html",
    "orientacoes": "orientacoes.html",
    "roteiro": "roteiro.html",
    "contatos": "contatos.html",
    "anotacoes": "anotacoes.html",
    "conversas": "conversas.html",
    "transcricao": "transcricao.html",
}

PRELUDIO = """
<pre id="resultado-teste" style="white-space:pre-wrap;font:12px monospace;padding:16px"></pre>
<script>
(function () {
  var linhas = [];
  var falhas = 0;
  var NL = String.fromCharCode(10);
  var assincrono = false;

  function enviar(texto) {
    try {
      fetch("/relato", { method: "POST", keepalive: true, body: texto }).catch(function () {});
    } catch (e) {}
  }

  // ---- API disponivel para os casos ----------------------------------
  window.ok = function (rotulo, valor) {
    var linha = "  . " + rotulo + " = " + JSON.stringify(valor);
    linhas.push(linha);
    enviar(linha);
  };
  window.igual = function (rotulo, valor, esperado) {
    var passou = JSON.stringify(valor) === JSON.stringify(esperado);
    if (!passou) falhas++;
    var linha = (passou ? "  ok " : "  FALHOU ") + rotulo +
      " = " + JSON.stringify(valor) +
      (passou ? "" : " (esperado " + JSON.stringify(esperado) + ")");
    linhas.push(linha);
    enviar(linha);
  };
  window.txt = function (id) {
    var e = document.getElementById(id);
    return e ? (e.textContent || "").trim() : null;
  };
  window.vis = function (id) {
    var e = document.getElementById(id);
    return !!e && !e.classList.contains("escondido");
  };
  window.clicar = function (seletor) {
    var e = document.querySelector(seletor);
    if (!e) throw new Error("elemento nao encontrado: " + seletor);
    e.click();
  };
  window.arq = function (nome, bytes, tipo) {
    return new File([new Uint8Array(bytes)], nome, { type: tipo });
  };
  window.selecionar = function (idInput, arquivos) {
    var dt = new DataTransfer();
    arquivos.forEach(function (f) { dt.items.add(f); });
    var inp = document.getElementById(idInput);
    inp.files = dt.files;
    inp.dispatchEvent(new Event("change"));
  };
  window.digitar = function (id, valor) {
    var e = document.getElementById(id);
    e.value = valor;
    e.dispatchEvent(new Event("input", { bubbles: true }));
  };
  window.marcar = function (seletor, marcado) {
    var e = document.querySelector(seletor);
    e.checked = marcado !== false;
    e.dispatchEvent(new Event("change", { bubbles: true }));
  };
  /** Casos assincronos chamam isto e depois pronto(). */
  window.manterVivo = function () { assincrono = true; };
  window.pronto = function () { encerrar(); };

  function encerrar() {
    var resumo = falhas === 0 ? "PASSOU" : "FALHOU (" + falhas + ")";
    var texto = "### __NOME__ " + resumo + NL + linhas.join(NL) + NL + "### FIM";
    var alvo = document.getElementById("resultado-teste");
    if (alvo) alvo.textContent = texto;
    enviar("### __NOME__ " + resumo);
    enviar("### FIM");
  }

  window.addEventListener("error", function (e) {
    falhas++;
    var linha = "  FALHOU erro nao tratado: " + e.message + " @ " + e.filename + ":" + e.lineno;
    linhas.push(linha);
    enviar(linha);
  });

  document.addEventListener("DOMContentLoaded", function () {
    try {
      // Invariantes de marca, conferidas em TODA pagina. Ficam aqui, e
      // nao em cada caso, porque sao a mesma regra para todas -- e porque
      // foi justamente essa regra que se perdeu quando o rodape estava
      // copiado sete vezes ("Acta" virou o nome do gerador).
      var marca = document.querySelector(".site-title");
      window.igual("titulo da aba comeca com Acta", document.title.indexOf("Acta — ") === 0, true);
      window.igual("marca no cabecalho", !!marca && marca.textContent.indexOf("Acta") >= 0, true);
      window.igual("etimologia no rodape", document.querySelectorAll("footer .footer-etymology").length, 1);
      window.igual("credito no rodape", document.querySelectorAll("footer .footer-credit").length, 1);
      window.igual("carimbo de versao no rodape", document.querySelectorAll("footer #carimbo-versao").length, 1);
      window.igual("h1 nao repete a marca", (document.querySelector(".page-title") || {}).textContent.indexOf("Acta") < 0, true);

"""

POSLUDIO = """
    } catch (err) {
      falhas++;
      var linha = "  FALHOU excecao: " + (err && err.stack ? err.stack : err);
      linhas.push(linha);
      enviar(linha);
      assincrono = false;
    }
    if (!assincrono) encerrar();
  });
})();
</script>
"""


def gerar():
    if not os.path.isdir(BUILD):
        os.makedirs(BUILD)

    gerados = []
    for nome, pagina in sorted(PAGINAS.items()):
        caminho_caso = os.path.join(CASOS, nome + ".js")
        if not os.path.isfile(caminho_caso):
            print("sem caso para %s, pulando" % nome)
            continue

        html = io.open(os.path.join(RAIZ, pagina), encoding="utf-8").read()
        corpo = io.open(caminho_caso, encoding="utf-8").read()

        harness = PRELUDIO.replace("__NOME__", nome) + corpo + POSLUDIO.replace("__NOME__", nome)
        saida = html.replace("</body>", harness + "\n</body>")

        # A pagina gerada mora em tests/build/, dois niveis abaixo da raiz,
        # e todos os caminhos dela sao relativos. Em vez de reescrever cada
        # um, um <base> resolve tudo de uma vez -- inclusive o
        # new Worker("js/transcricao/worker.js") la de dentro do JS, que
        # nenhuma reescrita de HTML alcancaria.
        saida = re.sub(r"<head>", '<head>\n<base href="/" />', saida, count=1)

        destino = os.path.join(BUILD, nome + ".html")
        io.open(destino, "w", encoding="utf-8", newline="\n").write(saida)
        gerados.append(nome)
        print("gerado tests/build/%s.html" % nome)

    return gerados


if __name__ == "__main__":
    gerar()
