import puppeteer from "puppeteer-core";
import path from "path";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE_URL = "http://localhost:3000";
const ARTIFACTS_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/d4b49989-efb8-449c-9b4b-ee4041afd820";

const VIEWPORTS = [
  { name: "iPhone SE (Compact)", width: 375, height: 667, isMobile: true },
  { name: "iPhone 15 Pro (Standard Mobile)", width: 393, height: 852, isMobile: true },
  { name: "Android Pixel (412px)", width: 412, height: 915, isMobile: true },
  { name: "iPad Mini (Tablet)", width: 768, height: 1024, isMobile: false },
  { name: "Desktop (1280px)", width: 1280, height: 800, isMobile: false },
];

const FOOTER_PAGES = [
  "/about",
  "/scoring-engine",
  "/rarity-tiers",
  "/community-guidelines",
  "/terms",
  "/privacy",
  "/brand",
  "/learn-more",
  "/anomaly-guidelines",
  "/gemini-vision-api",
];

async function runAudit() {
  console.log("🚀 Starting Audit of Footer & Non-App Pages across 5 viewports...\n");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();
  const issues = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n==============================`);
    console.log(`📱 Auditing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`==============================`);

    await page.setViewport({
      width: vp.width,
      height: vp.height,
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
    });

    for (const pathname of FOOTER_PAGES) {
      const url = `${BASE_URL}${pathname}`;
      try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });

        const metrics = await page.evaluate(() => {
          const scrollWidth = document.documentElement.scrollWidth;
          const innerWidth = window.innerWidth;
          const hasHorizontalScroll = scrollWidth > innerWidth;

          const overflowingElements = [];
          if (hasHorizontalScroll) {
            document.querySelectorAll("*").forEach((el) => {
              const rect = el.getBoundingClientRect();
              if (rect.right > innerWidth + 1) {
                overflowingElements.push({
                  tag: el.tagName.toLowerCase(),
                  className: (el.className || "").toString().slice(0, 50),
                  id: el.id,
                  right: Math.round(rect.right),
                  width: Math.round(rect.width),
                });
              }
            });
          }

          // Check main/container bounds
          const h1 = document.querySelector("h1");
          const h1Text = h1 ? h1.innerText.slice(0, 30) : "No H1";

          return {
            scrollWidth,
            innerWidth,
            hasHorizontalScroll,
            overflowingElementsCount: overflowingElements.length,
            overflowingSamples: overflowingElements.slice(0, 3),
            h1Text,
          };
        });

        if (metrics.hasHorizontalScroll) {
          console.log(`  ${pathname.padEnd(22)}: ❌ OVERFLOW (scrollWidth: ${metrics.scrollWidth}px vs innerWidth: ${metrics.innerWidth}px)`);
          console.log(`    ⚠️ Diff: +${metrics.scrollWidth - metrics.innerWidth}px. Samples:`, metrics.overflowingSamples);
          issues.push({
            viewport: vp.name,
            pathname,
            scrollWidth: metrics.scrollWidth,
            innerWidth: metrics.innerWidth,
            diff: metrics.scrollWidth - metrics.innerWidth,
            samples: metrics.overflowingSamples,
          });
        } else {
          console.log(`  ${pathname.padEnd(22)}: ✅ PASS (scrollWidth: ${metrics.scrollWidth}px vs innerWidth: ${metrics.innerWidth}px)`);
        }
      } catch (err) {
        console.error(`  ${pathname.padEnd(22)}: 💥 ERROR: ${err.message}`);
        issues.push({ viewport: vp.name, pathname, error: err.message });
      }
    }
  }

  // Capture preview screenshots for key footer pages on iPhone 15 Pro
  await page.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true });
  await page.goto(`${BASE_URL}/about`, { waitUntil: "networkidle2" });
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "iphone15_about.png") });

  await page.goto(`${BASE_URL}/scoring-engine`, { waitUntil: "networkidle2" });
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "iphone15_scoring_engine.png") });

  await page.goto(`${BASE_URL}/rarity-tiers`, { waitUntil: "networkidle2" });
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "iphone15_rarity_tiers.png") });

  await page.goto(`${BASE_URL}/brand`, { waitUntil: "networkidle2" });
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "iphone15_brand.png") });

  await browser.close();

  console.log(`\n==============================`);
  console.log(`📊 Audit Summary`);
  console.log(`==============================`);
  console.log(`Total Horizontal Overflow Issues: ${issues.length}`);
  if (issues.length > 0) {
    console.log("Details:", JSON.stringify(issues, null, 2));
    process.exit(1);
  } else {
    console.log("All footer & non-app pages pass horizontal overflow check across all viewports!");
  }
}

runAudit().catch((err) => {
  console.error("Audit error:", err);
  process.exit(1);
});
