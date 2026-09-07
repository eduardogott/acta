// Transcrição de conversas: os formatos de exportação e a saída.

var NL = String.fromCharCode(10);

// Formato "Android / exportação por e-mail".
var android = [
  "06/09/2026 14:32 - As mensagens são protegidas com a criptografia de ponta a ponta.",
  "06/09/2026 14:33 - Maria Silva: oi, tudo bem?",
  "06/09/2026 14:33 - Maria Silva: preciso falar contigo",
  "06/09/2026 14:35 - +55 51 99999-1234: quem é?",
  "06/09/2026 14:36 - Maria Silva: sou eu, mudei de numero",
  "07/09/2026 09:01 - Maria Silva: <Mídia oculta>",
  "07/09/2026 09:02 - Maria Silva: manda o pix pra essa chave",
  "que eu resolvo",
].join(NL);

digitar("entrada", android);
igual("reconheceu as mensagens", txt("resumo").indexOf("6 mensagens") === 0, true);
igual("achou os dois participantes", document.querySelectorAll("#autores .autor-linha").length, 2);
igual("painel de saída apareceu", vis("painel-saida"), true);
igual("passos renumeram com participantes", txt("rotulo-formato"), "3. Formato");

var saida = document.getElementById("saida").value;
igual("cabeçalho saiu", saida.indexOf("TRANSCRIÇÃO DE CONVERSA") === 0, true);
igual("período no cabeçalho", saida.indexOf("06/09/2026 14:33 a 07/09/2026 09:02") > 0, true);
igual("separador de dia", saida.indexOf("— 07/09/2026 —") > 0, true);
igual("anexo assinalado", saida.indexOf("[ANEXO") > 0, true);
igual("mensagem de várias linhas ficou junta", saida.indexOf("manda o pix pra essa chave que eu resolvo") > 0, true);

// Renomear participantes.
var campos = document.querySelectorAll("#autores input");
campos[0].value = "COMUNICANTE";
campos[0].dispatchEvent(new Event("input", { bubbles: true }));
campos[1].value = "AUTOR";
campos[1].dispatchEvent(new Event("input", { bubbles: true }));
saida = document.getElementById("saida").value;
igual("nome substituído", saida.indexOf("COMUNICANTE:") > 0, true);
igual("nome antigo sumiu do corpo", saida.indexOf("Maria Silva:") < 0, true);
igual("segundo participante renomeado", saida.indexOf("AUTOR:") > 0, true);

// Opções de formato.
marcar("#op-numerar", false);
igual("sem numeração", document.getElementById("saida").value.indexOf("1. [") < 0, true);
marcar("#op-numerar", true);
marcar("#op-cabecalho", false);
igual("sem cabeçalho", document.getElementById("saida").value.indexOf("TRANSCRIÇÃO DE CONVERSA") < 0, true);
marcar("#op-cabecalho", true);
marcar("#op-sistema", true);
igual("avisos do aplicativo ocultos", document.getElementById("saida").value.indexOf("(sistema)") < 0, true);
marcar("#op-sistema", false);

// Formato "[dd/mm/aaaa hh:mm:ss] Fulano: texto".
var iphone = [
  "[06/09/2026 14:33:10] João: bom dia",
  "[06/09/2026 14:34:02] Pedro: bom dia, doutor",
].join(NL);
digitar("entrada", iphone);
igual("formato com colchetes reconhecido", txt("resumo").indexOf("2 mensagens") === 0, true);
igual("dois participantes", document.querySelectorAll("#autores .autor-linha").length, 2);

// Texto que não é exportação nenhuma.
digitar("entrada", "isto aqui não é uma conversa exportada, é só um parágrafo solto");
igual("texto solto é recusado com explicação", txt("resumo").indexOf("Não reconheci") === 0, true);
igual("saída some quando nada é reconhecido", vis("painel-saida"), false);

clicar("#btn-limpar");
igual("limpar zera o resumo", txt("resumo"), "");
igual("passos voltam a numerar sem participantes", txt("rotulo-formato"), "2. Formato");
