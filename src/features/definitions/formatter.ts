import type { User } from "../../shared/telegram/types";
import logger from "../../logger";
import * as compresser from "lz-string";
import { botUsername } from "../../config";

export default {
  ITALIC_OPEN_TAG: "<i>",
  ITALIC_CLOSE_TAG: "</i>",
  BOLD_OPEN_TAG: "<b>",
  BOLD_CLOSE_TAG: "</b>",
  CODE_OPEN_TAG: "<code>",
  CODE_CLOSE_TAG: "</code>",

  italic(text: string): string {
    return this.ITALIC_OPEN_TAG + text + this.ITALIC_CLOSE_TAG;
  },

  bold(text: string): string {
    return this.BOLD_OPEN_TAG + text + this.BOLD_CLOSE_TAG;
  },

  code(text: string) {
    return this.CODE_OPEN_TAG + text + this.CODE_CLOSE_TAG;
  },

  link(description: string, url: string) {
    return `<a href="${url}">${description}</a>`;
  },

  mention(user: User, description?: string) {
    return this.link(description ?? user.first_name, `tg://user?id=${user.id}`);
  },

  startUrl(query: string): string {
    if (botUsername != null) {
      return `https://t.me/${botUsername}?start=${this.compress(query)}`;
    }
    logger.error("Bot username not defined in environment");
    throw new Error("Bot username not defined in environment");
  },

  compress(text: string): string {
    return compresser.compressToBase64(text).replace(/=+$/, "");
  },

  decompress(text: string): string | null {
    return compresser.decompressFromBase64(text);
  },
};

export function truncateHtml(text: string, maxLength: number, suffix: string): string {
  if (text.length <= maxLength) return text;

  const targetLength = maxLength - suffix.length;
  let sliced = text.slice(0, Math.max(0, targetLength));

  // Back up to the last word boundary
  const lastSpace = sliced.lastIndexOf(" ");
  if (lastSpace > 0) {
    sliced = sliced.slice(0, lastSpace);
  }

  // Drop any incomplete HTML tag (e.g. a "<a href=" cut mid-attribute)
  sliced = sliced.replace(/<[^>]*$/, "");

  // Close any tags that were opened but not closed before the cut point
  sliced = closeUnclosedTags(sliced);

  return sliced.trimEnd() + suffix;
}

function closeUnclosedTags(html: string): string {
  const openTags: string[] = [];
  const tagPattern = /<\/?([a-zA-Z]+)[^>]*>/g;
  let match;

  while ((match = tagPattern.exec(html)) !== null) {
    const isClosing = match[0].startsWith("</");
    const tagName = match[1].toLowerCase();

    if (isClosing) {
      const lastOpen = openTags.lastIndexOf(tagName);
      if (lastOpen !== -1) openTags.splice(lastOpen, 1);
    } else {
      openTags.push(tagName);
    }
  }

  return html + openTags.reverse().map((tag) => `</${tag}>`).join("");
}
