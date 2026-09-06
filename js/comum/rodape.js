/**
 * RODAPE.JS
 * ---------------------------------------------------------------------------
 * Carimbo de versão no rodapé. Serve para responder "qual código estava no
 * ar quando isso aconteceu?" sem depender da memória de ninguém — o
 * fraseado dos textos gerados muda de versão para versão, e um relato de
 * "o texto saiu errado" só é investigável sabendo qual commit o usuário
 * tinha na tela.
 *
 * Mostra os últimos caracteres do hash (é o que se lê de relance); o hash
 * completo fica no title, porque é ele que serve num `git show`.
 * ---------------------------------------------------------------------------
 */
(function () {
  const CARACTERES = 7;

  document.addEventListener("DOMContentLoaded", () => {
    const alvo = document.getElementById("carimbo-versao");
    if (!alvo) return;

    const hash = String(window.ACTA_VERSAO || "").trim();
    // Sem carimbo (arquivo ausente ou build que não rodou) o rodapé fica
    // como estava — melhor nada do que "undefined" na tela.
    if (!hash) return;

    if (hash === "dev") {
      alvo.textContent = "versão local (dev)";
      alvo.title = "Servido fora do Cloudflare Pages — sem hash de commit.";
      return;
    }

    alvo.textContent = "versão " + hash.slice(-CARACTERES);
    alvo.title = "Commit " + hash;
  });
})();
