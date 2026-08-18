import type { Attachment } from "nodemailer/lib/mailer"

export type EmailParams = {
  to: string
  sub: string
  message: string
  cc?: string | null
  bcc?: string | null
  attachments?: Attachment[] | null
}
