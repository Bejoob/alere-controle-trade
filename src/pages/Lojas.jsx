import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { FileDown, FileSpreadsheet, Pencil, Trash2, Check, X } from 'lucide-react';
import db from '../db.js';
import Badge from '../components/Badge.jsx';
import { STATUS, calcularDiasParaVencer, calcularStatusValidade } from '../lib/status.js';
import { formatDateBR } from '../lib/format.js';
import { exportarCSV } from '../lib/csv.js';
import { gerarPDFRelatorio } from '../lib/pdf.js';

const FILTRO_VAZIO = { loja: '', produto: '', status: '', dataInicio: '', dataFim: '' };

export default function Lojas() {
  const registros = useLiveQuery(() => db.estoqueLoja.toArray(), []) ?? [];
  const [filtro, setFiltro] = useState(FILTRO_VAZIO);
  const [edicao, setEdicao] = useState(null);

  const lojas = useMemo(() => [...new Set(registros.map((r) => r.loja))].sort(), [registros]);
  const produtos = useMemo(() => [...new Set(registros.map((r) => r.produto))].sort(), [registros]);

  const filtrados = useMemo(() => {
    return registros
      .filter((r) => !filtro.loja || r.loja === filtro.loja)
      .filter((r) => !filtro.produto || r.produto === filtro.produto)
      .filter((r) => !filtro.status || r.statusValidade === filtro.status)
      .filter((r) => !filtro.dataInicio || r.dataVisita >= filtro.dataInicio)
      .filter((r) => !filtro.dataFim || r.dataVisita <= filtro.dataFim)
      .sort((a, b) => (a.dataVisita < b.dataVisita ? 1 : -1));
  }, [registros, filtro]);

  function iniciarEdicao(r) {
    setEdicao({ ...r });
  }
  function cancelarEdicao() {
    setEdicao(null);
  }
  function atualizarCampoEdicao(campo, valor) {
    setEdicao((e) => ({ ...e, [campo]: valor }));
  }
  async function salvarEdicao() {
    const diasParaVencer = calcularDiasParaVencer(edicao.validade, edicao.dataVisita);
    const statusValidade = calcularStatusValidade(edicao.validade, edicao.dataVisita);
    await db.estoqueLoja.update(edicao.id, {
      empresa: edicao.empresa,
      loja: edicao.loja,
      produto: edicao.produto,
      quantidade: Number(edicao.quantidade) || 0,
      validade: edicao.validade || null,
      dataVisita: edicao.dataVisita,
      diasParaVencer,
      statusValidade,
    });
    setEdicao(null);
  }
  async function excluir(id) {
    if (!window.confirm('Excluir este lançamento?')) return;
    await db.estoqueLoja.delete(id);
  }

  function handleExportarCSV() {
    exportarCSV(
      filtrados.map((r) => ({
        empresa: r.empresa,
        loja: r.loja,
        produto: r.produto,
        quantidade: r.quantidade,
        validade: formatDateBR(r.validade),
        dataVisita: formatDateBR(r.dataVisita),
        statusValidade: r.statusValidade,
      })),
      `estoque-lojas-${Date.now()}.csv`,
    );
  }

  async function handleExportarPDF() {
    await gerarPDFRelatorio({
      titulo: 'Estoque em loja - Alere',
      nomeArquivo: `estoque-lojas-${Date.now()}.pdf`,
      tabelas: [
        {
          titulo: 'Lançamentos de estoque em loja',
          colunas: ['Loja', 'Produto', 'Qtd', 'Validade', 'Visita', 'Status'],
          linhas: filtrados.map((r) => [
            `Loja ${r.loja}`,
            r.produto,
            r.quantidade,
            formatDateBR(r.validade),
            formatDateBR(r.dataVisita),
            r.statusValidade,
          ]),
        },
      ],
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Lojas</h1>
          <p className="text-sm text-slate-400">Histórico de lançamentos de estoque por loja</p>
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

      <div className="card grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="label">Loja</label>
          <select className="input" value={filtro.loja} onChange={(e) => setFiltro((f) => ({ ...f, loja: e.target.value }))}>
            <option value="">Todas</option>
            {lojas.map((l) => (
              <option key={l} value={l}>
                Loja {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Produto</label>
          <select className="input" value={filtro.produto} onChange={(e) => setFiltro((f) => ({ ...f, produto: e.target.value }))}>
            <option value="">Todos</option>
            {produtos.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={filtro.status} onChange={(e) => setFiltro((f) => ({ ...f, status: e.target.value }))}>
            <option value="">Todos</option>
            {Object.values(STATUS).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">De</label>
          <input type="date" className="input" value={filtro.dataInicio} onChange={(e) => setFiltro((f) => ({ ...f, dataInicio: e.target.value }))} />
        </div>
        <div>
          <label className="label">Até</label>
          <input type="date" className="input" value={filtro.dataFim} onChange={(e) => setFiltro((f) => ({ ...f, dataFim: e.target.value }))} />
        </div>
      </div>
      {(filtro.loja || filtro.produto || filtro.status || filtro.dataInicio || filtro.dataFim) && (
        <button className="text-xs font-medium text-brand-700 hover:underline" onClick={() => setFiltro(FILTRO_VAZIO)}>
          Limpar filtros
        </button>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-400">
              <th className="py-2 pr-3">Visita</th>
              <th className="py-2 pr-3">Loja</th>
              <th className="py-2 pr-3">Produto</th>
              <th className="py-2 pr-3">Quantidade</th>
              <th className="py-2 pr-3">Validade</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3" />
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400">
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            )}
            {filtrados.map((r) => {
              const editando = edicao?.id === r.id;
              return (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="py-2 pr-3">
                    {editando ? (
                      <input type="date" className="input" value={edicao.dataVisita} onChange={(e) => atualizarCampoEdicao('dataVisita', e.target.value)} />
                    ) : (
                      formatDateBR(r.dataVisita)
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {editando ? (
                      <input className="input w-20" value={edicao.loja} onChange={(e) => atualizarCampoEdicao('loja', e.target.value)} />
                    ) : (
                      `Loja ${r.loja}`
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {editando ? (
                      <input className="input" value={edicao.produto} onChange={(e) => atualizarCampoEdicao('produto', e.target.value)} />
                    ) : (
                      r.produto
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {editando ? (
                      <input type="number" min="0" className="input w-24" value={edicao.quantidade} onChange={(e) => atualizarCampoEdicao('quantidade', e.target.value)} />
                    ) : (
                      r.quantidade
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {editando ? (
                      <input type="date" className="input" value={edicao.validade || ''} onChange={(e) => atualizarCampoEdicao('validade', e.target.value || null)} />
                    ) : (
                      formatDateBR(r.validade)
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    <Badge status={editando ? calcularStatusValidade(edicao.validade, edicao.dataVisita) : r.statusValidade} />
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
