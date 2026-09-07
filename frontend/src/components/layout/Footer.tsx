import { Link } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa6";
import { CONTACTS } from "@/lib/fallbackData";
import logoImg from "@/assets/logo.png";

export default function Footer() {
  return (
    <footer className="relative bg-navy-900 text-slate-300">
      {/* Mountain silhouette divider (Trekking Planner style) */}
      <svg
        viewBox="0 0 1440 90"
        className="block w-full bg-white"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0,90 L120,40 L240,75 L380,20 L520,70 L660,10 L800,65 L940,25 L1080,70 L1220,35 L1340,60 L1440,15 L1440,90 Z"
          fill="#141d29"
        />
      </svg>

      <div className="container-site grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-white rounded-xl p-2">
              <img
                src={logoImg}
                alt="Yatriko Gears Logo"
                className="h-12 w-auto object-contain"
              />
            </div>
          </Link>
          <p className="mt-3 text-sm leading-relaxed">
            Rent the Best, Trek with Confidence. Camping gear rental & sales —
            delivery across Kathmandu, Lalitpur & Bhaktapur.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <a
              href={CONTACTS.facebook}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-300 transition-all duration-200 hover:bg-[#1877F2] hover:text-white hover:scale-110"
            >
              <FaFacebookF className="h-4 w-4" />
            </a>
            <a
              href={CONTACTS.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-300 transition-all duration-200 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white hover:scale-110"
            >
              <FaInstagram className="h-4.5 w-4.5" />
            </a>
            <a
              href={CONTACTS.tiktok}
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-300 transition-all duration-200 hover:bg-black hover:text-white hover:scale-110 hover:ring-1 hover:ring-white/20"
            >
              <FaTiktok className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <p className="font-display font-semibold text-white">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/gear" className="hover:text-white">
                All Gear
              </Link>
            </li>
            <li>
              <Link to="/portfolio" className="hover:text-white">
                Portfolio
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-white">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-display font-semibold text-white">Popular Spots</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>Jati Pokhari</li>
            <li>Hattiban</li>
            <li>Champadevi</li>
            <li>Bhundole</li>
            <li>Pharping</li>
          </ul>
        </div>

        <div>
          <p className="font-display font-semibold text-white">Contact</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>📍 {CONTACTS.address}</li>
            {CONTACTS.phones.map((p) => (
              <li key={p}>
                📞{" "}
                <a
                  href={`tel:${p.replace(/\s/g, "")}`}
                  className="hover:text-white"
                >
                  {p}
                </a>
              </li>
            ))}
            <li>
              ✉️{" "}
              <a href={`mailto:${CONTACTS.email}`} className="hover:text-white">
                {CONTACTS.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Yatriko Gears. All rights reserved. — Gear
        up. Head out. Make memories.
      </div>
    </footer>
  );
}
