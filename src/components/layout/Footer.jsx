import { Link } from 'react-router-dom'

const footerLinks = {
  产品: [
    { label: 'AI 对话', href: '/chat' },
    { label: '图片生成', href: '#' },
    { label: 'API 接入', href: '#' },
    { label: '模型列表', href: '#' },
  ],
  资源: [
    { label: '文档中心', href: '#' },
    { label: 'API 参考', href: '#' },
    { label: '使用教程', href: '#' },
    { label: '更新日志', href: '#' },
  ],
  公司: [
    { label: '关于我们', href: '#' },
    { label: '定价方案', href: '/pricing' },
    { label: '联系我们', href: '#' },
    { label: '加入团队', href: '#' },
  ],
  法律: [
    { label: '服务条款', href: '#' },
    { label: '隐私政策', href: '#' },
    { label: '使用规范', href: '#' },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2 md:col-span-1">
            <span className="font-serif text-lg font-bold text-ink italic">元枢 AI</span>
            <p className="text-[13px] text-ink-muted leading-relaxed mt-3">
              面向大中华区的<br />智能模型聚合平台
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-medium text-ink uppercase tracking-widest mb-5">{category}</h4>
              <ul className="space-y-3 list-none p-0 m-0">
                {links.map(link => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-[13px] text-ink-muted hover:text-ink no-underline transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-ink-muted">
            &copy; {new Date().getFullYear()} 元枢 AI. 保留所有权利。
          </p>
          <p className="text-xs text-ink-muted">
            用心制作于香港
          </p>
        </div>
      </div>
    </footer>
  )
}
