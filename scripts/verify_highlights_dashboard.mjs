import puppeteer from "puppeteer-core";
import path from "path";

const ARTIFACT_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/632f2ae4-0fdb-4687-98c0-77d37549bfd6";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function main() {
  console.log("Launching Chrome...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    protocolTimeout: 60000,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1400,1000"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 2 });

    // 1. Authenticate via Instant Explorer Pass on /login
    console.log("1. Authenticating via /login...");
    await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, 1200));

    const guestBtn = await page.waitForSelector("button ::-p-text(Instant Explorer Pass (Guest Mode))", { timeout: 10000 });
    if (guestBtn) {
      await guestBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
    }

    // 2. Navigate to Profile
    console.log("2. Navigating to /profile...");
    await page.goto("http://localhost:3000/profile", { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, 2000));

    // Capture Step 1: Profile Overview with Highlights and Dashboard Card
    console.log("Capturing Step 1: Profile Overview...");
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "profile_highlights_and_dashboard_card.png"),
    });

    // Capture Step 2: Click Explorer Dashboard Card
    console.log("Step 2: Clicking Explorer Dashboard Card...");
    const dashboardCard = await page.waitForSelector("#profile-explorer-dashboard-card", { timeout: 5000 });
    if (dashboardCard) {
      await dashboardCard.click();
      await new Promise((r) => setTimeout(r, 1000));
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, "explorer_dashboard_modal.png"),
      });

      // Close modal
      const closeBtn = await page.$('button[title="Copy Telemetry Summary"] + button');
      if (closeBtn) {
        await closeBtn.click();
      } else {
        await page.keyboard.press("Escape");
      }
      await new Promise((r) => setTimeout(r, 800));
    }

    // Capture Step 3: Click '+ New' to open HighlightModal
    console.log("Step 3: Clicking '+ New' highlight button...");
    const addHighlightBtn = await page.waitForSelector("#add-new-highlight-btn", { timeout: 5000 });
    if (addHighlightBtn) {
      await addHighlightBtn.click();
      await new Promise((r) => setTimeout(r, 1000));
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, "highlight_modal_create.png"),
      });

      // Fill in title
      console.log("Typing highlight title...");
      const titleInput = await page.$("#highlight-title-input");
      if (titleInput) {
        await titleInput.click({ clickCount: 3 });
        await titleInput.type("Cyber Glitches");
      }

      // Pick glyph
      const glyphBtns = await page.$$("button[title]");
      for (const btn of glyphBtns) {
        const title = await page.evaluate((el) => el.getAttribute("title"), btn);
        if (title === "Energy Flux") {
          await btn.click();
          break;
        }
      }
      await new Promise((r) => setTimeout(r, 500));

      // Save highlight
      const saveBtn = await page.$("#highlight-save-btn");
      if (saveBtn) {
        await saveBtn.click();
        await new Promise((r) => setTimeout(r, 1500));
      }

      // Capture highlight created in row
      console.log("Capturing Step 4: Highlight created in row...");
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, "highlight_created_in_row.png"),
      });
    }

    // Capture Step 5: Click a highlight to test Story Viewer
    console.log("Step 5: Clicking a highlight to test Story Viewer...");
    const highlightItems = await page.$$('[id^="highlight-item-"]');
    if (highlightItems.length > 0) {
      await highlightItems[0].click();
      await new Promise((r) => setTimeout(r, 1200));
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, "highlight_story_viewer.png"),
      });

      // Close story viewer
      const closeStoryBtn = await page.$('button[aria-label="Close story"]');
      if (closeStoryBtn) {
        await closeStoryBtn.click();
      } else {
        await page.keyboard.press("Escape");
      }
      await new Promise((r) => setTimeout(r, 1000));

      // Capture Step 6: Grid filtered by highlight
      console.log("Capturing Step 6: Grid filtered by highlight...");
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, "highlight_grid_filtered.png"),
      });
    }

    console.log("Visual verification finished successfully!");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
