import { parseDateBR } from './format.js';

const RE_LOJA = /^loja\s*:?\s*(\d+)/i;
const RE_HEADER = /^#+\s*/;
const RE_LOTE = /^(\d+)\s*(?:unidades?|uni\.?|un\.?)\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i;
const RE_SEM_ESTOQUE = /^-+$/;

/**
 * Interpreta uma mensagem de WhatsApp com estoque de loja.
 * Regras: linha 1 = empresa; "Loja: NN" = loja; linhas começando com "#" são
 * comentários/seções e são ignoradas; uma linha "qtd unidades dd/mm/aaaa" é um
 * lote do produto atual; "-" é um lote sem estoque/zerado; qualquer outra
 * linha define um novo produto atual.
 */
export function parseWhatsAppMessage(rawText) {
  const warnings = [];
  const linhas = (rawText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (linhas.length === 0) {
    return { empresa: '', loja: '', itens: [], warnings: ['Mensagem vazia.'] };
  }

  const empresa = linhas[0];
  let loja = '';
  let currentProduto = null;
  const produtosOrdem = [];
  const produtosLotes = {};

  for (const linha of linhas.slice(1)) {
    const matchLoja = linha.match(RE_LOJA);
    if (matchLoja) {
      loja = matchLoja[1];
      continue;
    }

    if (RE_HEADER.test(linha)) {
      // Seção/comentário (ex: "## Proteico") - ignorado, não altera o produto atual.
      continue;
    }

    const matchLote = linha.match(RE_LOTE);
    if (matchLote) {
      if (!currentProduto) {
        warnings.push(`Linha "${linha}" ignorada: nenhum produto definido antes dela.`);
        continue;
      }
      const quantidade = parseInt(matchLote[1], 10);
      const validade = parseDateBR(matchLote[2]);
      if (validade === null) {
        warnings.push(`Data inválida na linha "${linha}".`);
      }
      produtosLotes[currentProduto].push({ quantidade, validade, semEstoque: false });
      continue;
    }

    if (RE_SEM_ESTOQUE.test(linha)) {
      if (!currentProduto) {
        warnings.push(`Linha "${linha}" ignorada: nenhum produto definido antes dela.`);
        continue;
      }
      produtosLotes[currentProduto].push({ quantidade: 0, validade: null, semEstoque: true });
      continue;
    }

    // Qualquer outra linha é um novo nome de produto.
    currentProduto = linha;
    if (!produtosOrdem.includes(currentProduto)) {
      produtosOrdem.push(currentProduto);
      produtosLotes[currentProduto] = [];
    }
  }

  const itens = [];
  for (const produto of produtosOrdem) {
    const lotes = produtosLotes[produto];
    if (lotes.length === 0) {
      itens.push({ produto, quantidade: 0, validade: null, semEstoque: true });
    } else {
      for (const lote of lotes) {
        itens.push({ produto, ...lote });
      }
    }
  }

  if (!loja) warnings.push('Número da loja não identificado na mensagem.');
  if (itens.length === 0) warnings.push('Nenhum produto identificado na mensagem.');

  return { empresa, loja, itens, warnings };
}
