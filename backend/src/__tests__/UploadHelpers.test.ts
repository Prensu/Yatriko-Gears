import { describe, expect, it } from "vitest"
import { mapCloudinaryImage } from "../utilities/helpers"
import { GearCreateDTO } from "../modules/gear/GearDto"
import { CategoryCreateDTO } from "../modules/category/CategoryDto"
import { DestinationCreateDTO } from "../modules/destination/DestinationDto"
import { SettingsUpdateDTO } from "../modules/settings/SettingsDto"
import { UpdateProfileDTO } from "../modules/auth/AuthDto"

describe("mapCloudinaryImage", () => {
  it("correctly maps Cloudinary response to ImageSchema shape", () => {
    const mapped = mapCloudinaryImage({
      url: "https://res.cloudinary.com/demo/image/upload/v12345/yatriko/images/gear/tent-sample.jpg",
      publicId: "yatriko/images/gear/tent-sample",
    })

    expect(mapped).toEqual({
      url: "https://res.cloudinary.com/demo/image/upload/v12345/yatriko/images/gear/tent-sample.jpg",
      path: "yatriko/images/gear/tent-sample",
      filename: "tent-sample",
      size: undefined,
      mimeType: undefined,
    })
  })
})

describe("Cloudinary DTOs image fields acceptance", () => {
  it("accepts imageUrl and imagePublicId in GearCreateDTO", () => {
    const parsed = GearCreateDTO.safeParse({
      name: "Trekking Pole",
      realPrice: 500,
      discountedPrice: 400,
      imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/yatriko/images/gear/pole.jpg",
      imagePublicId: "yatriko/images/gear/pole",
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.imageUrl).toBe("https://res.cloudinary.com/demo/image/upload/v1/yatriko/images/gear/pole.jpg")
      expect(parsed.data.imagePublicId).toBe("yatriko/images/gear/pole")
    }
  })

  it("accepts imageUrl and imagePublicId in CategoryCreateDTO", () => {
    const parsed = CategoryCreateDTO.safeParse({
      name: "Tents",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/yatriko/images/brands/tent.jpg",
      imagePublicId: "yatriko/images/brands/tent",
    })
    expect(parsed.success).toBe(true)
  })

  it("accepts imageUrl and imagePublicId in DestinationCreateDTO", () => {
    const parsed = DestinationCreateDTO.safeParse({
      name: "Nagarkot",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/yatriko/images/spots/nagarkot.jpg",
      imagePublicId: "yatriko/images/spots/nagarkot",
    })
    expect(parsed.success).toBe(true)
  })

  it("accepts imageUrl and imagePublicId in SettingsUpdateDTO", () => {
    const parsed = SettingsUpdateDTO.safeParse({
      imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/yatriko/images/settings/banner.jpg",
      imagePublicId: "yatriko/images/settings/banner",
    })
    expect(parsed.success).toBe(true)
  })

  it("accepts imageUrl and imagePublicId in UpdateProfileDTO", () => {
    const parsed = UpdateProfileDTO.safeParse({
      name: "Admin User",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/yatriko/images/users/avatar.jpg",
      imagePublicId: "yatriko/images/users/avatar",
    })
    expect(parsed.success).toBe(true)
  })
})
