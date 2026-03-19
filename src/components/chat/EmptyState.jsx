import { MessageSquare, Code, BarChart3, Lightbulb } from 'lucide-react'

const quickTags = [
  { icon: MessageSquare, label: '帮我写一封邮件', prompt: '帮我写一封专业的商务邮件，主题是...' },
  { icon: Code, label: '写一段 Python 代码', prompt: '请帮我写一段 Python 代码，功能是...' },
  { icon: BarChart3, label: '分析这份数据', prompt: '请帮我分析以下数据，找出其中的趋势和关键洞察：' },
  { icon: Lightbulb, label: '头脑风暴', prompt: '我想做一个新项目，请帮我头脑风暴一些创意想法：' },
]

export default function EmptyState({ onSend }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-lg">
        <div className="mb-8 flex justify-center">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M12 24L24 12L36 24L24 36Z" stroke="#1A1A1A" strokeWidth="1.5" fill="none" opacity="0.3"/>
            <circle cx="24" cy="24" r="4" stroke="#1A1A1A" strokeWidth="1.5" fill="none"/>
          </svg>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-medium text-ink mb-3">
          有什么可以帮你的？
        </h2>
        <p className="text-sm text-ink-muted mb-10">
          选择一个话题开始，或直接输入你的问题
        </p>
        <div className="flex flex-wrap justify-center gap-2.5">
          {quickTags.map(tag => (
            <button
              key={tag.label}
              onClick={() => onSend?.(tag.prompt)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] text-ink-muted bg-transparent border border-border hover:border-ink/30 hover:text-ink cursor-pointer transition-all"
            >
              <tag.icon size={13} />
              {tag.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
