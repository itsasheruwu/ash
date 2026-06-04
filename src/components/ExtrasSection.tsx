import { useId, useState } from 'react'
import { FaChevronDown, FaTerminal } from 'react-icons/fa6'
import type { IconType } from 'react-icons'
import { cn } from '@/lib/utils'
import type { ExtraItem } from '../data/profile'

type ExtrasSectionProps = {
  items: ExtraItem[]
  heading?: string
}

const iconMap: Partial<Record<ExtraItem['id'], IconType>> = {
  cursor: FaTerminal,
}

function ExtrasSection({ items, heading = 'More' }: ExtrasSectionProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  if (items.length === 0) return null

  return (
    <section className="extras-section" aria-labelledby="extras-heading">
      <h2 id="extras-heading" className="extras-section__heading">
        <button
          type="button"
          className="extras-section__trigger"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="extras-section__title">{heading}</span>
          <FaChevronDown
            className={cn('extras-section__chev', open && 'extras-section__chev--open')}
            aria-hidden="true"
          />
        </button>
      </h2>
      <div id={panelId} hidden={!open}>
        <ul className="extras-list">
          {items.map((item) => {
            const Icon = iconMap[item.id]
            const content = (
              <>
                {Icon ? (
                  <span className="extras-row__icon" aria-hidden="true">
                    <Icon />
                  </span>
                ) : null}
                <span className="extras-row__copy">
                  <span className="extras-row__label">{item.label}</span>
                  {item.description ? (
                    <span className="extras-row__description">{item.description}</span>
                  ) : null}
                </span>
              </>
            )

            if (item.url) {
              return (
                <li key={item.id}>
                  <a
                    className="extras-row"
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${item.label}`}
                  >
                    {content}
                    <span className="visually-hidden">(opens in new tab)</span>
                  </a>
                </li>
              )
            }

            return (
              <li key={item.id}>
                <div className="extras-row extras-row--static" aria-label={item.label}>
                  {content}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export default ExtrasSection
