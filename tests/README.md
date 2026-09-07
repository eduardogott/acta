# Testes

Não há framework nem dependência para instalar: um servidor em Python da
biblioteca padrão, um navegador Chromium que você já tem, e um script.

```powershell
powershell -ExecutionPolicy Bypass -File tests\rodar.ps1
```

```
conferidor     PASSOU  (18 verificacoes)
conversao      PASSOU  (37 verificacoes)
conversas      PASSOU  (27 verificacoes)
conversor      PASSOU  (25 verificacoes)
index          PASSOU  (30 verificacoes)
orientacoes    PASSOU  (25 verificacoes)
texto          PASSOU  (20 verificacoes)
tipificacao    PASSOU  (29 verificacoes)
transcricao    PASSOU  (17 verificacoes)
```

Duas páginas têm dois casos cada, porque são duas perguntas diferentes:
`index`/`texto` (o formulário responde? o parágrafo sai certo?) e
`conversor`/`conversao` (a tela reage? o ffmpeg converte de verdade?).

Opções úteis:

```powershell
tests\rodar.ps1 -PularLentos          # sem transcricao nem conversao (dezenas de MB na 1ª vez)
tests\rodar.ps1 -Casos index,conversas
```

## Como funciona

Cada caso é injetado **dentro da página real do site**, não numa cópia
simplificada — mesmo HTML, mesmo CSS, mesmos scripts que o usuário
carrega. É o que faz um `style.css` quebrado aparecer aqui.

- **`servidor.py`** serve o site com `Cross-Origin-Opener-Policy` e
  `Cross-Origin-Embedder-Policy`, como o Cloudflare Pages faz. Sem isso o
  teste não reproduz as restrições de origem cruzada, que é onde este
  projeto já tropeçou duas vezes. Serve também um `POST /relato`, por onde
  as páginas reportam.
- **`gerar.py`** monta `tests/build/*.html` juntando cada página com o
  caso correspondente e um `<base href="/">`, que faz todos os caminhos
  relativos (inclusive o `new Worker(...)` lá dentro do JS) continuarem
  válidos dois níveis abaixo.
- **`rodar.ps1`** sobe o servidor, abre cada página no Edge sem janela e
  espera o relato. Devolve código de saída 1 se algo falhar.

O perfil do navegador é reaproveitado entre execuções, em
`%TEMP%\acta-testes-perfil`. É de propósito: é lá que ficam os caches do
modelo do Whisper e do runtime do onnxruntime. Apagar essa pasta faz a
primeira execução seguinte baixar tudo de novo.

## Escrevendo um caso

Um arquivo em `tests/casos/<pagina>.js`, com o corpo das verificações. O
arranjo oferece:

| função | o que faz |
| --- | --- |
| `igual(rótulo, valor, esperado)` | verifica; conta falha se diferente |
| `ok(rótulo, valor)` | só registra, sem verificar |
| `txt(id)` / `vis(id)` | texto e visibilidade de um elemento |
| `clicar(seletor)` | clique |
| `digitar(id, valor)` | escreve e dispara `input` |
| `marcar(seletor, bool)` | marca/desmarca e dispara `change` |
| `arq(nome, bytes, tipo)` / `selecionar(idInput, [arq])` | arquivos falsos num `<input type=file>` |
| `manterVivo()` + `pronto()` | para casos assíncronos |

Um caso novo precisa também de uma linha em `PAGINAS`, dentro de
`gerar.py`. Uma página pode ter mais de um caso: a chave é o nome do
arquivo em `casos/`, o valor é a página que ele exercita.

### O caso do texto gerado

`casos/texto.js` é o mais importante da suíte, e o único que não toca no
DOM: `Generator.gerar()` lê o Estado direto, então um cenário é um objeto
de respostas e o parágrafo esperado.

```js
cenario("perda/documento veicular", {
  tipo_ocorrencia: "perda",
  perda_o_que: "documento_veicular",
  perda_doc_veic_placa: "abc-1234",
  motivo_registro: "preservar_direitos",
  deseja_representar: "incondicionada",
  outra_orientacao_houve: "nao",
}, [
  "Comunica a perda do Certificado do Registro do Veículo (CRV/DUT)",
  "do veículo de placas ABC1234, abaixo qualificado.",
  "Registra para preservar seus direitos.",
  "Nada mais.",
]);
```

O array de frases é só para caber na largura da tela — o que se compara é
a string inteira, junta por espaço. A visibilidade continua valendo, então
resposta de pergunta escondida não entra no texto (há um cenário só para
garantir isso).

**Ao acrescentar um tipo em `js/gerador/tipos/`, acrescente um cenário
aqui.** É barato, e é a única coisa que impede um template quebrado de
virar frase errada dentro de um boletim — essa falha não dá erro nenhum,
dá uma frase que parece certa.

## Limites

- Só roda no Windows com Chromium (é o ambiente onde o site é usado).
- Não verifica aparência: layout quebrado passa. Para isso, o caminho é
  uma captura de tela — `--screenshot` no mesmo navegador resolve.
- O caso da transcrição depende da internet (jsDelivr e Hugging Face).
  Sem rede, ele falha; use `-PularLentos`.
