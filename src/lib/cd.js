export function totalEnviado(registros) {
  return registros.reduce((soma, r) => soma + r.quantidadeEnviada, 0);
}

export function totalPorProdutoCD(registros) {
  const map = new Map();
  for (const r of registros) map.set(r.produto, (map.get(r.produto) || 0) + r.quantidadeEnviada);
  return [...map.entries()]
    .map(([produto, total]) => ({ produto, total }))
    .sort((a, b) => b.total - a.total);
}

export function totalPorLojaDestinoCD(registros) {
  const map = new Map();
  for (const r of registros) map.set(r.lojaDestino, (map.get(r.lojaDestino) || 0) + r.quantidadeEnviada);
  return [...map.entries()]
    .map(([loja, total]) => ({ loja, total }))
    .sort((a, b) => b.total - a.total);
}

export function serieEnvioPorData(registros) {
  const map = new Map();
  for (const r of registros) map.set(r.dataVisita, (map.get(r.dataVisita) || 0) + r.quantidadeEnviada);
  return [...map.entries()]
    .map(([dataVisita, quantidade]) => ({ dataVisita, quantidade }))
    .sort((a, b) => (a.dataVisita < b.dataVisita ? -1 : 1));
}

export function ultimaVisitaCD(registros) {
  if (registros.length === 0) return null;
  return registros.reduce((maisRecente, r) => (!maisRecente || r.dataVisita > maisRecente.dataVisita ? r : maisRecente), null);
}

/**
 * Compara a última visita com a anterior, por loja destino+produto.
 * Retorna a tendência (queda/aumento/estável) de quantidade enviada.
 */
export function compararUltimasVisitasCD(registros) {
  const grupos = new Map();
  for (const r of registros) {
    const chave = `${r.lojaDestino}__${r.produto}`;
    if (!grupos.has(chave)) grupos.set(chave, new Map());
    const visitas = grupos.get(chave);
    visitas.set(r.dataVisita, (visitas.get(r.dataVisita) || 0) + r.quantidadeEnviada);
  }

  const saida = [];
  for (const [chave, visitasMap] of grupos) {
    const [loja, produto] = chave.split('__');
    const visitas = [...visitasMap.entries()]
      .map(([dataVisita, quantidade]) => ({ dataVisita, quantidade }))
      .sort((a, b) => (a.dataVisita > b.dataVisita ? 1 : -1));
    if (visitas.length === 0) continue;

    const atual = visitas[visitas.length - 1];
    const anterior = visitas.length > 1 ? visitas[visitas.length - 2] : null;

    let tendencia = 'sem-comparativo';
    let diferenca = null;

    if (anterior) {
      diferenca = atual.quantidade - anterior.quantidade;
      if (diferenca < 0) tendencia = 'queda';
      else if (diferenca > 0) tendencia = 'aumento';
      else tendencia = 'estavel';
    }

    saida.push({
      loja,
      produto,
      dataVisitaAtual: atual.dataVisita,
      quantidadeAtual: atual.quantidade,
      dataVisitaAnterior: anterior?.dataVisita ?? null,
      quantidadeAnterior: anterior?.quantidade ?? null,
      diferenca,
      tendencia,
    });
  }
  return saida.sort((a, b) => a.loja.localeCompare(b.loja) || a.produto.localeCompare(b.produto));
}
