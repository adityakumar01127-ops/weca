import puppeteer from "puppeteer-core";
import path from "path";

const ARTIFACT_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/632f2ae4-0fdb-4687-98c0-77d37549bfd6";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    protocolTimeout: 60000,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    // iPhone 14 Pro resolution
    await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 3, isMobile: true, hasTouch: true });

    await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, 1000));
    const guestBtn = await page.waitForSelector("button ::-p-text(Instant Explorer Pass (Guest Mode))", { timeout: 8000 });
    if (guestBtn) {
      await guestBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
    }

    await page.goto("http://localhost:3000/profile", { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, 1500));

    console.log("Capturing Mobile Profile Overview with Highlights & Explorer Dashboard...");
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "mobile_profile_highlights_dashboard.png"),
    });

    console.log("Opening Explorer Dashboard on Mobile...");
    const card = await page.waitForSelector("#profile-explorer-dashboard-card", { timeout: 5000 });
    if (card) {
      await card.click();
      await new Promise((r) => setTimeout(r, 800));
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, "mobile_explorer_dashboard_modal.png"),
      });
    }

    console.log("Mobile verification complete!");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
