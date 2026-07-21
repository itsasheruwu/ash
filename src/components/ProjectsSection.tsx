import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { FaChevronDown } from 'react-icons/fa6'
import { SiClaude } from 'react-icons/si'
import type { IconType } from 'react-icons'
import { cn } from '@/lib/utils'
import { modalCloseMs } from '@/lib/transitions'
import { CodexIcon } from './icons/CodexIcon'
import { CursorIcon } from './icons/CursorIcon'
import { OpenCodeIcon } from './icons/OpenCodeIcon'
import { AvatarGroup } from './AvatarGroup'
import { codingLanguages, devTools, type DevTool } from '../data/developer'
import { projects, type Project } from '../data/projects'
import ProjectDetailModal from './ProjectDetailModal'

const toolIconMap: Record<DevTool['id'], IconType> = {
  codex: CodexIcon as IconType,
  cursor: CursorIcon as IconType,
  opencode: OpenCodeIcon as IconType,
  claude: SiClaude,
}

function renderPriceDetail(tool: DevTool) {
  const detail = tool.priceDetail
  if (!detail) return null

  const link = tool.priceDetailLink
  if (!link) return detail

  const index = detail.indexOf(link.label)
  if (index === -1) return detail

  return (
    <>
      {detail.slice(0, index)}
      <a
        className="projects-section__tool-detail-link"
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {link.label}
      </a>
      {detail.slice(index + link.label.length)}
    </>
  )
}

function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const toolsPanelId = useId()
  const [revealed, setRevealed] = useState(() => typeof IntersectionObserver === 'undefined')
  const [toolsOpen, setToolsOpen] = useState(false)
  const [expandedToolPriceId, setExpandedToolPriceId] = useState<DevTool['id'] | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalClosing, setModalClosing] = useState(false)

  useEffect(() => {
    const node = sectionRef.current
    if (!node) return

    const reveal = () => setRevealed(true)

    if (typeof IntersectionObserver === 'undefined') {
      reveal()
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          reveal()
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px 0px 0px' },
    )

    observer.observe(node)

    const rect = node.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      reveal()
    }

    return () => observer.disconnect()
  }, [])

  const openProject = useCallback((project: Project) => {
    setSelectedProject(project)
    setModalClosing(false)
    setModalOpen(true)
  }, [])

  const closeProject = useCallback(() => {
    setModalOpen(false)
    setModalClosing(true)
    window.setTimeout(() => {
      setModalClosing(false)
      setSelectedProject(null)
    }, modalCloseMs())
  }, [])

  return (
    <>
      <section
        ref={sectionRef}
        className="projects-section"
        aria-labelledby="projects-heading"
      >
        <div
          className={cn('t-panel-slide projects-section__panel', revealed && 'projects-section__panel--open')}
          data-open={revealed ? 'true' : 'false'}
        >
          <div className={cn('t-stagger projects-section__intro', revealed && 'is-shown')}>
            <h2 id="projects-heading" className="t-stagger-line t-stagger-line--1 projects-section__title">
              Development Projects
            </h2>
            <p className="t-stagger-line t-stagger-line--2 projects-section__subtitle">
              Open-source projects I&apos;ve shipped and maintain.
            </p>
          </div>

          <div className="projects-section__meta">
            <div className="projects-section__languages">
              <h3 className="projects-section__meta-label">Languages</h3>
              <ul className="projects-section__language-list" aria-label="Programming languages">
                {codingLanguages.map((language) => (
                  <li key={language} className="projects-section__language">
                    {language}
                  </li>
                ))}
              </ul>
            </div>

            <div className="projects-section__tools">
              <h3 className="projects-section__meta-label">
                <button
                  type="button"
                  className="projects-section__tools-trigger"
                  aria-expanded={toolsOpen}
                  aria-controls={toolsPanelId}
                  onClick={() => setToolsOpen((value) => !value)}
                >
                  <span>Tools</span>
                  <FaChevronDown
                    className={cn('projects-section__tools-chev', toolsOpen && 'projects-section__tools-chev--open')}
                    aria-hidden="true"
                  />
                </button>
              </h3>
              {toolsOpen ? (
                <div id={toolsPanelId}>
                  <ul className="projects-section__tools-list">
                    {devTools.map((tool) => {
                      const Icon = toolIconMap[tool.id]
                      const priceExpanded = expandedToolPriceId === tool.id

                      return (
                        <li key={tool.id} className="projects-section__tool">
                          <span className="projects-section__tool-icon" aria-hidden="true">
                            <Icon />
                          </span>
                          <div className="projects-section__tool-row">
                            <span className="projects-section__tool-name">{tool.name}</span>
                            {tool.priceDetail ? (
                              <button
                                type="button"
                                className="projects-section__tool-price projects-section__tool-price--button"
                                aria-expanded={priceExpanded}
                                onClick={() =>
                                  setExpandedToolPriceId((current) =>
                                    current === tool.id ? null : tool.id,
                                  )
                                }
                              >
                                {tool.priceLabel}
                              </button>
                            ) : (
                              <span className="projects-section__tool-price">{tool.priceLabel}</span>
                            )}
                          </div>
                          {tool.priceDetail && priceExpanded ? (
                            <p className="projects-section__tool-detail">{renderPriceDetail(tool)}</p>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          <AvatarGroup
            className="projects-grid"
            items={projects.map((project) => (
              <span key={project.id} className="t-tt-wrap">
                <button
                  type="button"
                  className="t-tt-trigger projects-grid__avatar-btn"
                  onClick={() => openProject(project)}
                  aria-label={`View details for ${project.name}`}
                  aria-describedby={`project-tt-${project.id}`}
                >
                  <img
                    className="projects-grid__avatar-img"
                    src={project.iconSrc}
                    alt=""
                    width={48}
                    height={48}
                    loading="lazy"
                  />
                </button>
                <span className="t-tt" id={`project-tt-${project.id}`} role="tooltip">
                  {project.name}
                </span>
              </span>
            ))}
          />
        </div>
      </section>

      <ProjectDetailModal
        project={selectedProject}
        isOpen={modalOpen}
        isClosing={modalClosing}
        onClose={closeProject}
      />
    </>
  )
}

export default ProjectsSection
