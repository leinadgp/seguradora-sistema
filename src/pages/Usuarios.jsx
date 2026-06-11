import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Usuarios() {
  const { user } = useAuth()
  const isManager = user?.perfil === 'admin' || user?.perfil === 'gestor'
  return <Navigate to={isManager ? '/configuracoes' : '/meu-perfil'} replace />
}
