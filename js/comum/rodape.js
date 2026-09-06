/**
 * RODAPE.JS
 * ---------------------------------------------------------------------------
 * O rodapé inteiro é montado aqui, e não copiado em cada página — mesma
 * razão do nav.js. Sete cópias já tinham divergido na prática: a linha da
 * etimologia existia só no index, o que fazia "Acta" parecer o nome do
 * gerador de ocorrências em vez do nome da suíte.
 *
 * São três linhas:
 *   1. a etimologia, que é a identidade da suíte e vale em toda página;
 *   2. o crédito;
 *   3. o carimbo de versão.
 *
 * CARIMBO DE VERSÃO
 * Serve para responder "qual código estava no ar quando isso aconteceu?"
 * — o fraseado dos textos gerados muda de versão para versão, e um relato
 * de "o texto saiu errado" só é investigável sabendo qual commit o
 * usuário tinha na tela. Mostra os últimos caracteres do hash, que é o
 * que se lê de relance; o hash completo fica no title, porque é ele que
 * serve num `git show`.
 * ---------------------------------------------------------------------------
 */
(function () {
  const CARACTERES_DO_HASH = 7;

  const ETIMOLOGIA_HTML =
    'Acta — do latim <em>Acta Diurna</em>, os registros públicos diários de Roma.';
  const AUTOR = { nome: "Eduardo Gottert", url: "https://gttr.com.br", ano: "2026" };

  function criarLinha(classe) {
    const p = document.createElement("p");
    p.className = classe;
    return p;
  }

  /** Texto e title do carimbo. Devolve null quando não há o que mostrar. */
  function carimbo() {
    const hash = String(window.ACTA_VERSAO || "").trim();
    // Sem carimbo (arquivo ausente ou build que não rodou) não se escreve
    // nada — melhor uma linha a menos do que "undefined" na tela.
    if (!hash) return null;
    if (hash === "dev") {
      return {
        texto: "versão local (dev)",
        title: "Servido fora do Cloudflare Pages — sem hash de commit.",
      };
    }
    return { texto: "versão " + hash.slice(-CARACTERES_DO_HASH), title: "Commit " + hash };
  }

  function montar() {
    const rodape = document.querySelector("footer");
    if (!rodape) return;

    rodape.innerHTML = "";

    const etimologia = criarLinha("footer-etymology");
    etimologia.innerHTML = ETIMOLOGIA_HTML;
    rodape.appendChild(etimologia);

    const credito = criarLinha("footer-credit");
    const link = document.createElement("a");
    link.className = "footer-link";
    link.href = AUTOR.url;
    link.textContent = AUTOR.nome;
    credito.appendChild(link);
    credito.appendChild(document.createTextNode(" · " + AUTOR.ano));
    rodape.appendChild(credito);

    const versao = carimbo();
    if (versao) {
      const linha = criarLinha("footer-versao");
      const span = document.createElement("span");
      span.id = "carimbo-versao";
      span.textContent = versao.texto;
      span.title = versao.title;
      linha.appendChild(span);
      rodape.appendChild(linha);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", montar);
  } else {
    montar();
  }
})();
