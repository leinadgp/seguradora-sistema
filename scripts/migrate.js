/**
 * Migration via Supabase Management API
 * Executa: node scripts/migrate.js
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fnchexkizfrwlovkpafw.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuY2hleGtpemZyd2xvdmtwYWZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTEwMjMzNSwiZXhwIjoyMDk2Njc4MzM1fQ.UR5gjhgfmEst2PbxyNgySVlyCLP7RztLFNZa5XySJRI'
const PROJECT_REF = 'fnchexkizfrwlovkpafw'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function tableExists(name) {
  const { error } = await supabase.from(name).select('id').limit(1)
  if (!error) return true
  return !error.message.includes('does not exist') && !error.message.includes('relation')
}

async function runSQL(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  })
  return res.json()
}

async function migrate() {
  console.log('Verificando tabela configuracoes...')

  const exists = await tableExists('configuracoes')
  if (exists) {
    console.log('✓ Tabela configuracoes já existe.')
    return
  }

  console.log('Tabela não encontrada. Criando via Management API...')
  const result = await runSQL('CREATE TABLE IF NOT EXISTS "configuracoes" (id TEXT PRIMARY KEY, data JSONB NOT NULL);')

  if (result.error || result.message) {
    console.error('✗ Erro:', result.error || result.message)
    console.log('\nNota: A Management API requer um Personal Access Token do Supabase (não a service_role key).')
    console.log('Para criar manualmente, acesse: https://supabase.com/dashboard/project/fnchexkizfrwlovkpafw/sql/new')
    console.log('E execute: CREATE TABLE IF NOT EXISTS "configuracoes" (id TEXT PRIMARY KEY, data JSONB NOT NULL);')
  } else {
    console.log('✓ Tabela configuracoes criada com sucesso!')
  }
}

migrate().catch(console.error)
