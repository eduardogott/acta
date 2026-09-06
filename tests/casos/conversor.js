// Conversor: operações, fila e nível de tamanho-alvo.

igual("operações oferecidas", document.querySelectorAll(".opcao-conversor").length, 9);
igual("iniciar começa desabilitado", document.getElementById("btn-iniciar").disabled, true);

// --- conversão simples -------------------------------------------------
clicar('[data-op="3"]');
selecionar("input-arquivos", [arq("foto.png", 100, "image/png")]);
igual("imagem habilita o iniciar", document.getElementById("btn-iniciar").disabled, false);

// --- fila (opção 9) ----------------------------------------------------
clicar('[data-op="9"]');
selecionar("input-arquivos", [arq("a.mp4", 1000, "video/mp4"), arq("b.mp4", 2000, "video/mp4")]);
igual("dois vídeos viram fila", txt("tipo-detectado"), "2 vídeos na fila");
igual("corte some com mais de um arquivo", vis("corte"), false);
igual("fila habilita o iniciar", document.getElementById("btn-iniciar").disabled, false);

selecionar("input-arquivos", [arq("a.mp4", 1000, "video/mp4"), arq("b.mp3", 500, "audio/mpeg")]);
igual("mistura de tipos bloqueia", document.getElementById("btn-iniciar").disabled, true);

selecionar("input-arquivos", [arq("a.mp4", 1000, "video/mp4"), arq("leia.txt", 10, "text/plain")]);
igual("arquivo fora da lista é apontado", txt("tipo-detectado").indexOf("não são vídeo nem áudio") > 0, true);

selecionar("input-arquivos", [arq("a.mp4", 1000, "video/mp4")]);
igual("um arquivo devolve o corte", vis("corte"), true);
igual("um arquivo mostra o tipo", txt("tipo-detectado"), "vídeo detectado");

// --- tamanho-alvo ------------------------------------------------------
marcar('input[name="nivel"][value="6"]');
igual("campos do alvo aparecem", vis("campos-alvo"), true);
igual("alvo padrão habilita o iniciar", document.getElementById("btn-iniciar").disabled, false);
digitar("alvo-mb", "");
igual("alvo vazio bloqueia", document.getElementById("btn-iniciar").disabled, true);
digitar("alvo-mb", "25");
igual("alvo preenchido libera", document.getElementById("btn-iniciar").disabled, false);

// --- extrações ---------------------------------------------------------
clicar('[data-op="7"]');
igual("painel do quadro aparece", vis("painel-quadro"), true);
selecionar("input-arquivos", [arq("v.mp4", 100, "video/mp4")]);
digitar("quadro-instante", "xx:yy");
igual("instante ilegível bloqueia", document.getElementById("btn-iniciar").disabled, true);
digitar("quadro-instante", "1:30");
igual("instante válido libera", document.getElementById("btn-iniciar").disabled, false);

clicar('[data-op="6"]');
igual("extrair áudio pede vídeo", txt("rotulo-arquivos"), "2. Selecione o(s) vídeo(s) ou a pasta");

clicar("#btn-limpar");
igual("limpar desabilita o iniciar", document.getElementById("btn-iniciar").disabled, true);
