import ContactSection from "@/components/home/ContactSection"

export default function ContactPage() {
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
