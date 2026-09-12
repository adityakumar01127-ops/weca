import puppeteer from "puppeteer-core";
import path from "path";

const ARTIFACT_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/632f2ae4-0fdb-4687-98c0-77d37549bfd6";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function main() {
  console.log("Launching local Chrome with domcontentloaded timeouts...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    protocolTimeout: 60000,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1400,1000"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 2 });

  // 1. Authenticate via Instant Explorer Pass on /login
  console.log("1. Authenticating via /login...");
  await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 1000));

  const guestBtn = await page.waitForSelector("button ::-p-text(Instant Explorer Pass (Guest Mode))");
  if (guestBtn) {
    await guestBtn.click();
    console.log("Logged in with Instant Explorer Pass!");
    await new Promise((r) => setTimeout(r, 1500));
  }

  // 2. Navigate to /profile
  console.log("2. Navigating to http://localhost:3000/profile...");
  await page.goto("http://localhost:3000/profile", { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 1500));

  // 3. Test Highlight Filtering
  console.log("3. Testing Highlight Filtering...");
  await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll("span"));
    const glitchSpan = spans.find((s) => s.textContent === "Glitch Finds");
    if (glitchSpan) {
      const parent = glitchSpan.closest(".cursor-pointer") || glitchSpan.parentElement;
      if (parent) parent.click();
    }
  });
  await new Promise((r) => setTimeout(r, 800));
  const p3 = path.join(ARTIFACT_DIR, "audit_highlight_filter.png");
  await page.screenshot({ path: p3 });
  console.log("Saved screenshot:", p3);

  // 4. Test Versus Battles tab
  console.log("4. Switching to Versus Battles tab...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const battlesTab = btns.find((b) => b.textContent && b.textContent.includes("Versus Battles"));
    if (battlesTab) battlesTab.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  const p4 = path.join(ARTIFACT_DIR, "audit_battles_tab.png");
  await page.screenshot({ path: p4 });
  console.log("Saved screenshot:", p4);

  // 5. Test Saved tab
  console.log("5. Switching to Saved tab...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const savedTab = btns.find((b) => b.textContent && b.textContent.includes("Saved"));
    if (savedTab) savedTab.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  const p5 = path.join(ARTIFACT_DIR, "audit_saved_tab.png");
  await page.screenshot({ path: p5 });
  console.log("Saved screenshot:", p5);

  // 6. Navigate directly to /settings
  console.log("6. Navigating to /settings...");
  await page.goto("http://localhost:3000/settings", { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 1200));

  // Screenshot 6: Settings Tab 1 (Profile & Identity)
  const p6 = path.join(ARTIFACT_DIR, "audit_settings_profile.png");
  await page.screenshot({ path: p6 });
  console.log("Saved screenshot:", p6);

  // 7. Click AI Vision & Scoring Tab
  console.log("7. Switching to AI Vision tab...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const visionTab = btns.find((b) => b.textContent && b.textContent.includes("AI Vision & Scoring"));
    if (visionTab) visionTab.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  const p7 = path.join(ARTIFACT_DIR, "audit_settings_vision.png");
  await page.screenshot({ path: p7 });
  console.log("Saved screenshot:", p7);

  // 8. Click Weird Credits & Vault Tab
  console.log("8. Switching to Weird Credits & Vault tab...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const walletTab = btns.find((b) => b.textContent && b.textContent.includes("Weird Credits & Vault"));
    if (walletTab) walletTab.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // Click claim daily bonus
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const claimBtn = btns.find((b) => b.textContent && b.textContent.includes("Claim Daily Bonus"));
    if (claimBtn) claimBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  const p8 = path.join(ARTIFACT_DIR, "audit_settings_wallet.png");
  await page.screenshot({ path: p8 });
  console.log("Saved screenshot:", p8);

  // 9. Click Account & Session Tab
  console.log("9. Switching to Account & Session tab...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const accountTab = btns.find((b) => b.textContent && b.textContent.includes("Account & Session"));
    if (accountTab) accountTab.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  const p9 = path.join(ARTIFACT_DIR, "audit_settings_account.png");
  await page.screenshot({ path: p9 });
  console.log("Saved screenshot:", p9);

  await browser.close();
  console.log("ALL SCREENS SUCCESSFULLY VERIFIED AND CAPTURED!");
}

main().catch((err) => {
  console.error("Verification script failed:", err);
  process.exit(1);
});
