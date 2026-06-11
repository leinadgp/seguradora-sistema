import express from 'express'
import { createClient } from '@supabase/supabase-js'
import cors from 'cors'

import {
  usuarios, seguradoras, clientes, leads, apolices, propostas,
  comissoes, sinistros, assistencias, documentos, tarefas,
  produtos, producaoMensal, alertas, endossos, produtores, corretoras,
  cotacoes, historico,
} from './src/data/mockData.js'
import { catalogoSeguros } from './src/data/catalogoSeguros.js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
const app = express()

app.use(cors())
app.use(express.json({ limit: '2mb' }))

const ENTITIES = {
  usuarios, seguradoras, clientes, leads, apolices, propostas,
  comissoes, sinistros, assistencias, documentos, tarefas,
  produtos, producaoMensal, alertas, endossos, produtores, corretoras,
  cotacoes, historico,
  seguros_catalogo: catalogoSeguros,
  configuracoes: [],
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' })
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data?.user) return res.status(401).json({ error: error?.message || 'Credenciais inválidas.' })
  // Bloquear usuários inativos na tabela usuarios
  const { data: rows } = await supabase.from('usuarios').select('data')
  const perfil = rows?.map(r => r.data).find(u => u?.email?.toLowerCase() === email.toLowerCase())
  if (perfil?.status === 'inativo') {
    return res.status(403).json({ error: 'Usuário inativo. Contate o administrador do sistema.' })
  }
  res.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      nome: data.user.user_metadata?.nome || data.user.email.split('@')[0],
    }
  })
})

app.post('/api/auth/logout', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/auth/change-password', async (req, res) => {
  const { email, currentPassword, newPassword } = req.body || {}
  if (!email || !currentPassword || !newPassword) return res.status(400).json({ error: 'Todos os campos são obrigatórios.' })
  if (newPassword.length < 6) return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' })
  const { error: authError } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
  if (authError) return res.status(401).json({ error: 'Senha atual incorreta.' })
  const { data: lista, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr) return res.status(500).json({ error: listErr.message })
  const authUser = lista?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
  if (!authUser) return res.status(404).json({ error: 'Usuário não encontrado.' })
  const { error: updateErr } = await supabase.auth.admin.updateUserById(authUser.id, { password: newPassword })
  if (updateErr) return res.status(500).json({ error: updateErr.message })
  res.json({ ok: true })
})

app.post('/api/auth/admin/create-user', async (req, res) => {
  const { email, password, nome } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' })
  const { data: lista, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr) return res.status(500).json({ error: listErr.message })
  const existente = lista?.users?.find(u => u.email === email)
  if (existente) {
    const { data, error } = await supabase.auth.admin.updateUserById(existente.id, {
      password,
      email_confirm: true,
      user_metadata: { nome: nome || email.split('@')[0] },
    })
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ ok: true, userId: data.user.id, updated: true })
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome: nome || email.split('@')[0] },
  })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true, userId: data.user.id, created: true })
})

// ──────────────────────────────────────────────────────────────────────────────

// GET /api/:entity
app.get('/api/:entity', async (req, res) => {
  const { entity } = req.params
  if (!ENTITIES[entity]) return res.status(404).json({ error: 'Entity not found' })
  const { data, error } = await supabase.from(entity).select('data')
  if (error) return res.status(500).json({ error: error.message })
  // Fallback para dados locais quando Supabase está vazio (apenas seguros_catalogo)
  if (!data.length && entity === 'seguros_catalogo') return res.json(catalogoSeguros)
  res.json(data.map(r => r.data))
})

// POST /api/:entity
app.post('/api/:entity', async (req, res) => {
  const { entity } = req.params
  if (!ENTITIES[entity]) return res.status(404).json({ error: 'Entity not found' })
  const id = String(req.body.id || Date.now())
  const item = { ...req.body, id }
  const { error } = await supabase.from(entity).upsert({ id, data: item })
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(item)
})

// PUT /api/:entity/:id
app.put('/api/:entity/:id', async (req, res) => {
  const { entity, id } = req.params
  if (!ENTITIES[entity]) return res.status(404).json({ error: 'Entity not found' })
  const item = { ...req.body, id }
  const { error } = await supabase.from(entity).upsert({ id, data: item })
  if (error) return res.status(500).json({ error: error.message })
  res.json(item)
})

// DELETE /api/:entity/:id
app.delete('/api/:entity/:id', async (req, res) => {
  const { entity, id } = req.params
  if (!ENTITIES[entity]) return res.status(404).json({ error: 'Entity not found' })
  const { error } = await supabase.from(entity).delete().eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`))
