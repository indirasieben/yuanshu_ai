import { useState } from 'react'
import { Send, Square, Paperclip, Globe, Settings } from 'lucide-react'
import ModelSelector from './ModelSelector'

export default function InputArea({ onSend, isStreaming, onCancel, onOpenSettings, hasConversation }) {
  const [text, setText] = useState('')

  const handleSend = () => {
    if (!text.trim() || isStreaming) return
    onSend(text)
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-border bg-cream-light p-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-border focus-within:border-ink/20 transition-colors">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的问题... (Enter 发送，Shift+Enter 换行)"
            rows={3}
            disabled={isStreaming}
            className="w-full px-4 pt-3 pb-1 bg-transparent border-none outline-none resize-none text-[13px] text-ink placeholder:text-ink-faint disabled:opacity-50"
          />
          <div className="flex items-center justify-between px-3 pb-2.5">
            <div className="flex items-center gap-0.5">
              <button className="p-1.5 text-ink-muted hover:text-ink hover:bg-cream rounded-md bg-transparent border-none cursor-pointer transition-colors" title="上传附件 (即将支持)">
                <Paperclip size={14} />
              </button>
              <button className="p-1.5 text-ink-muted hover:text-ink hover:bg-cream rounded-md bg-transparent border-none cursor-pointer transition-colors" title="联网搜索 (即将支持)">
                <Globe size={14} />
              </button>
              {hasConversation && onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="flex items-center gap-1 px-2 py-1.5 text-ink-muted hover:text-ink hover:bg-cream rounded-md bg-transparent border-none cursor-pointer transition-colors text-[12px]"
                  title="对话设置"
                >
                  <Settings size={14} />
                  <span>对话设置</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <ModelSelector />
              {isStreaming ? (
                <button
                  onClick={onCancel}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-[12px] font-medium border border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
                >
                  <Square size={12} />
                  停止
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!text.trim()}
                  className={`p-2 rounded-lg border-none cursor-pointer transition-all ${
                    text.trim()
                      ? 'bg-ink text-white hover:bg-ink-light'
                      : 'bg-cream-dark text-ink-faint cursor-not-allowed'
                  }`}
                >
                  <Send size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
