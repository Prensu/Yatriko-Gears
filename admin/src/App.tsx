import { Route, Routes } from "react-router-dom"
import AdminLayout from "@/components/layout/AdminLayout"
import RequireAdmin from "@/components/layout/RequireAdmin"
import LoginPage from "@/pages/LoginPage"
import DashboardPage from "@/pages/DashboardPage"
import GearListPage from "@/pages/gear/GearListPage"
import GearFormPage from "@/pages/gear/GearFormPage"
import CategoryListPage from "@/pages/categories/CategoryListPage"
import CategoryFormPage from "@/pages/categories/CategoryFormPage"
import PackageListPage from "@/pages/packages/PackageListPage"
import PackageFormPage from "@/pages/packages/PackageFormPage"
import DestinationListPage from "@/pages/destinations/DestinationListPage"
import DestinationFormPage from "@/pages/destinations/DestinationFormPage"
import VideosPage from "@/pages/VideosPage"
import BookingsPage from "@/pages/BookingsPage"
import LeadsPage from "@/pages/LeadsPage"
import SubscribersPage from "@/pages/SubscribersPage"
import CustomersPage from "@/pages/CustomersPage"
import SettingsPage from "@/pages/SettingsPage"
import NotFoundPage from "@/pages/NotFoundPage"

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Everything below requires a valid admin session. */}
      <Route element={<RequireAdmin />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />

          <Route path="gear" element={<GearListPage />} />
          <Route path="gear/new" element={<GearFormPage />} />
          <Route path="gear/:slug/edit" element={<GearFormPage />} />

          <Route path="categories" element={<CategoryListPage />} />
          <Route path="categories/new" element={<CategoryFormPage />} />
          <Route path="categories/:slug/edit" element={<CategoryFormPage />} />

          <Route path="packages" element={<PackageListPage />} />
          <Route path="packages/new" element={<PackageFormPage />} />
          <Route path="packages/:slug/edit" element={<PackageFormPage />} />

          <Route path="destinations" element={<DestinationListPage />} />
          <Route path="destinations/new" element={<DestinationFormPage />} />
          <Route path="destinations/:slug/edit" element={<DestinationFormPage />} />

          <Route path="videos" element={<VideosPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="subscribers" element={<SubscribersPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="settings" element={<SettingsPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
