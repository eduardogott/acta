# Acta

**Acta** (do latim *Acta Diurna*, os registros públicos diários de Roma) é
um conjunto de ferramentas de uso interno para o atendimento e o registro
de ocorrências policiais. Tudo roda inteiramente no navegador —
HTML/CSS/JS puro, sem build step, sem backend — e **nenhum dado digitado,
nenhum arquivo e nenhum áudio saem do computador**. O que vem da internet
são bibliotecas e modelos, nunca o conteúdo do usuário.

| Página | O que faz |
| --- | --- |
| `index.html` | Gerador de texto de ocorrência: questionário dinâmico → um parágrafo de narrativa em 3ª pessoa ("Comunica que…", "Informa que…"). |
| `conversor.html` | Converte e comprime áudio, vídeo e imagem com ffmpeg.wasm; extrai áudio e quadros de vídeo. |
| `transcricao.html` | Transcreve áudio em português com o Whisper, dentro do navegador. |
| `conversas.html` | Formata a exportação do WhatsApp numa transcrição numerada. |
| `orientacoes.html` | Monta a folha de "o que fazer agora" para imprimir e entregar ao comunicante. |
| `conferidor.html` | Confere dígito verificador de CPF, CNPJ, IMEI, chassi, placa, título de eleitor e PIS. |
| `tipificacao.html` | Consulta rápida de tipificação penal, pesquisável por fato ou artigo. |

"Acta" é o nome da **suíte**, não de nenhuma das ferramentas: aparece no
cabeçalho, no título da aba (`Acta — <ferramenta>`) e no rodapé de todas
as páginas, e nunca no `<h1>`, que é da ferramenta.

Duas partes comuns a todas as páginas são montadas por script, a partir
de uma lista única, em vez de copiadas: a navegação
(**`js/comum/nav.js`**) e o rodapé (**`js/comum/rodape.js`**).
Acrescentar uma página é uma linha em `PAGINAS`. Enquanto o rodapé esteve
copiado, ele divergiu — a linha da etimologia existia só no index, o que
fazia "Acta" parecer o nome do gerador. Os testes conferem essas
invariantes em toda página.

## Rodando localmente

Não há build. Basta servir os arquivos estáticos e abrir no navegador,
por exemplo:

```
npx serve .
```

ou simplesmente abrir `index.html` diretamente no navegador (algumas
funcionalidades, como `navigator.clipboard`, podem exigir `http://` em
vez de `file://` dependendo do navegador).

## Estrutura dos arquivos

Uma pasta por ferramenta em `js/`, e `js/comum/` para o que mais de uma
usa. As páginas ficam na raiz porque são as URLs do site — mexer nelas
quebraria links já salvos.

```
index.html  conversor.html  transcricao.html  conversas.html
orientacoes.html  conferidor.html  tipificacao.html

css/
  style.css          tokens e componentes de todas as páginas
  conversor.css      só do conversor
  ferramentas.css    das cinco ferramentas menores

js/
  comum/             theme.js, nav.js, rodape.js, versao.js
                     identificadores.js (gerador + conferidor)
                     formatos.js (tamanho e tempo), copiar.js (copiar com feedback)
  gerador/           main.js, engine.js, generator.js, schema.js, registry.js
    core/            estado, visibilidade, validadores, texto-helpers, linter…
    renderers/       um arquivo por tipo de campo
    tipos/           um arquivo por tipo de ocorrência
  conversor/         regras.js (contas), motor.js (ffmpeg), conversor.js (página), zip.js
    vendor/ffmpeg/   carregador do ffmpeg.wasm (precisa ser local — ver abaixo)
  transcricao/       transcricao.js (página), worker.js (inferência)
  conversas/         conversas.js
  orientacoes/       orientacoes.js (página), dados.js (conteúdo)
  conferidor/        conferidor.js
  tipificacao/       tipificacao.js (página), dados.js (a tabela)

tests/                     servidor.py, gerar.py, rodar.ps1, casos/
functions/_middleware.js   Basic Auth + COOP/COEP em toda rota
_headers                   os mesmos cabeçalhos, como documentação/fallback
```

Onde há um `dados.js`, ele é o único arquivo a editar para mudar conteúdo:
a página ao lado só desenha.

## Arquitetura

O fluxo é: **schema → engine → generator**.

- **`js/gerador/registry.js`** — cadastro central dos "tipos de ocorrência"
  (estelionato, perda, etc). Cada arquivo em
  `js/gerador/tipos/*.js` se registra aqui via `registrarTipoOcorrencia(...)`.
- **`js/gerador/schema.js`** — define as perguntas fixas que aparecem antes
  (`PERGUNTAS_INICIAIS`, incluindo o seletor "Qual é o fato da
  ocorrência?", montado a partir do registry) e depois
  (`PERGUNTAS_FINAIS`, ex.: motivo do registro, representação criminal)
  das perguntas do tipo escolhido. `getPerguntas(respostas)` monta a
  lista efetiva na ordem em que as frases devem sair no texto final.
- **`js/gerador/core/estado.js`** — única fonte de verdade das respostas (objeto
  de dados puro, sem DOM). Também controla quais perguntas já foram
  "tocadas" pelo usuário.
- **`js/gerador/core/visibilidade.js`** — avalia a condição `exibirSe` de uma
  pergunta de forma pura (recebe as respostas como parâmetro).
- **`js/gerador/core/renderers-registry.js`** + **`js/gerador/renderers/*.js`** — cada
  tipo de campo (`multipla`, `selecao`, `texto`, `numero`, `dinheiro`,
  `multiplo-input`) é um plugin registrado via `registrarRenderer(...)`,
  responsável por desenhar o controle e dizer se está preenchido.
- **`js/gerador/core/validadores.js`** — validadores nomeados e reutilizáveis
  (ex.: `naoVazio`, `cpfOuCnpj`, `numeroPositivo`), referenciados pelo
  nome no campo `validador` de uma pergunta.
- **`js/gerador/core/texto-helpers.js`** — funções utilitárias passadas como
  terceiro argumento (`h`) para todo `template(resposta, respostas, h)`:
  formatação de dinheiro, junção de listas em português
  (`juntarLista`/`juntarClausulas`), ordinais por extenso (`ordinal`),
  pontuação de texto livre (`garantirPonto`), etc.
- **`js/gerador/engine.js`** — orquestrador: decide o que está visível agora,
  desenha isso como DOM, valida e calcula pendências. Não sabe desenhar
  nenhum tipo de pergunta específico nem o que significa `exibirSe` —
  isso é responsabilidade dos módulos acima.
- **`js/gerador/generator.js`** — percorre as perguntas ativas na ordem do
  schema e concatena o retorno de cada `template(...)` num único
  parágrafo, fechando sempre com "Nada mais."
- **`js/gerador/core/linter.js`** — roda uma vez no carregamento da página e
  avisa (console + banner discreto na tela) sobre erros estruturais no
  schema: id duplicado, tipo de pergunta sem renderer, `exibirSe`
  apontando para um id inexistente, etc. Não bloqueia o uso da
  ferramenta — é um aviso para quem edita o questionário, não para quem
  o preenche.

  Ele também confere o **valor** comparado em `exibirSe`, e não só o id:
  `igual: "celulares"` onde a opção é `"celular"` faz a pergunta nunca
  aparecer, sem erro nenhum no console — o tipo de defeito que só se
  descobre preenchendo o formulário inteiro e reparando na falta. A
  checagem vale quando a pergunta-alvo tem lista de opções; contra
  campo de texto livre não há conjunto fechado para comparar.
- **`js/gerador/main.js`** — liga os botões da página, restaura o rascunho
  e monta o link para as orientações (ver as duas seções abaixo). Copiar
  fica em `js/comum/copiar.js`, compartilhado com as outras ferramentas:
  são três degraus — `navigator.clipboard.writeText`, o
  `document.execCommand("copy")` legado (que funciona em `file://` e em
  navegador antigo) e, se nem isso, deixar o texto selecionado e pedir
  Ctrl+C. Existem porque a API moderna rejeita em situações comuns aqui
  (página aberta como `file://`, permissão negada, foco fora do
  documento) e antes a promessa rejeitava em silêncio: o botão não
  mudava e o usuário concluía que tinha copiado sem ter copiado nada.

### Rascunho

As respostas são espelhadas em **`sessionStorage`**, e não em
`localStorage`. A escolha é deliberada: sessionStorage sobrevive ao F5 e
à navegação dentro da mesma aba — que é o acidente que se quer cobrir,
perder meia hora de preenchimento num toque de tecla —, mas morre quando
a aba fecha. Nada de dado de vítima ficando em disco depois do
atendimento. (O navegador restaura sessionStorage ao reabrir uma aba
fechada por engano ou depois de um travamento; é pouco, mas não é zero.)

Quando há rascunho recuperado, um aviso aparece acima do formulário com
um botão de descartar. Ele precisa existir: sem ele, um formulário que
volta preenchido depois de um F5 parece o formulário de outra pessoa.

### Ponte para as orientações

Ao gerar o texto, aparece um link para `orientacoes.html` já com o tipo e
o subtipo do caso — a folha que o comunicante leva embora. O mapeamento
mora no módulo do tipo, no campo opcional `orientacoes` (ver o cabeçalho
de `registry.js`), porque é ele que sabe o que as próprias respostas
significam. Tipo sem esse campo simplesmente não mostra o link.

## Adicionando um tipo de ocorrência novo

1. Crie `js/gerador/tipos/nome_do_tipo.js`.
2. Nele, chame:

   ```js
   registrarTipoOcorrencia("chave_unica", {
     label: "Texto mostrado na primeira pergunta",
     perguntas: [ /* array de perguntas, no mesmo formato de sempre */ ],
   });
   ```

   Essas perguntas só entram em cena quando o usuário escolhe esse tipo
   na primeira pergunta — não precisam de `exibirSe` apontando para
   `tipo_ocorrencia`, isso já é implícito. Mas podem usar `exibirSe`
   entre si, para ramificações internas do próprio tipo (ex.: subtipo de
   estelionato → golpe do Pix → lista de transferências).
3. Inclua o arquivo em `index.html`, antes de `js/gerador/schema.js`:

   ```html
   <script src="js/gerador/tipos/nome_do_tipo.js"></script>
   ```

Nenhum outro arquivo precisa ser editado — a lista de tipos na primeira
pergunta é montada automaticamente a partir do registry.

## Adicionando um tipo de pergunta (renderer) novo

Crie `js/gerador/renderers/nome.js` chamando `registrarRenderer(...)`. Veja o
cabeçalho de comentários em `js/gerador/core/renderers-registry.js` para o
contrato completo (`valorPadrao`, `estaPreenchida`, `criar`,
`revalidaVisibilidade`, `estaTudoValido`).

## Testes

```powershell
powershell -ExecutionPolicy Bypass -File tests\rodar.ps1
```

Sem framework e sem dependência: um servidor da biblioteca padrão do
Python, o Edge que já está na máquina, e um script. Cada caso é injetado
**dentro da página real** — mesmo HTML, mesmo CSS, mesmos scripts —, então
um `style.css` quebrado ou um caminho errado aparecem aqui. O caso da
transcrição vai até o fim de verdade: cria o worker, baixa o modelo e
transcreve, que é onde este projeto já tropeçou duas vezes na mesma pedra
(o construtor `Worker` recusando URL de outra origem).

Detalhes de como escrever um caso novo: `tests/README.md`.

**O texto gerado é conferido palavra por palavra** em
`tests/casos/texto.js`: cada cenário responde um questionário e compara o
parágrafo inteiro com o esperado. É o caso mais importante da suíte, e a
razão é a natureza da falha: um `template(...)` quebrado não dá erro
nenhum — dá uma frase que parece certa e diz outra coisa, e vai colada
dentro de um boletim. Uma mudança de fraseado num tipo já em produção
altera retroativamente todo caso futuro, então nada muda sem alguém ver
mudando: o teste falha, você lê o diff e atualiza a expectativa.

Esse caso não passa pelo DOM — `Generator.gerar()` lê o Estado direto —,
o que torna barato acrescentar um tipo novo: um bloco `cenario()` com as
respostas de um lado e o parágrafo do outro. Quem prova que o formulário
é respondível é `tests/casos/index.js`, clicando de verdade.

Não há CI.

## Rodapé e carimbo de versão

**`js/comum/rodape.js`** monta o rodapé inteiro — etimologia, crédito e
carimbo de versão — em toda página que tiver um `<footer>` vazio. É a
mesma decisão do `nav.js`, pelo mesmo motivo: sete cópias divergem.

O carimbo mostra os últimos sete caracteres do hash do commit que gerou o
deploy (o hash inteiro fica no `title`, que é o que serve num `git show`).
Existe para responder "qual código estava no ar quando isso aconteceu?" —
o fraseado dos textos gerados muda de versão para versão, e um relato de
"o texto saiu errado" só é investigável sabendo qual commit o usuário
tinha na tela.

- **`js/comum/versao.js`** — arquivo commitado com o valor `"dev"`, que é o que
  aparece ao servir os arquivos localmente.
- Sem carimbo, a linha não é escrita: melhor uma linha a menos do que
  "undefined" na tela.

Como não há build step, quem preenche o valor real é o **comando de build
do Cloudflare Pages** (Settings → Builds & deployments → Build command):

```
echo "window.ACTA_VERSAO = \"$CF_PAGES_COMMIT_SHA\";" > js/comum/versao.js
```

Sem esse comando o site continua funcionando — o rodapé só mostra
"versão local (dev)".

## Conversor de mídia (`conversor.html`)

Converte áudio/vídeo/imagem e comprime vídeo ou áudio, tudo processado
**no navegador** via
[ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) — nenhum arquivo
é enviado a servidor algum, igual ao gerador de ocorrências.

**Três arquivos de JavaScript, e a ordem no HTML importa** (regras, motor,
página):

| Arquivo | O que faz | Conhece… |
| --- | --- | --- |
| `js/conversor/regras.js` | Configuração, planejamento de tamanho-alvo, estimativa, leitura do log do `ffmpeg -i`. | nada — nem DOM, nem ffmpeg, nem rede |
| `js/conversor/motor.js` | Baixa o núcleo do ffmpeg, monta os `blob:`, carrega a instância, roda comandos. Mais o diagnóstico do carregamento. | o ffmpeg |
| `js/conversor/conversor.js` | As operações (as linhas de comando de cada opção) e a interface. | tudo |

A separação existe pelo `regras.js`: as decisões mais delicadas da
ferramenta são aritmética — quanto de bitrate cabe num alvo, quando
encolher a imagem em vez de insistir na resolução, se a conversão vale a
pena — e, dentro de três mil linhas de interface, não havia como
exercitá-las sem abrir a página e converter um arquivo. Agora
`tests/casos/conversao.js` chama a função e confere o número.

O `motor.js` recebe por parâmetro quem acompanha o carregamento, e expõe
o andamento de um encode pelo objeto `ganchos` (`ganchos.progresso`,
`ganchos.log`). Quem escreve um gancho limpa no `finally`: gancho vivo
depois do trabalho faz a barra de um arquivo mexer com o log do próximo.

- **`conversor.html`** / **`css/conversor.css`** / **`js/conversor/conversor.js`** —
  markup, estilo e lógica da página. As regras partiram do script Python
  homônimo (a tabela de crf/resolução/fps/áudio por nível na opção 9, a
  padronização de extensões) e se afastaram delas onde o navegador ou o
  uso pediram. A opção 9 aceita vídeo **ou** áudio: o tipo
  é detectado pela extensão e só os campos daquele tipo aparecem, e apenas
  no nível "Personalizada".

  A opção 9 processa uma **fila**: vários arquivos, um após o outro, na
  mesma instância do motor. A seleção tem de ser homogênea (só vídeos ou
  só áudios) — as tabelas de nível são diferentes entre os dois tipos e os
  campos manuais da tela são de um tipo só, então misturar produziria uma
  tela falando de duas coisas ao mesmo tempo. Duas coisas continuam sendo
  do **primeiro** arquivo da fila: o painel "Arquivo original" (a sonda é
  cara demais para rodar em todos antes de começar) e, por consequência,
  os atalhos de fração. O corte de trecho só aparece com um arquivo
  selecionado: os mesmos segundos aplicados a uma fila inteira quase nunca
  são o que se quer, e não haveria como validar o intervalo contra
  durações diferentes.

  **As conversões 1, 2 e 3 já saem comprimidas** (`CONVERSAO_VIDEO`,
  `CONVERSAO_AUDIO`, `QSCALE_JPEG_90`). O sistema de destino aceita no
  máximo 20 MB por arquivo, e entregar um MP4 remuxado de 300 MB seria
  devolver o problema ao usuário. Os números são **teto, nunca alvo**:
  nenhuma delas sobe bitrate, sample rate ou resolução acima do que o
  arquivo já tem.

  - **Áudio → MP3** em 128 kbps e 32 kHz, cada um limitado ao que o
    original tiver. Um `.mp3` de entrada continua passando intacto:
    recomprimi-lo atingiria também as opções 4 e 8, que varrem pastas
    inteiras.
  - **Vídeo → MP4** em CRF 23, preset medium, com AAC 128 kbps a 32 kHz.
    Antes de recomprimir, `estimarConversaoVideo` calcula quanto essa
    linha de base produziria; se der **maior** que o original — vídeo
    curto, já comprimido, ou de bitrate baixo —, o arquivo é apenas
    remuxado, porque recomprimir ali seria perder qualidade para ganhar
    tamanho. Um vídeo que não é h264 é recodificado de qualquer jeito, já
    que copiar não é opção.
  - **Imagem → JPG** em qscale 3. O mjpeg do ffmpeg não conhece a escala
    0–100 do libjpeg: o que ele aceita é o qscale, de 2 (melhor) a 31
    (pior), e o degrau 3 é o equivalente prático de "qualidade 90". O 2,
    usado antes, fica em ~93/95 e praticamente não comprime. Um `.jpg` de
    entrada continua passando intacto, pelo mesmo motivo do `.mp3`.

  Além das opções herdadas do script Python, existem duas locais:

  - **6 — extrair áudio de vídeo** (`extractAudioFile`): `-vn` mais
    libmp3lame em `-q:a 2`, e não `-q:a 0` como na opção 1, porque a
    origem é uma faixa já comprimida dentro do vídeo — o ajuste mais
    caprichado gastaria o dobro do espaço guardando fielmente o ruído da
    compressão anterior. Vídeo sem faixa de áudio recebe essa frase, em
    vez do código de erro cru do ffmpeg.
  - **7 — extrair quadro** (`extractFrameFile`): `-ss` antes do `-i`
    (mesmo motivo do corte) mais `-frames:v 1`. O instante aceita `90`,
    `1:30` ou `1:02:03` e vale para todos os vídeos selecionados. Um
    instante além do fim do vídeo **não** é erro para o ffmpeg: ele
    termina em paz sem escrever quadro nenhum, então é a leitura da saída
    que decide se deu certo.

  **Nível "Tamanho-alvo"** (nível 6 da opção 9): em vez de escolher a
  qualidade e descobrir o tamanho, o usuário diz quanto o arquivo pode
  ocupar e `planejarAlvo`/`planejarAlvoAudio` derivam o bitrate. O teto
  vale **por arquivo** da fila, não para o lote. O orçamento é repartido
  com o áudio primeiro (no máximo um quinto, nunca acima do original),
  porque é a parte que não se comprime bem; o que sobra vai para o vídeo,
  em ABR de uma passada com `-maxrate`/`-bufsize` — duas passadas seriam
  mais exatas, mas dobrariam um encode que aqui já é lento. Se o bitrate
  resultante não sustentar a resolução original (menos de 0,04 bit por
  pixel por quadro), a imagem desce pela escada de larguras: com pouco
  bitrate, uma imagem menor e nítida serve melhor que a original cheia de
  blocos. E quando nem o bitrate mínimo utilizável cabe no alvo, o encode
  segue no mínimo e o arquivo sai maior que o pedido — a estimativa avisa
  antes, e o console repete na hora. Devolver um borrão do tamanho certo
  seria pior.

  A saída é sempre **H.264 e MP3**, por decisão de compatibilidade: parte
  das máquinas que abrem esses arquivos é modesta, e formatos mais
  eficientes (o build tem `libx265` e `libopus` habilitados) custariam
  conversão mais lenta e arquivo que não abre em todo lugar.

  Nesse nível aparece também o painel "Arquivo original" (resolução, fps,
  sample rate e bitrate do áudio) e os atalhos 2/3, 1/2 e 1/3 ao lado dos
  campos de largura, fps e bitrate. A resolução sai na hora, do elemento
  `<video>` nativo; os demais exigem a sonda do ffmpeg
  (`carregarInfoDetalhada`), então **entrar em "Personalizada" carrega o
  motor** — é o único jeito de saber fps e bitrate reais, e a sonda fica
  guardada em `estado.info` para a compressão não repetir o trabalho.

  O sample rate é uma escolha fechada (original / 32k / 24k / 16k) em vez
  de campo livre, para não haver como digitar um valor que o encoder
  recuse. Nos presets de áudio, `compressionLevel` faz o papel que o
  `preset` faz no vídeo: o libmp3lame não conhece `-preset` (isso é do
  x264), e o equivalente é `-compression_level`, a escala de qualidade do
  LAME, em que 0 é o mais lento e caprichado e 9 o mais apressado. Nos campos cujo rótulo diz "vazio = original" (largura e fps), o
  botão "original" limpa o campo em vez de escrever um número: gravar 30
  num vídeo de 29,97 seria reamostrar disfarçado de "sem mudança".
- **Corte de trecho** (opção 9, qualquer nível): `-ss` entra **antes** do
  `-i` para o seek ser rápido, e a janela é fechada com `-t` (duração) em
  vez de `-to`, porque `-ss` de entrada combinado com `-t` de saída se
  comporta igual em qualquer versão do ffmpeg. Os campos aceitam `90`,
  `1:30` ou `1:02:03`; a duração vem dos metadados nativos, então a
  validação não depende de carregar o motor.
- **Andamento da compressão** vem de `-progress pipe:1`
  (`ARGS_PROGRESSO`), e não do evento `progress` do ffmpeg.wasm. Este core
  **não** emite esse evento: `receiveProgress` existe no glue JS mas o
  símbolo não está no `.wasm`, então o C nunca o chama. Confirmado em
  campo — o diagnóstico mostrava `eventos progress: 0` com 29 linhas de
  log recebidas.

  Também não adianta parsear a linha de estatística normal do ffmpeg
  (`frame= … time= …`): ela termina em `
`, e o Emscripten só entrega ao
  logger quando encontra `
`, então fica presa no buffer o encode
  inteiro. Já os blocos do `-progress` são `chave=valor` terminados em
  newline e chegam na hora; deles saem `out_time_us` (microssegundos) e
  `speed`. A fração é calculada contra a duração que **nós** conhecemos,
  porque a do próprio ffmpeg ignoraria o corte.

  `execCompressao` protege esse experimento: se o comando falhar **com**
  `-progress pipe:1`, ele repete uma vez sem — nem todo core abre esse
  pipe, e é melhor perder a barra do que perder a conversão. Dando certo
  na segunda, o `-progress` fica desligado pelo resto da sessão.

  Há um heartbeat de 1 s para o tempo decorrido seguir andando, e as
  métricas (tempo processado, fonte, contagem de eventos e linhas,
  velocidade) saem no console a cada 5 s.
- **AV1 não é decodificável aqui.** O `@ffmpeg/core-mt` 0.12.10 é
  compilado sem `libdav1d`, `libaom` e `libgav1` (confere na linha de
  `configuration` do `.wasm`); sem elas o decoder `av1` do ffmpeg é só um
  invólucro para aceleração de hardware, inexistente em WebAssembly.
  `problemaDeCodec()` barra esses arquivos com uma explicação em vez de
  deixar o ffmpeg morrer no meio.

  Isso importa porque a opção 2 fabricava esses arquivos: o `-c copy` cego
  empacotava um webm de AV1 (o que o yt-dlp baixa do YouTube) dentro de um
  MP4, gerando algo que este próprio motor não reabria. Agora
  `convertVideoFile` sonda antes e escolhe: `-c copy` quando é
  h264 + aac/mp3, copiar só o vídeo quando o áudio não serve, e
  recodificação completa para H.264 + AAC no resto — coerente com a regra
  de sair sempre em H.264/MP3.
- **Quando o ffmpeg falha, as últimas 40 linhas do log vão para o
  console** (`despejarCauda`), junto de uma tradução da causa quando
  reconhecida (`explicarFalha`). É onde a razão aparece, e antes elas eram
  descartadas — restava só um código de saída sem explicação. A sonda é a
  exceção: ela sai com código 1 de propósito, e passa `falhaEsperada`.
- **Prévia** ao lado de cada botão Baixar: abre o arquivo convertido num
  modal e pede tela cheia. `requestFullscreen()` só vale dentro do gesto
  do usuário — daí ser chamado direto no clique; se o navegador recusar, o
  modal continua servindo como visualização em janela.
- **`js/conversor/zip.js`** — escritor de ZIP mínimo (método STORE, sem ZIP64) usado
  pelo botão "Baixar tudo". Não usa biblioteca externa: os arquivos de
  saída já são comprimidos, então deflate não traria ganho.
- **`js/conversor/vendor/ffmpeg/`** — só o carregador do `@ffmpeg/ffmpeg`
  (`ffmpeg.js` + `814.ffmpeg.js`, 7,6 KB somados). **Precisa continuar
  local**: o `ffmpeg.js` deriva a URL do worker `814.ffmpeg.js` do
  `document.currentScript.src` e chama `new Worker()` com ela — e o
  construtor `Worker` recusa qualquer URL de outra origem, independente de
  CORS ou CORP. Servir esses dois de um CDN quebra com `SecurityError`.
- **Núcleo do ffmpeg — vem do jsDelivr, não do repo.** `ffmpeg-core.js`,
  `ffmpeg-core.wasm` (32 MB) e `ffmpeg-core.worker.js` são buscados de
  `cdn.jsdelivr.net/npm/@ffmpeg/core-mt@<versão>/dist/umd/` com `fetch()`
  e convertidos em `blob:` URLs antes de irem para o `ffmpeg.load()` — ver
  `ARQUIVOS_CORE` (em `js/conversor/regras.js`) e
  `baixarCoreComoBlobURLs` (em `js/conversor/motor.js`).

  As três **têm** de virar `blob:`, e não ir como URL do CDN direto,
  porque o Emscripten cria os workers de pthread com
  `new Worker(workerURL)` — mesma restrição de origem acima. Um `blob:`
  URL pertence à nossa origem e passa. De quebra, buscar por conta própria
  mantém a barra de progresso e o cache.

  Isso funciona porque o jsDelivr responde com
  `access-control-allow-origin: *` (o `fetch` passa) e
  `cross-origin-resource-policy: cross-origin` (satisfaz o COEP
  `require-corp`). O `fetch` vai com `credentials: "omit"`: o site fica
  atrás de Basic Auth, e mandar credenciais para uma origem que responde
  `ACAO: *` quebraria o CORS.
- As URLs passadas ao `ffmpeg.load()` precisam ser **absolutas**. Elas são
  repassadas ao worker `814.ffmpeg.js`, que faz `importScripts(coreURL)`;
  lá dentro um caminho relativo resolveria contra a pasta do worker, não a
  da página. Hoje isso está garantido por serem `blob:`. Como o `ffmpeg.js`
  não escuta o evento `error` do worker, uma falha assim não vira exceção —
  o `load()` só nunca responde. Daí o teto de tempo (`TIMEOUT_LOAD_MS`) e a
  instrumentação do construtor `Worker` em `js/conversor/motor.js`.
- Os arquivos do núcleo ficam no Cache API sob a chave `acta-ffmpeg-v2`,
  então o download de 32 MB só acontece na primeira visita. Ao trocar a
  versão do ffmpeg, mude também esse nome de cache para invalidar o antigo.
- **`_headers`** / **`functions/_middleware.js`** — habilitam
  `Cross-Origin-Opener-Policy: same-origin` e
  `Cross-Origin-Embedder-Policy: require-corp` em **todas** as rotas,
  necessário para o core multi-thread (`SharedArrayBuffer`).

  O escopo é o site inteiro, e não só a página do conversor, porque o
  ffmpeg cria workers dedicados (`814.ffmpeg.js` e os workers de pthread
  do Emscripten): quando o documento que os cria é isolado, o próprio
  script do worker precisa vir com COEP, senão o `new Worker()` falha com
  um evento de erro **vazio**. Isso é seguro porque nenhuma página do site
  embute recurso de outra origem.

Limitações herdadas de rodar no navegador (sem acesso a disco): a opção 5
(padronizar extensões) não renomeia o arquivo original no disco do
usuário — ela gera uma cópia com o nome corrigido, disponível para
download, como todas as outras opções. Em navegadores com a File System
Access API (Chromium), o botão "Salvar numa pasta…" grava as saídas
direto numa pasta escolhida; nos demais resta o "Baixar tudo (.zip)".

Outras limitações: `.heic` **não** está na lista de imagens suportadas
porque o build padrão do `@ffmpeg/core-mt` não traz decodificador HEIC. E
o ffmpeg.wasm carrega o arquivo inteiro no heap do WebAssembly, então
arquivos acima de ~500 MB podem estourar a memória da aba — a página
avisa quando isso é provável.

### Atualizando o ffmpeg.wasm

São duas metades, atualizadas separadamente.

**O núcleo (jsDelivr).** Basta editar `CDN_CORE` em `js/conversor/regras.js`
apontando para a nova versão de `@ffmpeg/core-mt` e atualizar os `bytes`
de cada arquivo em `ARQUIVOS_CORE`. Esses tamanhos estão declarados
porque o jsDelivr responde em chunks, sem `Content-Length`, e sem eles a
barra de progresso perde o denominador; o código avisa no console se um
valor declarado divergir do que o servidor mandar. Para conferir:

```
for f in ffmpeg-core.js ffmpeg-core.wasm ffmpeg-core.worker.js; do
  curl -sS -o /tmp/$f "https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.10/dist/umd/$f"
  echo "$(stat -c%s /tmp/$f) $f"
done
```

Fixe sempre uma versão exata (nunca `@latest`): a URL vira imutável e o
CDN pode cacheá-la para sempre. Bump também `CACHE_MOTOR`.

**O carregador (local).** Só se você quiser subir a versão do
`@ffmpeg/ffmpeg`:

```
npm pack @ffmpeg/ffmpeg@0.12.15
```

e copie `dist/umd/ffmpeg.js` e `dist/umd/814.ffmpeg.js` para
`js/conversor/vendor/ffmpeg/` (o nome do segundo arquivo muda de versão para
versão — copie o que estiver em `dist/umd/` além de `ffmpeg.js`).
Mantenha as versões do carregador e do núcleo compatíveis entre si.

**Contrapartida de usar CDN.** O conversor passa a depender de o
`cdn.jsdelivr.net` estar acessível — em rede restrita que bloqueie o CDN,
o motor não carrega (o console mostra a falha de `fetch`). Foi uma
troca deliberada por não carregar 32 MB no repositório e por escapar do
limite de 25 MiB por arquivo do Cloudflare Pages, que antes obrigava a
quebrar o `.wasm` em partes.

## Transcrição de áudio (`transcricao.html`)

Transcreve áudio e vídeo em português com o Whisper, rodando dentro do
navegador via [transformers.js](https://huggingface.co/docs/transformers.js).
O áudio não sai da máquina; o que vem da rede é a biblioteca (jsDelivr) e
o modelo (Hugging Face), guardados no cache do navegador.

- **`js/transcricao/transcricao.js`** — a página. A decodificação do áudio é feita
  pela Web Audio API, não pelo ffmpeg: o Whisper quer amostras em 16 kHz
  mono, que é exatamente o que sai de um `OfflineAudioContext`, e assim
  esta página não carrega os 32 MB do motor de conversão. O preço é que o
  navegador não abre `.mkv`, `.avi` nem `.wma` — para esses, a página
  manda extrair o áudio no conversor (opção 6) e voltar.
- **`js/transcricao/worker.js`** — a inferência. Roda em worker porque
  ocupa a thread por minutos: na página, a aba congelaria inteira.
  **Precisa continuar local** — o construtor `Worker` recusa URL de outra
  origem, a mesma restrição já documentada para o carregador do ffmpeg. O
  que vem do CDN é a biblioteca, importada de dentro do worker, e
  `import` cruza origem sem problema quando o servidor manda CORS.

**Como as threads funcionam aqui.** O onnxruntime-web cria as threads de
pthread com `new Worker(new URL(import.meta.url), …)`. Se o `.mjs` do
runtime vier direto do jsDelivr, `import.meta.url` é a URL do CDN e o
navegador recusa — `SecurityError: Script at 'https://cdn.jsdelivr.net/…'
cannot be accessed from origin`, confirmado em teste. Não há fallback
para blob nesse build.

A saída é a mesma do núcleo do ffmpeg: o worker baixa
`ort-wasm-simd-threaded.jsep.mjs` e o `.wasm` por conta própria e os
entrega como `blob:` URLs, via
`env.backends.onnx.wasm.wasmPaths = { mjs, wasm }`. Um blob pertence à
nossa origem, então `import.meta.url` passa a ser um blob e as threads
nascem sem reclamação. Os dois arquivos ficam no Cache API sob
`acta-ort-v1` — ao trocar a versão da biblioteca, troque também esse nome.

São usadas até quatro threads (`TETO_THREADS`), conforme
`hardwareConcurrency`. Se qualquer parte disso falhar, o worker refaz o
carregamento com uma thread e os caminhos padrão, e avisa a página, que
diz no fim em quantas threads rodou. Perder velocidade é melhor que
perder a transcrição.

Modelos oferecidos, com o tamanho somado do codificador e do decodificador
quantizados em 8 bits: `whisper-tiny` (~41 MB), `whisper-base` (~77 MB,
padrão) e `whisper-small` (~249 MB). Ao trocar de modelo, confira os
tamanhos de novo — é por esse número que o usuário decide se espera.

As buscas ao Hugging Face passam sob COEP porque o `huggingface.co`
devolve a origem que pediu no `Access-Control-Allow-Origin`, e o COEP
`require-corp` exige CORP **ou** CORS; um `fetch` em modo cors satisfaz.

## Orientações ao comunicante (`orientacoes.html`)

Monta a folha de "o que fazer agora" para imprimir e entregar. Cobre o que
não cabe no texto da ocorrência e é justamente o que se esquece no caminho
de casa: bloquear IMEI, pedir o MED do Pix, preservar imagens de câmera
antes de serem sobrescritas, prazo de representação.

- **`js/orientacoes/dados.js`** — todo o conteúdo, com o formato explicado
  no cabeçalho do arquivo: itens comuns a qualquer registro, mais um bloco
  por tipo de fato, com subtipos (escolha única) e situações adicionais
  (marcáveis em conjunto). Um item pode declarar `prazo`, que vira
  etiqueta ao lado da frase.
- **`js/orientacoes/orientacoes.js`** — só monta e imprime; não tem conteúdo próprio.
- A regra de escrita: imperativo, endereçado a **quem leva o papel**
  ("Peça ao banco…"), não ao policial que atende.
- **É papel.** A folha é impressa pelo agente e entregue em mãos — o
  site inteiro é interno, e o comunicante nunca o acessa. Então nada de
  "clique", endereço de site curto o bastante para se digitar à mão,
  telefone junto sempre que houver, e login declarado onde existir
  (Registrato e Celular Seguro pedem conta gov.br; consumidor.gov.br pede
  cadastro). Esbarrar num login inesperado, sozinho, é onde a pessoa
  desiste.
- **E sempre pós-registro.** A folha só existe depois do BO, então
  orientação do momento do fato ("anote a placa do outro condutor",
  "fotografe antes de remover os veículos") nasce vencida: ou a pessoa
  fez, e a linha é ruído, ou não fez, e a folha só lhe informa uma perda.
  Todo item tem de caber em "dá para fazer hoje" — inclusive levar à
  delegacia o que ficou de fora do registro, que é a forma pós-BO de
  quase toda orientação de preservar prova.
- A impressão sai só com a folha — menu, botões e avisos ficam de fora
  pelo `@media print` de `css/ferramentas.css`.

### A folha impressa

Uma seleção cheia de estelionato passa de três páginas, e aí três coisas
precisam valer:

- **O nome repete no alto de cada página**, sem número nem data — quem
  recebe folhas soltas precisa saber de onde cada uma veio. Número e data
  ficam só na primeira: repeti-los sugeriria três boletins.
- **Nada de item cortado.** Um item que começa no pé de uma página e
  termina na seguinte faz a pessoa ler o começo, virar a folha e perder o
  prazo que estava no fim. `break-inside: avoid` no `li`.
- **Título não se separa do primeiro item**, via `break-after: avoid`:
  "Em qualquer registro" sozinho no pé da folha não é título de nada. O
  grupo em si pode quebrar — impedir isso empurraria dez itens inteiros
  para a folha seguinte e deixaria meia página em branco.

**Por que a folha é uma `<table>`.** O cabeçalho que repete mora num
`<thead>`, e `display: table-header-group` é a única forma garantida por
especificação de repetir algo no alto de cada página impressa. Na tela a
tabela vira blocos por CSS, então o layout é o de sempre.

Duas coisas foram testadas imprimindo em PDF, e as duas falharam antes de
funcionar: `position: fixed` (que o Chromium também repete) foi parar no
rodapé e atropelou o texto; e a tabela com **uma única linha** não repetiu
cabeçalho nenhum, porque o Chromium não fragmenta uma linha mais alta que
a página. Daí haver um `<tr>` por grupo. Para conferir depois de mexer:

```powershell
msedge --headless=new --no-pdf-header-footer --print-to-pdf=folha.pdf `
  "http://localhost:8731/orientacoes.html?tipo=estelionato&extras=coleta_dados,clonagem_whatsapp,acesso_remoto,uso_do_nome"
```

### Número da ocorrência

Um campo na página recebe só o sequencial; o resto do formato é sempre o
mesmo e sai montado: `48271/2026/100930`. O ano é o corrente e
`CODIGO_UNIDADE`, em `js/orientacoes/orientacoes.js`, é o da delegacia —
mudou de unidade, muda ali. Vazio, imprime a linha para preencher à
caneta, como antes.

A data é sempre a de **hoje**, e não a do fato nem a do registro: o que
ela data é a folha entregue agora. Recalculada também no `beforeprint`,
que pega o Ctrl+P e a página que virou a noite aberta.

## Transcrição de conversas (`conversas.html`)

Cola-se a exportação do WhatsApp e sai uma transcrição numerada, com os
participantes renomeados, cabeçalho com período e contagem, separador por
dia e anexos assinalados. Substitui a transcrição feita à mão.

- **Vários formatos, tentados em ordem.** A exportação muda conforme o
  sistema e a versão, então `PADROES` é uma lista de expressões, não uma
  só. Uma linha que não casa com nenhuma é tratada como continuação da
  mensagem anterior — é assim que mensagem de várias linhas sobrevive.
- O caractere invisível de direção no começo do padrão de colchetes é a
  marca que o iOS insere em cada linha. Sem ela na expressão, nenhum
  export de iPhone casaria.
- **Renomear participantes é o passo que importa.** Trocar "Maria Silva"
  e "+55 51 9…" por COMUNICANTE e AUTOR é o que transforma um despejo de
  conversa em peça de inquérito.
- **Os avisos do aplicativo não somem por padrão.** "O código de segurança
  mudou" pode significar troca de aparelho, e isso às vezes importa — há
  uma opção para ocultá-los, desmarcada.
- A página diz, na nota de rodapé, o que ela **não** faz: os anexos não
  vêm na exportação, mensagens apagadas antes dela não existem no
  arquivo, e formatar um texto apresentado pela parte não o autentica.

## Conferidor de identificadores (`conferidor.html`)

Roda todos os verificadores sobre o mesmo valor e diz o que ele pode ser.
É de propósito: no balcão chega um número solto, e "isto passa como IMEI e
não passa como CPF" resolve mais do que exigir que a pessoa escolha o tipo
antes de colar.

- **`js/comum/identificadores.js`** — a aritmética, com o contrato
  `{ ok, motivo }`. Separado de `validadores.js` porque tem dois
  consumidores com necessidades diferentes: o questionário quer uma
  mensagem para o campo, o conferidor quer o veredito de todos os tipos.
  `validadores.js` passou a delegar para cá, então CPF, CNPJ, IMEI e placa
  têm uma implementação só.
- **RENAVAM e CNH ficaram de fora** de propósito: circulam versões
  conflitantes do algoritmo de cada um, e um "inválido" errado num
  documento verdadeiro é pior que não ter a conferência.
- **Sobre o chassi:** o dígito verificador do VIN é obrigatório na América
  do Norte e **opcional** no resto do mundo. Um VIN brasileiro típico não
  fecha, e isso não é indício de adulteração — a página diz isso na cara,
  porque a conclusão contrária seria grave.

## Consulta de tipificação (`tipificacao.html`)

Tabela pesquisável por nome do fato, artigo ou pela palavra que a pessoa
usou ao contar. Alimentada por **`js/tipificacao/dados.js`**, um array de
objetos com o formato documentado no cabeçalho do arquivo — acrescentar um
fato é uma entrada nova, e nada na página precisa ser tocado.

O campo `busca` existe porque o nome jurídico raramente é a palavra que a
pessoa usa: quem chega dizendo "mexeram no meu carro" procura por
"arrombamento", não por "furto qualificado". A busca ignora acento e
pontuação, e casa também com o termo colado (`art155` acha `Art. 155`).

**A prescrição é calculada, não digitada.** A coluna sai da pena máxima em
abstrato pelo art. 109 do CP: uma expressão lê a maior faixa citada no
campo `pena` (`penaMaximaEmMeses`) e a tabela do artigo faz o resto. Assim
não há um segundo campo para manter em sincronia e envelhecer separado do
primeiro. O campo `prescricao` só se escreve quando a fórmula não vale —
crime imprescritível, prazo em lei própria (art. 30 da Lei de Drogas), ou
pena que remete a outro tipo. O que o cálculo **não** considera está dito
na página: causas de aumento e de diminuição, e o art. 115.

**Esta tabela é digitada à mão e envelhece a cada lei nova.** É um atalho
para lembrar onde procurar, nunca a fonte.
