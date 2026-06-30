import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CORES = ['#16a34a', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

export default function PieProdutos({ data }) {
  if (!data || data.length === 0) {
    return <p className="py-16 text-center text-sm text-slate-400">Sem dados de estoque ainda.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="produto" innerRadius={58} outerRadius={95} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={CORES[i % CORES.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
