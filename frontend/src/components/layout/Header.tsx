import { useState } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import logoImg from "@/assets/logo.png"
import { useAuth } from "@/context/AuthContext"
import { useCart } from "@/context/CartContext"
import AccountMenu, { Avatar } from "@/components/layout/AccountMenu"

const navItems = [
  { to: "/", label: "Home" },
  { to: "/gear", label: "Gear" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/contact", label: "Contact" },
]

function CartIcon({ count }: { count: number }) {
  return (
    <Link
      to="/cart"
      className="relative flex items-center justify-center rounded-full p-2 text-navy-800 transition hover:bg-forest-50 hover:text-forest-700"
      aria-label={`Cart — ${count} item${count !== 1 ? "s" : ""}`}
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[1.125rem] items-center justify-center rounded-full bg-forest-600 px-1 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  )
}

export default function Header() {
  const [open, setOpen] = useState(false)
  const { user, status, signOut } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    setOpen(false)
    navigate("/")
  }
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

          <CartIcon count={itemCount} />

          {status === "authenticated" ? (
            <AccountMenu />
          ) : (
            <Link
              to="/login"
              className="font-display text-sm font-semibold text-navy-800 transition hover:text-forest-600"
            >
              Login
            </Link>
          )}

          <Link to="/gear" className="btn-primary !px-5 !py-2 text-sm">
            Rent Gear
          </Link>
        </nav>

        {/* Mobile: cart icon + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <CartIcon count={itemCount} />
          <button
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <span className="text-2xl">{open ? "✕" : "☰"}</span>
          </button>
        </div>
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

          <div className="mt-2 border-t border-slate-100 pt-2">
            {status === "authenticated" ? (
              <>
                <div className="mb-1 flex items-center gap-3 rounded-2xl bg-sand px-3 py-3">
                  <Avatar size="h-10 w-10" />
                  <div className="min-w-0">
                    <p className="truncate font-display font-bold text-navy-900">{user?.name}</p>
                    <p className="truncate text-xs text-slate-500">{user?.email}</p>
                  </div>
                </div>
                <NavLink
                  to="/bookings"
                  onClick={() => setOpen(false)}
                  className="block py-3 font-display font-semibold text-navy-800"
                >
                  My Bookings
                </NavLink>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="block w-full py-3 text-left font-display font-semibold text-navy-800"
                >
                  Logout ({user?.name?.split(" ")[0]})
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="block py-3 font-display font-semibold text-navy-800"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="block py-3 font-display font-semibold text-forest-700"
                >
                  Create account
                </NavLink>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
