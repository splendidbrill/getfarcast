import type { Browser, BrowserContext, Page } from "playwright";
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

chromium.use(StealthPlugin());

const EC2_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-accelerated-2d-canvas",
  "--no-first-run",
  "--no-zygote",
  "--disable-gpu",
];

const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function buildProxyConfig() {
  const raw = process.env.PROXY_URL;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    return {
      server: `${url.protocol}//${url.hostname}:${url.port}`,
      username: url.username || undefined,
      password: url.password || undefined,
    };
  } catch {
    return undefined;
  }
}

export async function withBrowser<T>(
  fn: (browser: Browser) => Promise<T>,
  useProxy = false
): Promise<T> {
  let browser: Browser | null = null;
  try {
    const proxy = useProxy ? buildProxyConfig() : undefined;
    browser = (await chromium.launch({
      executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
      args: EC2_ARGS,
      headless: true,
      ...(proxy ? { proxy } : {}),
    })) as unknown as Browser;
    return await fn(browser);
  } finally {
    await (browser as Browser | null)?.close().catch(() => {});
  }
}

export async function withPage<T>(
  fn: (page: Page) => Promise<T>,
  useProxy = false
): Promise<T> {
  return withBrowser(async (browser) => {
    let ctx: BrowserContext | null = null;
    try {
      ctx = await browser.newContext({
        userAgent: DEFAULT_UA,
        locale: "en-US",
        viewport: { width: 1280, height: 800 },
      });
      const page = await ctx.newPage();
      return await fn(page);
    } finally {
      await ctx?.close().catch(() => {});
    }
  }, useProxy);
}

export async function withIsolatedPage<T>(
  browser: Browser,
  fn: (page: Page) => Promise<T>,
  cookies?: Array<{ name: string; value: string; domain: string; path: string }>
): Promise<T> {
  let ctx: BrowserContext | null = null;
  try {
    ctx = await browser.newContext({
      userAgent: DEFAULT_UA,
      locale: "en-US",
      viewport: { width: 1280, height: 800 },
    });
    if (cookies?.length) await ctx.addCookies(cookies);
    const page = await ctx.newPage();
    return await fn(page);
  } finally {
    await ctx?.close().catch(() => {});
  }
}
