/**
 * ZIP.JS
 * Escritor de ZIP mínimo, sem dependência externa, usado pelo botão
 * "Baixar tudo" do conversor.
 *
 * Usa exclusivamente o método STORE (0 = sem compressão): os arquivos que
 * entram aqui são MP3/MP4/JPG, ou seja, já comprimidos — deflate gastaria
 * CPU e memória para ganhar ~0%.
 *
 * Sem suporte a ZIP64: arquivos individuais e o arquivo final ficam
 * limitados a 4 GiB, o que é verificado e reportado como erro.
 */

(function (global) {
  "use strict";

  const LIMITE_ZIP32 = 0xffffffff;

  const TABELA_CRC = (function () {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      c = TABELA_CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  /** Data/hora no formato MS-DOS que o cabeçalho ZIP espera. */
  function dataDOS(d) {
    const hora = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xffff;
    const data = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xffff;
    return { hora, data };
  }

  function escritor(tamanho) {
    const buf = new ArrayBuffer(tamanho);
    const dv = new DataView(buf);
    let pos = 0;
    return {
      u16(v) { dv.setUint16(pos, v, true); pos += 2; },
      u32(v) { dv.setUint32(pos, v >>> 0, true); pos += 4; },
      bytes(b) { new Uint8Array(buf, pos, b.length).set(b); pos += b.length; },
      finalizar() { return new Uint8Array(buf, 0, pos); },
    };
  }

  /** Garante nomes únicos dentro do zip: "a.mp3", "a (2).mp3", … */
  function nomeUnico(nome, usados) {
    if (!usados.has(nome)) {
      usados.add(nome);
      return nome;
    }
    const ponto = nome.lastIndexOf(".");
    const base = ponto === -1 ? nome : nome.slice(0, ponto);
    const ext = ponto === -1 ? "" : nome.slice(ponto);
    let i = 2;
    let candidato;
    do {
      candidato = `${base} (${i})${ext}`;
      i++;
    } while (usados.has(candidato));
    usados.add(candidato);
    return candidato;
  }

  /**
   * Monta um Blob .zip a partir de [{ nome, blob }].
   *
   * Lê um arquivo por vez para calcular o CRC e descarta o ArrayBuffer em
   * seguida — o Blob final referencia os Blobs originais, então o pico de
   * memória é o do maior arquivo, não o do zip inteiro.
   *
   * @param {Array<{nome: string, blob: Blob}>} entradas
   * @param {(feito: number, total: number, nome: string) => void} [onProgresso]
   * @returns {Promise<Blob>}
   */
  async function criarZip(entradas, onProgresso) {
    const codificador = new TextEncoder();
    const { hora, data } = dataDOS(new Date());
    const usados = new Set();

    const partes = [];   // pedaços do Blob final, na ordem
    const central = [];  // registros do diretório central
    let offset = 0;

    for (let i = 0; i < entradas.length; i++) {
      const entrada = entradas[i];
      const nome = nomeUnico(entrada.nome, usados);
      const nomeBytes = codificador.encode(nome);
      const conteudo = new Uint8Array(await entrada.blob.arrayBuffer());
      const crc = crc32(conteudo);
      const tamanho = conteudo.length;

      if (tamanho > LIMITE_ZIP32) {
        throw new Error(`"${nome}" passa de 4 GiB e não cabe num zip comum.`);
      }

      const cabecalho = escritor(30 + nomeBytes.length);
      cabecalho.u32(0x04034b50);      // assinatura do cabeçalho local
      cabecalho.u16(20);              // versão necessária
      cabecalho.u16(0x0800);          // flag: nome em UTF-8
      cabecalho.u16(0);               // método: store
      cabecalho.u16(hora);
      cabecalho.u16(data);
      cabecalho.u32(crc);
      cabecalho.u32(tamanho);         // tamanho comprimido
      cabecalho.u32(tamanho);         // tamanho original
      cabecalho.u16(nomeBytes.length);
      cabecalho.u16(0);               // sem campo extra
      cabecalho.bytes(nomeBytes);

      partes.push(cabecalho.finalizar());
      partes.push(entrada.blob);
      central.push({ nome: nomeBytes, crc, tamanho, offset });

      offset += 30 + nomeBytes.length + tamanho;
      if (offset > LIMITE_ZIP32) {
        throw new Error("O zip passaria de 4 GiB. Baixe os arquivos em partes.");
      }

      if (onProgresso) onProgresso(i + 1, entradas.length, nome);
      // devolve o controle ao navegador entre arquivos para a UI não travar
      await new Promise((r) => setTimeout(r, 0));
    }

    const inicioCentral = offset;
    for (const reg of central) {
      const cd = escritor(46 + reg.nome.length);
      cd.u32(0x02014b50);       // assinatura do diretório central
      cd.u16(20);               // versão de origem
      cd.u16(20);               // versão necessária
      cd.u16(0x0800);           // flag: nome em UTF-8
      cd.u16(0);                // método: store
      cd.u16(hora);
      cd.u16(data);
      cd.u32(reg.crc);
      cd.u32(reg.tamanho);
      cd.u32(reg.tamanho);
      cd.u16(reg.nome.length);
      cd.u16(0);                // extra
      cd.u16(0);                // comentário
      cd.u16(0);                // disco
      cd.u16(0);                // atributos internos
      cd.u32(0);                // atributos externos
      cd.u32(reg.offset);
      cd.bytes(reg.nome);
      const bytes = cd.finalizar();
      partes.push(bytes);
      offset += bytes.length;
    }

    const fim = escritor(22);
    fim.u32(0x06054b50);              // assinatura do fim do diretório central
    fim.u16(0);                       // disco atual
    fim.u16(0);                       // disco do diretório central
    fim.u16(central.length);          // registros neste disco
    fim.u16(central.length);          // registros no total
    fim.u32(offset - inicioCentral);  // tamanho do diretório central
    fim.u32(inicioCentral);           // offset do diretório central
    fim.u16(0);                       // sem comentário
    partes.push(fim.finalizar());

    return new Blob(partes, { type: "application/zip" });
  }

  global.ActaZip = { criarZip };
})(window);
