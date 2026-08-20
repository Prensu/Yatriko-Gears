import fs from "node:fs"
import path from "node:path"
import type { NextFunction, Request, Response } from "express"
import sharp from "sharp"
import { loggerFor } from "../config/logger"

const log = loggerFor("image-optimize")

/**
 * Higher-order middleware: optimizeImage(maxWidth) → middleware.
 * Runs AFTER uploader().single(...) and rewrites the file on disk.
 *
 * Without this the CMS stores whatever came off a phone — a 2048x2048, 300 KB+
 * JPEG rendered in a 400px card. Every visitor then downloads the full thing.
 *
 * Optimisation must never block a save: if sharp fails for any reason the
 * original file stands and the request continues.
 */
const SKIP_EXTENSIONS = new Set([".svg", ".gif"]) // vector and animated: leave alone

export const optimizeImage =
  (maxWidth = 1200) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    const file = req.file
    if (!file) return next()

    const extension = path.extname(file.filename).toLowerCase()
    if (SKIP_EXTENSIONS.has(extension)) return next()

    try {
      // Read first, then overwrite the same path — sharp must not read the
      // file it is writing.
      const original = await fs.promises.readFile(file.path)
      const image = sharp(original, { failOn: "none" })
      const meta = await image.metadata()

      let pipeline = image
      if ((meta.width ?? 0) > maxWidth) {
        pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true })
      }

      // Keep the format so the stored filename and URL stay valid.
      pipeline =
        extension === ".png"
          ? pipeline.png({ compressionLevel: 9 })
          : extension === ".webp"
            ? pipeline.webp({ quality: 82 })
            : pipeline.jpeg({ quality: 82, progressive: true, mozjpeg: true })

      const optimized = await pipeline.toBuffer()

      // Only keep it if it actually helped — re-encoding can inflate a file
      // that was already well compressed.
      if (optimized.length < original.length) {
        await fs.promises.writeFile(file.path, optimized)
        file.size = optimized.length
        log.info(
          {
            filename: file.filename,
            beforeKb: Math.round(original.length / 1024),
            afterKb: Math.round(optimized.length / 1024),
            width: Math.min(meta.width ?? maxWidth, maxWidth),
          },
          "image optimized",
        )
      }
    } catch (error) {
      log.warn({ err: error, filename: file.filename }, "image optimization skipped")
    }

    next()
  }

export default optimizeImage
