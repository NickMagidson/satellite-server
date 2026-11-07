import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'

interface GlobeWorkspaceShellProps {
  enabled: boolean
  sidebar: ReactNode
  children: ReactNode
}

export default function GlobeWorkspaceShell({
  enabled,
  sidebar,
  children,
}: GlobeWorkspaceShellProps) {
  const [isOpen, setIsOpen] = useState(true)

  if (!enabled) {
    return <>{children}</>
  }

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-void text-object">
      <aside
        id="lynx-chat-panel"
        aria-label="Ask Lynx"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`absolute inset-y-0 left-0 z-40 flex shrink-0 flex-col overflow-hidden border-r border-line-strong bg-void-800 transition-[width] duration-200 lg:relative lg:z-auto ${isOpen ? 'w-full sm:w-[400px]' : 'w-0 !border-r-0'}`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line px-4">
          <div className="flex items-center gap-2">
            <img src="/brand/lynx-mark.png" alt="" className="size-7" />
            <span className="text-sm font-semibold">Ask Lynx</span>
          </div>
          <button
            type="button"
            aria-label="Hide chat"
            aria-controls="lynx-chat-panel"
            aria-expanded={isOpen}
            onClick={() => setIsOpen(false)}
            className="rounded-sm p-2 text-ink-muted hover:bg-void-700 hover:text-object focus:outline-none focus-visible:ring-2 focus-visible:ring-solar/60"
          >
            <PanelLeftClose className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{sidebar}</div>
      </aside>

      <div className="relative min-w-0 flex-1">
        {!isOpen && (
          <button
            type="button"
            aria-label="Show chat"
            aria-controls="lynx-chat-panel"
            aria-expanded={isOpen}
            onClick={() => setIsOpen(true)}
            className="absolute left-4 top-4 z-30 flex size-10 items-center justify-center rounded-sm border border-line-strong bg-void-600 text-object shadow-lg hover:bg-void-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-solar/60"
          >
            <PanelLeftOpen className="size-4" aria-hidden="true" />
          </button>
        )}
        {children}
      </div>
    </div>
  )
}
