import { Platform } from "react-native"
import Constants, { ExecutionEnvironment } from "expo-constants"
import { config } from "@/config"

/**
 * Google sign-in uses a native module, so it only works in a development or
 * production build, never in Expo Go. When it is unavailable the button is
 * hidden and email sign-in still works.
 */
export const googleSignInAvailable =
  Boolean(config.googleWebClientId) && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient

type GoogleModule = typeof import("@react-native-google-signin/google-signin")

let configured = false

/**
 * Returns the Google ID token, or null if the user closed the sheet.
 * The backend verifies it against GOOGLE_CLIENT_ID, so the *web* client id is
 * passed as `webClientId`: that is what ends up in the token's audience.
 */
export async function getGoogleIdToken(): Promise<string | null> {
  // Lazy require: importing the module at the top would crash Expo Go.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { GoogleSignin } = require("@react-native-google-signin/google-signin") as GoogleModule

  if (!configured) {
    GoogleSignin.configure({ webClientId: config.googleWebClientId })
    configured = true
  }
  if (Platform.OS === "android") {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
  }

  const response = await GoogleSignin.signIn()
  if (response.type !== "success") return null

  const idToken = response.data.idToken
  if (!idToken) throw new Error("Google did not return an ID token. Check the web client id.")
  return idToken
}

export async function googleSignOut(): Promise<void> {
  if (!googleSignInAvailable) return
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GoogleSignin } = require("@react-native-google-signin/google-signin") as GoogleModule
    await GoogleSignin.signOut()
  } catch {
    // Not signed in with Google, nothing to do.
  }
}
