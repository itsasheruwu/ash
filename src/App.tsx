import ContactSection from './components/ContactSection'
import Footer from './components/Footer'
import Hero from './components/Hero'
import SocialGrid from './components/SocialGrid'
import CornerTagAudio from './components/CornerTagAudio'
import SpotifyStatusPill from './components/SpotifyStatusPill'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { profile } from './data/profile'

function App() {
  const liveLinks = profile.links.filter((link) => link.status === 'active').length
  const comingSoonLinks = profile.links.filter((link) => link.status === 'coming_soon').length

  return (
    <div className="app-shell app-shell--links">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SpotifyStatusPill className="spotify-status-pill--fixed-corner" />
      <header className="site-header">
        <Hero profile={profile} />
      </header>

      <main className="site-main" id="main-content">
        <Card
          className="link-panel links-page-card"
          aria-describedby="links-panel-description"
        >
          <CardHeader className="links-page-card__header">
            <div className="links-panel-heading">
              <h2 id="links-heading" className="links-panel-title">
                Links
              </h2>
              <Badge variant="outline" className="links-count-pill">
                {liveLinks} live link{liveLinks === 1 ? '' : 's'}
                {comingSoonLinks > 0 ? ` · ${comingSoonLinks} coming soon` : ''}
              </Badge>
            </div>
            <CardDescription id="links-panel-description" className="visually-hidden">
              Social profiles and ways to reach Ash.
            </CardDescription>
          </CardHeader>
          <CardContent className="links-page-card__body">
            <SocialGrid links={profile.links} />
            <section className="link-panel__contact" aria-label="Contact">
              <ContactSection email={profile.email} />
            </section>
          </CardContent>
        </Card>
      </main>

      <Footer displayName={profile.displayName} />
      <CornerTagAudio />
    </div>
  )
}

export default App
