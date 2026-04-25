import { type ErrorInfo, type ReactNode, Component } from 'react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(error, errorInfo)
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div
          className={cn(
            'app-shell',
            'flex min-h-svh flex-col items-center justify-center gap-3 px-6 text-center',
            'text-muted-foreground',
          )}
        >
          <p className="text-sm">Something went wrong while loading this page.</p>
          <button
            type="button"
            className={buttonVariants({ variant: 'outline', size: 'default' })}
            onClick={() => {
              globalThis.location.reload()
            }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
