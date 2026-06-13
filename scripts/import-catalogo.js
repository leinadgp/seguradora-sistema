/**
 * Import catálogo de ramos/coberturas do SGCOR → Supabase (seguros_catalogo)
 *
 * Usage:
 *   node scripts/import-catalogo.js             (importa tudo)
 *   node scripts/import-catalogo.js --dry-run   (preview, sem gravação)
 *
 * Fonte: ../CATALOGO_RAMOS_COBERTURAS.json (pasta pai do projeto)
 *
 * Estrutura gerada por registro:
 *   { id, tipo, ramo, modulo, icone, cor, ordem, ativo, subcategorias[] }
 *   subcategoria: { id, nome, sgcorId, classificacao, ativo, ordem, coberturas[] }
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DRY_RUN = process.argv.includes('--dry-run')

// ── Env ──────────────────────────────────────────────────────────────────────
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

// ── Módulo por grupo ──────────────────────────────────────────────────────────
const MODULO_POR_GRUPO = {
  G05: 'saude',
}

// ── Transform ────────────────────────────────────────────────────────────────
function transformar(catalogo) {
  return catalogo.grupos.map((grupo, idx) => {
    const modulo = MODULO_POR_GRUPO[grupo.id] || 'seguro'

    const subcategorias = grupo.ramos.map((ramo, rIdx) => ({
      id:            `sub_${ramo.sgcorId}`,
      nome:          ramo.nome,
      nomeOriginal:  ramo.nomeOriginal,
      sgcorId:       ramo.sgcorId,
      classificacao: ramo.classificacao,
      ativo:         ramo.ativo !== false,
      ordem:         rIdx + 1,
      coberturas:    (ramo.coberturas || []).map(c => c.nome),
    }))

    return {
      id:   grupo.id.toLowerCase(),   // 'g01', 'g02', ...
      data: {
        id:            grupo.id.toLowerCase(),
        tipo:          grupo.nome,
        ramo:          grupo.nome.toUpperCase(),
        modulo,
        icone:         grupo.icone,
        cor:           grupo.cor,
        ordem:         idx + 1,
        ativo:         true,
        subcategorias,
      }
    }
  })
}

// ── Upsert ───────────────────────────────────────────────────────────────────
async function upsertBatch(records) {
  if (DRY_RUN) {
    console.log(`\n[DRY-RUN] Seriam inseridos/atualizados ${records.length} grupos:`)
    records.forEach(r => {
      const subs = r.data.subcategorias
      const totalCobs = subs.reduce((acc, s) => acc + s.coberturas.length, 0)
      console.log(`  • ${r.data.tipo.padEnd(30)} ${subs.length} ramos   ${totalCobs} coberturas`)
    })
    return
  }

  for (const record of records) {
    const { error } = await supabase
      .from('seguros_catalogo')
      .upsert(record)

    if (error) {
      console.error(`  ✗ Erro ao inserir "${record.data.tipo}":`, error.message)
    } else {
      const subs = record.data.subcategorias
      const totalCobs = subs.reduce((acc, s) => acc + s.coberturas.length, 0)
      console.log(`  ✓ ${record.data.tipo.padEnd(30)} ${subs.length} ramos   ${totalCobs} coberturas`)
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const catalogoPath = path.join(__dirname, '..', '..', 'CATALOGO_RAMOS_COBERTURAS.json')

  if (!fs.existsSync(catalogoPath)) {
    console.error('✗ Arquivo não encontrado:', catalogoPath)
    process.exit(1)
  }

  const catalogo = JSON.parse(fs.readFileSync(catalogoPath, 'utf-8'))
  const records = transformar(catalogo)

  const totalRamos = records.reduce((a, r) => a + r.data.subcategorias.length, 0)
  const totalCobs  = records.reduce((a, r) => a + r.data.subcategorias.reduce((b, s) => b + s.coberturas.length, 0), 0)

  console.log('='.repeat(60))
  console.log(' Catálogo SGCOR → Supabase (seguros_catalogo)')
  console.log(DRY_RUN ? ' Modo: DRY-RUN (sem gravação)' : ' Modo: PRODUÇÃO (gravando no Supabase)')
  console.log('='.repeat(60))
  console.log(` Grupos:    ${records.length}`)
  console.log(` Ramos:     ${totalRamos}`)
  console.log(` Coberturas:${totalCobs}`)
  console.log('='.repeat(60))

  await upsertBatch(records)

  console.log('\n' + '='.repeat(60))
  console.log(DRY_RUN ? ' DRY-RUN concluído. Nenhum dado foi gravado.' : ' Importação concluída!')
  console.log('='.repeat(60))
}

main().catch(err => {
  console.error('\n✗ Erro fatal:', err.message)
  process.exit(1)
})
