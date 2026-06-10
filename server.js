import express from 'express'
import Database from 'better-sqlite3'
import cors from 'cors'
import { fileURLToPath } from 'url'
import path from 'path'

import {
  usuarios, seguradoras, clientes, leads, apolices, propostas,
  comissoes, sinistros, assistencias, documentos, tarefas,
  produtos, producaoMensal, alertas, endossos, produtores, corretoras,
  cotacoes, historico,
} from './src/data/mockData.js'
import { catalogoSeguros } from './src/data/catalogoSeguros.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const db = new Database(path.join(__dirname, 'seguradora.db'))
const app = express()

app.use(cors())
app.use(express.json({ limit: '2mb' }))

const ENTITIES = {
  usuarios, seguradoras, clientes, leads, apolices, propostas,
  comissoes, sinistros, assistencias, documentos, tarefas,
  produtos, producaoMensal, alertas, endossos, produtores, corretoras,
  cotacoes, historico,
  seguros_catalogo: catalogoSeguros,
}

// Create tables and seed on first run
for (const [name, rows] of Object.entries(ENTITIES)) {
  db.exec(`CREATE TABLE IF NOT EXISTS "${name}" (id TEXT PRIMARY KEY, data TEXT NOT NULL)`)
  const count = db.prepare(`SELECT COUNT(*) as n FROM "${name}"`).get()
  if (count.n === 0) {
    const insert = db.prepare(`INSERT INTO "${name}" (id, data) VALUES (?, ?)`)
    const seed = db.transaction((items) => {
      items.forEach((item, i) => {
        const id = String(item.id ?? (i + 1))
        insert.run(id, JSON.stringify({ ...item, id }))
      })
    })
    seed(rows)
  }
}

function parseRows(rows) {
  return rows.map(r => JSON.parse(r.data))
}

// GET /api/:entity
app.get('/api/:entity', (req, res) => {
  const { entity } = req.params
  if (!ENTITIES[entity]) return res.status(404).json({ error: 'Entity not found' })
  const rows = db.prepare(`SELECT data FROM "${entity}"`).all()
  res.json(parseRows(rows))
})

// POST /api/:entity
app.post('/api/:entity', (req, res) => {
  const { entity } = req.params
  if (!ENTITIES[entity]) return res.status(404).json({ error: 'Entity not found' })
  const id = String(req.body.id || Date.now())
  const item = { ...req.body, id }
  db.prepare(`INSERT OR REPLACE INTO "${entity}" (id, data) VALUES (?, ?)`).run(id, JSON.stringify(item))
  res.status(201).json(item)
})

// PUT /api/:entity/:id
app.put('/api/:entity/:id', (req, res) => {
  const { entity, id } = req.params
  if (!ENTITIES[entity]) return res.status(404).json({ error: 'Entity not found' })
  const item = { ...req.body, id }
  const result = db.prepare(`UPDATE "${entity}" SET data = ? WHERE id = ?`).run(JSON.stringify(item), id)
  if (result.changes === 0) {
    db.prepare(`INSERT INTO "${entity}" (id, data) VALUES (?, ?)`).run(id, JSON.stringify(item))
  }
  res.json(item)
})

// DELETE /api/:entity/:id
app.delete('/api/:entity/:id', (req, res) => {
  const { entity, id } = req.params
  if (!ENTITIES[entity]) return res.status(404).json({ error: 'Entity not found' })
  db.prepare(`DELETE FROM "${entity}" WHERE id = ?`).run(id)
  res.json({ ok: true })
})

const PORT = 3001
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`))
