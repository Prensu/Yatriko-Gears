import ContactSection from "@/components/home/ContactSection";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function ContactPage() {
  usePageMeta({
    title: "Contact Yatriko Gears",
    description:
      "Call, WhatsApp or message Yatriko Gears in Gabu, Khokana, Lalitpur to book camping gear across the Kathmandu valley.",
    path: "/contact",
  });

  return (
    <div className="bg-white">
      <ContactSection />
      {/* Map embed — Gabu, Khokana, Lalitpur */}
      <div className="container-site pb-20 font-sans">
        <div className="overflow-hidden rounded-[20px] border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3.5 dark:border-neutral-700">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-red-50 dark:bg-red-950">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-red-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <p className="m-0 text-[15px] font-medium text-neutral-900 dark:text-neutral-100">
                  Yatriko Gears
                </p>
                <p className="m-0 text-xs text-neutral-400">
                  Gabu, Khokana · Lalitpur, Nepal
                </p>
              </div>
            </div>

            <a
              href="https://maps.google.com/?q=Yatriko+Gears+Khokana+Lalitpur"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-500 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h6v6" />
                <path d="M10 14 21 3" />
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              </svg>
              Directions
            </a>
          </div>

          {/* Map */}
          <div className="relative w-full" style={{ aspectRatio: '21/8' }}>
            <iframe
              title="Yatriko Gears Location Map"
              src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d56135.0!2d85.2991!3d27.6361!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb17b1fed68f55%3A0xb6292b78cbacdcfd!2sYatriko%20Gears!5e1!3m2!1sen!2snp!4v1788350529236!5m2!1sen!2snp"
              className="absolute inset-0 h-full w-full"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-neutral-200 bg-white px-5 py-2.5 dark:border-neutral-700 dark:bg-neutral-900">
            <span className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="2" x2="5" y1="12" y2="12" />
                <line x1="19" x2="22" y1="12" y2="12" />
                <line x1="12" x2="12" y1="2" y2="5" />
                <line x1="12" x2="12" y1="19" y2="22" />
                <circle cx="12" cy="12" r="7" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              27.6361° N, 85.2991° E
            </span>
            <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] text-green-600 dark:bg-green-950 dark:text-green-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" /> Open now
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
