import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar.jsx';
import BackupBanner from './BackupBanner.jsx';

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-slate-100 bg-white px-4 md:hidden">
          <button onClick={() => setOpen(true)} className="text-slate-500">
            <Menu size={22} />
          </button>
          <span className="font-semibold text-slate-800">Alere · Controle de Trade</span>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8">
          <BackupBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
