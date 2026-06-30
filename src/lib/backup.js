import db from '../db.js';
import { downloadBlob } from './download.js';

const ULTIMO_BACKUP_KEY = 'alere_ultimo_backup';

export async function exportarBackupJSON() {
  const estoqueLoja = await db.estoqueLoja.toArray();
  const centroDistribuicao = await db.centroDistribuicao.toArray();
  const payload = {
    app: 'alere-controle-trade',
    versao: 1,
    exportadoEm: new Date().toISOString(),
    estoqueLoja,
    centroDistribuicao,
  };
  downloadBlob(JSON.stringify(payload, null, 2), `alere-backup-${Date.now()}.json`, 'application/json');
  localStorage.setItem(ULTIMO_BACKUP_KEY, new Date().toISOString());
  return payload;
}

export async function importarBackupJSON(file) {
  const texto = await file.text();
  const payload = JSON.parse(texto);
  if (!payload || (!Array.isArray(payload.estoqueLoja) && !Array.isArray(payload.centroDistribuicao))) {
    throw new Error('Arquivo de backup inválido: estrutura não reconhecida.');
  }

  const lojaSemId = (payload.estoqueLoja || []).map(({ id, ...resto }) => resto);
  const cdSemId = (payload.centroDistribuicao || []).map(({ id, ...resto }) => resto);

  await db.transaction('rw', db.estoqueLoja, db.centroDistribuicao, async () => {
    await db.estoqueLoja.clear();
    await db.centroDistribuicao.clear();
    if (lojaSemId.length) await db.estoqueLoja.bulkAdd(lojaSemId);
    if (cdSemId.length) await db.centroDistribuicao.bulkAdd(cdSemId);
  });

  return { totalLoja: lojaSemId.length, totalCd: cdSemId.length };
}

export function getUltimoBackup() {
  return localStorage.getItem(ULTIMO_BACKUP_KEY);
}

export async function limparTodosDados() {
  await db.transaction('rw', db.estoqueLoja, db.centroDistribuicao, async () => {
    await db.estoqueLoja.clear();
    await db.centroDistribuicao.clear();
  });
}
