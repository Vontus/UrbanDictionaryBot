export default (toEncode: string | null | undefined): string => {
  if (toEncode == null) return "";
  return toEncode
    .replace(new RegExp("&", "g"), "&amp;")
    .replace(new RegExp("<", "g"), "&lt;")
    .replace(new RegExp(">", "g"), "&gt;")
    .replace(new RegExp('"', "g"), "&quot;");
};
