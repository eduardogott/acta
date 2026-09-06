/**
 * FORMATOS.JS
 * ---------------------------------------------------------------------------
 * Formatação de tamanho e de tempo, usada pelo conversor e pela
 * transcrição. Estava duplicada nos dois — cópias idênticas, que
 * divergiriam no primeiro ajuste feito só de um lado.
 *
 * Fica em window.Formatos porque as páginas carregam scripts clássicos,
 * sem módulos; quem usa faz `const { humanSize } = window.Formatos;` no
 * topo do próprio IIFE.
 * ---------------------------------------------------------------------------
 */
window.Formatos = (() => {
  /** Bytes em unidade legível. Base 1024, como o resto do site. */
  function humanSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    const unidades = ["KB", "MB", "GB"];
    let i = -1;
    do {
      bytes /= 1024;
      i++;
    } while (bytes >= 1024 && i < unidades.length - 1);
    return bytes.toFixed(1) + " " + unidades[i];
  }

  /** Segundos → "m:ss" ou "h:mm:ss". */
  function formatarTempo(segundos) {
    const total = Math.max(0, Math.round(segundos));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const dois = (n) => (n < 10 ? "0" + n : String(n));
    return h > 0 ? h + ":" + dois(m) + ":" + dois(s) : m + ":" + dois(s);
  }

  /**
   * Lê "90", "1:30" ou "1:02:03" e devolve segundos. null = não entendi.
   * Aceita vírgula ou ponto nos décimos, porque teclado brasileiro.
   */
  function parseTempo(texto) {
    const limpo = String(texto || "").trim().replace(",", ".");
    if (!limpo) return null;
    if (!/^\d+(\.\d+)?(:\d{1,2}(\.\d+)?){0,2}$/.test(limpo)) return null;
    const partes = limpo.split(":").map(parseFloat);
    if (partes.some((n) => !Number.isFinite(n) || n < 0)) return null;
    // os campos à direita dos minutos não podem passar de 59
    if (partes.length > 1 && partes.slice(1).some((n) => n >= 60)) return null;
    return partes.reduce((total, n) => total * 60 + n, 0);
  }

  return { humanSize, formatarTempo, parseTempo };
})();
