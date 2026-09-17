import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/read', label: 'Read' },
  { to: '/to-read', label: 'To-Read' },
  { to: '/discover', label: 'Discover' },
]

export function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom,0px)] sm:sticky sm:top-0 sm:border-t-0 sm:border-b">
      <ul className="mx-auto flex max-w-3xl">
        {TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              className={({ isActive }) =>
                `block px-2 py-3 text-center text-[13px] font-medium tracking-wide transition-colors ${
                  isActive ? 'text-ink' : 'text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <span className="relative inline-block">
                  {tab.label}
                  {isActive && (
                    <span className="absolute -bottom-[10px] left-0 right-0 h-[2px] bg-ink sm:-bottom-3" />
                  )}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
