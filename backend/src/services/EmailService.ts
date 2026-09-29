import nodemailer, { type Transporter } from "nodemailer"
import type Mail from "nodemailer/lib/mailer"
import { emailProvider, transportConfig, fromAddress } from "../config/smtpConfig"
import { smtpConfig } from "../config/AppConfig"
import type { EmailParams } from "../types/EmailParams"
import { loggerFor } from "../config/logger"

const log = loggerFor("EmailService")

class EmailService {
  private readonly transport: Transporter

  constructor() {
    this.transport = nodemailer.createTransport(transportConfig)
  }

  async verifyConnection(): Promise<void> {
    if (smtpConfig.resendApiKey) {
      if (!smtpConfig.resendFrom) {
        throw new Error("RESEND_FROM is required when RESEND_API_KEY is configured")
      }
      log.info("Email service using Resend HTTP API (from=%s)", smtpConfig.resendFrom)
      return
    }
    try {
      await this.transport.verify()
      log.info("SMTP connection verified — ready to send mail (from=%s)", fromAddress)
    } catch (exception) {
      log.error({ err: exception, from: fromAddress }, "SMTP verify failed — check SMTP_HOST/PORT/USER/PASSWORD/FROM_ADDRESS")
      throw exception
    }
  }

  async sendEmail({ to, sub, message, cc = null, bcc = null, attachments = null }: EmailParams) {
    if (!to) {
      log.error("sendEmail called with empty 'to' — check FROM_ADDRESS / SMTP_USER env (current from=%s)", fromAddress)
      throw { code: 500, message: "Email sending failed: recipient is empty" }
    }
    const sender = fromAddress
    if (!sender) {
      log.error("sendEmail called with empty 'from' — set FROM_ADDRESS or SMTP_USER")
      throw { code: 500, message: "Email sending failed: sender is empty" }
    }

    if (smtpConfig.resendApiKey) {
      try {
        if (!smtpConfig.resendFrom) {
          throw new Error("RESEND_FROM is required when RESEND_API_KEY is configured")
        }

        const payload: Record<string, unknown> = {
          from: smtpConfig.resendFrom,
          to: Array.isArray(to) ? to : [to],
          subject: sub,
          html: message,
        }
        if (cc) payload.cc = Array.isArray(cc) ? cc : [cc]
        if (bcc) payload.bcc = Array.isArray(bcc) ? bcc : [bcc]
        if (fromAddress) payload.reply_to = fromAddress

        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${smtpConfig.resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(`Resend API error: ${JSON.stringify(data)}`)
        }
        log.info({ provider: emailProvider, to, subject: sub, id: (data as { id?: string })?.id }, "Email sent via Resend API")
        return data
      } catch (exception) {
        log.error({ err: exception, to, subject: sub }, "Email sending failed via Resend API")
        throw { code: 500, message: "Email sending failed..." }
      }
    }

    try {
      const emailBody: Mail.Options = {
        from: sender,
        to,
        subject: sub,
        html: message,
      }
      if (cc) emailBody.cc = cc
      if (bcc) emailBody.bcc = bcc
      if (attachments) emailBody.attachments = attachments
      const info = await this.transport.sendMail(emailBody)
      log.info({ to, subject: sub, messageId: (info as { messageId?: string })?.messageId }, "Email sent")
      return info
    } catch (exception) {
      log.error({ err: exception, to, subject: sub, from: sender }, "Email sending failed")
      throw { code: 500, message: "Email sending failed..." }
    }
  }
}

export default EmailService
