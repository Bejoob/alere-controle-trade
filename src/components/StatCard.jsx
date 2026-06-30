const TONES = {
  default: 'bg-slate-50 text-slate-600',
  green: 'bg-emerald-50 text-emerald-600',
  yellow: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
};

export default function StatCard({ icon: Icon, label, value, hint, tone = 'default' }) {
  return (
    <div className="card flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-800">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      </div>
      {Icon && (
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}>
          <Icon size={20} />
        </span>
      )}
    </div>
  );
}
