import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import { catalogoSeguros } from '../src/data/catalogoSeguros.js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

const ENTITIES = [
  'usuarios', 'seguradoras', 'clientes', 'leads', 'apolices', 'propostas',
  'comissoes', 'sinistros', 'assistencias', 'documentos', 'tarefas',
  'produtos', 'producaoMensal', 'alertas', 'endossos', 'produtores',
  'corretoras', 'cotacoes', 'historico', 'seguros_catalogo', 'configuracoes',
  'conversas', 'mensagens',
]

// ─── AUTH ──────────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' })
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data?.user) return res.status(401).json({ error: error?.message || 'Credenciais inválidas.' })
  const { data: rows } = await supabase.from('usuarios').select('data')
  const perfil = rows?.map(r => r.data).find(u => u?.email?.toLowerCase() === email.toLowerCase())
  if (perfil?.status === 'inativo') {
    return res.status(403).json({ error: 'Usuário inativo. Contate o administrador do sistema.' })
  }
  res.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      nome: data.user.user_metadata?.nome || data.user.email.split('@')[0],
    }
  })
})

app.post('/api/auth/logout', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/auth/change-password', async (req, res) => {
  const { email, currentPassword, newPassword } = req.body || {}
  if (!email || !currentPassword || !newPassword) return res.status(400).json({ error: 'Todos os campos são obrigatórios.' })
  if (newPassword.length < 6) return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' })
  const { error: authError } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
  if (authError) return res.status(401).json({ error: 'Senha atual incorreta.' })
  const { data: lista, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr) return res.status(500).json({ error: listErr.message })
  const authUser = lista?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
  if (!authUser) return res.status(404).json({ error: 'Usuário não encontrado.' })
  const { error: updateErr } = await supabase.auth.admin.updateUserById(authUser.id, { password: newPassword })
  if (updateErr) return res.status(500).json({ error: updateErr.message })
  res.json({ ok: true })
})

app.post('/api/auth/admin/create-user', async (req, res) => {
  const { email, password, nome } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' })
  const { data: lista, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr) return res.status(500).json({ error: listErr.message })
  const existente = lista?.users?.find(u => u.email === email)
  if (existente) {
    const { data, error } = await supabase.auth.admin.updateUserById(existente.id, {
      password,
      email_confirm: true,
      user_metadata: { nome: nome || email.split('@')[0] },
    })
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ ok: true, userId: data.user.id, updated: true })
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome: nome || email.split('@')[0] },
  })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true, userId: data.user.id, created: true })
})

// ─── WEBHOOK UAZAPI ────────────────────────────────────────────────────────

function normalizePhone(raw) {
  if (!raw) return ''
  return String(raw).replace(/\D/g, '')
}

app.post('/api/webhook/uazapi', async (req, res) => {
  res.json({ ok: true })
  try {
    const body = req.body?.body || req.body
    if (!body || body.EventType !== 'messages') return

    const { chat, message, instanceName, owner, BaseUrl } = body
    if (!chat || !message || !message.id) return

    const chatid = chat.wa_chatid || message.chatid
    if (!chatid) return

    const phoneRaw = chat.phone || ''
    const phoneNormalized = normalizePhone(phoneRaw)

    let clienteId = null
    let leadId = null
    try {
      const { data: clientesRows } = await supabase.from('clientes').select('id, data')
      const clienteMatch = clientesRows?.find(r => {
        const c = r.data
        return normalizePhone(c.whatsapp) === phoneNormalized ||
               normalizePhone(c.telefone) === phoneNormalized
      })
      if (clienteMatch) clienteId = clienteMatch.id

      const { data: leadsRows } = await supabase.from('leads').select('id, data')
      const leadMatch = leadsRows?.find(r => {
        const l = r.data
        return normalizePhone(l.whatsapp) === phoneNormalized ||
               normalizePhone(l.telefone) === phoneNormalized
      })
      if (leadMatch) leadId = leadMatch.id
    } catch (_) { }

    const lastMsgText = message.text
      || (message.content && message.content.caption)   // imagem/vídeo com legenda
      || (message.mediaType === 'audio' ? '🎵 Áudio' :
          message.mediaType === 'image' ? '📷 Imagem' :
          message.mediaType === 'video' ? '🎥 Vídeo' :
          message.mediaType === 'media' ? '📄 Documento' : '💬 Mensagem')

    const conversaData = {
      id: chatid,
      instanceName: instanceName || '',
      owner: owner || '',
      baseUrl: BaseUrl || '',
      isGroup: Boolean(chat.wa_isGroup || message.isGroup),
      groupName: message.groupName || '',
      name: chat.name || chat.wa_name || chat.wa_contactName || '',
      phone: phoneRaw,
      image: chat.image || '',
      imagePreview: chat.imagePreview || '',
      lastMessage: lastMsgText,
      lastMessageType: message.mediaType || 'text',
      lastMessageTimestamp: message.messageTimestamp || Date.now(),
      unreadCount: chat.wa_unreadCount || 0,
      clienteId,
      leadId,
      lead_name: chat.lead_name || '',
      lead_email: chat.lead_email || '',
      lead_status: chat.lead_status || '',
      lead_tags: chat.lead_tags || [],
      lead_notes: chat.lead_notes || '',
      lead_assignedAttendant_id: chat.lead_assignedAttendant_id || '',
      updatedAt: new Date().toISOString(),
    }
    await supabase.from('conversas').upsert({ id: chatid, data: conversaData })

    // Para mensagens fromMe: preservar senderName já salvo (ex: enviado pelo operador via CRM)
    let savedSenderName = message.senderName || ''
    if (message.fromMe) {
      try {
        const { data: existingRows } = await supabase.from('mensagens').select('data').eq('id', message.id)
        if (existingRows?.[0]?.data?.senderName) savedSenderName = existingRows[0].data.senderName
      } catch (_) {}
    }

    const mensagemData = {
      id: message.id,
      messageid: message.messageid || '',   // ID curto sem prefixo owner (usado no download)
      conversaId: chatid,
      instanceName: instanceName || '',
      messageType: message.messageType || '',
      mediaType: message.mediaType || 'text',
      text: message.text || '',
      content: message.content || {},
      fromMe: Boolean(message.fromMe),
      senderName: savedSenderName,
      sender_pn: message.sender_pn || '',
      sender_lid: message.sender_lid || '',
      isGroup: Boolean(message.isGroup),
      groupName: message.groupName || '',
      messageTimestamp: message.messageTimestamp || Date.now(),
      mediaDownloaded: false,
      mediaUrl: null,
      createdAt: new Date().toISOString(),
    }
    await supabase.from('mensagens').upsert({ id: message.id, data: mensagemData })
  } catch (err) {
    console.error('[webhook/uazapi]', err.message)
  }
})

// ─── UAZAPI CONFIG HELPER ─────────────────────────────────────────────────

async function getUazapiConfig() {
  const { data: rows } = await supabase.from('configuracoes').select('data').eq('id', 'uazapi')
  return rows?.[0]?.data || null
}

// ─── UAZAPI PROXY ─────────────────────────────────────────────────────────

// Enviar mensagem
app.post('/api/uazapi/send', async (req, res) => {
  try {
    const { conversaId, text, senderName, mediaType, mediaUrl, fileName, caption, delay } = req.body || {}
    if (!conversaId || (!text && !mediaUrl)) return res.status(400).json({ error: 'conversaId e text ou mediaUrl são obrigatórios.' })

    const cfg = await getUazapiConfig()
    if (!cfg?.baseUrl || !cfg?.token) return res.status(400).json({ error: 'Configuração UAZAPI não encontrada. Configure em Configurações.' })

    const to = conversaId.replace(/@.*/, '')
    let endpoint, payload
    if (mediaUrl) {
      endpoint = `${cfg.baseUrl}/send/media`
      payload = { to, mediaType: mediaType || 'image', mediaUrl, fileName: fileName || '', caption: caption || '' }
    } else {
      endpoint = `${cfg.baseUrl}/send/text`
      payload = { to, text, delay: delay || 0 }
    }

    const uazRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': cfg.token },
      body: JSON.stringify(payload),
    })
    const uazData = await uazRes.json().catch(() => ({}))
    if (!uazRes.ok) return res.status(uazRes.status).json({ error: uazData?.error || 'Erro ao enviar mensagem.' })

    // Salva a mensagem enviada imediatamente no DB com o senderName do operador
    try {
      const msgId = uazData?.id || uazData?.messageid || `sent_${Date.now()}`
      const msgTs = Date.now()
      const mensagemData = {
        id: msgId,
        messageid: uazData?.messageid || '',
        conversaId,
        instanceName: cfg.instanceName || '',
        messageType: mediaUrl ? 'MediaMessage' : 'TextMessage',
        mediaType: mediaUrl ? (mediaType || 'image') : 'text',
        text: text || caption || '',
        content: {},
        fromMe: true,
        senderName: senderName || '',
        sender_pn: '',
        sender_lid: '',
        isGroup: conversaId.includes('@g.us'),
        groupName: '',
        messageTimestamp: msgTs,
        mediaDownloaded: false,
        mediaUrl: mediaUrl || null,
        createdAt: new Date().toISOString(),
      }
      await supabase.from('mensagens').upsert({ id: msgId, data: mensagemData })

      // Atualiza lastMessage na conversa imediatamente (sem esperar webhook de eco)
      const { data: convRows } = await supabase.from('conversas').select('data').eq('id', conversaId)
      if (convRows?.[0]) {
        const convUpdated = {
          ...convRows[0].data,
          lastMessage: text || caption || (mediaUrl ? '📎 Mídia' : '💬 Mensagem'),
          lastMessageType: mediaUrl ? (mediaType || 'image') : 'text',
          lastMessageTimestamp: msgTs,
        }
        await supabase.from('conversas').upsert({ id: conversaId, data: convUpdated })
      }
    } catch (dbErr) {
      console.error('[send] erro ao salvar no DB:', dbErr.message)
    }

    res.json(uazData)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Download de mídia — usa return_base64:true conforme documentação UAZAPI
app.post('/api/uazapi/download', async (req, res) => {
  try {
    const { messageid, conversaId } = req.body || {}
    if (!messageid) return res.status(400).json({ error: 'messageid é obrigatório.' })

    const cfg = await getUazapiConfig()
    if (!cfg?.baseUrl || !cfg?.token) return res.status(400).json({ error: 'Configuração UAZAPI não encontrada.' })

    // UAZAPI espera o ID curto (sem prefixo owner). Ex: "3EB0044C..." não "555183437876:3EB0..."
    const shortId = messageid.includes(':') ? messageid.split(':').pop() : messageid

    const uazRes = await fetch(`${cfg.baseUrl}/message/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': cfg.token },
      body: JSON.stringify({
        id: shortId,
        return_base64: true,
        return_link: false,
      }),
    })

    if (!uazRes.ok) {
      const err = await uazRes.json().catch(() => ({}))
      return res.status(uazRes.status).json({ error: err?.error || 'Erro ao baixar mídia.' })
    }

    const data = await uazRes.json()

    // Atualiza mediaUrl na mensagem se tiver URL pública
    const publicUrl = data.url || data.mediaUrl || null
    if (publicUrl && messageid) {
      const { data: msgRows } = await supabase.from('mensagens').select('data').eq('id', messageid)
      if (msgRows?.[0]) {
        const updated = { ...msgRows[0].data, mediaUrl: publicUrl, mediaDownloaded: true }
        await supabase.from('mensagens').upsert({ id: messageid, data: updated })
      }
    }

    // Retorna base64Data para o frontend converter em blob URL
    res.json({
      base64Data: data.base64Data || data.base64 || null,
      mimetype: data.mimetype || data.mimeType || 'application/octet-stream',
      url: publicUrl,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Marcar como lida
app.post('/api/uazapi/markread', async (req, res) => {
  try {
    const { conversaId } = req.body || {}
    if (!conversaId) return res.status(400).json({ error: 'conversaId é obrigatório.' })

    const cfg = await getUazapiConfig()
    if (!cfg?.baseUrl || !cfg?.token) return res.status(200).json({ ok: true })

    const chatid = conversaId.replace(/@.*/, '')
    await fetch(`${cfg.baseUrl}/message/markread`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'token': cfg.token },
      body: JSON.stringify({ chatid }),
    }).catch(() => {})

    const { data: convRows } = await supabase.from('conversas').select('data').eq('id', conversaId)
    if (convRows?.[0]) {
      const updated = { ...convRows[0].data, unreadCount: 0 }
      await supabase.from('conversas').upsert({ id: conversaId, data: updated })
    }

    res.json({ ok: true })
  } catch (err) {
    res.status(200).json({ ok: true })
  }
})

// Typing indicator
app.post('/api/uazapi/typing', async (req, res) => {
  try {
    const { conversaId, delayMs } = req.body || {}
    const cfg = await getUazapiConfig()
    if (cfg?.baseUrl && cfg?.token && conversaId) {
      const to = conversaId.replace(/@.*/, '')
      await fetch(`${cfg.baseUrl}/send/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'token': cfg.token },
        body: JSON.stringify({ to, text: ' ', delay: delayMs || 2000 }),
      }).catch(() => {})
    }
    res.json({ ok: true })
  } catch {
    res.json({ ok: true })
  }
})

// Mensagens de uma conversa
app.get('/api/conversas/:id/mensagens', async (req, res) => {
  try {
    const { id } = req.params
    const decodedId = decodeURIComponent(id)
    const { data, error } = await supabase.from('mensagens').select('data')
    if (error) return res.status(500).json({ error: error.message })
    const mensagens = (data || [])
      .map(r => r.data)
      .filter(m => m.conversaId === decodedId)
      .sort((a, b) => a.messageTimestamp - b.messageTimestamp)
    res.json(mensagens)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── CRUD GENÉRICO ─────────────────────────────────────────────────────────

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
