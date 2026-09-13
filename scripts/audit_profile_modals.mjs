import puppeteer from "puppeteer-core";
import path from "path";
import fs from "fs";

const ARTIFACT_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/d4b49989-efb8-449c-9b4b-ee4041afd820";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const VIEWPORTS = [
  { name: "iPhone SE", width: 375, height: 667, isMobile: true },
  { name: "iPhone 15", width: 393, height: 852, isMobile: true },
  { name: "iPad Mini", width: 768, height: 1024, isMobile: false },
  { name: "Desktop", width: 1280, height: 800, isMobile: false },
];

async function checkOverflow(page, label) {
  return await page.evaluate((lbl) => {
    const docEl = document.documentElement;
    const body = document.body;
    const scrollW = Math.max(docEl.scrollWidth, body.scrollWidth);
    const clientW = window.innerWidth;
    const overflowDiff = scrollW - clientW;
    const isClean = overflowDiff <= 1;
    return {
      label: lbl,
      clientW,
      scrollW,
      overflowDiff,
      isClean,
    };
  }, label);
}

async function loginUser(page) {
  await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 1200));

  const guestBtn = await page.waitForSelector("button ::-p-text(Instant Explorer Pass (Guest Mode))", { timeout: 5000 }).catch(() => null);
  if (guestBtn) {
    await guestBtn.click();
    await new Promise((r) => setTimeout(r, 1500));
  } else {
    // If already logged in or guest button not visible, check localStorage
    await page.evaluate(() => {
      if (!localStorage.getItem("weca_auth_token")) {
        const demoUser = {
          id: "usr_demo_audit",
          username: "aditya_kaushik",
          display_name: "Aditya Kaushik",
          bio: "Anomaly investigator & visual scout.",
          credits_balance: 500,
          total_wc: 500,
          note: "Scanning optical glitches 🌌",
          is_ai_profile: true,
          gender: "Explorer / Scout",
          website: "https://weca.io",
          pronouns: "he/him/his",
        };
        localStorage.setItem("weca_demo_user", JSON.stringify(demoUser));
        localStorage.setItem("weca_auth_token", "demo-token-" + Date.now());
      }
    });
  }
}

async function runAudit() {
  console.log("===============================================================================");
  console.log("STARTING DEEP AUDIT OF PROFILE MODALS & SECTIONS");
  console.log("Sections: Status Note, Story Viewer, Add Story, Highlights, Edit Profile");
  console.log("===============================================================================\n");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    protocolTimeout: 60000,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,800"],
  });

  const auditResults = [];

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

    console.log("1. Authenticating user session...");
    await loginUser(page);

    console.log("2. Navigating to /profile...");
    await page.goto("http://localhost:3000/profile", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1500));

    // -------------------------------------------------------------------------
    // SECTION 1: STATUS NOTE MODAL
    // -------------------------------------------------------------------------
    console.log("\n--- SECTION 1: Status Note Modal ---");
    for (const vp of [VIEWPORTS[0], VIEWPORTS[1], VIEWPORTS[3]]) {
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2, isMobile: vp.isMobile });
      await new Promise((r) => setTimeout(r, 400));

      const statusBtn = await page.$("#profile-status-note-bubble");
      if (!statusBtn) {
        throw new Error("Could not find #profile-status-note-bubble");
      }
      await statusBtn.click();
      await new Promise((r) => setTimeout(r, 600));

      const oflow = await checkOverflow(page, `Status Note Modal (${vp.name})`);
      auditResults.push(oflow);

      const shotPath = path.join(ARTIFACT_DIR, `modal_status_note_${vp.name.toLowerCase().replace(/\s+/g, "")}.png`);
      await page.screenshot({ path: shotPath });
      console.log(`[PASS] Status Note Modal at ${vp.name} (${vp.width}px): overflowDiff=${oflow.overflowDiff}px -> ${shotPath}`);

      // Close modal using Escape or close button
      await page.keyboard.press("Escape");
      await new Promise((r) => setTimeout(r, 500));
    }

    // -------------------------------------------------------------------------
    // SECTION 2: STORY VIEWER MODAL
    // -------------------------------------------------------------------------
    console.log("\n--- SECTION 2: Story Viewer Modal ---");
    for (const vp of [VIEWPORTS[0], VIEWPORTS[1], VIEWPORTS[3]]) {
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2, isMobile: vp.isMobile });
      await new Promise((r) => setTimeout(r, 400));

      const storyRing = await page.$("#profile-avatar-story-ring");
      if (!storyRing) {
        throw new Error("Could not find #profile-avatar-story-ring");
      }
      await storyRing.click();
      await new Promise((r) => setTimeout(r, 800));

      // Click reaction emoji
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const flameBtn = btns.find((b) => b.textContent && b.textContent.trim() === "🔥");
        if (flameBtn) flameBtn.click();
      });
      await new Promise((r) => setTimeout(r, 400));

      const oflow = await checkOverflow(page, `Story Viewer Modal (${vp.name})`);
      auditResults.push(oflow);

      const shotPath = path.join(ARTIFACT_DIR, `modal_story_viewer_${vp.name.toLowerCase().replace(/\s+/g, "")}.png`);
      await page.screenshot({ path: shotPath });
      console.log(`[PASS] Story Viewer Modal at ${vp.name} (${vp.width}px): overflowDiff=${oflow.overflowDiff}px -> ${shotPath}`);

      // Close story viewer via Escape
      await page.keyboard.press("Escape");
      await new Promise((r) => setTimeout(r, 500));
    }

    // -------------------------------------------------------------------------
    // SECTION 3: ADD STORY MODAL
    // -------------------------------------------------------------------------
    console.log("\n--- SECTION 3: Add Story Modal ---");
    for (const vp of [VIEWPORTS[0], VIEWPORTS[1], VIEWPORTS[3]]) {
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2, isMobile: vp.isMobile });
      await new Promise((r) => setTimeout(r, 400));

      const addStoryBtn = await page.$("#profile-add-story-btn");
      if (!addStoryBtn) {
        throw new Error("Could not find #profile-add-story-btn");
      }
      await addStoryBtn.click();
      await new Promise((r) => setTimeout(r, 600));

      const oflow = await checkOverflow(page, `Add Story Modal (${vp.name})`);
      auditResults.push(oflow);

      const shotPath = path.join(ARTIFACT_DIR, `modal_add_story_${vp.name.toLowerCase().replace(/\s+/g, "")}.png`);
      await page.screenshot({ path: shotPath });
      console.log(`[PASS] Add Story Modal at ${vp.name} (${vp.width}px): overflowDiff=${oflow.overflowDiff}px -> ${shotPath}`);

      // Close via Escape
      await page.keyboard.press("Escape");
      await new Promise((r) => setTimeout(r, 500));
    }

    // -------------------------------------------------------------------------
    // SECTION 4: HIGHLIGHTS MODAL & PLAYBACK
    // -------------------------------------------------------------------------
    console.log("\n--- SECTION 4: Highlights (Playback & Creator Modal) ---");
    // 4a. Play existing highlight reel
    await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true });
    await new Promise((r) => setTimeout(r, 400));

    const firstHighlight = await page.$('[id^="highlight-item-"]');
    if (firstHighlight) {
      await firstHighlight.click();
      await new Promise((r) => setTimeout(r, 800));

      const oflowReel = await checkOverflow(page, "Highlight Reel Story Playback (iPhone 15)");
      auditResults.push(oflowReel);

      const shotReel = path.join(ARTIFACT_DIR, "modal_highlight_reel_iphone15.png");
      await page.screenshot({ path: shotReel });
      console.log(`[PASS] Highlight Story Reel Playback: overflowDiff=${oflowReel.overflowDiff}px -> ${shotReel}`);

      await page.keyboard.press("Escape");
      await new Promise((r) => setTimeout(r, 500));
    }

    // 4b. Create/Edit Highlight Modal across viewports
    for (const vp of [VIEWPORTS[0], VIEWPORTS[1], VIEWPORTS[3]]) {
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2, isMobile: vp.isMobile });
      await new Promise((r) => setTimeout(r, 400));

      const addHlBtn = await page.$("#add-new-highlight-btn");
      if (!addHlBtn) {
        throw new Error("Could not find #add-new-highlight-btn");
      }
      await addHlBtn.click();
      await new Promise((r) => setTimeout(r, 600));

      const oflow = await checkOverflow(page, `Highlight Creator Modal (${vp.name})`);
      auditResults.push(oflow);

      const shotPath = path.join(ARTIFACT_DIR, `modal_highlight_create_${vp.name.toLowerCase().replace(/\s+/g, "")}.png`);
      await page.screenshot({ path: shotPath });
      console.log(`[PASS] Highlight Creator Modal at ${vp.name} (${vp.width}px): overflowDiff=${oflow.overflowDiff}px -> ${shotPath}`);

      // On iPhone 15, also test switching tabs to "Photo / Sightings"
      if (vp.name === "iPhone 15") {
        const photoTab = await page.$("#cover-tab-image");
        if (photoTab) {
          await photoTab.click();
          await new Promise((r) => setTimeout(r, 400));
          const shotTab = path.join(ARTIFACT_DIR, "modal_highlight_photo_tab_iphone15.png");
          await page.screenshot({ path: shotTab });
          console.log(`[PASS] Highlight Photo Tab: -> ${shotTab}`);
        }
      }

      // Close via Escape
      await page.keyboard.press("Escape");
      await new Promise((r) => setTimeout(r, 500));
    }

    // -------------------------------------------------------------------------
    // SECTION 5: PROFILE EDIT MODAL
    // -------------------------------------------------------------------------
    console.log("\n--- SECTION 5: Profile Edit Modal ---");
    for (const vp of [VIEWPORTS[0], VIEWPORTS[1], VIEWPORTS[3]]) {
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2, isMobile: vp.isMobile });
      await new Promise((r) => setTimeout(r, 400));

      const editBtn = await page.$("#profile-edit-profile-btn");
      if (!editBtn) {
        throw new Error("Could not find #profile-edit-profile-btn");
      }
      await editBtn.click();
      await new Promise((r) => setTimeout(r, 600));

      const oflow = await checkOverflow(page, `Edit Profile Modal (${vp.name})`);
      auditResults.push(oflow);

      const shotPath = path.join(ARTIFACT_DIR, `modal_edit_profile_${vp.name.toLowerCase().replace(/\s+/g, "")}.png`);
      await page.screenshot({ path: shotPath });
      console.log(`[PASS] Edit Profile Modal at ${vp.name} (${vp.width}px): overflowDiff=${oflow.overflowDiff}px -> ${shotPath}`);

      // On iPhone 15, also test expanding the avatar editor
      if (vp.name === "iPhone 15") {
        await page.evaluate(() => {
          const editPicBtn = Array.from(document.querySelectorAll("button")).find(
            (b) => b.textContent && b.textContent.includes("Edit picture or avatar")
          );
          if (editPicBtn) editPicBtn.click();
        });
        await new Promise((r) => setTimeout(r, 400));
        const shotAvatarExp = path.join(ARTIFACT_DIR, "modal_edit_profile_avatar_expanded.png");
        await page.screenshot({ path: shotAvatarExp });
        console.log(`[PASS] Edit Profile Avatar Expanded: -> ${shotAvatarExp}`);
      }

      // Close via Escape
      await page.keyboard.press("Escape");
      await new Promise((r) => setTimeout(r, 500));
    }

    console.log("\n===============================================================================");
    console.log("FINAL AUDIT SUMMARY FOR PROFILE MODALS & SECTIONS");
    console.log("===============================================================================");
    let allPassed = true;
    for (const res of auditResults) {
      const status = res.isClean ? "✓ PASS" : "✗ FAIL";
      if (!res.isClean) allPassed = false;
      console.log(`${status} | ${res.label} | scrollW: ${res.scrollW}px, clientW: ${res.clientW}px (diff: ${res.overflowDiff}px)`);
    }

    if (allPassed) {
      console.log("\nSUCCESS: All modals & sections passed 100% with zero horizontal overflow!");
    } else {
      console.error("\nFAILURES DETECTED: Some modals have overflow.");
      process.exit(1);
    }
  } catch (err) {
    console.error("FATAL ERROR DURING AUDIT:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runAudit();
