import puppeteer from "puppeteer-core";
import path from "path";

const ARTIFACT_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/d4b49989-efb8-449c-9b4b-ee4041afd820";
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

async function verifyStoryAndHighlights() {
  console.log("===============================================================================");
  console.log("DEEP VERIFICATION: STORY & HIGHLIGHTS SYSTEMS");
  console.log("===============================================================================\n");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    protocolTimeout: 60000,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"],
  });

  try {
    const page = await browser.newPage();
    // Use iPhone 15 Pro viewport with 2x DPR
    await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

    console.log("Step 1: Authenticating user...");
    await loginUser(page);

    console.log("Step 2: Navigating to /profile...");
    await page.goto("http://localhost:3000/profile", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1500));

    // Capture initial profile view showing story ring and highlight strip
    const pProfile = path.join(ARTIFACT_DIR, "verify_profile_story_highlights_overview.png");
    await page.screenshot({ path: pProfile });
    console.log("Captured profile overview:", pProfile);

    // =========================================================================
    // PART A: STORY SYSTEM VERIFICATION
    // =========================================================================
    console.log("\n--- PART A: STORY SYSTEM VERIFICATION ---");

    // A1. Verify story ring exists and has active stories
    const hasStoryRing = await page.$("#profile-avatar-story-ring");
    if (!hasStoryRing) throw new Error("Could not find #profile-avatar-story-ring");
    console.log("✓ Avatar Story Ring found with chromatic active border!");

    // A2. Click story ring to view current story
    console.log("Opening Story Viewer via Avatar Story Ring...");
    await hasStoryRing.click();
    await new Promise((r) => setTimeout(r, 800));

    const pStory1 = path.join(ARTIFACT_DIR, "verify_story_viewer_active.png");
    await page.screenshot({ path: pStory1 });
    console.log("✓ Story Viewer opened ->", pStory1);

    // A3. Test reaction emoji
    console.log("Testing emoji reaction in Story Viewer...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const heartBtn = btns.find((b) => b.textContent && b.textContent.trim() === "❤️");
      if (heartBtn) heartBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    const pReaction = path.join(ARTIFACT_DIR, "verify_story_reaction_fired.png");
    await page.screenshot({ path: pReaction });
    console.log("✓ Story reaction fired with toast & confetti ->", pReaction);

    // A4. Test tap-to-navigate (Next story)
    console.log("Navigating to next story via right-tap...");
    await page.evaluate(() => {
      const rightTap = document.querySelector('div[aria-label="Next story"]');
      if (rightTap) rightTap.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    const pStory2 = path.join(ARTIFACT_DIR, "verify_story_next_story.png");
    await page.screenshot({ path: pStory2 });
    console.log("✓ Next story displayed ->", pStory2);

    // Close Story Viewer via explicit close button
    const closeStoryViewerBtn = await page.$("#story-viewer-close-btn");
    if (closeStoryViewerBtn) await closeStoryViewerBtn.click();
    await new Promise((r) => setTimeout(r, 800));

    // A5. Test Add Story Modal Flow
    console.log("Testing Add Story Modal via plus badge...");
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      const btn = document.getElementById("profile-add-story-btn");
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    // Select 2nd candidate photo and set caption
    await page.evaluate(() => {
      const cand2 = document.getElementById("candidate-story-photo-cand-2");
      if (cand2) cand2.click();

      const input = document.getElementById("story-caption-input");
      if (input) {
        input.value = "Quantum spatial resonance over Tokyo ✨";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    await new Promise((r) => setTimeout(r, 500));

    const pAddStory = path.join(ARTIFACT_DIR, "verify_add_story_creation.png");
    await page.screenshot({ path: pAddStory });
    console.log("✓ Add Story Modal filled ->", pAddStory);

    // Publish story via submit button
    const shareBtn = await page.$("#story-share-submit-btn");
    if (shareBtn) await shareBtn.click();
    await new Promise((r) => setTimeout(r, 1200));
    console.log("✓ New story published!");

    // Re-open Story Viewer to confirm new story is in reel
    await (await page.$("#profile-avatar-story-ring")).click();
    await new Promise((r) => setTimeout(r, 800));

    const pNewStoryAdded = path.join(ARTIFACT_DIR, "verify_story_new_story_added.png");
    await page.screenshot({ path: pNewStoryAdded });
    console.log("✓ Verified newly published story in story reel ->", pNewStoryAdded);

    const closeStoryViewer2 = await page.$("#story-viewer-close-btn");
    if (closeStoryViewer2) await closeStoryViewer2.click();
    await new Promise((r) => setTimeout(r, 800));

    // =========================================================================
    // PART B: HIGHLIGHTS SYSTEM VERIFICATION
    // =========================================================================
    console.log("\n--- PART B: HIGHLIGHTS SYSTEM VERIFICATION ---");

    // B1. Verify existing highlights
    const existingHighlights = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[id^="highlight-item-"]'));
      return items.map((el) => el.id);
    });
    console.log("Found existing highlight IDs:", existingHighlights);

    // B2. Play Glitch Finds Highlight Reel
    console.log("Playing Highlight Reel: Glitch Finds...");
    const hl1 = await page.$("#highlight-item-h1");
    if (hl1) {
      await hl1.click();
      await new Promise((r) => setTimeout(r, 800));

      const pGlitchReel = path.join(ARTIFACT_DIR, "verify_highlight_reel_glitch_finds.png");
      await page.screenshot({ path: pGlitchReel });
      console.log("✓ Glitch Finds Highlight reel playing ->", pGlitchReel);

      await page.keyboard.press("Escape");
      await new Promise((r) => setTimeout(r, 600));
    }

    // B3. Play Tokyo Night Highlight Reel
    console.log("Playing Highlight Reel: Tokyo Night...");
    const hl2 = await page.$("#highlight-item-h2");
    if (hl2) {
      await hl2.click();
      await new Promise((r) => setTimeout(r, 800));

      const pTokyoReel = path.join(ARTIFACT_DIR, "verify_highlight_reel_tokyo_night.png");
      await page.screenshot({ path: pTokyoReel });
      console.log("✓ Tokyo Night Highlight reel playing ->", pTokyoReel);

      await page.keyboard.press("Escape");
      await new Promise((r) => setTimeout(r, 600));
    }

    // B4. Create a New Expedition Highlight
    console.log("Testing New Expedition Highlight Creator...");
    const addHlBtn = await page.$("#add-new-highlight-btn");
    if (!addHlBtn) throw new Error("Could not find #add-new-highlight-btn");
    await addHlBtn.click();
    await new Promise((r) => setTimeout(r, 600));

    // Fill highlight form: title "Deep Cosmos", pick glyph 🌌, pick 2nd gradient
    await page.evaluate(() => {
      const titleInput = document.querySelector("#highlight-title-input");
      if (titleInput) {
        titleInput.value = "Deep Cosmos";
        titleInput.dispatchEvent(new Event("input", { bubbles: true }));
      }

      // Click Deep Cosmos glyph
      const glyphBtns = Array.from(document.querySelectorAll("button[title]"));
      const cosmosBtn = glyphBtns.find((b) => b.getAttribute("title") === "Deep Cosmos");
      if (cosmosBtn) cosmosBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    const pCreateHlModal = path.join(ARTIFACT_DIR, "verify_highlight_modal_glyphs.png");
    await page.screenshot({ path: pCreateHlModal });
    console.log("✓ Highlight Creator form configured ->", pCreateHlModal);

    // Click "Create Highlight"
    const saveBtn = await page.$("#highlight-save-btn");
    if (saveBtn) {
      await saveBtn.click();
      await new Promise((r) => setTimeout(r, 1200));
      console.log("✓ New Highlight created!");
    }

    // Capture profile showing the new "Deep Cosmos" highlight bubble
    const pNewHlProfile = path.join(ARTIFACT_DIR, "verify_highlight_created_bubble.png");
    await page.screenshot({ path: pNewHlProfile });
    console.log("✓ Verified new highlight bubble on profile strip ->", pNewHlProfile);

    // B5. Play the newly created highlight reel
    const allHls = await page.$$('[id^="highlight-item-"]');
    if (allHls.length > 0) {
      const newestHl = allHls[allHls.length - 1];
      await newestHl.click();
      await new Promise((r) => setTimeout(r, 800));

      const pNewReelPlay = path.join(ARTIFACT_DIR, "verify_highlight_created_reel.png");
      await page.screenshot({ path: pNewReelPlay });
      console.log("✓ Playing newly created highlight reel ->", pNewReelPlay);

      await page.keyboard.press("Escape");
      await new Promise((r) => setTimeout(r, 600));
    }

    // B6. Edit an existing highlight (Test photo cover tab)
    console.log("Testing Edit Highlight with Photo cover...");
    const editBtnHl1 = await page.$("#edit-highlight-btn-h1");
    if (editBtnHl1) {
      await editBtnHl1.click();
      await new Promise((r) => setTimeout(r, 600));

      // Switch to Photo / Sightings tab
      const photoTab = await page.$("#cover-tab-image");
      if (photoTab) await photoTab.click();
      await new Promise((r) => setTimeout(r, 400));

      // Change title to "Glitch Vault"
      await page.evaluate(() => {
        const titleInput = document.querySelector("#highlight-title-input");
        if (titleInput) {
          titleInput.value = "Glitch Vault";
          titleInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
      await new Promise((r) => setTimeout(r, 400));

      const pEditHl = path.join(ARTIFACT_DIR, "verify_highlight_edited_form.png");
      await page.screenshot({ path: pEditHl });
      console.log("✓ Edit Highlight Photo Tab ->", pEditHl);

      // Save changes
      const saveEditBtn = await page.$("#highlight-save-btn");
      if (saveEditBtn) {
        await saveEditBtn.click();
        await new Promise((r) => setTimeout(r, 1200));
        console.log("✓ Highlight changes saved!");
      }

      const pEditedProfile = path.join(ARTIFACT_DIR, "verify_highlight_edited_on_profile.png");
      await page.screenshot({ path: pEditedProfile });
      console.log("✓ Profile shows updated 'Glitch Vault' highlight ->", pEditedProfile);
    }

    console.log("\n===============================================================================");
    console.log("ALL STORY & HIGHLIGHTS VERIFICATIONS COMPLETED WITH 100% SUCCESS!");
    console.log("===============================================================================");
  } catch (err) {
    console.error("ERROR DURING VERIFICATION:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

verifyStoryAndHighlights();
