import { Suspense, lazy } from "react"
import { Outlet, Routes, Route } from "react-router-dom"
import Layout from "@/components/layout/Layout"
import RequireAuth from "@/components/layout/RequireAuth"
import HomePage from "@/pages/HomePage"
import LeadCaptureModal from "@/components/modal/LeadCaptureModal"

/**
 * Only the home page ships in the initial bundle. Everything else loads on
 * demand — most visitors land on "/", and on a Nepali mobile connection every
 * kilobyte of first paint counts.
 */
const GearPage = lazy(() => import("@/pages/GearPage"))
const PortfolioPage = lazy(() => import("@/pages/PortfolioPage"))
const ContactPage = lazy(() => import("@/pages/ContactPage"))
const LoginPage = lazy(() => import("@/pages/LoginPage"))
const RegisterPage = lazy(() => import("@/pages/RegisterPage"))
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"))
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"))
const BookPage = lazy(() => import("@/pages/BookPage"))
const MyBookingsPage = lazy(() => import("@/pages/MyBookingsPage"))
const PaymentResultPage = lazy(() => import("@/pages/PaymentResultPage"))
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"))

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-forest-100 border-t-forest-600" />
    </div>
  )
}

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route
            element={
              <Suspense fallback={<RouteFallback />}>
                <Outlet />
              </Suspense>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="gear" element={<GearPage />} />
            <Route path="portfolio" element={<PortfolioPage />} />
            <Route path="contact" element={<ContactPage />} />

            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />

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
        </Route>
      </Routes>
      <LeadCaptureModal />
    </>
  )
}
