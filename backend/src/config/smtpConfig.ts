import { smtpConfig } from "./AppConfig"

export const transportConfig = {
  service: smtpConfig.service,
  host: smtpConfig.host,
  port: smtpConfig.port,
  secure: false,
  auth: {
    user: smtpConfig.user,
    pass: smtpConfig.password,
  },
}

export const fromAddress = smtpConfig.fromAddress
