import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import ThemeToggle from '../ThemeToggle'

const navLinkClass =
  'text-slate-600 no-underline transition hover:text-slate-950'
const activeNavLinkClass = `${navLinkClass} text-slate-950`
const mobileNavLinkClass =
  'block rounded-md px-3 py-2 text-sm font-medium text-slate-600 no-underline transition hover:bg-slate-50 hover:text-slate-950'
const activeMobileNavLinkClass = `${mobileNavLinkClass} bg-slate-50 text-slate-950`

export default function AppHeader() {
  return (
    <Disclosure
      as="header"
      className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 px-4 backdrop-blur"
    >
      {({ open, close }) => (
        <>
          <nav className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6">
            <Link
              to="/"
              className="text-sm font-semibold tracking-tight text-slate-950 no-underline"
            >
              Satellite Server
            </Link>

            <div className="hidden items-center gap-4 text-sm font-medium sm:flex">
              <Link
                to="/"
                className={navLinkClass}
                activeProps={{ className: activeNavLinkClass }}
              >
                Home
              </Link>
              <Link
                to="/globe"
                className={navLinkClass}
                activeProps={{ className: activeNavLinkClass }}
              >
                Globe
              </Link>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <DisclosureButton className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-slate-300 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 sm:hidden">
                <span className="sr-only">Toggle navigation</span>
                {open ? (
                  <X className="size-4" aria-hidden="true" />
                ) : (
                  <Menu className="size-4" aria-hidden="true" />
                )}
              </DisclosureButton>
            </div>
          </nav>

          <DisclosurePanel className="mx-auto w-full max-w-7xl pb-3 sm:hidden">
            <div className="space-y-1 border-t border-slate-100 pt-3">
              <Link
                to="/"
                className={mobileNavLinkClass}
                activeProps={{ className: activeMobileNavLinkClass }}
                onClick={() => close()}
              >
                Home
              </Link>
              <Link
                to="/globe"
                className={mobileNavLinkClass}
                activeProps={{ className: activeMobileNavLinkClass }}
                onClick={() => close()}
              >
                Globe
              </Link>
            </div>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  )
}
