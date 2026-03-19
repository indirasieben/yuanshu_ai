import { useState } from 'react'
import { X } from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'

export default function ConversationSettingsModal({ conversation, onClose }) {
  const { updateConversationSettings, renameConversation } = useChatStore()

  const [title, setTitle] = useState(conversation.title)
  const [systemPrompt, setSystemPrompt] = useState(conversation.settings?.systemPrompt || '')
  const [temperature, setTemperature] = useState(conversation.settings?.temperature ?? 0.7)
  const [topP, setTopP] = useState(conversation.settings?.topP ?? 0.9)
  const [maxTokens, setMaxTokens] = useState(conversation.settings?.maxTokens ?? 4096)

  const handleSave = () => {
    if (title.trim() && title !== conversation.title) {
      renameConversation(conversation.id, title.trim())
    }
    updateConversationSettings(conversation.id, {
      systemPrompt,
      temperature,
      topP,
      maxTokens,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-medium text-ink">对话设置</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-cream-dark rounded-lg text-ink-muted hover:text-ink bg-transparent border-none cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* 对话标题 */}
          <div>
            <label className="block text-xs text-ink-muted mb-1.5">对话标题</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-cream-light text-ink text-sm outline-none focus:border-ink-muted transition-colors"
            />
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-xs text-ink-muted mb-1.5">系统提示词 (System Prompt)</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="设定 AI 的角色和行为方式..."
              rows={4}
              maxLength={2000}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-cream-light text-ink text-sm outline-none resize-none focus:border-ink-muted transition-colors"
            />
            <p className="text-[11px] text-ink-faint mt-1 text-right">{systemPrompt.length}/2000</p>
          </div>

          {/* Temperature */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-ink-muted">Temperature (创造性)</label>
              <span className="text-xs font-medium text-ink">{temperature.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-ink h-1"
            />
            <div className="flex justify-between text-[10px] text-ink-faint mt-0.5">
              <span>精确 (0)</span>
              <span>创造 (2)</span>
            </div>
          </div>

          {/* Top P */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-ink-muted">Top P</label>
              <span className="text-xs font-medium text-ink">{topP.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={topP}
              onChange={(e) => setTopP(parseFloat(e.target.value))}
              className="w-full accent-ink h-1"
            />
            <div className="flex justify-between text-[10px] text-ink-faint mt-0.5">
              <span>0</span>
              <span>1</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-xs text-ink-muted mb-1.5">最大输出长度 (Max Tokens)</label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(Math.max(100, Math.min(128000, parseInt(e.target.value) || 4096)))}
              min={100}
              max={128000}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-cream-light text-ink text-sm outline-none focus:border-ink-muted transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-ink-muted hover:text-ink hover:bg-cream-dark bg-transparent border border-border cursor-pointer transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-sm font-medium text-cream-light bg-ink hover:bg-ink-light border-none cursor-pointer transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
