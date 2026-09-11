# TODO

## NEW

Sobre as ferramentas novas:

* **Transcrição** — não há progresso por trecho, só o tempo decorrido: a
  biblioteca não expõe callback de chunk. Fatiar o áudio nós mesmos daria
  progresso real, ao custo de possíveis cortes de palavra nas emendas.
* **Tipificação** — a tabela cobre os fatos mais comuns de balcão. Faltam,
  entre outros: crimes ambientais além de maus-tratos, Estatuto do Idoso
  além do art. 102, crimes eleitorais, e os tipos da Lei 14.811/2024.
  O campo `texto` (o teor do artigo, copiado do Planalto) está preenchido
  em 5 das 86 entradas; onde falta, o botão "ver o texto do artigo"
  simplesmente não nasce, então a linha fica igual ao que sempre foi.
  Preencher é trabalho de copiar, não de decidir.
* **Conferidor** — RENAVAM e CNH ficaram de fora por falta de algoritmo
  confiável. Se aparecer uma referência boa, entram em
  `js/comum/identificadores.js` e ganham linha em `TIPOS`.
* **Orientações** — faltam tipos: acidente com vítima fatal, desaparecimento
  de pessoa, crimes contra criança e adolescente, maus-tratos a animais.
  Cada tipo novo pode ganhar entradas na tipificação pelo campo
  `orientacoes` (a tabela já aponta 31 fatos para uma folha).
* **Conversas** — só reconhece os dois formatos de exportação do WhatsApp.
  Telegram e Signal exportam em JSON e HTML, que pediriam outro caminho de
  leitura. Se aparecer um caso real, guardar uma amostra do arquivo.
* **Conversor** — `conversor.js` ficou com as operações e a interface
  (~2.000 linhas). Separar as operações exigiria injetar cinco funções da
  tela (`etapa`, `iniciar`, `acompanharEncode`, `argumentosDeCorte`,
  `duracaoDoTrabalho`) — mais acoplamento disfarçado, não menos. Fica
  para quando a interface encolher.
* **Roteiro** — sete fatos, todos já apontando para uma folha de
  orientações. Faltam, entre outros: perseguição (art. 147-A), crimes
  cibernéticos (invasão de dispositivo, imagem íntima divulgada sem
  consentimento), maus-tratos e crimes contra criança e adolescente,
  receptação. Cada fato tem o campo `busca` preenchido, mas nada o lê —
  não existe caixa de busca na página. Com sete fatos o seletor dá conta;
  com vinte, não dá, e aí o campo já está esperando.
* **Contatos** — a agenda ainda está com placeholders, embora bem menos:
  os ramais `tbd` acabaram, e sobraram 17 campos `PREENCHER` (horário e
  endereço) e 7 números `(00) 0000-0000`. Enquanto estiverem lá, o risco
  não é a página quebrar — é alguém copiar um número que não existe e
  discar. O campo `site` é suportado
  pela página e nenhum contato o usa: no balcão se disca, não se navega.
* **Anotações** — a estante nasceu com uma entrada de exemplo
  (`js/anotacoes/pdfs/exemplo.pdf`), que sai junto com a primeira
  anotação de verdade. Não há busca: com uma dúzia de papéis os títulos
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
  conversas, roteiro, contatos e anotações são páginas estáticas e
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

## IDEIAS

* Página com ferramenta de caixa de seleção para as peças de APF/Kit Preso, etc
