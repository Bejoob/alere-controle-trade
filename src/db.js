import Dexie from 'dexie';

export const db = new Dexie('AlereControleTradeDB');

db.version(1).stores({
  estoqueLoja: '++id, empresa, loja, produto, validade, dataVisita, statusValidade, criadoEm',
  centroDistribuicao: '++id, produto, lojaDestino, responsavel, dataVisita, criadoEm',
});

export const TABLES = {
  LOJA: 'estoqueLoja',
  CD: 'centroDistribuicao',
};

export default db;
