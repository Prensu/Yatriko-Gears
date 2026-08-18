import { useState } from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "@/components/layout/Sidebar"
import Topbar from "@/components/layout/Topbar"

/** Fixed sidebar + topbar shell wrapped around every authenticated route. */
export default function AdminLayout() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-ink-50">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="lg:pl-64">
        <Topbar onMenuClick={() => setNavOpen(true)} />
        <main className="mx-auto max-w-7xl p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
