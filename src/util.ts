export default {
  isArabic (text: string): boolean {
    var arabicReg = /[\u0600-\u06FF]/;
    return arabicReg.test(text)
  }
}