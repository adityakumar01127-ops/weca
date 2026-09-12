import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log("Navigating to http://localhost:3000 ...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });

  // 1. Verify 'phase 3' text is NOT in the header
  const headerText = await page.$eval("header", (el) => el.innerText);
  console.log("Header text content:", headerText.replace(/\n/g, " "));

  if (headerText.toLowerCase().includes("phase 3")) {
    throw new Error("FAILED: 'phase 3' is still present in the header!");
  } else {
    console.log("[PASS] 'phase 3' is completely removed from header.");
  }

  // 2. Verify Logo SVG exists in the header
  const logoSvg = await page.$("header svg");
  if (!logoSvg) {
    throw new Error("FAILED: Logo SVG not found in header!");
  } else {
    console.log("[PASS] Brand Logo SVG successfully rendered in header.");
  }

  // 3. Screenshot desktop topbar
  const desktopTopbarPath = path.resolve("/Users/adityakumar/.gemini/antigravity-ide/brain/632f2ae4-0fdb-4687-98c0-77d37549bfd6/topbar_new_logo.png");
  await page.screenshot({ path: desktopTopbarPath, clip: { x: 0, y: 0, width: 1280, height: 180 } });
  console.log("Desktop topbar screenshot saved to:", desktopTopbarPath);

  // 4. Mobile Viewport (390x844)
  await page.setViewport({ width: 390, height: 844 });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });

  const mobileHeader = await page.$eval("header", (el) => el.innerText);
  if (mobileHeader.toLowerCase().includes("phase 3")) {
    throw new Error("FAILED: 'phase 3' found on mobile header!");
  }
  console.log("[PASS] Mobile header verified clean without 'phase 3'.");

  const mobileTopbarPath = path.resolve("/Users/adityakumar/.gemini/antigravity-ide/brain/632f2ae4-0fdb-4687-98c0-77d37549bfd6/mobile_topbar_new_logo.png");
  await page.screenshot({ path: mobileTopbarPath, clip: { x: 0, y: 0, width: 390, height: 160 } });
  console.log("Mobile topbar screenshot saved to:", mobileTopbarPath);

  // 5. Check Login page with new Logo
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle0" });
  const loginLogoPath = path.resolve("/Users/adityakumar/.gemini/antigravity-ide/brain/632f2ae4-0fdb-4687-98c0-77d37549bfd6/login_with_new_logo.png");
  await page.screenshot({ path: loginLogoPath });
  console.log("Login page screenshot saved to:", loginLogoPath);

  await browser.close();
  console.log("ALL VERIFICATIONS PASSED!");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
