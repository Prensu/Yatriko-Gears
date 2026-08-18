import { Routes, Route } from "react-router-dom"
import Layout from "@/components/layout/Layout"
import HomePage from "@/pages/HomePage"
import GearPage from "@/pages/GearPage"
import ContactPage from "@/pages/ContactPage"
import PortfolioPage from "@/pages/PortfolioPage"
import NotFoundPage from "@/pages/NotFoundPage"
import LeadCaptureModal from "@/components/modal/LeadCaptureModal"

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="gear" element={<GearPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="contact" element={<ContactPage />} />
          {/* Future: /admin CMS routes mount here behind auth */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      <LeadCaptureModal />
    </>
  )
}
