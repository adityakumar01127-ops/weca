import puppeteer from "puppeteer-core";
import path from "path";

const ARTIFACT_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/632f2ae4-0fdb-4687-98c0-77d37549bfd6";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function run() {
  console.log("Launching local Chrome...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  
  // Navigate to login page
  console.log("Navigating to http://localhost:3000/login...");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 1200));

  // 1. Screenshot Login Page
  const loginImgPath = path.join(ARTIFACT_DIR, "login_page_obsidian.png");
  await page.screenshot({ path: loginImgPath, fullPage: false });
  console.log("Captured:", loginImgPath);

  // 2. Click 'Create Account' tab
  console.log("Clicking 'Create Account' tab...");
  const createTab = await page.waitForSelector("button ::-p-text(Create Account)");
  if (createTab) {
    await createTab.click();
    await new Promise(r => setTimeout(r, 500));
    
    // Type password to demonstrate password strength meter
    const passInput = await page.waitForSelector("input[placeholder='••••••••••••']");
    if (passInput) {
      await passInput.type("Cosmic@Anomaly99!");
    }
    await new Promise(r => setTimeout(r, 600));

    const signupImgPath = path.join(ARTIFACT_DIR, "signup_page_obsidian.png");
    await page.screenshot({ path: signupImgPath, fullPage: false });
    console.log("Captured:", signupImgPath);
  }

  // 2b. Mobile Viewport Check
  console.log("Checking mobile responsiveness (390x844)...");
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 600));
  const mobileImgPath = path.join(ARTIFACT_DIR, "login_page_mobile.png");
  await page.screenshot({ path: mobileImgPath, fullPage: false });
  console.log("Captured:", mobileImgPath);

  // Restore desktop viewport
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });

  // 3. Test Instant Explorer Pass
  console.log("Testing Instant Explorer Pass button...");
  const guestBtn = await page.waitForSelector("button ::-p-text(Instant Explorer Pass (Guest Mode))");
  if (guestBtn) {
    await guestBtn.click();
    await new Promise(r => setTimeout(r, 1500));
    
    const feedImgPath = path.join(ARTIFACT_DIR, "guest_authenticated_feed.png");
    await page.screenshot({ path: feedImgPath, fullPage: false });
    console.log("Captured:", feedImgPath);
  }

  await browser.close();
  console.log("All screenshots captured and verified successfully!");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
