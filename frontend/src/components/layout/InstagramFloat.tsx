import { motion } from "framer-motion"
import { FaInstagram } from "react-icons/fa"
import { CONTACTS } from "@/lib/fallbackData"

export default function InstagramFloat() {
  return (
    <motion.a
      href={CONTACTS.instagram}
      target="_blank"
      rel="noreferrer"
      aria-label="Message us on Instagram"
      className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={{
        background:
          "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
      }}
      initial={{ rotate: 0, scale: 1 }}
      whileHover={{
        rotate: 360,
        scale: 1.15,
        transition: { rotate: { duration: 0.6, ease: "easeInOut" }, scale: { duration: 0.2 } },
      }}
      whileTap={{ scale: 0.9 }}
    >
      <FaInstagram className="h-6 w-6" />
    </motion.a>
  )
}