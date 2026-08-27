document.addEventListener("DOMContentLoaded", () => {
  Linter.executar();
  Engine.init();

  document.getElementById("btn-gerar").addEventListener("click", () => {
    const texto = Generator.gerar();
    const saida = document.getElementById("saida-texto");
    saida.value = texto;
    document.getElementById("saida-wrapper").classList.remove("escondido");
    saida.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("btn-copiar").addEventListener("click", async () => {
    const saida = document.getElementById("saida-texto");
    await navigator.clipboard.writeText(saida.value);
    const btn = document.getElementById("btn-copiar");
    const original = btn.textContent;
    btn.textContent = "Copiado!";
    setTimeout(() => (btn.textContent = original), 1500);
  });

  document.getElementById("btn-reiniciar").addEventListener("click", () => {
    if (confirm("Limpar todas as respostas e recomeçar?")) Engine.reset();
  });
});
