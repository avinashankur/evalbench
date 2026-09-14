import {
  Header,
  Hero,
  TicksDivider,
  TrackingFeatures,
  ComparisonTable,
  CtaStrip,
  Footer,
} from '@/components/landing'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Header />
      <main>
        <Hero />
        <TicksDivider />
        <TrackingFeatures />
        <TicksDivider />
        <ComparisonTable />
        <CtaStrip />
      </main>
      <Footer />
    </div>
  )
}


