import ContactSection from "@/components/home/ContactSection"
import { usePageMeta } from "@/hooks/usePageMeta"

export default function ContactPage() {
  usePageMeta({
    title: "Contact Yatriko Gears",
    description: "Call, WhatsApp or message Yatriko Gears in Gabu, Khokana, Lalitpur to book camping gear across the Kathmandu valley.",
    path: "/contact",
  })

  return (
    <div className="bg-white">
      <ContactSection />
      {/* Map embed — Gabu, Khokana, Lalitpur */}
      <div className="container-site pb-20">
        <iframe
          title="Yatriko Gears location — Gabu, Khokana, Lalitpur"
          src="https://www.google.com/maps?q=Khokana,Lalitpur,Nepal&output=embed"
          className="h-80 w-full rounded-3xl border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  )
}
