import $ from "cheerio";
import { UdDefinition } from "./definition";

const cleanUrl = "https://www.urbandictionary.com";
const defineUrl = `${cleanUrl}/define.php`;

function scrapeDefinition(htmlElement: cheerio.Element): UdDefinition {
  const word = $(htmlElement).attr("data-word") as string;
  const defid = $(htmlElement).attr("data-defid");
  const permalink = `/define.php?term=${encodeURIComponent(word)}${defid ? `&defid=${defid}` : ""}`;
  const def = {
    defid: $(htmlElement).data("defid"),
    definition: replaceLinks($(htmlElement).find(".meaning")),
    example: replaceLinks($(htmlElement).find(".example")),
    permalink: `${cleanUrl}${permalink}`,
    word: $(htmlElement).find(".word").text(),
    gif: $(htmlElement).find(".gif img").attr("src"),
  };

  return new UdDefinition(def);
}

async function requestWeb(page?: number, term?: string): Promise<string> {
  const url = new URL(term != null ? defineUrl : cleanUrl);
  if (term != null) url.searchParams.set("term", term);
  if (page != null && page !== 1) url.searchParams.set("page", page.toString());
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.text();
}

export async function getWotds(): Promise<UdDefinition[]> {
  const html = await requestWeb();
  const defs: UdDefinition[] = [];

  $(".definition", html).each((_index, element) => {
    defs.push(scrapeDefinition(element));
  });

  return defs;
}

export async function searchTerm(term: string): Promise<UdDefinition[]> {
  const html = await requestWeb(1, term);
  const defs: UdDefinition[] = [];

  if ($(".shrug", html).length > 0) {
    return [];
  }

  let pages = 1;
  $('a[href*="page="]', html).each((_index, el) => {
    const href = $(el).attr("href") ?? "";
    const m = href.match(/[?&]page=(\d+)/);
    if (m) pages = Math.max(pages, parseInt(m[1]));
  });

  for (let page = 1; page <= pages && defs.length < 10; page++) {
    const pageHtml = page === 1 ? html : await requestWeb(page, term);

    $(".definition", pageHtml).each((_index, element) => {
      defs.push(scrapeDefinition(element));
    });
  }

  return defs;
}

function replaceLinks(element: cheerio.Cheerio): string {
  element.find("a").each((_index, link) => {
    $(link).html(`[${$(link).text()}]`);
  });

  element.find("br").replaceWith("\n");

  return element.text();
}
