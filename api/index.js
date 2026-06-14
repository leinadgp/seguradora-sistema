import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import { catalogoSeguros } from '../src/data/catalogoSeguros.js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

const ENTITIES = [
  'usuarios', 'seguradoras', 'clientes', 'leads', 'apolices', 'propostas',
  'comissoes', 'sinistros', 'assistencias', 'documentos', 'tarefas',
  'produtos', 'producaoMensal', 'alertas', 'endossos', 'produtores',
  'corretoras', 'cotacoes', 'historico', 'seguros_catalogo', 'configuracoes',
  'solicitacoes_documentos', 'modelos',
]

// ─── AUTH ──────────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' })
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data?.user) return res.status(401).json({ error: error?.message || 'Credenciais inválidas.' })
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

// ─── PORTAL PÚBLICO DE DOCUMENTOS ─────────────────────────────────────────

app.get('/api/portal/:token', async (req, res) => {
  const { token } = req.params
  const { data, error } = await supabase.from('solicitacoes_documentos').select('data').eq('id', token).single()
  if (error || !data) return res.status(404).json({ error: 'Solicitação não encontrada.' })
  res.json(data.data)
})

app.put('/api/portal/:token', async (req, res) => {
  const { token } = req.params
  const item = { ...req.body, id: token }
  const { error } = await supabase.from('solicitacoes_documentos').upsert({ id: token, data: item })
  if (error) return res.status(500).json({ error: error.message })

  // Sincroniza docs com arquivo enviado na tabela 'documentos'
  const docsArr = item.documentos || []
  for (let i = 0; i < docsArr.length; i++) {
    const doc = docsArr[i]
    if (!doc.dataUrl) continue
    const docId = `portal_${token}_${i}`
    await supabase.from('documentos').upsert({
      id: docId,
      data: {
        id: docId,
        clienteId: item.clienteId || '',
        cliente: item.cliente || '',
        tipo: doc.tipo,
        nome: doc.nome || doc.tipo,
        status: doc.status || 'enviado',
        observacoes: doc.observacoes || '',
        dataUrl: doc.dataUrl,
        fileType: doc.fileType || '',
        fileSize: doc.fileSize || 0,
        dataEnvio: doc.dataEnvio || new Date().toISOString().split('T')[0],
        origem: 'portal',
        portalId: token,
      }
    })
  }

  res.json(item)
})

// ─── CRUD GENÉRICO ─────────────────────────────────────────────────────────

app.get('/api/:entity', async (req, res) => {
  const { entity } = req.params
  if (!ENTITIES.includes(entity)) return res.status(404).json({ error: 'Entity not found' })
  const { data, error } = await supabase.from(entity).select('data')
  if (error) return res.status(500).json({ error: error.message })
  if (!data.length && entity === 'seguros_catalogo') return res.json(catalogoSeguros)
  res.json(data.map(r => r.data))
})

app.post('/api/:entity', async (req, res) => {
  const { entity } = req.params
  if (!ENTITIES.includes(entity)) return res.status(404).json({ error: 'Entity not found' })
  const id = String(req.body.id || Date.now())
  const item = { ...req.body, id }
  const { error } = await supabase.from(entity).upsert({ id, data: item })
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(item)
})

app.put('/api/:entity/:id', async (req, res) => {
  const { entity, id } = req.params
  if (!ENTITIES.includes(entity)) return res.status(404).json({ error: 'Entity not found' })
  const item = { ...req.body, id }
  const { error } = await supabase.from(entity).upsert({ id, data: item })
  if (error) return res.status(500).json({ error: error.message })

  // Quando operador aprova/rejeita doc do portal, atualiza status em 'documentos'
  if (entity === 'solicitacoes_documentos' && item.documentos) {
    for (let i = 0; i < item.documentos.length; i++) {
      const doc = item.documentos[i]
      const docId = `portal_${id}_${i}`
      const { data: existing } = await supabase.from('documentos').select('id').eq('id', docId).single()
      if (existing) {
        await supabase.from('documentos').upsert({
          id: docId,
          data: {
            id: docId,
            clienteId: item.clienteId || '',
            cliente: item.cliente || '',
            tipo: doc.tipo,
            nome: doc.nome || doc.tipo,
            status: doc.status,
            observacoes: doc.observacoes || '',
            dataUrl: doc.dataUrl || '',
            fileType: doc.fileType || '',
            fileSize: doc.fileSize || 0,
            dataEnvio: doc.dataEnvio || new Date().toISOString().split('T')[0],
            origem: 'portal',
            portalId: id,
          }
        })
      }
    }
  }

  res.json(item)
})

app.delete('/api/:entity/:id', async (req, res) => {
  const { entity, id } = req.params
  if (!ENTITIES.includes(entity)) return res.status(404).json({ error: 'Entity not found' })
  const { error } = await supabase.from(entity).delete().eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

export default app
