/**
 * COPIAR.JS
 * ---------------------------------------------------------------------------
 * Copiar para a área de transferência com feedback no próprio botão.
 *
 * Existia em três lugares (gerador, orientações e transcrição), e só o do
 * gerador tinha os degraus de reserva — os outros dois falhavam em
 * silêncio exatamente nos casos em que a API moderna recusa: página
 * aberta como `file://`, permissão negada, foco fora do documento.
 *
 * São três degraus, do melhor para o pior:
 *   1. navigator.clipboard.writeText
 *   2. document.execCommand("copy") sobre um campo selecionado
 *   3. deixar o texto selecionado e pedir Ctrl+C
 *
 * O terceiro só é possível quando existe um campo na tela com o texto
 * (`opcoes.campo`); sem ele, o degrau 2 usa um <textarea> temporário e o
 * 3 vira apenas uma mensagem de falha.
 * ---------------------------------------------------------------------------
 */
window.Copiar = (() => {
  const log = window.Log.criar("comum");

  const { MS_SUCESSO, MS_FALHA } = window.Config.INTERFACE;

  // Um cronômetro por botão: dois cliques seguidos não podem deixar o
  // rótulo antigo voltar por cima do novo.
  const timers = new WeakMap();

  function feedback(botao, mensagem, classe) {
    if (!botao.dataset.rotuloOriginal) botao.dataset.rotuloOriginal = botao.textContent;
    clearTimeout(timers.get(botao));

    botao.textContent = mensagem;
    botao.classList.remove("btn-ok", "btn-falhou");
    botao.classList.add(classe);

    timers.set(
      botao,
      setTimeout(() => {
        botao.textContent = botao.dataset.rotuloOriginal;
        botao.classList.remove("btn-ok", "btn-falhou");
      }, classe === "btn-falhou" ? MS_FALHA : MS_SUCESSO)
    );
  }

  /** Seleciona o campo (ou um temporário) e tenta o comando legado. */
  function copiarPelaSelecao(texto, campo) {
    const alvo = campo || document.createElement("textarea");
    if (!campo) {
      alvo.value = texto;
      // fora da tela, mas não display:none — o que não é renderizado não
      // pode ser selecionado, e sem seleção não há o que copiar
      alvo.style.position = "fixed";
      alvo.style.left = "-9999px";
      document.body.appendChild(alvo);
    }
    alvo.focus();
    alvo.select();
    if (alvo.setSelectionRange) alvo.setSelectionRange(0, alvo.value.length);

    let deuCerto = false;
    try {
      deuCerto = document.execCommand("copy");
    } catch (err) {
      deuCerto = false;
    }
    if (!campo) alvo.remove();
    return deuCerto;
  }

  /**
   * copiarComFeedback(botao, texto, { campo, vazio })
   *   campo — <textarea>/<input> que já mostra o texto, se houver
   *   vazio — mensagem quando não há nada para copiar
   * Devolve true se copiou.
   */
  async function copiarComFeedback(botao, texto, opcoes) {
    const { campo, vazio } = opcoes || {};

    if (!String(texto || "").trim()) {
      feedback(botao, vazio || "Não há texto para copiar", "btn-falhou");
      return false;
    }

    try {
      if (!navigator.clipboard) throw new Error("clipboard indisponível");
      await navigator.clipboard.writeText(texto);
      // O tamanho, nunca o texto: o que se copia daqui é narrativa de
      // ocorrência e transcrição de conversa.
      log.debug("Copiado pela API do navegador:", texto.length, "caracteres.");
      feedback(botao, "Copiado!", "btn-ok");
      return true;
    } catch (err) {
      log.aviso("navigator.clipboard recusou, tentando o execCommand legado:", err);
    }

    if (copiarPelaSelecao(texto, campo)) {
      log.info("Copiado pelo execCommand legado:", texto.length, "caracteres.");
      feedback(botao, "Copiado!", "btn-ok");
      return true;
    }

    log.erro("Nenhum dos três caminhos de cópia funcionou" +
             (campo ? " — o texto ficou selecionado para o Ctrl+C." : "."));

    // A tentativa acima deixou o texto selecionado, então o Ctrl+C que
    // pedimos aqui funciona sem o usuário precisar selecionar nada.
    feedback(
      botao,
      campo ? "Não consegui copiar — o texto está selecionado, use Ctrl+C" : "Não consegui copiar",
      "btn-falhou"
    );
    return false;
  }

  return { copiarComFeedback };
})();
