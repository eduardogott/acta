document.addEventListener("DOMContentLoaded", () => {
  const log = window.Log.criar("gerador");

  // Uma linha de inventário na carga. É ela que responde "o tipo novo
  // entrou?" e "o renderer foi incluído no HTML?" sem abrir arquivo
  // nenhum — os dois erros mais comuns ao editar o questionário.
  log.info(
    "Gerador pronto:",
    Object.keys(window.TIPOS_OCORRENCIA).length, "tipos de ocorrência,",
    window.SCHEMA.PERGUNTAS_BASE.length, "perguntas base,",
    Object.keys(window.RENDERERS).length, "renderers,",
    Object.keys(window.VALIDADORES).length, "validadores."
  );

  Linter.executar();

  // ---------------------------------------------------------------------
  // Rascunho
  //
  // O aviso só aparece quando havia algo salvo. Ele precisa existir: sem
  // ele, um formulário que volta preenchido depois de um F5 parece um
  // formulário de outra pessoa — e o usuário não saberia como zerá-lo.
  // ---------------------------------------------------------------------
  const aviso = document.getElementById("aviso-rascunho");
  const tinhaRascunho = Engine.init();
  log.info(
    tinhaRascunho
      ? "Rascunho desta aba recuperado: " +
        Object.keys(Estado.obterRespostas()).length + " respostas."
      : "Sem rascunho — formulário começa em branco."
  );
  if (tinhaRascunho && aviso) {
    const texto = document.createElement("span");
    texto.textContent = "Respostas recuperadas desta aba. Fechar a aba apaga tudo.";

    const descartar = document.createElement("button");
    descartar.type = "button";
    descartar.className = "btn-descartar";
    descartar.textContent = "Descartar e recomeçar";
    descartar.addEventListener("click", () => {
      log.info("Rascunho descartado pelo usuário.");
      Engine.reset();
      aviso.classList.add("escondido");
    });

    aviso.appendChild(texto);
    aviso.appendChild(descartar);
    aviso.classList.remove("escondido");
  }

  // ---------------------------------------------------------------------
  // Ponte para as orientações
  //
  // O tipo de ocorrência diz qual folha o comunicante leva embora. O
  // mapeamento vive no módulo do tipo (campo "orientacoes" — ver
  // registry.js), porque é ele que sabe o que as próprias respostas
  // significam. Tipo sem esse campo simplesmente não mostra o link.
  // ---------------------------------------------------------------------
  function atualizarLinkOrientacoes() {
    const link = document.getElementById("link-orientacoes");
    if (!link) return;

    const respostas = Estado.obterRespostas();
    const modulo = window.TIPOS_OCORRENCIA[respostas.tipo_ocorrencia];
    const ponte = modulo && modulo.orientacoes;
    if (!ponte || !ponte.tipo) {
      log.debug(
        "Tipo", respostas.tipo_ocorrencia,
        "não declara folha de orientações — link escondido."
      );
      link.classList.add("escondido");
      return;
    }

    const params = new URLSearchParams({ tipo: ponte.tipo });
    const subtipo = typeof ponte.subtipo === "function" ? ponte.subtipo(respostas) : null;
    if (subtipo) params.set("sub", subtipo);

    link.href = "orientacoes.html?" + params.toString();
    link.classList.remove("escondido");
    log.info("Folha de orientações ligada:", params.toString());
  }

  document.getElementById("btn-gerar").addEventListener("click", () => {
    const texto = Generator.gerar();
    const saida = document.getElementById("saida-texto");
    saida.value = texto;
    document.getElementById("saida-wrapper").classList.remove("escondido");
    atualizarLinkOrientacoes();
    saida.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // O botão de copiar, com os degraus de reserva, mora em
  // js/comum/copiar.js — as orientações e a transcrição usam o mesmo.
  const btnCopiar = document.getElementById("btn-copiar");
  btnCopiar.addEventListener("click", () => {
    const saida = document.getElementById("saida-texto");
    window.Copiar.copiarComFeedback(btnCopiar, saida.value, { campo: saida });
  });

  document.getElementById("btn-reiniciar").addEventListener("click", () => {
    if (!confirm("Limpar todas as respostas e recomeçar?")) {
      log.debug("Reiniciar cancelado na confirmação.");
      return;
    }
    Engine.reset();
    if (aviso) aviso.classList.add("escondido");
  });
});
