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
 * O código do diploma (DL2848, L11343…) vem de DIPLOMAS, abaixo — a
 * página tem um botão que copia a `ref` inteira. Ela repete o `artigo` de
 * propósito: um é para ler, o outro para colar. O teste confere que os
 * dois apontam para o mesmo dispositivo e que o código bate com o diploma.
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
 * (js/orientacoes/dados.js). Quando existe, a linha ganha um link para a
 * folha que se imprime e entrega ao comunicante. É opcional de
 * propósito: há crime sem folha (receptação, desacato) e folha sem
 * crime (perda de documento), e forçar a correspondência inventaria uma
 * das duas. A página confere na carga que a chave existe.
 *
 * `busca` existe porque o nome jurídico raramente é a palavra que a
 * pessoa usa: quem chega dizendo "mexeram no meu carro" procura por
 * "arrombamento", não por "furto qualificado".
 *
 * `texto` é o dispositivo legal em si, e a página o esconde atrás de um
 * "ver o texto do artigo": a tabela existe para achar o artigo, e ler o
 * texto é o passo seguinte. Três regras ao preencher:
 *
 *   1. COPIE LITERALMENTE, do Planalto. Não resuma, não atualize a
 *      grafia, não corte o que parece supérfluo. A página inteira pede
 *      para conferir no texto legal antes de tipificar — um resumo aqui
 *      seria justamente a paráfrase que ela manda evitar.
 *   2. Escreva o caput; quando a entrada for de um parágrafo (§ 4º,
 *      § 9º), escreva o parágrafo. A linha da pena vai junto, porque ela
 *      faz parte do dispositivo — a coluna "Pena" é resumo, não fonte.
 *   3. Quebre linha com \n entre o caput e a pena, e entre um
 *      parágrafo
 *      e outro. A página respeita as quebras.
 *
 * É opcional: entrada sem `texto` não mostra o link, e continua servindo.
 * A busca alcança o que estiver escrito aqui — quem lembra "coisa alheia
 * móvel" e não lembra "furto" acha do mesmo jeito.
 *
 * ATENÇÃO A QUEM EDITA: esta tabela é digitada à mão e envelhece a cada
 * lei nova. Ela é um atalho para lembrar onde procurar, nunca a fonte —
 * confira no texto legal antes de tipificar. A última revisão alcançou
 * a Lei 15.517, de setembro de 2026; leis mais graves não retroagem, e
 * para fato antigo vale a pena da época.
 * ---------------------------------------------------------------------------
 */

(function () {
  "use strict";

  // ---------------------------------------------------------------- DIPLOMAS
  // `nome` é o que aparece embaixo do artigo; `curto`, no filtro; `codigo`,
  // no fim da `ref`.
  const CP = "CP";
  const LCP = "LCP (Dec.-Lei 3.688/1941)";
  const DROGAS = "Lei de Drogas (Lei 11.343/2006)";
  const PENHA = "Lei Maria da Penha (Lei 11.340/2006)";
  const ECA = "ECA (Lei 8.069/1990)";
  const CTB = "CTB (Lei 9.503/1997)";
  const ARMAS = "Estatuto do Desarmamento (Lei 10.826/2003)";
  const RACISMO = "Lei 7.716/1989";
  const TORTURA = "Lei 9.455/1997";
  const AMBIENTAL = "Lei 9.605/1998";
  const IDOSO = "Estatuto da Pessoa Idosa (Lei 10.741/2003)";
  const PCD = "Estatuto da Pessoa com Deficiência (Lei 13.146/2015)";

  window.TIPIFICACAO_DIPLOMAS = [
    { nome: CP, curto: "Código Penal", codigo: "DL2848" },
    { nome: LCP, curto: "Contravenções", codigo: "DL3688" },
    { nome: DROGAS, curto: "Lei de Drogas", codigo: "L11343" },
    { nome: PENHA, curto: "Lei Maria da Penha", codigo: "L11340" },
    { nome: ECA, curto: "ECA", codigo: "L8069" },
    { nome: CTB, curto: "Trânsito (CTB)", codigo: "L9503" },
    { nome: ARMAS, curto: "Desarmamento", codigo: "L10826" },
    { nome: RACISMO, curto: "Racismo", codigo: "L7716" },
    { nome: TORTURA, curto: "Tortura", codigo: "L9455" },
    { nome: AMBIENTAL, curto: "Crimes Ambientais", codigo: "L9605" },
    { nome: IDOSO, curto: "Pessoa Idosa", codigo: "L10741" },
    { nome: PCD, curto: "Pessoa com Deficiência", codigo: "L13146" },
  ];

  /** Carimba o nome do grupo em cada entrada do bloco. */
  function grupo(nome, entradas) {
    entradas.forEach((e) => { e.grupo = nome; });
    return entradas;
  }

  // Três textos que se repetem em muitas linhas.
  const VD_SEM_JECRIM =
    "Em violência doméstica contra a mulher, a Lei 9.099/1995 não se aplica (art. 41 da Lei 11.340/2006).";
  const QUALIFICADO_121 = "reclusão, de 12 a 30 anos";
  const ROUBO_MAJORADO = "reclusão, de 8 a 15 anos, e multa (caput aumentado de 1/3 até a metade)";

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
    },
    {
      fato: "Homicídio qualificado — paga ou motivo torpe", artigo: "Art. 121, § 2º, I", diploma: CP,
      ref: "Art. 121, §2, I - DL2848",
      pena: QUALIFICADO_121, acao: "incondicionada", jecrim: false, marcas: ["hediondo"],
      busca: "pistoleiro encomenda vingança mandante",
    },
    {
      fato: "Homicídio qualificado — motivo fútil", artigo: "Art. 121, § 2º, II", diploma: CP,
      ref: "Art. 121, §2, II - DL2848",
      pena: QUALIFICADO_121, acao: "incondicionada", jecrim: false, marcas: ["hediondo"],
      busca: "briga boba discussão banal",
    },
    {
      fato: "Homicídio qualificado — meio cruel ou de perigo comum", artigo: "Art. 121, § 2º, III", diploma: CP,
      ref: "Art. 121, §2, III - DL2848",
      pena: QUALIFICADO_121, acao: "incondicionada", jecrim: false, marcas: ["hediondo"],
      busca: "veneno fogo explosivo asfixia tortura",
    },
    {
      fato: "Homicídio qualificado — recurso que dificulte a defesa", artigo: "Art. 121, § 2º, IV", diploma: CP,
      ref: "Art. 121, §2, IV - DL2848",
      pena: QUALIFICADO_121, acao: "incondicionada", jecrim: false, marcas: ["hediondo"],
      busca: "traição emboscada dissimulação pelas costas dormindo surpresa",
    },
    {
      fato: "Homicídio qualificado — para assegurar outro crime", artigo: "Art. 121, § 2º, V", diploma: CP,
      ref: "Art. 121, §2, V - DL2848",
      pena: QUALIFICADO_121, acao: "incondicionada", jecrim: false, marcas: ["hediondo"],
      busca: "queima de arquivo testemunha ocultar impunidade",
    },
    {
      fato: "Homicídio qualificado — contra agente de segurança ou do sistema de justiça", artigo: "Art. 121, § 2º, VII", diploma: CP,
      ref: "Art. 121, §2, VII - DL2848",
      pena: QUALIFICADO_121, acao: "incondicionada", jecrim: false, marcas: ["hediondo"],
      busca: "policial militar civil guarda municipal agente penitenciário juiz promotor defensor oficial de justiça",
      obs: "Alínea a: forças de segurança e sistema prisional. Alínea b (Lei 15.134/2025): Judiciário, MP, Defensoria, Advocacia Pública e oficiais de justiça. Vale também contra cônjuge, companheiro ou parente até o 3º grau, em razão dessa condição.",
    },
    {
      fato: "Homicídio qualificado — arma de fogo de uso restrito ou proibido", artigo: "Art. 121, § 2º, VIII", diploma: CP,
      ref: "Art. 121, §2, VIII - DL2848",
      pena: QUALIFICADO_121, acao: "incondicionada", jecrim: false, marcas: ["hediondo"],
      busca: "fuzil calibre restrito",
    },
    {
      fato: "Homicídio qualificado — contra menor de 14 anos", artigo: "Art. 121, § 2º, IX", diploma: CP,
      ref: "Art. 121, §2, IX - DL2848",
      pena: QUALIFICADO_121, acao: "incondicionada", jecrim: false, marcas: ["hediondo"],
      busca: "criança bebê filho",
      obs: "Lei 14.344/2022 (Henry Borel). Aumentos do § 2º-B: deficiência ou doença da vítima, autor ascendente ou com autoridade sobre ela, ou crime em escola.",
    },
    {
      fato: "Homicídio qualificado — nas dependências de instituição de ensino", artigo: "Art. 121, § 2º, X", diploma: CP,
      ref: "Art. 121, §2, X - DL2848",
      pena: QUALIFICADO_121, acao: "incondicionada", jecrim: false, marcas: ["hediondo"],
      busca: "escola colégio faculdade ataque",
      obs: "Lei 15.159/2025. Aumento do § 2º-C: de 1/3 até a metade se a vítima é pessoa com deficiência ou vulnerável; de 2/3 se o autor é ascendente, tem autoridade sobre ela, ou é professor ou funcionário da escola.",
    },
    {
      fato: "Feminicídio", artigo: "Art. 121-A", diploma: CP,
      ref: "Art. 121-A - DL2848",
      pena: "reclusão, de 20 a 40 anos", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo", "domestica"],
      busca: "mulher razões da condição do sexo feminino matou esposa companheira namorada",
      obs: "Crime autônomo desde a Lei 14.994/2024 (antes era o art. 121, § 2º, VI). Aumento de 1/3 até a metade (§ 2º): gestante ou até 3 meses após o parto, vítima menor de 14 ou maior de 60, na presença de descendente ou ascendente, em descumprimento de medida protetiva.",
      orientacoes: "violencia_domestica",
    },
    {
      fato: "Vicaricídio", artigo: "Art. 121-B", diploma: CP,
      ref: "Art. 121-B - DL2848",
      pena: "reclusão, de 20 a 40 anos", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo", "domestica"],
      busca: "violência vicária matou o filho para atingir a mãe enteado",
      obs: "Lei 15.384/2026. Matar descendente, ascendente, dependente ou pessoa sob guarda da mulher para causar-lhe sofrimento, puni-la ou controlá-la. Aumento de 1/3 até a metade se na presença dela, contra criança, idoso ou pessoa com deficiência, ou em descumprimento de medida protetiva.",
      orientacoes: "violencia_domestica",
    },
    {
      fato: "Homicídio culposo", artigo: "Art. 121, § 3º", diploma: CP,
      ref: "Art. 121, §3 - DL2848",
      pena: "detenção, de 1 a 3 anos", acao: "incondicionada", jecrim: false,
      busca: "sem intenção acidente imprudência negligência",
      obs: "Aumento de 1/3 por inobservância de regra técnica ou omissão de socorro (§ 4º). Perdão judicial (§ 5º). Na direção de veículo, é o art. 302 do CTB.",
    },
    {
      fato: "Induzimento, instigação ou auxílio a suicídio ou automutilação",
      artigo: "Art. 122", diploma: CP,
      ref: "Art. 122 - DL2848",
      pena: "reclusão, de 6 meses a 2 anos", acao: "incondicionada", jecrim: true,
      busca: "suicídio automutilação se matar se cortar desafio internet",
      obs: "Lesão grave ou gravíssima (§ 1º): 1 a 3 anos. Morte: § 2º. Pena em dobro por motivo egoístico ou vítima menor (§ 3º); até o dobro pela internet ou em tempo real (§ 4º) — e aí é hediondo (Lei 14.811/2024). Vítima menor de 14: responde por lesão gravíssima ou homicídio.",
    },
    {
      fato: "Induzimento ou auxílio a suicídio — com resultado morte", artigo: "Art. 122, § 2º", diploma: CP,
      ref: "Art. 122, §2 - DL2848",
      pena: "reclusão, de 2 a 6 anos", acao: "incondicionada", jecrim: false,
      busca: "suicídio consumado",
    },
    {
      fato: "Infanticídio", artigo: "Art. 123", diploma: CP,
      ref: "Art. 123 - DL2848",
      pena: "detenção, de 2 a 6 anos", acao: "incondicionada", jecrim: false,
      busca: "estado puerperal recém-nascido matou o próprio filho parto",
    },
    {
      fato: "Aborto provocado pela gestante ou com seu consentimento", artigo: "Art. 124", diploma: CP,
      ref: "Art. 124 - DL2848",
      pena: "detenção, de 1 a 3 anos", acao: "incondicionada", jecrim: false,
      busca: "autoaborto remédio abortivo",
      obs: "Não é crime o aborto para salvar a vida da gestante ou em gravidez resultante de estupro (art. 128), nem o de feto anencéfalo (STF, ADPF 54).",
    },
    {
      fato: "Aborto provocado por terceiro sem consentimento da gestante", artigo: "Art. 125", diploma: CP,
      ref: "Art. 125 - DL2848",
      pena: "reclusão, de 3 a 10 anos", acao: "incondicionada", jecrim: false,
    },
    {
      fato: "Aborto provocado por terceiro com consentimento da gestante", artigo: "Art. 126", diploma: CP,
      ref: "Art. 126 - DL2848",
      pena: "reclusão, de 1 a 4 anos", acao: "incondicionada", jecrim: false,
      busca: "clínica clandestina",
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
      obs: "Representação exigida pelo art. 88 da Lei 9.099/1995. Contra agente de segurança, membro do sistema de justiça ou em escola (§ 12): aumento de 1/3 a 2/3. Em contexto doméstico, ver o § 9º e o § 13.",
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
    },
    {
      fato: "Lesão corporal gravíssima", artigo: "Art. 129, § 2º", diploma: CP,
      ref: "Art. 129, §2 - DL2848",
      pena: "reclusão, de 2 a 8 anos", acao: "incondicionada", jecrim: false,
      busca: "deformidade cicatriz perdeu o olho mutilação",
      obs: "Incapacidade permanente, enfermidade incurável, perda ou inutilização de membro/sentido/função, deformidade permanente, aborto. Hediondo quando contra agente de segurança ou do sistema de justiça (§ 12).",
      orientacoes: "lesao",
    },
    {
      fato: "Lesão corporal seguida de morte", artigo: "Art. 129, § 3º", diploma: CP,
      ref: "Art. 129, §3 - DL2848",
      pena: "reclusão, de 4 a 12 anos", acao: "incondicionada", jecrim: false,
      obs: "Por integrante de facção ultraviolenta ou milícia (§ 3º-A, Lei 15.358/2026): reclusão, de 20 a 40 anos.",
    },
    {
      fato: "Lesão corporal culposa", artigo: "Art. 129, § 6º", diploma: CP,
      ref: "Art. 129, §6 - DL2848",
      pena: "detenção, de 2 meses a 1 ano", acao: "condicionada", jecrim: true,
      obs: "Na direção de veículo, é o art. 303 do CTB.",
      orientacoes: "lesao",
    },
    {
      fato: "Lesão corporal — violência doméstica", artigo: "Art. 129, § 9º", diploma: CP,
      ref: "Art. 129, §9 - DL2848",
      pena: "reclusão, de 2 a 5 anos", acao: "incondicionada", jecrim: false,
      marcas: ["domestica"],
      busca: "maria da penha companheiro marido esposa irmão pai filho empregada doméstica",
      obs: "Pena da Lei 14.994/2024 (antes: detenção, de 3 meses a 3 anos). A Lei 15.455/2026 incluiu quem tem relação de trabalho doméstico. Vítima mulher: incondicionada (Súmula 542 do STJ). Vítima homem: prevalece que depende de representação (art. 88 da Lei 9.099/1995).",
      orientacoes: "violencia_domestica",
    },
    {
      fato: "Lesão corporal contra a mulher por razões da condição do sexo feminino", artigo: "Art. 129, § 13", diploma: CP,
      ref: "Art. 129, §13 - DL2848",
      pena: "reclusão, de 2 a 5 anos", acao: "incondicionada", jecrim: false,
      marcas: ["domestica"],
      busca: "agrediu a mulher menosprezo discriminação gênero",
      obs: "Violência doméstica e familiar, ou menosprezo ou discriminação à condição de mulher (art. 121-A, § 1º). Pena da Lei 14.994/2024. " + VD_SEM_JECRIM,
      orientacoes: "violencia_domestica",
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
    },
    {
      fato: "Abandono de incapaz", artigo: "Art. 133", diploma: CP,
      ref: "Art. 133 - DL2848",
      pena: "reclusão, de 2 a 5 anos", acao: "incondicionada", jecrim: false,
      busca: "idoso criança deficiente abandonado sozinho trancado em casa",
      obs: "Penas da Lei 15.163/2025. Lesão grave (§ 1º): 3 a 7 anos. Morte (§ 2º): 8 a 14 anos. Aumento de 1/3 em lugar ermo, se o autor é parente, tutor ou curador, ou se a vítima tem mais de 60 anos (§ 3º).",
    },
    {
      fato: "Omissão de socorro", artigo: "Art. 135", diploma: CP,
      ref: "Art. 135 - DL2848",
      pena: "detenção, de 1 a 6 meses, ou multa", acao: "incondicionada", jecrim: true,
      busca: "não ajudou não chamou socorro",
      obs: "Aumentada de metade se resulta lesão grave; triplicada se resulta morte. No trânsito, é o art. 304 do CTB.",
    },
    {
      fato: "Maus-tratos", artigo: "Art. 136", diploma: CP,
      ref: "Art. 136 - DL2848",
      pena: "reclusão, de 2 a 5 anos", acao: "incondicionada", jecrim: false,
      busca: "castigo imoderado privar alimento cuidados criança idoso",
      obs: "Penas da Lei 15.163/2025 (antes: detenção, de 2 meses a 1 ano). Lesão grave (§ 1º): 3 a 7 anos. Morte (§ 2º): 8 a 14 anos. Aumento de 1/3 se a vítima é menor de 14 (§ 3º). Castigo com intenso sofrimento é tortura (Lei 9.455/1997).",
    },
    {
      fato: "Rixa", artigo: "Art. 137", diploma: CP,
      ref: "Art. 137 - DL2848",
      pena: "detenção, de 15 dias a 2 meses, ou multa", acao: "incondicionada", jecrim: true,
      busca: "briga generalizada confusão pancadaria",
      obs: "Se resulta lesão grave ou morte (parágrafo único): detenção, de 6 meses a 2 anos.",
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
      obs: "Imputar falsamente FATO definido como crime. Em rede social, pena em triplo (art. 141, § 2º) — aí não é JECRIM. Contra a mulher por razões da condição do sexo feminino, em dobro (§ 3º). Contra servidor, em razão da função: também por representação (Súmula 714 do STF).",
      orientacoes: "honra",
    },
    {
      fato: "Difamação", artigo: "Art. 139", diploma: CP,
      ref: "Art. 139 - DL2848",
      pena: "detenção, de 3 meses a 1 ano, e multa", acao: "privada", jecrim: true,
      busca: "fofoca reputação falou mal espalhou",
      obs: "Imputar fato ofensivo à reputação, ainda que verdadeiro. Rede social: pena em triplo; contra a mulher por razões de gênero: em dobro (art. 141, §§ 2º e 3º).",
      orientacoes: "honra",
    },
    {
      fato: "Injúria", artigo: "Art. 140", diploma: CP,
      ref: "Art. 140 - DL2848",
      pena: "detenção, de 1 a 6 meses, ou multa", acao: "privada", jecrim: true,
      busca: "xingou ofendeu palavrão insultou",
      obs: "Ofender a dignidade ou o decoro, sem imputar fato. Rede social: pena em triplo; contra a mulher por razões de gênero: em dobro (art. 141, §§ 2º e 3º). Ofensa por raça, cor ou etnia é injúria racial (Lei 7.716/1989).",
      orientacoes: "honra",
    },
    {
      fato: "Injúria real", artigo: "Art. 140, § 2º", diploma: CP,
      ref: "Art. 140, §2 - DL2848",
      pena: "detenção, de 3 meses a 1 ano, e multa, além da pena da violência", acao: "privada", jecrim: true,
      busca: "tapa na cara cuspiu humilhar",
      obs: "Violência ou vias de fato aviltantes. Se da violência resulta lesão corporal, a ação é pública (art. 145).",
      orientacoes: "honra",
    },
    {
      fato: "Injúria por religião, idade ou deficiência", artigo: "Art. 140, § 3º", diploma: CP,
      ref: "Art. 140, §3 - DL2848",
      pena: "reclusão, de 1 a 3 anos, e multa", acao: "condicionada", jecrim: false,
      busca: "idoso velho deficiente religião crença",
      obs: "Representação pelo art. 145, parágrafo único. Raça, cor, etnia e procedência nacional saíram daqui para a Lei 7.716/1989 (Lei 14.532/2023).",
      orientacoes: "honra",
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
    },
    {
      fato: "Intimidação sistemática (bullying)", artigo: "Art. 146-A", diploma: CP,
      ref: "Art. 146-A - DL2848",
      pena: "multa, se a conduta não constituir crime mais grave", acao: "incondicionada", jecrim: true,
      prescricao: "2 anos",
      busca: "bullying escola colegas humilhação repetida",
      obs: "Lei 14.811/2024. Prescrição da pena só de multa: art. 114, I.",
    },
    {
      fato: "Intimidação sistemática virtual (cyberbullying)", artigo: "Art. 146-A, parágrafo único", diploma: CP,
      ref: "Art. 146-A, p.u. - DL2848",
      pena: "reclusão, de 2 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "cyberbullying internet rede social jogo online grupo whatsapp",
      obs: "Lei 14.811/2024.",
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
    },
    {
      fato: "Perseguição (stalking)", artigo: "Art. 147-A", diploma: CP,
      ref: "Art. 147-A - DL2848",
      pena: "reclusão, de 6 meses a 2 anos, e multa", acao: "condicionada", jecrim: true,
      busca: "stalking perseguindo vigiando importunando reiteradamente ligações insistentes perturbação da tranquilidade",
      obs: "Aumento de metade contra criança, adolescente ou idoso, contra a mulher por razões de gênero, ou com 2+ autores ou arma (§ 1º). Representação (§ 3º). Revogou o art. 65 da LCP (perturbação da tranquilidade). " + VD_SEM_JECRIM,
      orientacoes: "ameaca",
    },
    {
      fato: "Violência psicológica contra a mulher", artigo: "Art. 147-B", diploma: CP,
      ref: "Art. 147-B - DL2848",
      pena: "reclusão, de 6 meses a 2 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["domestica"],
      busca: "humilhação chantagem manipulação isolamento controle ciúme dano emocional maria da penha deepfake",
      obs: "Lei 14.188/2021. Aumentada de metade com inteligência artificial ou outro recurso que altere imagem ou som da vítima (parágrafo único, Lei 15.123/2025). Só se não constituir crime mais grave.",
      orientacoes: "violencia_domestica",
    },
    {
      fato: "Ameaça no contexto de facção, milícia ou grupo paramilitar", artigo: "Art. 147-C", diploma: CP,
      ref: "Art. 147-C - DL2848",
      pena: "reclusão, de 1 a 3 anos", acao: "incondicionada", jecrim: false,
      busca: "facção tráfico domínio território toque de recolher",
      obs: "Lei 15.358/2026 (Antifacção). Ameaça ligada às condutas de domínio social estruturado do art. 2º daquela lei.",
      orientacoes: "ameaca",
    },
    {
      fato: "Sequestro e cárcere privado", artigo: "Art. 148", diploma: CP,
      ref: "Art. 148 - DL2848",
      pena: "reclusão, de 1 a 3 anos", acao: "incondicionada", jecrim: false,
      busca: "prendeu trancou não deixou sair manteve preso",
    },
    {
      fato: "Sequestro e cárcere privado qualificado", artigo: "Art. 148, § 1º", diploma: CP,
      ref: "Art. 148, §1 - DL2848",
      pena: "reclusão, de 2 a 5 anos", acao: "incondicionada", jecrim: false,
      busca: "companheira trancada idoso criança mais de 15 dias fins libidinosos",
      obs: "Vítima ascendente, descendente, cônjuge, companheiro ou maior de 60; internação fraudulenta; mais de 15 dias; vítima menor de 18 (inciso IV, hediondo); fins libidinosos. Grave sofrimento (§ 2º): 2 a 8 anos. Por integrante de facção (§ 3º, Lei 15.358/2026): 12 a 20 anos.",
    },
    {
      fato: "Redução a condição análoga à de escravo", artigo: "Art. 149", diploma: CP,
      ref: "Art. 149 - DL2848",
      pena: "reclusão, de 2 a 8 anos, e multa, além da pena da violência", acao: "incondicionada", jecrim: false,
      busca: "trabalho escravo jornada exaustiva servidão por dívida",
    },
    {
      fato: "Tráfico de pessoas", artigo: "Art. 149-A", diploma: CP,
      ref: "Art. 149-A - DL2848",
      pena: "reclusão, de 4 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "aliciar transportar pessoa exploração sexual remoção de órgãos",
      obs: "Hediondo quando a vítima é criança ou adolescente (Lei 14.811/2024).",
    },
    {
      fato: "Violação de domicílio", artigo: "Art. 150", diploma: CP,
      ref: "Art. 150 - DL2848",
      pena: "detenção, de 1 a 3 meses, ou multa", acao: "incondicionada", jecrim: true,
      busca: "invadiu casa entrou terreno pátio",
    },
    {
      fato: "Violação de domicílio qualificada", artigo: "Art. 150, § 1º", diploma: CP,
      ref: "Art. 150, §1 - DL2848",
      pena: "detenção, de 6 meses a 2 anos, além da pena da violência", acao: "incondicionada", jecrim: true,
      busca: "invadiu à noite com arma arrombou a porta",
      obs: "À noite, em lugar ermo, com violência ou arma, ou por duas ou mais pessoas.",
    },
    {
      fato: "Violação de correspondência", artigo: "Art. 151", diploma: CP,
      ref: "Art. 151 - DL2848",
      pena: "detenção, de 1 a 6 meses, ou multa", acao: "condicionada", jecrim: true,
      busca: "abriu carta correspondência",
    },
    {
      fato: "Invasão de dispositivo informático", artigo: "Art. 154-A", diploma: CP,
      ref: "Art. 154-A - DL2848",
      pena: "reclusão, de 1 a 4 anos, e multa", acao: "condicionada", jecrim: false,
      busca: "hackearam celular invadiram conta e-mail whatsapp clonado computador instagram",
      obs: "Obtendo conteúdo de comunicação privada ou segredo (§ 3º): reclusão, de 2 a 5 anos. Incondicionada quando a vítima é a administração pública (art. 154-B).",
      orientacoes: "estelionato",
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
      obs: "Pena da Lei 15.397/2026 (antes: 1 a 4 anos). Repouso noturno (§ 1º): aumento de metade. Coisa de pequeno valor e réu primário (§ 2º): privilégio. Contra cônjuge, ascendente ou descendente: isento de pena; contra irmão ou cônjuge separado: só com representação (arts. 181 a 183).",
      orientacoes: "furto_roubo",
      texto:
        "Subtrair, para si ou para outrem, coisa alheia móvel:\n" +
        "Pena - reclusão, de 1 (um) a 6 (seis) anos, e multa.",
    },
    {
      fato: "Furto de energia elétrica ou de água", artigo: "Art. 155, § 3º", diploma: CP,
      ref: "Art. 155, §3 - DL2848",
      pena: "reclusão, de 1 a 6 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "gato luz energia ligação clandestina sinal de tv",
      obs: "Equipara à coisa móvel a energia elétrica ou qualquer outra com valor econômico.",
      orientacoes: "furto_roubo",
    },
    {
      fato: "Furto qualificado — destruição ou rompimento de obstáculo", artigo: "Art. 155, § 4º, I", diploma: CP,
      ref: "Art. 155, §4, I - DL2848",
      pena: "reclusão, de 2 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "arrombamento arrombou quebrou vidro janela cadeado porta",
      orientacoes: "furto_roubo",
    },
    {
      fato: "Furto qualificado — abuso de confiança, fraude, escalada ou destreza", artigo: "Art. 155, § 4º, II", diploma: CP,
      ref: "Art. 155, §4, II - DL2848",
      pena: "reclusão, de 2 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "pulou o muro empregada funcionário de confiança punguista batedor de carteira distraiu",
      orientacoes: "furto_roubo",
    },
    {
      fato: "Furto qualificado — chave falsa", artigo: "Art. 155, § 4º, III", diploma: CP,
      ref: "Art. 155, §4, III - DL2848",
      pena: "reclusão, de 2 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "mixa micha cópia de chave grampo",
      orientacoes: "furto_roubo",
    },
    {
      fato: "Furto qualificado — concurso de duas ou mais pessoas", artigo: "Art. 155, § 4º, IV", diploma: CP,
      ref: "Art. 155, §4, IV - DL2848",
      pena: "reclusão, de 2 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "dois autores comparsa dupla bando",
      orientacoes: "furto_roubo",
    },
    {
      fato: "Furto qualificado — bens de órgão público ou serviço essencial", artigo: "Art. 155, § 4º, V", diploma: CP,
      ref: "Art. 155, §4, V - DL2848",
      pena: "reclusão, de 2 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "prefeitura escola posto de saúde hospital",
      obs: "Lei 15.181/2025; o Distrito Federal entrou com a Lei 15.397/2026.",
      orientacoes: "furto_roubo",
    },
    {
      fato: "Furto com emprego de explosivo", artigo: "Art. 155, § 4º-A", diploma: CP,
      ref: "Art. 155, §4-A - DL2848",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "explodiram caixa eletrônico banco dinamite",
    },
    {
      fato: "Furto mediante fraude eletrônica", artigo: "Art. 155, § 4º-B", diploma: CP,
      ref: "Art. 155, §4-B - DL2848",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "pix transferência internet banking conta invadida celular furtado aplicativo",
      obs: "Pena da Lei 15.397/2026. Aqui a vítima NÃO é induzida a erro — o autor age direto no dispositivo ou na conta. Aumentos do § 4º-C: servidor fora do país (1/3 a 2/3); idoso ou vulnerável (1/3 ao dobro).",
      orientacoes: "estelionato",
    },
    {
      fato: "Furto de veículo levado a outro Estado ou ao exterior", artigo: "Art. 155, § 5º", diploma: CP,
      ref: "Art. 155, §5 - DL2848",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "carro moto caminhão levado para outro estado Paraguai Uruguai fronteira",
      obs: "Pena da Lei 15.397/2026 (antes: 3 a 8 anos).",
      orientacoes: "furto_roubo",
    },
    {
      fato: "Furto de animal de produção ou doméstico", artigo: "Art. 155, § 6º, I", diploma: CP,
      ref: "Art. 155, §6, I - DL2848",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "abigeato gado boi vaca cavalo cachorro gato pet",
      obs: "Lei 15.397/2026 incluiu o animal doméstico e elevou a pena (antes: 2 a 5 anos, só semovente de produção).",
      orientacoes: "furto_roubo",
    },
    {
      fato: "Furto de celular, computador ou dispositivo eletrônico", artigo: "Art. 155, § 6º, II", diploma: CP,
      ref: "Art. 155, §6, II - DL2848",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "celular telefone notebook tablet levaram o celular",
      obs: "Lei 15.397/2026. Antes era furto simples.",
      orientacoes: "furto_roubo",
    },
    {
      fato: "Furto de explosivo ou de arma de fogo", artigo: "Art. 155, § 7º", diploma: CP,
      ref: "Art. 155, §7 - DL2848",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "levaram a arma revólver pistola dinamite",
      obs: "Inciso I: substâncias explosivas ou acessórios. Inciso II (Lei 15.397/2026): arma de fogo.",
    },
    {
      fato: "Furto de fios, cabos ou equipamentos de energia, telefonia ou dados", artigo: "Art. 155, § 8º", diploma: CP,
      ref: "Art. 155, §8 - DL2848",
      pena: "reclusão, de 2 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "cobre fiação cabo de internet transformador trilho ferrovia",
      obs: "Lei 15.181/2025. Inclui equipamento ferroviário e metroviário. Cabe o privilégio do § 2º.",
    },
    {
      fato: "Furto por integrante de facção, milícia ou grupo paramilitar", artigo: "Art. 155, § 9º", diploma: CP,
      ref: "Art. 155, §9 - DL2848",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "facção organização criminosa ultraviolenta",
      obs: "Lei 15.358/2026 (Antifacção).",
    },
    {
      fato: "Furto de combustível", artigo: "Art. 155, § 10", diploma: CP,
      ref: "Art. 155, §10 - DL2848",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "gasolina diesel óleo duto posto derivação clandestina gás",
      obs: "Lei 15.517/2026. Derivados de petróleo, gás natural, biocombustíveis e lubrificantes, subtraídos de produção, armazenamento ou transporte (dutos inclusive).",
    },
    {
      fato: "Furto de coisa comum", artigo: "Art. 156", diploma: CP,
      ref: "Art. 156 - DL2848",
      pena: "detenção, de 6 meses a 2 anos, ou multa", acao: "condicionada", jecrim: true,
      busca: "sócio condômino herdeiro levou bem do casal",
      obs: "Representação (§ 1º). Não é punível a subtração de coisa fungível cujo valor não excede a quota do agente (§ 2º).",
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
      obs: "Pena da Lei 15.397/2026 (antes: 4 a 10 anos). Roubo impróprio (§ 1º): violência depois da subtração, para garantir a coisa.",
      orientacoes: "furto_roubo",
    },
    {
      fato: "Roubo de bens de órgão público ou serviço essencial", artigo: "Art. 157, § 1º-A", diploma: CP,
      ref: "Art. 157, §1-A - DL2848",
      pena: "reclusão, de 6 a 12 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "cabos energia telefonia serviço público",
      obs: "Lei 15.181/2025; o Distrito Federal entrou com a Lei 15.397/2026.",
    },
    {
      fato: "Roubo majorado — concurso de duas ou mais pessoas", artigo: "Art. 157, § 2º, II", diploma: CP,
      ref: "Art. 157, §2, II - DL2848",
      pena: ROUBO_MAJORADO, acao: "incondicionada", jecrim: false,
      busca: "dupla assaltantes comparsa garupa",
      orientacoes: "furto_roubo",
    },
    {
      fato: "Roubo majorado — restrição da liberdade da vítima", artigo: "Art. 157, § 2º, V", diploma: CP,
      ref: "Art. 157, §2, V - DL2848",
      pena: ROUBO_MAJORADO, acao: "incondicionada", jecrim: false, marcas: ["hediondo"],
      busca: "manteve a vítima refém amarrou trancou no porta-malas",
      orientacoes: "furto_roubo",
    },
    {
      fato: "Roubo majorado — arma branca", artigo: "Art. 157, § 2º, VII", diploma: CP,
      ref: "Art. 157, §2, VII - DL2848",
      pena: ROUBO_MAJORADO, acao: "incondicionada", jecrim: false,
      busca: "faca canivete facão tesoura",
      orientacoes: "furto_roubo",
    },
    {
      fato: "Roubo majorado — de celular, computador ou dispositivo eletrônico", artigo: "Art. 157, § 2º, IX", diploma: CP,
      ref: "Art. 157, §2, IX - DL2848",
      pena: ROUBO_MAJORADO, acao: "incondicionada", jecrim: false,
      busca: "levaram o celular assalto de celular notebook",
      obs: "Lei 15.397/2026.",
      orientacoes: "furto_roubo",
    },
    {
      fato: "Roubo majorado — de arma de fogo", artigo: "Art. 157, § 2º, X", diploma: CP,
      ref: "Art. 157, §2, X - DL2848",
      pena: ROUBO_MAJORADO, acao: "incondicionada", jecrim: false,
      busca: "levaram a arma do vigilante policial",
      obs: "Lei 15.397/2026. Aqui a arma é o objeto roubado; empregada na ameaça, é o § 2º-A.",
    },
    {
      fato: "Roubo com emprego de arma de fogo", artigo: "Art. 157, § 2º-A, I", diploma: CP,
      ref: "Art. 157, §2-A, I - DL2848",
      pena: "reclusão, de 10 anos a 16 anos e 8 meses, e multa (caput aumentado de 2/3)",
      acao: "incondicionada", jecrim: false, marcas: ["hediondo"],
      busca: "revólver pistola assalto à mão armada",
      obs: "Destruição de obstáculo com explosivo (inciso II): mesmo aumento.",
      orientacoes: "furto_roubo",
    },
    {
      fato: "Roubo com arma de fogo de uso restrito ou proibido", artigo: "Art. 157, § 2º-B", diploma: CP,
      ref: "Art. 157, §2-B - DL2848",
      pena: "reclusão, de 12 a 20 anos, e multa (caput em dobro)", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "fuzil calibre restrito",
    },
    {
      fato: "Roubo com lesão corporal grave", artigo: "Art. 157, § 3º, I", diploma: CP,
      ref: "Art. 157, §3, I - DL2848",
      pena: "reclusão, de 7 a 18 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      obs: "O aumento para 16 a 24 anos foi vetado na Lei 15.397/2026.",
    },
    {
      fato: "Latrocínio (roubo seguido de morte)", artigo: "Art. 157, § 3º, II", diploma: CP,
      ref: "Art. 157, §3, II - DL2848",
      pena: "reclusão, de 24 a 30 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "assalto com morte matou para roubar",
      obs: "Pena mínima da Lei 15.397/2026 (antes: 20). Julgado pelo juiz singular, não pelo júri (Súmula 603 do STF).",
    },
    {
      fato: "Extorsão", artigo: "Art. 158", diploma: CP,
      ref: "Art. 158 - DL2848",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "chantagem exigiu dinheiro para não divulgar sextorsão nudes falso sequestro",
      obs: "Aumento de 1/3 até a metade com 2+ pessoas ou com arma (§ 1º).",
      orientacoes: "ameaca",
    },
    {
      fato: "Extorsão mediante restrição da liberdade (sequestro relâmpago)", artigo: "Art. 158, § 3º", diploma: CP,
      ref: "Art. 158, §3 - DL2848",
      pena: "reclusão, de 6 a 12 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "sequestro relâmpago levaram ao caixa eletrônico saque",
      obs: "Com lesão grave ou morte, aplicam-se as penas do art. 159, §§ 2º e 3º.",
    },
    {
      fato: "Extorsão mediante sequestro", artigo: "Art. 159", diploma: CP,
      ref: "Art. 159 - DL2848",
      pena: "reclusão, de 8 a 15 anos", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "sequestro resgate cativeiro",
      obs: "Mais de 24 h, vítima menor de 18 ou maior de 60, ou por quadrilha (§ 1º): 12 a 20 anos. Lesão grave (§ 2º): 16 a 24. Morte (§ 3º): 24 a 30.",
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
    },
    {
      fato: "Dano", artigo: "Art. 163", diploma: CP,
      ref: "Art. 163 - DL2848",
      pena: "detenção, de 1 a 6 meses, ou multa", acao: "privada", jecrim: true,
      busca: "quebrou destruiu estragou riscou carro pichou vidro",
      obs: "Queixa-crime, por força do art. 167.",
      orientacoes: "dano",
    },
    {
      fato: "Dano qualificado — com violência ou grave ameaça", artigo: "Art. 163, parágrafo único, I", diploma: CP,
      ref: "Art. 163, p.u., I - DL2848",
      pena: "detenção, de 6 meses a 3 anos, e multa, além da pena da violência", acao: "incondicionada", jecrim: false,
      busca: "quebrou tudo ameaçando",
      orientacoes: "dano",
    },
    {
      fato: "Dano qualificado — substância inflamável ou explosiva", artigo: "Art. 163, parágrafo único, II", diploma: CP,
      ref: "Art. 163, p.u., II - DL2848",
      pena: "detenção, de 6 meses a 3 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "ateou fogo no carro gasolina bomba",
      obs: "Só se o fato não constitui crime mais grave (incêndio, art. 250).",
      orientacoes: "dano",
    },
    {
      fato: "Dano qualificado — patrimônio público", artigo: "Art. 163, parágrafo único, III", diploma: CP,
      ref: "Art. 163, p.u., III - DL2848",
      pena: "detenção, de 6 meses a 3 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "viatura escola prefeitura cela orelhão concessionária",
      obs: "União, Estado, DF, Município, autarquia, fundação, empresa pública, sociedade de economia mista ou concessionária de serviço público.",
      orientacoes: "dano",
    },
    {
      fato: "Dano qualificado — motivo egoístico ou prejuízo considerável", artigo: "Art. 163, parágrafo único, IV", diploma: CP,
      ref: "Art. 163, p.u., IV - DL2848",
      pena: "detenção, de 6 meses a 3 anos, e multa", acao: "privada", jecrim: false,
      busca: "prejuízo grande",
      obs: "Queixa-crime (art. 167).",
      orientacoes: "dano",
    },
    {
      fato: "Apropriação indébita", artigo: "Art. 168", diploma: CP,
      ref: "Art. 168 - DL2848",
      pena: "reclusão, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "emprestou não devolveu ficou com reteve carro alugado",
      obs: "A posse do bem começou lícita — é isso que separa do furto. Aumento de 1/3 em razão de ofício, emprego ou profissão (§ 1º).",
    },
    {
      fato: "Apropriação de coisa achada", artigo: "Art. 169, parágrafo único, II", diploma: CP,
      ref: "Art. 169, p.u., II - DL2848",
      pena: "detenção, de 1 mês a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
      busca: "achou não devolveu perdido encontrou celular carteira",
      obs: "Prazo de 15 dias para restituir ao dono ou entregar à autoridade.",
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
        "Pena - reclusão, de um a cinco anos, e multa.",
    },
    {
      fato: "Estelionato — disposição de coisa alheia como própria", artigo: "Art. 171, § 2º, I", diploma: CP,
      ref: "Art. 171, §2, I - DL2848",
      pena: "reclusão, de 1 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "vendeu o que não era dele alugou imóvel alheio",
      orientacoes: "estelionato",
    },
    {
      fato: "Estelionato — fraude no pagamento por cheque", artigo: "Art. 171, § 2º, VI", diploma: CP,
      ref: "Art. 171, §2, VI - DL2848",
      pena: "reclusão, de 1 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "cheque sem fundo sustou cheque",
      obs: "Pagar antes da denúncia extingue a punibilidade (Súmula 554 do STF). Cheque pós-datado dado como garantia de dívida não configura o crime.",
      orientacoes: "estelionato",
    },
    {
      fato: "Cessão de conta bancária para crime (conta laranja)", artigo: "Art. 171, § 2º, VII", diploma: CP,
      ref: "Art. 171, §2, VII - DL2848",
      pena: "reclusão, de 1 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "conta laranja emprestou a conta recebedor do pix golpe",
      obs: "Lei 15.397/2026. Ceder a conta, de graça ou não, para receber dinheiro de crime ou destinado a ele. Exige dolo.",
      orientacoes: "estelionato",
    },
    {
      fato: "Estelionato por fraude eletrônica", artigo: "Art. 171, § 2º-A", diploma: CP,
      ref: "Art. 171, §2-A - DL2848",
      pena: "reclusão, de 4 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "golpe pix whatsapp clonado internet rede social falso perfil site falso",
      obs: "Lei 14.155/2021; a Lei 15.397/2026 incluiu a duplicação de dispositivo ou aplicativo. Servidor fora do país: aumento de 1/3 a 2/3 (§ 2º-B). Contra idoso ou vulnerável: 1/3 ao dobro (§ 4º).",
      orientacoes: "estelionato",
    },
    {
      fato: "Fraude com ativos virtuais (criptomoedas)", artigo: "Art. 171-A", diploma: CP,
      ref: "Art. 171-A - DL2848",
      pena: "reclusão, de 4 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "bitcoin criptomoeda pirâmide investimento corretora",
      obs: "Lei 14.478/2022.",
      orientacoes: "estelionato",
    },
    {
      fato: "Outras fraudes (refeição, hospedagem ou transporte sem pagar)", artigo: "Art. 176", diploma: CP,
      ref: "Art. 176 - DL2848",
      pena: "detenção, de 15 dias a 2 meses, ou multa", acao: "condicionada", jecrim: true,
      busca: "calote restaurante hotel táxi corrida não pagou",
      obs: "Representação; o juiz pode deixar de aplicar a pena (parágrafo único).",
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
      obs: "Pena da Lei 15.397/2026 (antes: 1 a 4 anos). Em dobro se o bem é público (§ 6º) ou são fios, cabos e equipamentos de serviço essencial (§ 7º). Aumento de 2/3 por integrante de facção (§ 8º).",
    },
    {
      fato: "Receptação qualificada (atividade comercial)", artigo: "Art. 180, § 1º", diploma: CP,
      ref: "Art. 180, §1 - DL2848",
      pena: "reclusão, de 3 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "desmanche ferro-velho loja de celular usado sucata",
    },
    {
      fato: "Receptação culposa", artigo: "Art. 180, § 3º", diploma: CP,
      ref: "Art. 180, §3 - DL2848",
      pena: "detenção, de 1 mês a 1 ano, ou multa, ou ambas", acao: "incondicionada", jecrim: true,
      busca: "comprou barato demais sem nota deveria desconfiar",
      obs: "A natureza da coisa, o preço desproporcional ou quem oferece deviam fazer presumir a origem criminosa.",
    },
    {
      fato: "Receptação de animal", artigo: "Art. 180-A", diploma: CP,
      ref: "Art. 180-A - DL2848",
      pena: "reclusão, de 3 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "gado abatido carne clandestina cachorro de raça",
      obs: "Pena da Lei 15.397/2026, que incluiu o animal doméstico (antes: 2 a 5 anos).",
    },
    {
      fato: "Violação de direito autoral (pirataria com intuito de lucro)", artigo: "Art. 184, § 2º", diploma: CP,
      ref: "Art. 184, §2 - DL2848",
      pena: "reclusão, de 2 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "pirataria dvd falsificado camelô cópia",
      obs: "A violação simples (caput) é de ação privada.",
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
    },
    {
      fato: "Estupro qualificado — lesão grave ou vítima de 14 a 18 anos", artigo: "Art. 213, § 1º", diploma: CP,
      ref: "Art. 213, §1 - DL2848",
      pena: "reclusão, de 8 a 12 anos", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "adolescente",
    },
    {
      fato: "Estupro com resultado morte", artigo: "Art. 213, § 2º", diploma: CP,
      ref: "Art. 213, §2 - DL2848",
      pena: "reclusão, de 12 a 30 anos", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
    },
    {
      fato: "Violação sexual mediante fraude", artigo: "Art. 215", diploma: CP,
      ref: "Art. 215 - DL2848",
      pena: "reclusão, de 2 a 6 anos", acao: "incondicionada", jecrim: false,
      busca: "dopou drogou boa noite cinderela falso médico enganou",
    },
    {
      fato: "Importunação sexual", artigo: "Art. 215-A", diploma: CP,
      ref: "Art. 215-A - DL2848",
      pena: "reclusão, de 1 a 5 anos", acao: "incondicionada", jecrim: false,
      busca: "encoxada ejaculou passou a mão ônibus assédio na rua beijo forçado",
      obs: "Lei 13.718/2018; substituiu o antigo art. 61 da LCP. Só se o ato não constitui crime mais grave.",
    },
    {
      fato: "Assédio sexual", artigo: "Art. 216-A", diploma: CP,
      ref: "Art. 216-A - DL2848",
      pena: "detenção, de 1 a 2 anos", acao: "incondicionada", jecrim: true,
      busca: "chefe patrão superior cantada trabalho",
      obs: "Exige superioridade hierárquica ou ascendência no emprego, cargo ou função. Aumento de até 1/3 se a vítima é menor de 18 (§ 2º) — aí, sem Lei 9.099 (art. 226, § 1º, do ECA).",
    },
    {
      fato: "Registro não autorizado da intimidade sexual", artigo: "Art. 216-B", diploma: CP,
      ref: "Art. 216-B - DL2848",
      pena: "detenção, de 6 meses a 1 ano, e multa", acao: "incondicionada", jecrim: true,
      busca: "filmou fotografou nudez sem autorização câmera escondida montagem",
      obs: "O parágrafo único pune também a montagem que inclua a pessoa em cena íntima.",
    },
    {
      fato: "Estupro de vulnerável", artigo: "Art. 217-A", diploma: CP,
      ref: "Art. 217-A - DL2848",
      pena: "reclusão, de 10 a 18 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "menor de 14 vulnerável criança abuso sexual infantil dopada desacordada",
      obs: "Pena da Lei 15.280/2025 (antes: 8 a 15 anos). Vale também para quem não tem discernimento ou não pode resistir (§ 1º). Lesão grave: 12 a 24 anos; morte: 20 a 40. Consentimento e experiência sexual anterior são irrelevantes (§ 5º).",
    },
    {
      fato: "Induzimento de menor de 14 anos a satisfazer a lascívia de outrem", artigo: "Art. 218", diploma: CP,
      ref: "Art. 218 - DL2848",
      pena: "reclusão, de 6 a 14 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "corrupção sexual de menores aliciar criança",
      obs: "Pena da Lei 15.280/2025 (antes: 2 a 5 anos). Não confundir com a corrupção de menores do art. 244-B do ECA.",
    },
    {
      fato: "Satisfação de lascívia mediante presença de criança ou adolescente", artigo: "Art. 218-A", diploma: CP,
      ref: "Art. 218-A - DL2848",
      pena: "reclusão, de 5 a 12 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "ato sexual na frente de criança mostrou pornografia",
      obs: "Pena da Lei 15.280/2025 (antes: 2 a 4 anos). Vítima menor de 14.",
    },
    {
      fato: "Favorecimento da prostituição ou exploração sexual de vulnerável", artigo: "Art. 218-B", diploma: CP,
      ref: "Art. 218-B - DL2848",
      pena: "reclusão, de 7 a 16 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "exploração sexual infantil prostituição de adolescente programa",
      obs: "Pena da Lei 15.280/2025 (antes: 4 a 10 anos). Responde também quem pratica o ato com o menor de 18 e maior de 14 nessa situação (§ 2º, I).",
    },
    {
      fato: "Divulgação de cena de estupro, sexo, nudez ou pornografia", artigo: "Art. 218-C", diploma: CP,
      ref: "Art. 218-C - DL2848",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "vazou nudes vídeo íntimo divulgou pornografia de vingança",
      obs: "Pena da Lei 15.280/2025 (antes: 1 a 5 anos). Aumento de 1/3 a 2/3 se o autor teve relação íntima com a vítima, ou por vingança ou humilhação (§ 1º).",
    },
    {
      fato: "Favorecimento da prostituição ou de outra forma de exploração sexual", artigo: "Art. 228", diploma: CP,
      ref: "Art. 228 - DL2848",
      pena: "reclusão, de 2 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "aliciou para prostituição impediu de sair",
    },
    {
      fato: "Casa de prostituição", artigo: "Art. 229", diploma: CP,
      ref: "Art. 229 - DL2848",
      pena: "reclusão, de 2 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "bordel prostíbulo boate exploração sexual",
    },
    {
      fato: "Rufianismo", artigo: "Art. 230", diploma: CP,
      ref: "Art. 230 - DL2848",
      pena: "reclusão, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "cafetão tirar proveito da prostituição alheia",
    },
    {
      fato: "Ato obsceno", artigo: "Art. 233", diploma: CP,
      ref: "Art. 233 - DL2848",
      pena: "detenção, de 3 meses a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
      busca: "nu em público mostrou as partes masturbação em público",
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
    },
    {
      fato: "Abandono intelectual", artigo: "Art. 246", diploma: CP,
      ref: "Art. 246 - DL2848",
      pena: "detenção, de 15 dias a 1 mês, ou multa", acao: "incondicionada", jecrim: false,
      busca: "filho fora da escola evasão escolar conselho tutelar",
      obs: "Vítima criança: a Lei 9.099/1995 não se aplica (art. 226, § 1º, do ECA).",
    },
    {
      fato: "Sonegação de incapaz (não devolver o filho)", artigo: "Art. 248", diploma: CP,
      ref: "Art. 248 - DL2848",
      pena: "detenção, de 1 mês a 1 ano, ou multa", acao: "incondicionada", jecrim: false,
      busca: "não devolveu o filho depois da visita guarda pai mãe",
      obs: "Inclui deixar de entregar o menor a quem legitimamente o reclame. Vítima criança: sem Lei 9.099/1995 (art. 226, § 1º, do ECA).",
    },
    {
      fato: "Subtração de incapazes", artigo: "Art. 249", diploma: CP,
      ref: "Art. 249 - DL2848",
      pena: "detenção, de 2 meses a 2 anos", acao: "incondicionada", jecrim: false,
      busca: "levou a criança sumiu com o filho tirou da guarda",
      obs: "O pai ou tutor também comete, se destituído ou privado da guarda (§ 1º). Vítima criança: sem Lei 9.099/1995. Para colocação em lar substituto, é o art. 237 do ECA.",
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
      obs: "Aumento de 1/3 em casa habitada, edifício público, por vantagem pecuniária, entre outros (§ 1º). Culposo (§ 2º): detenção, de 6 meses a 2 anos.",
    },
    {
      fato: "Exercício ilegal da medicina, arte dentária ou farmacêutica", artigo: "Art. 282", diploma: CP,
      ref: "Art. 282 - DL2848",
      pena: "detenção, de 6 meses a 2 anos", acao: "incondicionada", jecrim: true,
      busca: "falso médico dentista sem registro procedimento estético",
      obs: "Com fim de lucro, também multa.",
    },
    {
      fato: "Incitação ao crime", artigo: "Art. 286", diploma: CP,
      ref: "Art. 286 - DL2848",
      pena: "detenção, de 3 a 6 meses, ou multa", acao: "incondicionada", jecrim: true,
    },
    {
      fato: "Apologia de crime ou criminoso", artigo: "Art. 287", diploma: CP,
      ref: "Art. 287 - DL2848",
      pena: "detenção, de 3 a 6 meses, ou multa", acao: "incondicionada", jecrim: true,
    },
    {
      fato: "Associação criminosa", artigo: "Art. 288", diploma: CP,
      ref: "Art. 288 - DL2848",
      pena: "reclusão, de 1 a 3 anos", acao: "incondicionada", jecrim: false,
      busca: "quadrilha bando três ou mais pessoas",
      obs: "Três ou mais pessoas, para cometer crimes. Aumenta até a metade se armada ou com criança ou adolescente (§ 1º). Quem solicita ou contrata crime a integrante responde pelo caput (§ 2º, Lei 15.245/2025).",
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
    },
    {
      fato: "Moeda falsa recebida de boa-fé e repassada", artigo: "Art. 289, § 2º", diploma: CP,
      ref: "Art. 289, §2 - DL2848",
      pena: "detenção, de 6 meses a 2 anos, e multa", acao: "incondicionada", jecrim: true,
      busca: "recebeu nota falsa de troco e passou adiante",
      obs: "Recebeu como verdadeira e, depois de saber da falsidade, devolveu à circulação.",
    },
    {
      fato: "Falsificação de documento público", artigo: "Art. 297", diploma: CP,
      ref: "Art. 297 - DL2848",
      pena: "reclusão, de 2 a 6 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "cnh falsa rg falso documento falsificado carteira de trabalho",
    },
    {
      fato: "Falsificação de documento particular", artigo: "Art. 298", diploma: CP,
      ref: "Art. 298 - DL2848",
      pena: "reclusão, de 1 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "contrato falso recibo falso cartão de crédito clonado",
      obs: "Cartão de crédito ou débito equipara-se a documento particular (parágrafo único).",
    },
    {
      fato: "Falsidade ideológica", artigo: "Art. 299", diploma: CP,
      ref: "Art. 299 - DL2848",
      pena: "reclusão, de 1 a 5 anos, e multa (documento público)", acao: "incondicionada", jecrim: false,
      busca: "declaração falsa informação falsa no documento",
      obs: "Documento particular: reclusão, de 1 a 3 anos, e multa. O documento é verdadeiro; falso é o conteúdo.",
    },
    {
      fato: "Uso de documento falso", artigo: "Art. 304", diploma: CP,
      ref: "Art. 304 - DL2848",
      pena: "a mesma do documento falsificado", acao: "incondicionada", jecrim: false,
      prescricao: "conforme o documento",
      busca: "apresentou cnh falsa na abordagem",
    },
    {
      fato: "Falsa identidade", artigo: "Art. 307", diploma: CP,
      ref: "Art. 307 - DL2848",
      pena: "detenção, de 3 meses a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
      busca: "deu nome falso identificou-se como outro mentiu o nome",
      obs: "Típica mesmo em autodefesa, perante a autoridade policial (Súmula 522 do STJ).",
    },
    {
      fato: "Uso de documento de identidade alheio", artigo: "Art. 308", diploma: CP,
      ref: "Art. 308 - DL2848",
      pena: "detenção, de 4 meses a 2 anos, e multa", acao: "incondicionada", jecrim: true,
      busca: "usou o rg do irmão documento de outra pessoa",
    },
    {
      fato: "Adulteração de sinal identificador de veículo", artigo: "Art. 311", diploma: CP,
      ref: "Art. 311 - DL2848",
      pena: "reclusão, de 3 a 6 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "chassi raspado placa adulterada motor remarcado clone dublê",
      obs: "Lei 14.562/2023 incluiu veículo elétrico, híbrido, reboque e componentes, e quem adquire ou conduz o veículo adulterado (§ 2º, III).",
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
    },
    {
      fato: "Concussão", artigo: "Art. 316", diploma: CP,
      ref: "Art. 316 - DL2848",
      pena: "reclusão, de 2 a 12 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "servidor exigiu dinheiro propina",
    },
    {
      fato: "Corrupção passiva", artigo: "Art. 317", diploma: CP,
      ref: "Art. 317 - DL2848",
      pena: "reclusão, de 2 a 12 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "servidor pediu aceitou propina",
    },
    {
      fato: "Usurpação de função pública", artigo: "Art. 328", diploma: CP,
      ref: "Art. 328 - DL2848",
      pena: "detenção, de 3 meses a 2 anos, e multa", acao: "incondicionada", jecrim: true,
      busca: "falso policial se passou por fiscal agente",
      obs: "Se aufere vantagem (parágrafo único): reclusão, de 2 a 5 anos, e multa.",
    },
    {
      fato: "Resistência", artigo: "Art. 329", diploma: CP,
      ref: "Art. 329 - DL2848",
      pena: "detenção, de 2 meses a 2 anos", acao: "incondicionada", jecrim: true,
      busca: "resistiu à prisão se debateu agrediu o policial",
      obs: "Se o ato, por causa da resistência, não se executa (§ 1º): reclusão, de 1 a 3 anos. Penas da violência à parte (§ 2º).",
    },
    {
      fato: "Desobediência", artigo: "Art. 330", diploma: CP,
      ref: "Art. 330 - DL2848",
      pena: "detenção, de 15 dias a 6 meses, e multa", acao: "incondicionada", jecrim: true,
      busca: "não parou na blitz desobedeceu ordem",
    },
    {
      fato: "Desacato", artigo: "Art. 331", diploma: CP,
      ref: "Art. 331 - DL2848",
      pena: "detenção, de 6 meses a 2 anos, ou multa", acao: "incondicionada", jecrim: true,
      busca: "xingou policial ofendeu servidor",
    },
    {
      fato: "Corrupção ativa", artigo: "Art. 333", diploma: CP,
      ref: "Art. 333 - DL2848",
      pena: "reclusão, de 2 a 12 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "ofereceu propina dinheiro ao policial para liberar",
    },
    {
      fato: "Descaminho", artigo: "Art. 334", diploma: CP,
      ref: "Art. 334 - DL2848",
      pena: "reclusão, de 1 a 4 anos", acao: "incondicionada", jecrim: false,
      busca: "mercadoria do Paraguai sem nota sem imposto muamba",
      obs: "Competência da Justiça Federal.",
    },
    {
      fato: "Contrabando", artigo: "Art. 334-A", diploma: CP,
      ref: "Art. 334-A - DL2848",
      pena: "reclusão, de 2 a 5 anos", acao: "incondicionada", jecrim: false,
      busca: "cigarro paraguaio mercadoria proibida",
      obs: "Mercadoria proibida. Competência da Justiça Federal.",
    },
    {
      fato: "Descumprimento de medida protetiva de urgência (Código Penal)", artigo: "Art. 338-A", diploma: CP,
      ref: "Art. 338-A - DL2848",
      pena: "reclusão, de 2 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      fianca: "juiz",
      busca: "medida protetiva descumpriu crime sexual",
      obs: "Lei 15.280/2025. Vale para medida protetiva de qualquer lei; contra a mulher em violência doméstica, segue o art. 24-A da Lei Maria da Penha. No flagrante, só o juiz concede fiança.",
    },
    {
      fato: "Denunciação caluniosa", artigo: "Art. 339", diploma: CP,
      ref: "Art. 339 - DL2848",
      pena: "reclusão, de 2 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "acusou falsamente na polícia registrou ocorrência contra inocente",
      obs: "Dá causa a investigação ou processo contra quem sabe inocente.",
    },
    {
      fato: "Comunicação falsa de crime ou contravenção", artigo: "Art. 340", diploma: CP,
      ref: "Art. 340 - DL2848",
      pena: "detenção, de 1 a 6 meses, ou multa", acao: "incondicionada", jecrim: true,
      busca: "registrou bo falso mentiu na ocorrência inventou furto seguro",
    },
    {
      fato: "Autoacusação falsa", artigo: "Art. 341", diploma: CP,
      ref: "Art. 341 - DL2848",
      pena: "detenção, de 3 meses a 2 anos, ou multa", acao: "incondicionada", jecrim: true,
      busca: "assumiu a culpa por outro",
    },
    {
      fato: "Falso testemunho ou falsa perícia", artigo: "Art. 342", diploma: CP,
      ref: "Art. 342 - DL2848",
      pena: "reclusão, de 2 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "testemunha mentiu depoimento falso",
      obs: "Deixa de ser punível se o agente se retrata antes da sentença (§ 2º).",
    },
    {
      fato: "Coação no curso do processo", artigo: "Art. 344", diploma: CP,
      ref: "Art. 344 - DL2848",
      pena: "reclusão, de 1 a 4 anos, e multa, além da pena da violência", acao: "incondicionada", jecrim: false,
      busca: "ameaçou testemunha vítima para retirar queixa mudar depoimento",
      obs: "Aumento de 1/3 até a metade se o processo envolve crime contra a dignidade sexual (parágrafo único).",
    },
    {
      fato: "Exercício arbitrário das próprias razões", artigo: "Art. 345", diploma: CP,
      ref: "Art. 345 - DL2848",
      pena: "detenção, de 15 dias a 1 mês, ou multa, além da pena da violência", acao: "privada", jecrim: true,
      busca: "fazer justiça com as próprias mãos tomou de volta cobrou dívida",
      obs: "Ação pública quando houver violência.",
    },
    {
      fato: "Fraude processual", artigo: "Art. 347", diploma: CP,
      ref: "Art. 347 - DL2848",
      pena: "detenção, de 3 meses a 2 anos, e multa", acao: "incondicionada", jecrim: true,
      busca: "alterou a cena do crime limpou o local escondeu prova",
      obs: "Em dobro se destinada a produzir efeito em processo penal (parágrafo único) — aí não é JECRIM.",
    },
    {
      fato: "Favorecimento pessoal", artigo: "Art. 348", diploma: CP,
      ref: "Art. 348 - DL2848",
      pena: "detenção, de 1 a 6 meses, e multa", acao: "incondicionada", jecrim: true,
      busca: "escondeu o foragido ajudou a fugir",
      obs: "Isento de pena o ascendente, descendente, cônjuge ou irmão do favorecido (§ 2º).",
    },
    {
      fato: "Ingresso de celular em estabelecimento prisional", artigo: "Art. 349-A", diploma: CP,
      ref: "Art. 349-A - DL2848",
      pena: "detenção, de 3 meses a 1 ano", acao: "incondicionada", jecrim: true,
      busca: "levou celular para preso visita presídio",
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
      obs: "Pena da Lei 14.994/2024 (antes: detenção, de 3 meses a 2 anos). Independe da competência civil ou criminal do juiz que deferiu (§ 1º). No flagrante, só o juiz concede fiança (§ 2º). Aumento de 1/3 até a metade se violou área de exclusão monitorada ou mexeu na tornozeleira (§ 4º, Lei 15.383/2026).",
      orientacoes: "violencia_domestica",
      texto:
        "Descumprir decisão judicial que defere medidas protetivas de urgência " +
        "previstas nesta Lei:\n" +
        "Pena – reclusão, de 2 (dois) a 5 (cinco) anos, e multa.",
    },
  ]),

  // ======================================================================
  grupo("Criança e adolescente (ECA)", [
  // ======================================================================
    {
      fato: "Privação ilegal da liberdade de criança ou adolescente", artigo: "Art. 230", diploma: ECA,
      ref: "Art. 230 - L8069",
      pena: "detenção, de 6 meses a 2 anos", acao: "incondicionada", jecrim: false,
      busca: "apreendeu adolescente sem flagrante sem ordem",
      obs: "Sem flagrante de ato infracional nem ordem escrita do juiz. A Lei 9.099/1995 não se aplica (§ 2º, Lei 15.163/2025). Os crimes do ECA são todos de ação pública incondicionada (art. 227).",
    },
    {
      fato: "Submeter criança ou adolescente a vexame ou constrangimento", artigo: "Art. 232", diploma: ECA,
      ref: "Art. 232 - L8069",
      pena: "detenção, de 6 meses a 2 anos", acao: "incondicionada", jecrim: false,
      busca: "humilhou a criança expôs constrangimento escola",
      obs: "Vítima sob autoridade, guarda ou vigilância do autor. Sem Lei 9.099/1995 (art. 226, § 1º).",
    },
    {
      fato: "Impedir ou embaraçar a ação do Conselho Tutelar, do juiz ou do MP", artigo: "Art. 236", diploma: ECA,
      ref: "Art. 236 - L8069",
      pena: "detenção, de 6 meses a 2 anos", acao: "incondicionada", jecrim: false,
      busca: "conselheiro tutelar impediu visita atrapalhou",
    },
    {
      fato: "Subtrair criança ou adolescente para colocação em lar substituto", artigo: "Art. 237", diploma: ECA,
      ref: "Art. 237 - L8069",
      pena: "reclusão, de 2 a 6 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "adoção ilegal levou o bebê",
    },
    {
      fato: "Prometer ou entregar filho mediante paga ou recompensa", artigo: "Art. 238", diploma: ECA,
      ref: "Art. 238 - L8069",
      pena: "reclusão, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "vendeu o filho bebê adoção à brasileira",
      obs: "Quem oferece ou paga responde igual (parágrafo único).",
    },
    {
      fato: "Envio irregular de criança ou adolescente ao exterior", artigo: "Art. 239", diploma: ECA,
      ref: "Art. 239 - L8069",
      pena: "reclusão, de 4 a 6 anos, e multa", acao: "incondicionada", jecrim: false,
      obs: "Com violência, grave ameaça ou fraude (parágrafo único): 6 a 8 anos, além da pena da violência.",
    },
    {
      fato: "Produzir ou registrar violência sexual contra criança ou adolescente", artigo: "Art. 240", diploma: ECA,
      ref: "Art. 240 - L8069",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "filmou fotografou criança pornografia infantil abuso",
      obs: "Pena e hediondez da Lei 15.487/2026 (antes: 4 a 8 anos), que trocou \"cena de sexo explícito ou pornográfica\" por \"violência sexual\". Inclui conteúdo gerado por inteligência artificial.",
    },
    {
      fato: "Vender material de violência sexual contra criança ou adolescente", artigo: "Art. 241", diploma: ECA,
      ref: "Art. 241 - L8069",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "venda de pornografia infantil",
      obs: "Lei 15.487/2026, com perda dos valores recebidos.",
    },
    {
      fato: "Divulgar ou compartilhar material de violência sexual contra criança ou adolescente", artigo: "Art. 241-A", diploma: ECA,
      ref: "Art. 241-A - L8069",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "pornografia infantil compartilhou enviou grupo divulgou",
      obs: "Pena da Lei 15.487/2026 (antes: 3 a 6 anos). Alcança quem administra ou modera site, fórum ou grupo. Aumento de 1/3 com publicação em mais de uma plataforma (§ 3º).",
    },
    {
      fato: "Adquirir, possuir, armazenar ou acessar material de violência sexual contra criança ou adolescente", artigo: "Art. 241-B", diploma: ECA,
      ref: "Art. 241-B - L8069",
      pena: "reclusão, de 3 a 6 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "pornografia infantil armazenou baixou no celular computador",
      obs: "Pena da Lei 15.487/2026 (antes: 1 a 4 anos). Acessar ou visualizar em plataforma ou streaming também é crime (§ 4º). Redução de 1/6 a 1/3 para pequena quantidade (§ 1º).",
    },
    {
      fato: "Simular a participação de criança ou adolescente em violência sexual", artigo: "Art. 241-C", diploma: ECA,
      ref: "Art. 241-C - L8069",
      pena: "reclusão, de 3 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "montagem deepfake inteligência artificial nudes falsos de criança",
      obs: "Pena da Lei 15.487/2026 (antes: 1 a 3 anos), que incluiu alteração de imagem ou voz por inteligência artificial.",
    },
    {
      fato: "Aliciar ou assediar criança por meio de comunicação (grooming)", artigo: "Art. 241-D", diploma: ECA,
      ref: "Art. 241-D - L8069",
      pena: "reclusão, de 3 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "aliciamento online pediu fotos da criança jogo rede social chat",
      obs: "Pena da Lei 15.487/2026 (antes: 1 a 3 anos). Vítima menor de 14. Aumento de 1/3 a 2/3 com perfil falso, IA ou anonimização (§ 2º).",
    },
    {
      fato: "Vender ou fornecer arma, munição ou explosivo a criança ou adolescente", artigo: "Art. 242", diploma: ECA,
      ref: "Art. 242 - L8069",
      pena: "reclusão, de 3 a 6 anos", acao: "incondicionada", jecrim: false,
      busca: "deu arma ao menor",
    },
    {
      fato: "Vender ou fornecer bebida alcoólica ou droga a criança ou adolescente", artigo: "Art. 243", diploma: ECA,
      ref: "Art. 243 - L8069",
      pena: "detenção, de 2 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "vendeu cerveja bebida para menor bar festa cigarro",
      obs: "Ainda que gratuitamente. Aumento de 1/3 até a metade se o menor consome (parágrafo único, Lei 15.234/2025). Só se o fato não constitui crime mais grave.",
    },
    {
      fato: "Vender ou fornecer fogos de artifício a criança ou adolescente", artigo: "Art. 244", diploma: ECA,
      ref: "Art. 244 - L8069",
      pena: "detenção, de 6 meses a 2 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "rojão bomba foguete",
    },
    {
      fato: "Submeter criança ou adolescente à exploração sexual", artigo: "Art. 244-A", diploma: ECA,
      ref: "Art. 244-A - L8069",
      pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "prostituição infantil exploração sexual",
      obs: "Hediondo pela Lei 15.487/2026, que tirou a palavra \"prostituição\" do tipo.",
    },
    {
      fato: "Corrupção de menores", artigo: "Art. 244-B", diploma: ECA,
      ref: "Art. 244-B - L8069",
      pena: "reclusão, de 1 a 4 anos", acao: "incondicionada", jecrim: false,
      busca: "praticou crime com menor usou adolescente",
      obs: "Crime formal: não precisa provar que o menor foi corrompido (Súmula 500 do STJ). Aumento de 1/3 se a infração é hedionda (§ 2º).",
    },
    {
      fato: "Deixar de comunicar o desaparecimento de criança ou adolescente", artigo: "Art. 244-C", diploma: ECA,
      ref: "Art. 244-C - L8069",
      pena: "reclusão, de 2 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "filho desaparecido não avisou a polícia",
      obs: "Pai, mãe ou responsável legal, de forma dolosa. Lei 14.811/2024.",
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
    },
    {
      fato: "Cultivo de planta para consumo pessoal", artigo: "Art. 28, § 1º", diploma: DROGAS,
      ref: "Art. 28, §1 - L11343",
      pena: "advertência, prestação de serviços à comunidade ou medida educativa",
      acao: "outra", jecrim: true,
      prescricao: "2 anos",
      busca: "pé de maconha plantou em casa",
      obs: "Maconha até seis plantas fêmeas: ilícito administrativo (STF, Tema 506).",
    },
    {
      fato: "Tráfico de drogas", artigo: "Art. 33", diploma: DROGAS,
      ref: "Art. 33 - L11343",
      pena: "reclusão, de 5 a 15 anos, e 500 a 1.500 dias-multa", acao: "incondicionada", jecrim: false,
      marcas: ["equiparado"],
      busca: "tráfico vender droga boca de fumo entorpecente",
      obs: "Privilegiado (§ 4º): redução de 1/6 a 2/3 para primário, de bons antecedentes, sem organização criminosa — e aí não é equiparado a hediondo. Aumentos de 1/6 a 2/3 do art. 40 (escola, presídio, arma, criança…). Em dobro por integrante de facção (art. 40-A, Lei 15.358/2026).",
    },
    {
      fato: "Tráfico — matéria-prima, cultivo ou uso de local", artigo: "Art. 33, § 1º", diploma: DROGAS,
      ref: "Art. 33, §1 - L11343",
      pena: "reclusão, de 5 a 15 anos, e 500 a 1.500 dias-multa", acao: "incondicionada", jecrim: false,
      marcas: ["equiparado"],
      busca: "plantação insumo laboratório cedeu a casa para o tráfico policial disfarçado",
      obs: "I: matéria-prima ou insumo. II: semear, cultivar, colher. III: usar ou ceder local. IV: vender a policial disfarçado, havendo indícios de conduta criminal preexistente.",
    },
    {
      fato: "Induzir, instigar ou auxiliar alguém ao uso de droga", artigo: "Art. 33, § 2º", diploma: DROGAS,
      ref: "Art. 33, §2 - L11343",
      pena: "detenção, de 1 a 3 anos, e 100 a 300 dias-multa", acao: "incondicionada", jecrim: false,
      busca: "incentivou a usar",
    },
    {
      fato: "Oferecer droga eventualmente, sem lucro, para consumo conjunto", artigo: "Art. 33, § 3º", diploma: DROGAS,
      ref: "Art. 33, §3 - L11343",
      pena: "detenção, de 6 meses a 1 ano, e 700 a 1.500 dias-multa", acao: "incondicionada", jecrim: true,
      busca: "dividiu o baseado com amigo",
      obs: "Pessoa de seu relacionamento, para juntos consumirem. Sem prejuízo das penas do art. 28.",
    },
    {
      fato: "Maquinário ou objeto para fabricar droga", artigo: "Art. 34", diploma: DROGAS,
      ref: "Art. 34 - L11343",
      pena: "reclusão, de 3 a 10 anos, e 1.200 a 2.000 dias-multa", acao: "incondicionada", jecrim: false,
      marcas: ["inafiancavel"],
      busca: "prensa balança laboratório refino",
    },
    {
      fato: "Associação para o tráfico", artigo: "Art. 35", diploma: DROGAS,
      ref: "Art. 35 - L11343",
      pena: "reclusão, de 3 a 10 anos, e 700 a 1.200 dias-multa", acao: "incondicionada", jecrim: false,
      marcas: ["inafiancavel"],
      busca: "associação duas ou mais pessoas tráfico",
      obs: "Duas ou mais pessoas, com estabilidade. Não é equiparado a hediondo (STJ). Inafiançável pelo art. 44.",
    },
    {
      fato: "Financiar ou custear o tráfico", artigo: "Art. 36", diploma: DROGAS,
      ref: "Art. 36 - L11343",
      pena: "reclusão, de 8 a 20 anos, e 1.500 a 4.000 dias-multa", acao: "incondicionada", jecrim: false,
      marcas: ["inafiancavel"],
      busca: "financiador investidor",
    },
    {
      fato: "Colaborar como informante com o tráfico", artigo: "Art. 37", diploma: DROGAS,
      ref: "Art. 37 - L11343",
      pena: "reclusão, de 2 a 6 anos, e 300 a 700 dias-multa", acao: "incondicionada", jecrim: false,
      marcas: ["inafiancavel"],
      busca: "olheiro fogueteiro avisou a chegada da polícia",
    },
    {
      fato: "Prescrever ou ministrar droga culposamente", artigo: "Art. 38", diploma: DROGAS,
      ref: "Art. 38 - L11343",
      pena: "detenção, de 6 meses a 2 anos, e 50 a 200 dias-multa", acao: "incondicionada", jecrim: true,
      busca: "médico farmacêutico dose excessiva receita",
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
    },
    {
      fato: "Omissão de cautela (menor ou deficiente se apodera de arma)", artigo: "Art. 13", diploma: ARMAS,
      ref: "Art. 13 - L10826",
      pena: "detenção, de 1 a 2 anos, e multa", acao: "incondicionada", jecrim: true,
      busca: "criança pegou a arma do pai",
      obs: "Deixar de comunicar à polícia, em 24 h, perda, furto ou roubo de arma também é crime (parágrafo único, para proprietário ou diretor de empresa de segurança).",
    },
    {
      fato: "Porte ilegal de arma de fogo de uso permitido", artigo: "Art. 14",
      diploma: ARMAS,
      ref: "Art. 14 - L10826",
      pena: "reclusão, de 2 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "arma na cintura no carro munição",
      obs: "Também munição ou acessório. A inafiançabilidade do parágrafo único caiu no STF (ADI 3.112). Aumento de 2/3 se ligada ao tráfico (art. 21-A).",
    },
    {
      fato: "Disparo de arma de fogo", artigo: "Art. 15", diploma: ARMAS,
      ref: "Art. 15 - L10826",
      pena: "reclusão, de 2 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "tiro para o alto disparou em via pública",
      obs: "Em lugar habitado ou adjacências, em via pública ou em direção a ela, se não tiver por finalidade outro crime.",
    },
    {
      fato: "Posse ou porte de arma de fogo de uso restrito", artigo: "Art. 16", diploma: ARMAS,
      ref: "Art. 16 - L10826",
      pena: "reclusão, de 3 a 6 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "calibre restrito pistola .40 9mm",
      obs: "Aumento de 2/3 se ligada ao tráfico (art. 21-A).",
    },
    {
      fato: "Arma com numeração raspada ou suprimida", artigo: "Art. 16, § 1º, IV", diploma: ARMAS,
      ref: "Art. 16, §1, IV - L10826",
      pena: "reclusão, de 3 a 6 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "numeração raspada lixada adulterada",
      obs: "Mesma pena para arma de qualquer calibre. Não é hediondo (STJ).",
    },
    {
      fato: "Posse ou porte de arma de fogo de uso proibido", artigo: "Art. 16, § 2º", diploma: ARMAS,
      ref: "Art. 16, §2 - L10826",
      pena: "reclusão, de 4 a 12 anos", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "fuzil automático granada",
    },
    {
      fato: "Comércio ilegal de arma de fogo", artigo: "Art. 17", diploma: ARMAS,
      ref: "Art. 17 - L10826",
      pena: "reclusão, de 6 a 12 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "vendia armas munição",
    },
    {
      fato: "Tráfico internacional de arma de fogo", artigo: "Art. 18", diploma: ARMAS,
      ref: "Art. 18 - L10826",
      pena: "reclusão, de 8 a 16 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["hediondo"],
      busca: "trouxe arma do Paraguai fronteira",
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
      obs: "Aumento de 1/3 à metade sem habilitação, na faixa de pedestres, com omissão de socorro ou no transporte de passageiros (§ 1º).",
      orientacoes: "transito",
    },
    {
      fato: "Homicídio culposo no trânsito sob influência de álcool ou droga", artigo: "Art. 302, § 3º", diploma: CTB,
      ref: "Art. 302, §3 - L9503",
      pena: "reclusão, de 5 a 8 anos, e suspensão da habilitação", acao: "incondicionada", jecrim: false,
      busca: "motorista bêbado matou embriagado atropelou",
      orientacoes: "transito",
    },
    {
      fato: "Lesão corporal culposa na direção de veículo", artigo: "Art. 303",
      diploma: CTB,
      ref: "Art. 303 - L9503",
      pena: "detenção, de 6 meses a 2 anos, e suspensão da habilitação",
      acao: "condicionada", jecrim: true,
      busca: "acidente atropelamento colisão com ferido",
      obs: "A representação cai (e a Lei 9.099 deixa de se aplicar) se houver álcool, racha ou velocidade 50 km/h acima da via — art. 291, § 1º.",
      orientacoes: "transito",
    },
    {
      fato: "Lesão grave no trânsito sob influência de álcool ou droga", artigo: "Art. 303, § 2º", diploma: CTB,
      ref: "Art. 303, §2 - L9503",
      pena: "reclusão, de 2 a 5 anos, e suspensão da habilitação", acao: "incondicionada", jecrim: false,
      busca: "bêbado feriu gravemente",
      obs: "Lesão grave ou gravíssima.",
      orientacoes: "transito",
    },
    {
      fato: "Omissão de socorro no trânsito", artigo: "Art. 304", diploma: CTB,
      ref: "Art. 304 - L9503",
      pena: "detenção, de 6 meses a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
      busca: "não socorreu a vítima do acidente",
      obs: "Do condutor envolvido no acidente, sem culpa. Se houve culpa, é causa de aumento dos arts. 302 e 303.",
      orientacoes: "transito",
    },
    {
      fato: "Fuga do local do acidente", artigo: "Art. 305", diploma: CTB,
      ref: "Art. 305 - L9503",
      pena: "detenção, de 6 meses a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
      busca: "evadiu-se atropelou e fugiu bateu e fugiu",
      obs: "Constitucional (STF, RE 971.959).",
      orientacoes: "transito",
    },
    {
      fato: "Embriaguez ao volante", artigo: "Art. 306", diploma: CTB,
      ref: "Art. 306 - L9503",
      pena: "detenção, de 6 meses a 3 anos, multa e suspensão da habilitação",
      acao: "incondicionada", jecrim: false,
      busca: "bafômetro alcoolizado dirigindo bêbado teste recusa etilômetro",
      obs: "Configura-se com 6 dg/L de álcool no sangue, 0,3 mg/L no ar alveolar ou sinais de alteração da capacidade psicomotora.",
      orientacoes: "transito",
    },
    {
      fato: "Dirigir com a habilitação suspensa ou proibida", artigo: "Art. 307", diploma: CTB,
      ref: "Art. 307 - L9503",
      pena: "detenção, de 6 meses a 1 ano, e multa", acao: "incondicionada", jecrim: true,
      busca: "cnh suspensa cassada dirigindo",
      orientacoes: "transito",
    },
    {
      fato: "Racha (disputa de corrida)", artigo: "Art. 308", diploma: CTB,
      ref: "Art. 308 - L9503",
      pena: "detenção, de 6 meses a 3 anos, multa e suspensão", acao: "incondicionada", jecrim: false,
      busca: "pega racha corrida na via manobra exibição",
      obs: "Lesão grave (§ 1º): reclusão, de 3 a 6 anos. Morte (§ 2º): reclusão, de 5 a 10 anos.",
      orientacoes: "transito",
    },
    {
      fato: "Dirigir sem habilitação gerando perigo de dano", artigo: "Art. 309",
      diploma: CTB,
      ref: "Art. 309 - L9503",
      pena: "detenção, de 6 meses a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
      busca: "sem carteira sem cnh inabilitado",
      obs: "Sem o perigo de dano concreto, é infração administrativa, não crime.",
      orientacoes: "transito",
    },
    {
      fato: "Entregar veículo a pessoa não habilitada", artigo: "Art. 310",
      diploma: CTB,
      ref: "Art. 310 - L9503",
      pena: "detenção, de 6 meses a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
      busca: "emprestou o carro ao filho menor sem carteira embriagado",
      obs: "Também a quem está com a habilitação suspensa, embriagado ou sem condições. Crime de perigo abstrato (Súmula 575 do STJ).",
      orientacoes: "transito",
    },
    {
      fato: "Velocidade incompatível perto de escola, hospital ou aglomeração", artigo: "Art. 311", diploma: CTB,
      ref: "Art. 311 - L9503",
      pena: "detenção, de 6 meses a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
      busca: "alta velocidade em frente à escola",
      obs: "Gerando perigo de dano.",
      orientacoes: "transito",
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
    },
    {
      fato: "Vias de fato", artigo: "Art. 21", diploma: LCP,
      ref: "Art. 21 - DL3688",
      pena: "prisão simples, de 15 dias a 3 meses, ou multa", acao: "incondicionada", jecrim: true,
      busca: "empurrão tapa agressão sem lesão puxão de cabelo",
      obs: "Agressão que não deixa lesão constatada. Havendo lesão, é o art. 129 do CP.",
      orientacoes: "lesao",
    },
    {
      fato: "Vias de fato contra a mulher por razões da condição do sexo feminino", artigo: "Art. 21, § 2º", diploma: LCP,
      ref: "Art. 21, §2 - DL3688",
      pena: "prisão simples, de 45 dias a 9 meses, ou multa", acao: "incondicionada", jecrim: false,
      marcas: ["domestica"],
      busca: "empurrou a esposa tapa companheira puxão de cabelo maria da penha",
      obs: "Pena em triplo (Lei 14.994/2024). Não se soma a agravante de violência doméstica (STJ, Tema 1.333). " + VD_SEM_JECRIM,
      orientacoes: "violencia_domestica",
    },
    {
      fato: "Omissão de cautela na guarda de animais", artigo: "Art. 31",
      diploma: LCP,
      ref: "Art. 31 - DL3688",
      pena: "prisão simples, de 10 dias a 2 meses, ou multa", acao: "incondicionada", jecrim: true,
      busca: "cachorro solto mordeu animal na rua pitbull",
    },
    {
      fato: "Direção perigosa de veículo na via pública", artigo: "Art. 34", diploma: LCP,
      ref: "Art. 34 - DL3688",
      pena: "prisão simples, de 15 dias a 3 meses, ou multa", acao: "incondicionada", jecrim: true,
      busca: "zerinho cavalo de pau manobra perigosa empinar moto",
      obs: "Só quando o fato não se encaixa num crime do CTB.",
    },
    {
      fato: "Perturbação do trabalho ou do sossego alheios", artigo: "Art. 42",
      diploma: LCP,
      ref: "Art. 42 - DL3688",
      pena: "prisão simples, de 15 dias a 3 meses, ou multa", acao: "incondicionada", jecrim: true,
      busca: "som alto barulho vizinho festa música madrugada latido",
      obs: "Gritaria ou algazarra, profissão ruidosa, instrumentos sonoros, ou barulho de animal sob sua guarda.",
    },
    {
      fato: "Exercício ilegal de profissão ou atividade", artigo: "Art. 47", diploma: LCP,
      ref: "Art. 47 - DL3688",
      pena: "prisão simples, de 15 dias a 3 meses, ou multa", acao: "incondicionada", jecrim: true,
      busca: "falso advogado corretor sem registro sem habilitação profissional",
      obs: "Medicina, odontologia e farmácia são o art. 282 do CP.",
    },
    {
      fato: "Jogo de azar", artigo: "Art. 50", diploma: LCP,
      ref: "Art. 50 - DL3688",
      pena: "prisão simples, de 3 meses a 1 ano, e multa", acao: "incondicionada", jecrim: true,
      busca: "caça-níquel bingo cassino máquina",
      obs: "Jogo do bicho é o art. 58 do Dec.-Lei 6.259/1944.",
    },
    {
      fato: "Embriaguez", artigo: "Art. 62", diploma: LCP,
      ref: "Art. 62 - DL3688",
      pena: "prisão simples, de 15 dias a 3 meses, ou multa", acao: "incondicionada", jecrim: true,
      busca: "bêbado na rua causando escândalo",
      obs: "Em público, de modo que cause escândalo ou ponha em perigo a própria segurança ou a alheia.",
    },
    {
      fato: "Recusa de dados sobre a própria identidade", artigo: "Art. 68", diploma: LCP,
      ref: "Art. 68 - DL3688",
      pena: "multa", acao: "incondicionada", jecrim: true,
      prescricao: "2 anos",
      busca: "não quis se identificar recusou dar o nome",
      obs: "Prestar declaração falsa (parágrafo único): prisão simples, de 1 a 6 meses, e multa. Prescrição da pena só de multa: art. 114, I, do CP.",
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
    },
    {
      fato: "Omissão de socorro à pessoa idosa", artigo: "Art. 97", diploma: IDOSO,
      ref: "Art. 97 - L10741",
      pena: "detenção, de 6 meses a 1 ano, e multa", acao: "incondicionada", jecrim: false,
      busca: "deixou o idoso sem assistência saúde",
    },
    {
      fato: "Abandonar pessoa idosa em hospital ou casa de repouso", artigo: "Art. 98", diploma: IDOSO,
      ref: "Art. 98 - L10741",
      pena: "detenção, de 6 meses a 3 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "largou o idoso no hospital asilo não provê necessidades",
    },
    {
      fato: "Maus-tratos ou exposição a perigo de pessoa idosa", artigo: "Art. 99", diploma: IDOSO,
      ref: "Art. 99 - L10741",
      pena: "reclusão, de 2 a 5 anos", acao: "incondicionada", jecrim: false,
      busca: "idoso maltratado sem comida trabalho excessivo",
      obs: "Penas da Lei 15.163/2025 (antes: detenção, de 2 meses a 1 ano). Lesão grave (§ 1º): 3 a 7 anos. Morte (§ 2º): 8 a 14 anos.",
    },
    {
      fato: "Apropriação de bens ou proventos de pessoa idosa", artigo: "Art. 102",
      diploma: IDOSO,
      ref: "Art. 102 - L10741",
      pena: "reclusão, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "aposentadoria do idoso pegou o dinheiro benefício desviou pensão",
    },
    {
      fato: "Reter cartão ou documento de pessoa idosa", artigo: "Art. 104", diploma: IDOSO,
      ref: "Art. 104 - L10741",
      pena: "detenção, de 6 meses a 2 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "ficou com o cartão do idoso agiota cartão do benefício",
      obs: "Como garantia de dívida ou para receber benefício.",
    },
    {
      fato: "Induzir pessoa idosa sem discernimento a outorgar procuração", artigo: "Art. 106", diploma: IDOSO,
      ref: "Art. 106 - L10741",
      pena: "reclusão, de 2 a 4 anos", acao: "incondicionada", jecrim: false,
      busca: "procuração idoso demência",
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
    },
    {
      fato: "Apropriação de bens de pessoa com deficiência", artigo: "Art. 89", diploma: PCD,
      ref: "Art. 89 - L13146",
      pena: "reclusão, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "desviou o benefício bpc do deficiente",
    },
    {
      fato: "Abandono de pessoa com deficiência", artigo: "Art. 90", diploma: PCD,
      ref: "Art. 90 - L13146",
      pena: "reclusão, de 2 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      busca: "abandonou o deficiente hospital abrigo",
      obs: "Penas da Lei 15.163/2025 (antes: 6 meses a 3 anos). Lesão grave: 3 a 7 anos; morte: 8 a 14. Não prover as necessidades básicas (§ 3º): mesmas penas.",
    },
    {
      fato: "Reter cartão ou documento de pessoa com deficiência", artigo: "Art. 91", diploma: PCD,
      ref: "Art. 91 - L13146",
      pena: "detenção, de 6 meses a 2 anos, e multa", acao: "incondicionada", jecrim: true,
      busca: "ficou com o cartão do benefício",
    },
  ]),

  // ======================================================================
  grupo("Racismo e tortura", [
  // ======================================================================
    {
      fato: "Injúria racial", artigo: "Art. 2º-A", diploma: RACISMO,
      ref: "Art. 2-A - L7716",
      pena: "reclusão, de 2 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["inafiancavel"],
      prescricao: "imprescritível",
      busca: "racismo xingamento racial cor raça etnia macaco",
      obs: "Deixou de ser o art. 140, § 3º, do CP com a Lei 14.532/2023. Imprescritível e inafiançável (art. 5º, XLII, da Constituição).",
      orientacoes: "honra",
    },
    {
      fato: "Racismo (praticar, induzir ou incitar discriminação)", artigo: "Art. 20", diploma: RACISMO,
      ref: "Art. 20 - L7716",
      pena: "reclusão, de 1 a 3 anos, e multa", acao: "incondicionada", jecrim: false,
      marcas: ["inafiancavel"],
      prescricao: "imprescritível",
      busca: "preconceito raça cor etnia religião procedência nacional homofobia transfobia",
      obs: "Pelos meios de comunicação ou redes sociais (§ 2º): reclusão, de 2 a 5 anos, e multa. Homofobia e transfobia entram aqui (STF, ADO 26).",
    },
    {
      fato: "Tortura (para obter confissão, provocar crime ou por discriminação)", artigo: "Art. 1º, I", diploma: TORTURA,
      ref: "Art. 1, I - L9455",
      pena: "reclusão, de 2 a 8 anos", acao: "incondicionada", jecrim: false,
      marcas: ["equiparado"],
      busca: "tortura choque afogamento confessar",
      obs: "Lesão grave ou gravíssima: 4 a 10 anos; morte: 8 a 16 (§ 3º). Aumento de 1/6 a 1/3 se cometida por agente público ou contra criança, gestante, idoso ou deficiente (§ 4º).",
    },
    {
      fato: "Tortura-castigo (vítima sob guarda, poder ou autoridade)", artigo: "Art. 1º, II", diploma: TORTURA,
      ref: "Art. 1, II - L9455",
      pena: "reclusão, de 2 a 8 anos", acao: "incondicionada", jecrim: false,
      marcas: ["equiparado"],
      busca: "castigo cruel criança filho enteado queimou amarrou intenso sofrimento",
      obs: "Intenso sofrimento físico ou mental como castigo ou medida preventiva. Quem se omite tendo o dever de evitar (§ 2º): detenção, de 1 a 4 anos.",
    },
  ]),

  // ======================================================================
  grupo("Meio ambiente", [
  // ======================================================================
    {
      fato: "Maus-tratos a animais", artigo: "Art. 32", diploma: AMBIENTAL,
      ref: "Art. 32 - L9605",
      pena: "detenção, de 3 meses a 1 ano, e multa", acao: "incondicionada", jecrim: true,
      busca: "animal maltratado cavalo pássaro abandonado espancado",
      obs: "Aumento de 1/6 a 1/3 se o animal morre (§ 2º). Cão ou gato é o § 1º-A.",
    },
    {
      fato: "Maus-tratos a cão ou gato", artigo: "Art. 32, § 1º-A", diploma: AMBIENTAL,
      ref: "Art. 32, §1-A - L9605",
      pena: "reclusão, de 2 a 5 anos, multa e proibição da guarda", acao: "incondicionada", jecrim: false,
      busca: "cachorro gato maltratado abandonado espancado envenenou acorrentado",
      obs: "Lei 14.064/2020.",
    },
  ])

  );
})();
