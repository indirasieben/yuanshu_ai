import { useState } from 'react'
import { Layers, Globe, DollarSign, Plug, Code } from 'lucide-react'

const tabs = [
  {
    key: 'models',
    label: '多模型聚合',
    icon: Layers,
    title: '一个账号，所有模型',
    description: '无需分别注册 OpenAI、Anthropic、Google 等多个账号。元枢 AI 聚合 GPT-4o、Claude、Gemini、DeepSeek 等 8+ 顶级模型，一键切换，择优而用。',
    visual: (
      <div className="space-y-3">
        {['GPT-4o', 'Claude 4 Sonnet', 'Gemini 2.5 Pro', 'DeepSeek R1'].map((m, i) => (
          <div key={m} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${i === 0 ? 'border-ink bg-cream-light' : 'border-border'}`}>
            <div className="w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center text-xs font-serif font-bold text-ink">{m[0]}</div>
            <span className="text-sm text-ink">{m}</span>
            {i === 0 && <span className="ml-auto text-[10px] px-2 py-0.5 bg-ink text-white rounded-full">当前</span>}
          </div>
        ))}
      </div>
    ),
  },
  {
    key: 'chinese',
    label: '中文优先',
    icon: Globe,
    title: '为中文用户而生',
    description: '界面、提示词、客服全面中文化。针对中文理解和生成深度优化，大中华区用户的首选 AI 平台。',
    visual: (
      <div className="p-5 bg-cream-light rounded-xl border border-border">
        <p className="font-serif text-lg text-ink leading-relaxed">"请用简洁的语言解释量子纠缠的原理。"</p>
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-ink-muted leading-relaxed">量子纠缠是指两个粒子之间存在一种神奇的关联——无论相距多远，对其中一个粒子的测量会瞬间影响另一个粒子的状态...</p>
        </div>
      </div>
    ),
  },
  {
    key: 'pricing',
    label: '透明定价',
    icon: DollarSign,
    title: '用多少，付多少',
    description: '按 Token 精确计费，无隐藏费用。实时用量面板让成本可控可预测，从免费额度开始体验。',
    visual: (
      <div className="space-y-3">
        {[
          { label: '本月用量', value: '1,284,500', unit: 'tokens', pct: 64 },
          { label: '剩余额度', value: '715,500', unit: 'tokens', pct: 36 },
        ].map(item => (
          <div key={item.label} className="p-4 bg-cream-light rounded-xl border border-border">
            <div className="flex justify-between text-xs text-ink-muted mb-2">
              <span>{item.label}</span>
              <span>{item.value} {item.unit}</span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-ink rounded-full" style={{ width: `${item.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    key: 'api',
    label: 'API 兼容',
    icon: Code,
    title: '零改动迁移',
    description: '兼容 OpenAI API 格式，已有代码只需改个 baseURL 即可迁移。支持流式输出、批量请求、函数调用等全部特性。',
    visual: (
      <div className="bg-[#1a1a1a] rounded-xl p-5 text-[13px] font-mono leading-relaxed">
        <div className="text-[#888]">// 只需修改一行</div>
        <div><span className="text-[#c792ea]">const</span> <span className="text-[#82aaff]">client</span> = <span className="text-[#c792ea]">new</span> <span className="text-[#ffcb6b]">OpenAI</span>{'({'}</div>
        <div className="pl-4"><span className="text-[#82aaff]">baseURL</span>: <span className="text-[#c3e88d]">"https://api.metahub-ai.com/v1"</span>,</div>
        <div className="pl-4"><span className="text-[#82aaff]">apiKey</span>: <span className="text-[#c3e88d]">"sk-..."</span></div>
        <div>{'});'}</div>
      </div>
    ),
  },
]

export default function Features() {
  const [active, setActive] = useState('models')
  const current = tabs.find(t => t.key === active)

  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-medium text-ink text-center mb-14 tracking-tight">
          一站式 AI 能力集合
        </h2>

        {/* Tab bar - OpenNote style horizontal text tabs */}
        <div className="flex justify-center gap-8 mb-14 border-b border-border">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 bg-transparent cursor-pointer transition-all ${
                active === tab.key
                  ? 'text-ink border-ink'
                  : 'text-ink-muted border-transparent hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content - two column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h3 className="font-serif text-2xl lg:text-3xl font-medium text-ink mb-4">{current.title}</h3>
            <p className="text-[15px] text-ink-muted leading-relaxed">{current.description}</p>
          </div>
          <div>{current.visual}</div>
        </div>
      </div>
    </section>
  )
}
