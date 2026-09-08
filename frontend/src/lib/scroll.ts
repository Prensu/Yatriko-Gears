export function scrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "smooth" })
}

export function scrollToAnchor(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  })
}
