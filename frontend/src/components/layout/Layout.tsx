import { Outlet } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import WhatsAppFloat from "./WhatsAppFloat"
import ChatWidget from "@/components/chat/ChatWidget"

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloat />
      <ChatWidget />
    </div>
  )
}
