import { Header } from '@/features/landing/components/Header'
import { HeroPreview } from '@/features/landing/components/HeroPreview'
import { Footer } from '@/features/landing/components/Footer'
import './styles.scss'

export function DemoPage() {
  return (
    <div className="demo-page">
      <Header />

      <main className="demo-page__main">
        <section className="demo-page__hero">
          <div className="demo-page__badge">✨ Interactive Demo</div>

          <h1 className="demo-page__title">
            Try the <span className="demo-page__title-gradient">AI Icon Search</span>
          </h1>

          <p className="demo-page__description">
            Search for any icon and see how AI finds the best matches.
          </p>

          <HeroPreview />
        </section>
      </main>

      <Footer />
    </div>
  )
}
