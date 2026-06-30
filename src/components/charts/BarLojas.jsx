import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function BarLojas({ data }) {
  if (!data || data.length === 0) {
    return <p className="py-16 text-center text-sm text-slate-400">Sem dados de estoque ainda.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="loja" tickFormatter={(v) => `Loja ${v}`} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip formatter={(v) => [v, 'Unidades']} labelFormatter={(v) => `Loja ${v}`} />
        <Bar dataKey="total" radius={[8, 8, 0, 0]} fill="#16a34a" />
      </BarChart>
    </ResponsiveContainer>
  );
}
