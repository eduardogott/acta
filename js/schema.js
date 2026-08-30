/**
 * SCHEMA.JS  (núcleo)
 * ---------------------------------------------------------------------------
 * Não existe mais o conceito de "seção" — o texto final é um único
 * parágrafo corrido, no estilo de transcrição de depoimento (verbos de
 * registro na 3ª pessoa: "Comunica que...", "Informa que...", "Relata
 * que...", fechando sempre com "Nada mais."). A ORDEM das frases no texto
 * final é simplesmente a ordem de declaração das perguntas no array —
 * por isso as perguntas base estão divididas em duas listas:
 *
 *   PERGUNTAS_INICIAIS -> vem antes das perguntas do tipo escolhido
 *   PERGUNTAS_FINAIS   -> vem depois (fechamento: motivo do registro,
 *                         representação criminal)
 *
 * Qualificação de vítima/suspeito e data/hora do fato continuam de fora
 * (já preenchidas em outro campo do BO).
 * ---------------------------------------------------------------------------
 */

// Texto fixo sempre anexado ao final, se algo foi gerado.
const TEXTO_FECHO = "Nada mais.";

// Opções da pergunta inicial vêm do registro de tipos (registry.js +
// js/tipos/*.js) — nunca precisa editar isto ao adicionar um tipo novo.
// Sem template próprio: é só um seletor de ramificação, a classificação
// do fato já existe em outro campo do sistema, não precisa virar frase.
const PERGUNTAS_INICIAIS = [
  {
    id: "tipo_ocorrencia",
    tipo: "multipla",
    texto: "Qual é o fato da ocorrência?",
    opcoes: Object.entries(window.TIPOS_OCORRENCIA).map(([valor, def]) => ({
      valor,
      texto: def.label,
    })),
    template: () => "",
  },
];

const PERGUNTAS_FINAIS = [
  {
    id: "motivo_registro",
    tipo: "multipla",
    texto: "Com qual finalidade a vítima registra a ocorrência?",
    opcoes: [
      { valor: "preservar_direitos", texto: "Preservar direitos" },
      { valor: "estorno_bancario", texto: "Preservar direitos e solicitar estorno bancário" },
      { valor: "providencias_cabiveis", texto: "Solicitar as providências cabíveis" },
      { valor: "seguro", texto: "Acionar seguro" },
      { valor: "conhecimento", texto: "Apenas para conhecimento dos fatos" },
      { valor: "outro", texto: "Outro motivo" },
    ],
    template: (r) => {
      const FRASES = {
        preservar_direitos: "Registra a presente ocorrência para preservar seus direitos.",
        estorno_bancario:
          "Registra para preservar seus direitos e solicitar ao banco o estorno dos valores transferidos.",
        providencias_cabiveis: "Registra para solicitar as providências cabíveis.",
        seguro: "Registra para fins de acionamento de seguro.",
        conhecimento: "Registra a presente ocorrência para conhecimento dos fatos.",
      };
      return FRASES[r] || "";
    },
  },
  {
    id: "motivo_registro_outro",
    tipo: "texto",
    texto: "Descreva a finalidade do registro",
    placeholder: "para...",
    exibirSe: { pergunta: "motivo_registro", igual: "outro" },
    template: (r) => `Registra a presente ocorrência ${r}.`,
  },
  {
    id: "deseja_representar",
    tipo: "multipla",
    texto: "A ação penal é condicionada? Se sim, a vítima deseja representar criminalmente contra o autor?",
    opcoes: [
      { valor: "incondicionada", texto: "É crime de ação penal incondicionada (padrão, tudo que não for condicionada ou privada)." },
      { valor: "representa", texto: "É crime de ação penal condicionada (ameaça, estelionato, lesao leve, vazar vídeo intimo, etc) e representa criminalmente." },
      { valor: "naorepresenta", texto: "É crime de ação penal condicionada e NÃO DESEJA representar." },
      { valor: "acaoprivada", texto: "É crime de ação penal privada (calúnia, difamação e injúria simples, além de dano) e moverá queixa-crime." },
    ],
    // Nem todo crime condicionado tem prazo decadencial de representação
    // (ex.: Maria da Penha costuma ser incondicionada), então o aviso do
    // "naorepresenta" é uma simplificação deliberada. Se um tipo de
    // ocorrência específico não deve carregar esse aviso, dá pra
    // sobrescrever localmente no módulo do tipo.
    template: (r) => {
      const FRASES = {
        representa: "Manifesta desejo em representar criminalmente.",
        naorepresenta:
          "Cientificado(a) acerca do prazo decadencial de seis meses, não deseja representar criminalmente.",
        acaoprivada: "É crime de ação penal privada e a vítima informou que moverá queixa-crime.",
      };
      return FRASES[r] || "";
    },
  },
];

// Perguntas efetivamente ativas, na ordem em que devem aparecer no texto
// final: iniciais -> as do tipo escolhido -> finais.
function getPerguntas(respostas) {
  const tipoEscolhido = respostas ? respostas["tipo_ocorrencia"] : undefined;
  const modulo = tipoEscolhido ? window.TIPOS_OCORRENCIA[tipoEscolhido] : null;
  return [...PERGUNTAS_INICIAIS, ...(modulo ? modulo.perguntas : []), ...PERGUNTAS_FINAIS];
}

window.SCHEMA = {
  TEXTO_FECHO,
  PERGUNTAS_BASE: [...PERGUNTAS_INICIAIS, ...PERGUNTAS_FINAIS], // usado só pelo linter
  getPerguntas,
};