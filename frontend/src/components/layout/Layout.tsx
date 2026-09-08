import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import WhatsAppFloat from "./WhatsAppFloat";
import InstagramFloat from "./InstagramFloat";
import ChatWidget from "@/components/chat/ChatWidget";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />

      {/* Floating action buttons */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Instagram - directly above WhatsApp */}
        <div className="absolute bottom-[76px] right-0">
          <InstagramFloat />
        </div>

        {/* Chat + WhatsApp row */}
        <div className="flex items-center gap-3">
          <ChatWidget />
          <WhatsAppFloat />
        </div>
      </div>
    </div>
  );
}
