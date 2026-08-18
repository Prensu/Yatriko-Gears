import Hero from "@/components/home/Hero"
import GearGrid from "@/components/home/GearGrid"
import PackageBand from "@/components/home/PackageBand"
import SpotsSection from "@/components/home/SpotsSection"
import BrandMarquee from "@/components/home/BrandMarquee"
import InstaFeed from "@/components/home/InstaFeed"
import ContactSection from "@/components/home/ContactSection"

export default function HomePage() {
  return (
    <>
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
