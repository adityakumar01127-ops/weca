import puppeteer from "puppeteer-core";
import path from "path";

const ARTIFACT_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/9efa75a0-7db1-4488-a18d-fb47352bf5d8";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,850"],
    defaultViewport: { width: 1280, height: 850 },
  });

  const page = await browser.newPage();
  
  // Clear any existing session to see the fresh 1st page (login)
  await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 1200));

  // 1. Screenshot of the redesigned 1st page (Instagram-style login)
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "login_page_redesign.png"),
    fullPage: false,
  });
  console.log("Captured: login_page_redesign.png");

  // 2. Click 'Create new account' to test sign up mode
  const createBtn = await page.waitForSelector("button ::-p-text(Create new account)");
  if (createBtn) {
    await createBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "signup_mode_toggle.png"),
      fullPage: false,
    });
    console.log("Captured: signup_mode_toggle.png");
  }

  // 3. Test Demo Sign In
  const demoBtn = await page.waitForSelector("button ::-p-text(Instant Demo Explorer Sign In)");
  if (demoBtn) {
    await demoBtn.click();
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "authenticated_feed.png"),
      fullPage: false,
    });
    console.log("Captured: authenticated_feed.png");
  }

  await browser.close();
  console.log("Screenshots captured successfully!");
}

run().catch(console.error);
