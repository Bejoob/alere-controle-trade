/** Agrupa registros por loja+produto, somando lotes da mesma visita, ordenado por data. */
export function agruparPorVisita(registros) {
  const grupos = new Map();
  for (const r of registros) {
    const chave = `${r.loja}__${r.produto}`;
    if (!grupos.has(chave)) grupos.set(chave, new Map());
    const visitas = grupos.get(chave);
    visitas.set(r.dataVisita, (visitas.get(r.dataVisita) || 0) + r.quantidade);
  }
  const resultado = new Map();
  for (const [chave, visitas] of grupos) {
    const lista = [...visitas.entries()]
      .map(([dataVisita, quantidade]) => ({ dataVisita, quantidade }))
      .sort((a, b) => (a.dataVisita > b.dataVisita ? 1 : -1));
    resultado.set(chave, lista);
  }
  return resultado;
}

/**
 * Compara a última visita com a anterior, por loja+produto.
 * Retorna a tendência (queda/aumento/estável) e a "venda estimada" quando há queda de estoque.
 */
export function compararUltimasVisitas(registros) {
  const grupos = agruparPorVisita(registros);
  const saida = [];
  for (const [chave, visitas] of grupos) {
    const [loja, produto] = chave.split('__');
    if (visitas.length === 0) continue;
    const atual = visitas[visitas.length - 1];
    const anterior = visitas.length > 1 ? visitas[visitas.length - 2] : null;

    let tendencia = 'sem-comparativo';
    let vendaEstimada = 0;
    let diferenca = null;

    if (anterior) {
      diferenca = atual.quantidade - anterior.quantidade;
      if (diferenca < 0) {
        tendencia = 'queda';
        vendaEstimada = Math.abs(diferenca);
      } else if (diferenca > 0) {
        tendencia = 'aumento';
      } else {
        tendencia = 'estavel';
      }
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
      vendaEstimada,
    });
  }
  return saida.sort((a, b) => a.loja.localeCompare(b.loja) || a.produto.localeCompare(b.produto));
}

/** Série temporal de quantidade total por data de visita, com filtros opcionais de loja/produto. */
export function serieTemporal(registros, { loja, produto } = {}) {
  const filtrados = registros.filter(
    (r) => (!loja || r.loja === loja) && (!produto || r.produto === produto),
  );
  const map = new Map();
  for (const r of filtrados) {
    map.set(r.dataVisita, (map.get(r.dataVisita) || 0) + r.quantidade);
  }
  return [...map.entries()]
    .map(([dataVisita, quantidade]) => ({ dataVisita, quantidade }))
    .sort((a, b) => (a.dataVisita > b.dataVisita ? 1 : -1));
}
