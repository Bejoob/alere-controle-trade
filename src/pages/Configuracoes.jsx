import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ShieldAlert, DownloadCloud, UploadCloud, FileSpreadsheet, FileDown, Trash2, Info } from 'lucide-react';
import db from '../db.js';
import {
  exportarBackupJSON,
  importarBackupJSON,
  getUltimoBackup,
  limparTodosDados,
} from '../lib/backup.js';
import { exportarCSV } from '../lib/csv.js';
import { gerarPDFRelatorio } from '../lib/pdf.js';
import { formatDateBR } from '../lib/format.js';

export default function Configuracoes() {
  const totalLoja = useLiveQuery(() => db.estoqueLoja.count(), []) ?? 0;
  const totalCd = useLiveQuery(() => db.centroDistribuicao.count(), []) ?? 0;
  const [ultimoBackup, setUltimoBackup] = useState(getUltimoBackup());
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  async function handleExportarBackup() {
    await exportarBackupJSON();
    setUltimoBackup(getUltimoBackup());
    setMensagem('Backup JSON exportado com sucesso.');
    setErro('');
  }

  async function handleImportarBackup(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!window.confirm('Importar este backup vai substituir TODOS os dados atuais (lojas e CD). Continuar?')) return;
    try {
      const { totalLoja: tl, totalCd: tc } = await importarBackupJSON(file);
      setMensagem(`Backup importado: ${tl} lançamentos de loja e ${tc} envios do CD.`);
      setErro('');
    } catch (err) {
      setErro(err.message || 'Erro ao importar backup.');
      setMensagem('');
    }
  }

  async function handleExportarCSVLoja() {
    const dados = await db.estoqueLoja.toArray();
    exportarCSV(dados, `estoque-lojas-${Date.now()}.csv`);
  }

  async function handleExportarCSVCd() {
    const dados = await db.centroDistribuicao.toArray();
    exportarCSV(dados, `centro-distribuicao-${Date.now()}.csv`);
  }

  async function handleExportarPDFCompleto() {
    const loja = await db.estoqueLoja.toArray();
    const cd = await db.centroDistribuicao.toArray();
    await gerarPDFRelatorio({
      titulo: 'Relatório completo - Alere Controle de Trade',
      nomeArquivo: `relatorio-completo-${Date.now()}.pdf`,
      tabelas: [
        {
          titulo: 'Estoque em loja',
          colunas: ['Loja', 'Produto', 'Qtd', 'Validade', 'Visita', 'Status'],
          linhas: loja.map((r) => [`Loja ${r.loja}`, r.produto, r.quantidade, formatDateBR(r.validade), formatDateBR(r.dataVisita), r.statusValidade]),
        },
        {
          titulo: 'Centro de distribuição',
          colunas: ['Visita', 'Produto', 'Qtd enviada', 'Loja destino', 'Responsável'],
          linhas: cd.map((r) => [formatDateBR(r.dataVisita), r.produto, r.quantidadeEnviada, `Loja ${r.lojaDestino}`, r.responsavel || '-']),
        },
      ],
    });
  }

  async function handleLimparDados() {
    const confirmacao = window.confirm(
      `Isso vai apagar PERMANENTEMENTE todos os ${totalLoja} lançamentos de loja e ${totalCd} envios do CD salvos neste navegador. Esta ação não pode ser desfeita. Tem certeza?`,
    );
    if (!confirmacao) return;
    await limparTodosDados();
    setMensagem('Todos os dados locais foram apagados.');
    setErro('');
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Configurações</h1>
        <p className="text-sm text-slate-400">Backup, exportação e gerenciamento dos dados locais</p>
      </div>

      <div className="card flex gap-3 border-amber-200 bg-amber-50">
        <Info size={18} className="mt-0.5 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-800">
          Este sistema não usa login nem servidor: os dados ficam salvos apenas no navegador/dispositivo atual
          (IndexedDB). Se você abrir em outro computador, celular, outro navegador ou outro domínio, os dados{' '}
          <strong>não estarão lá</strong>. Faça backups periódicos para não perder informações.
        </p>
      </div>

      {mensagem && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{mensagem}</div>}
      {erro && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</div>}

      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Backup e restauração</h2>
        <p className="text-xs text-slate-400">
          Último backup: {ultimoBackup ? new Date(ultimoBackup).toLocaleString('pt-BR') : 'nunca feito'}
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExportarBackup} className="btn-primary">
            <DownloadCloud size={16} /> Exportar Backup JSON
          </button>
          <label className="btn-secondary cursor-pointer">
            <UploadCloud size={16} /> Importar Backup JSON
            <input type="file" accept="application/json" className="hidden" onChange={handleImportarBackup} />
          </label>
        </div>
      </div>

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
          Você tem {totalLoja} lançamento(s) de loja e {totalCd} envio(s) de CD salvos neste navegador.
        </p>
        <button onClick={handleLimparDados} className="btn-danger">
          <Trash2 size={16} /> Limpar todos os dados locais
        </button>
      </div>
    </div>
  );
}
