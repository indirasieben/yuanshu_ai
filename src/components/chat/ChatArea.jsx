import { useRef, useEffect, useState, useCallback } from 'react'
import MessageBubble from './MessageBubble'
import { useModelStore } from '../../stores/modelStore'

export default function ChatArea({ messages, isStreaming, streamingContent, streamingReasoningContent, activeModel }) {
  const bottomRef = useRef(null)
  const containerRef = useRef(null)
  const [autoScroll, setAutoScroll] = useState(true)

  const { getModel } = useModelStore()

  // 智能自动滚动：用户上滚时暂停
  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setAutoScroll(distanceFromBottom < 100)
  }, [])

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, streamingContent, autoScroll])

  // 构建流式传输中的临时消息
  const streamingMessage = isStreaming && (streamingContent || streamingReasoningContent) ? {
    id: 'streaming',
    role: 'assistant',
    content: streamingContent,
    reasoningContent: streamingReasoningContent,
    timestamp: new Date().toISOString(),
    model: activeModel,
    isStreaming: true,
  } : null

  const allMessages = streamingMessage
    ? [...messages, streamingMessage]
    : messages

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-16 py-6"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {allMessages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* 流式传输中的占位光标（内容为空时） */}
        {isStreaming && !streamingContent && !streamingReasoningContent && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-full border border-border flex items-center justify-center shrink-0 mt-1 bg-white">
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                <path d="M5 9L9 5L13 9L9 13Z" stroke="#1A1A1A" strokeWidth="1.2" fill="none" opacity="0.4"/>
                <circle cx="9" cy="9" r="1.5" fill="#1A1A1A" opacity="0.6"/>
              </svg>
            </div>
            <div className="max-w-[75%]">
              <div className="rounded-2xl px-4 py-3 bg-white border border-border rounded-bl-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-ink/40 animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-ink/40 animate-pulse [animation-delay:150ms]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-ink/40 animate-pulse [animation-delay:300ms]" />
                </div>
              </div>
              <div className="mt-1.5 px-1">
                <span className="text-[11px] text-ink-faint">
                  {getModel(activeModel)?.name || activeModel} 正在思考...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
