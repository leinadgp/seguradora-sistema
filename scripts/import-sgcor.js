/**
 * Import SGCOR CSV exports → Supabase
 *
 * Usage:
 *   node scripts/import-sgcor.js             (imports all)
 *   node scripts/import-sgcor.js --dry-run   (preview, no writes)
 *   node scripts/import-sgcor.js --only=seguradoras
 *   node scripts/import-sgcor.js --only=corretoras
 *   node scripts/import-sgcor.js --only=produtores
 *
 * Data source: ../companhias/, ../Corretoras/, ../produtores/
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Root of the repository (parent of the project folder)
const DATA_ROOT = path.join(__dirname, '..', '..')

const DRY_RUN = process.argv.includes('--dry-run')
const ONLY = (process.argv.find(a => a.startsWith('--only=')) || '').replace('--only=', '')

// ── Environment ──────────────────────────────────────────────────────────────
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

// ── CSV Parser (handles semicolon delimiter, quoted fields, multiline, latin1) ─
function parseCSVFile(filePath) {
  // Read as binary then decode as latin1 to handle Windows-1252 Portuguese chars
  const raw = fs.readFileSync(filePath)
  const content = raw.toString('latin1').replace(/\r/g, '')

  const rows = []
  let current = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < content.length; i++) {
    const c = content[i]
    if (c === '"') {
      inQuotes = !inQuotes
    } else if (c === ';' && !inQuotes) {
      current.push(field.trim())
      field = ''
    } else if (c === '\n' && !inQuotes) {
      current.push(field.trim())
      if (current.some(f => f !== '')) rows.push(current)
      current = []
      field = ''
    } else {
      field += c
    }
  }
  if (field || current.length > 0) {
    current.push(field.trim())
    if (current.some(f => f !== '')) rows.push(current)
  }

  return rows
}

function initials(nome) {
  return (nome || '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// ── Upsert helper ────────────────────────────────────────────────────────────
async function upsertBatch(table, records, batchSize = 50) {
  if (DRY_RUN) {
    console.log(`  [DRY-RUN] Would upsert ${records.length} records into '${table}'`)
    console.log(`  Sample:`, JSON.stringify(records[0]?.data, null, 2).slice(0, 400))
    return records.length
  }
  let total = 0
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    const { error } = await supabase.from(table).upsert(batch)
    if (error) {
      console.error(`  ✗ Error upserting ${table} batch ${i}–${i + batch.length}:`, error.message)
    } else {
      total += batch.length
      process.stdout.write(`\r  ✓ ${table}: ${total}/${records.length} inseridos/atualizados`)
    }
  }
  console.log()
  return total
}

// ── SEGURADORAS (347 companhias) ─────────────────────────────────────────────
// CSV columns: Id; Nome; CNPJ; 0800-Assist; 0800-Diversos; [extras: rua; bairro; cep; cidade; website; logo]
async function importSeguradoras() {
  const csvPath = path.join(DATA_ROOT, 'companhias', 'COM0113062026033341.csv')
  console.log('\n📁 Lendo:', csvPath)

  const rows = parseCSVFile(csvPath)
  // Row 0 = title, Row 1 = headers, skip footer "Gerado Por:"
  const dataRows = rows.slice(2).filter(r => r[0] && /^\d+$/.test(r[0]))

  const records = dataRows.map(cols => {
    const id = cols[0]
    return {
      id,
      data: {
        id,
        sgcorId: id,
        nome: cols[1] || '',
        cnpj: cols[2] || '',
        // Commercial operation fields (to be filled manually per insurer)
        segmentos: [],
        gerente: '',
        telefoneGerente: '',
        emailGerente: '',
        linkPortal: cols[10] || '',
        comissaoMedia: 0,
        prazoEmissao: 0,
        prazoPagamento: 0,
        status: 'ativa',
        apolicesAtivas: 0,
        comissaoPrevista: 0,
        propostasAbertas: 0,
        observacoes: '',
        // SGCOR extra fields
        telefone0800Assist: cols[3] || '',
        telefone0800Diversos: cols[4] || '',
        rua: cols[6] || '',
        bairro: cols[7] || '',
        cep: cols[8] || '',
        cidade: cols[9] || '',
        logoFile: cols[11] || '',
      }
    }
  })

  console.log(`  ${records.length} seguradoras encontradas`)
  return upsertBatch('seguradoras', records)
}

// ── CORRETORAS (11 corretoras parceiras) ─────────────────────────────────────
// CSV: Id; Nome Fantasia; CPF/CNPJ; SUSEP; Endereço; Cidade; Estado;
//       Fone1; Fone2; Fax; Celular; E-mail; CIA Vinculada; Grupo Corretor; Grupo Filial;
//       Status; Inscrição Municipal; Gerente; CPF Gerente; Observações; ...
function parseEndereco(raw) {
  const s = raw.trim()
  // Extract CEP: pattern like 32.010-640 or 50050250
  const cepMatch = s.match(/(\d{2}[\. ]?\d{3}-\d{3})/)
  const cep = cepMatch ? cepMatch[1].replace(' ', '') : ''
  const withoutCep = s.replace(cep, '').trim().replace(/,\s*$/, '').trim()

  // Split by last comma to separate street from number
  const lastComma = withoutCep.lastIndexOf(',')
  if (lastComma === -1) return { rua: withoutCep, numero: '', complemento: '', cep }

  const rua = withoutCep.slice(0, lastComma).trim()
  const rest = withoutCep.slice(lastComma + 1).trim()
  const numMatch = rest.match(/^(\S+)/)
  const numero = numMatch ? numMatch[1] : ''
  const complemento = rest.replace(numero, '').trim()
  return { rua, numero, complemento, cep }
}

async function importCorretoras() {
  const csvPath = path.join(DATA_ROOT, 'Corretoras', 'corretorass.csv')
  console.log('\n📁 Lendo:', csvPath)

  const rows = parseCSVFile(csvPath)
  const dataRows = rows.slice(2).filter(r => r[0] && /^\d+$/.test(r[0]))

  const records = dataRows.map(cols => {
    const id = cols[0]
    const cpfCnpj = cols[2] || ''
    const enderecoRaw = cols[4] || ''
    const { rua, numero, complemento, cep } = parseEndereco(enderecoRaw)

    // Some entries have "phone1 | phone2" format
    const fone1parts = (cols[7] || '').split('|').map(t => t.trim())

    return {
      id,
      data: {
        id,
        sgcorId: id,
        tipoPessoa: cpfCnpj.includes('/') ? 'Jurídica' : 'Física',
        nome: cols[1] || '',
        cpfCnpj,
        susep: cols[3] || '',
        inscricaoMunicipal: cols[16] || '',
        contato: cols[17] || '',
        gerente: cols[17] || '',
        cpfGerente: cols[18] || '',
        telefoneFixo: fone1parts[0] || '',
        telefoneComercial2: fone1parts[1] || cols[8] || '',
        telefoneCelular: cols[10] || '',
        fax: cols[9] || '',
        email: cols[11] || '',
        rua, numero, complemento, cep, bairro: '',
        cidade: cols[5] || '',
        estado: cols[6] || '',
        ciaVinculada: cols[12] || '',
        grupoCorretor: cols[13] || '',
        grupoFilial: cols[14] || '',
        percentualCocorretagem: 0,
        status: (cols[15] || '').toLowerCase() === 'ativo' ? 'ativa' : 'inativa',
        observacoes: cols[19] || '',
      }
    }
  })

  console.log(`  ${records.length} corretoras encontradas`)
  return upsertBatch('corretoras', records)
}

// ── PRODUTORES (40+ agentes/produtores) ──────────────────────────────────────
// CSV: Nome; CPF/CNPJ; E-mail; Celular; Bairro; Cep; Cidade; Tipo Pessoa;
//       Data Nasc; Sexo; Fone Comercial; Site; Grupo Repasse; Grupo Produtores; Grupo Vendas;
//       Banco; Agência; Conta; Repasse%; Dist%; Subsídio%; Imposto; Utiliza tabela;
//       Parcelas; Forma Repasse; Repasse Sobre; Observações
function cleanNome(raw) {
  // Some names are prefixed with CPF/CNPJ: "55.403.608 FILIPE GODINHO MONTEIRO"
  return raw.replace(/^[\d./-]+\s+/, '').trim()
}

function parseBRFloat(val) {
  return parseFloat((val || '0').replace(',', '.')) || 0
}

async function importProdutores() {
  const csvPath = path.join(DATA_ROOT, 'produtores', 'PRO0113062026033440.csv')
  console.log('\n📁 Lendo:', csvPath)

  const rows = parseCSVFile(csvPath)
  // Skip title (row 0), headers (row 1); skip footer "Gerado Por:"
  const dataRows = rows.slice(2).filter(r => {
    const first = (r[0] || '').trim()
    return first && !first.startsWith('Gerado')
  })

  const records = dataRows.map((cols, idx) => {
    const nomeRaw = cols[0] || ''
    const nome = cleanNome(nomeRaw)
    const tipoPessoaRaw = cols[7] || 'Física'
    const tipoPessoa = tipoPessoaRaw.includes('ur') ? 'Jurídica' : 'Física'
    const grupoProdutores = (cols[13] || '').toUpperCase()
    const tipoProdutor = grupoProdutores === 'EXTERNO' ? 'Externo'
      : grupoProdutores === 'COMERCIAL' ? 'Funcionário Comercial'
      : 'Externo'

    const id = String(idx + 1)

    return {
      id,
      data: {
        id,
        sgcorOrigem: true,
        tipoPessoa,
        tipoProdutor,
        nome,
        cpfCnpj: cols[1] || '',
        rg: '',
        dataNascimento: cols[8] || '',
        sexo: cols[9] || '',
        admissao: '',
        demissao: '',
        cep: cols[5] || '',
        rua: '',
        numero: '',
        complemento: '',
        bairro: cols[4] || '',
        cidade: cols[6] || '',
        estado: '',
        telefoneCelular: cols[3] || '',
        telefoneFixo: cols[10] || '',
        email: cols[2] || '',
        site: cols[11] || '',
        banco: cols[15] || '',
        agencia: cols[16] || '',
        conta: cols[17] || '',
        tipoConta: 'Corrente',
        chavePix: '',
        repassePercentual: parseBRFloat(cols[18]),
        percentualDistribuicao: parseBRFloat(cols[19]),
        percentualSubsidio: parseBRFloat(cols[20]),
        grupoRepasse: cols[12] || '',
        grupoVendas: cols[14] || '',
        formaRepasse: cols[24] || '',
        repasseSobre: cols[25] || '',
        status: 'ativo',
        observacoes: cols[26] || '',
        avatar: initials(nome),
      }
    }
  })

  console.log(`  ${records.length} produtores encontrados`)
  return upsertBatch('produtores', records)
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('='.repeat(60))
  console.log(' SGCOR → Supabase Import')
  console.log(DRY_RUN ? ' Modo: DRY-RUN (sem gravação)' : ' Modo: PRODUÇÃO (gravando no Supabase)')
  console.log('='.repeat(60))

  const results = {}

  if (!ONLY || ONLY === 'seguradoras') {
    results.seguradoras = await importSeguradoras()
  }
  if (!ONLY || ONLY === 'corretoras') {
    results.corretoras = await importCorretoras()
  }
  if (!ONLY || ONLY === 'produtores') {
    results.produtores = await importProdutores()
  }

  console.log('\n' + '='.repeat(60))
  console.log(' Resumo:')
  for (const [table, count] of Object.entries(results)) {
    console.log(`   ${table.padEnd(15)} ${count} registros`)
  }
  console.log('='.repeat(60))
}

main().catch(err => {
  console.error('\n✗ Erro fatal:', err.message)
  process.exit(1)
})
