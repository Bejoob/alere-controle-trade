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
