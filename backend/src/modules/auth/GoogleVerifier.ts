import crypto from "node:crypto"
import jwt from "jsonwebtoken"
import { googleConfig } from "../../config/AppConfig"

/**
 * Verifies a Google Sign-In ID token locally.
 *
 * The browser receives a signed JWT from Google; we check that signature
 * against Google's published public keys, plus the audience (our client id)
 * and issuer. Doing it locally means no extra dependency and no round-trip to
 * Google's tokeninfo endpoint on every login.
 */
const GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs"
const GOOGLE_ISSUERS: [string, ...string[]] = ["https://accounts.google.com", "accounts.google.com"]

type GoogleJwk = crypto.JsonWebKey & { kid?: string }

let keyCache: { keys: GoogleJwk[]; expiresAt: number } | null = null

/** Google rotates these keys; honour the Cache-Control they send back. */
async function getSigningKeys(): Promise<GoogleJwk[]> {
  if (keyCache && keyCache.expiresAt > Date.now()) return keyCache.keys

  const response = await fetch(GOOGLE_CERTS_URL)
  if (!response.ok) {
    throw { code: 502, message: "Could not reach Google to verify the sign-in" }
  }

  const body = (await response.json()) as { keys: GoogleJwk[] }
  const maxAge = Number(/max-age=(\d+)/.exec(response.headers.get("cache-control") ?? "")?.[1] ?? 3600)
  keyCache = { keys: body.keys, expiresAt: Date.now() + maxAge * 1000 }

  return body.keys
}

export type GoogleProfile = {
  googleId: string
  email: string
  name: string
  picture: string
}

export async function verifyGoogleIdToken(credential: string): Promise<GoogleProfile> {
  if (!googleConfig.isConfigured) {
    // 503, not 500: this is a missing setting, not a crash.
    throw { code: 503, message: "Google sign-in is not configured on the server" }
  }

  const decoded = jwt.decode(credential, { complete: true })
  if (!decoded || typeof decoded === "string") {
    throw { code: 401, message: "Malformed Google token" }
  }

  const keys = await getSigningKeys()
  const jwk = keys.find((key) => key.kid === decoded.header.kid)
  if (!jwk) throw { code: 401, message: "Unrecognised Google signing key" }

  let payload: jwt.JwtPayload
  try {
    payload = jwt.verify(credential, crypto.createPublicKey({ key: jwk, format: "jwk" }), {
      algorithms: ["RS256"],
      // Rejects a token minted for somebody else's Google app.
      audience: googleConfig.clientId,
      issuer: GOOGLE_ISSUERS,
    }) as jwt.JwtPayload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw { code: 401, message: "That Google sign-in expired — try again" }
    }
    throw { code: 401, message: "Google sign-in could not be verified" }
  }

  if (!payload.sub || !payload.email) {
    throw { code: 401, message: "Google did not share an email address" }
  }
  // An unverified Google email could belong to someone else entirely.
  if (payload.email_verified === false) {
    throw { code: 401, message: "Your Google email address is not verified" }
  }

  return {
    googleId: String(payload.sub),
    email: String(payload.email).toLowerCase(),
    name: typeof payload.name === "string" && payload.name.trim() ? payload.name : "Yatriko Customer",
    picture: typeof payload.picture === "string" ? payload.picture : "",
  }
}
