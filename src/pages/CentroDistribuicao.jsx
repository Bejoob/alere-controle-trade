import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Truck, Package, CalendarClock, Plus, Pencil, Trash2, Check, X, FileSpreadsheet, FileDown } from 'lucide-react';
import db from '../db.js';
import StatCard from '../components/StatCard.jsx';
import BarLojas from '../components/charts/BarLojas.jsx';
import PieProdutos from '../components/charts/PieProdutos.jsx';
import LineEvolucao from '../components/charts/LineEvolucao.jsx';
import { totalEnviado, totalPorProdutoCD, totalPorLojaDestinoCD, serieEnvioPorData, ultimaVisitaCD } from '../lib/cd.js';
import { formatDateBR, diaDaSemana, todayISO } from '../lib/format.js';
import { exportarCSV } from '../lib/csv.js';
import { gerarPDFRelatorio } from '../lib/pdf.js';

const FORM_VAZIO = { dataVisita: todayISO(), produto: '', quantidadeEnviada: '', lojaDestino: '', responsavel: '', observacoes: '' };

export default function CentroDistribuicao() {
  const registros = useLiveQuery(() => db.centroDistribuicao.toArray(), []) ?? [];
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState('');
  const [edicao, setEdicao] = useState(null);

  const porProduto = useMemo(() => totalPorProdutoCD(registros), [registros]);
  const porLoja = useMemo(() => totalPorLojaDestinoCD(registros), [registros]);
  const serie = useMemo(() => serieEnvioPorData(registros), [registros]);
  const ultima = useMemo(() => ultimaVisitaCD(registros), [registros]);
  const historico = useMemo(() => [...registros].sort((a, b) => (a.dataVisita < b.dataVisita ? 1 : -1)), [registros]);

  async function handleRegistrar(e) {
    e.preventDefault();
    setErro('');
    if (!form.produto.trim()) return setErro('Informe o produto enviado.');
    if (!form.lojaDestino.trim()) return setErro('Informe a loja destino.');
    if (!form.dataVisita) return setErro('Selecione a data da visita.');

    await db.centroDistribuicao.add({
      origem: 'CD',
      produto: form.produto.trim(),
      quantidadeEnviada: Number(form.quantidadeEnviada) || 0,
      lojaDestino: form.lojaDestino.trim(),
      responsavel: form.responsavel.trim(),
      dataVisita: form.dataVisita,
      diaSemana: diaDaSemana(form.dataVisita),
      observacoes: form.observacoes.trim(),
      criadoEm: new Date().toISOString(),
    });
    setForm(FORM_VAZIO);
  }

  function iniciarEdicao(r) {
    setEdicao({ ...r });
  }
  function cancelarEdicao() {
    setEdicao(null);
  }
  async function salvarEdicao() {
    await db.centroDistribuicao.update(edicao.id, {
      produto: edicao.produto,
      quantidadeEnviada: Number(edicao.quantidadeEnviada) || 0,
      lojaDestino: edicao.lojaDestino,
      responsavel: edicao.responsavel,
      dataVisita: edicao.dataVisita,
      diaSemana: diaDaSemana(edicao.dataVisita),
      observacoes: edicao.observacoes,
    });
    setEdicao(null);
  }
  async function excluir(id) {
    if (!window.confirm('Excluir este envio do CD?')) return;
    await db.centroDistribuicao.delete(id);
  }

  function handleExportarCSV() {
    exportarCSV(
      historico.map((r) => ({
        dataVisita: formatDateBR(r.dataVisita),
        diaSemana: r.diaSemana,
        produto: r.produto,
        quantidadeEnviada: r.quantidadeEnviada,
        lojaDestino: r.lojaDestino,
        responsavel: r.responsavel,
        observacoes: r.observacoes,
      })),
      `centro-distribuicao-${Date.now()}.csv`,
    );
  }

  async function handleExportarPDF() {
    await gerarPDFRelatorio({
      titulo: 'Centro de Distribuição - Alere',
      nomeArquivo: `centro-distribuicao-${Date.now()}.pdf`,
      tabelas: [
        {
          titulo: 'Total enviado por produto',
          colunas: ['Produto', 'Total enviado'],
          linhas: porProduto.map((p) => [p.produto, p.total]),
        },
        {
          titulo: 'Total enviado por loja destino',
          colunas: ['Loja destino', 'Total enviado'],
          linhas: porLoja.map((l) => [`Loja ${l.loja}`, l.total]),
        },
        {
          titulo: 'Histórico de envios',
          colunas: ['Visita', 'Produto', 'Qtd enviada', 'Loja destino', 'Responsável'],
          linhas: historico.map((r) => [formatDateBR(r.dataVisita), r.produto, r.quantidadeEnviada, `Loja ${r.lojaDestino}`, r.responsavel || '-']),
        },
      ],
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Centro de Distribuição</h1>
          <p className="text-sm text-slate-400">Controle de envios do CD para as lojas, separado do estoque de loja</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportarCSV} className="btn-secondary">
            <FileSpreadsheet size={16} /> CSV
          </button>
          <button onClick={handleExportarPDF} className="btn-primary">
            <FileDown size={16} /> PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Package} label="Total enviado" value={totalEnviado(registros)} tone="default" />
        <StatCard
          icon={CalendarClock}
          label="Última visita registrada"
          value={ultima ? formatDateBR(ultima.dataVisita) : '-'}
          hint={ultima ? ultima.diaSemana : 'Nenhum envio ainda'}
          tone="default"
        />
        <StatCard icon={Truck} label="Lojas destino atendidas" value={porLoja.length} tone="default" />
      </div>

      <div className="card">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Registrar envio do CD</h2>
        <form onSubmit={handleRegistrar} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label">Data da visita</label>
            <input type="date" className="input" value={form.dataVisita} onChange={(e) => setForm((f) => ({ ...f, dataVisita: e.target.value }))} />
          </div>
          <div>
            <label className="label">Produto</label>
            <input className="input" value={form.produto} onChange={(e) => setForm((f) => ({ ...f, produto: e.target.value }))} />
          </div>
          <div>
            <label className="label">Quantidade enviada</label>
            <input type="number" min="0" className="input" value={form.quantidadeEnviada} onChange={(e) => setForm((f) => ({ ...f, quantidadeEnviada: e.target.value }))} />
          </div>
          <div>
            <label className="label">Loja destino</label>
            <input className="input" value={form.lojaDestino} onChange={(e) => setForm((f) => ({ ...f, lojaDestino: e.target.value }))} />
          </div>
          <div>
            <label className="label">Responsável</label>
            <input className="input" value={form.responsavel} onChange={(e) => setForm((f) => ({ ...f, responsavel: e.target.value }))} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label">Observações</label>
            <textarea className="input min-h-[80px]" value={form.observacoes} onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))} />
          </div>
          {erro && <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</div>}
          <div className="sm:col-span-2 lg:col-span-3">
            <button type="submit" className="btn-primary">
              <Plus size={16} /> Registrar envio
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Envio por produto</h2>
          <PieProdutos data={porProduto} />
        </div>
        <div className="card">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Envio por loja destino</h2>
          <BarLojas data={porLoja.slice(0, 10)} />
        </div>
      </div>

      <div className="card">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Envio por data</h2>
        <LineEvolucao data={serie} />
      </div>

      <div className="card overflow-x-auto">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Histórico de envios</h2>
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-400">
              <th className="py-2 pr-3">Visita</th>
              <th className="py-2 pr-3">Produto</th>
              <th className="py-2 pr-3">Qtd enviada</th>
              <th className="py-2 pr-3">Loja destino</th>
              <th className="py-2 pr-3">Responsável</th>
              <th className="py-2 pr-3">Observações</th>
              <th className="py-2 pr-3" />
            </tr>
          </thead>
          <tbody>
            {historico.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400">
                  Nenhum envio registrado ainda.
                </td>
              </tr>
            )}
            {historico.map((r) => {
              const editando = edicao?.id === r.id;
              return (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="py-2 pr-3">
                    {editando ? (
                      <input type="date" className="input" value={edicao.dataVisita} onChange={(e) => setEdicao((ed) => ({ ...ed, dataVisita: e.target.value }))} />
                    ) : (
                      <>
                        {formatDateBR(r.dataVisita)}
                        <span className="ml-1 text-xs text-slate-400">({r.diaSemana})</span>
                      </>
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {editando ? (
                      <input className="input" value={edicao.produto} onChange={(e) => setEdicao((ed) => ({ ...ed, produto: e.target.value }))} />
                    ) : (
                      r.produto
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {editando ? (
                      <input type="number" min="0" className="input w-24" value={edicao.quantidadeEnviada} onChange={(e) => setEdicao((ed) => ({ ...ed, quantidadeEnviada: e.target.value }))} />
                    ) : (
                      r.quantidadeEnviada
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {editando ? (
                      <input className="input w-24" value={edicao.lojaDestino} onChange={(e) => setEdicao((ed) => ({ ...ed, lojaDestino: e.target.value }))} />
                    ) : (
                      `Loja ${r.lojaDestino}`
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {editando ? (
                      <input className="input" value={edicao.responsavel} onChange={(e) => setEdicao((ed) => ({ ...ed, responsavel: e.target.value }))} />
                    ) : (
                      r.responsavel || '-'
                    )}
                  </td>
                  <td className="py-2 pr-3 max-w-[220px] truncate">
                    {editando ? (
                      <input className="input" value={edicao.observacoes} onChange={(e) => setEdicao((ed) => ({ ...ed, observacoes: e.target.value }))} />
                    ) : (
                      r.observacoes || '-'
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {editando ? (
                      <div className="flex gap-2">
                        <button onClick={salvarEdicao} className="text-emerald-600 hover:text-emerald-800">
                          <Check size={16} />
                        </button>
                        <button onClick={cancelarEdicao} className="text-slate-400 hover:text-slate-600">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => iniciarEdicao(r)} className="text-slate-400 hover:text-brand-700">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => excluir(r.id)} className="text-slate-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
