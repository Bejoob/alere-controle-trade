import db from '../db.js';
import { parseWhatsAppMessage } from './parser.js';
import { calcularDiasParaVencer, calcularStatusValidade } from './status.js';
import { diaDaSemana } from './format.js';

const MSG_LOJA_46_VISITA1 = `Alere
Loja: 46

Proteico
20 unidades 04/10/2026

Alecrim
22 unidades 10/11/2026

Cebolinha
12 unidades 09/10/2026

Tomate
18 unidades 09/11/2026

Manjericão
09 unidades 10/05/2026`;

const MSG_LOJA_46_VISITA2 = `Alere
Loja: 46

Proteico
14 unidades 04/10/2026

Alecrim
17 unidades 10/11/2026

Cebolinha
08 unidades 09/10/2026

Tomate
14 unidades 09/11/2026

Manjericão
06 unidades 10/05/2026`;

const MSG_LOJA_36_VISITA1 = `Alere
Loja: 36

## Proteico

Alecrim
10 unidades 25/10/2026
20 unidades 10/11/2026

Cebolinha
05 unidades 05/09/2026
15 unidades 11/08/2026

Tomate
10 unidades 09/11/2026
20 unidades 21/10/2026`;

const MSG_LOJA_36_VISITA2 = `Alere
Loja: 36

## Proteico

Alecrim
04 unidades 25/10/2026
15 unidades 10/11/2026

Cebolinha
01 unidades 05/09/2026
11 unidades 11/08/2026

Tomate
04 unidades 09/11/2026
15 unidades 21/10/2026`;

const VISITAS_EXEMPLO = [
  { mensagem: MSG_LOJA_46_VISITA1, dataVisita: '2026-05-20' },
  { mensagem: MSG_LOJA_46_VISITA2, dataVisita: '2026-06-20' },
  { mensagem: MSG_LOJA_36_VISITA1, dataVisita: '2026-05-15' },
  { mensagem: MSG_LOJA_36_VISITA2, dataVisita: '2026-06-18' },
];

const ENVIOS_EXEMPLO = [
  { dataVisita: '2026-06-15', produto: 'Proteico', quantidadeEnviada: 40, lojaDestino: '46', responsavel: 'Carlos Souza', observacoes: 'Reposição mensal' },
  { dataVisita: '2026-06-15', produto: 'Alecrim', quantidadeEnviada: 30, lojaDestino: '46', responsavel: 'Carlos Souza', observacoes: '' },
  { dataVisita: '2026-06-10', produto: 'Tomate', quantidadeEnviada: 25, lojaDestino: '36', responsavel: 'Fernanda Lima', observacoes: 'Entrega parcial' },
  { dataVisita: '2026-05-28', produto: 'Cebolinha', quantidadeEnviada: 18, lojaDestino: '36', responsavel: 'Fernanda Lima', observacoes: '' },
];

let seedTentado = false;

/** Popula o banco com dados de exemplo apenas se ainda estiver vazio. */
export async function seedExemplos() {
  if (seedTentado) return; // evita corrida ao rodar 2x no StrictMode do React em dev
  seedTentado = true;

  const [countLoja, countCd] = await Promise.all([db.estoqueLoja.count(), db.centroDistribuicao.count()]);
  if (countLoja > 0 || countCd > 0) return;

  const registros = [];
  for (const { mensagem, dataVisita } of VISITAS_EXEMPLO) {
    const { empresa, loja, itens } = parseWhatsAppMessage(mensagem);
    for (const item of itens) {
      registros.push({
        origem: 'LOJA',
        empresa: empresa || 'Alere',
        loja,
        produto: item.produto,
        quantidade: item.quantidade,
        validade: item.validade,
        dataVisita,
        diasParaVencer: calcularDiasParaVencer(item.validade, dataVisita),
        statusValidade: calcularStatusValidade(item.validade, dataVisita),
        criadoEm: new Date(dataVisita).toISOString(),
      });
    }
  }
  await db.estoqueLoja.bulkAdd(registros);

  await db.centroDistribuicao.bulkAdd(
    ENVIOS_EXEMPLO.map((e) => ({
      origem: 'CD',
      ...e,
      diaSemana: diaDaSemana(e.dataVisita),
      criadoEm: new Date(e.dataVisita).toISOString(),
    })),
  );
}
