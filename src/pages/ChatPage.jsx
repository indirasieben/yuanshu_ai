import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PanelLeftOpen, Download, Bell, User, LogOut } from 'lucide-react'
import Sidebar from '../components/chat/Sidebar'
import ChatArea from '../components/chat/ChatArea'
import InputArea from '../components/chat/InputArea'
import EmptyState from '../components/chat/EmptyState'
import ConversationSettingsModal from '../components/chat/ConversationSettingsModal'
import SubscriptionModal from '../components/subscription/SubscriptionModal'
import { useChatStore } from '../stores/chatStore'
import { useModelStore } from '../stores/modelStore'
import { useAuthStore } from '../stores/authStore'
import { exportAsMarkdown } from '../lib/export'

export default function ChatPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showSubscription, setShowSubscription] = useState(false)

  const {
    conversations,
    activeConversationId,
    isStreaming,
    streamingContent,
    streamingReasoningContent,
    getActiveConversation,
    sendMessage,
    cancelStream,
  } = useChatStore()

  const { fetchModels } = useModelStore()
  const { ensureApiToken, user, logout } = useAuthStore()

  const activeConversation = getActiveConversation()
  const messages = activeConversation?.messages || []
  const showEmpty = !activeConversation || messages.length === 0

  // 初始化：刷新模型列表 & 确保有 API token
  useEffect(() => {
    ensureApiToken()
    fetchModels()
  }, [])

  const handleSend = (text) => {
    sendMessage(text)
  }

  const handleExport = () => {
    exportAsMarkdown(activeConversation)
  }

  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenSubscription={() => setShowSubscription(true)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-cream-light/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-1.5 hover:bg-cream-dark rounded-lg text-ink-muted hover:text-ink bg-transparent border-none cursor-pointer transition-colors"
              >
                <PanelLeftOpen size={16} />
              </button>
            )}
            <h1 className="text-[13px] font-medium text-ink truncate">
              {activeConversation?.title || '新对话'}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleExport}
              disabled={showEmpty}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-ink-muted hover:text-ink hover:bg-cream-dark rounded-md bg-transparent border-none cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Download size={12} />
              导出
            </button>

            <div className="w-px h-4 bg-border mx-1" />

            {/* 通知图标 */}
            <button
              className="relative p-1.5 text-ink-muted hover:text-ink hover:bg-cream-dark rounded-md bg-transparent border-none cursor-pointer transition-colors"
              title="通知中心"
              onClick={() => window.location.hash = '#/account/notifications'}
            >
              <Bell size={14} />
            </button>

            {/* 用户头像下拉 */}
            <div className="relative ml-1">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-7 h-7 rounded-full bg-ink text-cream-light flex items-center justify-center text-[11px] font-medium cursor-pointer border-none"
              >
                {(user?.display_name || user?.username || 'U')[0].toUpperCase()}
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-border rounded-xl shadow-lg z-20 py-1">
                    <Link
                      to="/account"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-[12px] text-ink hover:bg-cream no-underline transition-colors"
                    >
                      <User size={13} />
                      账号管理
                    </Link>
                    <div className="h-px bg-border mx-2 my-1" />
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false) }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-[12px] text-red-600 hover:bg-red-50 bg-transparent border-none cursor-pointer transition-colors"
                    >
                      <LogOut size={13} />
                      退出登录
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {showEmpty ? (
          <EmptyState onSend={handleSend} />
        ) : (
          <ChatArea
            messages={messages}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
            streamingReasoningContent={streamingReasoningContent}
            activeModel={activeConversation?.model}
          />
        )}

        <InputArea
          onSend={handleSend}
          isStreaming={isStreaming}
          onCancel={cancelStream}
          onOpenSettings={() => setShowSettings(true)}
          hasConversation={!!activeConversation}
        />
      </div>

      {showSettings && activeConversation && (
        <ConversationSettingsModal
          conversation={activeConversation}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showSubscription && (
        <SubscriptionModal onClose={() => setShowSubscription(false)} />
      )}
    </div>
  )
}
