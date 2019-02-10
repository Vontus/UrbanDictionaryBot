export default {
  isArabic (text: string): boolean {
    let arabicReg = /[\u0600-\u06FF]/;
    return arabicReg.test(text)
  }
}