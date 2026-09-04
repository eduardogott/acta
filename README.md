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
- **`js/zip.js`** — escritor de ZIP mínimo (método STORE, sem ZIP64) usado
  pelo botão "Baixar tudo". Não usa biblioteca externa: os arquivos de
  saída já são comprimidos, então deflate não traria ganho.
- **`js/vendor/ffmpeg/`** — build UMD do `@ffmpeg/ffmpeg` (`ffmpeg.js` +
  `814.ffmpeg.js`) e, em `core-mt/`, o core multi-thread
  `@ffmpeg/core-mt` (`ffmpeg-core.js`, `.wasm`, `.worker.js`). Vendorizado
  no repo (não vem de CDN) para funcionar mesmo em rede restrita — ver
  "Atualizando o ffmpeg.wasm" abaixo.
- O `.wasm` do motor é guardado no Cache API sob a chave
  `acta-ffmpeg-v1`, então só é baixado na primeira visita. Ao trocar a
  versão do ffmpeg, mude também esse nome de cache para invalidar o antigo.
- **`_headers`** — habilita `Cross-Origin-Opener-Policy`/
  `Cross-Origin-Embedder-Policy` (`same-origin`/`require-corp`) **apenas**
  na rota `/conversor.html`, necessário para o core multi-thread
  (`SharedArrayBuffer`). Não afeta `index.html`.

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

Os arquivos em `js/vendor/ffmpeg/` vieram de:

```
npm pack @ffmpeg/ffmpeg@0.12.15
npm pack @ffmpeg/core-mt@0.12.10
```

Para atualizar, repita o `npm pack` das versões desejadas e substitua:

- de `@ffmpeg/ffmpeg`: `dist/umd/ffmpeg.js` e `dist/umd/814.ffmpeg.js`
  (o nome do segundo arquivo pode mudar de versão para versão — copie o
  que estiver em `dist/umd/` além de `ffmpeg.js`).
- de `@ffmpeg/core-mt`: os três arquivos de `dist/umd/` (`ffmpeg-core.js`,
  `ffmpeg-core.wasm`, `ffmpeg-core.worker.js`).

`ffmpeg-core.wasm` (~31 MB) excede o limite de 25 MiB por arquivo do
Cloudflare Pages, então ele **não** entra inteiro no repo — é dividido em
partes (`ffmpeg-core.wasm.part0`, `.part1`, `.part2`, ...) que
`js/conversor.js` baixa e remonta em um Blob no navegador antes de
carregar o motor (ver `WASM_PARTS`/`montarWasmBlobURL` nesse arquivo).
Depois de substituir o `.wasm`, divida-o de novo (partes bem abaixo de
25 MiB cada, ex.: 16 MB) e **atualize `WASM_PARTS`** com o nome e o
tamanho em bytes de cada parte. O tamanho fica declarado ali porque o
Cloudflare serve esses arquivos sem `Content-Length`, e sem ele a barra
de progresso do download do motor perde o denominador; o código avisa no
console se um tamanho declarado divergir do que o servidor mandar. Para
dividir e conferir os tamanhos:

```
split -b 16000000 -d -a 1 ffmpeg-core.wasm ffmpeg-core.wasm.part
# e então, para os números que vão em WASM_PARTS:
#   stat -c'%s %n' ffmpeg-core.wasm.part*
```
