import { NavLink } from "react-router-dom"

type NavItem = {
  to: string
  label: string
  icon: string
  end?: boolean
}

type NavGroup = {
  heading: string
  items: NavItem[]
}

/** Single-path icons keep the bundle free of an icon dependency. */
const NAV: NavGroup[] = [
  {
    heading: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: "M4 13h7V4H4v9Zm9 7h7v-9h-7v9ZM4 20h7v-5H4v5Zm9-11h7V4h-7v5Z", end: true }],
  },
  {
    heading: "Catalogue",
    items: [
      { to: "/gear", label: "Gear", icon: "M3 20h18L12 4 3 20Zm9-9 4 7H8l4-7Z" },
      { to: "/categories", label: "Categories", icon: "M4 6h16M4 12h16M4 18h10" },
      { to: "/packages", label: "Packages", icon: "M21 8 12 3 3 8l9 5 9-5Zm0 0v8l-9 5-9-5V8" },
      { to: "/destinations", label: "Destinations", icon: "M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" },
      { to: "/videos", label: "Videos", icon: "M15 10.5V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3.5l6 4v-11l-6 4Z" },
    ],
  },
  {
    heading: "Orders",
    items: [
      { to: "/bookings", label: "Bookings", icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4" },
    ],
  },
  {
    heading: "Audience",
    items: [
      { to: "/leads", label: "Leads", icon: "M3 8l9 6 9-6M3 6h18v12H3V6Z" },
      { to: "/subscribers", label: "Subscribers", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8a8 8 0 0 1 16 0" },
      { to: "/customers", label: "Customers", icon: "M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 8a6 6 0 0 1 12 0M14 20a6 6 0 0 1 8-5.7" },
    ],
  },
  {
    heading: "Account",
    items: [
      { to: "/promotions", label: "Promotions", icon: "M11 5.88V19.24a1 1 0 0 1-1.45.89L4 17.5H2a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h2l5.55-2.63a1 1 0 0 1 1.45.89ZM16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14" },
      { to: "/settings", label: "Settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8.4-3a8.4 8.4 0 0 0-.1-1.3l2-1.5-2-3.4-2.3 1a8.3 8.3 0 0 0-2.2-1.3L15.4 2h-3.9l-.4 2.5c-.8.3-1.5.7-2.2 1.3l-2.3-1-2 3.4 2 1.5a8.4 8.4 0 0 0 0 2.6l-2 1.5 2 3.4 2.3-1c.7.6 1.4 1 2.2 1.3l.4 2.5h3.9l.4-2.5c.8-.3 1.5-.7 2.2-1.3l2.3 1 2-3.4-2-1.5c.1-.4.1-.9.1-1.3Z" },
    ],
  },
]

type SidebarProps = {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-30 bg-ink-950/40 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-ink-800/40 bg-ink-950 transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center gap-2.5 border-b border-white/10 px-5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4 21 20H3L12 4Z" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">Yatriko Gears</p>
            <p className="text-[0.65rem] uppercase tracking-wider text-ink-400">Admin panel</p>
          </div>

          <button
            type="button"
            className="ml-auto rounded p-1 text-ink-300 transition hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {NAV.map((group) => (
            <div key={group.heading}>
              <p className="px-2 pb-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-ink-500">
                {group.heading}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition ${
                          isActive
                            ? "bg-brand-600 text-white"
                            : "text-ink-300 hover:bg-white/5 hover:text-white"
                        }`
                      }
                    >
                      <svg
                        className="h-4 w-4 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        aria-hidden="true"
                      >
                        <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <p className="border-t border-white/10 px-5 py-3 text-[0.65rem] text-ink-500">
          Gabu, Khokana · Lalitpur
        </p>
      </aside>
    </>
  )
}
