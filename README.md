# Acta

**Acta** (do latim *Acta Diurna*, os registros públicos diários de Roma) é
uma ferramenta de uso interno que transforma um questionário dinâmico em um
parágrafo de narrativa (estilo depoimento em 3ª pessoa: "Comunica que...",
"Informa que...", "Relata que...") para uso no registro de ocorrências
policiais. Roda inteiramente no navegador — HTML/CSS/JS puro, sem build
step, sem dependências, sem backend. Nenhuma resposta é enviada a
servidor algum; o texto final só existe localmente até ser copiado.

## Rodando localmente

Não há build. Basta servir os arquivos estáticos e abrir no navegador,
por exemplo:

```
npx serve .
```

ou simplesmente abrir `index.html` diretamente no navegador (algumas
funcionalidades, como `navigator.clipboard`, podem exigir `http://` em
vez de `file://` dependendo do navegador).

## Arquitetura

O fluxo é: **schema → engine → generator**.

- **`js/registry.js`** — cadastro central dos "tipos de ocorrência"
  (estelionato, perda, etc). Cada arquivo em
  `js/tipos/*.js` se registra aqui via `registrarTipoOcorrencia(...)`.
- **`js/schema.js`** — define as perguntas fixas que aparecem antes
  (`PERGUNTAS_INICIAIS`, incluindo o seletor "Qual é o fato da
  ocorrência?", montado a partir do registry) e depois
  (`PERGUNTAS_FINAIS`, ex.: motivo do registro, representação criminal)
  das perguntas do tipo escolhido. `getPerguntas(respostas)` monta a
  lista efetiva na ordem em que as frases devem sair no texto final.
- **`js/core/estado.js`** — única fonte de verdade das respostas (objeto
  de dados puro, sem DOM). Também controla quais perguntas já foram
  "tocadas" pelo usuário.
- **`js/core/visibilidade.js`** — avalia a condição `exibirSe` de uma
  pergunta de forma pura (recebe as respostas como parâmetro).
- **`js/core/renderers-registry.js`** + **`js/renderers/*.js`** — cada
  tipo de campo (`multipla`, `selecao`, `texto`, `numero`, `dinheiro`,
  `multiplo-input`) é um plugin registrado via `registrarRenderer(...)`,
  responsável por desenhar o controle e dizer se está preenchido.
- **`js/core/validadores.js`** — validadores nomeados e reutilizáveis
  (ex.: `naoVazio`, `cpfOuCnpj`, `numeroPositivo`), referenciados pelo
  nome no campo `validador` de uma pergunta.
- **`js/core/texto-helpers.js`** — funções utilitárias passadas como
  terceiro argumento (`h`) para todo `template(resposta, respostas, h)`:
  formatação de dinheiro, junção de listas em português
  (`juntarLista`/`juntarClausulas`), ordinais por extenso (`ordinal`),
  pontuação de texto livre (`garantirPonto`), etc.
- **`js/engine.js`** — orquestrador: decide o que está visível agora,
  desenha isso como DOM, valida e calcula pendências. Não sabe desenhar
  nenhum tipo de pergunta específico nem o que significa `exibirSe` —
  isso é responsabilidade dos módulos acima.
- **`js/generator.js`** — percorre as perguntas ativas na ordem do
  schema e concatena o retorno de cada `template(...)` num único
  parágrafo, fechando sempre com "Nada mais."
- **`js/core/linter.js`** — roda uma vez no carregamento da página e
  avisa (console + banner discreto na tela) sobre erros estruturais no
  schema: id duplicado, tipo de pergunta sem renderer, `exibirSe`
  apontando para um id inexistente, etc. Não bloqueia o uso da
  ferramenta — é um aviso para quem edita o questionário, não para quem
  o preenche.
- **`js/main.js`** — liga os botões da página. O "Copiar texto" tem três
  degraus: `navigator.clipboard.writeText`, o `document.execCommand("copy")`
  legado (que funciona em `file://` e em navegador antigo) e, se nem
  isso, deixar o texto selecionado e pedir Ctrl+C. Existem porque a API
  moderna rejeita em situações comuns aqui — página aberta como
  `file://`, permissão negada, foco fora do documento — e antes a
  promessa rejeitava em silêncio: o botão não mudava e o usuário
  concluía que tinha copiado sem ter copiado nada. O resultado, qualquer
  que seja, aparece no próprio botão.

## Adicionando um tipo de ocorrência novo

1. Crie `js/tipos/nome_do_tipo.js`.
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
3. Inclua o arquivo em `index.html`, antes de `js/schema.js`:

   ```html
   <script src="js/tipos/nome_do_tipo.js"></script>
   ```

Nenhum outro arquivo precisa ser editado — a lista de tipos na primeira
pergunta é montada automaticamente a partir do registry.

## Adicionando um tipo de pergunta (renderer) novo

Crie `js/renderers/nome.js` chamando `registrarRenderer(...)`. Veja o
cabeçalho de comentários em `js/core/renderers-registry.js` para o
contrato completo (`valorPadrao`, `estaPreenchida`, `criar`,
`revalidaVisibilidade`, `estaTudoValido`).

## Estado atual

Não há testes automatizados nem CI configurados. As funções de
`template(...)` concentram a lógica de concordância/pluralização do
português e merecem atenção redobrada ao editar — uma mudança de
fraseado num tipo já usado em produção pode alterar retroativamente o
texto de casos que ainda não foram gerados.

## Carimbo de versão

O rodapé das duas páginas mostra os últimos sete caracteres do hash do
commit que gerou o deploy (o hash inteiro fica no `title`, que é o que
serve num `git show`). Existe para responder "qual código estava no ar
quando isso aconteceu?" — o fraseado dos textos gerados muda de versão
para versão, e um relato de "o texto saiu errado" só é investigável
sabendo qual commit o usuário tinha na tela.

- **`js/versao.js`** — arquivo commitado com o valor `"dev"`, que é o que
  aparece ao servir os arquivos localmente.
- **`js/rodape.js`** — lê `window.ACTA_VERSAO` e escreve no rodapé. Sem
  carimbo, não escreve nada: melhor um rodapé como antes do que
  "undefined" na tela.

Como não há build step, quem preenche o valor real é o **comando de build
do Cloudflare Pages** (Settings → Builds & deployments → Build command):

```
echo "window.ACTA_VERSAO = \"$CF_PAGES_COMMIT_SHA\";" > js/versao.js
```

Sem esse comando o site continua funcionando — o rodapé só mostra
"versão local (dev)".

## Conversor de mídia (`conversor.html`)

Segunda ferramenta do site, acessível pela nav-bar no topo. Converte
áudio/vídeo/imagem e comprime vídeo ou áudio, tudo processado **no
navegador** via
[ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) — nenhum arquivo
é enviado a servidor algum, igual ao gerador de ocorrências.

- **`conversor.html`** / **`css/conversor.css`** / **`js/conversor.js`** —
  markup, estilo e lógica da página. `js/conversor.js` reimplementa as
  mesmas regras do script Python homônimo (conversão sem recompressão nas
  opções 1/2/3, tabela de crf/resolução/fps/áudio por nível na opção 9,
  etc). A opção 9 aceita vídeo **ou** áudio: o tipo é detectado pela
  extensão e só os campos daquele tipo aparecem, e apenas no nível
  "Personalizada".

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

  Além das opções herdadas do script Python, existem três locais:

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
  - **10 — comprimir imagens** (`compressImageFile`): JPG de qualidade
    fixa, sem campo na tela. O mjpeg do ffmpeg não conhece a escala 0–100
    do libjpeg — o que ele aceita é o qscale, de 2 (melhor) a 31 (pior) —
    e o degrau 3 é o equivalente prático de "qualidade 90"; o 2, que a
    opção 3 já usa, fica em ~93/95. Diferente da opção 3, um `.jpg` de
    entrada **não** é ignorado (o propósito aqui é justamente encolher), e
    por isso a saída ganha o sufixo `_comprimida`.

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
- **`js/zip.js`** — escritor de ZIP mínimo (método STORE, sem ZIP64) usado
  pelo botão "Baixar tudo". Não usa biblioteca externa: os arquivos de
  saída já são comprimidos, então deflate não traria ganho.
- **`js/vendor/ffmpeg/`** — só o carregador do `@ffmpeg/ffmpeg`
  (`ffmpeg.js` + `814.ffmpeg.js`, 7,6 KB somados). **Precisa continuar
  local**: o `ffmpeg.js` deriva a URL do worker `814.ffmpeg.js` do
  `document.currentScript.src` e chama `new Worker()` com ela — e o
  construtor `Worker` recusa qualquer URL de outra origem, independente de
  CORS ou CORP. Servir esses dois de um CDN quebra com `SecurityError`.
- **Núcleo do ffmpeg — vem do jsDelivr, não do repo.** `ffmpeg-core.js`,
  `ffmpeg-core.wasm` (32 MB) e `ffmpeg-core.worker.js` são buscados de
  `cdn.jsdelivr.net/npm/@ffmpeg/core-mt@<versão>/dist/umd/` com `fetch()`
  e convertidos em `blob:` URLs antes de irem para o `ffmpeg.load()` — ver
  `ARQUIVOS_CORE`/`baixarCoreComoBlobURLs` em `js/conversor.js`.

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
  instrumentação do construtor `Worker` em `js/conversor.js`.
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

**O núcleo (jsDelivr).** Basta editar `CDN_CORE` em `js/conversor.js`
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
`js/vendor/ffmpeg/` (o nome do segundo arquivo muda de versão para
versão — copie o que estiver em `dist/umd/` além de `ffmpeg.js`).
Mantenha as versões do carregador e do núcleo compatíveis entre si.

**Contrapartida de usar CDN.** O conversor passa a depender de o
`cdn.jsdelivr.net` estar acessível — em rede restrita que bloqueie o CDN,
o motor não carrega (o console mostra a falha de `fetch`). Foi uma
troca deliberada por não carregar 32 MB no repositório e por escapar do
limite de 25 MiB por arquivo do Cloudflare Pages, que antes obrigava a
quebrar o `.wasm` em partes.
