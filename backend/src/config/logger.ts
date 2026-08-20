import pino from "pino"

/**
 * Structured logging.
 *
 * Render (and every other PaaS) collects stdout, so JSON lines here are
 * searchable and alertable — `console.error("something failed")` is not.
 * Locally it pretty-prints instead, since JSON is unreadable in a terminal.
 */
const isProduction = process.env.NODE_ENV === "production"

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
  // Never let a token or password reach the log stream.
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.accessToken",
      "*.refreshToken",
      "*.credential",
      "*.signature",
    ],
    censor: "[redacted]",
  },
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" },
        },
      }),
})

/** Child loggers keep the module name on every line without repeating it. */
export const loggerFor = (module: string) => logger.child({ module })
