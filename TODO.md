# TODO

## NEW

Novos tipos de ocorrência (`js/tipos/*.js`) — candidatos fortes a
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
