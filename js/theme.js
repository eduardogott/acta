/**
 * THEME.JS
 * Alterna entre tema claro/escuro usando o atributo data-theme na <html>,
 * o mesmo mecanismo já usado pelos tokens compartilhados (:root[data-theme="dark"]).
 * Persiste a escolha em localStorage; na ausência de escolha, respeita o
 * prefers-color-scheme do sistema.
 */
(function () {
  const CHAVE = "ocorrencias-tema";
  const raiz = document.documentElement;

  function temaSalvo() {
    try {
      return localStorage.getItem(CHAVE);
    } catch (e) {
      return null; // localStorage bloqueado (modo privado, iframe, etc.) — segue sem persistir
    }
  }

  function temaPreferidoDoSistema() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function aplicarTema(tema) {
    if (tema === "dark") raiz.setAttribute("data-theme", "dark");
    else raiz.removeAttribute("data-theme");
    const btn = document.getElementById("theme-toggle");
    if (btn) btn.textContent = tema === "dark" ? "☀" : "☾";
  }

  aplicarTema(temaSalvo() || temaPreferidoDoSistema());

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const atual = raiz.getAttribute("data-theme") === "dark" ? "dark" : "light";
      const novo = atual === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(CHAVE, novo);
      } catch (e) {
        // segue sem persistir
      }
      aplicarTema(novo);
    });
  });
})();
