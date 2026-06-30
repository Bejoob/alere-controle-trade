import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NovoLancamento from './pages/NovoLancamento.jsx';
import Lojas from './pages/Lojas.jsx';
import CentroDistribuicao from './pages/CentroDistribuicao.jsx';
import Configuracoes from './pages/Configuracoes.jsx';
import { seedExemplos } from './lib/seed.js';

export default function App() {
  useEffect(() => {
    seedExemplos();
  }, []);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/novo-lancamento" element={<NovoLancamento />} />
        <Route path="/lojas" element={<Lojas />} />
        <Route path="/cd" element={<CentroDistribuicao />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Routes>
    </Layout>
  );
}
