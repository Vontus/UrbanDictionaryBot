export default (toEncode: string): string => {
  return toEncode
    .replace(new RegExp("&", "g"), "&amp;")
    .replace(new RegExp("<", "g"), "&lt;")
    .replace(new RegExp(">", "g"), "&gt;")
    .replace(new RegExp('"', "g"), "&quot;");
};
