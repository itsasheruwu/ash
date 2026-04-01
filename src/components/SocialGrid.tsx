import {
  FaInstagram,
  FaSpotify,
  FaThumbtack,
  FaYoutube,
} from 'react-icons/fa6'
import type { IconType } from 'react-icons'
import type { SocialLink } from '../data/profile'

type SocialGridProps = {
  links: SocialLink[]
}

const iconMap: Record<SocialLink['id'], IconType> = {
  instagram: FaInstagram,
  spotify: FaSpotify,
  youtube: FaYoutube,
}

function SocialGrid({ links }: SocialGridProps) {
  return (
    <div className="social-grid">
      {links.map((link) => {
        const Icon = iconMap[link.id]
        const cardContent = (
          <>
            <div className="card-icon" aria-hidden="true">
              <Icon />
            </div>
            <div className="card-copy">
              <h3>{link.label}</h3>
              <p>{link.handle ?? (link.status === 'coming_soon' ? 'Coming Soon' : 'Live now')}</p>
            </div>
            {link.status === 'coming_soon' ? (
              <span className="pill">Coming Soon</span>
            ) : link.primary ? (
              <span className="social-card__pin" aria-hidden="true">
                <FaThumbtack />
              </span>
            ) : null}
          </>
        )

        if (link.status === 'active' && link.url) {
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`social-card${link.primary ? ' social-card--primary' : ''}`}
              aria-label={link.primary ? `Open ${link.label} (pinned)` : `Open ${link.label}`}
            >
              {cardContent}
              <span className="visually-hidden">(opens in new tab)</span>
            </a>
          )
        }

        return (
          <article key={link.id} className="social-card social-card--coming-soon" aria-label={`${link.label} coming soon`}>
            {cardContent}
          </article>
        )
      })}
    </div>
  )
}

export default SocialGrid
