import { Link } from '@tanstack/react-router'

export type SiteNavItem = {
  label: string
  to: string
  hash?: string
}

type SiteHeaderProps = {
  navItems: SiteNavItem[]
  logoTo?: string
}

const pagePadX = 'px-[clamp(20px,3.2vw,44px)]'

function SiteHeader({ navItems, logoTo = '/landing' }: SiteHeaderProps) {
  return (
    <header
      className={`border-b border-line bg-void-900 ${pagePadX}`}
    >
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-6">
        <Link
          to={logoTo}
          className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solar/60 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
        >
          <img
            src="/brand/lynx-logo.png"
            alt="Lynx"
            className="h-10 w-auto sm:h-11"
            width={168}
            height={44}
            decoding="async"
          />
        </Link>

        <nav aria-label="Primary">
          <ul className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
            {navItems.map((item) => (
              <li key={`${item.to}${item.hash ?? ''}-${item.label}`}>
                <Link
                  to={item.to}
                  hash={item.hash}
                  className="rounded-sm px-3 py-2 text-[13px] font-medium text-ink-muted transition-colors hover:text-object focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solar/60 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}

export { SiteHeader, type SiteHeaderProps }
