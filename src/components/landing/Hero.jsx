import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Hero() {
  const { t } = useTranslation()
  return (
    <section className="relative">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 pt-24 pb-28 lg:pt-36 lg:pb-40 text-center">
        {/* Hand-drawn style illustration */}
        <div className="mb-10 flex justify-center">
          <svg width="220" height="160" viewBox="0 0 220 160" fill="none" className="opacity-90">
            {/* Paper airplane */}
            <path d="M130 30L170 50L140 55L130 30Z" stroke="#1A1A1A" strokeWidth="1.5" fill="none"/>
            <path d="M140 55L145 80L130 30" stroke="#1A1A1A" strokeWidth="1.5" fill="none"/>
            <line x1="170" y1="50" x2="185" y2="42" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3 3"/>
            <line x1="175" y1="55" x2="192" y2="50" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3 3"/>
            {/* Person figure */}
            <circle cx="110" cy="58" r="6" stroke="#1A1A1A" strokeWidth="1.5" fill="none"/>
            <path d="M110 64L110 90" stroke="#1A1A1A" strokeWidth="1.5"/>
            <path d="M110 72L128 38" stroke="#1A1A1A" strokeWidth="1.5"/>
            <path d="M110 72L92 82" stroke="#1A1A1A" strokeWidth="1.5"/>
            <path d="M110 90L95 110" stroke="#1A1A1A" strokeWidth="1.5"/>
            <path d="M110 90L125 110" stroke="#1A1A1A" strokeWidth="1.5"/>
            {/* Surfboard / wave */}
            <ellipse cx="110" cy="105" rx="50" ry="8" stroke="#1A1A1A" strokeWidth="1.8" fill="#1A1A1A" opacity="0.08"/>
            <path d="M55 108Q75 95 95 108Q115 120 140 108Q155 100 165 108" stroke="#1A1A1A" strokeWidth="1.5" fill="none"/>
            <path d="M165 108Q175 115 175 125" stroke="#1A1A1A" strokeWidth="1.2" fill="none"/>
            {/* Pink accent on shirt */}
            <rect x="104" y="68" width="12" height="14" rx="2" fill="#E84D8A" opacity="0.7"/>
            {/* Birds */}
            <path d="M75 25Q80 20 85 25" stroke="#1A1A1A" strokeWidth="1" fill="none"/>
            <path d="M60 35Q64 31 68 35" stroke="#1A1A1A" strokeWidth="1" fill="none"/>
            <path d="M90 18Q94 14 98 18" stroke="#1A1A1A" strokeWidth="1" fill="none"/>
            <path d="M148 22Q152 18 156 22" stroke="#1A1A1A" strokeWidth="1" fill="none"/>
            <path d="M160 32Q163 29 166 32" stroke="#1A1A1A" strokeWidth="0.8" fill="none"/>
          </svg>
        </div>

        {/* Main title - editorial serif */}
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-ink leading-tight mb-8 tracking-tight">
          {t('与你共同思考的')}
          <br />
          <em className="not-italic">{t('AI 平台')}</em>
        </h1>

        {/* CTA button - black pill like OpenNote */}
        <Link
          to="/chat"
          className="inline-block px-8 py-3.5 bg-ink text-white text-sm font-medium rounded-full hover:bg-ink-light transition-colors no-underline"
        >
          {t('免费开始')}
        </Link>
      </div>
    </section>
  )
}
