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
 *     diploma: "CP",                          // CP, LCP, CTB, ECA, Lei 11.340…
 *     pena:    "reclusão, de 1 a 4 anos, e multa",
 *     acao:    "incondicionada",              // ver ACOES abaixo
 *     jecrim:  false,                         // infração de menor potencial ofensivo
 *     busca:   "subtrair levar sumiu",        // sinônimos extras, opcional
 *     obs:     "…",                           // ressalva curta, opcional
 *     prescricao: "imprescritível",           // só quando o art. 109 não vale
 *     orientacoes: "furto_roubo",             // folha do comunicante, opcional
 *     texto:   "Subtrair, para si…",           // o dispositivo em si, opcional
 *   }
 *
 * `acao` aceita: "incondicionada", "condicionada", "privada" e "outra"
 * (para o que não é ação penal comum, como o art. 28 da Lei de Drogas).
 *
 * `jecrim` é true quando a pena máxima não passa de dois anos, ou quando é
 * contravenção — os dois casos do art. 61 da Lei 9.099/1995. Repare que
 * violência doméstica contra a mulher fica de fora mesmo com pena baixa,
 * por força do art. 41 da Lei 11.340/2006.
 *
 * `prescricao` normalmente NÃO se escreve: a página calcula o prazo a
 * partir da pena máxima, pelo art. 109 do CP. Só se preenche quando a
 * fórmula não vale — crime imprescritível, prazo fixado em lei própria
 * (art. 30 da Lei de Drogas), ou pena que remete a outro tipo.
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
 * confira no texto legal antes de tipificar.
 * ---------------------------------------------------------------------------
 */

window.TIPIFICACAO = [
  // ------------------------------------------------- VIDA E INTEGRIDADE ---
  {
    fato: "Homicídio simples", artigo: "Art. 121", diploma: "CP",
    pena: "reclusão, de 6 a 20 anos", acao: "incondicionada", jecrim: false,
    busca: "matar morte óbito",
  },
  {
    fato: "Homicídio qualificado", artigo: "Art. 121, § 2º", diploma: "CP",
    pena: "reclusão, de 12 a 30 anos", acao: "incondicionada", jecrim: false,
    obs: "Hediondo. Motivo torpe ou fútil, meio cruel, recurso que dificulte a defesa, para assegurar outro crime.",
  },
  {
    fato: "Feminicídio", artigo: "Art. 121-A", diploma: "CP",
    pena: "reclusão, de 20 a 40 anos", acao: "incondicionada", jecrim: false,
    busca: "mulher razões da condição do sexo feminino",
    obs: "Crime autônomo desde a Lei 14.994/2024; antes era qualificadora do art. 121, § 2º, VI.",
  },
  {
    fato: "Homicídio culposo", artigo: "Art. 121, § 3º", diploma: "CP",
    pena: "detenção, de 1 a 3 anos", acao: "incondicionada", jecrim: false,
    obs: "Na direção de veículo, é o art. 302 do CTB.",
  },
  {
    fato: "Induzimento, instigação ou auxílio a suicídio ou automutilação",
    artigo: "Art. 122", diploma: "CP",
    pena: "reclusão, de 6 meses a 2 anos", acao: "incondicionada", jecrim: true,
    busca: "suicídio automutilação",
  },
  {
    fato: "Lesão corporal leve", artigo: "Art. 129, caput", diploma: "CP",
    pena: "detenção, de 3 meses a 1 ano", acao: "condicionada", jecrim: true,
    busca: "agressão machucado bateu socou",
    obs: "Representação exigida pelo art. 88 da Lei 9.099/1995.",
    orientacoes: "lesao",
    texto:
      "Ofender a integridade corporal ou a saúde de outrem:\n" +
      "Pena - detenção, de três meses a um ano.",
  },
  {
    fato: "Lesão corporal grave", artigo: "Art. 129, § 1º", diploma: "CP",
    pena: "reclusão, de 1 a 5 anos", acao: "incondicionada", jecrim: false,
    obs: "Incapacidade por mais de 30 dias, perigo de vida, debilidade permanente, aceleração de parto.",
    orientacoes: "lesao",
  },
  {
    fato: "Lesão corporal gravíssima", artigo: "Art. 129, § 2º", diploma: "CP",
    pena: "reclusão, de 2 a 8 anos", acao: "incondicionada", jecrim: false,
    obs: "Incapacidade permanente, enfermidade incurável, perda de membro/sentido/função, deformidade permanente, aborto.",
    orientacoes: "lesao",
  },
  {
    fato: "Lesão corporal seguida de morte", artigo: "Art. 129, § 3º", diploma: "CP",
    pena: "reclusão, de 4 a 12 anos", acao: "incondicionada", jecrim: false,
  },
  {
    fato: "Lesão corporal culposa", artigo: "Art. 129, § 6º", diploma: "CP",
    pena: "detenção, de 2 meses a 1 ano", acao: "condicionada", jecrim: true,
    obs: "Na direção de veículo, é o art. 303 do CTB.",
    orientacoes: "lesao",
  },
  {
    fato: "Lesão corporal — violência doméstica", artigo: "Art. 129, § 9º", diploma: "CP",
    pena: "detenção, de 3 meses a 3 anos", acao: "incondicionada", jecrim: false,
    busca: "maria da penha companheiro marido esposa doméstica",
    obs: "Incondicionada por decisão do STF (ADI 4.424). A Lei 9.099/1995 não se aplica (art. 41 da Lei 11.340/2006).",
    orientacoes: "violencia_domestica",
    texto:
      "§ 9º Se a lesão for praticada contra ascendente, descendente, irmão, " +
      "cônjuge ou companheiro, ou com quem conviva ou tenha convivido, ou, " +
      "ainda, prevalecendo-se o agente das relações domésticas, de coabitação " +
      "ou de hospitalidade:\n" +
      "Pena - detenção, de 3 (três) meses a 3 (três) anos.",
  },
  {
    fato: "Abandono de incapaz", artigo: "Art. 133", diploma: "CP",
    pena: "detenção, de 6 meses a 3 anos", acao: "incondicionada", jecrim: false,
    busca: "idoso criança deficiente abandonado sozinho",
  },
  {
    fato: "Omissão de socorro", artigo: "Art. 135", diploma: "CP",
    pena: "detenção, de 1 a 6 meses, ou multa", acao: "incondicionada", jecrim: true,
  },
  {
    fato: "Maus-tratos", artigo: "Art. 136", diploma: "CP",
    pena: "detenção, de 2 meses a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
    busca: "castigo imoderado privar alimento",
  },
  {
    fato: "Rixa", artigo: "Art. 137", diploma: "CP",
    pena: "detenção, de 15 dias a 2 meses, ou multa", acao: "incondicionada", jecrim: true,
    busca: "briga generalizada confusão",
  },

  // --------------------------------------------------------------- HONRA ---
  {
    fato: "Calúnia", artigo: "Art. 138", diploma: "CP",
    pena: "detenção, de 6 meses a 2 anos, e multa", acao: "privada", jecrim: true,
    busca: "acusou de crime mentira caluniou",
    obs: "Imputar falsamente FATO definido como crime.",
    orientacoes: "honra",
  },
  {
    fato: "Difamação", artigo: "Art. 139", diploma: "CP",
    pena: "detenção, de 3 meses a 1 ano, e multa", acao: "privada", jecrim: true,
    busca: "fofoca reputação falou mal",
    obs: "Imputar fato ofensivo à reputação, ainda que verdadeiro.",
    orientacoes: "honra",
  },
  {
    fato: "Injúria", artigo: "Art. 140", diploma: "CP",
    pena: "detenção, de 1 a 6 meses, ou multa", acao: "privada", jecrim: true,
    busca: "xingou ofendeu palavrão insultou",
    obs: "Ofender a dignidade ou o decoro, sem imputar fato.",
    orientacoes: "honra",
  },
  {
    fato: "Injúria racial", artigo: "Art. 2º-A", diploma: "Lei 7.716/1989",
    pena: "reclusão, de 2 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
    prescricao: "imprescritível",
    busca: "racismo xingamento racial cor raça etnia religião",
    obs: "Deixou de ser o art. 140, § 3º, do CP com a Lei 14.532/2023. Imprescritível e inafiançável.",
    orientacoes: "honra",
  },
  {
    fato: "Racismo", artigo: "Art. 20", diploma: "Lei 7.716/1989",
    pena: "reclusão, de 1 a 3 anos, e multa", acao: "incondicionada", jecrim: false,
    prescricao: "imprescritível",
    obs: "Pelos meios de comunicação ou redes sociais (§ 2º): reclusão, de 2 a 5 anos, e multa.",
  },

  // ------------------------------------------------------------ LIBERDADE ---
  {
    fato: "Constrangimento ilegal", artigo: "Art. 146", diploma: "CP",
    pena: "detenção, de 3 meses a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
    busca: "obrigou forçou a fazer",
  },
  {
    fato: "Ameaça", artigo: "Art. 147", diploma: "CP",
    pena: "detenção, de 1 a 6 meses, ou multa", acao: "condicionada", jecrim: true,
    busca: "ameaçou matar bater mensagem intimidou",
    orientacoes: "ameaca",
    texto:
      "Ameaçar alguém, por palavra, escrito ou gesto, ou qualquer outro meio " +
      "simbólico, de causar-lhe mal injusto e grave:\n" +
      "Pena - detenção, de um a seis meses, ou multa.\n" +
      "Parágrafo único - Somente se procede mediante representação.",
  },
  {
    fato: "Perseguição (stalking)", artigo: "Art. 147-A", diploma: "CP",
    pena: "reclusão, de 6 meses a 2 anos, e multa", acao: "condicionada", jecrim: true,
    busca: "stalking perseguindo vigiando importunando reiteradamente",
    obs: "Conduta reiterada que ameace a integridade, restrinja a liberdade ou invada a privacidade.",
    orientacoes: "ameaca",
  },
  {
    fato: "Violência psicológica contra a mulher", artigo: "Art. 147-B", diploma: "CP",
    pena: "reclusão, de 6 meses a 2 anos, e multa", acao: "incondicionada", jecrim: false,
    busca: "humilhação chantagem manipulação isolamento maria da penha",
    obs: "Lei 14.188/2021. Sendo violência doméstica, a Lei 9.099/1995 não se aplica.",
    orientacoes: "violencia_domestica",
  },
  {
    fato: "Sequestro e cárcere privado", artigo: "Art. 148", diploma: "CP",
    pena: "reclusão, de 1 a 3 anos", acao: "incondicionada", jecrim: false,
    busca: "prendeu trancou não deixou sair",
  },
  {
    fato: "Violação de domicílio", artigo: "Art. 150", diploma: "CP",
    pena: "detenção, de 1 a 3 meses, ou multa", acao: "incondicionada", jecrim: true,
    busca: "invadiu casa entrou terreno pátio",
  },
  {
    fato: "Violação de correspondência", artigo: "Art. 151", diploma: "CP",
    pena: "detenção, de 1 a 6 meses, ou multa", acao: "condicionada", jecrim: true,
    busca: "abriu carta correspondência",
  },
  {
    fato: "Invasão de dispositivo informático", artigo: "Art. 154-A", diploma: "CP",
    pena: "reclusão, de 1 a 4 anos, e multa", acao: "condicionada", jecrim: false,
    busca: "hackearam celular invadiram conta e-mail whatsapp clonado computador",
    obs: "Incondicionada quando a vítima é a administração pública (art. 154-B).",
    orientacoes: "estelionato",
  },

  // ------------------------------------------------------------ PATRIMÔNIO ---
  {
    fato: "Furto", artigo: "Art. 155", diploma: "CP",
    pena: "reclusão, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
    busca: "subtração levaram sumiu roubaram sem violência batedor",
    obs: "Repouso noturno (§ 1º): aumento de 1/3. Coisa de pequeno valor e réu primário (§ 2º): furto privilegiado.",
    orientacoes: "furto_roubo",
    texto:
      "Subtrair, para si ou para outrem, coisa alheia móvel:\n" +
      "Pena - reclusão, de um a quatro anos, e multa.",
  },
  {
    fato: "Furto qualificado", artigo: "Art. 155, § 4º", diploma: "CP",
    pena: "reclusão, de 2 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
    busca: "arrombamento chave falsa escalada concurso destruição rompimento obstáculo",
    orientacoes: "furto_roubo",
  },
  {
    fato: "Furto mediante fraude eletrônica", artigo: "Art. 155, § 4º-B", diploma: "CP",
    pena: "reclusão, de 4 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
    busca: "pix transferência internet banking conta invadida celular furtado aplicativo",
    obs: "Lei 14.155/2021. Aqui a vítima NÃO é induzida a erro — o autor age direto no dispositivo ou na conta.",
    orientacoes: "estelionato",
  },
  {
    fato: "Furto de energia elétrica ou de água", artigo: "Art. 155, § 3º", diploma: "CP",
    pena: "reclusão, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
    busca: "gato luz energia ligação clandestina",
    orientacoes: "furto_roubo",
  },
  {
    fato: "Roubo", artigo: "Art. 157", diploma: "CP",
    pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
    busca: "assalto arma grave ameaça violência levaram",
    obs: "Arma de fogo (§ 2º-A, I): aumento de 2/3. Arma de fogo de uso restrito (§ 2º-B): pena em dobro.",
    orientacoes: "furto_roubo",
  },
  {
    fato: "Latrocínio (roubo seguido de morte)", artigo: "Art. 157, § 3º, II", diploma: "CP",
    pena: "reclusão, de 20 a 30 anos, e multa", acao: "incondicionada", jecrim: false,
    obs: "Hediondo.",
  },
  {
    fato: "Extorsão", artigo: "Art. 158", diploma: "CP",
    pena: "reclusão, de 4 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
    busca: "chantagem exigiu dinheiro para não divulgar sextorsão",
    obs: "Mediante restrição da liberdade (§ 3º, sequestro relâmpago): reclusão, de 6 a 12 anos.",
    orientacoes: "ameaca",
  },
  {
    fato: "Extorsão mediante sequestro", artigo: "Art. 159", diploma: "CP",
    pena: "reclusão, de 8 a 15 anos", acao: "incondicionada", jecrim: false,
  },
  {
    fato: "Dano", artigo: "Art. 163", diploma: "CP",
    pena: "detenção, de 1 a 6 meses, ou multa", acao: "privada", jecrim: true,
    busca: "quebrou destruiu estragou riscou carro pichou vidro",
    obs: "Queixa-crime, por força do art. 167.",
    orientacoes: "dano",
  },
  {
    fato: "Dano qualificado", artigo: "Art. 163, parágrafo único", diploma: "CP",
    pena: "detenção, de 6 meses a 3 anos, e multa", acao: "incondicionada", jecrim: false,
    obs: "Com violência, substância inflamável, contra patrimônio público. No inciso IV (motivo egoístico ou prejuízo considerável) a ação é privada.",
    orientacoes: "dano",
  },
  {
    fato: "Apropriação indébita", artigo: "Art. 168", diploma: "CP",
    pena: "reclusão, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
    busca: "emprestou não devolveu ficou com reteve",
    obs: "A posse do bem começou lícita — é isso que separa do furto.",
  },
  {
    fato: "Apropriação de coisa achada", artigo: "Art. 169, parágrafo único, II", diploma: "CP",
    pena: "detenção, de 1 mês a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
    busca: "achou não devolveu perdido encontrou celular",
  },
  {
    fato: "Estelionato", artigo: "Art. 171", diploma: "CP",
    pena: "reclusão, de 1 a 5 anos, e multa", acao: "condicionada", jecrim: false,
    busca: "golpe fraude enganou induziu erro falso advogado parente",
    obs: "Condicionada pelo § 5º, salvo se a vítima for a administração pública, criança/adolescente, pessoa com deficiência mental ou maior de 70 anos.",
    orientacoes: "estelionato",
    texto:
      "Obter, para si ou para outrem, vantagem ilícita, em prejuízo alheio, " +
      "induzindo ou mantendo alguém em erro, mediante artifício, ardil, ou " +
      "qualquer outro meio fraudulento:\n" +
      "Pena - reclusão, de um a cinco anos, e multa.\n" +
      "§ 5º Somente se procede mediante representação, salvo se a vítima for: " +
      "I - a Administração Pública, direta ou indireta; II - criança ou " +
      "adolescente; III - pessoa com deficiência mental; ou IV - maior de " +
      "70 (setenta) anos de idade ou incapaz.",
  },
  {
    fato: "Estelionato por fraude eletrônica", artigo: "Art. 171, § 2º-A", diploma: "CP",
    pena: "reclusão, de 4 a 8 anos, e multa", acao: "condicionada", jecrim: false,
    busca: "golpe pix whatsapp clonado internet rede social falso perfil site falso",
    obs: "Lei 14.155/2021. Aumento de 1/3 a 2/3 se contra idoso ou vulnerável (§ 2º-B).",
    orientacoes: "estelionato",
  },
  {
    fato: "Receptação", artigo: "Art. 180", diploma: "CP",
    pena: "reclusão, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
    busca: "comprou produto de roubo furtado sabia origem",
    obs: "Na forma qualificada, no exercício de atividade comercial (§ 1º): reclusão, de 3 a 8 anos.",
  },

  // --------------------------------------------------------- DIGNIDADE SEXUAL ---
  {
    fato: "Estupro", artigo: "Art. 213", diploma: "CP",
    pena: "reclusão, de 6 a 10 anos", acao: "incondicionada", jecrim: false,
    obs: "Incondicionada desde a Lei 13.718/2018 (art. 225). Hediondo.",
  },
  {
    fato: "Estupro de vulnerável", artigo: "Art. 217-A", diploma: "CP",
    pena: "reclusão, de 8 a 15 anos", acao: "incondicionada", jecrim: false,
    busca: "menor de 14 vulnerável criança",
    obs: "Hediondo.",
  },
  {
    fato: "Importunação sexual", artigo: "Art. 215-A", diploma: "CP",
    pena: "reclusão, de 1 a 5 anos", acao: "incondicionada", jecrim: false,
    busca: "encoxada ejaculou passou a mão ônibus assédio na rua",
    obs: "Criado pela Lei 13.718/2018; substituiu o antigo art. 61 da LCP.",
  },
  {
    fato: "Assédio sexual", artigo: "Art. 216-A", diploma: "CP",
    pena: "detenção, de 1 a 2 anos", acao: "incondicionada", jecrim: true,
    obs: "Exige relação de superioridade hierárquica no emprego, cargo ou função.",
  },
  {
    fato: "Registro não autorizado da intimidade sexual", artigo: "Art. 216-B", diploma: "CP",
    pena: "detenção, de 6 meses a 1 ano, e multa", acao: "incondicionada", jecrim: true,
    busca: "filmou fotografou nudez sem autorização",
  },
  {
    fato: "Divulgação de cena de estupro, sexo, nudez ou pornografia",
    artigo: "Art. 218-C", diploma: "CP",
    pena: "reclusão, de 1 a 5 anos", acao: "incondicionada", jecrim: false,
    busca: "vazou nudes vídeo íntimo divulgou pornografia de vingança",
    obs: "Aumento de 1/3 a 2/3 se praticado por quem manteve relação íntima de afeto com a vítima.",
  },

  // ---------------------------------------------------- FÉ PÚBLICA E ADMINISTRAÇÃO ---
  {
    fato: "Falsa identidade", artigo: "Art. 307", diploma: "CP",
    pena: "detenção, de 3 meses a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
    busca: "deu nome falso identificou-se como outro",
  },
  {
    fato: "Falsificação de documento público", artigo: "Art. 297", diploma: "CP",
    pena: "reclusão, de 2 a 6 anos, e multa", acao: "incondicionada", jecrim: false,
    busca: "cnh falsa rg falso documento falsificado",
  },
  {
    fato: "Falsificação de documento particular", artigo: "Art. 298", diploma: "CP",
    pena: "reclusão, de 1 a 5 anos, e multa", acao: "incondicionada", jecrim: false,
  },
  {
    fato: "Falsidade ideológica", artigo: "Art. 299", diploma: "CP",
    pena: "reclusão, de 1 a 5 anos, e multa (documento público)", acao: "incondicionada", jecrim: false,
    obs: "Documento particular: reclusão, de 1 a 3 anos, e multa. O documento é verdadeiro; falso é o conteúdo.",
  },
  {
    fato: "Uso de documento falso", artigo: "Art. 304", diploma: "CP",
    pena: "a mesma do documento falsificado", acao: "incondicionada", jecrim: false,
    prescricao: "conforme o documento",
  },
  {
    fato: "Adulteração de sinal identificador de veículo", artigo: "Art. 311", diploma: "CP",
    pena: "reclusão, de 3 a 6 anos, e multa", acao: "incondicionada", jecrim: false,
    busca: "chassi raspado placa adulterada motor remarcado clone",
  },
  {
    fato: "Resistência", artigo: "Art. 329", diploma: "CP",
    pena: "detenção, de 2 meses a 2 anos", acao: "incondicionada", jecrim: true,
    busca: "resistiu à prisão se debateu",
  },
  {
    fato: "Desobediência", artigo: "Art. 330", diploma: "CP",
    pena: "detenção, de 15 dias a 6 meses, e multa", acao: "incondicionada", jecrim: true,
  },
  {
    fato: "Desacato", artigo: "Art. 331", diploma: "CP",
    pena: "detenção, de 6 meses a 2 anos, ou multa", acao: "incondicionada", jecrim: true,
    busca: "xingou policial ofendeu servidor",
  },
  {
    fato: "Denunciação caluniosa", artigo: "Art. 339", diploma: "CP",
    pena: "reclusão, de 2 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
  },
  {
    fato: "Comunicação falsa de crime ou contravenção", artigo: "Art. 340", diploma: "CP",
    pena: "detenção, de 1 a 6 meses, ou multa", acao: "incondicionada", jecrim: true,
    busca: "registrou bo falso mentiu na ocorrência",
  },
  {
    fato: "Exercício arbitrário das próprias razões", artigo: "Art. 345", diploma: "CP",
    pena: "detenção, de 15 dias a 1 mês, ou multa", acao: "privada", jecrim: true,
    busca: "fazer justiça com as próprias mãos tomou de volta",
    obs: "Ação pública quando houver violência.",
  },

  // ------------------------------------------------------------- INCÊNDIO ---
  {
    fato: "Incêndio", artigo: "Art. 250", diploma: "CP",
    pena: "reclusão, de 3 a 6 anos, e multa", acao: "incondicionada", jecrim: false,
    busca: "ateou fogo queimou casa",
  },

  // ------------------------------------------------- VIOLÊNCIA DOMÉSTICA ---
  {
    fato: "Descumprimento de medida protetiva de urgência", artigo: "Art. 24-A",
    diploma: "Lei 11.340/2006",
    pena: "detenção, de 3 meses a 2 anos", acao: "incondicionada", jecrim: false,
    busca: "mpu medida protetiva descumpriu aproximou contato",
    obs: "A Lei 9.099/1995 não se aplica (art. 41 da Lei 11.340/2006). Cabe prisão em flagrante.",
    orientacoes: "violencia_domestica",
  },

  // ------------------------------------------------ CRIANÇA E ADOLESCENTE ---
  {
    fato: "Corrupção de menores", artigo: "Art. 244-B", diploma: "ECA (Lei 8.069/1990)",
    pena: "reclusão, de 1 a 4 anos", acao: "incondicionada", jecrim: false,
    busca: "praticou crime com menor usou adolescente",
  },
  {
    fato: "Registro de cena de sexo explícito com criança ou adolescente",
    artigo: "Art. 240", diploma: "ECA (Lei 8.069/1990)",
    pena: "reclusão, de 4 a 8 anos, e multa", acao: "incondicionada", jecrim: false,
  },
  {
    fato: "Divulgação ou armazenamento de pornografia infantil",
    artigo: "Arts. 241-A e 241-B", diploma: "ECA (Lei 8.069/1990)",
    pena: "reclusão, de 3 a 6 anos, e multa (241-A); de 1 a 4 anos, e multa (241-B)",
    acao: "incondicionada", jecrim: false,
    busca: "pornografia infantil compartilhou armazenou",
  },

  // ---------------------------------------------------------------- IDOSO ---
  {
    fato: "Apropriação de bens ou proventos de idoso", artigo: "Art. 102",
    diploma: "Estatuto da Pessoa Idosa (Lei 10.741/2003)",
    pena: "reclusão, de 1 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
    busca: "aposentadoria do idoso pegou o cartão benefício",
  },

  // ---------------------------------------------------------------- ARMAS ---
  {
    fato: "Posse irregular de arma de fogo de uso permitido", artigo: "Art. 12",
    diploma: "Lei 10.826/2003",
    pena: "detenção, de 1 a 3 anos, e multa", acao: "incondicionada", jecrim: false,
    obs: "Posse é dentro de casa ou no local de trabalho; fora disso é porte (art. 14).",
  },
  {
    fato: "Porte ilegal de arma de fogo de uso permitido", artigo: "Art. 14",
    diploma: "Lei 10.826/2003",
    pena: "reclusão, de 2 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
  },
  {
    fato: "Disparo de arma de fogo", artigo: "Art. 15", diploma: "Lei 10.826/2003",
    pena: "reclusão, de 2 a 4 anos, e multa", acao: "incondicionada", jecrim: false,
    busca: "tiro para o alto disparou",
  },
  {
    fato: "Posse ou porte de arma de uso restrito", artigo: "Art. 16",
    diploma: "Lei 10.826/2003",
    pena: "reclusão, de 3 a 6 anos, e multa", acao: "incondicionada", jecrim: false,
  },

  // --------------------------------------------------------------- DROGAS ---
  {
    fato: "Porte de droga para consumo pessoal", artigo: "Art. 28",
    diploma: "Lei 11.343/2006",
    pena: "advertência, prestação de serviços à comunidade ou medida educativa",
    acao: "outra", jecrim: true,
    prescricao: "2 anos",
    busca: "usuário maconha porte pequena quantidade",
    obs: "Não há pena privativa de liberdade. Termo circunstanciado.",
  },
  {
    fato: "Tráfico de drogas", artigo: "Art. 33", diploma: "Lei 11.343/2006",
    pena: "reclusão, de 5 a 15 anos, e multa", acao: "incondicionada", jecrim: false,
    obs: "Tráfico privilegiado (§ 4º): redução de 1/6 a 2/3 para réu primário, de bons antecedentes, sem organização criminosa.",
  },
  {
    fato: "Associação para o tráfico", artigo: "Art. 35", diploma: "Lei 11.343/2006",
    pena: "reclusão, de 3 a 10 anos, e multa", acao: "incondicionada", jecrim: false,
  },

  // ------------------------------------------------------------- TRÂNSITO ---
  {
    fato: "Homicídio culposo na direção de veículo", artigo: "Art. 302",
    diploma: "CTB (Lei 9.503/1997)",
    pena: "detenção, de 2 a 4 anos, e suspensão da habilitação",
    acao: "incondicionada", jecrim: false,
    obs: "Sob influência de álcool (§ 3º): reclusão, de 5 a 8 anos.",
    orientacoes: "transito",
  },
  {
    fato: "Lesão corporal culposa na direção de veículo", artigo: "Art. 303",
    diploma: "CTB (Lei 9.503/1997)",
    pena: "detenção, de 6 meses a 2 anos, e suspensão da habilitação",
    acao: "condicionada", jecrim: true,
    busca: "acidente atropelamento colisão com ferido",
    obs: "A representação cai (e a Lei 9.099 deixa de se aplicar) se houver álcool, racha ou velocidade 50 km/h acima da via — art. 291, § 1º.",
    orientacoes: "transito",
  },
  {
    fato: "Embriaguez ao volante", artigo: "Art. 306", diploma: "CTB (Lei 9.503/1997)",
    pena: "detenção, de 6 meses a 3 anos, multa e suspensão da habilitação",
    acao: "incondicionada", jecrim: false,
    busca: "bafômetro alcoolizado dirigindo bêbado teste recusa",
    obs: "Configura-se com 6 dg/L de álcool no sangue, 0,3 mg/L no ar alveolar ou sinais de alteração da capacidade psicomotora.",
    orientacoes: "transito",
  },
  {
    fato: "Fuga do local do acidente", artigo: "Art. 305", diploma: "CTB (Lei 9.503/1997)",
    pena: "detenção, de 6 meses a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
    busca: "evadiu-se atropelou e fugiu",
    orientacoes: "transito",
  },
  {
    fato: "Racha (disputa de corrida)", artigo: "Art. 308", diploma: "CTB (Lei 9.503/1997)",
    pena: "detenção, de 6 meses a 3 anos, multa e suspensão", acao: "incondicionada", jecrim: false,
    busca: "pega racha corrida na via",
    orientacoes: "transito",
  },
  {
    fato: "Dirigir sem habilitação gerando perigo de dano", artigo: "Art. 309",
    diploma: "CTB (Lei 9.503/1997)",
    pena: "detenção, de 6 meses a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
    obs: "Sem o perigo de dano concreto, é infração administrativa, não crime.",
  },
  {
    fato: "Entregar veículo a pessoa não habilitada", artigo: "Art. 310",
    diploma: "CTB (Lei 9.503/1997)",
    pena: "detenção, de 6 meses a 1 ano, ou multa", acao: "incondicionada", jecrim: true,
  },

  // -------------------------------------------------------- CONTRAVENÇÕES ---
  {
    fato: "Vias de fato", artigo: "Art. 21", diploma: "LCP (Dec.-Lei 3.688/1941)",
    pena: "prisão simples, de 15 dias a 3 meses, ou multa", acao: "incondicionada", jecrim: true,
    busca: "empurrão tapa agressão sem lesão puxão de cabelo",
    obs: "Agressão que não deixa lesão constatada. Havendo lesão, é o art. 129 do CP.",
    orientacoes: "lesao",
  },
  {
    fato: "Perturbação do trabalho ou do sossego alheios", artigo: "Art. 42",
    diploma: "LCP (Dec.-Lei 3.688/1941)",
    pena: "prisão simples, de 15 dias a 3 meses, ou multa", acao: "incondicionada", jecrim: true,
    busca: "som alto barulho vizinho festa música madrugada",
  },
  {
    fato: "Perturbação da tranquilidade", artigo: "Art. 65",
    diploma: "LCP (Dec.-Lei 3.688/1941)",
    pena: "prisão simples, de 15 dias a 2 meses, ou multa", acao: "incondicionada", jecrim: true,
    busca: "molestar importunar ligações insistentes acintosamente",
    orientacoes: "ameaca",
  },
  {
    fato: "Omissão de cautela na guarda de animais", artigo: "Art. 31",
    diploma: "LCP (Dec.-Lei 3.688/1941)",
    pena: "prisão simples, de 10 dias a 2 meses, ou multa", acao: "incondicionada", jecrim: true,
    busca: "cachorro solto mordeu animal na rua",
  },

  // ----------------------------------------------------------- AMBIENTAL ---
  {
    fato: "Maus-tratos a animais", artigo: "Art. 32", diploma: "Lei 9.605/1998",
    pena: "detenção, de 3 meses a 1 ano, e multa", acao: "incondicionada", jecrim: true,
    busca: "animal maltratado cachorro gato abandonado espancado",
    obs: "Contra cão ou gato (§ 1º-A): reclusão, de 2 a 5 anos, multa e proibição de guarda — aí não é JECRIM.",
  },
];
