import logger from './logger'

export default {
  isArabic (text: string): boolean {
    let arabicReg = /[\u0600-\u06FF]/
    return arabicReg.test(text)
  },

  getRequiredEnvVar (envVar: string): string {
    if (process.env.hasOwnProperty(envVar)) {
      return process.env[envVar] || ''
    } else {
      logger.error(`${envVar} is a required environment variable`)
      process.exit(400)
    }
  }
}
