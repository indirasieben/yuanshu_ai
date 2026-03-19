import { X } from 'lucide-react'

const exchangeRates = [
  { model: 'Claude Sonnet 4.5', inputPer1M: '约 66 万', outputPer1M: '约 20 万' },
  { model: 'Claude Opus 4.5', inputPer1M: '约 22 万', outputPer1M: '约 6.6 万' },
  { model: 'GPT-4o', inputPer1M: '约 133 万', outputPer1M: '约 40 万' },
  { model: 'GPT-4o Mini', inputPer1M: '约 1,000 万', outputPer1M: '约 250 万' },
  { model: 'DeepSeek V3', inputPer1M: '约 1,450 万', outputPer1M: '约 360 万' },
  { model: 'Gemini 2.5 Pro', inputPer1M: '约 80 万', outputPer1M: '约 32 万' },
  { model: 'Gemini 2.5 Flash', inputPer1M: '约 666 万', outputPer1M: '约 166 万' },
]

const officialPricing = [
  { model: 'Claude Sonnet 4.5', input: '$3.00', output: '$15.00' },
  { model: 'Claude Opus 4.5', input: '$15.00', output: '$75.00' },
  { model: 'GPT-4o', input: '$2.50', output: '$10.00' },
  { model: 'GPT-4o Mini', input: '$0.15', output: '$0.60' },
  { model: 'DeepSeek V3', input: '$0.27', output: '$1.10' },
  { model: 'Gemini 2.5 Pro', input: '$1.25', output: '$10.00' },
  { model: 'Gemini 2.5 Flash', input: '$0.15', output: '$0.60' },
]

export default function YtokenExchangeModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-base font-medium text-ink">ytoken 换算参考</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-cream-dark text-ink-muted hover:text-ink bg-transparent border-none cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-ink-muted">
            ytoken 是平台统一计量单位，不同大模型消耗比例不同，以下供参考：
          </p>

          {/* 换算比例表 */}
          <div>
            <h4 className="text-sm font-medium text-ink mb-3">各模型 ytoken 换算比例</h4>
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream-light">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-ink-muted">模型</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-ink-muted">输入（每 1M ytoken）</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-ink-muted">输出（每 1M ytoken）</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {exchangeRates.map(r => (
                    <tr key={r.model} className="hover:bg-cream-light/50 transition-colors">
                      <td className="px-4 py-2.5 text-ink font-medium">{r.model}</td>
                      <td className="px-4 py-2.5 text-ink-muted">{r.inputPer1M} 原生 Token</td>
                      <td className="px-4 py-2.5 text-ink-muted">{r.outputPer1M} 原生 Token</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 官方原生定价参考 */}
          <div>
            <h4 className="text-sm font-medium text-ink mb-3">官方原生定价参考（各模型官方 $/1M tokens）</h4>
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream-light">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-ink-muted">模型</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-ink-muted">输入价格（$/1M）</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-ink-muted">输出价格（$/1M）</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {officialPricing.map(r => (
                    <tr key={r.model} className="hover:bg-cream-light/50 transition-colors">
                      <td className="px-4 py-2.5 text-ink font-medium">{r.model}</td>
                      <td className="px-4 py-2.5 text-ink-muted">{r.input}</td>
                      <td className="px-4 py-2.5 text-ink-muted">{r.output}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-ink-faint">* 以上数据仅供参考，以平台实际扣费为准。换算比例可能随模型厂商调价而调整。</p>
        </div>
      </div>
    </div>
  )
}
