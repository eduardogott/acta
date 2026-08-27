/**
 * RENDERERS-REGISTRY.JS
 * ---------------------------------------------------------------------------
 * Cada tipo de pergunta ("multipla", "texto", "dinheiro"...) é um plugin
 * registrado aqui, não um caso fixo dentro do engine. Pra criar um tipo
 * novo (ex.: "data", "cpf"), crie js/renderers/nome.js chamando:
 *
 *   registrarRenderer("nome_do_tipo", {
 *     valorPadrao(pergunta) { ... },      // valor inicial no estado
 *     estaPreenchida(valor) { ... },      // usado pra saber se já respondeu
 *     revalidaVisibilidade: true|false,   // ver nota abaixo
 *     criar(pergunta, valorAtual, aoMudar) {
 *       // monta e devolve o elemento DOM do controle (sem o <label>,
 *       // isso o engine já cuida). Chame aoMudar(novoValor) sempre que o
 *       // valor mudar.
 *       return elementoDom;
 *     },
 *   });
 *
 * E inclua <script src="js/renderers/nome.js"></script> no index.html,
 * depois de renderers-registry.js. Nada em engine.js precisa mudar.
 *
 * SOBRE "revalidaVisibilidade":
 * Perguntas do tipo multipla/selecao costumam ser alvo de "exibirSe" de
 * outras perguntas (ex.: "sabe o número do processo?"). Por isso, ao
 * mudar, o engine refaz a tela inteira (pra abrir/fechar perguntas
 * dependentes). Já texto/número/dinheiro normalmente não disparam esse
 * tipo de condição — refazer a tela a cada tecla digitada perderia o
 * foco/cursor sem necessidade, então esses tipos só atualizam o próprio
 * estado. Se o seu tipo novo puder ser usado em "exibirSe", marque
 * revalidaVisibilidade: true.
 *
 * Um renderer pode chamar aoMudar(valor, { estrutural: true|false }) pra
 * decidir isso caso a caso em vez de usar sempre o padrão do tipo — é o
 * que o multiplo-input faz: adicionar/remover item é estrutural (pode
 * afetar visibilidade, refaz a tela); editar um campo de um item já
 * existente não é (só atualiza o estado, sem perder foco).
 *
 * SOBRE "estaTudoValido(pergunta, valor)" (opcional):
 * Só necessário se o seu tipo tem validação "interna" que o engine não
 * consegue ver olhando só pra "valor" (é o caso do multiplo-input, que
 * valida cada campo de cada item). Se definido, o engine passa a exigir
 * isso, junto do resto, pra considerar a pergunta respondida.
 * ---------------------------------------------------------------------------
 */

window.RENDERERS = {};

window.registrarRenderer = function registrarRenderer(tipo, definicao) {
  window.RENDERERS[tipo] = Object.assign(
    { revalidaVisibilidade: false, valorPadrao: () => undefined, estaPreenchida: (v) => !!v },
    definicao
  );
};
