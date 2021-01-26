import logger from './logger'

export default {
  isArabic (text: string): boolean {
    const arabicReg = /[\u0600-\u06FF]/
    return arabicReg.test(text)
  },

  getRequiredEnvVar (envVar: string): string {
    if (Object.prototype.hasOwnProperty.call(process.env, envVar)) {
      return process.env[envVar] ?? ''
    } else {
      logger.error(`${envVar} is a required environment variable`)
      process.exit(400)
    }
  }
}
