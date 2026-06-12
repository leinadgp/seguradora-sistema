import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Leads from './pages/Leads'
import Seguros from './pages/Seguros'
import Apolices from './pages/Apolices'
import Propostas from './pages/Propostas'
import Seguradoras from './pages/Seguradoras'
import Comissoes from './pages/Comissoes'
import Sinistros from './pages/Sinistros'
import Documentos from './pages/Documentos'
import Tarefas from './pages/Tarefas'
import Renovacoes from './pages/Renovacoes'
import Relatorios from './pages/Relatorios'
import Usuarios from './pages/Usuarios'
import Configuracoes from './pages/Configuracoes'
import MeuPerfil from './pages/MeuPerfil'
import Endossos from './pages/Endossos'
import Assistencias from './pages/Assistencias'
import Produtores from './pages/Produtores'
import Corretoras from './pages/Corretoras'
import Cotacoes from './pages/Cotacoes'
import Modelos from './pages/Modelos'
import Conversas from './pages/Conversas'

function ProtectedLayout() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Layout />
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="cotacoes" element={<Cotacoes />} />
              <Route path="leads" element={<Leads />} />
              <Route path="seguros" element={<Seguros />} />
              <Route path="apolices" element={<Apolices />} />
              <Route path="propostas" element={<Propostas />} />
              <Route path="seguradoras" element={<Seguradoras />} />
              <Route path="comissoes" element={<Comissoes />} />
              <Route path="sinistros" element={<Sinistros />} />
              <Route path="documentos" element={<Documentos />} />
              <Route path="tarefas" element={<Tarefas />} />
              <Route path="renovacoes" element={<Renovacoes />} />
              <Route path="endossos" element={<Endossos />} />
              <Route path="assistencias" element={<Assistencias />} />
              <Route path="relatorios" element={<Relatorios />} />
              <Route path="produtores" element={<Produtores />} />
              <Route path="corretoras" element={<Corretoras />} />
              <Route path="equipe" element={<Navigate to="/produtores" replace />} />
              <Route path="meu-perfil" element={<MeuPerfil />} />
              <Route path="usuarios" element={<Usuarios />} />
              <Route path="configuracoes" element={<Configuracoes />} />
              <Route path="modelos" element={<Modelos />} />
              <Route path="conversas" element={<Conversas />} />
            </Route>
          </Routes>
        </AppProvider>
      </AuthProvider>
    </HashRouter>
  )
}
