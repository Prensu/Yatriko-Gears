import fs from "node:fs"
import path from "node:path"
import multer from "multer"

/**
 * Higher-order middleware: uploader(dir) → configured multer instance.
 * Files land in public/uploads/<dir>/ and are served read-only at /images.
 * Keep fileSize in sync with the body-parser limit (3 MB).
 */
const uploader = (dir = "/") => {
  const myStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join("./public/uploads", dir)
      fs.mkdirSync(uploadPath, { recursive: true })
      cb(null, uploadPath)
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname)
    },
  })

  return multer({
    storage: myStorage,
    fileFilter: (req, file, cb) => {
      const allowedExts = ["jpg", "jpeg", "png", "gif", "svg", "webp"]
      const ext = file.originalname.split(".").pop()?.toLowerCase() as string
      if (allowedExts.includes(ext)) cb(null, true)
      else cb(new Error("File format not supported"))
    },
    limits: { fileSize: 3 * 1024 * 1024 },
  })
}

export default uploader
