/**
 * TIPIFICACAO-DADOS.JS
 * ---------------------------------------------------------------------------
 * A tabela de consulta, e só ela. A página (js/tipificacao/tipificacao.js) não sabe
 * nada sobre direito penal — quem edita esta lista não precisa ler uma
 * linha de código da outra.
 *
 * FORMATO DE CADA ENTRADA
 *
 *   {
 *     fato:    "Furto",                       // como se procura no balcão
 *     artigo:  "Art. 155",                    // como aparece no BO
 *     diploma: CP,                            // uma das constantes abaixo
 *     ref:     "Art. 155 - DL2848",           // a referência compacta (ver REF)
 *     pena:    "reclusão, de 1 a 6 anos, e multa",
 *     acao:    "incondicionada",              // ver `acao` abaixo
 *     jecrim:  false,                         // infração de menor potencial ofensivo
 *     marcas:  ["hediondo"],                  // opcional, ver MARCAS
 *     fianca:  "juiz",                        // opcional, ver FIANÇA
 *     busca:   "subtrair levar sumiu",        // sinônimos extras, opcional
 *     obs:     "…",                           // ressalva curta, opcional
 *     prescricao: "imprescritível",           // só quando o art. 109 não vale
 *     orientacoes: "furto_roubo",             // folha do comunicante, opcional
 *     texto:   "Subtrair, para si…",          // o dispositivo em si, opcional
 *   }
 *
 * O `grupo` (Vida, Honra, Patrimônio…) não se escreve em cada entrada: é a
 * função grupo(), lá embaixo, que o carimba em todas as entradas do bloco.
 * A página desenha uma linha de título a cada grupo novo.
 *
 * REF
 *
 * `ref` é o artigo no formato curto dos sistemas de registro:
 *
 *   "Art. 121, §2, II - DL2848"      artigo, parágrafo, inciso, diploma
 *   "Art. 163, p.u., III - DL2848"   parágrafo único é "p.u."
 *   "Art. 2-A - L7716"               sem "º", sem espaço depois do "§"
 *
 * O código do diploma (DL2848, L11343…) vem de DIPLOMAS, abaixo. Na tela,
 * a coluna mostra o `artigo` e, embaixo, o código com um espaço
 * ("DL 2848"); clicar no artigo copia a `ref` inteira. Ela repete o
 * `artigo` de propósito: um é para ler, o outro para colar. O teste
 * confere que os dois apontam para o mesmo dispositivo e que o código
 * bate com o diploma.
 *
 * `acao` aceita: "incondicionada", "condicionada", "privada" e "outra"
 * (para o que não é ação penal comum, como o art. 28 da Lei de Drogas).
 *
 * `jecrim` é true quando a pena máxima não passa de dois anos, ou quando é
 * contravenção — os dois casos do art. 61 da Lei 9.099/1995. Fica de fora,
 * mesmo com pena baixa: violência doméstica contra a mulher (art. 41 da
 * Lei 11.340/2006), crime contra criança ou adolescente (art. 226, § 1º,
 * do ECA) e crime do Estatuto da Pessoa Idosa ou com violência contra ela
 * (art. 94, parágrafo único, do Estatuto, desde a Lei 15.163/2025). Quando
 * a exclusão depende de quem é a vítima, a entrada fica `true` e a `obs`
 * avisa.
 *
 * MARCAS
 *
 *   "hediondo"      está no art. 1º da Lei 8.072/1990
 *   "equiparado"    equiparado a hediondo (tráfico, tortura)
 *   "inafiancavel"  inafiançável por si (racismo, Lei de Drogas art. 44…);
 *                   hediondo e equiparado já são, e não precisam da marca
 *   "domestica"     tipo próprio da violência contra a mulher
 *
 * Marca só o que vale para a entrada inteira. Hediondez que depende do
 * caso (homicídio em grupo de extermínio, sequestro de menor) vai na `obs`.
 *
 * FIANÇA
 *
 * A página deduz quem arbitra a fiança: termo circunstanciado no JECRIM;
 * delegado quando a pena máxima não passa de 4 anos (art. 322 do CPP);
 * juiz acima disso; ninguém quando é inafiançável. `fianca: "juiz"` força
 * o juiz quando a lei diz isso apesar da pena (art. 24-A, § 2º, da Lei
 * Maria da Penha).
 *
 * `prescricao` normalmente NÃO se escreve: a página calcula o prazo a
 * partir da pena máxima, pelo art. 109 do CP. Só se preenche quando a
 * fórmula não vale — crime imprescritível, prazo fixado em lei própria
 * (art. 30 da Lei de Drogas), pena só de multa (art. 114, I) ou pena que
 * remete a outro tipo. Nas formas majoradas, a `pena` traz a faixa já
 * aumentada ("de 10 anos a 16 anos e 8 meses"), e o cálculo acerta sozinho.
 *
 * `orientacoes` é a chave de um tipo de window.ORIENTACOES
 * (js/orientacoes/dados.js): a folha que se imprime e entrega ao
 * comunicante. A linha já mostrou um link para ela; o link saiu da tela
 * em outubro de 2026, e o campo ficou, conferido na carga, para quando
 * voltar. É opcional de propósito: há crime sem folha (receptação,
 * desacato) e folha sem crime (perda de documento), e forçar a
 * correspondência inventaria uma das duas.
 *
 * `obs`: na linha aparece só a PRIMEIRA FRASE; o resto vai para a gaveta,
 * junto com o texto do artigo. Escreva primeiro o que mais importa no
 * balcão — a regra que decide a tipificação — e deixe para o fim a
 * citação da lei e a mudança de pena ("Pena da Lei 15.397/2026 (antes:
 * 1 a 4 anos)."). Frase termina em ponto seguido de maiúscula.
 *
 * `busca` existe porque o nome jurídico raramente é a palavra que a
 * pessoa usa: quem chega dizendo "mexeram no meu carro" procura por
 * "arrombamento", não por "furto qualificado". Com o `fato`, é o que a
 * busca olha primeiro: a linha que casa aqui vem antes das que casam só
 * pelo artigo, pela observação ou pelo texto da lei.
 *
 * `texto` é o dispositivo legal em si, e a página o esconde atrás de um
 * "ver o texto do artigo": a tabela existe para achar o artigo, e ler o
 * texto é o passo seguinte. Quatro regras ao preencher:
 *
 *   1. COPIE LITERALMENTE, do Planalto. Não resuma, não atualize a
 *      grafia, não corte o que parece supérfluo. A página inteira pede
 *      para conferir no texto legal antes de tipificar — um resumo aqui
 *      seria justamente a paráfrase que ela manda evitar. Ficam de fora
 *      só as notas de edição do Planalto ("Redação dada pela Lei…",
 *      "Incluído pela…", "Vide…") e a redação revogada, que o texto
 *      compilado mostra riscada ao lado da nova.
 *   2. Escreva o caput; quando a entrada for de um parágrafo (§ 4º,
 *      § 9º), escreva o parágrafo; quando for de um inciso, a cabeça do
 *      caput ou do parágrafo, o inciso e a pena. A linha da pena vai
 *      junto, porque ela faz parte do dispositivo — a coluna "Pena" é
 *      resumo, não fonte.
 *   3. Quebre linha com \n entre o caput e a pena, e entre um parágrafo
 *      e outro. A página respeita as quebras.
 *   4. O ordinal sai como no Planalto ("§ 2º"), e não como o texto
 *      copiado da página às vezes o traz ("§ 2o", "§ 2 o").
 *
 * Os textos de hoje foram tirados, todos, do texto compilado do Planalto
 * de cada lei, salvo em docs/ (que fica fora do git). É opcional: entrada
 * sem `texto` não mostra o link, e continua servindo. A busca alcança o
 * que estiver escrito aqui — quem lembra "coisa alheia móvel" e não
 * lembra "furto" acha do mesmo jeito.
 *
 * ATENÇÃO A QUEM EDITA: esta tabela é digitada à mão e envelhece a cada
 * lei nova. Ela é um atalho para lembrar onde procurar, nunca a fonte —
 * confira no texto legal antes de tipificar. A revisão de outubro de 2026
 * conferiu cada linha contra o texto compilado do Planalto e alcançou a
 * Lei 15.517, de setembro de 2026; leis mais graves não retroagem, e para
 * fato antigo vale a pena da época.
 * ---------------------------------------------------------------------------
 */

(function () {
  "use strict";

  // ---------------------------------------------------------------- DIPLOMAS
  // `nome` identifica o diploma na entrada e entra na busca; `curto` vai no
  // filtro e no título do número; `codigo` fecha a `ref` e, com um espaço
  // depois da sigla, é o que aparece embaixo do artigo ("DL 2848").
  const CP = "CP";
  const LCP = "LCP (Dec.-Lei 3.688/1941)";
  const DROGAS = "Lei de Drogas (Lei 11.343/2006)";
  const PENHA = "Lei Maria da Penha (Lei 11.340/2006)";
  const ECA = "ECA (Lei 8.069/1990)";
  const HENRY = "Lei Henry Borel (Lei 14.344/2022)";
  const CTB = "CTB (Lei 9.503/1997)";
  const ARMAS = "Estatuto do Desarmamento (Lei 10.826/2003)";
  const FACCOES = "Marco Legal do Combate ao Crime Organizado (Lei 15.358/2026)";
  const RACISMO = "Lei 7.716/1989";
  const TORTURA = "Lei 9.455/1997";
  const AMBIENTAL = "Lei 9.605/1998";
  const IDOSO = "Estatuto da Pessoa Idosa (Lei 10.741/2003)";
  const PCD = "Estatuto da Pessoa com Deficiência (Lei 13.146/2015)";
  const ABUSO = "Lei de Abuso de Autoridade (Lei 13.869/2019)";
  const LAVAGEM = "Lei de Lavagem de Dinheiro (Lei 9.613/1998)";
  const SFN = "Lei dos Crimes contra o Sistema Financeiro (Lei 7.492/1986)";
  const ELEITORAL = "Código Eleitoral (Lei 4.737/1965)";

  window.TIPIFICACAO_DIPLOMAS = [
    { nome: CP, curto: "Código Penal", codigo: "DL2848" },
    { nome: LCP, curto: "Contravenções", codigo: "DL3688" },
    { nome: DROGAS, curto: "Lei de Drogas", codigo: "L11343" },
    { nome: PENHA, curto: "Lei Maria da Penha", codigo: "L11340" },
    { nome: ECA, curto: "ECA", codigo: "L8069" },
    { nome: HENRY, curto: "Lei Henry Borel", codigo: "L14344" },
    { nome: CTB, curto: "Trânsito (CTB)", codigo: "L9503" },
    { nome: ARMAS, curto: "Desarmamento", codigo: "L10826" },
    { nome: FACCOES, curto: "Crime organizado (Lei 15.358)", codigo: "L15358" },
    { nome: RACISMO, curto: "Racismo", codigo: "L7716" },
    { nome: TORTURA, curto: "Tortura", codigo: "L9455" },
    { nome: AMBIENTAL, curto: "Crimes Ambientais", codigo: "L9605" },
    { nome: IDOSO, curto: "Pessoa Idosa", codigo: "L10741" },
    { nome: PCD, curto: "Pessoa com Deficiência", codigo: "L13146" },
    { nome: ABUSO, curto: "Abuso de Autoridade", codigo: "L13869" },
    { nome: LAVAGEM, curto: "Lavagem de Dinheiro", codigo: "L9613" },
    { nome: SFN, curto: "Sistema Financeiro", codigo: "L7492" },
    { nome: ELEITORAL, curto: "Código Eleitoral", codigo: "L4737" },
  ];

  /** Carimba o nome do grupo em cada entrada do bloco. */
  function grupo(nome, entradas) {
    entradas.forEach((e) => { e.grupo = nome; });
    return entradas;
  }

  // Textos que se repetem em muitas linhas.
  const VD_SEM_JECRIM =
    "Em violência doméstica contra a mulher, a Lei 9.099/1995 não se aplica (art. 41 da Lei 11.340/2006).";
  const QUALIFICADO_121 = "reclusão, de 12 a 30 anos";
  const ROUBO_MAJORADO = "reclusão, de 8 a 15 anos, e multa (caput aumentado de 1/3 até a metade)";
  const HONRA_VULNERAVEL =
    "Aumento de 1/3 contra criança, adolescente, maior de 60 ou pessoa com deficiência (art. 141, IV).";
  const RACISMO_MOTIVO =
    "Por discriminação ou preconceito de raça, cor, etnia, religião ou procedência nacional (art. 1º). Imprescritível e inafiançável (art. 5º, XLII, da Constituição).";
  const ABUSO_DOLO =
    "Só é crime com a finalidade de prejudicar alguém, de beneficiar a si ou a terceiro, ou por capricho (art. 1º, § 1º).";
  // O Código Eleitoral quase sempre só fixa o máximo ("reclusão até cinco
  // anos"). A coluna traz a faixa com o mínimo do art. 284, para que a
  // prescrição e a fiança se calculem como nas outras linhas.
  const ELEITORAL_MINIMO =
    "O Código Eleitoral fixa só o máximo; o mínimo é o do art. 284 (15 dias de detenção, 1 ano de reclusão).";

  window.TIPIFICACAO = [].concat(

  // ======================================================================
  grupo("Crimes contra a vida", [
  // ======================================================================
    {
      fato: "Homicídio simples", artigo: "Art. 121", diploma: CP,
      ref: "Art. 121 - DL2848",
      pena: "reclusão, de 6 a 20 anos", acao: "incondicionada", jecrim: false,
      busca: "matar morte óbito assassinato assassinou",
      obs: "Privilegiado (§ 1º): redução de 1/6 a 1/3. Hediondo se em atividade típica de grupo de extermínio. Por integrante de facção ultraviolenta, milícia ou grupo paramilitar (§ 2º-D, Lei 15.358/2026): reclusão, de 20 a 40 anos.",
      texto:
        "Matar alguem:\n" +
        "Pena - reclusão, de seis a vinte anos.",
    },
    {
      fato: "Homicídio qualificado — paga ou motivo torpe", artigo: "Art. 121, § 2º, I", diploma: CP,
      ref: "Art. 121, §2, I - DL2848",
      pena: QUALIFICADO_121, acao: "incondicionada", jecrim: false, marcas: ["hediondo"],
      busca: "pistoleiro encomenda vingança mandante",
      texto:
        "§ 2º Se o homicídio é cometido:\n" +
        "I - mediante paga ou promessa de recompensa, ou por outro motivo torpe;\n" +
        "Pena - reclusão, de doze a trinta anos.",
    },
    {
      fato: "Homicídio qualificado — motivo fútil", artigo: "Art. 121, § 2º, II", diploma: CP,
      ref: "Art. 121, §2, II - DL2848",
      pena: QUALIFICADO_121, acao: "incondicionada", jecrim: false, marcas: ["hediondo"],
      busca: "briga boba discussão banal",
      texto:
        "§ 2º Se o homicídio é cometido:\n" +
        "II - por motivo futil;\n" +
        "Pena - reclusão, de doze a trinta anos.",
    },
    {
      fato: "Homicídio qualificado — meio cruel ou de perigo comum", artigo: "Art. 121, § 2º, III", diploma: CP,
      ref: "Art. 121, §2, III - DL2848",
      pena: QUALIFICADO_121, acao: "incondicionada", jecrim: false, marcas: ["hediondo"],
      busca: "veneno fogo explosivo asfixia tortura",
      texto:
        "§ 2º Se o homicídio é cometido:\n" +
        "III - com emprego de veneno, fogo, explosivo, asfixia, tortura ou outro " +
        "meio insidioso ou cruel, ou de que possa resultar perigo comum;\n" +
        "Pena - reclusão, de doze a trinta anos.",
    },
    {
      fato: "Homicídio qualificado — recurso que dificulte a defesa", artigo: "Art. 121, § 2º, IV", diploma: CP,
      ref: "Art. 121, §2, IV - DL2848",
      pena: QUALIFICADO_121, acao: "incondicionada", jecrim: false, marcas: ["hediondo"],
      busca: "traição emboscada dissimulação pelas costas dormindo surpresa",
      texto:
        "§ 2º Se o homicídio é cometido:\n" +
        "IV - à traição, de emboscada, ou mediante dissimulação ou outro recurso " +
        "que dificulte ou torne impossivel a defesa do ofendido;\n" +
        "Pena - reclusão, de doze a trinta anos.",
    },
    {
      fato: "Homicídio qualificado — para assegurar outro crime", artigo: "Art. 121, § 2º, V", diploma: CP,
      ref: "Art. 121, §2, V - DL2848",
      pena: QUALIFICADO_121, acao: "incondicionada", jecrim: false, marcas: ["hediondo"],
      busca: "queima de arquivo testemunha ocultar impunidade",
      texto:
        "§ 2º Se o homicídio é cometido:\n" +
        "V - para assegurar a execução, a ocultação, a impunidade ou vantagem de " +
        "outro crime:\n" +
        "Pena - reclusão, de doze a trinta anos.",
    },
    {
      fato: "Homicídio qualificado — contra agente de segurança ou do sistema de justiça", artigo: "Art. 121, § 2º, VII", diploma: CP,
      ref: "Art. 121, §2, VII - DL2848",
      pena: QUALIFICADO_121, acao: "incondicionada", jecrim: false, marcas: ["hediondo"],
      busca: "policial militar civil guarda municipal agente penitenciário juiz promotor defensor oficial de justiça",
      obs: "Alínea a: forças de segurança e sistema prisional. Alínea b (Lei 15.134/2025): Judiciário, MP, Defensoria, Advocacia Pública e oficiais de justiça. Vale também contra cônjuge, companheiro ou parente até o 3º grau, em razão dessa condição.",
      texto:
        "§ 2º Se o homicídio é cometido:\n" +
        "VII – contra:\n" +
        "a) autoridade ou agente descrito nos arts. 142 e 144 da Constituição " +
        "Federal, integrantes do sistema prisional e da Força Nacional de " +
        "Segurança Pública, no exercício da função ou em decorrência dela, ou " +
        "contra seu cônjuge, companheiro ou parente consanguíneo até o terceiro " +
        "grau, em razão dessa condição;\n" +
        "b) membro do Poder Judiciário, do Ministério Público, da Defensoria " +
        "Pública ou da Advocacia Pública, de que tratam os arts. 131 e 132 da " +
        "Constituição Federal, ou oficial de justiça, no exercício da função ou " +
        "em decorrência dela, ou contra seu cônjuge, companheiro ou parente, " +
        "inclusive por afinidade, até o terceiro grau, em razão dessa condição;\n" +
        "Pena - reclusão, de doze a trinta anos.",
    },
    {
      fato: "Homicídio qualificado — arma de fogo de uso restrito ou proibido", artigo: "Art. 121, § 2º, VIII", diploma: CP,
      ref: "Art. 121, §2, VIII - DL2848",
      pena: QUALIFICADO_121, acao: "incondicionada", jecrim: false, marcas: ["hediondo"],
      busca: "fuzil calibre restrito",
      texto:
        "§ 2º Se o homicídio é cometido:\n" +
        "VIII - com emprego de arma de fogo de uso restrito ou proibido:\n" +
        "Pena - reclusão, de doze a trinta anos.",
    },
    {
      fato: "Homicídio qualificado — contra menor de 14 anos", artigo: "Art. 121, § 2º, IX", diploma: CP,
      ref: "Art. 121, §2, IX - DL2848",
      pena: QUALIFICADO_121, acao: "incondicionada", jecrim: false, marcas: ["hediondo"],
      busca: "criança bebê filho",
      obs: "Aumentos do § 2º-B: deficiência ou doença da vítima, autor ascendente ou com autoridade sobre ela, ou crime em escola. Lei 14.344/2022 (Henry Borel).",
      texto:
        "§ 2º Se o homicídio é cometido:\n" +
        "IX - contra menor de 14 (quatorze) anos:\n" +
        "Pena - reclusão, de doze a trinta anos.",
    },
    {
      fato: "Homicídio qualificado — nas dependências de instituição de ensino", artigo: "Art. 121, § 2º, X", diploma: CP,
      ref: "Art. 121, §2, X - DL2848",
      pena: QUALIFICADO_121, acao: "incondicionada", jecrim: false, marcas: ["hediondo"],
      busca: "escola colégio faculdade ataque",
      obs: "Aumento do § 2º-C: de 1/3 até a metade se a vítima é pessoa com deficiência ou vulnerável; de 2/3 se o autor é ascendente, tem autoridade sobre ela, ou é professor ou funcionário da escola. Lei 15.159/2025.",
      texto:
        "§ 2º Se o homicídio é cometido:\n" +
        "X - nas dependências de instituição de ensino:\n" +
        "Pena - reclusão, de doze a trinta anos.",
    },
    {
      fato: "Feminicídio", artigo: "Art. 121-A", diploma: CP,
      ref: "Art. 121-A - DL2848",
      pena: "reclusão, de 20 a 40 anos", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo", "domestica"],
      busca: "mulher razões da condição do sexo feminino matou esposa companheira namorada",
      obs: "Crime autônomo desde a Lei 14.994/2024 (antes era o art. 121, § 2º, VI). Aumento de 1/3 até a metade (§ 2º): gestante ou até 3 meses após o parto, vítima menor de 14 ou maior de 60, na presença de descendente ou ascendente, em descumprimento de medida protetiva.",
      orientacoes: "violencia_domestica",
      texto:
        "Matar mulher por razões da condição do sexo feminino:\n" +
        "Pena – reclusão, de 20 (vinte) a 40 (quarenta) anos.",
    },
    {
      fato: "Vicaricídio", artigo: "Art. 121-B", diploma: CP,
      ref: "Art. 121-B - DL2848",
      pena: "reclusão, de 20 a 40 anos", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo", "domestica"],
      busca: "violência vicária matou o filho para atingir a mãe enteado",
      obs: "Matar descendente, ascendente, dependente ou pessoa sob guarda da mulher para causar-lhe sofrimento, puni-la ou controlá-la. Aumento de 1/3 até a metade se na presença dela, contra criança, idoso ou pessoa com deficiência, ou em descumprimento de medida protetiva. Lei 15.384/2026.",
      orientacoes: "violencia_domestica",
      texto:
        "Matar descendente, ascendente, dependente, enteado ou pessoa sob guarda " +
        "ou responsabilidade direta da mulher, com o fim específico de causar-lhe " +
        "sofrimento, punição ou controle, no contexto de violência doméstica e " +
        "familiar.\n" +
        "Pena – reclusão, de 20 (vinte) a 40 (quarenta) anos.",
    },
    {
      fato: "Homicídio culposo", artigo: "Art. 121, § 3º", diploma: CP,
      ref: "Art. 121, §3 - DL2848",
      pena: "detenção, de 1 a 3 anos", acao: "incondicionada", jecrim: false,
      busca: "sem intenção acidente imprudência negligência",
      obs: "Aumento de 1/3 por inobservância de regra técnica ou omissão de socorro (§ 4º). Perdão judicial (§ 5º). Na direção de veículo, é o art. 302 do CTB.",
      texto:
        "§ 3º Se o homicídio é culposo:\n" +
        "Pena - detenção, de um a três anos.",
    },
    {
      fato: "Induzimento, instigação ou auxílio a suicídio ou automutilação",
      artigo: "Art. 122", diploma: CP,
      ref: "Art. 122 - DL2848",
      pena: "reclusão, de 6 meses a 2 anos", acao: "incondicionada", jecrim: true,
      busca: "suicídio automutilação se matar se cortar desafio internet",
      obs: "Lesão grave ou gravíssima (§ 1º): 1 a 3 anos. Morte: § 2º. Pena em dobro por motivo egoístico ou vítima menor (§ 3º); até o dobro pela internet ou em tempo real (§ 4º) — e aí é hediondo (Lei 14.811/2024). Vítima menor de 14: responde por lesão gravíssima ou homicídio.",
      texto:
        "Induzir ou instigar alguém a suicidar-se ou a praticar automutilação ou " +
        "prestar-lhe auxílio material para que o faça:\n" +
        "Pena - reclusão, de 6 (seis) meses a 2 (dois) anos.",
    },
    {
      fato: "Induzimento ou auxílio a suicídio — com resultado morte", artigo: "Art. 122, § 2º", diploma: CP,
      ref: "Art. 122, §2 - DL2848",
      pena: "reclusão, de 2 a 6 anos", acao: "incondicionada", jecrim: false,
      busca: "suicídio consumado",
      texto:
        "§ 2º Se o suicídio se consuma ou se da automutilação resulta morte:\n" +
        "Pena - reclusão, de 2 (dois) a 6 (seis) anos.",
    },
    {
      fato: "Infanticídio", artigo: "Art. 123", diploma: CP,
      ref: "Art. 123 - DL2848",
      pena: "detenção, de 2 a 6 anos", acao: "incondicionada", jecrim: false,
      busca: "estado puerperal recém-nascido matou o próprio filho parto",
      texto:
        "Matar, sob a influência do estado puerperal, o próprio filho, durante o " +
        "parto ou logo após:\n" +
        "Pena - detenção, de dois a seis anos.",
    },
    {
      fato: "Aborto provocado pela gestante ou com seu consentimento", artigo: "Art. 124", diploma: CP,
      ref: "Art. 124 - DL2848",
      pena: "detenção, de 1 a 3 anos", acao: "incondicionada", jecrim: false,
      busca: "autoaborto remédio abortivo",
      obs: "Não é crime o aborto para salvar a vida da gestante ou em gravidez resultante de estupro (art. 128), nem o de feto anencéfalo (STF, ADPF 54).",
      texto:
        "Provocar aborto em si mesma ou consentir que outrem lho provoque:\n" +
        "Pena - detenção, de um a três anos.",
    },
    {
      fato: "Aborto provocado por terceiro sem consentimento da gestante", artigo: "Art. 125", diploma: CP,
      ref: "Art. 125 - DL2848",
      pena: "reclusão, de 3 a 10 anos", acao: "incondicionada", jecrim: false,
      texto:
        "Provocar aborto, sem o consentimento da gestante:\n" +
        "Pena - reclusão, de três a dez anos.",
    },
    {
      fato: "Aborto provocado por terceiro com consentimento da gestante", artigo: "Art. 126", diploma: CP,
      ref: "Art. 126 - DL2848",
      pena: "reclusão, de 1 a 4 anos", acao: "incondicionada", jecrim: false,
      busca: "clínica clandestina",
      texto:
        "Provocar aborto com o consentimento da gestante:\n" +
        "Pena - reclusão, de um a quatro anos.",
    },
  ]),

  // ======================================================================
  grupo("Lesão corporal", [
  // ======================================================================
    {
      fato: "Lesão corporal leve", artigo: "Art. 129, caput", diploma: CP,
      ref: "Art. 129 - DL2848",
      pena: "detenção, de 3 meses a 1 ano", acao: "condicionada", jecrim: true,
      busca: "agressão machucado bateu socou soco chute hematoma",
      obs: "Representação exigida pelo art. 88 da Lei 9.099/1995. Contra agente de segurança, membro do sistema de justiça ou em escola (§ 12): aumento de 1/3 a 2/3. Por integrante de facção ou milícia: aumento de 2/3 (§ 8º-A, Lei 15.358/2026). Em contexto doméstico, ver o § 9º e o § 13.",
      orientacoes: "lesao",
      texto:
        "Ofender a integridade corporal ou a saúde de outrem:\n" +
        "Pena - detenção, de três meses a um ano.",
    },
    {
      fato: "Lesão corporal grave", artigo: "Art. 129, § 1º", diploma: CP,
      ref: "Art. 129, §1 - DL2848",
      pena: "reclusão, de 1 a 5 anos", acao: "incondicionada", jecrim: false,
      busca: "fratura internado mais de 30 dias perigo de vida",
      obs: "Incapacidade para as ocupações habituais por mais de 30 dias, perigo de vida, debilidade permanente de membro, sentido ou função, aceleração de parto.",
      orientacoes: "lesao",
      texto:
        "§ 1º Se resulta:\n" +
        "I - Incapacidade para as ocupações habituais, por mais de trinta dias;\n" +
        "II - perigo de vida;\n" +
        "III - debilidade permanente de membro, sentido ou função;\n" +
        "IV - aceleração de parto:\n" +
        "Pena - reclusão, de um a cinco anos.",
    },
    {
      fato: "Lesão corporal gravíssima", artigo: "Art. 129, § 2º", diploma: CP,
      ref: "Art. 129, §2 - DL2848",
      pena: "reclusão, de 2 a 8 anos", acao: "incondicionada", jecrim: false,
      busca: "deformidade cicatriz perdeu o olho mutilação",
      obs: "Incapacidade permanente, enfermidade incurável, perda ou inutilização de membro/sentido/função, deformidade permanente, aborto. Hediondo quando contra agente de segurança, do sistema prisional ou do sistema de justiça, ou nas dependências de instituição de ensino (art. 1º, I-A, da Lei 8.072/1990).",
      orientacoes: "lesao",
      texto:
        "§ 2º Se resulta:\n" +
        "I - Incapacidade permanente para o trabalho;\n" +
        "II - enfermidade incuravel;\n" +
        "III perda ou inutilização do membro, sentido ou função;\n" +
        "IV - deformidade permanente;\n" +
        "V - aborto:\n" +
        "Pena - reclusão, de dois a oito anos.",
    },
    {
      fato: "Lesão corporal seguida de morte", artigo: "Art. 129, § 3º", diploma: CP,
      ref: "Art. 129, §3 - DL2848",
      pena: "reclusão, de 4 a 12 anos", acao: "incondicionada", jecrim: false,
      obs: "Hediondo nas mesmas hipóteses da lesão gravíssima (art. 1º, I-A, da Lei 8.072/1990). No contexto do domínio social estruturado, por facção ou milícia (§ 3º-A, Lei 15.358/2026): reclusão, de 20 a 40 anos.",
      texto:
        "§ 3º Se resulta morte e as circunstâncias evidenciam que o agente não " +
        "quís o resultado, nem assumiu o risco de produzí-lo:\n" +
        "Pena - reclusão, de quatro a doze anos.",
    },
    {
      fato: "Lesão corporal culposa", artigo: "Art. 129, § 6º", diploma: CP,
      ref: "Art. 129, §6 - DL2848",
      pena: "detenção, de 2 meses a 1 ano", acao: "condicionada", jecrim: true,
      obs: "Na direção de veículo, é o art. 303 do CTB.",
      orientacoes: "lesao",
      texto:
        "§ 6º Se a lesão é culposa:\n" +
        "Pena - detenção, de dois meses a um ano.",
    },
    {
      fato: "Lesão corporal — violência doméstica", artigo: "Art. 129, § 9º", diploma: CP,
      ref: "Art. 129, §9 - DL2848",
      pena: "reclusão, de 2 a 5 anos", acao: "incondicionada", jecrim: false,
      marcas: ["domestica"],
      busca: "maria da penha companheiro marido esposa irmão pai filho empregada doméstica",
      obs: "A Lei 15.455/2026 incluiu quem tem relação de trabalho doméstico. Vítima mulher: incondicionada (Súmula 542 do STJ). Vítima homem: prevalece que depende de representação (art. 88 da Lei 9.099/1995). Pena da Lei 14.994/2024 (antes: detenção, de 3 meses a 3 anos).",
      orientacoes: "violencia_domestica",
      texto:
        "§ 9º Se a lesão for praticada contra ascendente, descendente, irmão, " +
        "cônjuge ou companheiro, pessoa com relação de trabalho doméstico ou com " +
        "quem conviva ou tenha convivido, ou, ainda, prevalecendo-se o agente das " +
        "relações domésticas, de trabalho doméstico, de coabitação ou de " +
        "hospitalidade:\n" +
        "Pena – reclusão, de 2 (dois) a 5 (cinco) anos.",
    },
    {
      fato: "Lesão corporal contra a mulher por razões da condição do sexo feminino", artigo: "Art. 129, § 13", diploma: CP,
      ref: "Art. 129, §13 - DL2848",
      pena: "reclusão, de 2 a 5 anos", acao: "incondicionada", jecrim: false,
      marcas: ["domestica"],
      busca: "agrediu a mulher menosprezo discriminação gênero",
      obs: "Violência doméstica e familiar, ou menosprezo ou discriminação à condição de mulher (art. 121-A, § 1º). Pena da Lei 14.994/2024. " + VD_SEM_JECRIM,
      orientacoes: "violencia_domestica",
      texto:
        "§ 13. Se a lesão é praticada contra a mulher, por razões da condição do " +
        "sexo feminino, nos termos do § 1º do art. 121-A deste Código:\n" +
        "Pena – reclusão, de 2 (dois) a 5 (cinco) anos.",
    },
  ]),

  // ======================================================================
  grupo("Perigo à vida e à saúde", [
  // ======================================================================
    {
      fato: "Perigo para a vida ou saúde de outrem", artigo: "Art. 132", diploma: CP,
      ref: "Art. 132 - DL2848",
      pena: "detenção, de 3 meses a 1 ano", acao: "incondicionada", jecrim: true,
      busca: "expôs a perigo",
      obs: "Só se o fato não constitui crime mais grave.",
      texto:
        "Expor a vida ou a saúde de outrem a perigo direto e iminente:\n" +
        "Pena - detenção, de três meses a um ano, se o fato não constitui crime " +
        "mais grave.",
    },
    {
      fato: "Abandono de incapaz", artigo: "Art. 133", diploma: CP,
      ref: "Art. 133 - DL2848",
      pena: "reclusão, de 2 a 5 anos", acao: "incondicionada", jecrim: false,
      busca: "idoso criança deficiente abandonado sozinho trancado em casa",
      obs: "Lesão grave (§ 1º): 3 a 7 anos. Morte (§ 2º): 8 a 14 anos. Aumento de 1/3 em lugar ermo, se o autor é parente, tutor ou curador, ou se a vítima tem mais de 60 anos (§ 3º). Penas da Lei 15.163/2025.",
      texto:
        "Abandonar pessoa que está sob seu cuidado, guarda, vigilância ou " +
        "autoridade, e, por qualquer motivo, incapaz de defender-se dos riscos " +
        "resultantes do abandono:\n" +
        "Pena - reclusão, de 2 (dois) a 5 (cinco) anos.",
    },
    {
      fato: "Omissão de socorro", artigo: "Art. 135", diploma: CP,
      ref: "Art. 135 - DL2848",
      pena: "detenção, de 1 a 6 meses, ou multa", acao: "incondicionada", jecrim: true,
      busca: "não ajudou não chamou socorro",
      obs: "Aumentada de metade se resulta lesão grave; triplicada se resulta morte. No trânsito, é o art. 304 do CTB.",
      texto:
        "Deixar de prestar assistência, quando possível fazê-lo sem risco " +
        "pessoal, à criança abandonada ou extraviada, ou à pessoa inválida ou " +
        "ferida, ao desamparo ou em grave e iminente perigo; ou não pedir, nesses " +
        "casos, o socorro da autoridade pública:\n" +
        "Pena - detenção, de um a seis meses, ou multa.",
    },
    {
      fato: "Maus-tratos", artigo: "Art. 136", diploma: CP,
      ref: "Art. 136 - DL2848",
      pena: "reclusão, de 2 a 5 anos", acao: "incondicionada", jecrim: false,
      busca: "castigo imoderado privar alimento cuidados criança idoso",
      obs: "Lesão grave (§ 1º): 3 a 7 anos. Morte (§ 2º): 8 a 14 anos. Aumento de 1/3 se a vítima é menor de 14 (§ 3º). Castigo com intenso sofrimento é tortura (Lei 9.455/1997). Penas da Lei 15.163/2025 (antes: detenção, de 2 meses a 1 ano).",
      texto:
        "Expor a perigo a vida ou a saúde de pessoa sob sua autoridade, guarda ou " +
        "vigilância, para fim de educação, ensino, tratamento ou custódia, quer " +
        "privando-a de alimentação ou cuidados indispensáveis, quer sujeitando-a " +
        "a trabalho excessivo ou inadequado, quer abusando de meios de correção " +
        "ou disciplina:\n" +
        "Pena - reclusão, de 2 (dois) a 5 (cinco) anos.",
    },
    {
      fato: "Rixa", artigo: "Art. 137", diploma: CP,
      ref: "Art. 137 - DL2848",
      pena: "detenção, de 15 dias a 2 meses, ou multa", acao: "incondicionada", jecrim: true,
      busca: "briga generalizada confusão pancadaria",
      obs: "Se resulta lesão grave ou morte (parágrafo único): detenção, de 6 meses a 2 anos.",
      texto:
        "Participar de rixa, salvo para separar os contendores:\n" +
        "Pena - detenção, de quinze dias a dois meses, ou multa.",
    },
  ]),

  // ======================================================================
  grupo("Honra", [
  // ======================================================================
    {
      fato: "Calúnia", artigo: "Art. 138", diploma: CP,
      ref: "Art. 138 - DL2848",
      pena: "detenção, de 6 meses a 2 anos, e multa", acao: "privada", jecrim: true,
      busca: "acusou de crime mentira caluniou disse que roubou",
      obs: "Imputar falsamente FATO definido como crime. Em rede social, pena em triplo (art. 141, § 2º) — aí não é JECRIM. Contra a mulher por razões da condição do sexo feminino, em dobro (§ 3º). " + HONRA_VULNERAVEL + " Contra servidor, em razão da função: também por representação (Súmula 714 do STF).",
      orientacoes: "honra",
      texto:
        "Caluniar alguém, imputando-lhe falsamente fato definido como crime:\n" +
        "Pena - detenção, de seis meses a dois anos, e multa.",
    },
    {
      fato: "Difamação", artigo: "Art. 139", diploma: CP,
      ref: "Art. 139 - DL2848",
      pena: "detenção, de 3 meses a 1 ano, e multa", acao: "privada", jecrim: true,
      busca: "fofoca reputação falou mal espalhou",
      obs: "Imputar fato ofensivo à reputação, ainda que verdadeiro. Rede social: pena em triplo; contra a mulher por razões de gênero: em dobro (art. 141, §§ 2º e 3º). " + HONRA_VULNERAVEL,
      orientacoes: "honra",
      texto:
        "Difamar alguém, imputando-lhe fato ofensivo à sua reputação:\n" +
        "Pena - detenção, de três meses a um ano, e multa.",
    },
    {
      fato: "Injúria", artigo: "Art. 140", diploma: CP,
      ref: "Art. 140 - DL2848",
      pena: "detenção, de 1 a 6 meses, ou multa", acao: "privada", jecrim: true,
      busca: "xingou ofendeu palavrão insultou",
      obs: "Ofender a dignidade ou o decoro, sem imputar fato. Rede social: pena em triplo; contra a mulher por razões de gênero: em dobro (art. 141, §§ 2º e 3º). " + HONRA_VULNERAVEL + " Ofensa por raça, cor ou etnia é injúria racial (Lei 7.716/1989).",
      orientacoes: "honra",
      texto:
        "Injuriar alguém, ofendendo-lhe a dignidade ou o decoro:\n" +
        "Pena - detenção, de um a seis meses, ou multa.",
    },
    {
      fato: "Injúria real", artigo: "Art. 140, § 2º", diploma: CP,
      ref: "Art. 140, §2 - DL2848",
      pena: "detenção, de 3 meses a 1 ano, e multa, além da pena da violência", acao: "privada", jecrim: true,
      busca: "tapa na cara cuspiu humilhar",
      obs: "Violência ou vias de fato aviltantes. Se da violência resulta lesão corporal, a ação é pública (art. 145).",
      orientacoes: "honra",
      texto:
        "§ 2º - Se a injúria consiste em violência ou vias de fato, que, por sua " +
        "natureza ou pelo meio empregado, se considerem aviltantes:\n" +
        "Pena - detenção, de três meses a um ano, e multa, além da pena " +
        "correspondente à violência.",
    },
    {
      fato: "Injúria por religião, idade ou deficiência", artigo: "Art. 140, § 3º", diploma: CP,
      ref: "Art. 140, §3 - DL2848",
      pena: "reclusão, de 1 a 3 anos, e multa", acao: "condicionada", jecrim: false,
      busca: "idoso velho deficiente religião crença",
      obs: "Representação pelo art. 145, parágrafo único. Raça, cor, etnia e procedência nacional saíram daqui para a Lei 7.716/1989 (Lei 14.532/2023).",
      orientacoes: "honra",
      texto:
        "§ 3º Se a injúria consiste na utilização de elementos referentes a " +
        "religião ou à condição de pessoa idosa ou com deficiência:\n" +
        "Pena - reclusão, de 1 (um) a 3 (três) anos, e multa.",
    },
  ]),

  // ======================================================================
  grupo("Liberdade individual", [
  // ======================================================================
    {
      fato: "Constrangimento ilegal", artigo: "Art. 146", diploma: CP,
      ref: "Art. 146 - DL2848",
      pena: "detenção, de 3 meses a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
      busca: "obrigou forçou a fazer impediu",
      obs: "Penas cumulativas e em dobro com mais de 3 pessoas ou com arma (§ 1º).",
      texto:
        "Constranger alguém, mediante violência ou grave ameaça, ou depois de lhe " +
        "haver reduzido, por qualquer outro meio, a capacidade de resistência, a " +
        "não fazer o que a lei permite, ou a fazer o que ela não manda:\n" +
        "Pena - detenção, de três meses a um ano, ou multa.",
    },
    {
      fato: "Intimidação sistemática (bullying)", artigo: "Art. 146-A", diploma: CP,
      ref: "Art. 146-A - DL2848",
      pena: "multa, se a conduta não constituir crime mais grave", acao: "incondicionada", jecrim: true,
      prescricao: "2 anos",
      busca: "bullying escola colegas humilhação repetida",
      obs: "Prescrição da pena só de multa: art. 114, I. Lei 14.811/2024.",
      texto:
        "Intimidar sistematicamente, individualmente ou em grupo, mediante " +
        "violência física ou psicológica, uma ou mais pessoas, de modo " +
        "intencional e repetitivo, sem motivação evidente, por meio de atos de " +
        "intimidação, de humilhação ou de discriminação ou de ações verbais, " +
        "morais, sexuais, sociais, psicológicas, físicas, materiais ou virtuais:\n" +
        "Pena - multa, se a conduta não constituir crime mais grave.",
    },
    {
      fato: "Intimidação sistemática virtual (cyberbullying)", artigo: "Art. 146-A, parágrafo único", diploma: CP,
      ref: "Art. 146-A, p.u. - DL2848",
      pena: "reclusão, de 2 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "cyberbullying internet rede social jogo online grupo whatsapp",
      obs: "Lei 14.811/2024.",
      texto:
        "Parágrafo único. Se a conduta é realizada por meio da rede de " +
        "computadores, de rede social, de aplicativos, de jogos on-line ou por " +
        "qualquer outro meio ou ambiente digital, ou transmitida em tempo real:\n" +
        "Pena - reclusão, de 2 (dois) anos a 4 (quatro) anos, e multa, se a " +
        "conduta não constituir crime mais grave.",
    },
    {
      fato: "Ameaça", artigo: "Art. 147", diploma: CP,
      ref: "Art. 147 - DL2848",
      pena: "detenção, de 1 a 6 meses, ou multa", acao: "condicionada", jecrim: true,
      busca: "ameaçou matar bater mensagem intimidou",
      obs: "Contra a mulher por razões da condição do sexo feminino, é o § 1º: pena em dobro e ação incondicionada. " + VD_SEM_JECRIM,
      orientacoes: "ameaca",
      texto:
        "Ameaçar alguém, por palavra, escrito ou gesto, ou qualquer outro meio " +
        "simbólico, de causar-lhe mal injusto e grave:\n" +
        "Pena - detenção, de um a seis meses, ou multa.\n" +
        "§ 1º Se o crime é cometido contra a mulher por razões da condição do " +
        "sexo feminino, nos termos do § 1º do art. 121-A deste Código, aplica-se " +
        "a pena em dobro.\n" +
        "§ 2º Somente se procede mediante representação, exceto na hipótese " +
        "prevista no § 1º deste artigo.",
    },
    {
      fato: "Ameaça contra a mulher por razões da condição do sexo feminino", artigo: "Art. 147, § 1º", diploma: CP,
      ref: "Art. 147, §1 - DL2848",
      pena: "detenção, de 2 meses a 1 ano, ou multa", acao: "incondicionada", jecrim: false,
      marcas: ["domestica"],
      busca: "ameaçou a esposa companheira ex maria da penha",
      obs: "Lei 14.994/2024: pena do caput em dobro, sem representação (§ 2º). " + VD_SEM_JECRIM,
      orientacoes: "violencia_domestica",
      texto:
        "§ 1º Se o crime é cometido contra a mulher por razões da condição do " +
        "sexo feminino, nos termos do § 1º do art. 121-A deste Código, aplica-se " +
        "a pena em dobro.",
    },
    {
      fato: "Perseguição (stalking)", artigo: "Art. 147-A", diploma: CP,
      ref: "Art. 147-A - DL2848",
      pena: "reclusão, de 6 meses a 2 anos, e multa", acao: "condicionada", jecrim: true,
      busca: "stalking perseguindo vigiando importunando reiteradamente ligações insistentes perturbação da tranquilidade",
      obs: "Aumento de metade contra criança, adolescente ou idoso, contra a mulher por razões de gênero, ou com 2+ autores ou arma (§ 1º). Representação (§ 3º). Revogou o art. 65 da LCP (perturbação da tranquilidade). " + VD_SEM_JECRIM,
      orientacoes: "ameaca",
      texto:
        "Perseguir alguém, reiteradamente e por qualquer meio, ameaçando-lhe a " +
        "integridade física ou psicológica, restringindo-lhe a capacidade de " +
        "locomoção ou, de qualquer forma, invadindo ou perturbando sua esfera de " +
        "liberdade ou privacidade.\n" +
        "Pena – reclusão, de 6 (seis) meses a 2 (dois) anos, e multa.",
    },
    {
      fato: "Violência psicológica contra a mulher", artigo: "Art. 147-B", diploma: CP,
      ref: "Art. 147-B - DL2848",
      pena: "reclusão, de 6 meses a 2 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["domestica"],
      busca: "humilhação chantagem manipulação isolamento controle ciúme dano emocional maria da penha deepfake",
      obs: "Aumentada de metade com inteligência artificial ou outro recurso que altere imagem ou som da vítima (parágrafo único, Lei 15.123/2025). Só se não constituir crime mais grave. Lei 14.188/2021.",
      orientacoes: "violencia_domestica",
      texto:
        "Causar dano emocional à mulher que a prejudique e perturbe seu pleno " +
        "desenvolvimento ou que vise a degradar ou a controlar suas ações, " +
        "comportamentos, crenças e decisões, mediante ameaça, constrangimento, " +
        "humilhação, manipulação, isolamento, chantagem, ridicularização, " +
        "limitação do direito de ir e vir ou qualquer outro meio que cause " +
        "prejuízo à sua saúde psicológica e autodeterminação:\n" +
        "Pena - reclusão, de 6 (seis) meses a 2 (dois) anos, e multa, se a " +
        "conduta não constitui crime mais grave.",
    },
    {
      fato: "Ameaça no contexto de facção, milícia ou grupo paramilitar", artigo: "Art. 147-C", diploma: CP,
      ref: "Art. 147-C - DL2848",
      pena: "reclusão, de 1 a 3 anos", acao: "incondicionada", jecrim: false,
      busca: "facção tráfico domínio território toque de recolher",
      obs: "Ameaça ligada às condutas de domínio social estruturado (art. 2º da Lei 15.358/2026, a Lei Antifacção).",
      orientacoes: "ameaca",
      texto:
        "Ameaçar alguém, por palavra, escrito ou gesto, ou qualquer outro meio " +
        "simbólico, de causar-lhe mal injusto e grave, no contexto da atuação ou " +
        "para a consecução das condutas previstas no art. 2º da lei que institui " +
        "o marco legal do combate ao crime organizado no Brasil:\n" +
        "Pena - reclusão, de 1 (um) a 3 (três) anos.",
    },
    {
      fato: "Sequestro e cárcere privado", artigo: "Art. 148", diploma: CP,
      ref: "Art. 148 - DL2848",
      pena: "reclusão, de 1 a 3 anos", acao: "incondicionada", jecrim: false,
      busca: "prendeu trancou não deixou sair manteve preso",
      texto:
        "Privar alguém de sua liberdade, mediante seqüestro ou cárcere privado:\n" +
        "Pena - reclusão, de um a três anos.",
    },
    {
      fato: "Sequestro e cárcere privado qualificado", artigo: "Art. 148, § 1º", diploma: CP,
      ref: "Art. 148, §1 - DL2848",
      pena: "reclusão, de 2 a 5 anos", acao: "incondicionada", jecrim: false,
      busca: "companheira trancada idoso criança mais de 15 dias fins libidinosos",
      obs: "Vítima ascendente, descendente, cônjuge, companheiro ou maior de 60; internação fraudulenta; mais de 15 dias; vítima menor de 18 (inciso IV, hediondo); fins libidinosos. Grave sofrimento (§ 2º): 2 a 8 anos. Por integrante de facção (§ 3º, Lei 15.358/2026): 12 a 20 anos.",
      texto:
        "§ 1º - A pena é de reclusão, de dois a cinco anos:\n" +
        "I – se a vítima é ascendente, descendente, cônjuge ou companheiro do " +
        "agente ou maior de 60 (sessenta) anos;\n" +
        "II - se o crime é praticado mediante internação da vítima em casa de " +
        "saúde ou hospital;\n" +
        "III - se a privação da liberdade dura mais de quinze dias.\n" +
        "IV – se o crime é praticado contra menor de 18 (dezoito) anos;\n" +
        "V – se o crime é praticado com fins libidinosos.",
    },
    {
      fato: "Redução a condição análoga à de escravo", artigo: "Art. 149", diploma: CP,
      ref: "Art. 149 - DL2848",
      pena: "reclusão, de 2 a 8 anos, e multa, além da pena da violência", acao: "incondicionada", jecrim: false,
      busca: "trabalho escravo jornada exaustiva servidão por dívida",
      texto:
        "Reduzir alguém a condição análoga à de escravo, quer submetendo-o a " +
        "trabalhos forçados ou a jornada exaustiva, quer sujeitando-o a condições " +
        "degradantes de trabalho, quer restringindo, por qualquer meio, sua " +
        "locomoção em razão de dívida contraída com o empregador ou preposto:\n" +
        "Pena - reclusão, de dois a oito anos, e multa, além da pena " +
        "correspondente à violência.",
    },
    {
      fato: "Tráfico de pessoas", artigo: "Art. 149-A", diploma: CP,
      ref: "Art. 149-A - DL2848",
      pena: "reclusão, de 4 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "aliciar transportar pessoa exploração sexual remoção de órgãos",
      obs: "Hediondo quando a vítima é criança ou adolescente (Lei 14.811/2024).",
      texto:
        "Agenciar, aliciar, recrutar, transportar, transferir, comprar, alojar ou " +
        "acolher pessoa, mediante grave ameaça, violência, coação, fraude ou " +
        "abuso, com a finalidade de:\n" +
        "I - remover-lhe órgãos, tecidos ou partes do corpo;\n" +
        "II - submetê-la a trabalho em condições análogas à de escravo;\n" +
        "III - submetê-la a qualquer tipo de servidão;\n" +
        "IV - adoção ilegal; ou\n" +
        "V - exploração sexual.\n" +
        "Pena - reclusão, de 4 (quatro) a 8 (oito) anos, e multa.",
    },
    {
      fato: "Violação de domicílio", artigo: "Art. 150", diploma: CP,
      ref: "Art. 150 - DL2848",
      pena: "detenção, de 1 a 3 meses, ou multa", acao: "incondicionada", jecrim: true,
      busca: "invadiu casa entrou terreno pátio",
      texto:
        "Entrar ou permanecer, clandestina ou astuciosamente, ou contra a vontade " +
        "expressa ou tácita de quem de direito, em casa alheia ou em suas " +
        "dependências:\n" +
        "Pena - detenção, de um a três meses, ou multa.",
    },
    {
      fato: "Violação de domicílio qualificada", artigo: "Art. 150, § 1º", diploma: CP,
      ref: "Art. 150, §1 - DL2848",
      pena: "detenção, de 6 meses a 2 anos, além da pena da violência", acao: "incondicionada", jecrim: true,
      busca: "invadiu à noite com arma arrombou a porta",
      obs: "À noite, em lugar ermo, com violência ou arma, ou por duas ou mais pessoas.",
      texto:
        "§ 1º - Se o crime é cometido durante a noite, ou em lugar ermo, ou com o " +
        "emprego de violência ou de arma, ou por duas ou mais pessoas:\n" +
        "Pena - detenção, de seis meses a dois anos, além da pena correspondente " +
        "à violência.",
    },
    {
      fato: "Violação de correspondência", artigo: "Art. 151", diploma: CP,
      ref: "Art. 151 - DL2848",
      pena: "detenção, de 1 a 6 meses, ou multa", acao: "condicionada", jecrim: true,
      busca: "abriu carta correspondência",
      texto:
        "Devassar indevidamente o conteúdo de correspondência fechada, dirigida a " +
        "outrem:\n" +
        "Pena - detenção, de um a seis meses, ou multa.",
    },
    {
      fato: "Invasão de dispositivo informático", artigo: "Art. 154-A", diploma: CP,
      ref: "Art. 154-A - DL2848",
      pena: "reclusão, de 1 a 4 anos, e multa", acao: "condicionada", jecrim: false,
      busca: "hackearam celular invadiram conta e-mail whatsapp clonado computador instagram",
      obs: "Obtendo conteúdo de comunicação privada ou segredo (§ 3º): reclusão, de 2 a 5 anos. Incondicionada quando a vítima é a administração pública (art. 154-B).",
      orientacoes: "estelionato",
      texto:
        "Invadir dispositivo informático de uso alheio, conectado ou não à rede " +
        "de computadores, com o fim de obter, adulterar ou destruir dados ou " +
        "informações sem autorização expressa ou tácita do usuário do dispositivo " +
        "ou de instalar vulnerabilidades para obter vantagem ilícita:\n" +
        "Pena – reclusão, de 1 (um) a 4 (quatro) anos, e multa.",
    },
  ]),

  // ======================================================================
  grupo("Patrimônio — furto", [
  // ======================================================================
    {
      fato: "Furto", artigo: "Art. 155", diploma: CP,
      ref: "Art. 155 - DL2848",
      pena: "reclusão, de 1 a 6 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "subtração levaram sumiu roubaram sem violência batedor",
      obs: "Repouso noturno (§ 1º): aumento de metade. Coisa de pequeno valor e réu primário (§ 2º): privilégio. Contra cônjuge, ascendente ou descendente: isento de pena; contra irmão ou cônjuge separado: só com representação (arts. 181 a 183). Pena da Lei 15.397/2026 (antes: 1 a 4 anos).",
      orientacoes: "furto_roubo",
      texto:
        "Subtrair, para si ou para outrem, coisa alheia móvel:\n" +
        "Pena – reclusão, de 1 (um) a 6 (seis) anos, e multa.",
    },
    {
      fato: "Furto de energia elétrica ou de água", artigo: "Art. 155, § 3º", diploma: CP,
      ref: "Art. 155, §3 - DL2848",
      pena: "reclusão, de 1 a 6 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "gato luz energia ligação clandestina sinal de tv",
      obs: "Equipara à coisa móvel a energia elétrica ou qualquer outra com valor econômico.",
      orientacoes: "furto_roubo",
      texto:
        "§ 3º - Equipara-se à coisa móvel a energia elétrica ou qualquer outra " +
        "que tenha valor econômico.",
    },
    {
      fato: "Furto qualificado — destruição ou rompimento de obstáculo", artigo: "Art. 155, § 4º, I", diploma: CP,
      ref: "Art. 155, §4, I - DL2848",
      pena: "reclusão, de 2 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "arrombamento arrombou quebrou vidro janela cadeado porta",
      orientacoes: "furto_roubo",
      texto:
        "§ 4º A pena é de reclusão, de 2 (dois) a 8 (oito) anos, e multa, se o " +
        "crime é cometido:\n" +
        "I - com destruição ou rompimento de obstáculo à subtração da coisa;",
    },
    {
      fato: "Furto qualificado — abuso de confiança, fraude, escalada ou destreza", artigo: "Art. 155, § 4º, II", diploma: CP,
      ref: "Art. 155, §4, II - DL2848",
      pena: "reclusão, de 2 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "pulou o muro empregada funcionário de confiança punguista batedor de carteira distraiu",
      orientacoes: "furto_roubo",
      texto:
        "§ 4º A pena é de reclusão, de 2 (dois) a 8 (oito) anos, e multa, se o " +
        "crime é cometido:\n" +
        "II - com abuso de confiança, ou mediante fraude, escalada ou destreza;",
    },
    {
      fato: "Furto qualificado — chave falsa", artigo: "Art. 155, § 4º, III", diploma: CP,
      ref: "Art. 155, §4, III - DL2848",
      pena: "reclusão, de 2 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "mixa micha cópia de chave grampo",
      orientacoes: "furto_roubo",
      texto:
        "§ 4º A pena é de reclusão, de 2 (dois) a 8 (oito) anos, e multa, se o " +
        "crime é cometido:\n" +
        "III - com emprego de chave falsa;",
    },
    {
      fato: "Furto qualificado — concurso de duas ou mais pessoas", artigo: "Art. 155, § 4º, IV", diploma: CP,
      ref: "Art. 155, §4, IV - DL2848",
      pena: "reclusão, de 2 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "dois autores comparsa dupla bando",
      orientacoes: "furto_roubo",
      texto:
        "§ 4º A pena é de reclusão, de 2 (dois) a 8 (oito) anos, e multa, se o " +
        "crime é cometido:\n" +
        "IV - mediante concurso de duas ou mais pessoas.",
    },
    {
      fato: "Furto qualificado — bens de órgão público ou serviço essencial", artigo: "Art. 155, § 4º, V", diploma: CP,
      ref: "Art. 155, §4, V - DL2848",
      pena: "reclusão, de 2 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "prefeitura escola posto de saúde hospital",
      obs: "Lei 15.181/2025; o Distrito Federal entrou com a Lei 15.397/2026.",
      orientacoes: "furto_roubo",
      texto:
        "§ 4º A pena é de reclusão, de 2 (dois) a 8 (oito) anos, e multa, se o " +
        "crime é cometido:\n" +
        "V – contra quaisquer bens que comprometam o funcionamento de órgãos da " +
        "União, de Estado, do Distrito Federal ou de Município ou de " +
        "estabelecimentos públicos ou privados que prestem serviços essenciais.",
    },
    {
      fato: "Furto com emprego de explosivo", artigo: "Art. 155, § 4º-A", diploma: CP,
      ref: "Art. 155, §4-A - DL2848",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "explodiram caixa eletrônico banco dinamite",
      texto:
        "§ 4º-A A pena é de reclusão de 4 (quatro) a 10 (dez) anos e multa, se " +
        "houver emprego de explosivo ou de artefato análogo que cause perigo " +
        "comum.",
    },
    {
      fato: "Furto mediante fraude eletrônica", artigo: "Art. 155, § 4º-B", diploma: CP,
      ref: "Art. 155, §4-B - DL2848",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "pix transferência internet banking conta invadida celular furtado aplicativo",
      obs: "Aqui a vítima NÃO é induzida a erro — o autor age direto no dispositivo ou na conta. Aumentos do § 4º-C: servidor fora do país (1/3 a 2/3); idoso ou vulnerável (1/3 ao dobro). Pena da Lei 15.397/2026.",
      orientacoes: "estelionato",
      texto:
        "§ 4º-B. A pena é de reclusão, de 4 (quatro) a 10 (dez) anos, e multa, se " +
        "o furto mediante fraude é cometido por meio de dispositivo eletrônico ou " +
        "informático, conectado ou não à rede de computadores, com ou sem a " +
        "violação de mecanismo de segurança ou a utilização de programa " +
        "malicioso, ou por qualquer outro meio fraudulento análogo.",
    },
    {
      fato: "Furto de veículo levado a outro Estado ou ao exterior", artigo: "Art. 155, § 5º", diploma: CP,
      ref: "Art. 155, §5 - DL2848",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "carro moto caminhão levado para outro estado Paraguai Uruguai fronteira",
      obs: "Pena da Lei 15.397/2026 (antes: 3 a 8 anos).",
      orientacoes: "furto_roubo",
      texto:
        "§ 5º A pena é de reclusão, de 4 (quatro) a 10 (dez) anos, e multa, se a " +
        "subtração for de veículo automotor que venha a ser transportado para " +
        "outro Estado ou para o exterior.",
    },
    {
      fato: "Furto de animal de produção ou doméstico", artigo: "Art. 155, § 6º, I", diploma: CP,
      ref: "Art. 155, §6, I - DL2848",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "abigeato gado boi vaca cavalo cachorro gato pet",
      obs: "Lei 15.397/2026 incluiu o animal doméstico e elevou a pena (antes: 2 a 5 anos, só semovente de produção).",
      orientacoes: "furto_roubo",
      texto:
        "§ 6º A pena é de reclusão, de 4 (quatro) a 10 (dez) anos, e multa, se a " +
        "subtração for:\n" +
        "I – de semovente domesticável de produção, ainda que abatido ou dividido " +
        "em partes no local da subtração, ou de animal doméstico;",
    },
    {
      fato: "Furto de celular, computador ou dispositivo eletrônico", artigo: "Art. 155, § 6º, II", diploma: CP,
      ref: "Art. 155, §6, II - DL2848",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "celular telefone notebook tablet levaram o celular",
      obs: "Antes da Lei 15.397/2026, era furto simples.",
      orientacoes: "furto_roubo",
      texto:
        "§ 6º A pena é de reclusão, de 4 (quatro) a 10 (dez) anos, e multa, se a " +
        "subtração for:\n" +
        "II – de aparelho de telefonia celular, de computador, inclusive portátil " +
        "ou do tipo prancheta, ou de qualquer dispositivo eletrônico ou " +
        "informático semelhante.",
    },
    {
      fato: "Furto de explosivo ou de arma de fogo", artigo: "Art. 155, § 7º", diploma: CP,
      ref: "Art. 155, §7 - DL2848",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "levaram a arma revólver pistola dinamite",
      obs: "Inciso I: substâncias explosivas ou acessórios. Inciso II (Lei 15.397/2026): arma de fogo.",
      texto:
        "§ 7º A pena é de reclusão, de 4 (quatro) a 10 (dez) anos, e multa, se a " +
        "subtração for:\n" +
        "I – de substâncias explosivas ou de acessórios que, conjunta ou " +
        "isoladamente, possibilitem sua fabricação, montagem ou emprego;\n" +
        "II – de arma de fogo.",
    },
    {
      fato: "Furto de fios, cabos ou equipamentos de energia, telefonia ou dados", artigo: "Art. 155, § 8º", diploma: CP,
      ref: "Art. 155, §8 - DL2848",
      pena: "reclusão, de 2 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "cobre fiação cabo de internet transformador trilho ferrovia",
      obs: "Inclui equipamento ferroviário e metroviário. Cabe o privilégio do § 2º. Lei 15.181/2025.",
      texto:
        "§ 8º A pena é de reclusão, de 2 (dois) a 8 (oito) anos, e multa, se a " +
        "subtração for de fios, cabos ou equipamentos utilizados para " +
        "fornecimento ou transmissão de energia elétrica ou de telefonia ou para " +
        "transferência de dados, bem como equipamentos ou materiais ferroviários " +
        "ou metroviários, aplicável, em qualquer caso, o disposto no § 2º deste " +
        "artigo.",
    },
    {
      fato: "Furto por integrante de facção, milícia ou grupo paramilitar", artigo: "Art. 155, § 9º", diploma: CP,
      ref: "Art. 155, §9 - DL2848",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "facção organização criminosa ultraviolenta",
      obs: "Lei 15.358/2026 (Antifacção).",
      texto:
        "§ 9º A pena é de reclusão de 4 (quatro) a 10 (dez) anos e multa, se a " +
        "subtração, para si ou para outrem, de coisa alheia móvel é cometida por " +
        "integrante de organização criminosa ultraviolenta, grupo paramilitar ou " +
        "milícia privada, no contexto da atuação ou para a consecução das " +
        "condutas previstas no art. 2º da lei que institui o marco legal do " +
        "combate ao crime organizado no Brasil.",
    },
    {
      fato: "Furto de combustível", artigo: "Art. 155, § 10", diploma: CP,
      ref: "Art. 155, §10 - DL2848",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "gasolina diesel óleo duto posto derivação clandestina gás",
      obs: "Derivados de petróleo, gás natural, biocombustíveis e lubrificantes, subtraídos de produção, armazenamento ou transporte (dutos inclusive). Aumento de 1/3 com rompimento de obstáculo, concurso de pessoas, abuso de confiança ou por servidor (§ 11); de 2/3 se resulta paralisação, desabastecimento, incêndio, poluição, lesão grave ou morte (§ 12). Lei 15.517/2026.",
      texto:
        "§ 10. A pena é de reclusão, de 4 (quatro) a 10 (dez) anos, e multa, se a " +
        "subtração for de petróleo e derivados, gás natural e suas frações " +
        "recuperáveis, álcool etílico hidratado carburante e demais combustíveis " +
        "fluidos carburantes, inclusive biocombustíveis, e óleos lubrificantes, " +
        "removidos dos estabelecimentos de produção ou de quaisquer instalações " +
        "de armazenamento e de transporte de combustíveis, incluídos dutos e " +
        "unidades de transporte em qualquer modal.",
    },
    {
      fato: "Furto de coisa comum", artigo: "Art. 156", diploma: CP,
      ref: "Art. 156 - DL2848",
      pena: "detenção, de 6 meses a 2 anos, ou multa", acao: "condicionada", jecrim: true,
      busca: "sócio condômino herdeiro levou bem do casal",
      obs: "Representação (§ 1º). Não é punível a subtração de coisa fungível cujo valor não excede a quota do agente (§ 2º).",
      texto:
        "Subtrair o condômino, co-herdeiro ou sócio, para si ou para outrem, a " +
        "quem legitimamente a detém, a coisa comum:\n" +
        "Pena - detenção, de seis meses a dois anos, ou multa.",
    },
  ]),

  // ======================================================================
  grupo("Patrimônio — roubo e extorsão", [
  // ======================================================================
    {
      fato: "Roubo", artigo: "Art. 157", diploma: CP,
      ref: "Art. 157 - DL2848",
      pena: "reclusão, de 6 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "assalto assaltaram grave ameaça violência levaram anunciou o assalto",
      obs: "Roubo impróprio (§ 1º): violência depois da subtração, para garantir a coisa. Por integrante de facção ou milícia (§ 4º, Lei 15.358/2026): o triplo da pena do caput, desprezados os outros aumentos. Pena da Lei 15.397/2026 (antes: 4 a 10 anos).",
      orientacoes: "furto_roubo",
      texto:
        "Subtrair coisa móvel alheia, para si ou para outrem, mediante grave " +
        "ameaça ou violência a pessoa, ou depois de havê-la, por qualquer meio, " +
        "reduzido à impossibilidade de resistência:\n" +
        "Pena – reclusão, de 6 (seis) a 10 (dez) anos, e multa.",
    },
    {
      fato: "Roubo de bens de órgão público ou serviço essencial", artigo: "Art. 157, § 1º-A", diploma: CP,
      ref: "Art. 157, §1-A - DL2848",
      pena: "reclusão, de 6 a 12 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "prefeitura escola posto de saúde hospital serviço público essencial",
      obs: "Bens que comprometam o funcionamento de órgão público ou de serviço essencial. Lei 15.181/2025; o Distrito Federal entrou com a Lei 15.397/2026. Fios e cabos são o § 2º, VIII.",
      texto:
        "§ 1º-A. A pena é de reclusão, de 6 (seis) a 12 (doze) anos, e multa, se " +
        "a subtração for cometida contra quaisquer bens que comprometam o " +
        "funcionamento de órgãos da União, de Estado, do Distrito Federal ou de " +
        "Município ou de estabelecimentos públicos ou privados que prestem " +
        "serviços públicos essenciais.",
    },
    {
      fato: "Roubo majorado — concurso de duas ou mais pessoas", artigo: "Art. 157, § 2º, II", diploma: CP,
      ref: "Art. 157, §2, II - DL2848",
      pena: ROUBO_MAJORADO, acao: "incondicionada", jecrim: false,
      busca: "dupla assaltantes comparsa garupa",
      orientacoes: "furto_roubo",
      texto:
        "§ 2º A pena aumenta-se de 1/3 (um terço) até metade:\n" +
        "II - se há o concurso de duas ou mais pessoas;",
    },
    {
      fato: "Roubo majorado — veículo levado a outro Estado ou ao exterior", artigo: "Art. 157, § 2º, IV", diploma: CP,
      ref: "Art. 157, §2, IV - DL2848",
      pena: ROUBO_MAJORADO, acao: "incondicionada", jecrim: false,
      busca: "carro roubado levado para outro estado Paraguai Uruguai fronteira",
      orientacoes: "furto_roubo",
      texto:
        "§ 2º A pena aumenta-se de 1/3 (um terço) até metade:\n" +
        "IV - se a subtração for de veículo automotor que venha a ser " +
        "transportado para outro Estado ou para o exterior;",
    },
    {
      fato: "Roubo majorado — restrição da liberdade da vítima", artigo: "Art. 157, § 2º, V", diploma: CP,
      ref: "Art. 157, §2, V - DL2848",
      pena: ROUBO_MAJORADO, acao: "incondicionada", jecrim: false, marcas: ["hediondo"],
      busca: "manteve a vítima refém amarrou trancou no porta-malas",
      orientacoes: "furto_roubo",
      texto:
        "§ 2º A pena aumenta-se de 1/3 (um terço) até metade:\n" +
        "V - se o agente mantém a vítima em seu poder, restringindo sua " +
        "liberdade.",
    },
    {
      fato: "Roubo majorado — arma branca", artigo: "Art. 157, § 2º, VII", diploma: CP,
      ref: "Art. 157, §2, VII - DL2848",
      pena: ROUBO_MAJORADO, acao: "incondicionada", jecrim: false,
      busca: "faca canivete facão tesoura",
      orientacoes: "furto_roubo",
      texto:
        "§ 2º A pena aumenta-se de 1/3 (um terço) até metade:\n" +
        "VII - se a violência ou grave ameaça é exercida com emprego de arma " +
        "branca;",
    },
    {
      fato: "Roubo majorado — fios, cabos ou equipamentos de energia, telefonia ou dados", artigo: "Art. 157, § 2º, VIII", diploma: CP,
      ref: "Art. 157, §2, VIII - DL2848",
      pena: ROUBO_MAJORADO, acao: "incondicionada", jecrim: false,
      busca: "cobre fiação cabo de internet transformador trilho ferrovia",
      obs: "Inclui equipamento ferroviário e metroviário. Lei 15.181/2025.",
      texto:
        "§ 2º A pena aumenta-se de 1/3 (um terço) até metade:\n" +
        "VIII – se a subtração for de fios, cabos ou equipamentos utilizados para " +
        "fornecimento ou transmissão de energia elétrica ou de telefonia ou para " +
        "transferência de dados, bem como equipamentos ou materiais ferroviários " +
        "ou metroviários.",
    },
    {
      fato: "Roubo majorado — de celular, computador ou dispositivo eletrônico", artigo: "Art. 157, § 2º, IX", diploma: CP,
      ref: "Art. 157, §2, IX - DL2848",
      pena: ROUBO_MAJORADO, acao: "incondicionada", jecrim: false,
      busca: "levaram o celular assalto de celular notebook",
      obs: "Lei 15.397/2026.",
      orientacoes: "furto_roubo",
      texto:
        "§ 2º A pena aumenta-se de 1/3 (um terço) até metade:\n" +
        "IX – se a subtração for de aparelho de telefonia celular, de computador, " +
        "inclusive portátil ou do tipo prancheta, ou de qualquer dispositivo " +
        "eletrônico ou informático semelhante;",
    },
    {
      fato: "Roubo majorado — de arma de fogo", artigo: "Art. 157, § 2º, X", diploma: CP,
      ref: "Art. 157, §2, X - DL2848",
      pena: ROUBO_MAJORADO, acao: "incondicionada", jecrim: false,
      busca: "levaram a arma do vigilante policial",
      obs: "Aqui a arma é o objeto roubado; empregada na ameaça, é o § 2º-A. Lei 15.397/2026.",
      texto:
        "§ 2º A pena aumenta-se de 1/3 (um terço) até metade:\n" +
        "X – se a subtração for de arma de fogo.",
    },
    {
      fato: "Roubo majorado — de combustível", artigo: "Art. 157, § 2º, XI", diploma: CP,
      ref: "Art. 157, §2, XI - DL2848",
      pena: ROUBO_MAJORADO, acao: "incondicionada", jecrim: false,
      busca: "gasolina diesel duto posto caminhão-tanque gás carga de combustível",
      obs: "Se resulta paralisação do estabelecimento, desabastecimento, incêndio ou poluição, o aumento passa a 2/3 (§ 2º-A, III). Lei 15.517/2026.",
      texto:
        "§ 2º A pena aumenta-se de 1/3 (um terço) até metade:\n" +
        "XI – se a subtração for de petróleo e derivados, gás natural e suas " +
        "frações recuperáveis, álcool etílico hidratado carburante e demais " +
        "combustíveis fluidos carburantes, inclusive biocombustíveis, e óleos " +
        "lubrificantes, removidos dos estabelecimentos de produção ou de " +
        "quaisquer instalações de armazenamento e de transporte de combustíveis, " +
        "incluídos dutos e unidades de transporte em qualquer modal.",
    },
    {
      fato: "Roubo com emprego de arma de fogo", artigo: "Art. 157, § 2º-A, I", diploma: CP,
      ref: "Art. 157, §2-A, I - DL2848",
      pena: "reclusão, de 10 anos a 16 anos e 8 meses, e multa (caput aumentado de 2/3)",
      acao: "incondicionada", jecrim: false, marcas: ["hediondo"],
      busca: "revólver pistola assalto à mão armada",
      obs: "Destruição de obstáculo com explosivo (inciso II): mesmo aumento.",
      orientacoes: "furto_roubo",
      texto:
        "§ 2º-A A pena aumenta-se de 2/3 (dois terços):\n" +
        "I – se a violência ou ameaça é exercida com emprego de arma de fogo;",
    },
    {
      fato: "Roubo com arma de fogo de uso restrito ou proibido", artigo: "Art. 157, § 2º-B", diploma: CP,
      ref: "Art. 157, §2-B - DL2848",
      pena: "reclusão, de 12 a 20 anos, e multa (caput em dobro)", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "fuzil calibre restrito",
      texto:
        "§ 2º-B. Se a violência ou grave ameaça é exercida com emprego de arma de " +
        "fogo de uso restrito ou proibido, aplica-se em dobro a pena prevista no " +
        "caput deste artigo.",
    },
    {
      fato: "Roubo com lesão corporal grave", artigo: "Art. 157, § 3º, I", diploma: CP,
      ref: "Art. 157, §3, I - DL2848",
      pena: "reclusão, de 7 a 18 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      obs: "O aumento para 16 a 24 anos foi vetado na Lei 15.397/2026.",
      texto:
        "§ 3º Se da violência resulta:\n" +
        "I – lesão corporal grave, a pena é de reclusão de 7 (sete) a 18 " +
        "(dezoito) anos, e multa;",
    },
    {
      fato: "Latrocínio (roubo seguido de morte)", artigo: "Art. 157, § 3º, II", diploma: CP,
      ref: "Art. 157, §3, II - DL2848",
      pena: "reclusão, de 24 a 30 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "assalto com morte matou para roubar",
      obs: "Julgado pelo juiz singular, não pelo júri (Súmula 603 do STF). Por integrante de facção ou milícia (§ 5º, Lei 15.358/2026): reclusão, de 20 a 40 anos, e multa. Pena mínima da Lei 15.397/2026 (antes: 20).",
      texto:
        "§ 3º Se da violência resulta:\n" +
        "II – morte, a pena é de reclusão, de 24 (vinte e quatro) a 30 (trinta) " +
        "anos, e multa.",
    },
    {
      fato: "Extorsão", artigo: "Art. 158", diploma: CP,
      ref: "Art. 158 - DL2848",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "chantagem exigiu dinheiro para não divulgar sextorsão nudes falso sequestro",
      obs: "Aumento de 1/3 até a metade com 2+ pessoas ou com arma (§ 1º). Por integrante de facção ou milícia: o triplo (§ 4º, Lei 15.358/2026).",
      orientacoes: "ameaca",
      texto:
        "Constranger alguém, mediante violência ou grave ameaça, e com o intuito " +
        "de obter para si ou para outrem indevida vantagem econômica, a fazer, " +
        "tolerar que se faça ou deixar de fazer alguma coisa:\n" +
        "Pena - reclusão, de quatro a dez anos, e multa.",
    },
    {
      fato: "Extorsão mediante restrição da liberdade (sequestro relâmpago)", artigo: "Art. 158, § 3º", diploma: CP,
      ref: "Art. 158, §3 - DL2848",
      pena: "reclusão, de 6 a 12 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "sequestro relâmpago levaram ao caixa eletrônico saque",
      obs: "Com lesão grave ou morte, aplicam-se as penas do art. 159, §§ 2º e 3º.",
      texto:
        "§ 3º Se o crime é cometido mediante a restrição da liberdade da vítima, " +
        "e essa condição é necessária para a obtenção da vantagem econômica, a " +
        "pena é de reclusão, de 6 (seis) a 12 (doze) anos, além da multa; se " +
        "resulta lesão corporal grave ou morte, aplicam-se as penas previstas no " +
        "art. 159, §§ 2º e 3º, respectivamente.",
    },
    {
      fato: "Extorsão mediante sequestro", artigo: "Art. 159", diploma: CP,
      ref: "Art. 159 - DL2848",
      pena: "reclusão, de 8 a 15 anos", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "sequestro resgate cativeiro",
      obs: "Mais de 24 h, vítima menor de 18 ou maior de 60, ou por quadrilha (§ 1º): 12 a 20 anos. Lesão grave (§ 2º): 16 a 24. Morte (§ 3º): 24 a 30. Por integrante de facção ou milícia: aumento de 2/3 (§ 5º, Lei 15.358/2026).",
      texto:
        "Seqüestrar pessoa com o fim de obter, para si ou para outrem, qualquer " +
        "vantagem, como condição ou preço do resgate:\n" +
        "Pena - reclusão, de oito a quinze anos..",
    },
  ]),

  // ======================================================================
  grupo("Patrimônio — dano, apropriação e estelionato", [
  // ======================================================================
    {
      fato: "Esbulho possessório (invasão de terreno)", artigo: "Art. 161, § 1º, II", diploma: CP,
      ref: "Art. 161, §1, II - DL2848",
      pena: "detenção, de 1 a 6 meses, e multa", acao: "privada", jecrim: true,
      busca: "invadiu terreno ocupação invasão de imóvel área",
      obs: "Exige violência, grave ameaça ou mais de duas pessoas. Propriedade particular e sem violência: queixa (§ 3º); havendo violência, ou área pública, a ação é pública.",
      texto:
        "§ 1º - Na mesma pena incorre quem:\n" +
        "II - invade, com violência a pessoa ou grave ameaça, ou mediante " +
        "concurso de mais de duas pessoas, terreno ou edifício alheio, para o fim " +
        "de esbulho possessório.",
    },
    {
      fato: "Dano", artigo: "Art. 163", diploma: CP,
      ref: "Art. 163 - DL2848",
      pena: "detenção, de 1 a 6 meses, ou multa", acao: "privada", jecrim: true,
      busca: "quebrou destruiu estragou riscou carro pichou vidro",
      obs: "Queixa-crime, por força do art. 167. Pichação é crime ambiental, de ação pública (art. 65 da Lei 9.605/1998).",
      orientacoes: "dano",
      texto:
        "Destruir, inutilizar ou deteriorar coisa alheia:\n" +
        "Pena - detenção, de um a seis meses, ou multa.",
    },
    {
      fato: "Dano qualificado — com violência ou grave ameaça", artigo: "Art. 163, parágrafo único, I", diploma: CP,
      ref: "Art. 163, p.u., I - DL2848",
      pena: "detenção, de 6 meses a 3 anos, e multa, além da pena da violência", acao: "incondicionada", jecrim: false,
      busca: "quebrou tudo ameaçando",
      orientacoes: "dano",
      texto:
        "Parágrafo único - Se o crime é cometido:\n" +
        "I - com violência à pessoa ou grave ameaça;\n" +
        "Pena - detenção, de seis meses a três anos, e multa, além da pena " +
        "correspondente à violência.",
    },
    {
      fato: "Dano qualificado — substância inflamável ou explosiva", artigo: "Art. 163, parágrafo único, II", diploma: CP,
      ref: "Art. 163, p.u., II - DL2848",
      pena: "detenção, de 6 meses a 3 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "ateou fogo no carro gasolina bomba",
      obs: "Só se o fato não constitui crime mais grave (incêndio, art. 250).",
      orientacoes: "dano",
      texto:
        "Parágrafo único - Se o crime é cometido:\n" +
        "II - com emprego de substância inflamável ou explosiva, se o fato não " +
        "constitui crime mais grave\n" +
        "Pena - detenção, de seis meses a três anos, e multa, além da pena " +
        "correspondente à violência.",
    },
    {
      fato: "Dano qualificado — patrimônio público", artigo: "Art. 163, parágrafo único, III", diploma: CP,
      ref: "Art. 163, p.u., III - DL2848",
      pena: "detenção, de 6 meses a 3 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "viatura escola prefeitura cela orelhão concessionária",
      obs: "União, Estado, DF, Município, autarquia, fundação, empresa pública, sociedade de economia mista ou concessionária de serviço público.",
      orientacoes: "dano",
      texto:
        "Parágrafo único - Se o crime é cometido:\n" +
        "III - contra o patrimônio da União, de Estado, do Distrito Federal, de " +
        "Município ou de autarquia, fundação pública, empresa pública, sociedade " +
        "de economia mista ou empresa concessionária de serviços públicos;\n" +
        "Pena - detenção, de seis meses a três anos, e multa, além da pena " +
        "correspondente à violência.",
    },
    {
      fato: "Dano qualificado — motivo egoístico ou prejuízo considerável", artigo: "Art. 163, parágrafo único, IV", diploma: CP,
      ref: "Art. 163, p.u., IV - DL2848",
      pena: "detenção, de 6 meses a 3 anos, e multa", acao: "privada", jecrim: false,
      busca: "prejuízo grande",
      obs: "Queixa-crime (art. 167).",
      orientacoes: "dano",
      texto:
        "Parágrafo único - Se o crime é cometido:\n" +
        "IV - por motivo egoístico ou com prejuízo considerável para a vítima:\n" +
        "Pena - detenção, de seis meses a três anos, e multa, além da pena " +
        "correspondente à violência.",
    },
    {
      fato: "Apropriação indébita", artigo: "Art. 168", diploma: CP,
      ref: "Art. 168 - DL2848",
      pena: "reclusão, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "emprestou não devolveu ficou com reteve carro alugado",
      obs: "A posse do bem começou lícita — é isso que separa do furto. Aumento de 1/3 em razão de ofício, emprego ou profissão (§ 1º).",
      texto:
        "Apropriar-se de coisa alheia móvel, de que tem a posse ou a detenção:\n" +
        "Pena - reclusão, de um a quatro anos, e multa.",
    },
    {
      fato: "Apropriação de coisa achada", artigo: "Art. 169, parágrafo único, II", diploma: CP,
      ref: "Art. 169, p.u., II - DL2848",
      pena: "detenção, de 1 mês a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
      busca: "achou não devolveu perdido encontrou celular carteira",
      obs: "Prazo de 15 dias para restituir ao dono ou entregar à autoridade.",
      texto:
        "Parágrafo único - Na mesma pena incorre:\n" +
        "II - quem acha coisa alheia perdida e dela se apropria, total ou " +
        "parcialmente, deixando de restituí-la ao dono ou legítimo possuidor ou " +
        "de entregá-la à autoridade competente, dentro no prazo de quinze dias.",
    },
    {
      fato: "Estelionato", artigo: "Art. 171", diploma: CP,
      ref: "Art. 171 - DL2848",
      pena: "reclusão, de 1 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "golpe fraude enganou induziu erro falso advogado parente boleto falso",
      obs: "Incondicionada desde a Lei 15.397/2026, que revogou o § 5º. Fato anterior a 04/05/2026: depende de representação, salvo vítima administração pública, criança ou adolescente, pessoa com deficiência, maior de 70 ou incapaz. Contra idoso ou vulnerável: aumento de 1/3 ao dobro (§ 4º).",
      orientacoes: "estelionato",
      texto:
        "Obter, para si ou para outrem, vantagem ilícita, em prejuízo alheio, " +
        "induzindo ou mantendo alguém em erro, mediante artifício, ardil, ou " +
        "qualquer outro meio fraudulento:\n" +
        "Pena – reclusão, de 1 (um) a 5 (cinco) anos, e multa.",
    },
    {
      fato: "Estelionato — disposição de coisa alheia como própria", artigo: "Art. 171, § 2º, I", diploma: CP,
      ref: "Art. 171, §2, I - DL2848",
      pena: "reclusão, de 1 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "vendeu o que não era dele alugou imóvel alheio",
      orientacoes: "estelionato",
      texto:
        "§ 2º - Nas mesmas penas incorre quem:\n" +
        "I - vende, permuta, dá em pagamento, em locação ou em garantia coisa " +
        "alheia como própria;",
    },
    {
      fato: "Estelionato — fraude no pagamento por cheque", artigo: "Art. 171, § 2º, VI", diploma: CP,
      ref: "Art. 171, §2, VI - DL2848",
      pena: "reclusão, de 1 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "cheque sem fundo sustou cheque",
      obs: "Pagar antes da denúncia extingue a punibilidade (Súmula 554 do STF). Cheque pós-datado dado como garantia de dívida não configura o crime.",
      orientacoes: "estelionato",
      texto:
        "§ 2º - Nas mesmas penas incorre quem:\n" +
        "VI - emite cheque, sem suficiente provisão de fundos em poder do sacado, " +
        "ou lhe frustra o pagamento.",
    },
    {
      fato: "Cessão de conta bancária para crime (conta laranja)", artigo: "Art. 171, § 2º, VII", diploma: CP,
      ref: "Art. 171, §2, VII - DL2848",
      pena: "reclusão, de 1 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "conta laranja emprestou a conta recebedor do pix golpe",
      obs: "Ceder a conta, de graça ou não, para receber dinheiro de crime ou destinado a ele. Exige dolo. Lei 15.397/2026.",
      orientacoes: "estelionato",
      texto:
        "§ 2º - Nas mesmas penas incorre quem:\n" +
        "VII – cede, gratuita ou onerosamente, conta bancária para que nela " +
        "transitem recursos destinados ao financiamento de atividade criminosa ou " +
        "que dela sejam fruto.",
    },
    {
      fato: "Estelionato por fraude eletrônica", artigo: "Art. 171, § 2º-A", diploma: CP,
      ref: "Art. 171, §2-A - DL2848",
      pena: "reclusão, de 4 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "golpe pix whatsapp clonado internet rede social falso perfil site falso",
      obs: "Lei 14.155/2021; a Lei 15.397/2026 incluiu a duplicação de dispositivo ou aplicativo. Servidor fora do país: aumento de 1/3 a 2/3 (§ 2º-B). Contra idoso ou vulnerável: 1/3 ao dobro (§ 4º).",
      orientacoes: "estelionato",
      texto:
        "§ 2º-A. A pena é de reclusão, de 4 (quatro) a 8 (oito) anos, e multa, se " +
        "a fraude é cometida com a utilização de informações fornecidas pela " +
        "vítima ou por terceiro induzido a erro por meio de redes sociais, " +
        "contatos telefônicos, envio de correio eletrônico fraudulento, " +
        "duplicação de dispositivo eletrônico ou aplicação de internet, ou por " +
        "qualquer outro meio fraudulento análogo.",
    },
    {
      fato: "Fraude com ativos virtuais (criptomoedas)", artigo: "Art. 171-A", diploma: CP,
      ref: "Art. 171-A - DL2848",
      pena: "reclusão, de 4 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "bitcoin criptomoeda pirâmide investimento corretora",
      obs: "Lei 14.478/2022.",
      orientacoes: "estelionato",
      texto:
        "Organizar, gerir, ofertar ou distribuir carteiras ou intermediar " +
        "operações que envolvam ativos virtuais, valores mobiliários ou quaisquer " +
        "ativos financeiros com o fim de obter vantagem ilícita, em prejuízo " +
        "alheio, induzindo ou mantendo alguém em erro, mediante artifício, ardil " +
        "ou qualquer outro meio fraudulento.\n" +
        "Pena - reclusão, de 4 (quatro) a 8 (oito) anos, e multa.",
    },
    {
      fato: "Outras fraudes (refeição, hospedagem ou transporte sem pagar)", artigo: "Art. 176", diploma: CP,
      ref: "Art. 176 - DL2848",
      pena: "detenção, de 15 dias a 2 meses, ou multa", acao: "condicionada", jecrim: true,
      busca: "calote restaurante hotel táxi corrida não pagou",
      obs: "Representação; o juiz pode deixar de aplicar a pena (parágrafo único).",
      texto:
        "Tomar refeição em restaurante, alojar-se em hotel ou utilizar-se de meio " +
        "de transporte sem dispor de recursos para efetuar o pagamento:\n" +
        "Pena - detenção, de quinze dias a dois meses, ou multa.",
    },
  ]),

  // ======================================================================
  grupo("Patrimônio — receptação e propriedade intelectual", [
  // ======================================================================
    {
      fato: "Receptação", artigo: "Art. 180", diploma: CP,
      ref: "Art. 180 - DL2848",
      pena: "reclusão, de 2 a 6 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "comprou produto de roubo furtado sabia origem",
      obs: "Em dobro se o bem é público (§ 6º) ou são fios, cabos e equipamentos de serviço essencial (§ 7º). Aumento de 2/3 por integrante de facção (§ 8º). Pena da Lei 15.397/2026 (antes: 1 a 4 anos).",
      texto:
        "Adquirir, receber, transportar, conduzir ou ocultar, em proveito próprio " +
        "ou alheio, coisa que sabe ser produto de crime, ou influir para que " +
        "terceiro, de boa-fé, a adquira, receba ou oculte:\n" +
        "Pena – reclusão, de 2 (dois) a 6 (seis) anos, e multa.",
    },
    {
      fato: "Receptação qualificada (atividade comercial)", artigo: "Art. 180, § 1º", diploma: CP,
      ref: "Art. 180, §1 - DL2848",
      pena: "reclusão, de 3 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "desmanche ferro-velho loja de celular usado sucata",
      texto:
        "§ 1º - Adquirir, receber, transportar, conduzir, ocultar, ter em " +
        "depósito, desmontar, montar, remontar, vender, expor à venda, ou de " +
        "qualquer forma utilizar, em proveito próprio ou alheio, no exercício de " +
        "atividade comercial ou industrial, coisa que deve saber ser produto de " +
        "crime:\n" +
        "Pena - reclusão, de três a oito anos, e multa.",
    },
    {
      fato: "Receptação culposa", artigo: "Art. 180, § 3º", diploma: CP,
      ref: "Art. 180, §3 - DL2848",
      pena: "detenção, de 1 mês a 1 ano, ou multa, ou ambas", acao: "incondicionada", jecrim: true,
      busca: "comprou barato demais sem nota deveria desconfiar",
      obs: "A natureza da coisa, o preço desproporcional ou quem oferece deviam fazer presumir a origem criminosa. O perdão judicial do antigo § 5º foi revogado pela Lei 15.358/2026.",
      texto:
        "§ 3º - Adquirir ou receber coisa que, por sua natureza ou pela " +
        "desproporção entre o valor e o preço, ou pela condição de quem a " +
        "oferece, deve presumir-se obtida por meio criminoso:\n" +
        "Pena - detenção, de um mês a um ano, ou multa, ou ambas as penas.",
    },
    {
      fato: "Receptação de animal", artigo: "Art. 180-A", diploma: CP,
      ref: "Art. 180-A - DL2848",
      pena: "reclusão, de 3 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "gado abatido carne clandestina cachorro de raça",
      obs: "Pena da Lei 15.397/2026, que incluiu o animal doméstico (antes: 2 a 5 anos).",
      texto:
        "Adquirir, receber, transportar, conduzir, ocultar, ter em depósito ou " +
        "vender, com a finalidade de produção ou de comercialização, semovente " +
        "domesticável de produção, ainda que abatido ou dividido em partes, ou " +
        "animal doméstico, que sabe ou deve saber ser produto de crime:\n" +
        "Pena – reclusão, de 3 (três) a 8 (oito) anos, e multa.",
    },
    {
      fato: "Violação de direito autoral (pirataria com intuito de lucro)", artigo: "Art. 184, § 2º", diploma: CP,
      ref: "Art. 184, §2 - DL2848",
      pena: "reclusão, de 2 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "pirataria dvd falsificado camelô cópia",
      obs: "A violação simples (caput) é de ação privada.",
      texto:
        "§ 2º Na mesma pena do § 1º incorre quem, com o intuito de lucro direto " +
        "ou indireto, distribui, vende, expõe à venda, aluga, introduz no País, " +
        "adquire, oculta, tem em depósito, original ou cópia de obra intelectual " +
        "ou fonograma reproduzido com violação do direito de autor, do direito de " +
        "artista intérprete ou executante ou do direito do produtor de fonograma, " +
        "ou, ainda, aluga original ou cópia de obra intelectual ou fonograma, sem " +
        "a expressa autorização dos titulares dos direitos ou de quem os " +
        "represente.",
    },
  ]),

  // ======================================================================
  grupo("Sentimento religioso e respeito aos mortos", [
  // ======================================================================
    {
      fato: "Ultraje a culto religioso", artigo: "Art. 208", diploma: CP,
      ref: "Art. 208 - DL2848",
      pena: "detenção, de 1 mês a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
      busca: "zombou da religião perturbou missa culto igreja terreiro vilipendiou imagem santa intolerância religiosa",
      obs: "Escarnecer publicamente de alguém por crença ou função religiosa, perturbar culto ou vilipendiar objeto de culto. Com violência, aumento de 1/3 (parágrafo único). Impedir ou atacar a prática religiosa com violência também é o art. 20, § 2º-B, da Lei 7.716/1989.",
      texto:
        "Escarnecer de alguém publicamente, por motivo de crença ou função " +
        "religiosa; impedir ou perturbar cerimônia ou prática de culto religioso; " +
        "vilipendiar publicamente ato ou objeto de culto religioso:\n" +
        "Pena - detenção, de um mês a um ano, ou multa.",
    },
    {
      fato: "Impedimento ou perturbação de cerimônia funerária", artigo: "Art. 209", diploma: CP,
      ref: "Art. 209 - DL2848",
      pena: "detenção, de 1 mês a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
      busca: "perturbou o velório enterro funeral",
      obs: "Com violência, aumento de 1/3 (parágrafo único).",
      texto:
        "Impedir ou perturbar enterro ou cerimônia funerária:\n" +
        "Pena - detenção, de um mês a um ano, ou multa.",
    },
    {
      fato: "Violação de sepultura", artigo: "Art. 210", diploma: CP,
      ref: "Art. 210 - DL2848",
      pena: "reclusão, de 1 a 3 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "cemitério túmulo jazigo violaram profanaram urna funerária",
      texto:
        "Violar ou profanar sepultura ou urna funerária:\n" +
        "Pena - reclusão, de um a três anos, e multa.",
    },
    {
      fato: "Destruição, subtração ou ocultação de cadáver", artigo: "Art. 211", diploma: CP,
      ref: "Art. 211 - DL2848",
      pena: "reclusão, de 1 a 3 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "escondeu o corpo enterrou o corpo sumiu com o corpo desova",
      texto:
        "Destruir, subtrair ou ocultar cadáver ou parte dele:\n" +
        "Pena - reclusão, de um a três anos, e multa.",
    },
    {
      fato: "Vilipêndio a cadáver", artigo: "Art. 212", diploma: CP,
      ref: "Art. 212 - DL2848",
      pena: "detenção, de 1 a 3 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "desrespeitou o corpo fotos do cadáver",
      texto:
        "Vilipendiar cadáver ou suas cinzas:\n" +
        "Pena - detenção, de um a três anos, e multa.",
    },
  ]),

  // ======================================================================
  grupo("Dignidade sexual", [
  // ======================================================================
    {
      fato: "Estupro", artigo: "Art. 213", diploma: CP,
      ref: "Art. 213 - DL2848",
      pena: "reclusão, de 6 a 10 anos", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "violência sexual abuso forçou relação ato libidinoso",
      obs: "Ação incondicionada desde a Lei 13.718/2018 (art. 225).",
      texto:
        "Constranger alguém, mediante violência ou grave ameaça, a ter conjunção " +
        "carnal ou a praticar ou permitir que com ele se pratique outro ato " +
        "libidinoso:\n" +
        "Pena - reclusão, de 6 (seis) a 10 (dez) anos.",
    },
    {
      fato: "Estupro qualificado — lesão grave ou vítima de 14 a 18 anos", artigo: "Art. 213, § 1º", diploma: CP,
      ref: "Art. 213, §1 - DL2848",
      pena: "reclusão, de 8 a 12 anos", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "adolescente",
      texto:
        "§ 1º Se da conduta resulta lesão corporal de natureza grave ou se a " +
        "vítima é menor de 18 (dezoito) ou maior de 14 (catorze) anos:\n" +
        "Pena - reclusão, de 8 (oito) a 12 (doze) anos.",
    },
    {
      fato: "Estupro com resultado morte", artigo: "Art. 213, § 2º", diploma: CP,
      ref: "Art. 213, §2 - DL2848",
      pena: "reclusão, de 12 a 30 anos", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      texto:
        "§ 2º Se da conduta resulta morte:\n" +
        "Pena - reclusão, de 12 (doze) a 30 (trinta) anos",
    },
    {
      fato: "Violação sexual mediante fraude", artigo: "Art. 215", diploma: CP,
      ref: "Art. 215 - DL2848",
      pena: "reclusão, de 2 a 6 anos", acao: "incondicionada", jecrim: false,
      busca: "dopou drogou boa noite cinderela falso médico enganou",
      texto:
        "Ter conjunção carnal ou praticar outro ato libidinoso com alguém, " +
        "mediante fraude ou outro meio que impeça ou dificulte a livre " +
        "manifestação de vontade da vítima:\n" +
        "Pena - reclusão, de 2 (dois) a 6 (seis) anos.",
    },
    {
      fato: "Importunação sexual", artigo: "Art. 215-A", diploma: CP,
      ref: "Art. 215-A - DL2848",
      pena: "reclusão, de 1 a 5 anos", acao: "incondicionada", jecrim: false,
      busca: "encoxada ejaculou passou a mão ônibus assédio na rua beijo forçado",
      obs: "Lei 13.718/2018; substituiu o antigo art. 61 da LCP. Só se o ato não constitui crime mais grave.",
      texto:
        "Praticar contra alguém e sem a sua anuência ato libidinoso com o " +
        "objetivo de satisfazer a própria lascívia ou a de terceiro:\n" +
        "Pena - reclusão, de 1 (um) a 5 (cinco) anos, se o ato não constitui " +
        "crime mais grave.",
    },
    {
      fato: "Assédio sexual", artigo: "Art. 216-A", diploma: CP,
      ref: "Art. 216-A - DL2848",
      pena: "detenção, de 1 a 2 anos", acao: "incondicionada", jecrim: true,
      busca: "chefe patrão superior cantada trabalho",
      obs: "Exige superioridade hierárquica ou ascendência no emprego, cargo ou função. Aumento de até 1/3 se a vítima é menor de 18 (§ 2º) — aí, sem Lei 9.099 (art. 226, § 1º, do ECA).",
      texto:
        "Constranger alguém com o intuito de obter vantagem ou favorecimento " +
        "sexual, prevalecendo-se o agente da sua condição de superior hierárquico " +
        "ou ascendência inerentes ao exercício de emprego, cargo ou função.\n" +
        "Pena – detenção, de 1 (um) a 2 (dois) anos.",
    },
    {
      fato: "Registro não autorizado da intimidade sexual", artigo: "Art. 216-B", diploma: CP,
      ref: "Art. 216-B - DL2848",
      pena: "detenção, de 6 meses a 1 ano, e multa", acao: "incondicionada", jecrim: true,
      busca: "filmou fotografou nudez sem autorização câmera escondida montagem",
      obs: "O parágrafo único pune também a montagem que inclua a pessoa em cena íntima.",
      texto:
        "Produzir, fotografar, filmar ou registrar, por qualquer meio, conteúdo " +
        "com cena de nudez ou ato sexual ou libidinoso de caráter íntimo e " +
        "privado sem autorização dos participantes:\n" +
        "Pena - detenção, de 6 (seis) meses a 1 (um) ano, e multa.",
    },
    {
      fato: "Estupro de vulnerável", artigo: "Art. 217-A", diploma: CP,
      ref: "Art. 217-A - DL2848",
      pena: "reclusão, de 10 a 18 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "menor de 14 vulnerável criança abuso sexual infantil dopada desacordada",
      obs: "Vale também para quem não tem discernimento ou não pode resistir (§ 1º). Lesão grave: 12 a 24 anos; morte: 20 a 40. A vulnerabilidade é presunção absoluta (§ 4º-A, Lei 15.353/2026): consentimento, experiência sexual anterior e gravidez são irrelevantes (§ 5º). Pena da Lei 15.280/2025 (antes: 8 a 15 anos).",
      texto:
        "Ter conjunção carnal ou praticar outro ato libidinoso com menor de 14 " +
        "(catorze) anos:\n" +
        "Pena – reclusão, de 10 (dez) a 18 (dezoito) anos, e multa.",
    },
    {
      fato: "Induzimento de menor de 14 anos a satisfazer a lascívia de outrem", artigo: "Art. 218", diploma: CP,
      ref: "Art. 218 - DL2848",
      pena: "reclusão, de 6 a 14 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "corrupção sexual de menores aliciar criança",
      obs: "Não confundir com a corrupção de menores do art. 244-B do ECA. Pena da Lei 15.280/2025 (antes: 2 a 5 anos).",
      texto:
        "Induzir alguém menor de 14 (catorze) anos a satisfazer a lascívia de " +
        "outrem:\n" +
        "Pena – reclusão, de 6 (seis) a 14 (quatorze) anos, e multa.",
    },
    {
      fato: "Satisfação de lascívia mediante presença de criança ou adolescente", artigo: "Art. 218-A", diploma: CP,
      ref: "Art. 218-A - DL2848",
      pena: "reclusão, de 5 a 12 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "ato sexual na frente de criança mostrou pornografia",
      obs: "Vítima menor de 14. Pena da Lei 15.280/2025 (antes: 2 a 4 anos).",
      texto:
        "Praticar, na presença de alguém menor de 14 (catorze) anos, ou induzi-lo " +
        "a presenciar, conjunção carnal ou outro ato libidinoso, a fim de " +
        "satisfazer lascívia própria ou de outrem:\n" +
        "Pena – reclusão, de 5 (cinco) a 12 (doze) anos, e multa.",
    },
    {
      fato: "Favorecimento da prostituição ou exploração sexual de vulnerável", artigo: "Art. 218-B", diploma: CP,
      ref: "Art. 218-B - DL2848",
      pena: "reclusão, de 7 a 16 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "exploração sexual infantil prostituição de adolescente programa",
      obs: "Responde também quem pratica o ato com o menor de 18 e maior de 14 nessa situação (§ 2º, I). Pena da Lei 15.280/2025 (antes: 4 a 10 anos).",
      texto:
        "Submeter, induzir ou atrair à prostituição ou outra forma de exploração " +
        "sexual alguém menor de 18 (dezoito) anos ou que, por enfermidade ou " +
        "deficiência mental, não tem o necessário discernimento para a prática do " +
        "ato, facilitá-la, impedir ou dificultar que a abandone:\n" +
        "Pena – reclusão, de 7 (sete) a 16 (dezesseis) anos, e multa.",
    },
    {
      fato: "Divulgação de cena de estupro, sexo, nudez ou pornografia", artigo: "Art. 218-C", diploma: CP,
      ref: "Art. 218-C - DL2848",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "vazou nudes vídeo íntimo divulgou pornografia de vingança",
      obs: "Aumento de 1/3 a 2/3 se o autor teve relação íntima com a vítima, ou por vingança ou humilhação (§ 1º). Pena da Lei 15.280/2025 (antes: 1 a 5 anos).",
      texto:
        "Oferecer, trocar, disponibilizar, transmitir, vender ou expor à venda, " +
        "distribuir, publicar ou divulgar, por qualquer meio - inclusive por meio " +
        "de comunicação de massa ou sistema de informática ou telemática -, " +
        "fotografia, vídeo ou outro registro audiovisual que contenha cena de " +
        "estupro ou de estupro de vulnerável ou que faça apologia ou induza a sua " +
        "prática, ou, sem o consentimento da vítima, cena de sexo, nudez ou " +
        "pornografia:\n" +
        "Pena – reclusão, de 4 (quatro) a 10 (dez) anos, e multa, se o fato não " +
        "constitui crime mais grave.",
    },
    {
      fato: "Favorecimento da prostituição ou de outra forma de exploração sexual", artigo: "Art. 228", diploma: CP,
      ref: "Art. 228 - DL2848",
      pena: "reclusão, de 2 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "aliciou para prostituição impediu de sair",
      texto:
        "Induzir ou atrair alguém à prostituição ou outra forma de exploração " +
        "sexual, facilitá-la, impedir ou dificultar que alguém a abandone:\n" +
        "Pena - reclusão, de 2 (dois) a 5 (cinco) anos, e multa.",
    },
    {
      fato: "Casa de prostituição", artigo: "Art. 229", diploma: CP,
      ref: "Art. 229 - DL2848",
      pena: "reclusão, de 2 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "bordel prostíbulo boate exploração sexual",
      texto:
        "Manter, por conta própria ou de terceiro, estabelecimento em que ocorra " +
        "exploração sexual, haja, ou não, intuito de lucro ou mediação direta do " +
        "proprietário ou gerente:\n" +
        "Pena - reclusão, de dois a cinco anos, e multa.",
    },
    {
      fato: "Rufianismo", artigo: "Art. 230", diploma: CP,
      ref: "Art. 230 - DL2848",
      pena: "reclusão, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "cafetão tirar proveito da prostituição alheia",
      texto:
        "Tirar proveito da prostituição alheia, participando diretamente de seus " +
        "lucros ou fazendo-se sustentar, no todo ou em parte, por quem a exerça:\n" +
        "Pena - reclusão, de um a quatro anos, e multa.",
    },
    {
      fato: "Ato obsceno", artigo: "Art. 233", diploma: CP,
      ref: "Art. 233 - DL2848",
      pena: "detenção, de 3 meses a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
      busca: "nu em público mostrou as partes masturbação em público",
      texto:
        "Praticar ato obsceno em lugar público, ou aberto ou exposto ao público:\n" +
        "Pena - detenção, de três meses a um ano, ou multa.",
    },
  ]),

  // ======================================================================
  grupo("Família", [
  // ======================================================================
    {
      fato: "Abandono material (pensão alimentícia)", artigo: "Art. 244", diploma: CP,
      ref: "Art. 244 - DL2848",
      pena: "detenção, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "não paga pensão alimentícia não sustenta os filhos",
      obs: "Deixar, sem justa causa, de prover a subsistência de cônjuge, filho menor ou ascendente, ou de pagar pensão fixada judicialmente.",
      texto:
        "Deixar, sem justa causa, de prover a subsistência do cônjuge, ou de " +
        "filho menor de 18 (dezoito) anos ou inapto para o trabalho, ou de " +
        "ascendente inválido ou maior de 60 (sessenta) anos, não lhes " +
        "proporcionando os recursos necessários ou faltando ao pagamento de " +
        "pensão alimentícia judicialmente acordada, fixada ou majorada; deixar, " +
        "sem justa causa, de socorrer descendente ou ascendente, gravemente " +
        "enfermo:\n" +
        "Pena - detenção, de 1 (um) a 4 (quatro) anos e multa, de uma a dez vezes " +
        "o maior salário mínimo vigente no País.",
    },
    {
      fato: "Abandono intelectual", artigo: "Art. 246", diploma: CP,
      ref: "Art. 246 - DL2848",
      pena: "detenção, de 15 dias a 1 mês, ou multa", acao: "incondicionada", jecrim: false,
      busca: "filho fora da escola evasão escolar conselho tutelar",
      obs: "Vítima criança: a Lei 9.099/1995 não se aplica (art. 226, § 1º, do ECA).",
      texto:
        "Deixar, sem justa causa, de prover à instrução primária de filho em " +
        "idade escolar:\n" +
        "Pena - detenção, de quinze dias a um mês, ou multa.",
    },
    {
      fato: "Sonegação de incapaz (não devolver o filho)", artigo: "Art. 248", diploma: CP,
      ref: "Art. 248 - DL2848",
      pena: "detenção, de 1 mês a 1 ano, ou multa", acao: "incondicionada", jecrim: false,
      busca: "não devolveu o filho depois da visita guarda pai mãe",
      obs: "Inclui deixar de entregar o menor a quem legitimamente o reclame. Vítima criança: sem Lei 9.099/1995 (art. 226, § 1º, do ECA).",
      texto:
        "Induzir menor de dezoito anos, ou interdito, a fugir do lugar em que se " +
        "acha por determinação de quem sobre ele exerce autoridade, em virtude de " +
        "lei ou de ordem judicial; confiar a outrem sem ordem do pai, do tutor ou " +
        "do curador algum menor de dezoito anos ou interdito, ou deixar, sem " +
        "justa causa, de entregá-lo a quem legitimamente o reclame:\n" +
        "Pena - detenção, de um mês a um ano, ou multa.",
    },
    {
      fato: "Subtração de incapazes", artigo: "Art. 249", diploma: CP,
      ref: "Art. 249 - DL2848",
      pena: "detenção, de 2 meses a 2 anos", acao: "incondicionada", jecrim: false,
      busca: "levou a criança sumiu com o filho tirou da guarda",
      obs: "O pai ou tutor também comete, se destituído ou privado da guarda (§ 1º). Vítima criança: sem Lei 9.099/1995. Para colocação em lar substituto, é o art. 237 do ECA.",
      texto:
        "Subtrair menor de dezoito anos ou interdito ao poder de quem o tem sob " +
        "sua guarda em virtude de lei ou de ordem judicial:\n" +
        "Pena - detenção, de dois meses a dois anos, se o fato não constitui " +
        "elemento de outro crime.",
    },
  ]),

  // ======================================================================
  grupo("Incolumidade e paz pública", [
  // ======================================================================
    {
      fato: "Incêndio", artigo: "Art. 250", diploma: CP,
      ref: "Art. 250 - DL2848",
      pena: "reclusão, de 3 a 6 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "ateou fogo queimou casa incendiou",
      obs: "Aumento de 1/3 em casa habitada, edifício público, por vantagem pecuniária, entre outros (§ 1º). Culposo (§ 2º): detenção, de 6 meses a 2 anos. Fogo em mata ou vegetação é o art. 41 da Lei 9.605/1998.",
      texto:
        "Causar incêndio, expondo a perigo a vida, a integridade física ou o " +
        "patrimônio de outrem:\n" +
        "Pena - reclusão, de três a seis anos, e multa.",
    },
    {
      fato: "Arremesso de projétil contra veículo de transporte público", artigo: "Art. 264", diploma: CP,
      ref: "Art. 264 - DL2848",
      pena: "detenção, de 1 a 6 meses", acao: "incondicionada", jecrim: true,
      busca: "pedra no ônibus pedrada trem atirou objeto",
      obs: "Veículo em movimento. Se resulta lesão: detenção, de 6 meses a 2 anos; se resulta morte, a pena do homicídio culposo aumentada de 1/3 (parágrafo único).",
      texto:
        "Arremessar projétil contra veículo, em movimento, destinado ao " +
        "transporte público por terra, por água ou pelo ar:\n" +
        "Pena - detenção, de um a seis meses.",
    },
    {
      fato: "Falsificação ou venda de medicamento falsificado ou irregular", artigo: "Art. 273", diploma: CP,
      ref: "Art. 273 - DL2848",
      pena: "reclusão, de 10 a 15 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "remédio falsificado paraguaio sem registro anvisa anabolizante cosmético emagrecedor",
      obs: "Hediondo (art. 1º, VII-B, da Lei 8.072/1990). Vale para quem importa, vende ou tem em depósito (§ 1º) e para produto sem registro, de procedência ignorada ou vindo de estabelecimento sem licença (§ 1º-B). Importar medicamento apenas sem registro (§ 1º-B, I): reclusão, de 1 a 3 anos, e multa (STF, Tema 1.003). Culposo (§ 2º): detenção, de 1 a 3 anos, e multa.",
      texto:
        "Falsificar, corromper, adulterar ou alterar produto destinado a fins " +
        "terapêuticos ou medicinais:\n" +
        "Pena - reclusão, de 10 (dez) a 15 (quinze) anos, e multa.",
    },
    {
      fato: "Exercício ilegal da medicina, medicina veterinária, arte dentária ou farmacêutica", artigo: "Art. 282", diploma: CP,
      ref: "Art. 282 - DL2848",
      pena: "detenção, de 6 meses a 2 anos", acao: "incondicionada", jecrim: true,
      busca: "falso médico falso veterinário dentista sem registro procedimento estético harmonização",
      obs: "Lei 15.425/2026 incluiu o médico veterinário. Com fim de lucro, também multa (§ 1º). Se resulta lesão grave, gravíssima ou morte, responde também pelo art. 129 ou pelo 121; morte ou lesão de animal, pelo art. 32 da Lei 9.605/1998 (§§ 2º a 4º). Vale também com o registro suspenso ou cancelado (§ 5º).",
      texto:
        "Exercer, ainda que a título gratuito, a profissão de médico, médico " +
        "veterinário, dentista ou farmacêutico, sem autorização legal ou " +
        "excedendo-lhe os limites:\n" +
        "Pena – detenção, de 6 (seis) meses a 2 (dois) anos.",
    },
    {
      fato: "Incitação ao crime", artigo: "Art. 286", diploma: CP,
      ref: "Art. 286 - DL2848",
      pena: "detenção, de 3 a 6 meses, ou multa", acao: "incondicionada", jecrim: true,
      texto:
        "Incitar, publicamente, a prática de crime:\n" +
        "Pena - detenção, de três a seis meses, ou multa.",
    },
    {
      fato: "Apologia de crime ou criminoso", artigo: "Art. 287", diploma: CP,
      ref: "Art. 287 - DL2848",
      pena: "detenção, de 3 a 6 meses, ou multa", acao: "incondicionada", jecrim: true,
      texto:
        "Fazer, publicamente, apologia de fato criminoso ou de autor de crime:\n" +
        "Pena - detenção, de três a seis meses, ou multa.",
    },
    {
      fato: "Associação criminosa", artigo: "Art. 288", diploma: CP,
      ref: "Art. 288 - DL2848",
      pena: "reclusão, de 1 a 3 anos", acao: "incondicionada", jecrim: false,
      busca: "quadrilha bando três ou mais pessoas",
      obs: "Três ou mais pessoas, para cometer crimes. Aumenta até a metade se armada ou com criança ou adolescente (§ 1º). Quem solicita ou contrata crime a integrante responde pelo caput (§ 2º, Lei 15.245/2025). Para crimes hediondos, tortura, tráfico ou terrorismo: reclusão, de 3 a 6 anos (art. 8º da Lei 8.072/1990). Milícia é o art. 288-A.",
      texto:
        "Associarem-se 3 (três) ou mais pessoas, para o fim específico de cometer " +
        "crimes:\n" +
        "Pena - reclusão, de 1 (um) a 3 (três) anos.",
    },
  ]),

  // ======================================================================
  grupo("Fé pública", [
  // ======================================================================
    {
      fato: "Moeda falsa", artigo: "Art. 289", diploma: CP,
      ref: "Art. 289 - DL2848",
      pena: "reclusão, de 3 a 12 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "nota falsa dinheiro falso cédula",
      obs: "Competência da Justiça Federal. Inclui guardar, introduzir na circulação ou adquirir (§ 1º).",
      texto:
        "Falsificar, fabricando-a ou alterando-a, moeda metálica ou papel-moeda " +
        "de curso legal no país ou no estrangeiro:\n" +
        "Pena - reclusão, de três a doze anos, e multa.",
    },
    {
      fato: "Moeda falsa recebida de boa-fé e repassada", artigo: "Art. 289, § 2º", diploma: CP,
      ref: "Art. 289, §2 - DL2848",
      pena: "detenção, de 6 meses a 2 anos, e multa", acao: "incondicionada", jecrim: true,
      busca: "recebeu nota falsa de troco e passou adiante",
      obs: "Recebeu como verdadeira e, depois de saber da falsidade, devolveu à circulação.",
      texto:
        "§ 2º - Quem, tendo recebido de boa-fé, como verdadeira, moeda falsa ou " +
        "alterada, a restitui à circulação, depois de conhecer a falsidade, é " +
        "punido com detenção, de seis meses a dois anos, e multa.",
    },
    {
      fato: "Falsificação de documento público", artigo: "Art. 297", diploma: CP,
      ref: "Art. 297 - DL2848",
      pena: "reclusão, de 2 a 6 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "cnh falsa rg falso documento falsificado carteira de trabalho",
      texto:
        "Falsificar, no todo ou em parte, documento público, ou alterar documento " +
        "público verdadeiro:\n" +
        "Pena - reclusão, de dois a seis anos, e multa.",
    },
    {
      fato: "Falsificação de documento particular", artigo: "Art. 298", diploma: CP,
      ref: "Art. 298 - DL2848",
      pena: "reclusão, de 1 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "contrato falso recibo falso cartão de crédito clonado",
      obs: "Cartão de crédito ou débito equipara-se a documento particular (parágrafo único).",
      texto:
        "Falsificar, no todo ou em parte, documento particular ou alterar " +
        "documento particular verdadeiro:\n" +
        "Pena - reclusão, de um a cinco anos, e multa.",
    },
    {
      fato: "Falsidade ideológica", artigo: "Art. 299", diploma: CP,
      ref: "Art. 299 - DL2848",
      pena: "reclusão, de 1 a 5 anos, e multa (documento público)", acao: "incondicionada", jecrim: false,
      busca: "declaração falsa informação falsa no documento",
      obs: "Documento particular: reclusão, de 1 a 3 anos, e multa. O documento é verdadeiro; falso é o conteúdo.",
      texto:
        "Omitir, em documento público ou particular, declaração que dele devia " +
        "constar, ou nele inserir ou fazer inserir declaração falsa ou diversa da " +
        "que devia ser escrita, com o fim de prejudicar direito, criar obrigação " +
        "ou alterar a verdade sobre fato juridicamente relevante:\n" +
        "Pena - reclusão, de um a cinco anos, e multa, se o documento é público, " +
        "e reclusão de um a três anos, e multa, de quinhentos mil réis a cinco " +
        "contos de réis, se o documento é particular.",
    },
    {
      fato: "Uso de documento falso", artigo: "Art. 304", diploma: CP,
      ref: "Art. 304 - DL2848",
      pena: "a mesma do documento falsificado", acao: "incondicionada", jecrim: false,
      prescricao: "conforme o documento",
      busca: "apresentou cnh falsa na abordagem",
      texto:
        "Fazer uso de qualquer dos papéis falsificados ou alterados, a que se " +
        "referem os arts. 297 a 302:\n" +
        "Pena - a cominada à falsificação ou à alteração.",
    },
    {
      fato: "Falsa identidade", artigo: "Art. 307", diploma: CP,
      ref: "Art. 307 - DL2848",
      pena: "detenção, de 3 meses a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
      busca: "deu nome falso identificou-se como outro mentiu o nome",
      obs: "Típica mesmo em autodefesa, perante a autoridade policial (Súmula 522 do STJ).",
      texto:
        "Atribuir-se ou atribuir a terceiro falsa identidade para obter vantagem, " +
        "em proveito próprio ou alheio, ou para causar dano a outrem:\n" +
        "Pena - detenção, de três meses a um ano, ou multa, se o fato não " +
        "constitui elemento de crime mais grave.",
    },
    {
      fato: "Uso de documento de identidade alheio", artigo: "Art. 308", diploma: CP,
      ref: "Art. 308 - DL2848",
      pena: "detenção, de 4 meses a 2 anos, e multa", acao: "incondicionada", jecrim: true,
      busca: "usou o rg do irmão documento de outra pessoa",
      texto:
        "Usar, como próprio, passaporte, título de eleitor, caderneta de " +
        "reservista ou qualquer documento de identidade alheia ou ceder a outrem, " +
        "para que dele se utilize, documento dessa natureza, próprio ou de " +
        "terceiro:\n" +
        "Pena - detenção, de quatro meses a dois anos, e multa, se o fato não " +
        "constitui elemento de crime mais grave.",
    },
    {
      fato: "Adulteração de sinal identificador de veículo", artigo: "Art. 311", diploma: CP,
      ref: "Art. 311 - DL2848",
      pena: "reclusão, de 3 a 6 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "chassi raspado placa adulterada motor remarcado clone dublê",
      obs: "Lei 14.562/2023 incluiu veículo elétrico, híbrido, reboque e componentes, e quem adquire ou conduz o veículo adulterado (§ 2º, III).",
      texto:
        "Adulterar, remarcar ou suprimir número de chassi, monobloco, motor, " +
        "placa de identificação, ou qualquer sinal identificador de veículo " +
        "automotor, elétrico, híbrido, de reboque, de semirreboque ou de suas " +
        "combinações, bem como de seus componentes ou equipamentos, sem " +
        "autorização do órgão competente:\n" +
        "Pena - reclusão, de três a seis anos, e multa.",
    },
  ]),

  // ======================================================================
  grupo("Administração pública e da justiça", [
  // ======================================================================
    {
      fato: "Peculato", artigo: "Art. 312", diploma: CP,
      ref: "Art. 312 - DL2848",
      pena: "reclusão, de 2 a 12 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "servidor desviou dinheiro público",
      obs: "Culposo (§ 2º): detenção, de 3 meses a 1 ano.",
      texto:
        "Apropriar-se o funcionário público de dinheiro, valor ou qualquer outro " +
        "bem móvel, público ou particular, de que tem a posse em razão do cargo, " +
        "ou desviá-lo, em proveito próprio ou alheio:\n" +
        "Pena - reclusão, de dois a doze anos, e multa.",
    },
    {
      fato: "Concussão", artigo: "Art. 316", diploma: CP,
      ref: "Art. 316 - DL2848",
      pena: "reclusão, de 2 a 12 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "servidor exigiu dinheiro propina",
      texto:
        "Exigir, para si ou para outrem, direta ou indiretamente, ainda que fora " +
        "da função ou antes de assumi-la, mas em razão dela, vantagem indevida:\n" +
        "Pena - reclusão, de 2 (dois) a 12 (doze) anos, e multa.",
    },
    {
      fato: "Corrupção passiva", artigo: "Art. 317", diploma: CP,
      ref: "Art. 317 - DL2848",
      pena: "reclusão, de 2 a 12 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "servidor pediu aceitou propina",
      texto:
        "Solicitar ou receber, para si ou para outrem, direta ou indiretamente, " +
        "ainda que fora da função ou antes de assumi-la, mas em razão dela, " +
        "vantagem indevida, ou aceitar promessa de tal vantagem:\n" +
        "Pena – reclusão, de 2 (dois) a 12 (doze) anos, e multa.",
    },
    {
      fato: "Usurpação de função pública", artigo: "Art. 328", diploma: CP,
      ref: "Art. 328 - DL2848",
      pena: "detenção, de 3 meses a 2 anos, e multa", acao: "incondicionada", jecrim: true,
      busca: "falso policial se passou por fiscal agente",
      obs: "Se aufere vantagem (parágrafo único): reclusão, de 2 a 5 anos, e multa.",
      texto:
        "Usurpar o exercício de função pública:\n" +
        "Pena - detenção, de três meses a dois anos, e multa.",
    },
    {
      fato: "Resistência", artigo: "Art. 329", diploma: CP,
      ref: "Art. 329 - DL2848",
      pena: "detenção, de 2 meses a 2 anos", acao: "incondicionada", jecrim: true,
      busca: "resistiu à prisão se debateu agrediu o policial",
      obs: "Se o ato, por causa da resistência, não se executa (§ 1º): reclusão, de 1 a 3 anos. Penas da violência à parte (§ 2º).",
      texto:
        "Opor-se à execução de ato legal, mediante violência ou ameaça a " +
        "funcionário competente para executá-lo ou a quem lhe esteja prestando " +
        "auxílio:\n" +
        "Pena - detenção, de dois meses a dois anos.",
    },
    {
      fato: "Desobediência", artigo: "Art. 330", diploma: CP,
      ref: "Art. 330 - DL2848",
      pena: "detenção, de 15 dias a 6 meses, e multa", acao: "incondicionada", jecrim: true,
      busca: "não parou na blitz desobedeceu ordem",
      texto:
        "Desobedecer a ordem legal de funcionário público:\n" +
        "Pena - detenção, de quinze dias a seis meses, e multa.",
    },
    {
      fato: "Desacato", artigo: "Art. 331", diploma: CP,
      ref: "Art. 331 - DL2848",
      pena: "detenção, de 6 meses a 2 anos, ou multa", acao: "incondicionada", jecrim: true,
      busca: "xingou policial ofendeu servidor",
      texto:
        "Desacatar funcionário público no exercício da função ou em razão dela:\n" +
        "Pena - detenção, de seis meses a dois anos, ou multa.",
    },
    {
      fato: "Tráfico de influência", artigo: "Art. 332", diploma: CP,
      ref: "Art. 332 - DL2848",
      pena: "reclusão, de 2 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "disse que conhecia o delegado juiz pediu dinheiro para resolver liberar o preso prometeu influência",
      obs: "Vantagem a pretexto de influir em ato de funcionário público. Aumentada de metade se alega ou insinua que a vantagem também é para o funcionário (parágrafo único).",
      texto:
        "Solicitar, exigir, cobrar ou obter, para si ou para outrem, vantagem ou " +
        "promessa de vantagem, a pretexto de influir em ato praticado por " +
        "funcionário público no exercício da função:\n" +
        "Pena - reclusão, de 2 (dois) a 5 (cinco) anos, e multa.",
    },
    {
      fato: "Corrupção ativa", artigo: "Art. 333", diploma: CP,
      ref: "Art. 333 - DL2848",
      pena: "reclusão, de 2 a 12 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "ofereceu propina dinheiro ao policial para liberar",
      texto:
        "Oferecer ou prometer vantagem indevida a funcionário público, para " +
        "determiná-lo a praticar, omitir ou retardar ato de ofício:\n" +
        "Pena – reclusão, de 2 (dois) a 12 (doze) anos, e multa.",
    },
    {
      fato: "Descaminho", artigo: "Art. 334", diploma: CP,
      ref: "Art. 334 - DL2848",
      pena: "reclusão, de 1 a 4 anos", acao: "incondicionada", jecrim: false,
      busca: "mercadoria do Paraguai sem nota sem imposto muamba",
      obs: "Competência da Justiça Federal.",
      texto:
        "Iludir, no todo ou em parte, o pagamento de direito ou imposto devido " +
        "pela entrada, pela saída ou pelo consumo de mercadoria\n" +
        "Pena - reclusão, de 1 (um) a 4 (quatro) anos.",
    },
    {
      fato: "Contrabando", artigo: "Art. 334-A", diploma: CP,
      ref: "Art. 334-A - DL2848",
      pena: "reclusão, de 2 a 5 anos", acao: "incondicionada", jecrim: false,
      busca: "cigarro paraguaio mercadoria proibida",
      obs: "Mercadoria proibida. Competência da Justiça Federal.",
      texto:
        "Importar ou exportar mercadoria proibida:\n" +
        "Pena - reclusão, de 2 (dois) a 5 ( cinco) anos.",
    },
    {
      fato: "Descumprimento de medida protetiva de urgência (Código Penal)", artigo: "Art. 338-A", diploma: CP,
      ref: "Art. 338-A - DL2848",
      pena: "reclusão, de 2 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      fianca: "juiz",
      busca: "medida protetiva descumpriu crime sexual",
      obs: "Vale para medida protetiva de qualquer lei; contra a mulher em violência doméstica, segue o art. 24-A da Lei Maria da Penha. No flagrante, só o juiz concede fiança. Lei 15.280/2025.",
      texto:
        "Descumprir decisão judicial que defere medidas protetivas de urgência:\n" +
        "Pena – reclusão, de 2 (dois) a 5 (cinco) anos, e multa.",
    },
    {
      fato: "Denunciação caluniosa", artigo: "Art. 339", diploma: CP,
      ref: "Art. 339 - DL2848",
      pena: "reclusão, de 2 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "acusou falsamente na polícia registrou ocorrência contra inocente",
      obs: "Dá causa a investigação ou processo contra quem sabe inocente.",
      texto:
        "Dar causa à instauração de inquérito policial, de procedimento " +
        "investigatório criminal, de processo judicial, de processo " +
        "administrativo disciplinar, de inquérito civil ou de ação de improbidade " +
        "administrativa contra alguém, imputando-lhe crime, infração " +
        "ético-disciplinar ou ato ímprobo de que o sabe inocente:\n" +
        "Pena - reclusão, de dois a oito anos, e multa.",
    },
    {
      fato: "Comunicação falsa de crime ou contravenção", artigo: "Art. 340", diploma: CP,
      ref: "Art. 340 - DL2848",
      pena: "detenção, de 1 a 6 meses, ou multa", acao: "incondicionada", jecrim: true,
      busca: "registrou bo falso mentiu na ocorrência inventou furto seguro",
      texto:
        "Provocar a ação de autoridade, comunicando-lhe a ocorrência de crime ou " +
        "de contravenção que sabe não se ter verificado:\n" +
        "Pena - detenção, de um a seis meses, ou multa.",
    },
    {
      fato: "Autoacusação falsa", artigo: "Art. 341", diploma: CP,
      ref: "Art. 341 - DL2848",
      pena: "detenção, de 3 meses a 2 anos, ou multa", acao: "incondicionada", jecrim: true,
      busca: "assumiu a culpa por outro",
      texto:
        "Acusar-se, perante a autoridade, de crime inexistente ou praticado por " +
        "outrem:\n" +
        "Pena - detenção, de três meses a dois anos, ou multa.",
    },
    {
      fato: "Falso testemunho ou falsa perícia", artigo: "Art. 342", diploma: CP,
      ref: "Art. 342 - DL2848",
      pena: "reclusão, de 2 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "testemunha mentiu depoimento falso",
      obs: "Deixa de ser punível se o agente se retrata antes da sentença (§ 2º).",
      texto:
        "Fazer afirmação falsa, ou negar ou calar a verdade como testemunha, " +
        "perito, contador, tradutor ou intérprete em processo judicial, ou " +
        "administrativo, inquérito policial, ou em juízo arbitral:\n" +
        "Pena - reclusão, de 2 (dois) a 4 (quatro) anos, e multa.",
    },
    {
      fato: "Coação no curso do processo", artigo: "Art. 344", diploma: CP,
      ref: "Art. 344 - DL2848",
      pena: "reclusão, de 1 a 4 anos, e multa, além da pena da violência", acao: "incondicionada", jecrim: false,
      busca: "ameaçou testemunha vítima para retirar queixa mudar depoimento",
      obs: "Aumento de 1/3 até a metade se o processo envolve crime contra a dignidade sexual (parágrafo único).",
      texto:
        "Usar de violência ou grave ameaça, com o fim de favorecer interesse " +
        "próprio ou alheio, contra autoridade, parte, ou qualquer outra pessoa " +
        "que funciona ou é chamada a intervir em processo judicial, policial ou " +
        "administrativo, ou em juízo arbitral:\n" +
        "Pena - reclusão, de um a quatro anos, e multa, além da pena " +
        "correspondente à violência.",
    },
    {
      fato: "Exercício arbitrário das próprias razões", artigo: "Art. 345", diploma: CP,
      ref: "Art. 345 - DL2848",
      pena: "detenção, de 15 dias a 1 mês, ou multa, além da pena da violência", acao: "privada", jecrim: true,
      busca: "fazer justiça com as próprias mãos tomou de volta cobrou dívida",
      obs: "Ação pública quando houver violência.",
      texto:
        "Fazer justiça pelas próprias mãos, para satisfazer pretensão, embora " +
        "legítima, salvo quando a lei o permite:\n" +
        "Pena - detenção, de quinze dias a um mês, ou multa, além da pena " +
        "correspondente à violência.",
    },
    {
      fato: "Fraude processual", artigo: "Art. 347", diploma: CP,
      ref: "Art. 347 - DL2848",
      pena: "detenção, de 3 meses a 2 anos, e multa", acao: "incondicionada", jecrim: true,
      busca: "alterou a cena do crime limpou o local escondeu prova",
      obs: "Em dobro se destinada a produzir efeito em processo penal (parágrafo único) — aí não é JECRIM.",
      texto:
        "Inovar artificiosamente, na pendência de processo civil ou " +
        "administrativo, o estado de lugar, de coisa ou de pessoa, com o fim de " +
        "induzir a erro o juiz ou o perito:\n" +
        "Pena - detenção, de três meses a dois anos, e multa.",
    },
    {
      fato: "Favorecimento pessoal", artigo: "Art. 348", diploma: CP,
      ref: "Art. 348 - DL2848",
      pena: "detenção, de 1 a 6 meses, e multa", acao: "incondicionada", jecrim: true,
      busca: "escondeu o foragido ajudou a fugir",
      obs: "Se ao crime do favorecido não é cominada reclusão (§ 1º): detenção, de 15 dias a 3 meses, e multa. Isento de pena o ascendente, descendente, cônjuge ou irmão do favorecido (§ 2º).",
      texto:
        "Auxiliar a subtrair-se à ação de autoridade pública autor de crime a que " +
        "é cominada pena de reclusão:\n" +
        "Pena - detenção, de um a seis meses, e multa.",
    },
    {
      fato: "Favorecimento real", artigo: "Art. 349", diploma: CP,
      ref: "Art. 349 - DL2848",
      pena: "detenção, de 1 a 6 meses, e multa", acao: "incondicionada", jecrim: true,
      busca: "guardou o produto do roubo para o ladrão escondeu o dinheiro do crime",
      obs: "Auxílio para tornar seguro o proveito do crime, fora dos casos de coautoria e de receptação.",
      texto:
        "Prestar a criminoso, fora dos casos de co-autoria ou de receptação, " +
        "auxílio destinado a tornar seguro o proveito do crime:\n" +
        "Pena - detenção, de um a seis meses, e multa.",
    },
    {
      fato: "Ingresso de celular em estabelecimento prisional", artigo: "Art. 349-A", diploma: CP,
      ref: "Art. 349-A - DL2848",
      pena: "detenção, de 3 meses a 1 ano", acao: "incondicionada", jecrim: true,
      busca: "levou celular para preso visita presídio",
      texto:
        "Ingressar, promover, intermediar, auxiliar ou facilitar a entrada de " +
        "aparelho telefônico de comunicação móvel, de rádio ou similar, sem " +
        "autorização legal, em estabelecimento prisional.\n" +
        "Pena: detenção, de 3 (três) meses a 1 (um) ano.",
    },
    {
      fato: "Promover ou facilitar a fuga de preso", artigo: "Art. 351", diploma: CP,
      ref: "Art. 351 - DL2848",
      pena: "detenção, de 6 meses a 2 anos", acao: "incondicionada", jecrim: true,
      busca: "fuga de preso resgate presídio ajudou a fugir da cadeia",
      obs: "A mão armada, por mais de uma pessoa ou com arrombamento (§ 1º): reclusão, de 2 a 6 anos. Pelo próprio custodiante (§ 3º): reclusão, de 1 a 4 anos; por culpa dele (§ 4º): detenção, de 3 meses a 1 ano, ou multa.",
      texto:
        "Promover ou facilitar a fuga de pessoa legalmente presa ou submetida a " +
        "medida de segurança detentiva:\n" +
        "Pena - detenção, de seis meses a dois anos.",
    },
  ]),

  // ======================================================================
  grupo("Violência doméstica (Lei Maria da Penha)", [
  // ======================================================================
    {
      fato: "Descumprimento de medida protetiva de urgência", artigo: "Art. 24-A",
      diploma: PENHA,
      ref: "Art. 24-A - L11340",
      pena: "reclusão, de 2 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["domestica"], fianca: "juiz",
      busca: "mpu medida protetiva descumpriu aproximou contato mensagem",
      obs: "Independe da competência civil ou criminal do juiz que deferiu (§ 1º). No flagrante, só o juiz concede fiança (§ 2º). Aumento de 1/3 até a metade se violou área de exclusão monitorada ou mexeu na tornozeleira (§ 4º, Lei 15.383/2026). Pena da Lei 14.994/2024 (antes: detenção, de 3 meses a 2 anos).",
      orientacoes: "violencia_domestica",
      texto:
        "Descumprir decisão judicial que defere medidas protetivas de urgência " +
        "previstas nesta Lei:\n" +
        "Pena – reclusão, de 2 (dois) a 5 (cinco) anos, e multa.",
    },
  ]),

  // ======================================================================
  grupo("Criança e adolescente", [
  // ======================================================================
    {
      fato: "Privação ilegal da liberdade de criança ou adolescente", artigo: "Art. 230", diploma: ECA,
      ref: "Art. 230 - L8069",
      pena: "detenção, de 6 meses a 2 anos", acao: "incondicionada", jecrim: false,
      busca: "apreendeu adolescente sem flagrante sem ordem",
      obs: "Sem flagrante de ato infracional nem ordem escrita do juiz; também a apreensão sem as formalidades legais (§ 1º). A Lei 9.099/1995 não se aplica (§ 2º, Lei 15.163/2025). Os crimes do ECA são todos de ação pública incondicionada (art. 227).",
      texto:
        "Privar a criança ou o adolescente de sua liberdade, procedendo à sua " +
        "apreensão sem estar em flagrante de ato infracional ou inexistindo ordem " +
        "escrita da autoridade judiciária competente:\n" +
        "Pena - detenção de seis meses a dois anos.",
    },
    {
      fato: "Deixar de comunicar a apreensão de criança ou adolescente", artigo: "Art. 231", diploma: ECA,
      ref: "Art. 231 - L8069",
      pena: "detenção, de 6 meses a 2 anos", acao: "incondicionada", jecrim: false,
      busca: "apreensão de adolescente não avisou a família nem o juiz",
      obs: "Da autoridade policial: comunicação imediata ao juiz e à família do apreendido ou a quem ele indicar. Sem Lei 9.099/1995 (art. 226, § 1º).",
      texto:
        "Deixar a autoridade policial responsável pela apreensão de criança ou " +
        "adolescente de fazer imediata comunicação à autoridade judiciária " +
        "competente e à família do apreendido ou à pessoa por ele indicada:\n" +
        "Pena - detenção de seis meses a dois anos.",
    },
    {
      fato: "Submeter criança ou adolescente a vexame ou constrangimento", artigo: "Art. 232", diploma: ECA,
      ref: "Art. 232 - L8069",
      pena: "detenção, de 6 meses a 2 anos", acao: "incondicionada", jecrim: false,
      busca: "humilhou a criança expôs constrangimento escola",
      obs: "Vítima sob autoridade, guarda ou vigilância do autor. Sem Lei 9.099/1995 (art. 226, § 1º).",
      texto:
        "Submeter criança ou adolescente sob sua autoridade, guarda ou vigilância " +
        "a vexame ou a constrangimento:\n" +
        "Pena - detenção de seis meses a dois anos.",
    },
    {
      fato: "Impedir ou embaraçar a ação do Conselho Tutelar, do juiz ou do MP", artigo: "Art. 236", diploma: ECA,
      ref: "Art. 236 - L8069",
      pena: "detenção, de 6 meses a 2 anos", acao: "incondicionada", jecrim: false,
      busca: "conselheiro tutelar impediu visita atrapalhou",
      texto:
        "Impedir ou embaraçar a ação de autoridade judiciária, membro do Conselho " +
        "Tutelar ou representante do Ministério Público no exercício de função " +
        "prevista nesta Lei:\n" +
        "Pena - detenção de seis meses a dois anos.",
    },
    {
      fato: "Subtrair criança ou adolescente para colocação em lar substituto", artigo: "Art. 237", diploma: ECA,
      ref: "Art. 237 - L8069",
      pena: "reclusão, de 2 a 6 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "adoção ilegal levou o bebê",
      texto:
        "Subtrair criança ou adolescente ao poder de quem o tem sob sua guarda em " +
        "virtude de lei ou ordem judicial, com o fim de colocação em lar " +
        "substituto:\n" +
        "Pena - reclusão de dois a seis anos, e multa.",
    },
    {
      fato: "Prometer ou entregar filho mediante paga ou recompensa", artigo: "Art. 238", diploma: ECA,
      ref: "Art. 238 - L8069",
      pena: "reclusão, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "vendeu o filho bebê adoção à brasileira",
      obs: "Quem oferece ou paga responde igual (parágrafo único).",
      texto:
        "Prometer ou efetivar a entrega de filho ou pupilo a terceiro, mediante " +
        "paga ou recompensa:\n" +
        "Pena - reclusão de um a quatro anos, e multa.",
    },
    {
      fato: "Envio irregular de criança ou adolescente ao exterior", artigo: "Art. 239", diploma: ECA,
      ref: "Art. 239 - L8069",
      pena: "reclusão, de 4 a 6 anos, e multa", acao: "incondicionada", jecrim: false,
      obs: "Com violência, grave ameaça ou fraude (parágrafo único): 6 a 8 anos, além da pena da violência.",
      texto:
        "Promover ou auxiliar a efetivação de ato destinado ao envio de criança " +
        "ou adolescente para o exterior com inobservância das formalidades legais " +
        "ou com o fito de obter lucro:\n" +
        "Pena - reclusão de quatro a seis anos, e multa.",
    },
    {
      fato: "Produzir ou registrar violência sexual contra criança ou adolescente", artigo: "Art. 240", diploma: ECA,
      ref: "Art. 240 - L8069",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "filmou fotografou criança pornografia infantil abuso",
      obs: "Pena e hediondez da Lei 15.487/2026 (antes: 4 a 8 anos), que trocou \"cena de sexo explícito ou pornográfica\" por \"violência sexual\". Inclui conteúdo gerado por inteligência artificial.",
      texto:
        "Produzir, reproduzir, dirigir, fotografar, filmar ou registrar, por " +
        "qualquer meio, conteúdo de violência sexual contra criança ou " +
        "adolescente:\n" +
        "Pena - reclusão, de 4 (quatro) a 10 (dez) anos, e multa.",
    },
    {
      fato: "Vender material de violência sexual contra criança ou adolescente", artigo: "Art. 241", diploma: ECA,
      ref: "Art. 241 - L8069",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "venda de pornografia infantil",
      obs: "Lei 15.487/2026, com perda dos valores recebidos.",
      texto:
        "Vender ou expor à venda fotografia, vídeo ou outro registro que contenha " +
        "violência sexual contra criança ou adolescente:\n" +
        "Pena - reclusão, de 4 (quatro) a 10 (dez) anos, e multa, além da perda " +
        "de bens e valores recebidos em virtude da prática criminosa em favor do " +
        "Fundo dos Direitos da Criança e do Adolescente da unidade da Federação " +
        "em que foi cometido o crime, ressalvado o direito de terceiro de boa-fé.",
    },
    {
      fato: "Divulgar ou compartilhar material de violência sexual contra criança ou adolescente", artigo: "Art. 241-A", diploma: ECA,
      ref: "Art. 241-A - L8069",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "pornografia infantil compartilhou enviou grupo divulgou",
      obs: "Alcança quem administra ou modera site, fórum ou grupo (§ 1º, III). Aumento de 1/3 com publicação em mais de uma plataforma (§ 3º). Com proxy ou mascaramento de IP: aumento de 1/3 a 2/3 (art. 226-A, também da Lei 15.487/2026). Pena da Lei 15.487/2026 (antes: 3 a 6 anos).",
      texto:
        "Oferecer, trocar, disponibilizar, transmitir, distribuir, publicar ou " +
        "divulgar por qualquer meio, inclusive por meio de sistema de informática " +
        "ou telemático, fotografia, vídeo ou outro registro que contenha " +
        "violência sexual contra criança ou adolescente:\n" +
        "Pena - reclusão, de 4 (quatro) a 10 (dez) anos, e multa.",
    },
    {
      fato: "Adquirir, possuir, armazenar ou acessar material de violência sexual contra criança ou adolescente", artigo: "Art. 241-B", diploma: ECA,
      ref: "Art. 241-B - L8069",
      pena: "reclusão, de 3 a 6 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "pornografia infantil armazenou baixou no celular computador",
      obs: "Acessar ou visualizar em plataforma ou streaming também é crime (§ 4º), mas o rol de hediondos só alcança o caput. Redução de 1/6 a 1/3 para pequena quantidade (§ 1º). Pena da Lei 15.487/2026 (antes: 1 a 4 anos).",
      texto:
        "Adquirir, possuir, armazenar ou solicitar, por qualquer meio, " +
        "fotografia, vídeo ou outra forma de registro que contenha violência " +
        "sexual contra criança ou adolescente:\n" +
        "Pena - reclusão, de 3 (três) a 6 (seis) anos, e multa.",
    },
    {
      fato: "Simular a participação de criança ou adolescente em violência sexual", artigo: "Art. 241-C", diploma: ECA,
      ref: "Art. 241-C - L8069",
      pena: "reclusão, de 3 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "montagem deepfake inteligência artificial nudes falsos de criança",
      obs: "Pena da Lei 15.487/2026 (antes: 1 a 3 anos), que incluiu alteração de imagem ou voz por inteligência artificial.",
      texto:
        "Simular a participação de criança ou adolescente em conteúdo de " +
        "violência sexual por meio de adulteração, montagem ou modificação de " +
        "fotografia, vídeo ou outra forma de representação visual, mediante " +
        "qualquer recurso tecnológico que altere imagem ou voz da vítima, " +
        "inclusive com uso de inteligência artificial:\n" +
        "Pena - reclusão, de 3 (três) a 5 (cinco) anos, e multa.",
    },
    {
      fato: "Aliciar ou assediar criança por meio de comunicação (grooming)", artigo: "Art. 241-D", diploma: ECA,
      ref: "Art. 241-D - L8069",
      pena: "reclusão, de 3 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "aliciamento online pediu fotos da criança jogo rede social chat",
      obs: "Vítima menor de 14. Aumento de 1/3 a 2/3 com perfil falso, IA ou anonimização (§ 2º). Pena da Lei 15.487/2026 (antes: 1 a 3 anos).",
      texto:
        "Aliciar, assediar, convidar, instigar ou constranger, por qualquer meio, " +
        "menor de 14 (quatorze) anos, com o fim de praticar ato libidinoso:\n" +
        "Pena - reclusão, de 3 (três) a 5 (cinco) anos, e multa, se o fato não " +
        "constituir crime mais grave.",
    },
    {
      fato: "Vender ou fornecer arma, munição ou explosivo a criança ou adolescente", artigo: "Art. 242", diploma: ECA,
      ref: "Art. 242 - L8069",
      pena: "reclusão, de 3 a 6 anos", acao: "incondicionada", jecrim: false,
      busca: "deu arma ao menor faca",
      obs: "Arma de fogo, acessório, munição ou explosivo também está no art. 16, § 1º, V, do Estatuto do Desarmamento, com a mesma pena.",
      texto:
        "Vender, fornecer ainda que gratuitamente ou entregar, de qualquer forma, " +
        "a criança ou adolescente arma, munição ou explosivo:\n" +
        "Pena - reclusão, de 3 (três) a 6 (seis) anos.",
    },
    {
      fato: "Vender ou fornecer bebida alcoólica ou droga a criança ou adolescente", artigo: "Art. 243", diploma: ECA,
      ref: "Art. 243 - L8069",
      pena: "detenção, de 2 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "vendeu cerveja bebida para menor bar festa cigarro",
      obs: "Ainda que gratuitamente. Aumento de 1/3 até a metade se o menor consome (parágrafo único, Lei 15.234/2025). Só se o fato não constitui crime mais grave.",
      texto:
        "Vender, fornecer, servir, ministrar ou entregar, ainda que " +
        "gratuitamente, de qualquer forma, a criança ou a adolescente, bebida " +
        "alcoólica ou, sem justa causa, outros produtos cujos componentes possam " +
        "causar dependência física ou psíquica:\n" +
        "Pena - detenção de 2 (dois) a 4 (quatro) anos, e multa, se o fato não " +
        "constitui crime mais grave.",
    },
    {
      fato: "Vender ou fornecer fogos de artifício a criança ou adolescente", artigo: "Art. 244", diploma: ECA,
      ref: "Art. 244 - L8069",
      pena: "detenção, de 6 meses a 2 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "rojão bomba foguete",
      texto:
        "Vender, fornecer ainda que gratuitamente ou entregar, de qualquer forma, " +
        "a criança ou adolescente fogos de estampido ou de artifício, exceto " +
        "aqueles que, pelo seu reduzido potencial, sejam incapazes de provocar " +
        "qualquer dano físico em caso de utilização indevida:\n" +
        "Pena - detenção de seis meses a dois anos, e multa.",
    },
    {
      fato: "Submeter criança ou adolescente à exploração sexual", artigo: "Art. 244-A", diploma: ECA,
      ref: "Art. 244-A - L8069",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "prostituição infantil exploração sexual",
      obs: "Hediondo pela Lei 15.487/2026, que tirou a palavra \"prostituição\" do tipo.",
      texto:
        "Submeter criança ou adolescente, como tais definidos no caput do art. 2º " +
        "desta Lei, à exploração sexual, se o fato não constituir crime mais " +
        "grave:\n" +
        "Pena – reclusão de quatro a dez anos e multa, além da perda de bens e " +
        "valores utilizados na prática criminosa em favor do Fundo dos Direitos " +
        "da Criança e do Adolescente da unidade da Federação (Estado ou Distrito " +
        "Federal) em que foi cometido o crime, ressalvado o direito de terceiro " +
        "de boa-fé.",
    },
    {
      fato: "Corrupção de menores", artigo: "Art. 244-B", diploma: ECA,
      ref: "Art. 244-B - L8069",
      pena: "reclusão, de 1 a 4 anos", acao: "incondicionada", jecrim: false,
      busca: "praticou crime com menor usou adolescente",
      obs: "Crime formal: não precisa provar que o menor foi corrompido (Súmula 500 do STJ). Aumento de 1/3 se a infração é hedionda (§ 2º).",
      texto:
        "Corromper ou facilitar a corrupção de menor de 18 (dezoito) anos, com " +
        "ele praticando infração penal ou induzindo-o a praticá-la:\n" +
        "Pena - reclusão, de 1 (um) a 4 (quatro) anos.",
    },
    {
      fato: "Deixar de comunicar o desaparecimento de criança ou adolescente", artigo: "Art. 244-C", diploma: ECA,
      ref: "Art. 244-C - L8069",
      pena: "reclusão, de 2 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "filho desaparecido não avisou a polícia",
      obs: "Pai, mãe ou responsável legal, de forma dolosa. Lei 14.811/2024.",
      texto:
        "Deixar o pai, a mãe ou o responsável legal, de forma dolosa, de " +
        "comunicar à autoridade pública o desaparecimento de criança ou " +
        "adolescente:\n" +
        "Pena - reclusão, de 2 (dois) a 4 (quatro) anos, e multa.",
    },
    {
      fato: "Descumprimento de medida protetiva em favor de criança ou adolescente", artigo: "Art. 25", diploma: HENRY,
      ref: "Art. 25 - L14344",
      pena: "detenção, de 3 meses a 2 anos", acao: "incondicionada", jecrim: false,
      fianca: "juiz",
      busca: "mpu medida protetiva descumpriu aproximou do filho da criança violência doméstica contra criança",
      obs: "Medida protetiva da Lei Henry Borel (violência doméstica e familiar contra criança ou adolescente). Independe da competência civil ou criminal do juiz que deferiu (§ 1º). No flagrante, só o juiz concede fiança (§ 2º). Sem Lei 9.099/1995: a medida protege criança ou adolescente (art. 226, § 1º, do ECA).",
      texto:
        "Descumprir decisão judicial que defere medida protetiva de urgência " +
        "prevista nesta Lei:\n" +
        "Pena - detenção, de 3 (três) meses a 2 (dois) anos.",
    },
    {
      fato: "Deixar de comunicar violência contra criança ou adolescente", artigo: "Art. 26", diploma: HENRY,
      ref: "Art. 26 - L14344",
      pena: "detenção, de 6 meses a 3 anos", acao: "incondicionada", jecrim: false,
      busca: "sabia da agressão e não denunciou omissão vizinho professor médico castigo físico",
      obs: "Violência, tratamento cruel ou degradante, castigo violento ou abandono de incapaz. Aumentada de metade se resulta lesão grave; triplicada se resulta morte (§ 1º). Em dobro se o omisso é ascendente, parente até o 3º grau, responsável, tutor, guardião, padrasto ou madrasta (§ 2º).",
      texto:
        "Deixar de comunicar à autoridade pública a prática de violência, de " +
        "tratamento cruel ou degradante ou de formas violentas de educação, " +
        "correção ou disciplina contra criança ou adolescente ou o abandono de " +
        "incapaz:\n" +
        "Pena - detenção, de 6 (seis) meses a 3 (três) anos.",
    },
  ]),

  // ======================================================================
  grupo("Drogas", [
  // ======================================================================
    {
      fato: "Porte de droga para consumo pessoal", artigo: "Art. 28",
      diploma: DROGAS,
      ref: "Art. 28 - L11343",
      pena: "advertência, prestação de serviços à comunidade ou medida educativa",
      acao: "outra", jecrim: true,
      prescricao: "2 anos",
      busca: "usuário maconha cocaína crack porte pequena quantidade",
      obs: "Não há pena privativa de liberdade. Termo circunstanciado. Maconha até 40 g ou seis plantas fêmeas: presume-se uso e é ilícito administrativo, não crime (STF, RE 635.659, Tema 506) — a presunção cede a indícios de comércio.",
      texto:
        "Quem adquirir, guardar, tiver em depósito, transportar ou trouxer " +
        "consigo, para consumo pessoal, drogas sem autorização ou em desacordo " +
        "com determinação legal ou regulamentar será submetido às seguintes " +
        "penas:\n" +
        "I - advertência sobre os efeitos das drogas;\n" +
        "II - prestação de serviços à comunidade;\n" +
        "III - medida educativa de comparecimento a programa ou curso educativo.",
    },
    {
      fato: "Cultivo de planta para consumo pessoal", artigo: "Art. 28, § 1º", diploma: DROGAS,
      ref: "Art. 28, §1 - L11343",
      pena: "advertência, prestação de serviços à comunidade ou medida educativa",
      acao: "outra", jecrim: true,
      prescricao: "2 anos",
      busca: "pé de maconha plantou em casa",
      obs: "Maconha até seis plantas fêmeas: ilícito administrativo (STF, Tema 506).",
      texto:
        "§ 1º Às mesmas medidas submete-se quem, para seu consumo pessoal, " +
        "semeia, cultiva ou colhe plantas destinadas à preparação de pequena " +
        "quantidade de substância ou produto capaz de causar dependência física " +
        "ou psíquica.",
    },
    {
      fato: "Tráfico de drogas", artigo: "Art. 33", diploma: DROGAS,
      ref: "Art. 33 - L11343",
      pena: "reclusão, de 5 a 15 anos, e 500 a 1.500 dias-multa", acao: "incondicionada", jecrim: false,
      marcas: ["equiparado"],
      busca: "tráfico vender droga boca de fumo entorpecente",
      obs: "Privilegiado (§ 4º): redução de 1/6 a 2/3 para primário, de bons antecedentes, sem organização criminosa — e aí não é equiparado a hediondo. Aumentos de 1/6 a 2/3 do art. 40 (escola, presídio, arma, criança…). Em dobro por integrante de facção (art. 40-A, Lei 15.358/2026). Com arma de fogo, soma-se a pena do crime da arma (art. 40-A, parágrafo único).",
      texto:
        "Importar, exportar, remeter, preparar, produzir, fabricar, adquirir, " +
        "vender, expor à venda, oferecer, ter em depósito, transportar, trazer " +
        "consigo, guardar, prescrever, ministrar, entregar a consumo ou fornecer " +
        "drogas, ainda que gratuitamente, sem autorização ou em desacordo com " +
        "determinação legal ou regulamentar:\n" +
        "Pena - reclusão de 5 (cinco) a 15 (quinze) anos e pagamento de 500 " +
        "(quinhentos) a 1.500 (mil e quinhentos) dias-multa.",
    },
    {
      fato: "Tráfico — matéria-prima, cultivo ou uso de local", artigo: "Art. 33, § 1º", diploma: DROGAS,
      ref: "Art. 33, §1 - L11343",
      pena: "reclusão, de 5 a 15 anos, e 500 a 1.500 dias-multa", acao: "incondicionada", jecrim: false,
      marcas: ["equiparado"],
      busca: "plantação insumo laboratório cedeu a casa para o tráfico policial disfarçado",
      obs: "Matéria-prima ou insumo (I), cultivo ou colheita (II), local usado ou cedido para o tráfico (III) ou venda a policial disfarçado, havendo indícios de conduta criminal preexistente (IV).",
      texto:
        "§ 1º Nas mesmas penas incorre quem:\n" +
        "I - importa, exporta, remete, produz, fabrica, adquire, vende, expõe à " +
        "venda, oferece, fornece, tem em depósito, transporta, traz consigo ou " +
        "guarda, ainda que gratuitamente, sem autorização ou em desacordo com " +
        "determinação legal ou regulamentar, matéria-prima, insumo ou produto " +
        "químico destinado à preparação de drogas;\n" +
        "II - semeia, cultiva ou faz a colheita, sem autorização ou em desacordo " +
        "com determinação legal ou regulamentar, de plantas que se constituam em " +
        "matéria-prima para a preparação de drogas;\n" +
        "III - utiliza local ou bem de qualquer natureza de que tem a " +
        "propriedade, posse, administração, guarda ou vigilância, ou consente que " +
        "outrem dele se utilize, ainda que gratuitamente, sem autorização ou em " +
        "desacordo com determinação legal ou regulamentar, para o tráfico ilícito " +
        "de drogas.\n" +
        "IV - vende ou entrega drogas ou matéria-prima, insumo ou produto químico " +
        "destinado à preparação de drogas, sem autorização ou em desacordo com a " +
        "determinação legal ou regulamentar, a agente policial disfarçado, quando " +
        "presentes elementos probatórios razoáveis de conduta criminal " +
        "preexistente.",
    },
    {
      fato: "Induzir, instigar ou auxiliar alguém ao uso de droga", artigo: "Art. 33, § 2º", diploma: DROGAS,
      ref: "Art. 33, §2 - L11343",
      pena: "detenção, de 1 a 3 anos, e 100 a 300 dias-multa", acao: "incondicionada", jecrim: false,
      busca: "incentivou a usar",
      texto:
        "§ 2º Induzir, instigar ou auxiliar alguém ao uso indevido de droga:\n" +
        "Pena - detenção, de 1 (um) a 3 (três) anos, e multa de 100 (cem) a 300 " +
        "(trezentos) dias-multa.",
    },
    {
      fato: "Oferecer droga eventualmente, sem lucro, para consumo conjunto", artigo: "Art. 33, § 3º", diploma: DROGAS,
      ref: "Art. 33, §3 - L11343",
      pena: "detenção, de 6 meses a 1 ano, e 700 a 1.500 dias-multa", acao: "incondicionada", jecrim: true,
      busca: "dividiu o baseado com amigo",
      obs: "Pessoa de seu relacionamento, para juntos consumirem. Sem prejuízo das penas do art. 28.",
      texto:
        "§ 3º Oferecer droga, eventualmente e sem objetivo de lucro, a pessoa de " +
        "seu relacionamento, para juntos a consumirem:\n" +
        "Pena - detenção, de 6 (seis) meses a 1 (um) ano, e pagamento de 700 " +
        "(setecentos) a 1.500 (mil e quinhentos) dias-multa, sem prejuízo das " +
        "penas previstas no art. 28.",
    },
    {
      fato: "Maquinário ou objeto para fabricar droga", artigo: "Art. 34", diploma: DROGAS,
      ref: "Art. 34 - L11343",
      pena: "reclusão, de 3 a 10 anos, e 1.200 a 2.000 dias-multa", acao: "incondicionada", jecrim: false,
      marcas: ["inafiancavel"],
      busca: "prensa balança laboratório refino",
      texto:
        "Fabricar, adquirir, utilizar, transportar, oferecer, vender, distribuir, " +
        "entregar a qualquer título, possuir, guardar ou fornecer, ainda que " +
        "gratuitamente, maquinário, aparelho, instrumento ou qualquer objeto " +
        "destinado à fabricação, preparação, produção ou transformação de drogas, " +
        "sem autorização ou em desacordo com determinação legal ou regulamentar:\n" +
        "Pena - reclusão, de 3 (três) a 10 (dez) anos, e pagamento de 1.200 (mil " +
        "e duzentos) a 2.000 (dois mil) dias-multa.",
    },
    {
      fato: "Associação para o tráfico", artigo: "Art. 35", diploma: DROGAS,
      ref: "Art. 35 - L11343",
      pena: "reclusão, de 3 a 10 anos, e 700 a 1.200 dias-multa", acao: "incondicionada", jecrim: false,
      marcas: ["inafiancavel"],
      busca: "associação duas ou mais pessoas tráfico",
      obs: "Duas ou mais pessoas, com estabilidade. Não é equiparado a hediondo (STJ). Inafiançável pelo art. 44.",
      texto:
        "Associarem-se duas ou mais pessoas para o fim de praticar, " +
        "reiteradamente ou não, qualquer dos crimes previstos nos arts. 33, caput " +
        "e § 1º , e 34 desta Lei:\n" +
        "Pena - reclusão, de 3 (três) a 10 (dez) anos, e pagamento de 700 " +
        "(setecentos) a 1.200 (mil e duzentos) dias-multa.",
    },
    {
      fato: "Financiar ou custear o tráfico", artigo: "Art. 36", diploma: DROGAS,
      ref: "Art. 36 - L11343",
      pena: "reclusão, de 8 a 20 anos, e 1.500 a 4.000 dias-multa", acao: "incondicionada", jecrim: false,
      marcas: ["inafiancavel"],
      busca: "financiador investidor",
      texto:
        "Financiar ou custear a prática de qualquer dos crimes previstos nos " +
        "arts. 33, caput e § 1º , e 34 desta Lei:\n" +
        "Pena - reclusão, de 8 (oito) a 20 (vinte) anos, e pagamento de 1.500 " +
        "(mil e quinhentos) a 4.000 (quatro mil) dias-multa.",
    },
    {
      fato: "Colaborar como informante com o tráfico", artigo: "Art. 37", diploma: DROGAS,
      ref: "Art. 37 - L11343",
      pena: "reclusão, de 2 a 6 anos, e 300 a 700 dias-multa", acao: "incondicionada", jecrim: false,
      marcas: ["inafiancavel"],
      busca: "olheiro fogueteiro avisou a chegada da polícia",
      texto:
        "Colaborar, como informante, com grupo, organização ou associação " +
        "destinados à prática de qualquer dos crimes previstos nos arts. 33, " +
        "caput e § 1º , e 34 desta Lei:\n" +
        "Pena - reclusão, de 2 (dois) a 6 (seis) anos, e pagamento de 300 " +
        "(trezentos) a 700 (setecentos) dias-multa.",
    },
    {
      fato: "Prescrever ou ministrar droga culposamente", artigo: "Art. 38", diploma: DROGAS,
      ref: "Art. 38 - L11343",
      pena: "detenção, de 6 meses a 2 anos, e 50 a 200 dias-multa", acao: "incondicionada", jecrim: true,
      busca: "médico farmacêutico dose excessiva receita",
      texto:
        "Prescrever ou ministrar, culposamente, drogas, sem que delas necessite o " +
        "paciente, ou fazê-lo em doses excessivas ou em desacordo com " +
        "determinação legal ou regulamentar:\n" +
        "Pena - detenção, de 6 (seis) meses a 2 (dois) anos, e pagamento de 50 " +
        "(cinqüenta) a 200 (duzentos) dias-multa.",
    },
  ]),

  // ======================================================================
  grupo("Armas", [
  // ======================================================================
    {
      fato: "Posse irregular de arma de fogo de uso permitido", artigo: "Art. 12",
      diploma: ARMAS,
      ref: "Art. 12 - L10826",
      pena: "detenção, de 1 a 3 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "arma em casa sem registro revólver guardado",
      obs: "Posse é dentro de casa ou no local de trabalho (sendo o titular); fora disso é porte (art. 14). Aumento de 2/3 se ligada ao tráfico (art. 21-A, Lei 15.358/2026).",
      texto:
        "Possuir ou manter sob sua guarda arma de fogo, acessório ou munição, de " +
        "uso permitido, em desacordo com determinação legal ou regulamentar, no " +
        "interior de sua residência ou dependência desta, ou, ainda no seu local " +
        "de trabalho, desde que seja o titular ou o responsável legal do " +
        "estabelecimento ou empresa:\n" +
        "Pena – detenção, de 1 (um) a 3 (três) anos, e multa.",
    },
    {
      fato: "Omissão de cautela (menor ou deficiente se apodera de arma)", artigo: "Art. 13", diploma: ARMAS,
      ref: "Art. 13 - L10826",
      pena: "detenção, de 1 a 2 anos, e multa", acao: "incondicionada", jecrim: true,
      busca: "criança pegou a arma do pai",
      obs: "Deixar de comunicar à polícia, em 24 h, perda, furto ou roubo de arma também é crime (parágrafo único, para proprietário ou diretor de empresa de segurança).",
      texto:
        "Deixar de observar as cautelas necessárias para impedir que menor de 18 " +
        "(dezoito) anos ou pessoa portadora de deficiência mental se apodere de " +
        "arma de fogo que esteja sob sua posse ou que seja de sua propriedade:\n" +
        "Pena – detenção, de 1 (um) a 2 (dois) anos, e multa.",
    },
    {
      fato: "Porte ilegal de arma de fogo de uso permitido", artigo: "Art. 14",
      diploma: ARMAS,
      ref: "Art. 14 - L10826",
      pena: "reclusão, de 2 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "arma na cintura no carro munição",
      obs: "Também munição ou acessório. A inafiançabilidade do parágrafo único caiu no STF (ADI 3.112). Aumento de 2/3 se ligada ao tráfico (art. 21-A).",
      texto:
        "Portar, deter, adquirir, fornecer, receber, ter em depósito, " +
        "transportar, ceder, ainda que gratuitamente, emprestar, remeter, " +
        "empregar, manter sob guarda ou ocultar arma de fogo, acessório ou " +
        "munição, de uso permitido, sem autorização e em desacordo com " +
        "determinação legal ou regulamentar:\n" +
        "Pena – reclusão, de 2 (dois) a 4 (quatro) anos, e multa.",
    },
    {
      fato: "Disparo de arma de fogo", artigo: "Art. 15", diploma: ARMAS,
      ref: "Art. 15 - L10826",
      pena: "reclusão, de 2 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "tiro para o alto disparou em via pública",
      obs: "Em lugar habitado ou adjacências, em via pública ou em direção a ela, se não tiver por finalidade outro crime.",
      texto:
        "Disparar arma de fogo ou acionar munição em lugar habitado ou em suas " +
        "adjacências, em via pública ou em direção a ela, desde que essa conduta " +
        "não tenha como finalidade a prática de outro crime:\n" +
        "Pena – reclusão, de 2 (dois) a 4 (quatro) anos, e multa.",
    },
    {
      fato: "Posse ou porte de arma de fogo de uso restrito", artigo: "Art. 16", diploma: ARMAS,
      ref: "Art. 16 - L10826",
      pena: "reclusão, de 3 a 6 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "calibre restrito pistola .40 9mm",
      obs: "Aumento de 2/3 se ligada ao tráfico (art. 21-A).",
      texto:
        "Possuir, deter, portar, adquirir, fornecer, receber, ter em depósito, " +
        "transportar, ceder, ainda que gratuitamente, emprestar, remeter, " +
        "empregar, manter sob sua guarda ou ocultar arma de fogo, acessório ou " +
        "munição de uso restrito, sem autorização e em desacordo com determinação " +
        "legal ou regulamentar:\n" +
        "Pena – reclusão, de 3 (três) a 6 (seis) anos, e multa.",
    },
    {
      fato: "Artefato explosivo ou incendiário", artigo: "Art. 16, § 1º, III", diploma: ARMAS,
      ref: "Art. 16, §1, III - L10826",
      pena: "reclusão, de 3 a 6 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "bomba caseira coquetel molotov explosivo dinamite artefato",
      obs: "Possuir, deter, fabricar ou empregar, sem autorização. Explosivo para facção é o art. 3º, III, da Lei 15.358/2026.",
      texto:
        "§ 1º Nas mesmas penas incorre quem:\n" +
        "III – possuir, detiver, fabricar ou empregar artefato explosivo ou " +
        "incendiário, sem autorização ou em desacordo com determinação legal ou " +
        "regulamentar;",
    },
    {
      fato: "Arma com numeração raspada ou suprimida", artigo: "Art. 16, § 1º, IV", diploma: ARMAS,
      ref: "Art. 16, §1, IV - L10826",
      pena: "reclusão, de 3 a 6 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "numeração raspada lixada adulterada",
      obs: "Mesma pena para arma de qualquer calibre. Não é hediondo (STJ).",
      texto:
        "§ 1º Nas mesmas penas incorre quem:\n" +
        "IV – portar, possuir, adquirir, transportar ou fornecer arma de fogo com " +
        "numeração, marca ou qualquer outro sinal de identificação raspado, " +
        "suprimido ou adulterado;",
    },
    {
      fato: "Posse ou porte de arma de fogo de uso proibido", artigo: "Art. 16, § 2º", diploma: ARMAS,
      ref: "Art. 16, §2 - L10826",
      pena: "reclusão, de 4 a 12 anos", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "fuzil automático granada",
      texto:
        "§ 2º Se as condutas descritas no caput e no § 1º deste artigo envolverem " +
        "arma de fogo de uso proibido, a pena é de reclusão, de 4 (quatro) a 12 " +
        "(doze) anos.",
    },
    {
      fato: "Comércio ilegal de arma de fogo", artigo: "Art. 17", diploma: ARMAS,
      ref: "Art. 17 - L10826",
      pena: "reclusão, de 6 a 12 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "vendia armas munição",
      texto:
        "Adquirir, alugar, receber, transportar, conduzir, ocultar, ter em " +
        "depósito, desmontar, montar, remontar, adulterar, vender, expor à venda, " +
        "ou de qualquer forma utilizar, em proveito próprio ou alheio, no " +
        "exercício de atividade comercial ou industrial, arma de fogo, acessório " +
        "ou munição, sem autorização ou em desacordo com determinação legal ou " +
        "regulamentar:\n" +
        "Pena - reclusão, de 6 (seis) a 12 (doze) anos, e multa.",
    },
    {
      fato: "Tráfico internacional de arma de fogo", artigo: "Art. 18", diploma: ARMAS,
      ref: "Art. 18 - L10826",
      pena: "reclusão, de 8 a 16 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "trouxe arma do Paraguai fronteira",
      texto:
        "Importar, exportar, favorecer a entrada ou saída do território nacional, " +
        "a qualquer título, de arma de fogo, acessório ou munição, sem " +
        "autorização da autoridade competente:\n" +
        "Pena - reclusão, de 8 (oito) a 16 (dezesseis) anos, e multa.",
    },
  ]),

  // ======================================================================
  grupo("Facções, milícias e crime organizado", [
  // ======================================================================
    {
      fato: "Domínio social estruturado (facção, milícia ou grupo paramilitar)", artigo: "Art. 2º", diploma: FACCOES,
      ref: "Art. 2 - L15358",
      pena: "reclusão, de 20 a 40 anos, além das penas da ameaça, da violência e dos outros crimes",
      acao: "incondicionada", jecrim: false, marcas: ["hediondo"],
      busca: "facção controle do território toque de recolher barricada ataque a presídio ônibus incendiado taxa de proteção cobrança do tráfico milícia",
      obs: "Integrante de facção, milícia ou grupo paramilitar que pratica uma das condutas dos incisos I a X. Facção é o grupo de 3 ou mais pessoas que usa violência, ameaça ou coação para controle territorial ou social (§ 2º). As condutas: intimidar a população para controlar o território, barricadas contra a polícia, impor controle a comércio e serviços, atacar presídios, incendiar ou saquear veículos, sabotar serviços essenciais… Aumento de 2/3 ao dobro para liderança, financiamento, arma restrita, uso de criança ou adolescente (§ 1º). Atos preparatórios: pena do consumado reduzida de 1/3 à metade (§ 5º). Sem fiança, graça, anistia, indulto ou livramento condicional (§ 4º). Lei 15.358/2026.",
      texto:
        "Constitui crime, independentemente de suas razões ou motivações, a " +
        "prática, por integrante de organização criminosa ultraviolenta, grupo " +
        "paramilitar ou milícia privada, nos termos do § 2º deste artigo, de " +
        "qualquer das seguintes condutas:\n" +
        "I - utilizar violência ou grave ameaça para intimidar, coagir ou " +
        "constranger a população ou agentes públicos, com o propósito de impor ou " +
        "exercer o controle, o domínio ou a influência, total ou parcial, sobre " +
        "áreas geográficas, comunidades ou territórios;\n" +
        "II - empregar ou ameaçar por meio da utilização de armas de fogo, " +
        "explosivos, gases tóxicos, venenos, agentes biológicos, químicos ou " +
        "nucleares, expondo a perigo a paz e a incolumidade pública;\n" +
        "III - impedir, dificultar, obstruir ou criar embaraços à atuação das " +
        "forças de segurança pública, à perseguição policial ou às operações de " +
        "manutenção da ordem, mediante a colocação de barricadas, bloqueios, " +
        "obstáculos físicos, incêndios, destruição de vias, uso de artefatos ou " +
        "qualquer outro meio destinado a restringir o deslocamento, a " +
        "visibilidade ou a ação policial;\n" +
        "IV - impor, mediante violência ou grave ameaça, qualquer tipo de " +
        "controle social para o exercício de atividade econômica, comercial, de " +
        "serviços públicos ou comunitários;\n" +
        "V - usar explosivos, armas de fogo ou equipamentos para prática de " +
        "crimes contra instituições financeiras de qualquer natureza, base de " +
        "valores ou carros-fortes ou para interromper, total ou parcialmente, " +
        "fluxo terrestre, aéreo ou aquaviário, com o objetivo de obstruir, " +
        "dificultar ou postergar a atuação preventiva ou repressiva do Estado;\n" +
        "VI - promover ataques, com violência ou grave ameaça, contra " +
        "instituições prisionais;\n" +
        "VII - apoderar-se ilicitamente de meios de transporte ou danificá-los, " +
        "depredá-los, incendiá-los, destruí-los, saqueá-los, explodi-los ou " +
        "inutilizá-los, total ou parcialmente;\n" +
        "VIII - apoderar-se ilicitamente de aeronaves ou sabotá-las, expondo a " +
        "perigo a vida ou a integridade física de uma ou mais pessoas ou " +
        "comprometendo a segurança da aviação civil;\n" +
        "IX - apoderar-se do funcionamento, sabotá-lo ou inutilizá-lo, total ou " +
        "parcialmente, ainda que de modo temporário, de portos, aeroportos, " +
        "estações e linhas férreas ou rodoviárias, hospitais, casas de saúde, " +
        "escolas, estádios esportivos, instalações públicas ou locais onde " +
        "funcionem serviços públicos essenciais, instalações de geração, " +
        "transmissão ou distribuição de energia, unidades militares ou " +
        "instalações de exploração, refino e processamento de petróleo e gás;\n" +
        "X - interromper, danificar, perturbar ou dificultar o restabelecimento " +
        "dos bancos de dados públicos, bem como dos serviços informático, " +
        "telegráfico, radiotelegráfico, telefônico ou telemático governamentais " +
        "ou de interesse coletivo, com o fim de desorientar o funcionamento, " +
        "subtrair informações sigilosas ou obter vantagem de qualquer natureza.\n" +
        "Pena - reclusão, de 20 (vinte) a 40 (quarenta) anos, sem prejuízo das " +
        "sanções correspondentes à ameaça, à violência ou a de outros crimes " +
        "previstos na legislação penal.",
    },
    {
      fato: "Favorecimento ao domínio social estruturado", artigo: "Art. 3º", diploma: FACCOES,
      ref: "Art. 3 - L15358",
      pena: "reclusão, de 12 a 20 anos, e multa", acao: "incondicionada", jecrim: false, marcas: ["hediondo"],
      busca: "aderiu à facção apoiou a facção olheiro guardou arma da facção cedeu a casa salve",
      obs: "Fundar, aderir ou apoiar a facção (I); incitar publicamente a seus atos (II); armas e explosivos para eles (III); ceder local (IV); dar informações (V). Alegar falsamente pertencer a facção é o inciso VI. Lei 15.358/2026.",
      texto:
        "Constitui crime a prática das seguintes condutas:\n" +
        "I - promover ou fundar organização criminosa ultraviolenta, grupo " +
        "paramilitar ou milícia privada ou a eles aderir, assim como apoiá-los de " +
        "qualquer forma;\n" +
        "II - distribuir, ou tornar disponível ao público, material que contenha " +
        "mensagem com a intenção de incitar outrem a cometer ato previsto no art. " +
        "2º desta Lei;\n" +
        "III - adquirir, importar, exportar, preparar, produzir, manter em " +
        "depósito ou remeter material explosivo ou arma de fogo para a prática de " +
        "ato previsto no art. 2º desta Lei;\n" +
        "IV - utilizar local ou bem de qualquer natureza de que tem a " +
        "propriedade, posse, administração, guarda ou vigilância ou consentir que " +
        "outrem dele se utilize, para cometer ato previsto no art. 2º desta Lei;\n" +
        "V - fornecer informações em apoio a organização criminosa ultraviolenta, " +
        "grupo paramilitar ou milícia privada que pratique ato previsto no art. " +
        "2º desta Lei;\n" +
        "VI - alegar falsamente pertencer a organização criminosa ultraviolenta, " +
        "grupo paramilitar ou milícia privada que pratique ato previsto no art. " +
        "2º desta Lei, com o fim de obter qualquer tipo de vantagem ou de " +
        "intimidar terceiros.\n" +
        "Pena - reclusão, de 12 (doze) a 20 (vinte) anos, e multa.",
    },
    {
      fato: "Alegar falsamente pertencer a facção para obter vantagem ou intimidar", artigo: "Art. 3º, VI", diploma: FACCOES,
      ref: "Art. 3, VI - L15358",
      pena: "reclusão, de 12 a 20 anos, e multa", acao: "incondicionada", jecrim: false, marcas: ["hediondo"],
      busca: "disse que era da facção do comando se passou por faccionado ameaçou em nome da facção golpe",
      obs: "Basta alegar falsamente pertencer a facção, milícia ou grupo paramilitar, com o fim de obter vantagem ou de intimidar. A ameaça feita por quem de fato atua para a facção é o art. 147-C do CP. Lei 15.358/2026.",
      texto:
        "Constitui crime a prática das seguintes condutas:\n" +
        "VI - alegar falsamente pertencer a organização criminosa ultraviolenta, " +
        "grupo paramilitar ou milícia privada que pratique ato previsto no art. " +
        "2º desta Lei, com o fim de obter qualquer tipo de vantagem ou de " +
        "intimidar terceiros.\n" +
        "Pena - reclusão, de 12 (doze) a 20 (vinte) anos, e multa.",
    },
    {
      fato: "Constituição de milícia privada", artigo: "Art. 288-A", diploma: CP,
      ref: "Art. 288-A - DL2848",
      pena: "reclusão, de 4 a 8 anos", acao: "incondicionada", jecrim: false,
      busca: "milícia grupo paramilitar esquadrão segurança clandestina extorsão de moradores",
      obs: "Constituir, organizar, integrar, manter ou custear, para praticar crimes do Código Penal. Forma especial de organização criminosa (art. 4º, parágrafo único, da Lei 15.358/2026).",
      texto:
        "Constituir, organizar, integrar, manter ou custear organização " +
        "paramilitar, milícia particular, grupo ou esquadrão com a finalidade de " +
        "praticar qualquer dos crimes previstos neste Código:\n" +
        "Pena - reclusão, de 4 (quatro) a 8 (oito) anos.",
    },
  ]),

  // ======================================================================
  grupo("Trânsito", [
  // ======================================================================
    {
      fato: "Homicídio culposo na direção de veículo", artigo: "Art. 302",
      diploma: CTB,
      ref: "Art. 302 - L9503",
      pena: "detenção, de 2 a 4 anos, e suspensão da habilitação",
      acao: "incondicionada", jecrim: false,
      busca: "acidente com morte atropelamento fatal",
      obs: "Aumento de 1/3 à metade sem habilitação, na faixa de pedestres ou na calçada, com omissão de socorro ou no transporte de passageiros (§ 1º). Quem presta pronto e integral socorro à vítima não é preso em flagrante nem paga fiança (art. 301).",
      orientacoes: "transito",
      texto:
        "Praticar homicídio culposo na direção de veículo automotor:\n" +
        "Penas - detenção, de dois a quatro anos, e suspensão ou proibição de se " +
        "obter a permissão ou a habilitação para dirigir veículo automotor.",
    },
    {
      fato: "Homicídio culposo no trânsito sob influência de álcool ou droga", artigo: "Art. 302, § 3º", diploma: CTB,
      ref: "Art. 302, §3 - L9503",
      pena: "reclusão, de 5 a 8 anos, e suspensão da habilitação", acao: "incondicionada", jecrim: false,
      busca: "motorista bêbado matou embriagado atropelou",
      orientacoes: "transito",
      texto:
        "§ 3º Se o agente conduz veículo automotor sob a influência de álcool ou " +
        "de qualquer outra substância psicoativa que determine dependência:\n" +
        "Penas - reclusão, de cinco a oito anos, e suspensão ou proibição do " +
        "direito de se obter a permissão ou a habilitação para dirigir veículo " +
        "automotor.",
    },
    {
      fato: "Lesão corporal culposa na direção de veículo", artigo: "Art. 303",
      diploma: CTB,
      ref: "Art. 303 - L9503",
      pena: "detenção, de 6 meses a 2 anos, e suspensão da habilitação",
      acao: "condicionada", jecrim: true,
      busca: "acidente atropelamento colisão com ferido",
      obs: "A representação cai (e a Lei 9.099 deixa de se aplicar) se houver álcool, racha ou velocidade 50 km/h acima da via — art. 291, § 1º; aí se instaura inquérito (§ 2º). Quem presta pronto e integral socorro não é preso em flagrante nem paga fiança (art. 301).",
      orientacoes: "transito",
      texto:
        "Praticar lesão corporal culposa na direção de veículo automotor:\n" +
        "Penas - detenção, de seis meses a dois anos e suspensão ou proibição de " +
        "se obter a permissão ou a habilitação para dirigir veículo automotor.",
    },
    {
      fato: "Lesão grave no trânsito sob influência de álcool ou droga", artigo: "Art. 303, § 2º", diploma: CTB,
      ref: "Art. 303, §2 - L9503",
      pena: "reclusão, de 2 a 5 anos, e suspensão da habilitação", acao: "incondicionada", jecrim: false,
      busca: "bêbado feriu gravemente",
      obs: "Lesão grave ou gravíssima.",
      orientacoes: "transito",
      texto:
        "§ 2º A pena privativa de liberdade é de reclusão de dois a cinco anos, " +
        "sem prejuízo das outras penas previstas neste artigo, se o agente conduz " +
        "o veículo com capacidade psicomotora alterada em razão da influência de " +
        "álcool ou de outra substância psicoativa que determine dependência, e se " +
        "do crime resultar lesão corporal de natureza grave ou gravíssima.",
    },
    {
      fato: "Omissão de socorro no trânsito", artigo: "Art. 304", diploma: CTB,
      ref: "Art. 304 - L9503",
      pena: "detenção, de 6 meses a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
      busca: "não socorreu a vítima do acidente",
      obs: "Do condutor envolvido no acidente, sem culpa. Se houve culpa, é causa de aumento dos arts. 302 e 303.",
      orientacoes: "transito",
      texto:
        "Deixar o condutor do veículo, na ocasião do sinistro, de prestar " +
        "imediato socorro à vítima, ou, não podendo fazê-lo diretamente, por " +
        "justa causa, deixar de solicitar auxílio da autoridade pública:\n" +
        "Penas - detenção, de seis meses a um ano, ou multa, se o fato não " +
        "constituir elemento de crime mais grave.",
    },
    {
      fato: "Fuga do local do acidente", artigo: "Art. 305", diploma: CTB,
      ref: "Art. 305 - L9503",
      pena: "detenção, de 6 meses a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
      busca: "evadiu-se atropelou e fugiu bateu e fugiu",
      obs: "Constitucional (STF, RE 971.959).",
      orientacoes: "transito",
      texto:
        "Afastar-se o condutor do veículo do local do sinistro, para fugir à " +
        "responsabilidade penal ou civil que lhe possa ser atribuída:\n" +
        "Penas - detenção, de seis meses a um ano, ou multa.",
    },
    {
      fato: "Embriaguez ao volante", artigo: "Art. 306", diploma: CTB,
      ref: "Art. 306 - L9503",
      pena: "detenção, de 6 meses a 3 anos, multa e suspensão da habilitação",
      acao: "incondicionada", jecrim: false,
      busca: "bafômetro alcoolizado dirigindo bêbado teste recusa etilômetro",
      obs: "Configura-se com 6 dg/L de álcool no sangue, 0,3 mg/L no ar alveolar ou sinais de alteração da capacidade psicomotora.",
      orientacoes: "transito",
      texto:
        "Conduzir veículo automotor com capacidade psicomotora alterada em razão " +
        "da influência de álcool ou de outra substância psicoativa que determine " +
        "dependência:\n" +
        "Penas - detenção, de seis meses a três anos, multa e suspensão ou " +
        "proibição de se obter a permissão ou a habilitação para dirigir veículo " +
        "automotor.",
    },
    {
      fato: "Dirigir com a habilitação suspensa ou proibida", artigo: "Art. 307", diploma: CTB,
      ref: "Art. 307 - L9503",
      pena: "detenção, de 6 meses a 1 ano, e multa", acao: "incondicionada", jecrim: true,
      busca: "cnh suspensa cassada dirigindo",
      orientacoes: "transito",
      texto:
        "Violar a suspensão ou a proibição de se obter a permissão ou a " +
        "habilitação para dirigir veículo automotor imposta com fundamento neste " +
        "Código:\n" +
        "Penas - detenção, de seis meses a um ano e multa, com nova imposição " +
        "adicional de idêntico prazo de suspensão ou de proibição.",
    },
    {
      fato: "Racha (disputa de corrida)", artigo: "Art. 308", diploma: CTB,
      ref: "Art. 308 - L9503",
      pena: "detenção, de 6 meses a 3 anos, multa e suspensão", acao: "incondicionada", jecrim: false,
      busca: "pega racha corrida na via manobra exibição",
      obs: "Lesão grave (§ 1º): reclusão, de 3 a 6 anos. Morte (§ 2º): reclusão, de 5 a 10 anos.",
      orientacoes: "transito",
      texto:
        "Participar, na direção de veículo automotor, em via pública, de corrida, " +
        "disputa ou competição automobilística ou ainda de exibição ou " +
        "demonstração de perícia em manobra de veículo automotor, não autorizada " +
        "pela autoridade competente, gerando situação de risco à incolumidade " +
        "pública ou privada:\n" +
        "Penas - detenção, de 6 (seis) meses a 3 (três) anos, multa e suspensão " +
        "ou proibição de se obter a permissão ou a habilitação para dirigir " +
        "veículo automotor.",
    },
    {
      fato: "Dirigir sem habilitação gerando perigo de dano", artigo: "Art. 309",
      diploma: CTB,
      ref: "Art. 309 - L9503",
      pena: "detenção, de 6 meses a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
      busca: "sem carteira sem cnh inabilitado",
      obs: "Sem o perigo de dano concreto, é infração administrativa, não crime.",
      orientacoes: "transito",
      texto:
        "Dirigir veículo automotor, em via pública, sem a devida Permissão para " +
        "Dirigir ou Habilitação ou, ainda, se cassado o direito de dirigir, " +
        "gerando perigo de dano:\n" +
        "Penas - detenção, de seis meses a um ano, ou multa.",
    },
    {
      fato: "Entregar veículo a pessoa não habilitada", artigo: "Art. 310",
      diploma: CTB,
      ref: "Art. 310 - L9503",
      pena: "detenção, de 6 meses a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
      busca: "emprestou o carro ao filho menor sem carteira embriagado",
      obs: "Também a quem está com a habilitação suspensa, embriagado ou sem condições. Crime de perigo abstrato (Súmula 575 do STJ).",
      orientacoes: "transito",
      texto:
        "Permitir, confiar ou entregar a direção de veículo automotor a pessoa " +
        "não habilitada, com habilitação cassada ou com o direito de dirigir " +
        "suspenso, ou, ainda, a quem, por seu estado de saúde, física ou mental, " +
        "ou por embriaguez, não esteja em condições de conduzi-lo com segurança:\n" +
        "Penas - detenção, de seis meses a um ano, ou multa.",
    },
    {
      fato: "Velocidade incompatível perto de escola, hospital ou aglomeração", artigo: "Art. 311", diploma: CTB,
      ref: "Art. 311 - L9503",
      pena: "detenção, de 6 meses a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
      busca: "alta velocidade em frente à escola",
      obs: "Gerando perigo de dano.",
      orientacoes: "transito",
      texto:
        "Trafegar em velocidade incompatível com a segurança nas proximidades de " +
        "escolas, hospitais, estações de embarque e desembarque de passageiros, " +
        "logradouros estreitos, ou onde haja grande movimentação ou concentração " +
        "de pessoas, gerando perigo de dano:\n" +
        "Penas - detenção, de seis meses a um ano, ou multa.",
    },
    {
      fato: "Inovação artificiosa em sinistro de trânsito com vítima", artigo: "Art. 312", diploma: CTB,
      ref: "Art. 312 - L9503",
      pena: "detenção, de 6 meses a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
      busca: "mexeu no carro tirou o veículo do local alterou a cena do acidente trocou o motorista",
      obs: "Alterar o estado de lugar, coisa ou pessoa para induzir a erro o policial, o perito ou o juiz, ainda que o procedimento não tenha começado (parágrafo único).",
      orientacoes: "transito",
      texto:
        "Inovar artificiosamente, em caso de sinistro automobilístico com vítima, " +
        "na pendência do respectivo procedimento policial preparatório, inquérito " +
        "policial ou processo penal, o estado de lugar, de coisa ou de pessoa, a " +
        "fim de induzir a erro o agente policial, o perito ou o juiz:\n" +
        "Penas - detenção, de seis meses a um ano, ou multa.",
    },
  ]),

  // ======================================================================
  grupo("Contravenções penais", [
  // ======================================================================
    {
      fato: "Porte de arma (branca)", artigo: "Art. 19", diploma: LCP,
      ref: "Art. 19 - DL3688",
      pena: "prisão simples, de 15 dias a 6 meses, ou multa, ou ambas", acao: "incondicionada", jecrim: true,
      busca: "faca canivete facão soco inglês arma branca",
      obs: "Arma de fogo é o Estatuto do Desarmamento. Contravenção: ação sempre pública incondicionada (art. 17).",
      texto:
        "Trazer consigo arma fora de casa ou de dependência desta, sem licença da " +
        "autoridade:\n" +
        "Pena – prisão simples, de quinze dias a seis meses, ou multa, de " +
        "duzentos mil réis a três contos de réis, ou ambas cumulativamente.",
    },
    {
      fato: "Vias de fato", artigo: "Art. 21", diploma: LCP,
      ref: "Art. 21 - DL3688",
      pena: "prisão simples, de 15 dias a 3 meses, ou multa", acao: "incondicionada", jecrim: true,
      busca: "empurrão tapa agressão sem lesão puxão de cabelo",
      obs: "Agressão que não deixa lesão constatada. Havendo lesão, é o art. 129 do CP. Vítima maior de 60: aumento de 1/3 até a metade (§ 1º).",
      orientacoes: "lesao",
      texto:
        "Praticar vias de fato contra alguem:\n" +
        "Pena – prisão simples, de quinze dias a três meses, ou multa, de cem mil " +
        "réis a um conto de réis, se o fato não constitue crime.",
    },
    {
      fato: "Vias de fato contra a mulher por razões da condição do sexo feminino", artigo: "Art. 21, § 2º", diploma: LCP,
      ref: "Art. 21, §2 - DL3688",
      pena: "prisão simples, de 45 dias a 9 meses, ou multa", acao: "incondicionada", jecrim: false,
      marcas: ["domestica"],
      busca: "empurrou a esposa tapa companheira puxão de cabelo maria da penha",
      obs: "Pena em triplo (Lei 14.994/2024). Não se soma a agravante de violência doméstica (STJ, Tema 1.333). " + VD_SEM_JECRIM,
      orientacoes: "violencia_domestica",
      texto:
        "§ 2º Se a contravenção é praticada contra a mulher por razões da " +
        "condição do sexo feminino, nos termos do § 1º do art. 121-A do " +
        "Decreto-Lei nº 2.848, de 7 de dezembro de 1940 (Código Penal), aplica-se " +
        "a pena em triplo.",
    },
    {
      fato: "Soltar fogos de artifício ou balão, ou deflagração perigosa, em lugar habitado ou via pública", artigo: "Art. 28, parágrafo único", diploma: LCP,
      ref: "Art. 28, p.u. - DL3688",
      pena: "prisão simples, de 15 dias a 2 meses, ou multa", acao: "incondicionada", jecrim: true,
      busca: "foguete rojão bomba fogos de artifício estouro soltou balão aceso",
      obs: "Sem licença da autoridade. Disparo de arma de fogo é o art. 15 do Estatuto do Desarmamento; balão que possa provocar incêndio é crime ambiental (art. 42 da Lei 9.605/1998).",
      texto:
        "Parágrafo único. Incorre na pena de prisão simples, de quinze dias a " +
        "dois meses, ou multa, de duzentos mil réis a dois contos de réis, quem, " +
        "em lugar habitado ou em suas adjacências, em via pública ou em direção a " +
        "ela, sem licença da autoridade, causa deflagração perigosa, queima fogo " +
        "de artifício ou solta balão aceso.",
    },
    {
      fato: "Omissão de cautela na guarda de animais", artigo: "Art. 31",
      diploma: LCP,
      ref: "Art. 31 - DL3688",
      pena: "prisão simples, de 10 dias a 2 meses, ou multa", acao: "incondicionada", jecrim: true,
      busca: "cachorro solto mordeu animal na rua pitbull",
      texto:
        "Deixar em liberdade, confiar à guarda de pessoa inexperiente, ou não " +
        "guardar com a devida cautela animal perigoso:\n" +
        "Pena – prisão simples, de dez dias a dois meses, ou multa, de cem mil " +
        "réis a um conto de réis.",
    },
    {
      fato: "Direção perigosa de veículo na via pública", artigo: "Art. 34", diploma: LCP,
      ref: "Art. 34 - DL3688",
      pena: "prisão simples, de 15 dias a 3 meses, ou multa", acao: "incondicionada", jecrim: true,
      busca: "zerinho cavalo de pau manobra perigosa empinar moto",
      obs: "Só quando o fato não se encaixa num crime do CTB.",
      texto:
        "Dirigir veículos na via pública, ou embarcações em águas públicas, pondo " +
        "em perigo a segurança alheia:\n" +
        "Pena – prisão simples, de quinze dias a três meses, ou multa, de " +
        "trezentos mil réis a dois contos de réis.",
    },
    {
      fato: "Falso alarma (trote)", artigo: "Art. 41", diploma: LCP,
      ref: "Art. 41 - DL3688",
      pena: "prisão simples, de 15 dias a 6 meses, ou multa", acao: "incondicionada", jecrim: true,
      busca: "trote ligação falsa bombeiros polícia samu ameaça de bomba falsa pânico tumulto",
      obs: "Anunciar desastre ou perigo inexistente, ou praticar ato capaz de produzir pânico ou tumulto. Comunicar crime que não aconteceu é o art. 340 do CP.",
      texto:
        "Provocar alarma, anunciando desastre ou perigo inexistente, ou praticar " +
        "qualquer ato capaz de produzir pânico ou tumulto:\n" +
        "Pena – prisão simples, de quinze dias a seis meses, ou multa, de " +
        "duzentos mil réis a dois contos de réis.",
    },
    {
      fato: "Perturbação do trabalho ou do sossego alheios", artigo: "Art. 42",
      diploma: LCP,
      ref: "Art. 42 - DL3688",
      pena: "prisão simples, de 15 dias a 3 meses, ou multa", acao: "incondicionada", jecrim: true,
      busca: "som alto barulho vizinho festa música madrugada latido",
      obs: "Gritaria ou algazarra, profissão ruidosa, instrumentos sonoros, ou barulho de animal sob sua guarda.",
      texto:
        "Perturbar alguem o trabalho ou o sossego alheios:\n" +
        "I – com gritaria ou algazarra;\n" +
        "II – exercendo profissão incômoda ou ruidosa, em desacordo com as " +
        "prescrições legais;\n" +
        "III – abusando de instrumentos sonoros ou sinais acústicos;\n" +
        "IV – provocando ou não procurando impedir barulho produzido por animal " +
        "de que tem a guarda:\n" +
        "Pena – prisão simples, de quinze dias a três meses, ou multa, de " +
        "duzentos mil réis a dois contos de réis.",
    },
    {
      fato: "Fingir-se funcionário público", artigo: "Art. 45", diploma: LCP,
      ref: "Art. 45 - DL3688",
      pena: "prisão simples, de 1 a 3 meses, ou multa", acao: "incondicionada", jecrim: true,
      busca: "se passou por policial fiscal falso agente disse que era servidor",
      obs: "Se chega a exercer a função, é usurpação (art. 328 do CP); se usa o fingimento para enganar e obter vantagem, é estelionato.",
      texto:
        "Fingir-se funcionário público:\n" +
        "Pena – prisão simples, de um a três meses, ou multa, de quinhentos mil " +
        "réis a três contos de réis.",
    },
    {
      fato: "Exercício ilegal de profissão ou atividade", artigo: "Art. 47", diploma: LCP,
      ref: "Art. 47 - DL3688",
      pena: "prisão simples, de 15 dias a 3 meses, ou multa", acao: "incondicionada", jecrim: true,
      busca: "falso advogado corretor sem registro sem habilitação profissional",
      obs: "Medicina, odontologia e farmácia são o art. 282 do CP.",
      texto:
        "Exercer profissão ou atividade econômica ou anunciar que a exerce, sem " +
        "preencher as condições a que por lei está subordinado o seu exercício:\n" +
        "Pena – prisão simples, de quinze dias a três meses, ou multa, de " +
        "quinhentos mil réis a cinco contos de réis.",
    },
    {
      fato: "Jogo de azar", artigo: "Art. 50", diploma: LCP,
      ref: "Art. 50 - DL3688",
      pena: "prisão simples, de 3 meses a 1 ano, e multa", acao: "incondicionada", jecrim: true,
      busca: "caça-níquel bingo cassino máquina",
      obs: "Jogo do bicho é o art. 58 do Dec.-Lei 6.259/1944.",
      texto:
        "Estabelecer ou explorar jogo de azar em lugar público ou acessivel ao " +
        "público, mediante o pagamento de entrada ou sem ele:\n" +
        "Pena – prisão simples, de três meses a um ano, e multa, de dois a quinze " +
        "contos de réis, estendendo-se os efeitos da condenação à perda dos " +
        "moveis e objetos de decoração do local.",
    },
    {
      fato: "Embriaguez", artigo: "Art. 62", diploma: LCP,
      ref: "Art. 62 - DL3688",
      pena: "prisão simples, de 15 dias a 3 meses, ou multa", acao: "incondicionada", jecrim: true,
      busca: "bêbado na rua causando escândalo",
      obs: "Em público, de modo que cause escândalo ou ponha em perigo a própria segurança ou a alheia.",
      texto:
        "Apresentar-se publicamente em estado de embriaguez, de modo que cause " +
        "escândalo ou ponha em perigo a segurança própria ou alheia:\n" +
        "Pena – prisão simples, de quinze dias a três meses, ou multa, de " +
        "duzentos mil réis a dois contos de réis.",
    },
    {
      fato: "Recusa de dados sobre a própria identidade", artigo: "Art. 68", diploma: LCP,
      ref: "Art. 68 - DL3688",
      pena: "multa", acao: "incondicionada", jecrim: true,
      prescricao: "2 anos",
      busca: "não quis se identificar recusou dar o nome",
      obs: "Prestar declaração falsa (parágrafo único): prisão simples, de 1 a 6 meses, e multa. Prescrição da pena só de multa: art. 114, I, do CP.",
      texto:
        "Recusar à autoridade, quando por esta, justificadamente solicitados ou " +
        "exigidos, dados ou indicações concernentes à própria identidade, estado, " +
        "profissão, domicílio e residência:\n" +
        "Pena – multa, de duzentos mil réis a dois contos de réis.",
    },
  ]),

  // ======================================================================
  grupo("Pessoa idosa", [
  // ======================================================================
    {
      fato: "Discriminar pessoa idosa", artigo: "Art. 96", diploma: IDOSO,
      ref: "Art. 96 - L10741",
      pena: "reclusão, de 6 meses a 1 ano, e multa", acao: "incondicionada", jecrim: false,
      busca: "impediu acesso banco transporte desdenhou humilhou idoso",
      obs: "Os crimes do Estatuto são de ação pública incondicionada (art. 95) e sem Lei 9.099/1995, qualquer que seja a pena (art. 94, parágrafo único, Lei 15.163/2025).",
      texto:
        "Discriminar pessoa idosa, impedindo ou dificultando seu acesso a " +
        "operações bancárias, aos meios de transporte, ao direito de contratar ou " +
        "por qualquer outro meio ou instrumento necessário ao exercício da " +
        "cidadania, por motivo de idade:\n" +
        "Pena – reclusão de 6 (seis) meses a 1 (um) ano e multa.",
    },
    {
      fato: "Omissão de socorro à pessoa idosa", artigo: "Art. 97", diploma: IDOSO,
      ref: "Art. 97 - L10741",
      pena: "detenção, de 6 meses a 1 ano, e multa", acao: "incondicionada", jecrim: false,
      busca: "deixou o idoso sem assistência saúde",
      obs: "Aumentada de metade se resulta lesão grave; triplicada se resulta morte (parágrafo único).",
      texto:
        "Deixar de prestar assistência à pessoa idosa, quando possível fazê-lo " +
        "sem risco pessoal, em situação de iminente perigo, ou recusar, retardar " +
        "ou dificultar sua assistência à saúde, sem justa causa, ou não pedir, " +
        "nesses casos, o socorro de autoridade pública:\n" +
        "Pena – detenção de 6 (seis) meses a 1 (um) ano e multa.",
    },
    {
      fato: "Abandonar pessoa idosa em hospital ou casa de repouso", artigo: "Art. 98", diploma: IDOSO,
      ref: "Art. 98 - L10741",
      pena: "detenção, de 6 meses a 3 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "largou o idoso no hospital asilo não provê necessidades",
      texto:
        "Abandonar a pessoa idosa em hospitais, casas de saúde, entidades de " +
        "longa permanência, ou congêneres, ou não prover suas necessidades " +
        "básicas, quando obrigado por lei ou mandado:\n" +
        "Pena – detenção de 6 (seis) meses a 3 (três) anos e multa.",
    },
    {
      fato: "Maus-tratos ou exposição a perigo de pessoa idosa", artigo: "Art. 99", diploma: IDOSO,
      ref: "Art. 99 - L10741",
      pena: "reclusão, de 2 a 5 anos", acao: "incondicionada", jecrim: false,
      busca: "idoso maltratado sem comida trabalho excessivo",
      obs: "Lesão grave (§ 1º): 3 a 7 anos. Morte (§ 2º): 8 a 14 anos. Penas da Lei 15.163/2025 (antes: detenção, de 2 meses a 1 ano).",
      texto:
        "Expor a perigo a integridade e a saúde, física ou psíquica, da pessoa " +
        "idosa, submetendo-a a condições desumanas ou degradantes ou privando-a " +
        "de alimentos e cuidados indispensáveis, quando obrigado a fazê-lo, ou " +
        "sujeitando-a a trabalho excessivo ou inadequado:\n" +
        "Pena - reclusão, de 2 (dois) a 5 (cinco) anos.",
    },
    {
      fato: "Apropriação de bens ou proventos de pessoa idosa", artigo: "Art. 102",
      diploma: IDOSO,
      ref: "Art. 102 - L10741",
      pena: "reclusão, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "aposentadoria do idoso pegou o dinheiro benefício desviou pensão",
      texto:
        "Apropriar-se de ou desviar bens, proventos, pensão ou qualquer outro " +
        "rendimento da pessoa idosa, dando-lhes aplicação diversa da de sua " +
        "finalidade:\n" +
        "Pena – reclusão de 1 (um) a 4 (quatro) anos e multa.",
    },
    {
      fato: "Reter cartão ou documento de pessoa idosa", artigo: "Art. 104", diploma: IDOSO,
      ref: "Art. 104 - L10741",
      pena: "detenção, de 6 meses a 2 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "ficou com o cartão do idoso agiota cartão do benefício",
      obs: "Como garantia de dívida ou para receber benefício.",
      texto:
        "Reter o cartão magnético de conta bancária relativa a benefícios, " +
        "proventos ou pensão da pessoa idosa, bem como qualquer outro documento " +
        "com objetivo de assegurar recebimento ou ressarcimento de dívida:\n" +
        "Pena – detenção de 6 (seis) meses a 2 (dois) anos e multa.",
    },
    {
      fato: "Exibir ou veicular informações ou imagens depreciativas de pessoa idosa", artigo: "Art. 105", diploma: IDOSO,
      ref: "Art. 105 - L10741",
      pena: "detenção, de 1 a 3 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "vídeo humilhando idoso postou na internet rede social zombou do velho",
      texto:
        "Exibir ou veicular, por qualquer meio de comunicação, informações ou " +
        "imagens depreciativas ou injuriosas à pessoa idosa:\n" +
        "Pena – detenção de 1 (um) a 3 (três) anos e multa.",
    },
    {
      fato: "Induzir pessoa idosa sem discernimento a outorgar procuração", artigo: "Art. 106", diploma: IDOSO,
      ref: "Art. 106 - L10741",
      pena: "reclusão, de 2 a 4 anos", acao: "incondicionada", jecrim: false,
      busca: "procuração idoso demência",
      texto:
        "Induzir pessoa idosa sem discernimento de seus atos a outorgar " +
        "procuração para fins de administração de bens ou deles dispor " +
        "livremente:\n" +
        "Pena – reclusão de 2 (dois) a 4 (quatro) anos.",
    },
    {
      fato: "Coagir pessoa idosa a doar, contratar, testar ou outorgar procuração", artigo: "Art. 107", diploma: IDOSO,
      ref: "Art. 107 - L10741",
      pena: "reclusão, de 2 a 5 anos", acao: "incondicionada", jecrim: false,
      busca: "obrigou o idoso a assinar empréstimo consignado doação testamento procuração",
      texto:
        "Coagir, de qualquer modo, a pessoa idosa a doar, contratar, testar ou " +
        "outorgar procuração:\n" +
        "Pena – reclusão de 2 (dois) a 5 (cinco) anos.",
    },
  ]),

  // ======================================================================
  grupo("Pessoa com deficiência", [
  // ======================================================================
    {
      fato: "Discriminação de pessoa com deficiência", artigo: "Art. 88", diploma: PCD,
      ref: "Art. 88 - L13146",
      pena: "reclusão, de 1 a 3 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "preconceito deficiente cadeirante autista",
      obs: "Por meios de comunicação (§ 2º): reclusão, de 2 a 5 anos, e multa.",
      texto:
        "Praticar, induzir ou incitar discriminação de pessoa em razão de sua " +
        "deficiência:\n" +
        "Pena - reclusão, de 1 (um) a 3 (três) anos, e multa.",
    },
    {
      fato: "Apropriação de bens de pessoa com deficiência", artigo: "Art. 89", diploma: PCD,
      ref: "Art. 89 - L13146",
      pena: "reclusão, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "desviou o benefício bpc do deficiente",
      texto:
        "Apropriar-se de ou desviar bens, proventos, pensão, benefícios, " +
        "remuneração ou qualquer outro rendimento de pessoa com deficiência:\n" +
        "Pena - reclusão, de 1 (um) a 4 (quatro) anos, e multa.",
    },
    {
      fato: "Abandono de pessoa com deficiência", artigo: "Art. 90", diploma: PCD,
      ref: "Art. 90 - L13146",
      pena: "reclusão, de 2 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "abandonou o deficiente hospital abrigo",
      obs: "Lesão grave: 3 a 7 anos; morte: 8 a 14. Não prover as necessidades básicas (§ 3º): mesmas penas. Penas da Lei 15.163/2025 (antes: 6 meses a 3 anos).",
      texto:
        "Abandonar pessoa com deficiência em hospitais, casas de saúde, entidades " +
        "de abrigamento ou congêneres:\n" +
        "Pena - reclusão, de 2 (dois) a 5 (cinco) anos, e multa.",
    },
    {
      fato: "Reter cartão ou documento de pessoa com deficiência", artigo: "Art. 91", diploma: PCD,
      ref: "Art. 91 - L13146",
      pena: "detenção, de 6 meses a 2 anos, e multa", acao: "incondicionada", jecrim: true,
      busca: "ficou com o cartão do benefício",
      texto:
        "Reter ou utilizar cartão magnético, qualquer meio eletrônico ou " +
        "documento de pessoa com deficiência destinados ao recebimento de " +
        "benefícios, proventos, pensões ou remuneração ou à realização de " +
        "operações financeiras, com o fim de obter vantagem indevida para si ou " +
        "para outrem:\n" +
        "Pena - detenção, de 6 (seis) meses a 2 (dois) anos, e multa.",
    },
  ]),

  // ======================================================================
  grupo("Racismo", [
  // ======================================================================
    {
      fato: "Injúria racial", artigo: "Art. 2º-A", diploma: RACISMO,
      ref: "Art. 2-A - L7716",
      pena: "reclusão, de 2 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["inafiancavel"],
      prescricao: "imprescritível",
      busca: "racismo xingamento racial cor raça etnia macaco",
      obs: "Deixou de ser o art. 140, § 3º, do CP com a Lei 14.532/2023. Aumentada de metade com 2 ou mais pessoas (parágrafo único); de 1/3 à metade em contexto de descontração ou recreação (art. 20-A) ou por funcionário público no exercício da função (art. 20-B). Imprescritível e inafiançável (art. 5º, XLII, da Constituição).",
      orientacoes: "honra",
      texto:
        "Injuriar alguém, ofendendo-lhe a dignidade ou o decoro, em razão de " +
        "raça, cor, etnia ou procedência nacional.\n" +
        "Pena: reclusão, de 2 (dois) a 5 (cinco) anos, e multa.",
    },
    {
      fato: "Negar ou obstar emprego por discriminação", artigo: "Art. 4º", diploma: RACISMO,
      ref: "Art. 4 - L7716",
      pena: "reclusão, de 2 a 5 anos", acao: "incondicionada", jecrim: false,
      marcas: ["inafiancavel"],
      prescricao: "imprescritível",
      busca: "não contratou por causa da cor vaga de emprego entrevista empresa",
      obs: "Também tratamento diferenciado no trabalho, inclusive salarial, ou impedir a ascensão do empregado (§ 1º). " + RACISMO_MOTIVO,
      texto:
        "Negar ou obstar emprego em empresa privada.\n" +
        "Pena: reclusão de dois a cinco anos.",
    },
    {
      fato: "Recusar ou impedir acesso a estabelecimento comercial", artigo: "Art. 5º", diploma: RACISMO,
      ref: "Art. 5 - L7716",
      pena: "reclusão, de 1 a 3 anos", acao: "incondicionada", jecrim: false,
      marcas: ["inafiancavel"],
      prescricao: "imprescritível",
      busca: "loja não deixou entrar não atendeu segurança seguiu o cliente mercado",
      obs: RACISMO_MOTIVO,
      texto:
        "Recusar ou impedir acesso a estabelecimento comercial, negando-se a " +
        "servir, atender ou receber cliente ou comprador.\n" +
        "Pena: reclusão de um a três anos.",
    },
    {
      fato: "Recusar atendimento em restaurante, bar ou similar", artigo: "Art. 8º", diploma: RACISMO,
      ref: "Art. 8 - L7716",
      pena: "reclusão, de 1 a 3 anos", acao: "incondicionada", jecrim: false,
      marcas: ["inafiancavel"],
      prescricao: "imprescritível",
      busca: "restaurante bar lanchonete não quis servir",
      obs: RACISMO_MOTIVO,
      texto:
        "Impedir o acesso ou recusar atendimento em restaurantes, bares, " +
        "confeitarias, ou locais semelhantes abertos ao público.\n" +
        "Pena: reclusão de um a três anos.",
    },
    {
      fato: "Impedir acesso à entrada social ou ao elevador", artigo: "Art. 11", diploma: RACISMO,
      ref: "Art. 11 - L7716",
      pena: "reclusão, de 1 a 3 anos", acao: "incondicionada", jecrim: false,
      marcas: ["inafiancavel"],
      prescricao: "imprescritível",
      busca: "elevador de serviço portaria entrada social condomínio porteiro",
      obs: RACISMO_MOTIVO,
      texto:
        "Impedir o acesso às entradas sociais em edifícios públicos ou " +
        "residenciais e elevadores ou escada de acesso aos mesmos:\n" +
        "Pena: reclusão de um a três anos.",
    },
    {
      fato: "Impedir acesso ou uso de transporte público", artigo: "Art. 12", diploma: RACISMO,
      ref: "Art. 12 - L7716",
      pena: "reclusão, de 1 a 3 anos", acao: "incondicionada", jecrim: false,
      marcas: ["inafiancavel"],
      prescricao: "imprescritível",
      busca: "ônibus motorista não deixou embarcar trem metrô",
      obs: RACISMO_MOTIVO,
      texto:
        "Impedir o acesso ou uso de transportes públicos, como aviões, navios " +
        "barcas, barcos, ônibus, trens, metrô ou qualquer outro meio de " +
        "transporte concedido.\n" +
        "Pena: reclusão de um a três anos.",
    },
    {
      fato: "Racismo (praticar, induzir ou incitar discriminação)", artigo: "Art. 20", diploma: RACISMO,
      ref: "Art. 20 - L7716",
      pena: "reclusão, de 1 a 3 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["inafiancavel"],
      prescricao: "imprescritível",
      busca: "preconceito raça cor etnia religião procedência nacional homofobia transfobia",
      obs: "Homofobia e transfobia entram aqui (STF, ADO 26). Pela internet ou meios de comunicação, é o § 2º; em evento esportivo, religioso ou cultural, o § 2º-A. Aumento de 1/3 à metade em contexto de descontração ou recreação (art. 20-A) ou por funcionário público no exercício da função (art. 20-B).",
      texto:
        "Praticar, induzir ou incitar a discriminação ou preconceito de raça, " +
        "cor, etnia, religião ou procedência nacional.\n" +
        "Pena: reclusão de um a três anos e multa.",
    },
    {
      fato: "Divulgação do nazismo (cruz suástica)", artigo: "Art. 20, § 1º", diploma: RACISMO,
      ref: "Art. 20, §1 - L7716",
      pena: "reclusão, de 2 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["inafiancavel"],
      prescricao: "imprescritível",
      busca: "suástica nazista símbolo nazismo propaganda tatuagem bandeira",
      obs: "Fabricar, comercializar, distribuir ou veicular símbolo, emblema ou propaganda com a suástica, para divulgar o nazismo.",
      texto:
        "§ 1º Fabricar, comercializar, distribuir ou veicular símbolos, emblemas, " +
        "ornamentos, distintivos ou propaganda que utilizem a cruz suástica ou " +
        "gamada, para fins de divulgação do nazismo.\n" +
        "Pena: reclusão de dois a cinco anos e multa.",
    },
    {
      fato: "Racismo pela internet, redes sociais ou meios de comunicação", artigo: "Art. 20, § 2º", diploma: RACISMO,
      ref: "Art. 20, §2 - L7716",
      pena: "reclusão, de 2 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["inafiancavel"],
      prescricao: "imprescritível",
      busca: "postou na rede social comentário racista internet grupo de whatsapp vídeo",
      obs: "Lei 14.532/2023 incluiu as redes sociais e a internet. O juiz pode mandar recolher o material ou tirar a página do ar ainda antes do inquérito (§ 3º).",
      texto:
        "§ 2º Se qualquer dos crimes previstos neste artigo for cometido por " +
        "intermédio dos meios de comunicação social, de publicação em redes " +
        "sociais, da rede mundial de computadores ou de publicação de qualquer " +
        "natureza:\n" +
        "Pena: reclusão de dois a cinco anos e multa.",
    },
    {
      fato: "Racismo em evento esportivo, religioso, artístico ou cultural", artigo: "Art. 20, § 2º-A", diploma: RACISMO,
      ref: "Art. 20, §2-A - L7716",
      pena: "reclusão, de 2 a 5 anos, e proibição de frequentar esses locais por 3 anos", acao: "incondicionada", jecrim: false,
      marcas: ["inafiancavel"],
      prescricao: "imprescritível",
      busca: "estádio torcida jogo de futebol show festa evento",
      obs: "Em atividade destinada ao público. Lei 14.532/2023.",
      texto:
        "§ 2º-A Se qualquer dos crimes previstos neste artigo for cometido no " +
        "contexto de atividades esportivas, religiosas, artísticas ou culturais " +
        "destinadas ao público:\n" +
        "Pena: reclusão, de 2 (dois) a 5 (cinco) anos, e proibição de frequência, " +
        "por 3 (três) anos, a locais destinados a práticas esportivas, artísticas " +
        "ou culturais destinadas ao público, conforme o caso.",
    },
    {
      fato: "Impedir ou atacar manifestação ou prática religiosa", artigo: "Art. 20, § 2º-B", diploma: RACISMO,
      ref: "Art. 20, §2-B - L7716",
      pena: "reclusão, de 1 a 3 anos, e multa, além da pena da violência", acao: "incondicionada", jecrim: false,
      marcas: ["inafiancavel"],
      prescricao: "imprescritível",
      busca: "terreiro intolerância religiosa culto umbanda candomblé igreja impediu a celebração",
      obs: "Lei 14.532/2023: as penas do caput a quem obsta, impede ou emprega violência contra manifestações ou práticas religiosas. Sem violência, ver também o ultraje a culto (art. 208 do CP).",
      texto:
        "§ 2º-B Sem prejuízo da pena correspondente à violência, incorre nas " +
        "mesmas penas previstas no caput deste artigo quem obstar, impedir ou " +
        "empregar violência contra quaisquer manifestações ou práticas " +
        "religiosas.",
    },
  ]),

  // ======================================================================
  grupo("Tortura", [
  // ======================================================================
    {
      fato: "Tortura (para obter confissão, provocar crime ou por discriminação)", artigo: "Art. 1º, I", diploma: TORTURA,
      ref: "Art. 1, I - L9455",
      pena: "reclusão, de 2 a 8 anos", acao: "incondicionada", jecrim: false,
      marcas: ["equiparado"],
      busca: "tortura choque afogamento confessar",
      obs: "Lesão grave ou gravíssima: 4 a 10 anos; morte: 8 a 16 (§ 3º). Aumento de 1/6 a 1/3 se cometida por agente público, contra criança, adolescente, gestante, pessoa com deficiência ou maior de 60, ou mediante sequestro (§ 4º). Contra preso, por ato não previsto em lei: mesma pena (§ 1º).",
      texto:
        "Constitui crime de tortura:\n" +
        "I - constranger alguém com emprego de violência ou grave ameaça, " +
        "causando-lhe sofrimento físico ou mental:\n" +
        "a) com o fim de obter informação, declaração ou confissão da vítima ou " +
        "de terceira pessoa;\n" +
        "b) para provocar ação ou omissão de natureza criminosa;\n" +
        "c) em razão de discriminação racial ou religiosa;\n" +
        "Pena - reclusão, de dois a oito anos.",
    },
    {
      fato: "Tortura-castigo (vítima sob guarda, poder ou autoridade)", artigo: "Art. 1º, II", diploma: TORTURA,
      ref: "Art. 1, II - L9455",
      pena: "reclusão, de 2 a 8 anos", acao: "incondicionada", jecrim: false,
      marcas: ["equiparado"],
      busca: "castigo cruel criança filho enteado queimou amarrou intenso sofrimento",
      obs: "Intenso sofrimento físico ou mental como castigo ou medida preventiva. Quem se omite tendo o dever de evitar (§ 2º): detenção, de 1 a 4 anos.",
      texto:
        "Constitui crime de tortura:\n" +
        "II - submeter alguém, sob sua guarda, poder ou autoridade, com emprego " +
        "de violência ou grave ameaça, a intenso sofrimento físico ou mental, " +
        "como forma de aplicar castigo pessoal ou medida de caráter preventivo.\n" +
        "Pena - reclusão, de dois a oito anos.",
    },
    {
      fato: "Tortura contra a mulher em violência doméstica", artigo: "Art. 1º, III", diploma: TORTURA,
      ref: "Art. 1, III - L9455",
      pena: "reclusão, de 2 a 8 anos", acao: "incondicionada", jecrim: false,
      marcas: ["equiparado", "domestica"],
      busca: "maria da penha sofrimento intenso reiterado companheiro marido cárcere humilhação",
      obs: "Lei 15.410/2026: submeter a mulher, reiteradamente, a intenso sofrimento físico ou mental, no contexto de violência doméstica e familiar, além das penas das outras infrações. Lesão grave ou gravíssima: 4 a 10 anos; morte: 8 a 16 (§ 3º).",
      orientacoes: "violencia_domestica",
      texto:
        "Constitui crime de tortura:\n" +
        "III – submeter mulher, reiteradamente, a intenso sofrimento físico ou " +
        "mental, no contexto de violência doméstica e familiar, sem prejuízo da " +
        "aplicação das penas correspondentes a outras infrações penais.\n" +
        "Pena - reclusão, de dois a oito anos.",
    },
  ]),

  // ======================================================================
  grupo("Meio ambiente", [
  // ======================================================================
    {
      fato: "Matar, caçar ou apanhar animal silvestre", artigo: "Art. 29", diploma: AMBIENTAL,
      ref: "Art. 29 - L9605",
      pena: "detenção, de 6 meses a 1 ano, e multa", acao: "incondicionada", jecrim: true,
      busca: "caça caçador passarinho pássaro silvestre tatu capivara armadilha alçapão",
      obs: "Sem licença ou em desacordo com ela. Aumento de metade contra espécie ameaçada, em período proibido, à noite ou em unidade de conservação (§ 4º); até o triplo na caça profissional (§ 5º). A pesca tem regra própria (arts. 34 e 35). Os crimes da Lei 9.605/1998 são de ação pública incondicionada (art. 26).",
      texto:
        "Matar, perseguir, caçar, apanhar, utilizar espécimes da fauna silvestre, " +
        "nativos ou em rota migratória, sem a devida permissão, licença ou " +
        "autorização da autoridade competente, ou em desacordo com a obtida:\n" +
        "Pena - detenção de seis meses a um ano, e multa.",
    },
    {
      fato: "Manter em cativeiro, vender ou transportar animal silvestre", artigo: "Art. 29, § 1º, III", diploma: AMBIENTAL,
      ref: "Art. 29, §1, III - L9605",
      pena: "detenção, de 6 meses a 1 ano, e multa", acao: "incondicionada", jecrim: true,
      busca: "passarinho na gaiola papagaio criadouro sem licença feira de pássaros tráfico de animais silvestres",
      obs: "Ovos, larvas, espécimes ou produtos vindos de criadouro não autorizado ou sem licença. Na guarda doméstica de espécie não ameaçada, o juiz pode deixar de aplicar a pena (§ 2º).",
      texto:
        "§ 1º Incorre nas mesmas penas:\n" +
        "III - quem vende, expõe à venda, exporta ou adquire, guarda, tem em " +
        "cativeiro ou depósito, utiliza ou transporta ovos, larvas ou espécimes " +
        "da fauna silvestre, nativa ou em rota migratória, bem como produtos e " +
        "objetos dela oriundos, provenientes de criadouros não autorizados ou sem " +
        "a devida permissão, licença ou autorização da autoridade competente.",
    },
    {
      fato: "Maus-tratos a animais", artigo: "Art. 32", diploma: AMBIENTAL,
      ref: "Art. 32 - L9605",
      pena: "detenção, de 3 meses a 1 ano, e multa", acao: "incondicionada", jecrim: true,
      busca: "animal maltratado cavalo pássaro abandonado espancado",
      obs: "Aumento de 1/6 a 1/3 se o animal morre (§ 2º). Cão ou gato é o § 1º-A. Desastre ambiental que prejudique animais silvestres ou domésticos também é crime (§ 1º-C, Lei 15.355/2026).",
      texto:
        "Praticar ato de abuso, maus-tratos, ferir ou mutilar animais silvestres, " +
        "domésticos ou domesticados, nativos ou exóticos:\n" +
        "Pena - detenção, de três meses a um ano, e multa.",
    },
    {
      fato: "Maus-tratos a cão ou gato", artigo: "Art. 32, § 1º-A", diploma: AMBIENTAL,
      ref: "Art. 32, §1-A - L9605",
      pena: "reclusão, de 2 a 5 anos, multa e proibição da guarda", acao: "incondicionada", jecrim: false,
      busca: "cachorro gato maltratado abandonado espancado envenenou acorrentado tatuagem piercing",
      obs: "Também tatuagem ou piercing com fim estético em cão ou gato (§ 1º-B, Lei 15.150/2025). Lei 14.064/2020.",
      texto:
        "§ 1º-A Quando se tratar de cão ou gato, a pena para as condutas " +
        "descritas no caput deste artigo será de reclusão, de 2 (dois) a 5 " +
        "(cinco) anos, multa e proibição da guarda.",
    },
    {
      fato: "Pesca proibida (defeso ou local interditado)", artigo: "Art. 34", diploma: AMBIENTAL,
      ref: "Art. 34 - L9605",
      pena: "detenção, de 1 a 3 anos, ou multa, ou ambas", acao: "incondicionada", jecrim: false,
      busca: "piracema defeso pesca proibida rede tarrafa peixe pequeno pescador",
      obs: "Também pescar espécie protegida ou abaixo do tamanho, em quantidade acima da permitida ou com petrecho proibido, e transportar ou vender o pescado (parágrafo único). Pesca com explosivo ou substância tóxica é o art. 35 (reclusão, de 1 a 5 anos).",
      texto:
        "Pescar em período no qual a pesca seja proibida ou em lugares " +
        "interditados por órgão competente:\n" +
        "Pena - detenção de um ano a três anos ou multa, ou ambas as penas " +
        "cumulativamente.",
    },
    {
      fato: "Incêndio em floresta ou vegetação (queimada)", artigo: "Art. 41", diploma: AMBIENTAL,
      ref: "Art. 41 - L9605",
      pena: "reclusão, de 2 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "queimada fogo no mato terreno baldio campo vegetação incendiou",
      obs: "A Lei 14.944/2024 estendeu a qualquer forma de vegetação. Culposo (parágrafo único): detenção, de 6 meses a 1 ano, e multa.",
      texto:
        "Provocar incêndio em floresta ou em demais formas de vegetação:\n" +
        "Pena - reclusão, de dois a quatro anos, e multa.",
    },
    {
      fato: "Fabricar, vender, transportar ou soltar balão", artigo: "Art. 42", diploma: AMBIENTAL,
      ref: "Art. 42 - L9605",
      pena: "detenção, de 1 a 3 anos, ou multa, ou ambas", acao: "incondicionada", jecrim: false,
      busca: "balão junino soltou balão festa junina",
      obs: "Balão que possa provocar incêndio em floresta ou vegetação, em área urbana ou em qualquer assentamento humano.",
      texto:
        "Fabricar, vender, transportar ou soltar balões que possam provocar " +
        "incêndios nas florestas e demais formas de vegetação, em áreas urbanas " +
        "ou qualquer tipo de assentamento humano:\n" +
        "Pena - detenção de um a três anos ou multa, ou ambas as penas " +
        "cumulativamente.",
    },
    {
      fato: "Destruir ou maltratar planta ornamental ou árvore de logradouro", artigo: "Art. 49", diploma: AMBIENTAL,
      ref: "Art. 49 - L9605",
      pena: "detenção, de 3 meses a 1 ano, ou multa, ou ambas", acao: "incondicionada", jecrim: true,
      busca: "cortou árvore da praça podou árvore da calçada jardim canteiro arrancou plantas",
      obs: "Também em propriedade privada alheia. Culposo (§ 1º): 1 a 6 meses, ou multa. Poda ou corte com risco atestado não é crime se o órgão ambiental não responder em 45 dias (§ 2º, Lei 15.299/2025).",
      texto:
        "Destruir, danificar, lesar ou maltratar, por qualquer modo ou meio, " +
        "plantas de ornamentação de logradouros públicos ou em propriedade " +
        "privada alheia:\n" +
        "Pena - detenção, de três meses a um ano, ou multa, ou ambas as penas " +
        "cumulativamente.",
    },
    {
      fato: "Poluição", artigo: "Art. 54", diploma: AMBIENTAL,
      ref: "Art. 54 - L9605",
      pena: "reclusão, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "poluição esgoto lançou resíduos no rio fumaça contaminação mortandade de peixes",
      obs: "Em níveis que causem ou possam causar dano à saúde humana, mortandade de animais ou destruição significativa da flora. Culposo (§ 1º): detenção, de 6 meses a 1 ano, e multa. Área imprópria para ocupação, retirada de moradores, corte de água, praia ou lançamento irregular de resíduos (§ 2º): reclusão, de 1 a 5 anos.",
      texto:
        "Causar poluição de qualquer natureza em níveis tais que resultem ou " +
        "possam resultar em danos à saúde humana, ou que provoquem a mortandade " +
        "de animais ou a destruição significativa da flora:\n" +
        "Pena - reclusão, de um a quatro anos, e multa.",
    },
    {
      fato: "Produto ou substância tóxica em desacordo com a lei", artigo: "Art. 56", diploma: AMBIENTAL,
      ref: "Art. 56 - L9605",
      pena: "reclusão, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "agrotóxico veneno descarte de óleo resíduo perigoso lixo tóxico abandonou bateria",
      obs: "Produzir, transportar, armazenar, usar… Também abandonar o produto ou dar destino irregular a resíduo perigoso (§ 1º). Culposo (§ 3º): detenção, de 6 meses a 1 ano, e multa.",
      texto:
        "Produzir, processar, embalar, importar, exportar, comercializar, " +
        "fornecer, transportar, armazenar, guardar, ter em depósito ou usar " +
        "produto ou substância tóxica, perigosa ou nociva à saúde humana ou ao " +
        "meio ambiente, em desacordo com as exigências estabelecidas em leis ou " +
        "nos seus regulamentos:\n" +
        "Pena - reclusão, de um a quatro anos, e multa.",
    },
    {
      fato: "Atividade potencialmente poluidora sem licença ambiental", artigo: "Art. 60", diploma: AMBIENTAL,
      ref: "Art. 60 - L9605",
      pena: "detenção, de 6 meses a 2 anos, ou multa, ou ambas", acao: "incondicionada", jecrim: true,
      busca: "sem licença ambiental oficina lava-jato obra empreendimento poluidor serraria",
      obs: "Até o dobro se a atividade exigia estudo prévio de impacto ambiental (parágrafo único). Pena da Lei 15.190/2025 (antes: 1 a 6 meses).",
      texto:
        "Construir, reformar, ampliar, instalar ou fazer funcionar, em qualquer " +
        "parte do território nacional, estabelecimentos, obras ou serviços " +
        "potencialmente poluidores, sem licença ou autorização dos órgãos " +
        "ambientais competentes, ou contrariando as normas legais e " +
        "regulamentares pertinentes:\n" +
        "Pena - detenção, de 6 (seis) meses a 2 (dois) anos, ou multa, ou ambas " +
        "as penas, cumulativamente.",
    },
    {
      fato: "Destruir bem especialmente protegido (patrimônio cultural, arquivo, museu, biblioteca)", artigo: "Art. 62", diploma: AMBIENTAL,
      ref: "Art. 62 - L9605",
      pena: "reclusão, de 1 a 3 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "patrimônio histórico tombado museu biblioteca arquivo destruiu",
      obs: "Culposo (parágrafo único): detenção, de 6 meses a 1 ano, e multa.",
      texto:
        "Destruir, inutilizar ou deteriorar:\n" +
        "I - bem especialmente protegido por lei, ato administrativo ou decisão " +
        "judicial;\n" +
        "II - arquivo, registro, museu, biblioteca, pinacoteca, instalação " +
        "científica ou similar protegido por lei, ato administrativo ou decisão " +
        "judicial:\n" +
        "Pena - reclusão, de um a três anos, e multa.",
    },
    {
      fato: "Pichação", artigo: "Art. 65", diploma: AMBIENTAL,
      ref: "Art. 65 - L9605",
      pena: "detenção, de 3 meses a 1 ano, e multa", acao: "incondicionada", jecrim: true,
      busca: "pichou muro parede picho spray sujou fachada",
      obs: "Grafite feito com consentimento do proprietário (ou com autorização, se o bem é público) não é crime (§ 2º). Em monumento ou coisa tombada, é o § 1º.",
      texto:
        "Pichar ou por outro meio conspurcar edificação ou monumento urbano:\n" +
        "Pena - detenção, de 3 (três) meses a 1 (um) ano, e multa.",
    },
    {
      fato: "Pichação de monumento ou coisa tombada", artigo: "Art. 65, § 1º", diploma: AMBIENTAL,
      ref: "Art. 65, §1 - L9605",
      pena: "detenção, de 6 meses a 1 ano, e multa", acao: "incondicionada", jecrim: true,
      busca: "pichou monumento estátua prédio histórico tombado",
      texto:
        "§ 1º Se o ato for realizado em monumento ou coisa tombada em virtude do " +
        "seu valor artístico, arqueológico ou histórico, a pena é de 6 (seis) " +
        "meses a 1 (um) ano de detenção e multa.",
    },
    {
      fato: "Obstar ou dificultar a fiscalização ambiental", artigo: "Art. 69", diploma: AMBIENTAL,
      ref: "Art. 69 - L9605",
      pena: "detenção, de 1 a 3 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "impediu o fiscal do meio ambiente fiscalização ambiental Fepam Ibama",
      texto:
        "Obstar ou dificultar a ação fiscalizadora do Poder Público no trato de " +
        "questões ambientais:\n" +
        "Pena - detenção, de um a três anos, e multa.",
    },
  ]),

  // ======================================================================
  grupo("Abuso de autoridade", [
  // ======================================================================
    {
      fato: "Decretar prisão fora das hipóteses legais", artigo: "Art. 9º", diploma: ABUSO,
      ref: "Art. 9 - L13869",
      pena: "detenção, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "prisão ilegal decretou prisão juiz habeas corpus",
      obs: "Também o juiz que, em prazo razoável, deixa de relaxar prisão manifestamente ilegal, de substituí-la ou de conceder liberdade provisória, ou de deferir habeas corpus manifestamente cabível (parágrafo único). Os crimes da Lei 13.869/2019 são de ação pública incondicionada (art. 3º). " + ABUSO_DOLO,
      texto:
        "Decretar medida de privação da liberdade em manifesta desconformidade " +
        "com as hipóteses legais:\n" +
        "Pena - detenção, de 1 (um) a 4 (quatro) anos, e multa.",
    },
    {
      fato: "Condução coercitiva descabida ou sem intimação prévia", artigo: "Art. 10", diploma: ABUSO,
      ref: "Art. 10 - L13869",
      pena: "detenção, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "condução coercitiva testemunha investigado levado à força",
      obs: ABUSO_DOLO,
      texto:
        "Decretar a condução coercitiva de testemunha ou investigado " +
        "manifestamente descabida ou sem prévia intimação de comparecimento ao " +
        "juízo:\n" +
        "Pena - detenção, de 1 (um) a 4 (quatro) anos, e multa.",
    },
    {
      fato: "Deixar de comunicar a prisão em flagrante ao juiz", artigo: "Art. 12", diploma: ABUSO,
      ref: "Art. 12 - L13869",
      pena: "detenção, de 6 meses a 2 anos, e multa", acao: "incondicionada", jecrim: true,
      busca: "não comunicou a prisão família nota de culpa alvará de soltura",
      obs: "Também deixar de avisar a família do preso ou quem ele indicar, de entregar a nota de culpa em 24 horas, ou de cumprir o alvará de soltura ou soltar o preso ao fim do prazo (parágrafo único). " + ABUSO_DOLO,
      texto:
        "Deixar injustificadamente de comunicar prisão em flagrante à autoridade " +
        "judiciária no prazo legal:\n" +
        "Pena - detenção, de 6 (seis) meses a 2 (dois) anos, e multa.",
    },
    {
      fato: "Constranger preso a se exibir, a situação vexatória ou a produzir prova contra si", artigo: "Art. 13", diploma: ABUSO,
      ref: "Art. 13 - L13869",
      pena: "detenção, de 1 a 4 anos, e multa, além da pena da violência", acao: "incondicionada", jecrim: false,
      busca: "expôs o preso à imprensa filmou o preso humilhou o detento obrigou a confessar",
      obs: "Mediante violência, grave ameaça ou redução da capacidade de resistência. " + ABUSO_DOLO,
      texto:
        "Constranger o preso ou o detento, mediante violência, grave ameaça ou " +
        "redução de sua capacidade de resistência, a:\n" +
        "I - exibir-se ou ter seu corpo ou parte dele exibido à curiosidade " +
        "pública;\n" +
        "II - submeter-se a situação vexatória ou a constrangimento não " +
        "autorizado em lei;\n" +
        "III - produzir prova contra si mesmo ou contra terceiro:\n" +
        "Pena - detenção, de 1 (um) a 4 (quatro) anos, e multa, sem prejuízo da " +
        "pena cominada à violência.",
    },
    {
      fato: "Constranger a depor quem deve guardar sigilo, ou insistir no interrogatório", artigo: "Art. 15", diploma: ABUSO,
      ref: "Art. 15 - L13869",
      pena: "detenção, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "obrigou a depor sigilo profissional direito ao silêncio interrogatório sem advogado",
      obs: "Sob ameaça de prisão. Também prosseguir no interrogatório de quem decidiu ficar em silêncio ou optou por ser assistido por advogado, sem ele (parágrafo único). " + ABUSO_DOLO,
      texto:
        "Constranger a depor, sob ameaça de prisão, pessoa que, em razão de " +
        "função, ministério, ofício ou profissão, deva guardar segredo ou " +
        "resguardar sigilo:\n" +
        "Pena - detenção, de 1 (um) a 4 (quatro) anos, e multa.",
    },
    {
      fato: "Violência institucional (revitimização)", artigo: "Art. 15-A", diploma: ABUSO,
      ref: "Art. 15-A - L13869",
      pena: "detenção, de 3 meses a 1 ano, e multa", acao: "incondicionada", jecrim: true,
      busca: "revitimização vítima ouvida várias vezes depoimento repetido constrangeu a vítima",
      obs: "Submeter a vítima, ou a testemunha de crime violento, a procedimentos desnecessários, repetitivos ou invasivos que a façam reviver a violência. Aumento de 2/3 se o agente deixa terceiro intimidar a vítima; em dobro se ele mesmo a intimida (§§ 1º e 2º). Lei 14.321/2022. " + ABUSO_DOLO,
      texto:
        "Submeter a vítima de infração penal ou a testemunha de crimes violentos " +
        "a procedimentos desnecessários, repetitivos ou invasivos, que a leve a " +
        "reviver, sem estrita necessidade:\n" +
        "I - a situação de violência; ou\n" +
        "II - outras situações potencialmente geradoras de sofrimento ou " +
        "estigmatização:\n" +
        "Pena - detenção, de 3 (três) meses a 1 (um) ano, e multa.",
    },
    {
      fato: "Deixar de se identificar ou identificar-se falsamente ao preso", artigo: "Art. 16", diploma: ABUSO,
      ref: "Art. 16 - L13869",
      pena: "detenção, de 6 meses a 2 anos, e multa", acao: "incondicionada", jecrim: true,
      busca: "policial sem identificação não disse o nome nome falso na prisão",
      obs: "Também o responsável pelo interrogatório que não se identifica ou se atribui falsa identidade, cargo ou função (parágrafo único). " + ABUSO_DOLO,
      texto:
        "Deixar de identificar-se ou identificar-se falsamente ao preso por " +
        "ocasião de sua captura ou quando deva fazê-lo durante sua detenção ou " +
        "prisão:\n" +
        "Pena - detenção, de 6 (seis) meses a 2 (dois) anos, e multa.",
    },
    {
      fato: "Interrogatório policial durante o repouso noturno", artigo: "Art. 18", diploma: ABUSO,
      ref: "Art. 18 - L13869",
      pena: "detenção, de 6 meses a 2 anos, e multa", acao: "incondicionada", jecrim: true,
      busca: "interrogou de madrugada à noite",
      obs: "Salvo prisão em flagrante, ou se o preso, devidamente assistido, consentir em depor. " + ABUSO_DOLO,
      texto:
        "Submeter o preso a interrogatório policial durante o período de repouso " +
        "noturno, salvo se capturado em flagrante delito ou se ele, devidamente " +
        "assistido, consentir em prestar declarações:\n" +
        "Pena - detenção, de 6 (seis) meses a 2 (dois) anos, e multa.",
    },
    {
      fato: "Impedir a entrevista do preso com o advogado", artigo: "Art. 20", diploma: ABUSO,
      ref: "Art. 20 - L13869",
      pena: "detenção, de 6 meses a 2 anos, e multa", acao: "incondicionada", jecrim: true,
      busca: "advogado não pôde falar com o preso conversa reservada audiência",
      obs: "Também impedir o preso, o réu solto ou o investigado de entrevistar-se reservadamente com o defensor antes da audiência, e de sentar-se ao seu lado nela (parágrafo único). " + ABUSO_DOLO,
      texto:
        "Impedir, sem justa causa, a entrevista pessoal e reservada do preso com " +
        "seu advogado:\n" +
        "Pena - detenção, de 6 (seis) meses a 2 (dois) anos, e multa.",
    },
    {
      fato: "Manter presos de ambos os sexos na mesma cela", artigo: "Art. 21", diploma: ABUSO,
      ref: "Art. 21 - L13869",
      pena: "detenção, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "cela mista homem e mulher na mesma cela adolescente com adulto",
      obs: "Também manter criança ou adolescente na companhia de maior de idade ou em ambiente inadequado (parágrafo único). " + ABUSO_DOLO,
      texto:
        "Manter presos de ambos os sexos na mesma cela ou espaço de confinamento:\n" +
        "Pena - detenção, de 1 (um) a 4 (quatro) anos, e multa.",
    },
    {
      fato: "Invasão de domicílio por agente público", artigo: "Art. 22", diploma: ABUSO,
      ref: "Art. 22 - L13869",
      pena: "detenção, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "polícia entrou em casa sem mandado arrombou a porta busca domiciliar à noite",
      obs: "Sem ordem judicial ou fora das condições legais. Também coagir alguém a franquear o acesso, ou cumprir mandado de busca domiciliar depois das 21 h ou antes das 5 h (§ 1º). Não há crime para prestar socorro, ou diante de fundados indícios de flagrante ou de desastre (§ 2º). " + ABUSO_DOLO,
      texto:
        "Invadir ou adentrar, clandestina ou astuciosamente, ou à revelia da " +
        "vontade do ocupante, imóvel alheio ou suas dependências, ou nele " +
        "permanecer nas mesmas condições, sem determinação judicial ou fora das " +
        "condições estabelecidas em lei:\n" +
        "Pena - detenção, de 1 (um) a 4 (quatro) anos, e multa.",
    },
    {
      fato: "Inovação artificiosa por agente público (fraude processual)", artigo: "Art. 23", diploma: ABUSO,
      ref: "Art. 23 - L13869",
      pena: "detenção, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "plantou prova forjou flagrante alterou a cena",
      obs: "Para eximir-se de responsabilidade, ou para responsabilizar alguém ou agravar a responsabilidade dele; também para encobrir excesso em diligência ou desviar a investigação (parágrafo único). " + ABUSO_DOLO,
      texto:
        "Inovar artificiosamente, no curso de diligência, de investigação ou de " +
        "processo, o estado de lugar, de coisa ou de pessoa, com o fim de " +
        "eximir-se de responsabilidade ou de responsabilizar criminalmente alguém " +
        "ou agravar-lhe a responsabilidade:\n" +
        "Pena - detenção, de 1 (um) a 4 (quatro) anos, e multa.",
    },
    {
      fato: "Constranger hospital a admitir pessoa já morta", artigo: "Art. 24", diploma: ABUSO,
      ref: "Art. 24 - L13869",
      pena: "detenção, de 1 a 4 anos, e multa, além da pena da violência", acao: "incondicionada", jecrim: false,
      busca: "levou o corpo ao hospital socorro de quem já estava morto alterar o local do crime",
      obs: "Com o fim de alterar o local ou o momento do crime, prejudicando a apuração. " + ABUSO_DOLO,
      texto:
        "Constranger, sob violência ou grave ameaça, funcionário ou empregado de " +
        "instituição hospitalar pública ou privada a admitir para tratamento " +
        "pessoa cujo óbito já tenha ocorrido, com o fim de alterar local ou " +
        "momento de crime, prejudicando sua apuração:\n" +
        "Pena - detenção, de 1 (um) a 4 (quatro) anos, e multa, além da pena " +
        "correspondente à violência.",
    },
    {
      fato: "Obter prova por meio manifestamente ilícito", artigo: "Art. 25", diploma: ABUSO,
      ref: "Art. 25 - L13869",
      pena: "detenção, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "prova ilícita sem mandado celular acessado sem autorização",
      obs: "Também usar a prova contra o investigado sabendo da ilicitude (parágrafo único). " + ABUSO_DOLO,
      texto:
        "Proceder à obtenção de prova, em procedimento de investigação ou " +
        "fiscalização, por meio manifestamente ilícito:\n" +
        "Pena - detenção, de 1 (um) a 4 (quatro) anos, e multa.",
    },
    {
      fato: "Instaurar procedimento investigatório sem qualquer indício", artigo: "Art. 27", diploma: ABUSO,
      ref: "Art. 27 - L13869",
      pena: "detenção, de 6 meses a 2 anos, e multa", acao: "incondicionada", jecrim: true,
      busca: "inquérito sem indício perseguição investigação sem motivo",
      obs: "Não há crime em sindicância ou investigação preliminar sumária, devidamente justificada (parágrafo único). " + ABUSO_DOLO,
      texto:
        "Requisitar instauração ou instaurar procedimento investigatório de " +
        "infração penal ou administrativa, em desfavor de alguém, à falta de " +
        "qualquer indício da prática de crime, de ilícito funcional ou de " +
        "infração administrativa:\n" +
        "Pena - detenção, de 6 (seis) meses a 2 (dois) anos, e multa.",
    },
    {
      fato: "Divulgar gravação sem relação com a prova", artigo: "Art. 28", diploma: ABUSO,
      ref: "Art. 28 - L13869",
      pena: "detenção, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "vazou áudio interceptação gravação expôs a intimidade do investigado",
      obs: ABUSO_DOLO,
      texto:
        "Divulgar gravação ou trecho de gravação sem relação com a prova que se " +
        "pretenda produzir, expondo a intimidade ou a vida privada ou ferindo a " +
        "honra ou a imagem do investigado ou acusado:\n" +
        "Pena - detenção, de 1 (um) a 4 (quatro) anos, e multa.",
    },
    {
      fato: "Persecução sem justa causa ou contra quem sabe inocente", artigo: "Art. 30", diploma: ABUSO,
      ref: "Art. 30 - L13869",
      pena: "detenção, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "processo sem justa causa perseguição inocente",
      obs: ABUSO_DOLO,
      texto:
        "Dar início ou proceder à persecução penal, civil ou administrativa sem " +
        "justa causa fundamentada ou contra quem sabe inocente:\n" +
        "Pena - detenção, de 1 (um) a 4 (quatro) anos, e multa.",
    },
    {
      fato: "Estender injustificadamente a investigação", artigo: "Art. 31", diploma: ABUSO,
      ref: "Art. 31 - L13869",
      pena: "detenção, de 6 meses a 2 anos, e multa", acao: "incondicionada", jecrim: true,
      busca: "inquérito parado demora procrastinação",
      obs: "Também estender, sem motivo, procedimento que não tem prazo fixado (parágrafo único). " + ABUSO_DOLO,
      texto:
        "Estender injustificadamente a investigação, procrastinando-a em prejuízo " +
        "do investigado ou fiscalizado:\n" +
        "Pena - detenção, de 6 (seis) meses a 2 (dois) anos, e multa.",
    },
    {
      fato: "Negar acesso aos autos ao interessado ou ao advogado", artigo: "Art. 32", diploma: ABUSO,
      ref: "Art. 32 - L13869",
      pena: "detenção, de 6 meses a 2 anos, e multa", acao: "incondicionada", jecrim: true,
      busca: "advogado sem acesso ao inquérito negou cópia dos autos termo circunstanciado",
      obs: "Ressalvadas as peças de diligências em curso ou futuras, cujo sigilo seja imprescindível. " + ABUSO_DOLO,
      texto:
        "Negar ao interessado, seu defensor ou advogado acesso aos autos de " +
        "investigação preliminar, ao termo circunstanciado, ao inquérito ou a " +
        "qualquer outro procedimento investigatório de infração penal, civil ou " +
        "administrativa, assim como impedir a obtenção de cópias, ressalvado o " +
        "acesso a peças relativas a diligências em curso, ou que indiquem a " +
        "realização de diligências futuras, cujo sigilo seja imprescindível:\n" +
        "Pena - detenção, de 6 (seis) meses a 2 (dois) anos, e multa.",
    },
    {
      fato: "Exigir informação ou obrigação sem amparo legal", artigo: "Art. 33", diploma: ABUSO,
      ref: "Art. 33 - L13869",
      pena: "detenção, de 6 meses a 2 anos, e multa", acao: "incondicionada", jecrim: true,
      busca: "exigiu sem base legal",
      obs: ABUSO_DOLO,
      texto:
        "Exigir informação ou cumprimento de obrigação, inclusive o dever de " +
        "fazer ou de não fazer, sem expresso amparo legal:\n" +
        "Pena - detenção, de 6 (seis) meses a 2 (dois) anos, e multa.",
    },
    {
      fato: "Carteirada (invocar a condição de agente público para obter vantagem)", artigo: "Art. 33, parágrafo único", diploma: ABUSO,
      ref: "Art. 33, p.u. - L13869",
      pena: "detenção, de 6 meses a 2 anos, e multa", acao: "incondicionada", jecrim: true,
      busca: "carteirada você sabe com quem está falando furou fila não pagou mostrou a carteira funcional",
      obs: "Usar o cargo ou a condição de agente público para se eximir de obrigação legal ou obter vantagem ou privilégio indevido. " + ABUSO_DOLO,
      texto:
        "Parágrafo único. Incorre na mesma pena quem se utiliza de cargo ou " +
        "função pública ou invoca a condição de agente público para se eximir de " +
        "obrigação legal ou para obter vantagem ou privilégio indevido.",
    },
    {
      fato: "Antecipar atribuição de culpa antes de concluída a apuração", artigo: "Art. 38", diploma: ABUSO,
      ref: "Art. 38 - L13869",
      pena: "detenção, de 6 meses a 2 anos, e multa", acao: "incondicionada", jecrim: true,
      busca: "entrevista coletiva rede social disse que o investigado era culpado",
      obs: "Do responsável pelas investigações, por meio de comunicação, inclusive rede social, antes de concluídas as apurações e formalizada a acusação. " + ABUSO_DOLO,
      texto:
        "Antecipar o responsável pelas investigações, por meio de comunicação, " +
        "inclusive rede social, atribuição de culpa, antes de concluídas as " +
        "apurações e formalizada a acusação:\n" +
        "Pena - detenção, de 6 (seis) meses a 2 (dois) anos, e multa.",
    },
  ]),

  // ======================================================================
  grupo("Lavagem de dinheiro e sistema financeiro", [
  // ======================================================================
    {
      fato: "Lavagem de dinheiro", artigo: "Art. 1º", diploma: LAVAGEM,
      ref: "Art. 1 - L9613",
      pena: "reclusão, de 3 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "lavagem ocultar dinheiro do crime laranja empresa de fachada criptomoeda movimentação",
      obs: "Ocultar ou dissimular a origem de bens vindos de qualquer infração penal; também convertê-los, movimentá-los ou usá-los na atividade econômica (§§ 1º e 2º). Aumento de 1/3 a 2/3 se reiterada, por organização criminosa ou com ativo virtual (§ 4º). Justiça Federal só nos casos do art. 2º, III.",
      texto:
        "Ocultar ou dissimular a natureza, origem, localização, disposição, " +
        "movimentação ou propriedade de bens, direitos ou valores provenientes, " +
        "direta ou indiretamente, de infração penal.\n" +
        "Pena: reclusão, de 3 (três) a 10 (dez) anos, e multa.",
    },
    {
      fato: "Operar instituição financeira sem autorização", artigo: "Art. 16", diploma: SFN,
      ref: "Art. 16 - L7492",
      pena: "reclusão, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "banco clandestino financeira sem autorização câmbio paralelo doleiro",
      obs: "Inclui distribuição de valores mobiliários e câmbio. Justiça Federal (art. 26).",
      texto:
        "Fazer operar, sem a devida autorização, ou com autorização obtida " +
        "mediante declaração (Vetado) falsa, instituição financeira, inclusive de " +
        "distribuição de valores mobiliários ou de câmbio:\n" +
        "Pena - Reclusão, de 1 (um) a 4 (quatro) anos, e multa.",
    },
    {
      fato: "Obter financiamento mediante fraude", artigo: "Art. 19", diploma: SFN,
      ref: "Art. 19 - L7492",
      pena: "reclusão, de 2 a 6 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "financiamento de veículo com documento falso financiou carro em nome de outro laranja crédito",
      obs: "Aumento de 1/3 se contra instituição financeira oficial ou credenciada para o repasse (parágrafo único). Justiça Federal (art. 26).",
      texto:
        "Obter, mediante fraude, financiamento em instituição financeira:\n" +
        "Pena - Reclusão, de 2 (dois) a 6 (seis) anos, e multa.",
    },
    {
      fato: "Evasão de divisas", artigo: "Art. 22", diploma: SFN,
      ref: "Art. 22 - L7492",
      pena: "reclusão, de 2 a 6 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "dólar levado para fora câmbio não autorizado conta no exterior não declarada",
      obs: "Também promover, sem autorização legal, a saída de moeda ou divisa para o exterior, ou manter lá depósito não declarado (parágrafo único). Justiça Federal (art. 26).",
      texto:
        "Efetuar operação de câmbio não autorizada, com o fim de promover evasão " +
        "de divisas do País:\n" +
        "Pena - Reclusão, de 2 (dois) a 6 (seis) anos, e multa.",
    },
  ]),

  // ======================================================================
  grupo("Crimes eleitorais", [
  // ======================================================================
    {
      fato: "Inscrição fraudulenta como eleitor", artigo: "Art. 289", diploma: ELEITORAL,
      ref: "Art. 289 - L4737",
      pena: "reclusão, de 1 a 5 anos, e 5 a 15 dias-multa", acao: "incondicionada", jecrim: false,
      busca: "título de eleitor fraude transferiu o título endereço falso domicílio eleitoral",
      obs: ELEITORAL_MINIMO + " Os crimes eleitorais são de ação pública (art. 355) e vão para a Justiça Eleitoral.",
      texto:
        "Inscrever-se fraudulentamente eleitor:\n" +
        "Pena - Reclusão até cinco anos e pagamento de cinco a 15 dias-multa.",
    },
    {
      fato: "Reter título eleitoral contra a vontade do eleitor", artigo: "Art. 295", diploma: ELEITORAL,
      ref: "Art. 295 - L4737",
      pena: "detenção, de 15 dias a 2 meses, ou 30 a 60 dias-multa", acao: "incondicionada", jecrim: true,
      busca: "patrão ficou com o título título de eleitor retido",
      obs: ELEITORAL_MINIMO,
      texto:
        "Reter título eleitoral contra a vontade do eleitor:\n" +
        "Pena - Detenção até dois meses ou pagamento de 30 a 60 dias-multa.",
    },
    {
      fato: "Impedir ou embaraçar o exercício do voto", artigo: "Art. 297", diploma: ELEITORAL,
      ref: "Art. 297 - L4737",
      pena: "detenção, de 15 dias a 6 meses, e 60 a 100 dias-multa", acao: "incondicionada", jecrim: true,
      busca: "não deixou votar impediu de votar",
      obs: ELEITORAL_MINIMO,
      texto:
        "Impedir ou embaraçar o exercício do sufrágio:\n" +
        "Pena - Detenção até seis meses e pagamento de 60 a 100 dias-multa.",
    },
    {
      fato: "Corrupção eleitoral (compra de voto)", artigo: "Art. 299", diploma: ELEITORAL,
      ref: "Art. 299 - L4737",
      pena: "reclusão, de 1 a 4 anos, e 5 a 15 dias-multa", acao: "incondicionada", jecrim: false,
      busca: "compra de voto ofereceu dinheiro cesta básica para votar vendeu o voto abstenção",
      obs: "Pune quem dá, oferece ou promete e quem pede ou recebe, ainda que a oferta não seja aceita. " + ELEITORAL_MINIMO,
      texto:
        "Dar, oferecer, prometer, solicitar ou receber, para si ou para outrem, " +
        "dinheiro, dádiva, ou qualquer outra vantagem, para obter ou dar voto e " +
        "para conseguir ou prometer abstenção, ainda que a oferta não seja " +
        "aceita:\n" +
        "Pena - reclusão até quatro anos e pagamento de cinco a quinze " +
        "dias-multa.",
    },
    {
      fato: "Coação eleitoral com violência ou grave ameaça", artigo: "Art. 301", diploma: ELEITORAL,
      ref: "Art. 301 - L4737",
      pena: "reclusão, de 1 a 4 anos, e 5 a 15 dias-multa", acao: "incondicionada", jecrim: false,
      busca: "ameaçou para votar obrigou a votar em candidato voto de cabresto facção milícia",
      obs: "Ainda que os fins visados não sejam conseguidos. Pelo servidor que se vale da autoridade, sem violência, é o art. 300. " + ELEITORAL_MINIMO,
      texto:
        "Usar de violência ou grave ameaça para coagir alguém a votar, ou não " +
        "votar, em determinado candidato ou partido, ainda que os fins visados " +
        "não sejam conseguidos:\n" +
        "Pena - reclusão até quatro anos e pagamento de cinco a quinze " +
        "dias-multa.",
    },
    {
      fato: "Concentração de eleitores no dia da eleição (transporte ou alimentação)", artigo: "Art. 302", diploma: ELEITORAL,
      ref: "Art. 302 - L4737",
      pena: "reclusão, de 4 a 6 anos, e 200 a 300 dias-multa", acao: "incondicionada", jecrim: false,
      busca: "transporte de eleitores ônibus comida no dia da eleição",
      obs: "Com o fim de impedir, embaraçar ou fraudar o voto, inclusive pelo fornecimento gratuito de alimento e transporte coletivo.",
      texto:
        "Promover, no dia da eleição, com o fim de impedir, embaraçar ou fraudar " +
        "o exercício do voto a concentração de eleitores, sob qualquer forma, " +
        "inclusive o fornecimento gratuito de alimento e transporte coletivo:\n" +
        "Pena - reclusão de quatro (4) a seis (6) anos e pagamento de 200 a 300 " +
        "dias-multa.",
    },
    {
      fato: "Votar mais de uma vez ou em lugar de outrem", artigo: "Art. 309", diploma: ELEITORAL,
      ref: "Art. 309 - L4737",
      pena: "reclusão, de 1 a 3 anos", acao: "incondicionada", jecrim: false,
      busca: "votou no lugar de outro votou duas vezes título alheio",
      obs: "Também a tentativa. " + ELEITORAL_MINIMO,
      texto:
        "Votar ou tentar votar mais de uma vez, ou em lugar de outrem:\n" +
        "Pena - reclusão até três anos.",
    },
    {
      fato: "Violar o sigilo do voto", artigo: "Art. 312", diploma: ELEITORAL,
      ref: "Art. 312 - L4737",
      pena: "detenção, de 15 dias a 2 anos", acao: "incondicionada", jecrim: true,
      busca: "filmou o voto fotografou a urna celular na cabine",
      obs: "Também a tentativa. " + ELEITORAL_MINIMO,
      texto:
        "Violar ou tentar violar o sigilo do voto:\n" +
        "Pena - detenção até dois anos.",
    },
    {
      fato: "Divulgar fatos inverídicos sobre partido ou candidato (desinformação eleitoral)", artigo: "Art. 323", diploma: ELEITORAL,
      ref: "Art. 323 - L4737",
      pena: "detenção, de 2 meses a 1 ano, ou 120 a 150 dias-multa", acao: "incondicionada", jecrim: true,
      busca: "fake news notícia falsa candidato vídeo falso deepfake campanha",
      obs: "Na propaganda ou durante a campanha, fatos que sabe inverídicos e capazes de influir no eleitorado. Também quem produz, oferece ou vende vídeo inverídico (§ 1º). Aumento de 1/3 até a metade pela internet ou em tempo real, ou com menosprezo à condição de mulher ou à cor, raça ou etnia (§ 2º).",
      texto:
        "Divulgar, na propaganda eleitoral ou durante período de campanha " +
        "eleitoral, fatos que sabe inverídicos em relação a partidos ou a " +
        "candidatos e capazes de exercer influência perante o eleitorado:\n" +
        "Pena - detenção de dois meses a um ano, ou pagamento de 120 a 150 " +
        "dias-multa.",
    },
    {
      fato: "Calúnia eleitoral", artigo: "Art. 324", diploma: ELEITORAL,
      ref: "Art. 324 - L4737",
      pena: "detenção, de 6 meses a 2 anos, e 10 a 40 dias-multa", acao: "incondicionada", jecrim: true,
      busca: "acusou candidato de crime na propaganda campanha",
      obs: "Na propaganda eleitoral ou visando fins de propaganda. Ao contrário da calúnia do CP, é de ação pública (art. 355). Aumento de 1/3 até a metade contra funcionário em razão da função, em público, pela internet ou com menosprezo à condição de mulher ou à cor, raça ou etnia (art. 327).",
      texto:
        "Caluniar alguém, na propaganda eleitoral, ou visando fins de propaganda, " +
        "imputando-lhe falsamente fato definido como crime:\n" +
        "Pena - detenção de seis meses a dois anos, e pagamento de 10 a 40 " +
        "dias-multa.",
    },
    {
      fato: "Difamação eleitoral", artigo: "Art. 325", diploma: ELEITORAL,
      ref: "Art. 325 - L4737",
      pena: "detenção, de 3 meses a 1 ano, e 5 a 30 dias-multa", acao: "incondicionada", jecrim: true,
      busca: "falou mal de candidato reputação propaganda campanha",
      obs: "Na propaganda eleitoral ou visando fins de propaganda. Ação pública (art. 355). Aumentos do art. 327.",
      texto:
        "Difamar alguém, na propaganda eleitoral, ou visando a fins de " +
        "propaganda, imputando-lhe fato ofensivo à sua reputação:\n" +
        "Pena - detenção de três meses a um ano, e pagamento de 5 a 30 " +
        "dias-multa.",
    },
    {
      fato: "Injúria eleitoral", artigo: "Art. 326", diploma: ELEITORAL,
      ref: "Art. 326 - L4737",
      pena: "detenção, de 15 dias a 6 meses, ou 30 a 60 dias-multa", acao: "incondicionada", jecrim: true,
      busca: "xingou candidato ofendeu na propaganda campanha",
      obs: "Na propaganda eleitoral ou visando fins de propaganda. Ação pública (art. 355). Injúria real (§ 2º): detenção, de 3 meses a 1 ano, e multa, além da pena da violência. Aumentos do art. 327. " + ELEITORAL_MINIMO,
      texto:
        "Injuriar alguém, na propaganda eleitoral, ou visando a fins de " +
        "propaganda, ofendendo-lhe a dignidade ou o decôro:\n" +
        "Pena - detenção até seis meses, ou pagamento de 30 a 60 dias-multa.",
    },
    {
      fato: "Denunciação caluniosa eleitoral", artigo: "Art. 326-A", diploma: ELEITORAL,
      ref: "Art. 326-A - L4737",
      pena: "reclusão, de 2 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "registrou ocorrência falsa contra candidato acusação falsa com fim eleitoral",
      obs: "Com finalidade eleitoral. Também quem divulga o fato sabendo da inocência (§ 3º). Lei 13.834/2019.",
      texto:
        "Dar causa à instauração de investigação policial, de processo judicial, " +
        "de investigação administrativa, de inquérito civil ou ação de " +
        "improbidade administrativa, atribuindo a alguém a prática de crime ou " +
        "ato infracional de que o sabe inocente, com finalidade eleitoral:\n" +
        "Pena - reclusão, de 2 (dois) a 8 (oito) anos, e multa.",
    },
    {
      fato: "Violência política contra a mulher", artigo: "Art. 326-B", diploma: ELEITORAL,
      ref: "Art. 326-B - L4737",
      pena: "reclusão, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "vereadora candidata prefeita deputada assédio ameaça perseguição política mulher",
      obs: "Assediar, constranger, humilhar, perseguir ou ameaçar candidata ou detentora de mandato, com menosprezo à condição de mulher ou à sua cor, raça ou etnia, para impedir ou dificultar a campanha ou o mandato. Aumento de 1/3 se gestante, maior de 60 ou com deficiência (parágrafo único). Lei 14.192/2021.",
      texto:
        "Assediar, constranger, humilhar, perseguir ou ameaçar, por qualquer " +
        "meio, candidata a cargo eletivo ou detentora de mandato eletivo, " +
        "utilizando-se de menosprezo ou discriminação à condição de mulher ou à " +
        "sua cor, raça ou etnia, com a finalidade de impedir ou de dificultar a " +
        "sua campanha eleitoral ou o desempenho de seu mandato eletivo.\n" +
        "Pena - reclusão, de 1 (um) a 4 (quatro) anos, e multa.",
    },
    {
      fato: "Inutilizar, alterar ou perturbar propaganda eleitoral", artigo: "Art. 331", diploma: ELEITORAL,
      ref: "Art. 331 - L4737",
      pena: "detenção, de 15 dias a 6 meses, ou 90 a 120 dias-multa", acao: "incondicionada", jecrim: true,
      busca: "rasgou cartaz arrancou placa de candidato santinho propaganda eleitoral bandeira",
      obs: "Propaganda devidamente empregada. " + ELEITORAL_MINIMO,
      texto:
        "Inutilizar, alterar ou perturbar meio de propaganda devidamente " +
        "empregado:\n" +
        "Pena - detenção até seis meses ou pagamento de 90 a 120 dias-multa.",
    },
    {
      fato: "Impedir o exercício de propaganda eleitoral", artigo: "Art. 332", diploma: ELEITORAL,
      ref: "Art. 332 - L4737",
      pena: "detenção, de 15 dias a 6 meses, e 30 a 60 dias-multa", acao: "incondicionada", jecrim: true,
      busca: "impediu panfletagem carreata comício",
      obs: ELEITORAL_MINIMO,
      texto:
        "Impedir o exercício de propaganda:\n" +
        "Pena - detenção até seis meses e pagamento de 30 a 60 dias-multa.",
    },
    {
      fato: "Desobediência eleitoral", artigo: "Art. 347", diploma: ELEITORAL,
      ref: "Art. 347 - L4737",
      pena: "detenção, de 3 meses a 1 ano, e 10 a 20 dias-multa", acao: "incondicionada", jecrim: true,
      busca: "descumpriu ordem do juiz eleitoral",
      obs: "Recusar cumprimento ou obediência a diligências, ordens ou instruções da Justiça Eleitoral, ou embaraçar sua execução.",
      texto:
        "Recusar alguém cumprimento ou obediência a diligências, ordens ou " +
        "instruções da Justiça Eleitoral ou opor embaraços à sua execução:\n" +
        "Pena - detenção de três meses a um ano e pagamento de 10 a 20 " +
        "dias-multa.",
    },
    {
      fato: "Falsidade ideológica eleitoral", artigo: "Art. 350", diploma: ELEITORAL,
      ref: "Art. 350 - L4737",
      pena: "reclusão, de 1 a 5 anos, e 5 a 15 dias-multa (documento público)", acao: "incondicionada", jecrim: false,
      busca: "prestação de contas falsa declaração falsa para fins eleitorais caixa dois",
      obs: "Documento particular: reclusão, de 1 a 3 anos, e 3 a 10 dias-multa. " + ELEITORAL_MINIMO,
      texto:
        "Omitir, em documento público ou particular, declaração que dêle devia " +
        "constar, ou nele inserir ou fazer inserir declaração falsa ou diversa da " +
        "que devia ser escrita, para fins eleitorais:\n" +
        "Pena - reclusão até cinco anos e pagamento de 5 a 15 dias-multa, se o " +
        "documento é público, e reclusão até três anos e pagamento de 3 a 10 " +
        "dias-multa se o documento é particular.",
    },
  ])

  );
})();
