import Papa from 'papaparse';
import { downloadBlob } from './download.js';

export function exportarCSV(dados, nomeArquivo) {
  if (!dados || dados.length === 0) return;
  const csv = Papa.unparse(dados);
  downloadBlob(csv, nomeArquivo, 'text/csv;charset=utf-8;');
}
