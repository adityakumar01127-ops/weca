import puppeteer from "puppeteer-core";
import path from "path";

const BASE_URL = "http://localhost:3000";
const ARTIFACTS_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/a2556c88-68c1-49c1-a381-72f0bd98bb58";

async function run() {
  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Log in as lead_curator (has 1850 WC)
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
  await page.type("input[type='email']", "admin@weca.app");
  await page.type("input[type='password']", "AdminPassword123!");
  await page.click("button[type='submit']");
  await new Promise((r) => setTimeout(r, 2000));

  // Navigate to /wallet
  await page.goto(`${BASE_URL}/wallet`, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 1500));

  // Click the active Request Payout button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const target = btns.find((b) => b.textContent?.includes("Request Payout"));
    if (target) target.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  const shotModal = "shot_phase4_03_wallet_payout_modal.png";
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, shotModal) });
  console.log(`Saved modal screenshot: ${shotModal}`);

  await browser.close();
}

run().catch(console.error);
