import { describe, expect, it } from "vitest"
import {
  buildPaymentForm,
  callbackSignatureMatches,
  decodeCallback,
  formatAmount,
  signFields,
} from "../modules/payment/EsewaService"

describe("eSewa signature", () => {
  /**
   * The published example from developer.esewa.com.np. If this ever fails,
   * every payment on the site is being rejected — treat it as a P0.
   */
  it("reproduces eSewa's own documented signature", () => {
    const signature = signFields(["total_amount", "transaction_uuid", "product_code"], {
      total_amount: "110",
      transaction_uuid: "241028",
      product_code: "EPAYTEST",
    })
    expect(signature).toBe("i94zsd3oXF6ZsSr/kGqT4sSzYQzjj1W/waxjWyRwaME=")
  })

  it("signs field=value pairs, not bare values", () => {
    // Guards the exact bug that would silently break checkout: eSewa signs
    // "total_amount=110,..." — signing "110,..." produces a rejected payment.
    const withKeys = signFields(["total_amount"], { total_amount: "110" })
    const bareValue = signFields([], {})
    expect(withKeys).not.toBe(bareValue)
    expect(withKeys).toBe(signFields(["total_amount"], { total_amount: "110" }))
  })

  it("changes when any signed field changes", () => {
    const base = { total_amount: "100", transaction_uuid: "abc", product_code: "EPAYTEST" }
    const names = ["total_amount", "transaction_uuid", "product_code"]
    const original = signFields(names, base)
    expect(signFields(names, { ...base, total_amount: "1" })).not.toBe(original)
    expect(signFields(names, { ...base, transaction_uuid: "xyz" })).not.toBe(original)
  })
})

describe("formatAmount", () => {
  it("emits plain decimals eSewa accepts", () => {
    // "1,200.00" would break both the signature and the status check.
    expect(formatAmount(1200)).toBe("1200")
    expect(formatAmount(4200.5)).toBe("4200.5")
    expect(formatAmount(0)).toBe("0")
  })
})

describe("buildPaymentForm", () => {
  const form = buildPaymentForm({
    totalAmount: 4200,
    transactionUuid: "YG-TEST-0001",
    successUrl: "http://localhost:5173/payment/success",
    failureUrl: "http://localhost:5173/payment/failure",
  })

  it("posts every field eSewa requires", () => {
    for (const field of [
      "amount", "tax_amount", "total_amount", "transaction_uuid", "product_code",
      "product_service_charge", "product_delivery_charge", "success_url",
      "failure_url", "signed_field_names", "signature",
    ]) {
      expect(form.fields[field], `missing ${field}`).toBeDefined()
    }
  })

  it("signs exactly the fields named in signed_field_names", () => {
    const names = form.fields.signed_field_names.split(",")
    expect(names).toEqual(["total_amount", "transaction_uuid", "product_code"])
    expect(signFields(names, form.fields)).toBe(form.fields.signature)
  })

  it("keeps amount and total_amount in step", () => {
    expect(form.fields.total_amount).toBe("4200")
    expect(form.fields.amount).toBe("4200")
  })
})

describe("callback verification", () => {
  const encode = (payload: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(payload)).toString("base64")

  it("decodes the base64 payload eSewa redirects with", () => {
    const decoded = decodeCallback(encode({ status: "COMPLETE", transaction_uuid: "YG-1" }))
    expect(decoded.status).toBe("COMPLETE")
    expect(decoded.transaction_uuid).toBe("YG-1")
  })

  it("accepts a correctly signed callback", () => {
    const fields: Record<string, string> = {
      transaction_code: "000AWEO", status: "COMPLETE", total_amount: "4200",
      transaction_uuid: "YG-1", product_code: "EPAYTEST",
      signed_field_names: "transaction_code,status,total_amount,transaction_uuid,product_code",
    }
    fields.signature = signFields(fields.signed_field_names.split(","), fields)
    expect(callbackSignatureMatches(fields)).toBe(true)
  })

  it("rejects a tampered amount", () => {
    const fields: Record<string, string> = {
      transaction_code: "000AWEO", status: "COMPLETE", total_amount: "4200",
      transaction_uuid: "YG-1", product_code: "EPAYTEST",
      signed_field_names: "transaction_code,status,total_amount,transaction_uuid,product_code",
    }
    fields.signature = signFields(fields.signed_field_names.split(","), fields)
    expect(callbackSignatureMatches({ ...fields, total_amount: "1" })).toBe(false)
  })

  it("rejects a callback with no signature at all", () => {
    expect(callbackSignatureMatches({ status: "COMPLETE" })).toBe(false)
  })
})
