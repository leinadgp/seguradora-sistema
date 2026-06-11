/**
 * Sincroniza o catálogo local (catalogoSeguros.js) ao Supabase.
 * Executa: node scripts/seed-catalogo.js
 *
 * Faz UPSERT de cada entrada — seguro para rodar múltiplas vezes.
 */

import { createClient } from '@supabase/supabase-js'
import { catalogoSeguros } from '../src/data/catalogoSeguros.js'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fnchexkizfrwlovkpafw.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuY2hleGtpemZyd2xvdmtwYWZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTEwMjMzNSwiZXhwIjoyMDk2Njc4MzM1fQ.UR5gjhgfmEst2PbxyNgySVlyCLP7RztLFNZa5XySJRI'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function seed() {
  console.log(`Sincronizando ${catalogoSeguros.length} entradas do catálogo...`)

  let ok = 0
  let erros = 0

  for (const entrada of catalogoSeguros) {
    const { error } = await supabase
      .from('seguros_catalogo')
      .upsert({ id: entrada.id, data: entrada })

    if (error) {
      console.error(`  ✗ ${entrada.id}: ${error.message}`)
      erros++
    } else {
      console.log(`  ✓ ${entrada.id} (${entrada.tipo}) — ativo: ${entrada.ativo}`)
      ok++
    }
  }

  console.log(`\nConcluído: ${ok} atualizados, ${erros} erros.`)

  if (erros === 0) {
    console.log('Catálogo ATTENTI sincronizado com sucesso no Supabase.')
  }
}

seed().catch(err => {
  console.error('Falha no seed:', err)
  process.exit(1)
})
