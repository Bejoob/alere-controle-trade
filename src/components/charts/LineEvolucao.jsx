import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatDateBR } from '../../lib/format.js';

export default function LineEvolucao({ data }) {
  if (!data || data.length === 0) {
    return <p className="py-16 text-center text-sm text-slate-400">Sem histórico de visitas suficiente.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="dataVisita" tickFormatter={formatDateBR} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip labelFormatter={formatDateBR} formatter={(v) => [v, 'Unidades']} />
        <Line type="monotone" dataKey="quantidade" stroke="#15803d" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
