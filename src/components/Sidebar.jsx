import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageSquarePlus, Store, Truck, Settings, X, Leaf } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/novo-lancamento', label: 'Novo Lançamento', icon: MessageSquarePlus },
  { to: '/lojas', label: 'Lojas', icon: Store },
  { to: '/cd', label: 'Centro de Distribuição', icon: Truck },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white border-r border-slate-100 transition-transform md:static md:z-auto md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Leaf size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold leading-none text-slate-800">Alere</p>
              <p className="text-xs leading-none text-slate-400">Controle de Trade</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 md:hidden">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-400">
          Dados salvos apenas neste navegador.
        </div>
      </aside>
    </>
  );
}
