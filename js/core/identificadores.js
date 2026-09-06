/**
 * IDENTIFICADORES.JS
 * ---------------------------------------------------------------------------
 * Aritmética de dígito verificador dos identificadores que aparecem numa
 * ocorrência. Fica separado de validadores.js porque tem dois consumidores
 * com contratos diferentes: o questionário (que quer uma mensagem de erro
 * para mostrar embaixo do campo) e o conferidor (que quer o veredito de
 * todos os tipos ao mesmo tempo, para dizer o que o número pode ser).
 *
 * Contrato: toda função recebe o valor cru como o usuário digitou e
 * devolve `{ ok: boolean, motivo: string }`. `motivo` explica a recusa
 * quando ok é false; quando ok é true, descreve o que foi reconhecido.
 * Nenhuma delas normaliza para o texto final — isso é de
 * texto-helpers.js.
 *
 * O que NÃO está aqui, de propósito: RENAVAM e CNH. Circulam duas versões
 * conflitantes do algoritmo de cada um, e um "inválido" errado num
 * documento verdadeiro é pior que não ter a conferência.
 * ---------------------------------------------------------------------------
 */

const Identificadores = (() => {
  function soDigitos(valor) {
    return String(valor || "").replace(/\D/g, "");
  }

  function alfanumerico(valor) {
    return String(valor || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  }

  function todosIguais(texto) {
    return /^(.)\1*$/.test(texto);
  }

  /** Dígito verificador módulo 11 no formato usado por CPF e CNPJ. */
  function dvModulo11(soma) {
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  }

  // ------------------------------------------------------------------ CPF ---
  function cpf(valor) {
    const d = soDigitos(valor);
    if (d.length !== 11) return { ok: false, motivo: "O CPF tem 11 algarismos." };
    if (todosIguais(d)) return { ok: false, motivo: "Todos os algarismos são iguais." };

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += Number(d[i]) * (10 - i);
    if (dvModulo11(soma) !== Number(d[9])) {
      return { ok: false, motivo: "Primeiro dígito verificador incorreto." };
    }

    soma = 0;
    for (let i = 0; i < 10; i++) soma += Number(d[i]) * (11 - i);
    if (dvModulo11(soma) !== Number(d[10])) {
      return { ok: false, motivo: "Segundo dígito verificador incorreto." };
    }
    return { ok: true, motivo: "Dígitos verificadores conferem." };
  }

  // ----------------------------------------------------------------- CNPJ ---
  // Aceita o CNPJ alfanumérico: as doze primeiras posições podem ser letra
  // ou algarismo, e o valor de cada caractere é o código ASCII menos 48
  // (assim "0"–"9" valem 0–9 e "A"–"Z" valem 17–42). Os dois dígitos
  // verificadores continuam sendo algarismos.
  const PESOS_CNPJ_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const PESOS_CNPJ_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  function cnpj(valor) {
    const v = alfanumerico(valor);
    if (v.length !== 14) return { ok: false, motivo: "O CNPJ tem 14 caracteres." };
    if (!/^[0-9A-Z]{12}\d{2}$/.test(v)) {
      return { ok: false, motivo: "Os dois últimos caracteres têm de ser algarismos." };
    }
    if (todosIguais(v)) return { ok: false, motivo: "Todos os caracteres são iguais." };

    const valorDe = (c) => c.charCodeAt(0) - 48;

    let soma = 0;
    for (let i = 0; i < 12; i++) soma += valorDe(v[i]) * PESOS_CNPJ_1[i];
    if (dvModulo11(soma) !== Number(v[12])) {
      return { ok: false, motivo: "Primeiro dígito verificador incorreto." };
    }

    soma = 0;
    for (let i = 0; i < 13; i++) soma += valorDe(v[i]) * PESOS_CNPJ_2[i];
    if (dvModulo11(soma) !== Number(v[13])) {
      return { ok: false, motivo: "Segundo dígito verificador incorreto." };
    }
    const tipo = /^\d{14}$/.test(v) ? "numérico" : "alfanumérico";
    return { ok: true, motivo: "Dígitos verificadores conferem (formato " + tipo + ")." };
  }

  // ----------------------------------------------------------------- IMEI ---
  // 15 algarismos, com o último calculado por Luhn sobre os 14 primeiros —
  // o mesmo algoritmo dos cartões de crédito.
  function imei(valor) {
    const d = soDigitos(valor);
    if (d.length !== 15) return { ok: false, motivo: "O IMEI tem 15 algarismos." };

    let soma = 0;
    let dobrar = true;
    for (let i = 13; i >= 0; i--) {
      let n = Number(d[i]);
      if (dobrar) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      soma += n;
      dobrar = !dobrar;
    }
    const dv = (10 - (soma % 10)) % 10;
    if (dv !== Number(d[14])) {
      return { ok: false, motivo: "Dígito verificador de Luhn incorreto." };
    }
    // Os oito primeiros algarismos são o TAC, que identifica o modelo do
    // aparelho — não dá para conferir offline, mas vale dizer onde estão.
    return { ok: true, motivo: "Luhn confere. TAC (modelo): " + d.slice(0, 8) + "." };
  }

  // -------------------------------------------------------------- CHASSI ---
  // O dígito verificador do VIN fica na 9ª posição. ATENÇÃO: ele é
  // obrigatório na América do Norte e OPCIONAL no resto do mundo — muito
  // carro fabricado no Brasil, na Europa e no Japão traz ali um algarismo
  // qualquer. Por isso o veredito de um dígito que não fecha é "não
  // confere", nunca "chassi falso": quem decide isso é a perícia.
  const VIN_VALORES = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
    J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
    S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  };
  const VIN_PESOS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

  function chassi(valor) {
    const v = alfanumerico(valor);
    if (v.length !== 17) return { ok: false, motivo: "O chassi (VIN) tem 17 caracteres." };
    // I, O e Q ficam de fora do alfabeto do VIN justamente para não serem
    // confundidos com 1 e 0.
    if (/[IOQ]/.test(v)) return { ok: false, motivo: "O VIN não usa as letras I, O e Q." };

    let soma = 0;
    for (let i = 0; i < 17; i++) {
      const c = v[i];
      const n = /\d/.test(c) ? Number(c) : VIN_VALORES[c];
      if (n === undefined) return { ok: false, motivo: "Caractere inválido: " + c + "." };
      soma += n * VIN_PESOS[i];
    }
    const resto = soma % 11;
    const esperado = resto === 10 ? "X" : String(resto);
    if (esperado !== v[8]) {
      return {
        ok: false,
        motivo: "Dígito verificador não confere (esperado " + esperado + ", veio " + v[8] +
                "). Fora da América do Norte esse dígito é opcional, então isso sozinho " +
                "não indica adulteração.",
      };
    }
    return { ok: true, motivo: "Dígito verificador confere. Ano-modelo na 10ª posição: " + v[9] + "." };
  }

  // ---------------------------------------------------------------- PLACA ---
  // Placa não tem dígito verificador: dá para conferir só o formato.
  function placa(valor) {
    const v = alfanumerico(valor);
    if (/^[A-Z]{3}\d{4}$/.test(v)) return { ok: true, motivo: "Formato antigo (AAA9999)." };
    if (/^[A-Z]{3}\d[A-Z]\d{2}$/.test(v)) return { ok: true, motivo: "Formato Mercosul (AAA9A99)." };
    return { ok: false, motivo: "Não é AAA9999 (antiga) nem AAA9A99 (Mercosul)." };
  }

  // ------------------------------------------------- TÍTULO DE ELEITOR ---
  // 12 algarismos: 8 de sequência, 2 de código da UF (01 a 28) e 2
  // verificadores. Em São Paulo (01) e Minas Gerais (02) o resto zero
  // produz dígito 1 em vez de 0 — herança do tempo em que esses dois
  // estados tinham numeração própria.
  function tituloEleitor(valor) {
    const d = soDigitos(valor);
    if (d.length !== 12) return { ok: false, motivo: "O título tem 12 algarismos." };

    const uf = Number(d.slice(8, 10));
    if (uf < 1 || uf > 28) {
      return { ok: false, motivo: "Código de UF inválido (" + d.slice(8, 10) + "); vai de 01 a 28." };
    }
    const spOuMg = uf === 1 || uf === 2;
    const digitoDe = (resto) => (resto === 0 ? (spOuMg ? 1 : 0) : resto === 1 ? 0 : 11 - resto);

    let soma = 0;
    for (let i = 0; i < 8; i++) soma += Number(d[i]) * (i + 2);
    if (digitoDe(soma % 11) !== Number(d[10])) {
      return { ok: false, motivo: "Primeiro dígito verificador incorreto." };
    }

    soma = Number(d[8]) * 7 + Number(d[9]) * 8 + Number(d[10]) * 9;
    if (digitoDe(soma % 11) !== Number(d[11])) {
      return { ok: false, motivo: "Segundo dígito verificador incorreto." };
    }
    return { ok: true, motivo: "Dígitos conferem. UF de inscrição: " + nomeDaUf(uf) + "." };
  }

  const UFS_TITULO = [
    "SP", "MG", "RJ", "RS", "BA", "PR", "CE", "PE", "SC", "GO", "MA", "PB",
    "PA", "ES", "PI", "RN", "AL", "MT", "MS", "DF", "SE", "AM", "RO", "AC",
    "AP", "RR", "TO", "Exterior",
  ];
  function nomeDaUf(codigo) {
    return UFS_TITULO[codigo - 1] || "código " + codigo;
  }

  // ------------------------------------------------------------ PIS/PASEP ---
  const PESOS_PIS = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  function pis(valor) {
    const d = soDigitos(valor);
    if (d.length !== 11) return { ok: false, motivo: "O PIS/PASEP tem 11 algarismos." };
    if (todosIguais(d)) return { ok: false, motivo: "Todos os algarismos são iguais." };

    let soma = 0;
    for (let i = 0; i < 10; i++) soma += Number(d[i]) * PESOS_PIS[i];
    const resto = soma % 11;
    const dv = resto < 2 ? 0 : 11 - resto;
    if (dv !== Number(d[10])) return { ok: false, motivo: "Dígito verificador incorreto." };
    return { ok: true, motivo: "Dígito verificador confere." };
  }

  // ------------------------------------------------ CHAVE PIX ALEATÓRIA ---
  // Só formato — uma chave aleatória é um UUID versão 4. Serve para
  // separar "isso é uma chave aleatória" de "isso é um CPF mal digitado".
  function chavePixAleatoria(valor) {
    const v = String(valor || "").trim().toLowerCase();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v)) {
      return { ok: false, motivo: "Não tem o formato de UUID (8-4-4-4-12)." };
    }
    if (v[14] !== "4") {
      return { ok: false, motivo: "É um UUID, mas não da versão 4 — chave Pix aleatória é v4." };
    }
    return { ok: true, motivo: "UUID versão 4 bem formado." };
  }

  // Ordem em que o conferidor mostra os tipos. `dica` é o que aparece na
  // tela quando o valor não se parece nem um pouco com aquele tipo.
  const TIPOS = [
    { chave: "cpf", rotulo: "CPF", verificar: cpf, exemplo: "529.982.247-25" },
    { chave: "cnpj", rotulo: "CNPJ", verificar: cnpj, exemplo: "11.222.333/0001-81" },
    { chave: "imei", rotulo: "IMEI", verificar: imei, exemplo: "490154203237518" },
    // Exemplo norte-americano de propósito: é onde o dígito verificador é
    // obrigatório. Um VIN brasileiro típico (9BWZZZ377VT004251, por
    // exemplo) não fecha, e não é por isso que está adulterado.
    { chave: "chassi", rotulo: "Chassi (VIN)", verificar: chassi, exemplo: "1M8GDM9AXKP042788" },
    { chave: "placa", rotulo: "Placa", verificar: placa, exemplo: "ABC1D23" },
    { chave: "titulo", rotulo: "Título de eleitor", verificar: tituloEleitor, exemplo: "104725420449" },
    { chave: "pis", rotulo: "PIS/PASEP", verificar: pis, exemplo: "120.9876.543-2" },
    { chave: "pix", rotulo: "Chave Pix aleatória", verificar: chavePixAleatoria,
      exemplo: "123e4567-e89b-42d3-a456-426614174000" },
  ];

  return {
    cpf,
    cnpj,
    imei,
    chassi,
    placa,
    tituloEleitor,
    pis,
    chavePixAleatoria,
    TIPOS,
  };
})();

window.Identificadores = Identificadores;
