import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import { catalogoSeguros } from '../src/data/catalogoSeguros.js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

const ENTITIES = [
  'usuarios','seguradoras','clientes','leads','apolices','propostas',
  'comissoes','sinistros','assistencias','documentos','tarefas',
  'produtos','producaoMensal','alertas','endossos','produtores',
  'corretoras','cotacoes','historico','seguros_catalogo',
]

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
