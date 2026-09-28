import { createFileRoute } from '@tanstack/react-router'

import { LandingHero } from '../components/landing/LandingHero'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'

export const Route = createFileRoute('/landing')({
  head: () => ({
    meta: [
      {
        title: 'Lynx — Satellite tracking',
      },
    ],
  }),
  component: LandingPage,
})

const landingNav = [
  { label: 'Product', to: '/landing' },
  { label: 'Globe', to: '/' },
] as const

const landingFooterLinks = [
  { label: 'Product', to: '/landing' },
  { label: 'Globe', to: '/' },
] as const

function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-void text-object">
      <SiteHeader navItems={[...landingNav]} logoTo="/landing" />
      <main className="flex-1">
        <LandingHero
          title="See every object on orbit, live"
          description="Lynx ingests validated OMM records, propagates positions with SGP4, and renders the catalog on an interactive globe—updated every second."
          primaryCta={{ label: 'Open globe', to: '/' }}
          secondaryCta={{ label: 'Learn more', to: '/landing', hash: 'overview' }}
        />
      </main>
      <SiteFooter
        links={[...landingFooterLinks]}
        aside="Satellite catalog & globe"
      />
    </div>
  )
}
