import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

const GRUPO_META = {
  'Seguros de Pessoas':                        { icone: 'users',  cor: '#8B5CF6', modulo: 'seguro' },
  'Seguros Patrimoniais':                      { icone: 'home',   cor: '#10B981', modulo: 'seguro' },
  'Seguros de Automóveis e Transportes':       { icone: 'car',    cor: '#3B82F6', modulo: 'seguro' },
  'Seguros Rurais':                            { icone: 'leaf',   cor: '#F59E0B', modulo: 'seguro' },
  'Seguros Financeiros e Responsabilidade Civil': { icone: 'shield', cor: '#EF4444', modulo: 'seguro' },
}

const SAUDE_MODULO = ['Seguro Saúde e Odontológico']

function slug(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseCoberturas(basicas, adicionais) {
  const split = str => str
    ? str.split(',').map(s => s.trim()).filter(Boolean)
    : []
  return [...split(basicas), ...split(adicionais)]
}

function transformar(catalogo) {
  const registros = []
  let ordem = 1

  for (const [grupo, itens] of Object.entries(catalogo)) {
    const meta = GRUPO_META[grupo] || { icone: 'shield', cor: '#6B7280', modulo: 'seguro' }

    for (const item of itens) {
      const id = slug(item.nome)
      const coberturas = parseCoberturas(item.coberturas_basicas, item.coberturas_adicionais)
      const subcats = item.subcategorias
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map((nome, idx) => ({
          id: `${id}-sub-${idx + 1}`,
          nome,
          ativo: true,
          ordem: idx + 1,
          coberturas,
        }))

      registros.push({
        id,
        tipo: item.nome,
        ramo: item.nome.toUpperCase(),
        categoria: grupo,
        modulo: SAUDE_MODULO.includes(item.nome) ? 'saude' : meta.modulo,
        icone: meta.icone,
        cor: meta.cor,
        ordem: ordem++,
        ativo: true,
        subcategorias: subcats,
      })
    }
  }

  return registros
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const json = JSON.parse(readFileSync(join(__dirname, 'novo-catalogo.json'), 'utf-8'))
  const registros = transformar(json)

  console.log(`\n📋 ${registros.length} tipos de seguro para importar:\n`)
  for (const r of registros) {
    console.log(`  [${r.modulo}] ${r.tipo}`)
    console.log(`    Subcategorias: ${r.subcategorias.map(s => s.nome).join(', ')}`)
    console.log(`    Coberturas: ${r.subcategorias[0]?.coberturas?.length || 0} coberturas`)
  }

  if (dryRun) {
    console.log('\n🔍 DRY-RUN — nenhuma alteração no banco.\n')
    return
  }

  // 1. Limpar catálogo existente
  console.log('\n🗑️  Removendo catálogo anterior...')
  const { error: delError } = await supabase
    .from('seguros_catalogo')
    .delete()
    .neq('id', '__placeholder__') // deleta tudo

  if (delError) {
    console.error('Erro ao limpar catálogo:', delError.message)
    process.exit(1)
  }
  console.log('✅ Catálogo anterior removido.')

  // 2. Inserir novos registros
  console.log('\n📥 Inserindo novos registros...')
  for (const reg of registros) {
    const { error } = await supabase
      .from('seguros_catalogo')
      .upsert({ id: reg.id, data: reg })

    if (error) {
      console.error(`  ❌ Erro em "${reg.tipo}":`, error.message)
    } else {
      console.log(`  ✅ ${reg.tipo}`)
    }
  }

  console.log('\n🎉 Importação concluída!\n')
}

main().catch(err => { console.error(err); process.exit(1) })
