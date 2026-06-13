/**
 * Limpa todos os dados fictícios (mock) do Supabase.
 * Mantém: seguros_catalogo, usuarios, configuracoes, conversas, mensagens
 *
 * Usage:
 *   node scripts/limpar-dados-ficticios.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function loadEnv() {
  const envPath = path.join(__dirname, '../.env')
  const content = fs.readFileSync(envPath, 'utf-8')
  return Object.fromEntries(
    content.split('\n')
      .filter(l => l.includes('=') && !l.startsWith('#'))
      .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
  )
}

const env = loadEnv()
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY)

const TABELAS = [
  'apolices',
  'assistencias',
  'alertas',
  'clientes',
  'comissoes',
  'corretoras',
  'cotacoes',
  'documentos',
  'endossos',
  'historico',
  'leads',
  'producaoMensal',
  'produtores',
  'propostas',
  'seguradoras',
  'sinistros',
  'tarefas',
]

async function limpar() {
  console.log('='.repeat(60))
  console.log(' Limpeza de dados fictícios — Supabase')
  console.log(' Mantendo: seguros_catalogo, usuarios, configuracoes,')
  console.log('           conversas, mensagens')
  console.log('='.repeat(60))

  for (const tabela of TABELAS) {
    const { error, count } = await supabase
      .from(tabela)
      .delete()
      .neq('id', '__nenhum__')  // deleta todos os registros

    if (error) {
      console.log(`  ✗ ${tabela.padEnd(20)} ${error.message}`)
    } else {
      console.log(`  ✓ ${tabela.padEnd(20)} limpa`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(' Limpeza concluída. Pronto para importar dados reais.')
  console.log('='.repeat(60))
}

limpar().catch(err => {
  console.error('\n✗ Erro fatal:', err.message)
  process.exit(1)
})
