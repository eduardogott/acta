// Perguntas de atendimento: a escolha do fato e a lista que sai dela.
// O arquivo e as classes continuam roteiro/.roteiro-*: o nome do arquivo
// é a URL, e renomeá-lo quebraria atalho salvo.

function escolher(chave) {
  marcar('#opcoes-fato input[value="' + chave + '"]');
}
function grupos() {
  return document.querySelectorAll("#saida-grupos .roteiro-grupo").length;
}
function perguntas() {
  return document.querySelectorAll("#saida-grupos li").length;
}
function acharFato(chave) {
  return window.ROTEIRO.fatos.filter(function (f) { return f.chave === chave; })[0];
}

ok("fatos na lista", window.ROTEIRO.fatos.length);
igual("um rádio por fato",
      document.querySelectorAll('#opcoes-fato input[name="fato"]').length,
      window.ROTEIRO.fatos.length);
igual("sem fato escolhido, nada na tela", vis("roteiro-saida"), false);
igual("e o aviso de vazio aparece", vis("saida-vazio"), true);
igual("copiar começa desabilitado", document.getElementById("btn-copiar").disabled, true);

// --- a lista sai completa ---------------------------------------------
var vd = acharFato("violencia_domestica");
escolher("violencia_domestica");
igual("a lista aparece", vis("roteiro-saida"), true);
igual("o aviso de vazio some", vis("saida-vazio"), false);
igual("um grupo por grupo, mais o de todo atendimento", grupos(), vd.grupos.length + 1);
igual(
  "toda pergunta chega à tela",
  perguntas(),
  vd.grupos.reduce(function (n, g) { return n + g.perguntas.length; }, 0) +
    window.ROTEIRO.comuns.perguntas.length
);
// O que vale para qualquer atendimento é o menos específico: fecha a lista.
igual("o grupo comum vem por último",
      document.querySelectorAll("#saida-grupos h3")[vd.grupos.length].textContent,
      window.ROTEIRO.comuns.titulo);
igual("copiar habilitou", document.getElementById("btn-copiar").disabled, false);
igual("a URL guarda o fato", location.search, "?fato=violencia_domestica");

// O "porquê" é metade do valor da lista: sem ele cada linha é só mais uma
// pergunta. Se ele parar de ser desenhado, ninguém percebe olhando a tela.
igual("as notas das perguntas são desenhadas",
      document.querySelectorAll("#saida-grupos .roteiro-porque").length > 0, true);

// --- a nota do fato ---------------------------------------------------
igual("fato sem nota não mostra a faixa", vis("saida-nota"), false);
escolher("desaparecimento");
igual("fato com nota mostra a faixa", vis("saida-nota"), true);
igual("e a faixa traz o texto do dados.js",
      txt("saida-nota").indexOf("24 horas") > 0, true);

// --- ponte para as orientações ----------------------------------------
// O mapa vive em js/roteiro/dados.js e o alvo em js/orientacoes/dados.js.
// Um tipo renomeado lá só apareceria no balcão.
igual("fato sem folha não oferece link", vis("link-orientacoes"), false);
escolher("violencia_domestica");
igual("fato com folha oferece o link", vis("link-orientacoes"), true);
igual("e o link aponta para a folha certa",
      document.getElementById("link-orientacoes").getAttribute("href"),
      "orientacoes.html?tipo=violencia_domestica");

var folhas = {};
window.ORIENTACOES.tipos.forEach(function (t) { folhas[t.chave] = true; });
var quebrados = [];
window.ROTEIRO.fatos.forEach(function (f) {
  if (f.orientacoes && !folhas[f.orientacoes]) quebrados.push(f.chave + " -> " + f.orientacoes);
});
igual("toda folha apontada existe", quebrados, []);

// --- integridade dos dados --------------------------------------------
// Fato sem grupo ou pergunta em branco não dá erro em lugar nenhum: só
// desenha um cartão vazio, que passa batido até alguém precisar dele.
var vistos = {};
var malformados = [];
window.ROTEIRO.fatos.forEach(function (f) {
  if (!f.chave || !f.label) malformados.push(f.chave || "(sem chave)");
  if (vistos[f.chave]) malformados.push(f.chave + ": chave repetida");
  vistos[f.chave] = true;
  if (!f.grupos || f.grupos.length === 0) malformados.push(f.chave + ": sem grupos");
  (f.grupos || []).forEach(function (g) {
    if (!g.titulo) malformados.push(f.chave + ": grupo sem título");
    if (!g.perguntas || g.perguntas.length === 0) malformados.push(f.chave + ": grupo vazio");
    (g.perguntas || []).forEach(function (p) {
      var texto = typeof p === "string" ? p : p.texto;
      if (!texto || !texto.trim()) malformados.push(f.chave + ": pergunta sem texto");
    });
  });
});
igual("nenhum fato malformado", malformados, []);

// --- limpar -----------------------------------------------------------
clicar("#btn-limpar");
igual("limpar tira a lista", vis("roteiro-saida"), false);
igual("e desabilita o copiar", document.getElementById("btn-copiar").disabled, true);
igual("e limpa a URL", location.search, "");
