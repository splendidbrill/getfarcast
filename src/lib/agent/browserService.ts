import { chromium, type Browser, type Page, type BrowserContext } from "playwright";

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

export async function withBrowser<T>(fn: (browser: Browser) => Promise<T>): Promise<T> {
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ args: EC2_ARGS, headless: true });
    return await fn(browser);
  } finally {
    await browser?.close().catch(() => {});
  }
}

export async function withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
  return withBrowser(async (browser) => {
    let context: BrowserContext | null = null;
    try {
      context = await browser.newContext({
        userAgent: DEFAULT_UA,
        locale: "en-US",
        viewport: { width: 1280, height: 800 },
      });
      const page = await context.newPage();
      return await fn(page);
    } finally {
      await context?.close().catch(() => {});
    }
  });
}

export async function withIsolatedPage<T>(
  browser: Browser,
  fn: (page: Page) => Promise<T>
): Promise<T> {
  let context: BrowserContext | null = null;
  try {
    context = await browser.newContext({
      userAgent: DEFAULT_UA,
      locale: "en-US",
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();
    return await fn(page);
  } finally {
    await context?.close().catch(() => {});
  }
}
