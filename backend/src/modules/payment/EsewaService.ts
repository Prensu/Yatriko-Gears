import crypto from "node:crypto"
import { esewaConfig } from "../../config/AppConfig"

/**
 * eSewa ePay v2 helpers.
 *
 * Signature = base64( HMAC-SHA256( "field=value,field=value,...", secret ) ),
 * where the fields and their ORDER come from `signed_field_names`. Getting the
 * "field=" prefixes or the order wrong is the usual cause of a rejected
 * payment, so both directions go through this one function.
 */
export function signFields(fieldNames: string[], values: Record<string, string>): string {
  const message = fieldNames.map((name) => `${name}=${values[name] ?? ""}`).join(",")
  return crypto.createHmac("sha256", esewaConfig.secretKey).update(message).digest("base64")
}

/** eSewa wants plain decimals — "1200", never "1,200.00". */
export function formatAmount(amount: number): string {
  return String(Math.round(amount * 100) / 100)
}

export type EsewaFormPayload = {
  formUrl: string
  fields: Record<string, string>
}

/** Everything the browser needs to POST the customer into eSewa's checkout. */
export function buildPaymentForm(input: {
  totalAmount: number
  transactionUuid: string
  successUrl: string
  failureUrl: string
}): EsewaFormPayload {
  const totalAmount = formatAmount(input.totalAmount)

  const fields: Record<string, string> = {
    amount: totalAmount,
    tax_amount: "0",
    total_amount: totalAmount,
    transaction_uuid: input.transactionUuid,
    product_code: esewaConfig.productCode,
    product_service_charge: "0",
    product_delivery_charge: "0",
    success_url: input.successUrl,
    failure_url: input.failureUrl,
    signed_field_names: "total_amount,transaction_uuid,product_code",
  }

  fields.signature = signFields(fields.signed_field_names.split(","), fields)

  return { formUrl: esewaConfig.formUrl, fields }
}

export type EsewaCallback = {
  transaction_code?: string
  status?: string
  total_amount?: string
  transaction_uuid?: string
  product_code?: string
  signed_field_names?: string
  signature?: string
}

/** The `data` query param eSewa appends to success_url is base64 JSON. */
export function decodeCallback(data: string): EsewaCallback {
  const json = Buffer.from(data, "base64").toString("utf8")
  return JSON.parse(json) as EsewaCallback
}

/**
 * Best-effort integrity check on the redirect payload.
 *
 * This is NOT what authorises the payment — the browser controls this data, so
 * it can be tampered with. verifyWithEsewa() below is the real gate. We still
 * check it so an obviously forged redirect is rejected early.
 */
export function callbackSignatureMatches(callback: EsewaCallback): boolean {
  if (!callback.signature || !callback.signed_field_names) return false

  const names = callback.signed_field_names.split(",")
  const values: Record<string, string> = {}
  for (const name of names) {
    const value = (callback as Record<string, unknown>)[name]
    // eSewa echoes total_amount with thousands separators in some responses.
    values[name] = typeof value === "string" ? value : String(value ?? "")
  }

  return signFields(names, values) === callback.signature
}

export type EsewaStatus = {
  product_code?: string
  transaction_uuid?: string
  total_amount?: number
  status?: string
  ref_id?: string | null
}

/**
 * Server-to-server confirmation — the only thing we trust when marking a
 * booking paid. The browser can't forge this.
 */
export async function verifyWithEsewa(input: {
  transactionUuid: string
  totalAmount: number
}): Promise<EsewaStatus> {
  const url = new URL(esewaConfig.statusUrl)
  url.searchParams.set("product_code", esewaConfig.productCode)
  url.searchParams.set("total_amount", formatAmount(input.totalAmount))
  url.searchParams.set("transaction_uuid", input.transactionUuid)

  const response = await fetch(url, { headers: { Accept: "application/json" } })
  if (!response.ok) {
    throw { code: 502, message: `eSewa status check failed (${response.status})` }
  }

  return (await response.json()) as EsewaStatus
}
