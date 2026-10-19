import axios from "axios";
import * as cheerio from "cheerio";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// ---------- PRISMA CLIENT ----------
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// ---------- UTILS ----------
const arabicToEnglish = (num: string) => {
  const map: Record<string, string> = {
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
    "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  };
  return num.split("").map((d) => map[d] ?? d).join("");
};

const formatWithComma = (num: string | number) =>
  Number(num).toLocaleString("en-US");

interface GoldPrices {
  karat22?: string | null;
  karat21?: string | null;
  karat18?: string | null;
}

// Telegram Scraper Settings
const TARGET_POST_COUNT = 100;
const MAX_SCRAPE_ITERATIONS = 6;
const TELEGRAM_CHANNEL = "iraqborsa";
const TELEGRAM_FILTER = "زێڕ";
const TELEGRAM_RANGE_HOURS = 48;

export async function GET() {
  try {
    const headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" };

    // =========================================================================
    // 1️⃣ USD SCRAPING
    // =========================================================================
    const usdUrl = "https://saraf.whitecapital.cloud/dollar/1"; // 👈 Put your USD URL here
    let usdClean = "0";

    if (usdUrl && usdUrl.startsWith("http")) {
      try {
        const usdResp = await axios.get(usdUrl, { headers });
        const $usd = cheerio.load(usdResp.data);

        const usdDivs = $usd("div.font-bold").filter((_, el) =>
          /^\s*[\d٠-٩][\d,٠-٩\s]*\s*$/.test($usd(el).text().trim())
        );

        const usdRaw = usdDivs.eq(1).text().trim() || "0";
        usdClean = formatWithComma(
          arabicToEnglish(usdRaw.replace(/[^0-9٠-٩]/g, ""))
        );
      } catch (err) {
        console.error("❌ USD Scraping Error:", err);
      }
    }

    // =========================================================================
    // 2️⃣ OTHER CURRENCIES (EUR, GBP, TRY, CNY) SCRAPING
    // =========================================================================
    const otherUrl = "https://xeiqd.com/"; // 👈 Put your other currencies URL here
    let eurClean = "0";
    let gbpClean = "0";
    let tryClean = "0";
    let cnyFormatted = "0";

    if (otherUrl && otherUrl.startsWith("http")) {
      try {
        const otherResp = await axios.get(otherUrl, { headers });
        const $other = cheerio.load(otherResp.data);

        // Robust matching: find span elements strictly inside td / tr
        const spans = $other("td span").filter((_, el) =>
          $other(el).text().trim().includes("")
        );

        const eurRaw = spans.eq(48).text().trim() || "0";
        const gbpRaw = spans.eq(36).text().trim() || "0";
        const cnyRaw = spans.eq(56).text().trim() || "0";
        const tryRaw = spans.eq(46).text().trim() || "0";

        eurClean = arabicToEnglish(eurRaw.replace(/[^0-9٠-٩]/g, ""));
        gbpClean = arabicToEnglish(gbpRaw.replace(/[^0-9٠-٩]/g, ""));
        tryClean = arabicToEnglish(tryRaw.replace(/[^0-9٠-٩]/g, ""));
        
        // ---------- ✅ CNY FIX ----------
        const cnyClean = arabicToEnglish(cnyRaw.replace(/[^0-9٠-٩]/g, ""));
        let cnyNum = Number(cnyClean);

        cnyFormatted = cnyNum.toFixed();
      } catch (err) {
        console.error("❌ Other Currencies Scraping Error:", err);
      }
    }

    // =========================================================================
    // 3️⃣ TELEGRAM GOLD PRICE SCRAPING
    // =========================================================================
    const goldPrices = await fetchTelegramGoldPrices(
      TELEGRAM_CHANNEL,
      TELEGRAM_FILTER,
      TELEGRAM_RANGE_HOURS,
      headers
    );

    // =========================================================================
    // 4️⃣ COMBINED RESULT
    // =========================================================================
    const result = {
      USD: `${usdClean} IQD`,
      EUR: `${formatWithComma(Number(eurClean))} IQD`,
      GBP: `${formatWithComma(Number(gbpClean))} IQD`,
      TRY: `${formatWithComma(Number(tryClean))} IQD`,
      CNY: `${formatWithComma(cnyFormatted)} IQD`,
      goldPrices: {
        karat22: goldPrices.karat22 ? `${goldPrices.karat22} IQD` : null,
        karat21: goldPrices.karat21 ? `${goldPrices.karat21} IQD` : null,
        karat18: goldPrices.karat18 ? `${goldPrices.karat18} IQD` : null,
      },
      updated_at: new Date().toISOString(),
    };

    // =========================================================================
    // 5️⃣ CHECK LAST ROW & INSERT VIA PRISMA
    // =========================================================================
    const lastRow = await prisma.currency.findFirst({
      orderBy: { id: "desc" },
    });

    let changed = !lastRow;

    if (!changed && lastRow) {
      if (
        lastRow.USD !== result.USD ||
        lastRow.EUR !== result.EUR ||
        lastRow.GBP !== result.GBP ||
        lastRow.TRY !== result.TRY ||
        lastRow.CNY !== result.CNY ||
        lastRow.GOLD_22 !== result.goldPrices.karat22 ||
        lastRow.GOLD_21 !== result.goldPrices.karat21 ||
        lastRow.GOLD_18 !== result.goldPrices.karat18
      ) {
        changed = true;
      }
    }

    if (changed) {
      const newRow = await prisma.currency.create({
        data: {
          USD: result.USD,
          EUR: result.EUR,
          GBP: result.GBP,
          TRY: result.TRY,
          CNY: result.CNY,
          GOLD_22: result.goldPrices.karat22,
          GOLD_21: result.goldPrices.karat21,
          GOLD_18: result.goldPrices.karat18,
        },
      });
      console.log("✅ Successfully inserted new values via Prisma:", newRow);
    } else {
      console.log("⏩ No change detected — skipping database insert.");
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ Main Route Error:", error);
    return NextResponse.json({ error: "Failed to fetch values", details: error.message }, { status: 500 });
  }
}

// =========================================================================
// HELPER: TELEGRAM SCRAPER
// =========================================================================
async function fetchTelegramGoldPrices(
  channel: string,
  filterQuery: string,
  rangeHours: number,
  headers: Record<string, string>
): Promise<GoldPrices> {
  try {
    const allPosts: any[] = [];
    const seenIds = new Set<string>();
    let beforeCursor: string | null = null;
    let iteration = 0;

    while (allPosts.length < TARGET_POST_COUNT && iteration < MAX_SCRAPE_ITERATIONS) {
      iteration++;

      const fetchUrl = beforeCursor
        ? `https://t.me/s/${encodeURIComponent(channel)}?before=${beforeCursor}`
        : `https://t.me/s/${encodeURIComponent(channel)}`;

      const res = await axios.get(fetchUrl, { headers });
      const $ = cheerio.load(res.data);
      const newPostsBatch: any[] = [];

      $(".tgme_widget_message_wrap").each((_, el) => {
        const text = $(el).find(".tgme_widget_message_text").text().trim();
        const date = $(el).find("time").attr("datetime") || "";
        const rawId = $(el).attr("data-post") || "";
        const id = rawId.split("/").pop() || Math.random().toString();

        if (id && !seenIds.has(id)) {
          seenIds.add(id);
          if (text) {
            newPostsBatch.push({ id, text, date });
          }
        }
      });

      if (newPostsBatch.length === 0) break;

      allPosts.push(...newPostsBatch);

      const firstMessageLink = $(".tgme_widget_message").first().attr("data-post");
      if (firstMessageLink) {
        const oldestId = firstMessageLink.split("/").pop();
        if (oldestId && oldestId !== beforeCursor) {
          beforeCursor = oldestId;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    const cutoffTime = new Date().getTime() - rangeHours * 60 * 60 * 1000;
    const timeFilteredPosts = allPosts.filter((post) => {
      if (!post.date) return false;
      return new Date(post.date).getTime() >= cutoffTime;
    });

    const normalizedQuery = filterQuery.trim().normalize("NFC").toLowerCase();
    const searchMatchedPosts = timeFilteredPosts.filter((post) => {
      const normalizedText = (post.text || "").normalize("NFC").toLowerCase();
      return normalizedText.includes(normalizedQuery);
    });

    const latestPost = searchMatchedPosts[0];
    return latestPost ? parseGoldPrices(latestPost.text) : {};
  } catch (err) {
    console.error("❌ Telegram Gold Scraper Error:", err);
    return {};
  }
}

function parseGoldPrices(text: string): GoldPrices {
  if (!text) return {};

  const extractKarat = (karatNumber: string): string | undefined => {
    const regex = new RegExp(`(?:عەیار|عيار)\\s*${karatNumber}\\s*[:=]\\s*([0-9,]+)`, "i");
    const match = text.match(regex);
    if (match && match[1]) {
      return match[1];
    }

    const lines = text.split("\n");
    for (const line of lines) {
      const normalizedLine = line.normalize("NFC");
      if (
        (normalizedLine.includes(`عەیار ${karatNumber}`) || normalizedLine.includes(`عيار ${karatNumber}`)) &&
        (normalizedLine.includes("=") || normalizedLine.includes(":"))
      ) {
        const parts = normalizedLine.split(/[:=]/);
        if (parts.length > 1) {
          return parts[1].trim();
        }
      }
    }
    return undefined;
  };

  return {
    karat22: extractKarat("22"),
    karat21: extractKarat("21"),
    karat18: extractKarat("18"),
  };
}