import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import Hero from '../components/landing/Hero'
import Features from '../components/landing/Features'
import ModelShowcase from '../components/landing/ModelShowcase'
import PricingPreview from '../components/landing/PricingPreview'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <Hero />
      <ModelShowcase />
      <Features />
      <PricingPreview />
      <Footer />
    </div>
  )
}
