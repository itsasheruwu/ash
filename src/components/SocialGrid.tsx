import {
  FaApple,
  FaCodeBranch,
  FaDiscord,
  FaInstagram,
  FaSpotify,
  FaThumbtack,
  FaYoutube,
} from 'react-icons/fa6'
import type { IconType } from 'react-icons'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { SocialLink } from '../data/profile'

type SocialGridProps = {
  links: SocialLink[]
}

const iconMap: Record<SocialLink['id'], IconType> = {
  instagram: FaInstagram,
  spotify: FaSpotify,
  discord: FaDiscord,
  apple_music: FaApple,
  youtube: FaYoutube,
}

const chooserPlatforms: Partial<Record<SocialLink['id'], string>> = {
  spotify: 'Spotify',
  apple_music: 'Apple Music',
  youtube: 'YouTube',
}

function SocialGrid({ links }: SocialGridProps) {
  const orderedLinks = [...links].sort((a, b) => {
    if (a.primary && !b.primary) return -1
    if (!a.primary && b.primary) return 1
    return a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
  })

  return (
    <div className="social-grid">
      {orderedLinks.map((link) => {
        const Icon = iconMap[link.id]
        const chooserPlatform = chooserPlatforms[link.id]
        const hasProfileChooser =
          Boolean(chooserPlatform) && link.status === 'active' && Boolean(link.url && link.artistUrl)

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
              <Badge
                variant="outline"
                className="h-5 shrink-0 uppercase tracking-wide text-muted-foreground"
              >
                Coming Soon
              </Badge>
            ) : hasProfileChooser ? (
              <span className="social-card__chooser-cue" aria-hidden="true">
                <FaCodeBranch />
              </span>
            ) : link.primary ? (
              <span className="social-card__pin" aria-hidden="true">
                <FaThumbtack />
              </span>
            ) : null}
          </>
        )

        if (hasProfileChooser && chooserPlatform && link.url && link.artistUrl) {
          return (
            <Dialog key={link.id}>
              <DialogTrigger
                type="button"
                className={cn('social-card', link.primary && 'social-card--primary')}
                aria-label={link.primary ? `Open ${link.label} (pinned)` : `Open ${link.label}`}
                aria-haspopup="dialog"
              >
                {cardContent}
                <span className="visually-hidden">
                  Choose personal or artist profile. Opens {chooserPlatform} in a new tab.
                </span>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{chooserPlatform}</DialogTitle>
                  <DialogDescription>Pick which profile to open in {chooserPlatform}.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 pt-1">
                  <a
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'lg' }),
                      'w-full justify-center rounded-full no-underline'
                    )}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Personal
                  </a>
                  <a
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'lg' }),
                      'w-full justify-center rounded-full no-underline'
                    )}
                    href={link.artistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Artist
                  </a>
                </div>
              </DialogContent>
            </Dialog>
          )
        }

        if (link.status === 'active' && link.url) {
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn('social-card', link.primary && 'social-card--primary')}
              aria-label={link.primary ? `Open ${link.label} (pinned)` : `Open ${link.label}`}
            >
              {cardContent}
              <span className="visually-hidden">(opens in new tab)</span>
            </a>
          )
        }

        return (
          <article
            key={link.id}
            className="social-card social-card--coming-soon"
            aria-label={`${link.label} coming soon`}
          >
            {cardContent}
          </article>
        )
      })}
    </div>
  )
}

export default SocialGrid
