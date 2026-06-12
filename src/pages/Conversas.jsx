import { useCallback } from 'react'
import useChat from '../hooks/useChat'
import useResource from '../hooks/useResource'
import ConversasList from '../components/chat/ConversasList'
import ChatView from '../components/chat/ChatView'
import ContactPanel from '../components/chat/ContactPanel'
import { MessageSquare, AlertCircle } from 'lucide-react'

export default function Conversas() {
  const {
    conversas,
    mensagens,
    conversaAtiva,
    loading,
    loadingMensagens,
    sending,
    selecionarConversa,
    sendMessage,
    downloadMedia,
    setTyping,
  } = useChat()

  const { data: clientes } = useResource('clientes')
  const { data: leads } = useResource('leads')
  const { data: configuracoes } = useResource('configuracoes')

  const uazapiConfig = configuracoes.find(c => c.id === 'uazapi')
  const semConfig = !uazapiConfig?.baseUrl || !uazapiConfig?.token

  const handleSend = useCallback(async (conversaId, text) => {
    if (semConfig) {
      alert('Configure a integração UAZAPI em Configurações antes de enviar mensagens.')
      return
    }
    await sendMessage(conversaId, text)
  }, [sendMessage, semConfig])

  const handleTyping = useCallback((conversaId) => {
    setTyping(conversaId)
  }, [setTyping])

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* Alerta de configuração */}
      {semConfig && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-4 py-2 rounded-lg shadow-sm">
          <AlertCircle size={13} />
          <span>UAZAPI não configurado. Vá em <strong>Configurações</strong> para ativar a integração.</span>
        </div>
      )}

      {/* Lista de conversas (esquerda) */}
      <div className="w-[300px] shrink-0 overflow-hidden">
        <ConversasList
          conversas={conversas}
          conversaAtiva={conversaAtiva}
          onSelect={selecionarConversa}
          loading={loading}
        />
      </div>

      {/* Chat central */}
      <div className="flex-1 overflow-hidden">
        {conversaAtiva ? (
          <ChatView
            conversa={conversaAtiva}
            mensagens={mensagens}
            loadingMensagens={loadingMensagens}
            sending={sending}
            onSend={handleSend}
            onTyping={handleTyping}
            onDownload={downloadMedia}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-slate-50 text-center px-8">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #0891b2 0%, #2563eb 50%, #7c3aed 100%)' }}>
              <MessageSquare size={36} className="text-white" />
            </div>
            <h2 className="text-base font-semibold text-cyber-text mb-1">Inbox de Conversas</h2>
            <p className="text-sm text-cyber-muted max-w-xs">
              Selecione uma conversa na lista ao lado para visualizar as mensagens e responder pelo WhatsApp.
            </p>
            {conversas.length === 0 && !loading && (
              <div className="mt-6 p-4 bg-white rounded-xl border border-slate-200 text-left max-w-sm">
                <p className="text-xs font-semibold text-cyber-text mb-2">Como configurar:</p>
                <ol className="text-xs text-cyber-muted space-y-1.5 list-decimal list-inside">
                  <li>Vá em <strong>Configurações → Integração WhatsApp</strong></li>
                  <li>Insira o BaseUrl, Token e Instance Name do UAZAPI</li>
                  <li>Configure o webhook na UAZAPI apontando para<br /><code className="text-[10px] bg-slate-100 px-1 rounded">/api/webhook/uazapi</code></li>
                  <li>Envie uma mensagem no WhatsApp para testar</li>
                </ol>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Painel de contato (direita) */}
      <div className="w-[240px] shrink-0 border-l border-cyber-cyan/10 bg-cyber-surface overflow-hidden">
        <ContactPanel
          conversa={conversaAtiva}
          clientes={clientes}
          leads={leads}
        />
      </div>
    </div>
  )
}
