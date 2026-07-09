import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NovoLancamento from './pages/NovoLancamento.jsx';
import Lojas from './pages/Lojas.jsx';
import CentroDistribuicao from './pages/CentroDistribuicao.jsx';
import Configuracoes from './pages/Configuracoes.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/rede/zona-sul" replace />} />
        <Route path="/rede/:redeSlug" element={<Dashboard />} />
        <Route path="/novo-lancamento" element={<NovoLancamento />} />
        <Route path="/lojas" element={<Lojas />} />
        <Route path="/cd" element={<CentroDistribuicao />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Routes>
    </Layout>
  );
}
