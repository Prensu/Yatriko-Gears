import { useState } from "react"
import { Link, NavLink } from "react-router-dom"
import logoImg from "@/assets/logo.png"

const navItems = [
  { to: "/", label: "Home" },
  { to: "/gear", label: "Gear" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/contact", label: "Contact" },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="container-site flex h-20 items-center justify-between">
        <Link to="/" className="flex items-center gap-3 font-display text-xl font-extrabold text-forest-700">
          <img src={logoImg} alt="Yatriko Gears Logo" className="h-20 w-auto object-contain sm:h-28 md:h-16" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `font-display text-sm font-semibold transition hover:text-forest-600 ${
                  isActive ? "text-forest-700" : "text-navy-800"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Link to="/gear" className="btn-primary !px-5 !py-2 text-sm">
            Rent Gear
          </Link>
        </nav>

        <button
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span className="text-2xl">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {open && (
        <nav className="border-t border-slate-100 bg-white px-6 py-4 md:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block py-3 font-display font-semibold text-navy-800"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
