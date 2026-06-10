import express from 'express'
import { usuarios, seguradoras, clientes, leads, apolices, propostas, comissoes, sinistros, assistencias, documentos, tarefas, produtos, producaoMensal, alertas, endossos, produtores, corretoras, cotacoes, historico } from '../src/data/mockData.js'

const app = express()
app.use(express.json({ limit: '2mb' }))

function ensureId(item, idx) {
  return { ...item, id: String(item.id ?? (idx + 1)) }
}

const store = {
  usuarios:      usuarios.map(ensureId),
  seguradoras:   seguradoras.map(ensureId),
  clientes:      clientes.map(ensureId),
  leads:         leads.map(ensureId),
  apolices:      apolices.map(ensureId),
  propostas:     propostas.map(ensureId),
  comissoes:     comissoes.map(ensureId),
  sinistros:     sinistros.map(ensureId),
  assistencias:  assistencias.map(ensureId),
  documentos:    documentos.map(ensureId),
  tarefas:       tarefas.map(ensureId),
  produtos:      produtos.map(ensureId),
  producaoMensal:producaoMensal.map(ensureId),
  alertas:       alertas.map(ensureId),
  endossos:      endossos.map(ensureId),
  produtores:    produtores.map(ensureId),
  corretoras:    corretoras.map(ensureId),
  cotacoes:      cotacoes.map(ensureId),
  historico:     historico.map(ensureId),
}

app.get('/api/:entity', (req, res) => {
  const list = store[req.params.entity]
  if (!list) return res.status(404).json({ error: 'Entity not found' })
  res.json([...list].reverse())
})

app.post('/api/:entity', (req, res) => {
  const list = store[req.params.entity]
  if (!list) return res.status(404).json({ error: 'Entity not found' })
  const item = { ...req.body, id: String(req.body.id || Date.now()) }
  list.push(item)
  res.status(201).json(item)
})

app.put('/api/:entity/:id', (req, res) => {
  const list = store[req.params.entity]
  if (!list) return res.status(404).json({ error: 'Entity not found' })
  const item = { ...req.body, id: req.params.id }
  const idx = list.findIndex(i => String(i.id) === req.params.id)
  if (idx >= 0) list[idx] = item; else list.push(item)
  res.json(item)
})

app.delete('/api/:entity/:id', (req, res) => {
  const list = store[req.params.entity]
  if (!list) return res.status(404).json({ error: 'Entity not found' })
  const idx = list.findIndex(i => String(i.id) === req.params.id)
  if (idx >= 0) list.splice(idx, 1)
  res.status(204).end()
})

export default app
