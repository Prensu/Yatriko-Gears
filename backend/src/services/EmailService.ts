import nodemailer, { type Transporter } from "nodemailer"
import type Mail from "nodemailer/lib/mailer"
import { transportConfig, fromAddress } from "../config/smtpConfig"
import type { EmailParams } from "../types/EmailParams"

class EmailService {
  private readonly transport: Transporter

  constructor() {
    this.transport = nodemailer.createTransport(transportConfig)
  }

  async sendEmail({ to, sub, message, cc = null, bcc = null, attachments = null }: EmailParams) {
    try {
      const emailBody: Mail.Options = {
        from: fromAddress,
        to,
        subject: sub,
        html: message,
      }
      if (cc) emailBody.cc = cc
      if (bcc) emailBody.bcc = bcc
      if (attachments) emailBody.attachments = attachments
      return await this.transport.sendMail(emailBody)
    } catch (exception) {
      console.error(exception)
      throw { code: 500, message: "Email sending failed..." }
    }
  }
}

export default EmailService
