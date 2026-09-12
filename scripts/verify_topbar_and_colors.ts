import puppeteer from "puppeteer-core";
import path from "path";
import fs from "fs";

const ARTIFACTS_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/a2556c88-68c1-49c1-a381-72f0bd98bb58";
const BASE_URL = "http://localhost:3000";

async function run() {
  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  console.log("1. Checking Desktop Topbar on Feed (/)...");
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 1200));

  // Count how many "versus" or "vs" buttons are visible in the topbar header
  const topbarVersusCount = await page.evaluate(() => {
    const header = document.querySelector("header");
    if (!header) return 0;
    const linksAndBtns = Array.from(header.querySelectorAll("a, button"));
    return linksAndBtns.filter(el => {
      const isVisible = el.checkVisibility ? el.checkVisibility() : (window.getComputedStyle(el).display !== 'none');
      if (!isVisible) return false;
      const text = el.textContent?.toLowerCase() || "";
      const href = el.getAttribute("href") || "";
      return (text.includes("versus") || text.includes("vs")) && !href.includes("phase");
    }).length;
  });

  console.log(`Topbar Versus options detected: ${topbarVersusCount}`);

  const shotTopbarDesktop = "shot_updated_topbar_desktop.png";
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, shotTopbarDesktop) });

  console.log("2. Checking Mobile Drawer on 390px Viewport...");
  await page.setViewport({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 800));

  // Open mobile menu
  await page.click("button[aria-label='Toggle Menu']");
  await new Promise((r) => setTimeout(r, 500));

  const mobileVersusCount = await page.evaluate(() => {
    const header = document.querySelector("header");
    if (!header) return 0;
    const linksAndBtns = Array.from(header.querySelectorAll("a, button"));
    return linksAndBtns.filter(el => {
      const isVisible = el.checkVisibility ? el.checkVisibility() : (window.getComputedStyle(el).display !== 'none');
      if (!isVisible) return false;
      const text = el.textContent?.toLowerCase() || "";
      const href = el.getAttribute("href") || "";
      return (text.includes("versus") || text.includes("vs")) && !href.includes("phase");
    }).length;
  });

  console.log(`Mobile drawer Versus options detected: ${mobileVersusCount}`);
  const shotTopbarMobile = "shot_updated_topbar_mobile.png";
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, shotTopbarMobile) });

  console.log("3. Verifying Color Consistency Across Platform Pages...");
  await page.setViewport({ width: 1280, height: 900 });

  const routesToTest = [
    { name: "Feed", url: `${BASE_URL}/`, shot: "shot_consistency_01_feed.png" },
    { name: "Versus", url: `${BASE_URL}/versus`, shot: "shot_consistency_02_versus.png" },
    { name: "Upload", url: `${BASE_URL}/upload`, shot: "shot_consistency_03_upload.png" },
    { name: "Leaderboard", url: `${BASE_URL}/leaderboard`, shot: "shot_consistency_04_leaderboard.png" },
    { name: "Wallet", url: `${BASE_URL}/wallet`, shot: "shot_consistency_05_wallet.png" },
  ];

  const colorAudits = [];
  for (const route of routesToTest) {
    await page.goto(route.url, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));

    const styles = await page.evaluate(() => {
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      const htmlClass = document.documentElement.className;
      const header = document.querySelector("header");
      const headerBg = header ? window.getComputedStyle(header).backgroundColor : "none";
      const headerBorder = header ? window.getComputedStyle(header).borderColor : "none";
      return { bodyBg, htmlClass, headerBg, headerBorder };
    });

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, route.shot) });
    colorAudits.push({ route: route.name, ...styles, shot: route.shot });
    console.log(`- ${route.name}: bodyBg=${styles.bodyBg}, headerBg=${styles.headerBg}, htmlDark=${styles.htmlClass.includes("dark")}`);
  }

  await browser.close();

  const report = {
    topbarVersusCount,
    mobileVersusCount,
    singleVersusOptionVerified: topbarVersusCount === 1 && mobileVersusCount === 1,
    colorAudits,
  };

  fs.writeFileSync(path.join(ARTIFACTS_DIR, "topbar_and_colors_verification.json"), JSON.stringify(report, null, 2));
  console.log("\nAudit Complete! Results saved to topbar_and_colors_verification.json");
}

run().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
