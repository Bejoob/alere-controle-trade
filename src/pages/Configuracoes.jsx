import { useState } from 'react';
import { ShieldAlert, FileSpreadsheet, FileDown, Trash2, Info } from 'lucide-react';
import { supabase, TABLES } from '../db.js';
import { useSupabaseTable } from '../lib/useSupabaseTable.js';
import { exportarCSV } from '../lib/csv.js';
import { gerarPDFRelatorio } from '../lib/pdf.js';
import { formatDateBR } from '../lib/format.js';

export default function Configuracoes() {
  const registrosLoja = useSupabaseTable(TABLES.LOJA);
  const registrosCd = useSupabaseTable(TABLES.CD);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  function handleExportarCSVLoja() {
    exportarCSV(registrosLoja, `estoque-lojas-${Date.now()}.csv`);
  }

  function handleExportarCSVCd() {
    exportarCSV(registrosCd, `centro-distribuicao-${Date.now()}.csv`);
  }

  async function handleExportarPDFCompleto() {
    await gerarPDFRelatorio({
      titulo: 'Relatório completo - Alere Controle de Trade',
      nomeArquivo: `relatorio-completo-${Date.now()}.pdf`,
      tabelas: [
        {
          titulo: 'Estoque em loja',
          colunas: ['Loja', 'Produto', 'Qtd', 'Validade', 'Visita', 'Status'],
          linhas: registrosLoja.map((r) => [`Loja ${r.loja}`, r.produto, r.quantidade, formatDateBR(r.validade), formatDateBR(r.dataVisita), r.statusValidade]),
        },
        {
          titulo: 'Centro de distribuição',
          colunas: ['Visita', 'Produto', 'Qtd enviada', 'Loja destino', 'Responsável'],
          linhas: registrosCd.map((r) => [formatDateBR(r.dataVisita), r.produto, r.quantidadeEnviada, `Loja ${r.lojaDestino}`, r.responsavel || '-']),
        },
      ],
    });
  }

  async function handleLimparDados() {
    const confirmacao = window.confirm(
      `Isso vai apagar PERMANENTEMENTE, para TODOS os usuários, os ${registrosLoja.length} lançamentos de loja e ${registrosCd.length} envios do CD salvos no Supabase. Esta ação não pode ser desfeita. Tem certeza?`,
    );
    if (!confirmacao) return;
    setErro('');
    const [{ error: erroLoja }, { error: erroCd }] = await Promise.all([
      supabase.from(TABLES.LOJA).delete().gte('id', 0),
      supabase.from(TABLES.CD).delete().gte('id', 0),
    ]);
    if (erroLoja || erroCd) {
      setErro(`Erro ao limpar dados: ${erroLoja?.message || erroCd?.message}`);
      setMensagem('');
      return;
    }
    setMensagem('Todos os dados foram apagados do Supabase.');
    setErro('');
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Configurações</h1>
        <p className="text-sm text-slate-400">Exportação e gerenciamento dos dados</p>
      </div>

      <div className="card flex gap-3 border-amber-200 bg-amber-50">
        <Info size={18} className="mt-0.5 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-800">
          Os dados ficam salvos no Supabase (nuvem), compartilhados entre todos os dispositivos e navegadores que
          acessam este app — não é mais necessário exportar/importar backup manualmente.
        </p>
      </div>

      {mensagem && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{mensagem}</div>}
      {erro && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</div>}

      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Exportação de dados</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExportarCSVLoja} className="btn-secondary">
            <FileSpreadsheet size={16} /> CSV - Estoque em loja
          </button>
          <button onClick={handleExportarCSVCd} className="btn-secondary">
            <FileSpreadsheet size={16} /> CSV - Centro de Distribuição
          </button>
          <button onClick={handleExportarPDFCompleto} className="btn-secondary">
            <FileDown size={16} /> PDF - Relatório completo
          </button>
        </div>
      </div>

      <div className="card space-y-4 border-red-200">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-red-700">
          <ShieldAlert size={16} /> Zona de risco
        </h2>
        <p className="text-xs text-slate-500">
          Existem {registrosLoja.length} lançamento(s) de loja e {registrosCd.length} envio(s) de CD salvos no Supabase, visíveis para todos.
        </p>
        <button onClick={handleLimparDados} className="btn-danger">
          <Trash2 size={16} /> Limpar todos os dados (todas as redes, todos os usuários)
        </button>
      </div>
    </div>
  );
}
