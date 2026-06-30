import { calcularDiasParaVencer, calcularStatusValidade, STATUS } from './status.js';
import { todayISO } from './format.js';

/** Map loja -> data da visita mais recente registrada. */
export function ultimaVisitaPorLoja(registros) {
  const map = new Map();
  for (const r of registros) {
    const atual = map.get(r.loja);
    if (!atual || r.dataVisita > atual) map.set(r.loja, r.dataVisita);
  }
  return map;
}

/** Apenas os registros da visita mais recente de cada loja (foto atual do estoque). */
export function registrosUltimaVisita(registros) {
  const ultimas = ultimaVisitaPorLoja(registros);
  return registros.filter((r) => r.dataVisita === ultimas.get(r.loja));
}

export function totalPorLoja(registros) {
  const snap = registrosUltimaVisita(registros);
  const map = new Map();
  for (const r of snap) {
    map.set(r.loja, (map.get(r.loja) || 0) + r.quantidade);
  }
  return [...map.entries()]
    .map(([loja, total]) => ({ loja, total }))
    .sort((a, b) => b.total - a.total);
}

export function totalPorProduto(registros) {
  const snap = registrosUltimaVisita(registros);
  const map = new Map();
  for (const r of snap) {
    map.set(r.produto, (map.get(r.produto) || 0) + r.quantidade);
  }
  return [...map.entries()]
    .map(([produto, total]) => ({ produto, total }))
    .sort((a, b) => b.total - a.total);
}

export function totalGeral(registros) {
  return registrosUltimaVisita(registros).reduce((soma, r) => soma + r.quantidade, 0);
}

/** Recalcula o status de validade com a data de hoje, a partir do snapshot mais recente. */
export function alertasVencimento(registros, referenciaISO = todayISO()) {
  const snap = registrosUltimaVisita(registros);
  return snap
    .filter((r) => r.validade)
    .map((r) => ({
      ...r,
      diasParaVencerHoje: calcularDiasParaVencer(r.validade, referenciaISO),
      statusHoje: calcularStatusValidade(r.validade, referenciaISO),
    }))
    .filter((r) => r.statusHoje === STATUS.VENCIDO || r.statusHoje === STATUS.ALERTA)
    .sort((a, b) => a.diasParaVencerHoje - b.diasParaVencerHoje);
}

export function produtosVencidos(registros, referenciaISO = todayISO()) {
  return alertasVencimento(registros, referenciaISO).filter((r) => r.statusHoje === STATUS.VENCIDO);
}
