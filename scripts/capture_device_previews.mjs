import puppeteer from "puppeteer-core";
import path from "path";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ARTIFACTS_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/d4b49989-efb8-449c-9b4b-ee4041afd820";

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // iPhone 15 Pro Mobile View
  await page.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle2" });
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "iphone15_feed.png") });

  // Map on iPhone SE
  await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
  await page.goto("http://localhost:3000/map", { waitUntil: "networkidle2" });
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "iphonese_map.png") });

  // Settings on iPhone 15 Pro
  await page.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true });
  await page.goto("http://localhost:3000/settings", { waitUntil: "networkidle2" });
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "iphone15_settings.png") });

  // iPad Mini (768px)
  await page.setViewport({ width: 768, height: 1024, isMobile: false });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle2" });
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "ipad_feed.png") });

  await browser.close();
  console.log("Device preview screenshots saved successfully!");
}

capture().catch((e) => {
  console.error(e);
  process.exit(1);
});
