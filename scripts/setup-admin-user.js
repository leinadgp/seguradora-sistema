import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fnchexkizfrwlovkpafw.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuY2hleGtpemZyd2xvdmtwYWZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTEwMjMzNSwiZXhwIjoyMDk2Njc4MzM1fQ.UR5gjhgfmEst2PbxyNgySVlyCLP7RztLFNZa5XySJRI'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const EMAIL    = 'leinadgp@gmail.com'
const PASSWORD = 'Daniel2019!@#$'
const NOME     = 'Daniel Guimarães'

async function main() {
  console.log(`Configurando usuário admin: ${EMAIL}`)

  // ─── 1. Supabase Auth ──────────────────────────────────────────────────────
  const { data: lista } = await supabase.auth.admin.listUsers()
  const existente = lista?.users?.find(u => u.email === EMAIL)

  let authId
  if (existente) {
    console.log(`Auth: usuário já existe (id: ${existente.id}) — atualizando...`)
    const { data, error } = await supabase.auth.admin.updateUserById(existente.id, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { nome: NOME }
    })
    if (error) { console.error('Erro ao atualizar auth:', error.message); process.exit(1) }
    console.log('✓ Auth atualizado:', data.user.email)
    authId = data.user.id
  } else {
    console.log('Auth: criando novo usuário...')
    const { data, error } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { nome: NOME }
    })
    if (error) { console.error('Erro ao criar auth:', error.message); process.exit(1) }
    console.log('✓ Auth criado:', data.user.email)
    authId = data.user.id
  }

  // ─── 2. Tabela usuarios ────────────────────────────────────────────────────
  const { data: rows } = await supabase.from('usuarios').select('id, data').limit(500)
  const perfilExistente = rows?.find(r => r.data?.email === EMAIL)

  const perfilData = {
    id: perfilExistente?.id || authId,
    nome: NOME,
    email: EMAIL,
    cargo: 'Administrador do Sistema',
    perfil: 'admin',
    status: 'ativo',
    metaMensal: 0,
    comissaoIndividual: 0,
    comissaoGerada: 0,
    leadsAtribuidos: 0,
    propostasAbertas: 0,
    avatar: 'DG',
    loginAtivo: true,
  }

  if (perfilExistente) {
    console.log(`usuarios: registro já existe (id: ${perfilExistente.id}) — atualizando...`)
    const { error } = await supabase.from('usuarios').upsert({ id: perfilExistente.id, data: { ...perfilExistente.data, ...perfilData, id: perfilExistente.id } })
    if (error) { console.error('Erro ao atualizar usuarios:', error.message); process.exit(1) }
    console.log('✓ Perfil de usuarios atualizado')
  } else {
    console.log('usuarios: criando registro de perfil...')
    const { error } = await supabase.from('usuarios').upsert({ id: perfilData.id, data: perfilData })
    if (error) { console.error('Erro ao criar usuarios:', error.message); process.exit(1) }
    console.log('✓ Perfil de usuarios criado (id:', perfilData.id, ')')
  }

  console.log('\nCredenciais de acesso:')
  console.log(`  E-mail : ${EMAIL}`)
  console.log(`  Senha  : ${PASSWORD}`)
  console.log(`  Perfil : admin`)
  console.log('\nPronto! Faça login novamente para carregar o perfil completo.')
}

main()
