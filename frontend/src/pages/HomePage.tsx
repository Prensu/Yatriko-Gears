import Hero from "@/components/home/Hero"
import GearGrid from "@/components/home/GearGrid"
import PackageBand from "@/components/home/PackageBand"
import SpotsSection from "@/components/home/SpotsSection"
import BrandMarquee from "@/components/home/BrandMarquee"
import InstaFeed from "@/components/home/InstaFeed"
import ContactSection from "@/components/home/ContactSection"
import { usePageMeta } from "@/hooks/usePageMeta"
import StructuredData from "@/components/common/StructuredData"

export default function HomePage() {
  usePageMeta({
    title: "Camping Gear Rental in Kathmandu & Lalitpur",
    description: "Rent tents, sleeping bags, stoves and trekking gear in Nepal. Delivered across Kathmandu, Lalitpur and Bhaktapur. Rent the best, trek with confidence.",
    path: "/",
  })

  return (
    <>
      <StructuredData />
      <Hero />
      <GearGrid />
      <PackageBand />
      <SpotsSection />
      <BrandMarquee />
      <InstaFeed />
      <ContactSection />
    </>
  )
}
