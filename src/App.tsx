import ContactSection from './components/ContactSection'
import Footer from './components/Footer'
import Hero from './components/Hero'
import SocialGrid from './components/SocialGrid'
import CornerTagAudio from './components/CornerTagAudio'
import SpotifyStatusPill from './components/SpotifyStatusPill'
import { profile } from './data/profile'

function App() {
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
        <section className="panel link-panel" aria-labelledby="links-heading">
          <h2 id="links-heading" className="section-title">
            Links
          </h2>
          <SocialGrid links={profile.links} />
        </section>

        <section className="panel contact-panel" aria-label="Contact">
          <ContactSection email={profile.email} />
        </section>
      </main>

      <Footer displayName={profile.displayName} />
      <CornerTagAudio />
    </div>
  )
}

export default App
