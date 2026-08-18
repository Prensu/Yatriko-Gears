import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { fetchGear } from "@/api/gear"
import type { Gear } from "@/types"
import GearCard from "@/components/gear/GearCard"
import SectionHeading from "@/components/common/SectionHeading"

export default function GearGrid() {
  const [gear, setGear] = useState<Gear[]>([])
  useEffect(() => {
    fetchGear().then((all) => setGear(all.slice(0, 8)))
  }, [])

  return (
    <section className="section-pad bg-sand">
      <div className="container-site">
        <SectionHeading
          eyebrow="Camp More, Carry Less"
          title="Popular Gear"
          subtitle="Everything you need for a night under the stars — rented by the day, delivered to your door."
        />
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {gear.map((g) => (
            <GearCard key={g._id} gear={g} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link to="/gear" className="btn-secondary">See All Gear →</Link>
        </div>
      </div>
    </section>
  )
}
