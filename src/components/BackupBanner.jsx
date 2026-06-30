import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { getUltimoBackup } from '../lib/backup.js';

const DIAS_LIMITE = 7;

export default function BackupBanner() {
  const [dismissed, setDismissed] = useState(false);
  const ultimo = getUltimoBackup();
  const diasSemBackup = ultimo
    ? Math.floor((Date.now() - new Date(ultimo).getTime()) / 86400000)
    : null;
  const deveAvisar = diasSemBackup === null || diasSemBackup >= DIAS_LIMITE;

  if (dismissed || !deveAvisar) return null;

  return (
    <div className="mb-6 flex items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <div className="flex items-start gap-2">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        <span>
          {ultimo
            ? `Último backup em ${new Date(ultimo).toLocaleString('pt-BR')}. Os dados ficam salvos apenas neste navegador — faça backup periódico em Configurações.`
            : 'Você ainda não fez nenhum backup. Os dados ficam salvos apenas neste navegador/dispositivo — exporte um backup em Configurações.'}
        </span>
      </div>
      <button onClick={() => setDismissed(true)} className="shrink-0 text-amber-600 hover:text-amber-800">
        <X size={16} />
      </button>
    </div>
  );
}
