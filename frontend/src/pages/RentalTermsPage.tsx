import { Link } from "react-router-dom"
import { usePageMeta } from "@/hooks/usePageMeta"
import logoImg from "@/assets/logo.png"

const bulletItems = [
  "Customers must present the original valid Nepali ID (no photocopy or digital copy accepted) and pay the security deposit before taking any gear.",
  "Gear must be returned clean and undamaged. Fees will be charged for:  Damage .",
  "Late return will be charge extra Rs. 100 per day and other charges will be add as per your rented gears day wise .",
  "Lost item (full replacement cost).",
  "Yatriko Gears is not responsible for any injury or loss occurring during the use of rented items. Not even for Natural Disasters.",
  "No fire, smoking, inside the tent and do not cut, damage or fire all the gears.",
  "The customer is advised to inspect all gear before leaving the shop.",
  "Use the gear only for trekking/hiking /camping purposes.",
  "50 % is must in advance booking and full payment must be made before tent delivery.",
  "If cancelled before 24 hours, the advance payment is non-refundable. If cancelled before 48 hours, 50% of the advance payment is refundable.",
  "No refund for early return unless previously agreed.",
  "In case of damage(burnt, cut, tear, breakage) of the tent and other yatriko gears, the full cost will apply.",
  "All payments for damages must be cleared upon return of the rented items.",
  "Our service is open from 6 AM to 6 PM",
]

export default function RentalTermsPage() {
  usePageMeta({
    title: "Terms and Conditions | Yatriko Gears",
    description: "Terms and conditions for renting gear from Yatriko Gears.",
    path: "/rental-terms",
  })

  return (
    <section className="bg-sand px-4 py-10 sm:py-16 print:bg-white print:px-0 print:py-0">
      <style>{`@media print { header, nav, footer, .terms-print-hidden { display: none !important; } @page { size: A4; margin: 16mm; } }`}</style>
      <div className="mx-auto max-w-3xl">
        <div className="terms-print-hidden mb-5 flex items-center justify-between gap-4">
          <Link to="/rental-list" className="text-sm font-semibold text-forest-700 hover:underline">← Back to rental list</Link>
          <button type="button" onClick={() => window.print()} className="btn-secondary !px-4 !py-2 text-sm">Print this page</button>
        </div>
        <article className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-12 sm:py-10 print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <img src={logoImg} alt="Yatriko Gears" className="pointer-events-none absolute right-8 top-36 w-56 opacity-[0.025] sm:right-16" aria-hidden="true" />
          <div className="relative">
            <img src={logoImg} alt="Yatriko Gears" className="h-20 w-auto object-contain object-left" />
            <h1 className="mt-8 border-b-2 border-forest-600 pb-4 font-display text-3xl font-extrabold text-navy-900 sm:text-4xl">Terms and Conditions</h1>
            <ul className="mt-7 list-disc space-y-3 pl-5 text-sm leading-7 text-slate-700 sm:text-base">
              {bulletItems.map((item) => <li key={item}>{item}</li>)}
              <li><strong>Payment Gateways:</strong> Esewa, khalti , IME pay, Mobile Banking , Cash.</li>
            </ul>
            <section className="mt-9"><h2 className="font-display text-xl font-bold text-navy-900">Security Deposit</h2><p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base"><strong>A refundable deposit of Rs. 1500 is required and will be returned upon proper return and inspection of the rented gear.</strong></p></section>
            <section className="mt-8"><h2 className="font-display text-xl font-bold text-navy-900">Declaration</h2><p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">I confirm that I have received the above gear in good condition and agree to all terms and conditions of this rental agreement.</p></section>
            <div className="mt-12 grid gap-10 text-sm text-slate-700 sm:grid-cols-2 sm:gap-16">
              <div className="space-y-7"><p className="flex items-end gap-2">Staff Signature:<span className="mb-1 h-5 flex-1 border-b border-slate-400" /></p><p className="flex items-end gap-2">Date :<span className="mb-1 h-5 flex-1 border-b border-slate-400" /></p></div>
              <div className="space-y-7"><p className="flex items-end gap-2">Customer Signature:<span className="mb-1 h-5 flex-1 border-b border-slate-400" /></p><p className="flex items-end gap-2">Date :<span className="mb-1 h-5 flex-1 border-b border-slate-400" /></p></div>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
