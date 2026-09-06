document.addEventListener("DOMContentLoaded", () => {
  Linter.executar();
  Engine.init();

  document.getElementById("btn-gerar").addEventListener("click", () => {
    const texto = Generator.gerar();
    const saida = document.getElementById("saida-texto");
    saida.value = texto;
    document.getElementById("saida-wrapper").classList.remove("escondido");
    saida.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // ---------------------------------------------------------------------
  // Copiar
  //
  // navigator.clipboard.writeText rejeita em situações comuns aqui: página
  // aberta como file://, permissão negada, ou foco fora do documento. Sem
  // tratamento a promessa rejeitava em silêncio — o botão não mudava e o
  // usuário concluía que tinha copiado sem ter copiado nada.
  //
  // Por isso há três degraus: a API moderna, o execCommand("copy") legado
  // (funciona em file:// e em navegadores antigos), e, se nem isso, deixar
  // o texto selecionado e pedir Ctrl+C.
  // ---------------------------------------------------------------------
  const btnCopiar = document.getElementById("btn-copiar");
  let timerFeedback = null;

  function feedback(mensagem, classe) {
    if (timerFeedback) clearTimeout(timerFeedback);
    btnCopiar.textContent = mensagem;
    btnCopiar.classList.remove("btn-ok", "btn-falhou");
    if (classe) btnCopiar.classList.add(classe);
    timerFeedback = setTimeout(() => {
      btnCopiar.textContent = "Copiar texto";
      btnCopiar.classList.remove("btn-ok", "btn-falhou");
      timerFeedback = null;
    }, classe === "btn-falhou" ? 6000 : 1500);
  }

  /** Último recurso: seleciona o texto e tenta o comando legado. */
  function copiarPelaSelecao(saida) {
    saida.focus();
    saida.select();
    saida.setSelectionRange(0, saida.value.length);
    try {
      return document.execCommand("copy");
    } catch (err) {
      return false;
    }
  }

  btnCopiar.addEventListener("click", async () => {
    const saida = document.getElementById("saida-texto");
    if (!saida.value.trim()) {
      feedback("Não há texto para copiar", "btn-falhou");
      return;
    }

    try {
      if (!navigator.clipboard) throw new Error("clipboard indisponível");
      await navigator.clipboard.writeText(saida.value);
      feedback("Copiado!", "btn-ok");
      return;
    } catch (err) {
      console.warn("[copiar] navigator.clipboard falhou:", err);
    }

    if (copiarPelaSelecao(saida)) {
      feedback("Copiado!", "btn-ok");
      return;
    }

    // O texto fica selecionado pela tentativa acima, então o Ctrl+C que
    // pedimos aqui funciona sem o usuário precisar selecionar nada.
    feedback("Não consegui copiar — o texto está selecionado, use Ctrl+C", "btn-falhou");
  });

  document.getElementById("btn-reiniciar").addEventListener("click", () => {
    if (confirm("Limpar todas as respostas e recomeçar?")) Engine.reset();
  });
});
