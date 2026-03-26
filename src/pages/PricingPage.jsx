import { useTranslation } from 'react-i18next'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import PricingCards from '../components/pricing/PricingCards'
import ComparisonTable from '../components/pricing/ComparisonTable'
import FAQ from '../components/pricing/FAQ'

export default function PricingPage() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <section className="pt-20 pb-8 text-center">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-ink mb-4 tracking-tight">
            {t('选择适合你的方案')}
          </h1>
          <p className="text-[15px] text-ink-muted max-w-xl mx-auto">
            {t('从免费开始体验，随时按需升级。所有方案均享受全平台功能。')}
          </p>
        </div>
      </section>

      <PricingCards />
      <ComparisonTable />
      <FAQ />
      <Footer />
    </div>
  )
}
