import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa6";
import { CONTACTS } from "@/lib/fallbackData";
import logoImg from "@/assets/logo.png";

const HIKER_SCENE_URL =
  "https://res.cloudinary.com/dothc374l/image/upload/v1789070750/footer-scene_4_wkf45k.svg";

const socialLinks = [
  {
    href: CONTACTS.facebook,
    icon: FaFacebookF,
    label: "Facebook",
    hoverBg: "#1877F2",
  },
  {
    href: CONTACTS.instagram,
    icon: FaInstagram,
    label: "Instagram",
    hoverBg:
      "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
  },
  {
    href: CONTACTS.tiktok,
    icon: FaTiktok,
    label: "TikTok",
    hoverBg: "#000000",
  },
];

const columnReveal = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

function FooterLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="group relative inline-flex items-center text-sm text-slate-300 transition-colors hover:text-white"
    >
      <span
        className="absolute -left-4 -translate-x-1 text-emerald-400 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
        aria-hidden="true"
      >
        →
      </span>
      <span className="transition-transform duration-200 group-hover:translate-x-3">
        {children}
      </span>
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#1f2e60] text-slate-300">
      {/* Mountain + trekkers scene, served from Cloudinary.
          Its bottom band is #1f2e60, which matches the footer background above. */}
    <img
      src={HIKER_SCENE_URL}
      alt=""
      aria-hidden="true"
      width={1440}
      height={256}
      className="-mb-px block h-auto w-full select-none"
      loading="lazy"
      decoding="async"
      draggable={false}
    />

      <div className="container-site grid gap-10 py-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand + socials */}
        <motion.div
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={columnReveal}
        >
          <Link to="/" className="flex items-center gap-3">
            <div className="rounded-xl bg-white p-2">
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
          <div className="mt-5 flex gap-3 text-lg">
            {socialLinks.map(({ href, icon: Icon, label, hoverBg }) => (
              <motion.a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-200"
                initial={{ scale: 1, rotate: 0 }}
                whileHover={{
                  scale: 1.15,
                  rotate: -8,
                  y: -3,
                  background: hoverBg,
                  color: "#ffffff",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
                }}
                whileTap={{ scale: 0.9, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <Icon aria-hidden="true" />
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Explore */}
        <motion.div
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={columnReveal}
        >
          <p className="font-display font-semibold text-white">Explore</p>
          <ul className="mt-4 space-y-2">
            <li>
              <FooterLink to="/gear">All Gear</FooterLink>
            </li>
            <li>
              <FooterLink to="/portfolio">Portfolio</FooterLink>
            </li>
            <li>
              <FooterLink to="/contact">Contact Us</FooterLink>
            </li>
          </ul>
        </motion.div>

        {/* Popular Spots */}
        <motion.div
          custom={2}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={columnReveal}
        >
          <p className="font-display font-semibold text-white">Popular Spots</p>
          <ul className="mt-4 space-y-2">
            {["Jati Pokhari", "Hattiban", "Champadevi", "Bhundole", "Pharping"].map(
              (spot) => (
                <li key={spot}>
                  <FooterLink to="/#popular-spots">{spot}</FooterLink>
                </li>
              )
            )}
          </ul>
        </motion.div>

        {/* Contact */}
        <motion.div
          custom={3}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={columnReveal}
        >
          <p className="font-display font-semibold text-white">Contact</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <span className="mt-0.5">📍</span>
              <span>{CONTACTS.address}</span>
            </li>
            {CONTACTS.phones.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <span>📞</span>
                <a
                  href={`tel:${p.replace(/\s/g, "")}`}
                  className="group relative text-slate-300 hover:text-white"
                >
                  {p}
                  <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-emerald-400 transition-all duration-300 group-hover:w-full"></span>
                </a>
              </li>
            ))}
            <li className="flex items-center gap-2">
              <span>✉️</span>
              <a
                href={`mailto:${CONTACTS.email}`}
                className="group relative text-slate-300 hover:text-white"
              >
                {CONTACTS.email}
                <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-emerald-400 transition-all duration-300 group-hover:w-full"></span>
              </a>
            </li>
          </ul>
        </motion.div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Yatriko Gears. All rights reserved. — Gear
        up. Head out. Make memories.
      </div>
    </footer>
  );
}