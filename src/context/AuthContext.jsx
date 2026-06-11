import { createContext, useContext, useState } from 'react'
import api from '../api/client'
import { setCurrentUser } from '../lib/flow'

const AuthContext = createContext(null)
const STORAGE_KEY = 'seguro_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem(STORAGE_KEY))
      if (u) setCurrentUser(u.nome || u.email)
      return u
    } catch { return null }
  })

  async function login(email, password) {
    const { user: authUser } = await api.post('auth/login', { email, password })
    let fullUser = authUser
    try {
      const lista = await api.getAll('usuarios')
      const perfil = lista.find(u => u.email?.toLowerCase() === authUser.email?.toLowerCase())
      if (perfil) {
        fullUser = {
          ...authUser,
          nome: perfil.nome || authUser.nome,
          cargo: perfil.cargo || '',
          perfil: perfil.perfil || 'corretor',
          telefone: perfil.telefone || '',
          usuarioId: perfil.id,
        }
      }
    } catch {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullUser))
    setCurrentUser(fullUser.nome || fullUser.email)
    setUser(fullUser)
  }

  async function updateProfile(campos) {
    const lista = await api.getAll('usuarios')
    const current = lista.find(u => u.id === user?.usuarioId || u.email?.toLowerCase() === user?.email?.toLowerCase())
    if (!current) throw new Error('Perfil não encontrado. Faça login novamente.')
    const updated = { ...current, ...campos }
    await api.put('usuarios', current.id, updated)
    const newUser = { ...user, ...campos }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
    setCurrentUser(newUser.nome || newUser.email)
    setUser(newUser)
  }

  function logout() {
    api.post('auth/logout', {}).catch(() => {})
    localStorage.removeItem(STORAGE_KEY)
    setCurrentUser('Sistema')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
