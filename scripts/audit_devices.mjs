import puppeteer from "puppeteer-core";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE_URL = "http://localhost:3000";

const VIEWPORTS = [
  { name: "iPhone SE (Compact)", width: 375, height: 667, isMobile: true },
  { name: "iPhone 15 Pro (Standard Mobile)", width: 393, height: 852, isMobile: true },
  { name: "Android Pixel (412px)", width: 412, height: 915, isMobile: true },
  { name: "iPad Mini (Tablet)", width: 768, height: 1024, isMobile: false },
  { name: "Desktop (1280px)", width: 1280, height: 800, isMobile: false },
];

const PAGES = [
  "/",
  "/versus",
  "/map",
  "/leaderboard",
  "/directory",
  "/wallet",
  "/challenges",
  "/verified-anomalies",
  "/pro",
  "/settings",
  "/login",
  "/signup",
];

async function runAudit() {
  console.log("🚀 Starting Responsive & Device Size Audit across 5 viewports and 12 pages...\n");

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

    for (const pathname of PAGES) {
      const url = `${BASE_URL}${pathname}`;
      try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });

        const metrics = await page.evaluate(() => {
          const scrollWidth = document.documentElement.scrollWidth;
          const clientWidth = document.documentElement.clientWidth;
          const innerWidth = window.innerWidth;
          const hasHorizontalScroll = scrollWidth > innerWidth;

          // Find specific overflowing elements if any
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

          // Topbar metrics
          const header = document.querySelector("header");
          const headerRect = header ? header.getBoundingClientRect() : null;

          // Bottom nav metrics
          const bottomNav = document.querySelector("nav[aria-label='Mobile Bottom Navigation']");
          const bottomNavRect = bottomNav ? bottomNav.getBoundingClientRect() : null;

          // Main element padding
          const main = document.querySelector("main");
          const mainStyle = main ? window.getComputedStyle(main) : null;
          const mainPaddingBottom = mainStyle ? parseInt(mainStyle.paddingBottom, 10) : 0;

          return {
            scrollWidth,
            clientWidth,
            innerWidth,
            hasHorizontalScroll,
            overflowingElementsCount: overflowingElements.length,
            overflowingSamples: overflowingElements.slice(0, 3),
            headerHeight: headerRect ? Math.round(headerRect.height) : 0,
            bottomNavVisible: !!bottomNavRect && bottomNavRect.height > 0,
            bottomNavHeight: bottomNavRect ? Math.round(bottomNavRect.height) : 0,
            mainPaddingBottom,
          };
        });

        const status = metrics.hasHorizontalScroll ? "❌ OVERFLOW" : "✅ PASS";
        console.log(
          `  ${pathname.padEnd(20)}: ${status} (scrollWidth: ${metrics.scrollWidth}px vs innerWidth: ${metrics.innerWidth}px)`
        );

        if (metrics.hasHorizontalScroll) {
          const issue = {
            viewport: vp.name,
            pathname,
            scrollWidth: metrics.scrollWidth,
            innerWidth: metrics.innerWidth,
            diff: metrics.scrollWidth - metrics.innerWidth,
            samples: metrics.overflowingSamples,
          };
          issues.push(issue);
          console.log(`    ⚠️ Overflow diff: +${issue.diff}px. Overflow elements:`, metrics.overflowingSamples);
        }

        // Check if main bottom padding is less than bottom nav height on mobile
        if (vp.isMobile && metrics.bottomNavVisible && metrics.mainPaddingBottom < metrics.bottomNavHeight) {
          console.log(
            `    ⚠️ Bottom nav collision risk: main paddingBottom (${metrics.mainPaddingBottom}px) < bottomNav (${metrics.bottomNavHeight}px)`
          );
        }
      } catch (err) {
        console.error(`  ${pathname.padEnd(20)}: ❌ ERROR loading (${err.message})`);
      }
    }
  }

  await browser.close();

  console.log("\n==============================");
  console.log("📊 Audit Summary");
  console.log("==============================");
  console.log(`Total Horizontal Overflow Issues: ${issues.length}`);
  if (issues.length > 0) {
    console.log("Details:", JSON.stringify(issues, null, 2));
  } else {
    console.log("All pages pass horizontal overflow check across all tested viewports!");
  }
}

runAudit().catch((err) => {
  console.error("Audit script failed:", err);
  process.exit(1);
});
