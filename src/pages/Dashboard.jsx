import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Boxes, Store, AlertTriangle, TriangleAlert, FileDown, FileSpreadsheet } from 'lucide-react';
import { TABLES } from '../db.js';
import { useSupabaseTable } from '../lib/useSupabaseTable.js';
import { redeBySlug } from '../lib/redes.js';
import StatCard from '../components/StatCard.jsx';
import Badge from '../components/Badge.jsx';
import BarLojas from '../components/charts/BarLojas.jsx';
import LineEvolucao from '../components/charts/LineEvolucao.jsx';
import PieProdutos from '../components/charts/PieProdutos.jsx';
import { totalGeral, totalPorLoja, totalPorProduto, alertasVencimento, produtosVencidos } from '../lib/snapshot.js';
import { compararUltimasVisitas, serieTemporal } from '../lib/evolucao.js';
import { formatDateBR, formatNumero } from '../lib/format.js';
import { exportarCSV } from '../lib/csv.js';
import { gerarPDFRelatorio } from '../lib/pdf.js';

const TENDENCIA_LABEL = {
  queda: 'Venda estimada',
  aumento: 'Reposição',
  estavel: 'Estável',
  'sem-comparativo': 'Primeira visita',
};
const TENDENCIA_BADGE = {
  queda: 'badge-green',
  aumento: 'badge-blue',
  estavel: 'badge-gray',
  'sem-comparativo': 'badge-gray',
};

export default function Dashboard() {
  const { redeSlug } = useParams();
  const rede = redeBySlug(redeSlug);

  const todosRegistros = useSupabaseTable(TABLES.LOJA);
  const dashboardRef = useRef(null);
  const [lojaSelecionada, setLojaSelecionada] = useState('');

  useEffect(() => {
    setLojaSelecionada('');
  }, [redeSlug]);

  const registros = useMemo(
    () => (rede ? todosRegistros.filter((r) => (r.rede || 'Zona Sul') === rede.nome) : []),
    [todosRegistros, rede],
  );

  const ranking = useMemo(() => totalPorLoja(registros), [registros]);
  const porProduto = useMemo(() => totalPorProduto(registros), [registros]);
  const alertas = useMemo(() => alertasVencimento(registros), [registros]);
  const vencidos = useMemo(() => produtosVencidos(registros), [registros]);
  const evolucao = useMemo(() => compararUltimasVisitas(registros), [registros]);
  const lojas = useMemo(() => [...new Set(registros.map((r) => r.loja))].sort(), [registros]);
  const serie = useMemo(
    () => serieTemporal(registros, lojaSelecionada ? { loja: lojaSelecionada } : {}),
    [registros, lojaSelecionada],
  );

  async function handleExportarPDF() {
    await gerarPDFRelatorio({
      elemento: dashboardRef.current,
      titulo: `Dashboard Alere - ${rede.nome}`,
      nomeArquivo: `dashboard-${rede.slug}-${Date.now()}.pdf`,
      tabelas: [
        {
          titulo: 'Ranking de lojas (estoque atual)',
          colunas: ['Loja', 'Total em estoque'],
          linhas: ranking.map((r) => [`Loja ${r.loja}`, r.total]),
        },
        {
          titulo: 'Alertas de vencimento',
          colunas: ['Loja', 'Produto', 'Quantidade', 'Validade', 'Status'],
          linhas: alertas.map((a) => [`Loja ${a.loja}`, a.produto, a.quantidade, formatDateBR(a.validade), a.statusHoje]),
        },
      ],
    });
  }

  function handleExportarCSV() {
    exportarCSV(
      alertas.map((a) => ({
        loja: a.loja,
        produto: a.produto,
        quantidade: a.quantidade,
        validade: formatDateBR(a.validade),
        diasParaVencer: a.diasParaVencerHoje,
        status: a.statusHoje,
      })),
      `alertas-vencimento-${rede.slug}-${Date.now()}.csv`,
    );
  }

  if (!rede) return <Navigate to="/rede/zona-sul" replace />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Dashboard — {rede.nome}</h1>
          <p className="text-sm text-slate-400">Visão geral do estoque em loja da rede {rede.nome}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportarCSV} className="btn-secondary">
            <FileSpreadsheet size={16} /> Exportar CSV (alertas)
          </button>
          <button onClick={handleExportarPDF} className="btn-primary">
            <FileDown size={16} /> Gerar PDF
          </button>
        </div>
      </div>

      <div ref={dashboardRef} className="space-y-6 bg-slate-50">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Boxes} label="Total em estoque (lojas)" value={formatNumero(totalGeral(registros))} tone="default" />
          <StatCard icon={Store} label="Lojas com lançamento" value={lojas.length} tone="default" />
          <StatCard icon={TriangleAlert} label="Alerta até 50 dias" value={alertas.length - vencidos.length} tone="yellow" />
          <StatCard icon={AlertTriangle} label="Produtos vencidos" value={vencidos.length} tone="red" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card">
            <h2 className="mb-2 text-sm font-semibold text-slate-700">Ranking de lojas (estoque atual)</h2>
            <BarLojas data={ranking.slice(0, 10)} />
          </div>
          <div className="card">
            <h2 className="mb-2 text-sm font-semibold text-slate-700">Estoque por produto</h2>
            <PieProdutos data={porProduto} />
          </div>
        </div>

        <div className="card">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-700">Evolução por loja</h2>
            <select
              value={lojaSelecionada}
              onChange={(e) => setLojaSelecionada(e.target.value)}
              className="input w-auto"
            >
              <option value="">Todas as lojas</option>
              {lojas.map((l) => (
                <option key={l} value={l}>
                  Loja {l}
                </option>
              ))}
            </select>
          </div>
          <LineEvolucao data={serie} />
        </div>

        <div className="card overflow-x-auto">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Comparativo entre visitas (queda/aumento de estoque)</h2>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400">
                <th className="py-2 pr-3">Loja</th>
                <th className="py-2 pr-3">Produto</th>
                <th className="py-2 pr-3">Visita anterior</th>
                <th className="py-2 pr-3">Qtd. anterior</th>
                <th className="py-2 pr-3">Visita atual</th>
                <th className="py-2 pr-3">Qtd. atual</th>
                <th className="py-2 pr-3">Tendência</th>
              </tr>
            </thead>
            <tbody>
              {evolucao.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    Sem dados suficientes ainda.
                  </td>
                </tr>
              )}
              {evolucao.map((e) => (
                <tr key={`${e.loja}-${e.produto}`} className="border-b border-slate-50">
                  <td className="py-2 pr-3">Loja {e.loja}</td>
                  <td className="py-2 pr-3">{e.produto}</td>
                  <td className="py-2 pr-3">{e.dataVisitaAnterior ? formatDateBR(e.dataVisitaAnterior) : '-'}</td>
                  <td className="py-2 pr-3">{e.quantidadeAnterior ?? '-'}</td>
                  <td className="py-2 pr-3">{formatDateBR(e.dataVisitaAtual)}</td>
                  <td className="py-2 pr-3">{e.quantidadeAtual}</td>
                  <td className="py-2 pr-3">
                    <span className={TENDENCIA_BADGE[e.tendencia]}>
                      {TENDENCIA_LABEL[e.tendencia]}
                      {e.tendencia === 'queda' ? ` (${e.vendaEstimada} un.)` : ''}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card overflow-x-auto">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Tabela de alertas de vencimento</h2>
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400">
                <th className="py-2 pr-3">Loja</th>
                <th className="py-2 pr-3">Produto</th>
                <th className="py-2 pr-3">Quantidade</th>
                <th className="py-2 pr-3">Validade</th>
                <th className="py-2 pr-3">Dias p/ vencer</th>
                <th className="py-2 pr-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {alertas.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    Nenhum alerta de vencimento no momento.
                  </td>
                </tr>
              )}
              {alertas.map((a) => (
                <tr key={a.id} className="border-b border-slate-50">
                  <td className="py-2 pr-3">Loja {a.loja}</td>
                  <td className="py-2 pr-3">{a.produto}</td>
                  <td className="py-2 pr-3">{a.quantidade}</td>
                  <td className="py-2 pr-3">{formatDateBR(a.validade)}</td>
                  <td className="py-2 pr-3">{a.diasParaVencerHoje}</td>
                  <td className="py-2 pr-3">
                    <Badge status={a.statusHoje} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
