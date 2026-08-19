import { Routes, Route } from "react-router-dom"
import Layout from "@/components/layout/Layout"
import RequireAuth from "@/components/layout/RequireAuth"
import HomePage from "@/pages/HomePage"
import GearPage from "@/pages/GearPage"
import ContactPage from "@/pages/ContactPage"
import PortfolioPage from "@/pages/PortfolioPage"
import LoginPage from "@/pages/LoginPage"
import RegisterPage from "@/pages/RegisterPage"
import BookPage from "@/pages/BookPage"
import MyBookingsPage from "@/pages/MyBookingsPage"
import PaymentResultPage from "@/pages/PaymentResultPage"
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

          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />

          {/* eSewa returns the customer to these two. */}
          <Route path="payment/success" element={<PaymentResultPage outcome="success" />} />
          <Route path="payment/failure" element={<PaymentResultPage outcome="failure" />} />

          {/* Booking screens need a signed-in customer. */}
          <Route element={<RequireAuth />}>
            <Route path="book/:slug" element={<BookPage />} />
            <Route path="bookings" element={<MyBookingsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      <LeadCaptureModal />
    </>
  )
}
