# TODO

## NEW

Sobre as ferramentas novas:

* **Transcrição** — não há progresso por trecho, só o tempo decorrido: a
  biblioteca não expõe callback de chunk. Fatiar o áudio nós mesmos daria
  progresso real, ao custo de possíveis cortes de palavra nas emendas.
* **Tipificação** — as 329 linhas foram conferidas contra o texto
  compilado do Planalto salvo em `docs/` (fora do git), e todas têm o
  `texto` do artigo. Ficaram de fora leis que não estão em `docs/`: a
  12.850/2013 (organização criminosa, art. 2º), a 9.504/1997 (boca de urna
  e os outros crimes eleitorais fora do Código Eleitoral), a 1.521/1951
  (economia popular: pirâmide, usura), a 8.137/1990 (ordem tributária e
  relações de consumo), o CDC, a 9.296/1996 (interceptação), a 13.260/2016
  (terrorismo) e o Dec.-Lei 6.259/1944 (jogo do bicho). Lei nova pede a
  mesma passada: salvar o texto compilado em `docs/`, conferir as linhas
  que a citam e recopiar o `texto` dos dispositivos que ela mudou. O link
  para a folha de orientações saiu da linha; o campo `orientacoes` ficou,
  conferido na carga, para se o link voltar.
* **Conferidor** — RENAVAM e CNH ficaram de fora por falta de algoritmo
  confiável. Se aparecer uma referência boa, entram em
  `js/comum/identificadores.js` e ganham linha em `TIPOS`.
* **Orientações** — faltam tipos: acidente com vítima fatal, desaparecimento
  de pessoa, crimes contra criança e adolescente, maus-tratos a animais,
  crimes cibernéticos (invasão de dispositivo, imagem íntima divulgada).
  Cada tipo novo pode ganhar entradas na tipificação pelo campo
  `orientacoes` (a tabela já aponta 67 fatos para uma folha, embora hoje
  não mostre o link).
* **Conversas** — só reconhece os dois formatos de exportação do WhatsApp.
  Telegram e Signal exportam em JSON e HTML, que pediriam outro caminho de
  leitura. Se aparecer um caso real, guardar uma amostra do arquivo.
* **Conversor** — `conversor.js` ficou com as operações e a interface
  (~2.000 linhas). Separar as operações exigiria injetar cinco funções da
  tela (`etapa`, `iniciar`, `acompanharEncode`, `argumentosDeCorte`,
  `duracaoDoTrabalho`) — mais acoplamento disfarçado, não menos. Fica
  para quando a interface encolher.
* **Perguntas** — sete fatos, todos já apontando para uma folha de
  orientações. Faltam, entre outros: perseguição (art. 147-A), crimes
  cibernéticos (invasão de dispositivo, imagem íntima divulgada sem
  consentimento), maus-tratos e crimes contra criança e adolescente,
  receptação. Cada fato tem o campo `busca` preenchido, mas nada o lê —
  não existe caixa de busca na página. Com sete fatos o seletor dá conta;
  com vinte, não dá, e aí o campo já está esperando.
* **Contatos** — a agenda ainda está com placeholders, embora bem menos:
  os ramais `tbd` acabaram, e sobraram 17 campos `PREENCHER` (horário e
  endereço) e 6 números `(00) 0000-0000`. Enquanto estiverem lá, o risco
  não é a página quebrar — é alguém copiar um número que não existe e
  discar. O campo `site` é suportado
  pela página e nenhum contato o usa: no balcão se disca, não se navega.
* **Anotações** — não há busca: com uma dúzia de papéis os títulos
  se leem de relance. Quando a caixa de busca fizer falta aqui, ela é a
  **terceira** página com busca — e é o gatilho combinado para extrair a
  normalização de termos para `js/comum/` (ver IMPROVE, abaixo), em vez
  de fazer a terceira cópia. Fica de fora, também de propósito:
  visualizar o PDF dentro da página (`<iframe>`), que sob COEP
  `require-corp` é justamente onde este projeto já tropeçou duas vezes.
* **Texto gerado** — `tests/casos/texto.js` cobre perda (todos os
  subtipos) e estelionato (falso advogado e falso parente), mais as
  perguntas de fechamento. **Tipo novo em `js/gerador/tipos/` = cenário
  novo lá**, senão o parágrafo dele fica sem rede.
* **Teste de conversão** — `tests/casos/conversao.js` cobre áudio
  (converter e comprimir). Vídeo e imagem não têm caso: exigiriam um MP4
  e um JPG de verdade, e sintetizá-los com `-f lavfi` amarraria o teste
  aos filtros do build do ffmpeg.
* **Service worker** — gerador, orientações, conferidor, tipificação,
  conversas, perguntas, contatos e anotações são páginas estáticas e
  funcionariam offline; falta o service worker que as guarde em cache.
  A agenda é a que mais pede isso: o momento de precisar de um número de
  emergência não é o momento de descobrir que a rede caiu. As anotações
  pedem o cuidado oposto: os PDFs somados pesam mais que todas as outras
  páginas juntas, e cachear a estante inteira sem critério é outro
  problema. Cuidado com COOP/COEP e com a invalidação ao trocar de
  versão.
* **Ponte conversor → transcrição** — hoje, para transcrever o áudio de um
  vídeo, é extrair, baixar e subir de novo na outra página. Um botão na
  linha de resultado poderia guardar o blob no IndexedDB e abrir a
  transcrição já com ele carregado.

Novos tipos de ocorrência (`js/gerador/tipos/*.js`) — candidatos fortes a
automação, seguindo o padrão de `estelionato.js`/`perda.js`:

- **Furto** — subtração sem violência/grave ameaça. Local do fato, como a
  vítima percebeu a subtração, lista de objetos subtraídos (com valor
  estimado). Existia uma versão básica (removida nesta limpeza).
- **Roubo** — como furto, mas com violência/grave ameaça: arma
  utilizada (branca/fogo/simulada/nenhuma — só grave ameaça verbal),
  se houve lesão corporal, se o(s) autor(es) fugiram a pé/veículo.
- **Dano** (danificação de patrimônio) — descrição do bem danificado,
  se há suspeito identificado, valor estimado do prejuízo.
- **Ameaça** — meio empregado (verbal/mensagem/gesto), teor da ameaça,
  vínculo com o autor.
- **Injúria / Difamação / Calúnia** — normalmente ação penal privada;
  já existe a opção em `deseja_representar`, mas o tipo em si (meio de
  divulgação, teor, testemunhas) ainda não existe.
- **Lesão corporal** — leve/grave/gravíssima, meio empregado, se houve
  atendimento médico/atestado, vínculo com o autor.
- **Embriaguez ao volante / direção perigosa** — sem vítima direta,
  normalmente vem de flagrante, mas pode ter parte de comunicante.
- **Vias de fato** — como lesão corporal, mas sem lesão constatada.
- **Invasão/violação de domicílio** — como o invasor entrou, se houve
  subtração ou dano associado.
- **Perturbação do sossego** — tipo de perturbação, horário, se é
  reincidente/habitual.
- **Apropriação indébita** — bem retido, relação entre as partes
  (empréstimo, trabalho, etc), se houve cobrança prévia.
- **Perseguição/Stalking (art. 147-A)** — condutas reiteradas, meio
  utilizado, vínculo com o autor.
- **Crimes cibernéticos** — invasão de dispositivo informático,
  divulgação não autorizada de imagem íntima, clonagem de perfil/conta.
- **Abandono de incapaz** — idoso, criança ou pessoa com deficiência,
  circunstâncias do abandono.
- **Lei Maria da Penha** e **Descumprimento de MPU** — reconstruir do
  zero (existiam antes desta limpeza), aproveitando a decisão de manter
  os arquivos enxutos.
- **Acidente de trânsito sem vítima / colisão simples** — dados dos
  veículos envolvidos, croqui textual do fato.

Subtipos de `estelionato.js` a reimplementar (existiam como opção em
`tipo_estelionato`, mas sem perguntas próprias satisfatórias — foram
removidos do `opcoes` na limpeza, junto do bloco golpe do Pix):

- **Golpe do Pix / Falsa Central** — contato prévio (ligação/mensagem se
  passando por atendente do banco), lista de transferências Pix
  (valor, chave, recebedor, instituição). Existia uma versão básica
  (`golpe_pix_recebeu_ligacao` + `transferencias_pix`, removida nesta
  limpeza).
- **Venda pela Internet não Entregue** — nunca teve perguntas próprias
  (só a opção no seletor, sem nenhuma frase associada): plataforma/rede
  usada no anúncio, forma de pagamento, valor, se houve troca de
  mensagens após o pagamento, se o vendedor sumiu ou seguiu
  respondendo.
- **Falso Funcionário de Banco** — nunca teve perguntas próprias (só a
  opção no seletor): contato prévio (ligação/mensagem se passando por
  funcionário do banco), pretexto usado, se induziu a vítima a
  compartilhar dados/senha ou fazer transferências, lista de
  pagamentos/transferências. Bem parecido com falso advogado e com
  golpe do Pix (ver acima) — avaliar se compensa unificar num fluxo só
  ("falso atendente", com um campo pra quem o golpista alegou ser) em
  vez de manter três subtipos quase idênticos.

Outras features (não são tipos novos, são capacidades do gerador):

- Opção de anexar múltiplos tipos numa mesma ocorrência (ex.: furto +
  dano no mesmo fato), hoje `tipo_ocorrencia` é seleção única.
- Botão "duplicar item" em `multiplo-input` pra listas longas (hoje só
  dá pra adicionar um de cada vez).

## IMPROVE

- A normalização da busca — tira acento (NFD), tira pontuação, baixa a
  caixa — existe igual em `js/tipificacao/tipificacao.js` e em
  `js/contatos/contatos.js`. Duas cópias ainda se lê e ainda se corrige
  junto; a terceira página com busca é a hora de extrair a função para
  `js/comum/`, antes que as três divirjam sem ninguém notar.
- `fa_pagamentos` (estelionato) e `fp_pagamentos` (estelionato) têm a
  função `clausula(item)` quase idêntica, só variando o texto de
  ligação ("para o recebedor" vs "tendo como recebedor") e o gênero do
  ordinal. Vale extrair um helper genérico em `texto-helpers.js` (ex.:
  `descreverPagamentos(lista, opções)`) pra não duplicar a lógica de
  identificadores (CPF/CNPJ, chave Pix, instituição) a cada novo tipo
  que precisar de uma lista de pagamentos/transferências.
- `comunicante_genero` hoje só existe dentro de `estelionato.js`. Se
  mais tipos novos (roubo, lesão corporal, ameaça) precisarem de
  concordância de gênero da vítima, either duplicar a pergunta em cada
  tipo, ou criar um pequeno helper `perguntaGeneroComunicante()` em
  algum lugar compartilhado (ex.: `core/`) pra não reescrever a mesma
  definição de pergunta em múltiplos arquivos de tipo.

## FIXME

* **Orientações, prazo e representação na violência doméstica** — o item
  de "Ameaça ou perseguição" diz que as duas dependem de representação,
  em seis meses, e continua dizendo isso com o extra `vinculo_domestico`
  marcado. Contra a mulher, ali a folha erra duas vezes: a ameaça por
  razões da condição do sexo feminino (o que inclui a violência
  doméstica) é de ação pública incondicionada (art. 147, § 2º, Lei
  14.994/2024), e o prazo de representação ou queixa na violência
  doméstica contra a mulher passou a 12 meses (art. 103, p.u., Lei
  15.438/2026), o que alcança a perseguição. O item de "Em qualquer
  registro" já diz "(ou 1 ano)"; os de calúnia e de dano simples dizem
  seis meses sem ressalva. O extra vale também para vítima homem, então
  a correção tem de separar os dois casos, não só trocar o número.

## IDEIAS

* Página com ferramenta de caixa de seleção para as peças de APF/Kit Preso, etc

Sugestões por ferramenta, levantadas em outubro de 2026 e ainda não
escolhidas. O que já está em NEW (tipos e fatos faltantes, Telegram e
Signal, service worker, ponte conversor → transcrição, progresso da
transcrição, RENAVAM e CNH) não se repete aqui.

* **Início** — busca única: "147" ou "IML" digitados na página inicial
  levam ao resultado da tipificação ou dos contatos, sem precisar saber
  antes em que página procurar. Seria a terceira página com busca, que é
  o gatilho para extrair a normalização (ver IMPROVE).
* **Gerador**
  - **Ordem dos tipos novos.** Começar pelos que as outras páginas já
    cobrem: furto e roubo, ameaça e perseguição, lesão, violência
    doméstica. Esses têm folha de orientações e lista de perguntas, e só
    o gerador falta — é onde a sequência perguntar → registrar →
    entregar a folha se interrompe.
  - **Link para as Perguntas ao escolher o fato**, antes de preencher. As
    perguntas servem durante o atendimento, e hoje o gerador só aponta
    para as orientações, no fim. `roteiro.html` já aceita `?fato=`; o
    mapeamento iria no módulo do tipo, ao lado do campo `orientacoes`.
  - **Prévia do texto enquanto se preenche**, para ver que resposta virou
    que frase sem chegar ao botão Gerar.
* **Orientações**
  - **Prazo em data, não em duração.** Os prazos de seis meses (doze na
    violência doméstica contra a mulher) contam do dia em que se soube
    quem é o autor — e, quando o autor já é conhecido no registro, um
    campo opcional com essa data deixaria a folha dizer "até 10/04/2027".
    Uma data no papel se confere na folhinha; "seis meses" se esquece de
    quando começou. Sem o campo, fica o texto de hoje.
  - **Letra grande na impressão**: uma opção que aumenta o corpo da folha.
    Boa parte de quem a recebe é idosa.
* **Perguntas**
  - **Marcar a pergunta já feita**: clicar risca a pergunta, só para a
    aba aberta (`sessionStorage`, como o rascunho do gerador). Na lista
    de violência doméstica, com quinze perguntas, mostra de relance o que
    falta.
  - **Formulário Nacional de Avaliação de Risco** (Lei 14.149/2021) no
    grupo de violência doméstica: o PDF na estante de Anotações e um
    lembrete na lista apontando para ele.
* **Tipificação**
  - **Copiar várias referências de uma vez**: caixa de marcar por linha e
    um botão "copiar as N referências". Ocorrência raramente tem um crime
    só — furto com dano, lesão com ameaça, tráfico com porte de arma.
  - **Busca na URL** (`tipificacao.html?q=…`): atalho salvo de consulta
    frequente, e Perguntas e Orientações podendo apontar para os artigos
    do fato, como Perguntas já faz com `?fato=`.
  - **Índice de grupos**: são 30 grupos e 329 linhas, e sem busca chegar
    a "Crimes eleitorais" é rolar a página inteira. Uma fileira de
    atalhos no topo, ou grupos que se recolhem.
  - **Filtro por marca**: só hediondos, só JECRIM, só afiançáveis pela
    autoridade policial.
  - **Calculados, sem campo novo na tabela**: suspensão condicional do
    processo (art. 89 da Lei 9.099, pena mínima de até 1 ano) e ANPP
    (art. 28-A do CPP, pena mínima abaixo de 4 anos, sem violência nem
    grave ameaça, fora da violência doméstica). A pena mínima sai do
    campo `pena`, como a prescrição já sai da máxima; só a violência
    pediria uma marca nova, `"violencia"`. E o prazo de representação ou
    queixa, para `condicionada` e `privada`: seis meses do conhecimento
    da autoria, doze na violência doméstica contra a mulher (art. 103 do
    CP).
  - **Campos novos na entrada**:
    - `distinguir` — os fatos com que aquele se confunde (furto mediante
      fraude e estelionato, roubo e extorsão, ameaça e constrangimento
      ilegal, dano e pichação, lesão e vias de fato), como lista de
      outros `fato`, que vira link dentro da tabela. É aqui que a
      tipificação erra, mais do que na pena;
    - `pericia` — o exame que o fato pede: corpo de delito, constatação
      de droga, etilômetro, perícia de local;
    - `competencia` — só quando não for a Justiça estadual: moeda falsa,
      Correios, INSS, tráfico internacional. Evita encaminhar para o
      lugar errado;
    - marca `"permanente"` — tráfico, posse de arma, sequestro, cárcere
      privado: o flagrante cabe enquanto a situação durar;
    - `conferido` — data e fonte da última conferência no texto legal,
      para o teste listar o que nunca foi conferido. Hoje as 329 foram
      conferidas na mesma passada; o campo serve a partir da próxima lei.
  - **Link para o Planalto**: uma `url` em cada diploma de
    `TIPIFICACAO_DIPLOMAS`. Perdeu prioridade com o `texto` na própria
    página, mas é por ele que se confere se a redação mudou.
* **Conversor** — **SHA-256 do arquivo original**, calculado no navegador
  e salvo num `.txt` ao lado do convertido (ou dentro do ZIP). A
  conversão troca o arquivo, e hoje não sobra registro de qual foi o
  recebido — é o elo da cadeia de custódia que a ferramenta quebra.
  `crypto.subtle.digest` não lê em partes: arquivo de gigabytes pediria
  uma implementação incremental.
* **Transcrição**
  - **Ouvir a partir do trecho**: clicar num `[mm:ss]` toca o áudio dali,
    do próprio arquivo carregado. Revisar um trecho duvidoso hoje exige
    abrir o arquivo em outro programa e procurar o minuto.
  - **Cabeçalho no `.txt`**: nome do arquivo, duração, modelo usado e
    SHA-256 — liga a transcrição ao arquivo de que ela saiu.
* **Conversas**
  - **Filtrar por período**: uma exportação traz anos de conversa, e o
    registro trata de um ou dois dias. Decidir antes se a numeração
    recomeça ou mantém a da conversa inteira.
  - **SHA-256 da exportação no cabeçalho**, pelo mesmo motivo do
    conversor. Hoje o conteúdo é colado, e o hash do texto colado não é o
    do arquivo; teria de aceitar o `.txt` como arquivo.
* **Conferidor**
  - **Converter a placa entre os formatos**: ABC1234 ↔ ABC1C34. A vítima
    lembra da placa antiga e o sistema registra a Mercosul, ou o
    contrário.
  - **Dizer o que o número revela**: a região fiscal pelo 9º dígito do
    CPF (0 = RS, 8 = SP…), com o aviso de que é onde o CPF foi emitido,
    não onde a pessoa mora; matriz ou filial pelo `/0001` do CNPJ.
* **Contatos**
  - **Não copiar contato provisório**: o botão de um `(00) 0000-0000` ou
    de um "PREENCHER" avisa "não cadastrado" em vez de copiar. Hoje eles
    estão na tela com cara de número de verdade.
  - **"Conferido em mês/ano" por contato.** Nas Anotações a data saiu de
    propósito; aqui é justamente o que falta saber — há quanto tempo
    ninguém liga para aquele número.
* **Anotações**
  - **Conteúdo**: a estante tem só o Kit Preso/APF, nas duas versões.
    Candidatos: termo de representação, termo de renúncia, auto
    de entrega ou restituição de objeto, o formulário de avaliação de
    risco (ver Perguntas).
  - **Campo `fatos` em cada PDF**, para Perguntas e Orientações apontarem
    o papel do caso.
* **Em várias páginas** — uma função de SHA-256 em `js/comum/`, para as
  três páginas que lidam com prova (conversor, transcrição, conversas),
  em vez de três cópias — a mesma lógica da normalização em IMPROVE.
