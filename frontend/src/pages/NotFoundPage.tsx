import { Link } from "react-router-dom"

export default function NotFoundPage() {
  return (
    <section className="section-pad text-center">
      <p className="text-6xl">🧭</p>
      <h1 className="mt-4 font-display text-3xl font-extrabold text-navy-900">Lost off the trail?</h1>
      <p className="mt-2 text-slate-500">This page doesn't exist — let's get you back to camp.</p>
      <Link to="/" className="btn-primary mt-8">Back to Home</Link>
    </section>
  )
}
