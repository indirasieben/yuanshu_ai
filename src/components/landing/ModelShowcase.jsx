import { modelProviders } from '../../data/models'

export default function ModelShowcase() {
  const doubled = [...modelProviders, ...modelProviders]

  return (
    <section className="py-14 border-y border-border overflow-hidden">
      <div className="relative">
        <div className="flex animate-marquee whitespace-nowrap">
          {doubled.map((provider, i) => (
            <span
              key={`${provider}-${i}`}
              className="mx-10 text-lg sm:text-xl font-serif text-ink-muted/50 tracking-wide"
            >
              {provider}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
