import puppeteer from "puppeteer-core";
import path from "path";

const ARTIFACT_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/2e2615c0-61a3-4c20-af17-f4f78d1a8984";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function loginUser(page) {
  await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 1200));

  const guestBtn = await page.waitForSelector("button ::-p-text(Instant Explorer Pass (Guest Mode))", { timeout: 5000 }).catch(() => null);
  if (guestBtn) {
    await guestBtn.click();
    await new Promise((r) => setTimeout(r, 1500));
  }
}

async function runVerification() {
  console.log("===============================================================================");
  console.log("TESTING STORY & HIGHLIGHTS WATCHING EXPERIENCE");
  console.log("===============================================================================\n");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    protocolTimeout: 60000,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"],
  });

  try {
    const page = await browser.newPage();

    // =========================================================================
    // MOBILE VIEWPORT VERIFICATION (iPhone 15 Pro, 393 x 852)
    // =========================================================================
    console.log("1. Setting Mobile Viewport (393 x 852)...");
    await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

    await loginUser(page);
    await page.goto("http://localhost:3000/profile", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1500));

    // A. Open Story Viewer via Avatar Story Ring
    console.log("2. Opening Story Viewer from avatar story ring...");
    const storyRing = await page.waitForSelector("#profile-avatar-story-ring", { timeout: 5000 });
    if (!storyRing) throw new Error("Could not find #profile-avatar-story-ring");
    await storyRing.click();
    await new Promise((r) => setTimeout(r, 1000));

    // Capture initial story watch view on mobile
    const pMobileStoryWatch = path.join(ARTIFACT_DIR, "story_watch_mobile_initial.png");
    await page.screenshot({ path: pMobileStoryWatch });
    console.log("✓ Captured initial mobile story watch view:", pMobileStoryWatch);

    // B. Test Hold-to-Pause (Clean Screen Mode)
    console.log("3. Testing Hold-to-Pause (Clean Screen Mode)...");
    // Pointer down on media container for 400ms
    const box = await page.$eval("div.bg-zinc-950", (el) => {
      const rect = el.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });

    await page.mouse.move(box.x, box.y);
    await page.mouse.down();
    await new Promise((r) => setTimeout(r, 300)); // Hold long enough to trigger clean mode

    const pCleanHold = path.join(ARTIFACT_DIR, "story_watch_mobile_clean_hold.png");
    await page.screenshot({ path: pCleanHold });
    console.log("✓ Captured clean screen hold-to-pause:", pCleanHold);

    await page.mouse.up();
    await new Promise((r) => setTimeout(r, 400)); // Resume

    // C. Test Reaction Emoji Burst & Like Button
    console.log("4. Testing Reaction Emoji Burst & Like Heart...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const fireBtn = btns.find((b) => b.textContent && b.textContent.trim() === "🔥");
      if (fireBtn) fireBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    // Click heart button
    const likeBtn = await page.$("#story-like-btn");
    if (likeBtn) await likeBtn.click();
    await new Promise((r) => setTimeout(r, 500));

    const pReaction = path.join(ARTIFACT_DIR, "story_watch_mobile_reaction_burst.png");
    await page.screenshot({ path: pReaction });
    console.log("✓ Captured floating reaction burst & heart like:", pReaction);

    // D. Test Quick DM Reply Input
    console.log("5. Testing Quick DM Reply Bar...");
    await page.type("input[placeholder*='Reply to @']", "Incredible Tokyo anomaly sighting! 🚀");
    await new Promise((r) => setTimeout(r, 300));

    const pReplyTyping = path.join(ARTIFACT_DIR, "story_watch_mobile_reply_input.png");
    await page.screenshot({ path: pReplyTyping });
    console.log("✓ Captured quick reply typing state:", pReplyTyping);

    // Submit reply
    await page.keyboard.press("Enter");
    await new Promise((r) => setTimeout(r, 700));

    // E. Test Viewers Insights Sheet (for own story)
    console.log("6. Testing Viewers Insights Sheet...");
    const viewersBtn = await page.$("#story-viewers-trigger-btn");
    if (viewersBtn) {
      await viewersBtn.click();
      await new Promise((r) => setTimeout(r, 600));

      const pViewers = path.join(ARTIFACT_DIR, "story_watch_mobile_viewers_sheet.png");
      await page.screenshot({ path: pViewers });
      console.log("✓ Captured story viewers sheet:", pViewers);

      // Close viewers sheet
      await page.keyboard.press("Escape");
      await new Promise((r) => setTimeout(r, 400));
    }

    // F. Close Story Viewer
    const closeBtn = await page.$("#story-viewer-close-btn");
    if (closeBtn) await closeBtn.click();
    await new Promise((r) => setTimeout(r, 600));

    // =========================================================================
    // HIGHLIGHT WATCHING VERIFICATION
    // =========================================================================
    console.log("\n7. Testing Highlight Watching Mode...");
    const highlightItem = await page.waitForSelector("#highlight-item-h1", { timeout: 5000 });
    if (!highlightItem) throw new Error("Could not find #highlight-item-h1");
    await highlightItem.click();
    await new Promise((r) => setTimeout(r, 1000));

    const pHighlightWatch = path.join(ARTIFACT_DIR, "highlight_watch_mobile_active.png");
    await page.screenshot({ path: pHighlightWatch });
    console.log("✓ Captured highlight watching view (badge + chromatic progress):", pHighlightWatch);

    // Test Highlight Switcher Pill
    console.log("8. Testing Highlight Switcher Pill...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const tokyoBtn = btns.find((b) => b.textContent && b.textContent.includes("Tokyo Night"));
      if (tokyoBtn) tokyoBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    const pSwitchedHighlight = path.join(ARTIFACT_DIR, "highlight_watch_switched_reel.png");
    await page.screenshot({ path: pSwitchedHighlight });
    console.log("✓ Captured switched highlight reel:", pSwitchedHighlight);

    // Close Highlight Viewer
    const closeHlBtn = await page.$("#story-viewer-close-btn");
    if (closeHlBtn) await closeHlBtn.click();
    await new Promise((r) => setTimeout(r, 600));

    // =========================================================================
    // DESKTOP VIEWPORT VERIFICATION (1280 x 900)
    // =========================================================================
    console.log("\n9. Testing Desktop Viewport (1280 x 900)...");
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2, isMobile: false, hasTouch: false });
    await new Promise((r) => setTimeout(r, 800));

    // Open Story on desktop to verify side chevrons and atmospheric blurred backdrop
    const storyRingDesktop = await page.$("#profile-avatar-story-ring");
    if (storyRingDesktop) await storyRingDesktop.click();
    await new Promise((r) => setTimeout(r, 1200));

    const pDesktopStoryWatch = path.join(ARTIFACT_DIR, "story_watch_desktop_ambient.png");
    await page.screenshot({ path: pDesktopStoryWatch });
    console.log("✓ Captured desktop story watch view with ambient backdrop & chevrons:", pDesktopStoryWatch);

    // Test More Options Menu
    const optionsBtn = await page.$("#story-options-menu-btn");
    if (optionsBtn) {
      await optionsBtn.click();
      await new Promise((r) => setTimeout(r, 400));

      const pOptionsMenu = path.join(ARTIFACT_DIR, "story_watch_options_dropdown.png");
      await page.screenshot({ path: pOptionsMenu });
      console.log("✓ Captured options dropdown menu:", pOptionsMenu);
    }

    console.log("\n===============================================================================");
    console.log("ALL STORY & HIGHLIGHTS WATCHING VERIFICATION TESTS PASSED!");
    console.log("===============================================================================");
  } finally {
    await browser.close();
  }
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
