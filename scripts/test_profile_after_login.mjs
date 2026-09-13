import puppeteer from "puppeteer-core";
import path from "path";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ARTIFACTS_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/d4b49989-efb8-449c-9b4b-ee4041afd820";

const VIEWPORTS = [
  { name: "iPhone SE (Compact)", width: 375, height: 667, isMobile: true },
  { name: "iPhone 15 Pro (Standard Mobile)", width: 393, height: 852, isMobile: true },
  { name: "Android Pixel (412px)", width: 412, height: 915, isMobile: true },
  { name: "iPad Mini (Tablet)", width: 768, height: 1024, isMobile: false },
  { name: "Desktop (1280px)", width: 1280, height: 800, isMobile: false },
];

async function runProfileAudit() {
  console.log("🚀 Starting Profile Page After-Login Audit across viewports...\n");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();

  // First, set up demo authentication in localStorage on the domain
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
  await page.evaluate(() => {
    localStorage.setItem("weca_demo_user", "true");
  });

  // Verify navigation to /profile
  await page.goto("http://localhost:3000/profile", { waitUntil: "networkidle2" });

  let allPassed = true;

  for (const vp of VIEWPORTS) {
    console.log(`\n========================================`);
    console.log(`📱 Testing Profile on ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`========================================`);

    await page.setViewport({
      width: vp.width,
      height: vp.height,
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
    });

    // Re-evaluate page state after viewport change
    await page.goto("http://localhost:3000/profile", { waitUntil: "networkidle2" });

    // Wait for profile content to render
    await page.waitForSelector("#profile-status-note-bubble, #profile-avatar-story-ring", { timeout: 10000 });

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

      // Check key sections
      const header = document.querySelector("header");
      const bottomNav = document.querySelector("nav[aria-label='Mobile Bottom Navigation']");
      const avatar = document.querySelector("#profile-avatar-story-ring");
      const noteBubble = document.querySelector("#profile-status-note-bubble");
      const dashboardCard = document.querySelector("#profile-explorer-dashboard-card");
      const highlights = document.querySelectorAll("[id^='highlight-item-']");

      return {
        scrollWidth,
        innerWidth,
        hasHorizontalScroll,
        overflowingElementsCount: overflowingElements.length,
        overflowingSamples: overflowingElements.slice(0, 3),
        hasHeader: !!header,
        hasBottomNav: !!bottomNav,
        hasAvatar: !!avatar,
        hasNoteBubble: !!noteBubble,
        hasDashboardCard: !!dashboardCard,
        highlightsCount: highlights.length,
      };
    });

    console.log(`  ScrollWidth: ${metrics.scrollWidth}px vs InnerWidth: ${metrics.innerWidth}px`);
    console.log(`  Key elements present: Header: ${metrics.hasHeader}, Avatar: ${metrics.hasAvatar}, Note: ${metrics.hasNoteBubble}, Dashboard: ${metrics.hasDashboardCard}, Highlights: ${metrics.highlightsCount}`);

    if (metrics.hasHorizontalScroll) {
      console.log(`  ❌ OVERFLOW (+${metrics.scrollWidth - metrics.innerWidth}px)! Samples:`, metrics.overflowingSamples);
      allPassed = false;
    } else {
      console.log(`  ✅ PASS: Zero horizontal overflow!`);
    }

    // Capture screenshot for visual inspection
    if (vp.name.includes("iPhone 15 Pro")) {
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, "profile_logged_in_iphone15.png") });
      console.log(`  📸 Saved iPhone 15 Pro screenshot.`);
    } else if (vp.name.includes("iPhone SE")) {
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, "profile_logged_in_iphonese.png") });
      console.log(`  📸 Saved iPhone SE screenshot.`);
    } else if (vp.name.includes("iPad Mini")) {
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, "profile_logged_in_ipad.png") });
      console.log(`  📸 Saved iPad Mini screenshot.`);
    } else if (vp.name.includes("Desktop")) {
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, "profile_logged_in_desktop.png") });
      console.log(`  📸 Saved Desktop screenshot.`);
    }
  }

  // Interactive Test: Click on "Versus Battles" Tab
  console.log("\n========================================");
  console.log("⚔️ Testing Profile Tab Switching (Versus Battles)...");
  console.log("========================================");
  await page.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true });
  await page.goto("http://localhost:3000/profile", { waitUntil: "networkidle2" });
  
  // Find and click the battles tab
  const battlesTabClicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const battleBtn = buttons.find((b) => b.textContent && b.textContent.includes("Battles"));
    if (battleBtn) {
      battleBtn.click();
      return true;
    }
    return false;
  });

  if (battlesTabClicked) {
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "profile_battles_tab_iphone15.png") });
    console.log("  ✅ Clicked Battles tab and captured screenshot.");
  }

  await browser.close();

  if (!allPassed) {
    console.error("\n❌ Profile audit detected issues!");
    process.exit(1);
  } else {
    console.log("\n🎉 Profile Page After-Login Audit: 100% PASS across all viewports!");
  }
}

runProfileAudit().catch((err) => {
  console.error("Audit failed with error:", err);
  process.exit(1);
});
