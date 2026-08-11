export type Project = {
  id: string
  name: string
  tagline: string
  description: string
  githubUrl: string
  iconSrc: string
  tags: string[]
}

export const projects: Project[] = [
  {
    id: 'ash-links',
    name: 'Ash Links',
    tagline: 'Personal link hub.',
    description:
      'This site is a minimal links page with live Spotify status, Instagram avatar proxy, and social profiles. Open source and deployed on GitHub Pages.',
    githubUrl: 'https://github.com/itsasheruwu/ash',
    iconSrc: `${import.meta.env.BASE_URL}projects/ash-links.svg`,
    tags: ['React', 'Vite', 'GitHub Pages'],
  },
  {
    id: 'autotrade',
    name: 'Auto Trade Mod',
    tagline: 'Repeat villager trades automatically.',
    description:
      'Client-only Fabric mod for Minecraft 1.21 that repeats a selected villager trade while the merchant UI is open. Mod Menu settings, rate modes, and GitHub auto-updater.',
    githubUrl: 'https://github.com/itsasheruwu/Auto-Trade-Mod',
    iconSrc: `${import.meta.env.BASE_URL}projects/autotrade.png`,
    tags: ['Minecraft', 'Fabric', 'Java'],
  },
  {
    id: 'raycast-crop-photos',
    name: 'Crop Photos',
    tagline: 'Crop photos locally with Raycast.',
    description:
      'A privacy-friendly Raycast extension that crops photos from Finder, the clipboard, or a file picker, then saves a new copy without overwriting the original.',
    githubUrl: 'https://github.com/itsasheruwu/raycast-crop-photos',
    iconSrc: `${import.meta.env.BASE_URL}projects/raycast-crop-photos.png`,
    tags: ['Raycast', 'TypeScript', 'macOS'],
  },
  {
    id: 'graft',
    name: 'Graft',
    tagline: 'Small fixes, grafted onto the web.',
    description:
      'A Chrome extension for grafting small fixes onto the web: theme sync, element hiding, and YouTube auto-translation, with a clean settings UI and no bloat.',
    githubUrl: 'https://github.com/itsasheruwu/graft',
    iconSrc: `${import.meta.env.BASE_URL}projects/graft.png`,
    tags: ['Chrome extension', 'TypeScript', 'React'],
  },
  {
    id: 'veo',
    name: 'Veo',
    tagline: 'A Mac-native workspace for Codex.',
    description:
      'A local-first macOS workspace for Codex that keeps projects and chats together, streams live activity, supports change review and approvals, and includes a real docked terminal.',
    githubUrl: 'https://github.com/itsasheruwu/Veo',
    iconSrc: `${import.meta.env.BASE_URL}projects/veo.png`,
    tags: ['macOS', 'SwiftUI', 'Codex CLI'],
  },
  {
    id: 'video-frame-post-picker',
    name: 'Video Frame Post Picker',
    tagline: 'Pick Instagram-ready stills from video.',
    description:
      'Codex skill that extracts every frame from a video, helps you shortlist the best stills, crops a final Instagram feed image, and can polish lighting with image generation.',
    githubUrl: 'https://github.com/itsasheruwu/video-frame-post-picker',
    iconSrc: `${import.meta.env.BASE_URL}projects/video-frame-post-picker.png`,
    tags: ['Codex skill', 'ffmpeg', 'Instagram'],
  },
]
