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
- **Andamento da compressão** sai do log do ffmpeg (`acompanharEncode`),
  não do evento `progress` do ffmpeg.wasm. O evento é calculado sobre a
  duração do arquivo de **entrada**: com `-t 15` num vídeo de cinco
  minutos ele empaca em 5% e a tela parece travada. As linhas de log
  trazem `time=` e `speed=`, que dão a fração real e uma estimativa de
  quanto falta. Publica a cada linha (no máximo 4×/s) e tem um heartbeat
  de 1 s para o tempo decorrido continuar andando quando o encoder fica
  quieto — importante nas máquinas lentas, onde o encode leva minutos.
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
