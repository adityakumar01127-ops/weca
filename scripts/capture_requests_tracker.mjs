import puppeteer from "puppeteer-core";
import path from "path";

const ARTIFACT_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/12e40bd2-ee48-4afc-82ce-c8def1a5bbdb";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,1000"],
    defaultViewport: { width: 1280, height: 1000 },
  });

  const page = await browser.newPage();
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
  await page.waitForSelector("input[type='email']");
  await page.type("input[type='email']", "account3@weca.test");
  await page.type("input[type='password']", "Password123!");
  await page.click("button[type='submit']");
  await new Promise((r) => setTimeout(r, 2000));

  await page.goto("http://localhost:3000/wallet", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 2500));

  // Scroll down so Cash-Out Requests section is prominently visible
  await page.evaluate(() => {
    window.scrollTo(0, 520);
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, "step_payout_4_requests_tracker.png") });
  console.log("Saved step_payout_4_requests_tracker.png");
  await browser.close();
}

run();
