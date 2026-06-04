import { useCallback, useEffect, useRef } from 'react'
import { FaGithub, FaXmark } from 'react-icons/fa6'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Project } from '../data/projects'

type ProjectDetailModalProps = {
  project: Project | null
  isOpen: boolean
  isClosing: boolean
  onClose: () => void
}

function ProjectDetailModal({ project, isOpen, isClosing, onClose }: ProjectDetailModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    },
    [isOpen, onClose],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (isOpen && !isClosing) {
      closeButtonRef.current?.focus()
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen, isClosing, project])

  if (!project && !isClosing) return null

  const visible = isOpen || isClosing

  return (
    <div
      className={cn('project-modal', visible && 'project-modal--visible')}
      aria-hidden={!visible}
    >
      <button
        type="button"
        className={cn(
          'project-modal__backdrop',
          isOpen && !isClosing && 'project-modal__backdrop--open',
          isClosing && 'project-modal__backdrop--closing',
        )}
        aria-label="Close project details"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        className={cn(
          't-modal project-modal__panel',
          isOpen && !isClosing && 'is-open',
          isClosing && 'is-closing',
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        aria-describedby="project-modal-description"
      >
        {project ? (
          <>
            <button
              ref={closeButtonRef}
              type="button"
              className="project-modal__close"
              aria-label="Close"
              onClick={onClose}
            >
              <FaXmark aria-hidden="true" />
            </button>

            <div className="project-modal__header">
              <img
                className="project-modal__icon"
                src={project.iconSrc}
                alt=""
                width={56}
                height={56}
              />
              <div className="project-modal__titles">
                <h2 id="project-modal-title" className="project-modal__name">
                  {project.name}
                </h2>
                <p className="project-modal__tagline">{project.tagline}</p>
              </div>
            </div>

            <p id="project-modal-description" className="project-modal__description">
              {project.description}
            </p>

            <ul className="project-modal__tags" aria-label="Technologies">
              {project.tags.map((tag) => (
                <li key={tag} className="project-modal__tag">
                  {tag}
                </li>
              ))}
            </ul>

            <a
              className={cn(buttonVariants({ variant: 'outline' }), 'project-modal__github')}
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaGithub aria-hidden="true" />
              View on GitHub
              <span className="visually-hidden"> (opens in new tab)</span>
            </a>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default ProjectDetailModal
