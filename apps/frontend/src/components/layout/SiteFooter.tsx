import { Link } from '@tanstack/react-router'

export type SiteFooterLink = {
  label: string
  to: string
  hash?: string
}

type SiteFooterProps = {
  links?: SiteFooterLink[]
  /** Short line beside copyright (brand kit footer style). */
  aside?: string
}

const pagePadX = 'px-[clamp(20px,3.2vw,44px)]'

function SiteFooter({ links = [], aside }: SiteFooterProps) {
  const year = new Date().getFullYear()

  return (
    <footer
      className={`mt-auto border-t border-line bg-void-900 ${pagePadX} py-4`}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-data text-ink-faint">
          <span className="text-object">Lynx</span>
          <span aria-hidden="true"> · </span>
          <span>© {year}</span>
          {aside ? (
            <>
              <span aria-hidden="true"> · </span>
              <span>{aside}</span>
            </>
          ) : null}
        </p>

        {links.length > 0 ? (
          <nav aria-label="Footer">
            <ul className="flex flex-wrap items-center gap-x-1 gap-y-2 sm:justify-end">
              {links.map((item) => (
                <li key={`${item.to}${item.hash ?? ''}-${item.label}`}>
                  <Link
                    to={item.to}
                    hash={item.hash}
                    className="rounded-sm px-3 py-1.5 text-data text-ink-faint transition-colors hover:text-solar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solar/60 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </footer>
  )
}

export { SiteFooter, type SiteFooterProps }
