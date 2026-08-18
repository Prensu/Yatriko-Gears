export default function WhatsAppFloat() {
  const number = import.meta.env.VITE_WHATSAPP_NUMBER || "9779747672039"
  return (
    <a
      href={`https://wa.me/${number}?text=${encodeURIComponent("Hi Yatriko Gears! I want to rent camping gear.")}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-2xl text-white shadow-lg transition hover:scale-110"
    >
      💬
    </a>
  )
}
