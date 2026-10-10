import { lazy } from "react"

export const loadGearPage = () => import("@/pages/GearPage")
export const loadGearDetailPage = () => import("@/pages/GearDetailPage")

export const GearPage = lazy(loadGearPage)
export const GearDetailPage = lazy(loadGearDetailPage)
