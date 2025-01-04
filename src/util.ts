export function isArabic(text: string): boolean {
  const arabicReg = /[\u0600-\u06FF]/;
  return arabicReg.test(text);
}
