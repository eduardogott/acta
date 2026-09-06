/**
 * LINTER.JS
 * ---------------------------------------------------------------------------
 * Roda uma vez, no carregamento da página, depois que registry.js, os
 * tipos de ocorrência, renderers, validadores e schema.js já executaram.
 * Não bloqueia o uso da ferramenta — só avisa alto (console + um aviso
 * discreto na tela) quando alguém edita um arquivo de tipo e comete um
 * erro estrutural (id duplicado, tipo de pergunta inexistente, exibirSe
 * apontando pra um id que não existe, etc). O objetivo é pegar esse tipo
 * de erro no momento em que o schema é editado, não quando um policial
 * estiver preenchendo o formulário.
 * ---------------------------------------------------------------------------
 */

const Linter = (() => {
  function todasPerguntasComOrigem() {
    // Junta as perguntas base + de TODOS os tipos registrados (não só o
    // ativo), pra checar o schema inteiro de uma vez.
    const resultado = window.SCHEMA.PERGUNTAS_BASE.map((p) => ({ pergunta: p, origem: "base" }));
    Object.entries(window.TIPOS_OCORRENCIA).forEach(([chave, def]) => {
      (def.perguntas || []).forEach((p) => resultado.push({ pergunta: p, origem: `tipo:${chave}` }));
    });
    return resultado;
  }

  function checarSchema() {
    const erros = [];
    const avisos = [];
    const todas = todasPerguntasComOrigem();
    const idsConhecidos = new Set(todas.map((t) => t.pergunta.id));
    const idsVistos = new Map(); // id -> [origens]

    todas.forEach(({ pergunta: p, origem }) => {
      const contexto = `pergunta "${p.id || "???"}" (${origem})`;

      if (!p.id) {
        erros.push(`${contexto}: sem "id".`);
        return;
      }

      // id duplicado em qualquer lugar do schema (base ou entre tipos)
      if (!idsVistos.has(p.id)) idsVistos.set(p.id, []);
      idsVistos.get(p.id).push(origem);

      if (!p.texto) erros.push(`${contexto}: sem "texto".`);

      if (!window.RENDERERS[p.tipo]) {
        erros.push(`${contexto}: tipo "${p.tipo}" não tem renderer registrado.`);
      }

      if (p.tipo === "multipla" || p.tipo === "selecao") {
        if (!Array.isArray(p.opcoes) || p.opcoes.length === 0) {
          erros.push(`${contexto}: tipo "${p.tipo}" precisa de "opcoes" (array não vazio).`);
        } else {
          const valoresVistos = new Set();
          p.opcoes.forEach((op, i) => {
            if (!op.valor || !op.texto) erros.push(`${contexto}: opção #${i} sem "valor"/"texto".`);
            if (valoresVistos.has(op.valor)) erros.push(`${contexto}: valor de opção "${op.valor}" duplicado.`);
            valoresVistos.add(op.valor);
          });
        }
      }

      if (p.tipo === "multiplo-input") {
        if (!Array.isArray(p.campos) || p.campos.length === 0) {
          erros.push(`${contexto}: tipo "multiplo-input" precisa de "campos" (array não vazio).`);
        } else {
          p.campos.forEach((campo) => {
            if (!campo.id || !campo.tipo || !campo.texto) {
              erros.push(`${contexto}: campo mal formado (precisa de id/tipo/texto): ${JSON.stringify(campo)}`);
              return;
            }
            if (!window.RENDERERS[campo.tipo]) {
              erros.push(`${contexto}: campo "${campo.id}" usa tipo "${campo.tipo}" sem renderer registrado.`);
            }
            if (typeof campo.validador === "string" && !window.VALIDADORES[campo.validador]) {
              erros.push(`${contexto}: campo "${campo.id}" referencia validador "${campo.validador}" inexistente.`);
            }
          });
        }
      }

      if (typeof p.validador === "string" && !window.VALIDADORES[p.validador]) {
        erros.push(`${contexto}: validador "${p.validador}" não está registrado.`);
      }

      Visibilidade.idsReferenciados(p.exibirSe).forEach((idRef) => {
        if (!idsConhecidos.has(idRef)) {
          erros.push(`${contexto}: "exibirSe" referencia a pergunta "${idRef}", que não existe em lugar nenhum do schema.`);
        }
      });

      if (!p.template) {
        avisos.push(`${contexto}: sem "template" — não vai contribuir com texto (ok se for só uma pergunta de bifurcação).`);
      }
    });

    idsVistos.forEach((origens, id) => {
      if (origens.length > 1) {
        erros.push(`id "${id}" usado mais de uma vez: ${origens.join(", ")}. Escolha ids únicos.`);
      }
    });

    return { erros, avisos };
  }

  function relatar({ erros, avisos }) {
    if (erros.length === 0 && avisos.length === 0) {
      console.info("[linter] schema OK — nenhum problema encontrado.");
      return;
    }
    console.group(`[linter] ${erros.length} erro(s), ${avisos.length} aviso(s)`);
    erros.forEach((e) => console.error("ERRO:", e));
    avisos.forEach((a) => console.warn("AVISO:", a));
    console.groupEnd();

    if (erros.length > 0) mostrarBannerNaTela(erros);
  }

  function mostrarBannerNaTela(erros) {
    const banner = document.createElement("div");
    banner.className = "linter-banner";
    banner.innerHTML =
      `<strong>${erros.length} erro(s) no schema</strong> — veja o console (F12). Isso é um aviso pra quem edita o questionário, não pro preenchimento.`;
    document.body.appendChild(banner);
  }

  return { checarSchema, relatar, executar: () => relatar(checarSchema()) };
})();
