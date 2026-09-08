import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import Hero from "@/components/home/Hero"
import GearGrid from "@/components/home/GearGrid"
import PackageBand from "@/components/home/PackageBand"
import SpotsSection from "@/components/home/SpotsSection"
import BrandMarquee from "@/components/home/BrandMarquee"
import InstaFeed from "@/components/home/InstaFeed"
import ContactSection from "@/components/home/ContactSection"
import { usePageMeta } from "@/hooks/usePageMeta"
import StructuredData from "@/components/common/StructuredData"
import { scrollToAnchor } from "@/lib/scroll"

export default function HomePage() {
  usePageMeta({
    title: "Camping Gear Rental in Kathmandu & Lalitpur",
    description: "Rent tents, sleeping bags, stoves and trekking gear in Nepal. Delivered across Kathmandu, Lalitpur and Bhaktapur. Rent the best, trek with confidence.",
    path: "/",
  })

  const { hash } = useLocation()

  // Footer "Popular Spots" links target /#popular-spots. React Router does
  // not auto-scroll to hash anchors, so scroll manually. Depends on `hash`
  // (not just mount) so same-route clicks while already on "/" still scroll.
  // SpotsSection renders synchronously, but defer a frame so it is in the DOM.
  useEffect(() => {
    if (!hash) return
    const id = hash.replace(/^#/, "")
    if (!id) return
    const frame = requestAnimationFrame(() => {
      scrollToAnchor(id)
    })
    return () => cancelAnimationFrame(frame)
  }, [hash])

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
