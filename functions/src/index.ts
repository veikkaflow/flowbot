import * as functions from "firebase-functions";
import * as https from "https";
import * as http from "http";
import { URL } from "url";

interface ScrapedData {
  title: string;
  text: string;
  logos: string[];
  colors: string[];
}

// Helper to fetch HTML from a URL
const fetchHtml = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
      const client = urlObj.protocol === "https:" ? https : http;

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; SiteScraper/1.0)",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      };

      const req = client.request(options, (res) => {
        let data = "";

        // Handle redirects
        if (res.statusCode === 301 || res.statusCode === 302) {
          const location = res.headers.location;
          if (location) {
            return resolve(fetchHtml(new URL(location, url).href));
          }
        }

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          resolve(data);
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });

      req.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Helper to parse sitemap XML
const parseSitemap = async (baseUrl: string): Promise<string[]> => {
  const sitemapUrls = [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`,
    `${baseUrl}/sitemap-index.xml`,
  ];

  for (const sitemapUrl of sitemapUrls) {
    try {
      const xml = await fetchHtml(sitemapUrl);
      const urls: string[] = [];

      // Parse sitemap index (contains multiple sitemaps)
      const sitemapIndexMatches = xml.match(/<sitemap>[\s\S]*?<loc>(.*?)<\/loc>[\s\S]*?<\/sitemap>/gi);
      if (sitemapIndexMatches) {
        for (const match of sitemapIndexMatches) {
          const locMatch = match.match(/<loc>(.*?)<\/loc>/i);
          if (locMatch) {
            try {
              const subSitemapUrl = locMatch[1];
              const subXml = await fetchHtml(subSitemapUrl);
              const subUrlMatches = subXml.match(/<loc>(.*?)<\/loc>/gi);
              if (subUrlMatches) {
                subUrlMatches.forEach((urlMatch) => {
                  const url = urlMatch.replace(/<\/?loc>/gi, "").trim();
                  if (url) urls.push(url);
                });
              }
            } catch (e) {
              // Ignore sub-sitemap errors
            }
          }
        }
        if (urls.length > 0) return urls;
      }

      // Parse regular sitemap (contains URLs)
      const urlMatches = xml.match(/<loc>(.*?)<\/loc>/gi);
      if (urlMatches) {
        urlMatches.forEach((match) => {
          const url = match.replace(/<\/?loc>/gi, "").trim();
          if (url) urls.push(url);
        });
        if (urls.length > 0) return urls;
      }
    } catch (e) {
      // Try next sitemap URL
      continue;
    }
  }

  return [];
};

// Helper to extract text from HTML
const extractTextFromHtml = (html: string): string => {
  // Remove scripts, styles, and other non-content elements
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return text;
};

// Helper to extract title from HTML
const extractTitleFromHtml = (html: string): string => {
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch) {
    return titleMatch[1]
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match) {
    return h1Match[1]
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .trim();
  }

  return "Untitled";
};

// Helper to extract logos from HTML
const extractLogosFromHtml = (html: string, baseUrl: string): string[] => {
  const logos = new Set<string>();

  // Extract from img tags with "logo" in src or alt
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    const fullTag = match[0].toLowerCase();
    if (fullTag.includes("logo") || src.toLowerCase().includes("logo")) {
      try {
        const absoluteUrl = new URL(src, baseUrl).href;
        logos.add(absoluteUrl);
      } catch (e) {
        // Invalid URL, skip
      }
    }
  }

  // Extract favicon
  const faviconRegex = /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/gi;
  while ((match = faviconRegex.exec(html)) !== null) {
    try {
      const absoluteUrl = new URL(match[1], baseUrl).href;
      logos.add(absoluteUrl);
    } catch (e) {
      // Invalid URL, skip
    }
  }

  // Try common logo paths
  try {
    const urlObj = new URL(baseUrl);
    const commonLogoPaths = [
      "/logo.png",
      "/logo.svg",
      "/images/logo.png",
      "/images/logo.svg",
      "/assets/logo.png",
      "/assets/logo.svg",
      "/static/logo.png",
      "/static/logo.svg",
    ];
    commonLogoPaths.forEach((path) => {
      logos.add(new URL(path, baseUrl).href);
    });

    // Add Clearbit logo as fallback
    logos.add(`https://logo.clearbit.com/${urlObj.hostname}`);
  } catch (e) {
    // Invalid base URL
  }

  return Array.from(logos);
};

// Helper to extract colors from HTML
const extractColorsFromHtml = (html: string): string[] => {
  const colors = new Set<string>();

  // Extract hex colors from style attributes
  const styleRegex = /style=["']([^"']+)["']/gi;
  let match;
  while ((match = styleRegex.exec(html)) !== null) {
    const styleContent = match[1];
    const hexMatches = styleContent.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/g);
    if (hexMatches) {
      hexMatches.forEach((color) => colors.add(color));
    }
  }

  // Extract from style tags
  const styleTagRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  while ((match = styleTagRegex.exec(html)) !== null) {
    const styleContent = match[1];
    const hexMatches = styleContent.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/g);
    if (hexMatches) {
      hexMatches.forEach((color) => colors.add(color));
    }
  }

  const colorArray = Array.from(colors).slice(0, 5);
  return colorArray.length > 0
    ? colorArray
    : ["#4f46e5", "#1f2937", "#3b82f6", "#10b981", "#f59e0b"];
};

// Cloud Function: Scrape Website
export const scrapeWebsite = functions.https.onCall(
  async (data, context) => {
    const { url } = data;

    if (!url || typeof url !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "URL is required"
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid URL format"
      );
    }

    try {
      // Normalize URL
      const baseUrl = url.endsWith("/") ? url.slice(0, -1) : url;
      const baseUrlObj = new URL(baseUrl);

      // Fetch main page
      console.log(`Scraping: ${baseUrl}`);
      const html = await fetchHtml(baseUrl);

      // Extract basic data
      const title = extractTitleFromHtml(html);
      let text = extractTextFromHtml(html);

      // Try to get sitemap and scrape additional pages
      let sitemapUrls: string[] = [];
      try {
        sitemapUrls = await parseSitemap(baseUrl);
        console.log(`Found ${sitemapUrls.length} URLs in sitemap`);

        // Scrape first 5 additional pages from sitemap (limit to avoid timeout)
        if (sitemapUrls.length > 0) {
          const additionalPages = sitemapUrls.slice(0, 5);
          const additionalTexts = await Promise.all(
            additionalPages.map(async (pageUrl) => {
              try {
                const pageHtml = await fetchHtml(pageUrl);
                return extractTextFromHtml(pageHtml);
              } catch (e) {
                return "";
              }
            })
          );
          text = [text, ...additionalTexts.filter((t) => t)].join("\n\n");
        }
      } catch (e) {
        console.log("Could not fetch sitemap, using main page only");
      }

      // Extract logos
      const logos = extractLogosFromHtml(html, baseUrl);

      // Extract colors
      const colors = extractColorsFromHtml(html);

      const result: ScrapedData = {
        title,
        text,
        logos: Array.from(logos),
        colors,
      };

      return result;
    } catch (error: any) {
      console.error("Scraping error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Scraping failed: " + (error.message || "Unknown error")
      );
    }
  }
);




