import { useState } from 'react';
import { Wand2, Trash2, Plus, Save, CheckCircle2, AlertTriangle } from 'lucide-react';
import db from '../db.js';
import Badge from '../components/Badge.jsx';
import { parseWhatsAppMessage } from '../lib/parser.js';
import { calcularDiasParaVencer, calcularStatusValidade } from '../lib/status.js';
import { todayISO } from '../lib/format.js';

const EXEMPLO_MENSAGEM = `Alere
Loja: 46

Proteico
14 unidades 04/10/2026

Alecrim
17 unidades 10/11/2026

Cebolinha
08 unidades 09/10/2026

Tomate
14 unidades 09/11/2026`;

export default function NovoLancamento() {
  const [mensagem, setMensagem] = useState('');
  const [dataVisita, setDataVisita] = useState(todayISO());
  const [empresa, setEmpresa] = useState('');
  const [loja, setLoja] = useState('');
  const [itens, setItens] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [processado, setProcessado] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState('');

  function handleProcessar() {
    setSalvo(false);
    setErro('');
    const resultado = parseWhatsAppMessage(mensagem);
    setEmpresa(resultado.empresa);
    setLoja(resultado.loja);
    setItens(
      resultado.itens.map((item, idx) => ({
        tempId: `${Date.now()}-${idx}`,
        produto: item.produto,
        quantidade: item.quantidade,
        validade: item.validade,
      })),
    );
    setWarnings(resultado.warnings);
    setProcessado(true);
  }

  function atualizarItem(tempId, campo, valor) {
    setItens((atual) => atual.map((it) => (it.tempId === tempId ? { ...it, [campo]: valor } : it)));
  }

  function removerItem(tempId) {
    setItens((atual) => atual.filter((it) => it.tempId !== tempId));
  }

  function adicionarItemManual() {
    setItens((atual) => [...atual, { tempId: `manual-${Date.now()}`, produto: '', quantidade: 0, validade: null }]);
  }

  async function handleSalvar() {
    setErro('');
    if (!loja.trim()) return setErro('Informe o número da loja antes de salvar.');
    if (!dataVisita) return setErro('Selecione a data da visita.');
    if (itens.length === 0) return setErro('Não há produtos para salvar.');
    if (itens.some((it) => !it.produto.trim())) return setErro('Todos os itens precisam de um nome de produto.');

    const registros = itens.map((it) => ({
      origem: 'LOJA',
      empresa: empresa.trim() || 'Alere',
      loja: loja.trim(),
      produto: it.produto.trim(),
      quantidade: Number(it.quantidade) || 0,
      validade: it.validade || null,
      dataVisita,
      diasParaVencer: calcularDiasParaVencer(it.validade, dataVisita),
      statusValidade: calcularStatusValidade(it.validade, dataVisita),
      criadoEm: new Date().toISOString(),
    }));

    await db.estoqueLoja.bulkAdd(registros);
    setSalvo(true);
    setMensagem('');
    setEmpresa('');
    setLoja('');
    setItens([]);
    setWarnings([]);
    setProcessado(false);
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Novo Lançamento</h1>
        <p className="text-sm text-slate-400">Cole a mensagem do WhatsApp recebida da loja e processe automaticamente.</p>
      </div>

      <div className="card space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Data da visita</label>
            <input
              type="date"
              className="input"
              value={dataVisita}
              onChange={(e) => setDataVisita(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="label mb-0">Mensagem do WhatsApp</label>
            <button type="button" className="text-xs font-medium text-brand-700 hover:underline" onClick={() => setMensagem(EXEMPLO_MENSAGEM)}>
              Usar exemplo
            </button>
          </div>
          <textarea
            className="input min-h-[220px] font-mono text-xs leading-relaxed"
            placeholder={'Cole aqui a mensagem recebida, por exemplo:\n\nAlere\nLoja: 46\n\nProteico\n14 unidades 04/10/2026'}
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
          />
        </div>

        <button type="button" className="btn-primary" onClick={handleProcessar} disabled={!mensagem.trim()}>
          <Wand2 size={16} /> Processar mensagem
        </button>
      </div>

      {processado && (
        <div className="card space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Empresa</label>
              <input className="input" value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
            </div>
            <div>
              <label className="label">Loja</label>
              <input className="input" value={loja} onChange={(e) => setLoja(e.target.value)} placeholder="Número da loja" />
            </div>
          </div>

          {warnings.length > 0 && (
            <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400">
                  <th className="py-2 pr-3">Produto</th>
                  <th className="py-2 pr-3">Quantidade</th>
                  <th className="py-2 pr-3">Validade</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3" />
                </tr>
              </thead>
              <tbody>
                {itens.map((it) => (
                  <tr key={it.tempId} className="border-b border-slate-50">
                    <td className="py-2 pr-3">
                      <input
                        className="input"
                        value={it.produto}
                        onChange={(e) => atualizarItem(it.tempId, 'produto', e.target.value)}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min="0"
                        className="input w-24"
                        value={it.quantidade}
                        onChange={(e) => atualizarItem(it.tempId, 'quantidade', e.target.value)}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="date"
                        className="input"
                        value={it.validade || ''}
                        onChange={(e) => atualizarItem(it.tempId, 'validade', e.target.value || null)}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <Badge status={calcularStatusValidade(it.validade, dataVisita)} />
                    </td>
                    <td className="py-2 pr-3">
                      <button type="button" onClick={() => removerItem(it.tempId)} className="text-slate-400 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {itens.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      Nenhum produto na pré-visualização.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <button type="button" className="btn-secondary" onClick={adicionarItemManual}>
            <Plus size={16} /> Adicionar produto manualmente
          </button>

          {erro && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</div>
          )}

          <button type="button" className="btn-primary" onClick={handleSalvar}>
            <Save size={16} /> Salvar lançamento
          </button>
        </div>
      )}

      {salvo && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={16} /> Lançamento salvo com sucesso. Você já pode colar a próxima mensagem.
        </div>
      )}
    </div>
  );
}
