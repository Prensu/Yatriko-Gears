import { FaWhatsapp } from "react-icons/fa6"

export default function WhatsAppFloat() {
  const number = import.meta.env.VITE_WHATSAPP_NUMBER || "9779747672039"
  return (
    <a
      href={`https://wa.me/${number}?text=${encodeURIComponent("Hi Yatriko Gears! I want to rent camping gear.")}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
    >
      <FaWhatsapp className="h-8 w-8" />
    </a>
  )
}

