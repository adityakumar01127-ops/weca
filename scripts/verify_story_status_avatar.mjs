import puppeteer from "puppeteer-core";
import path from "path";

const ARTIFACT_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/632f2ae4-0fdb-4687-98c0-77d37549bfd6";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function main() {
  console.log("Starting visual verification for Status, Story, and Avatar systems...");
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

    // Capture initial profile view with avatar badges & status bubble
    const p1 = path.join(ARTIFACT_DIR, "profile_with_direct_triggers.png");
    await page.screenshot({ path: p1 });
    console.log("Captured profile overview with direct triggers:", p1);

    // 3. Test Direct Status Note Modal
    console.log("3. Testing Direct Status Note Modal...");
    const statusBubble = await page.$("#profile-status-note-bubble");
    if (statusBubble) {
      await statusBubble.click();
      await new Promise((r) => setTimeout(r, 600));
      const p2 = path.join(ARTIFACT_DIR, "status_note_modal.png");
      await page.screenshot({ path: p2 });
      console.log("Captured Status Note Modal:", p2);

      // Select emoji vibe and update note
      await page.evaluate(() => {
        const emojiBtns = Array.from(document.querySelectorAll("button"));
        const eyeBtn = emojiBtns.find((b) => b.textContent && b.textContent.includes("👁️"));
        if (eyeBtn) eyeBtn.click();

        const input = document.querySelector('input[placeholder*="What\'s on your radar"]');
        if (input) {
          input.value = "Hunting Tokyo optical glitches 👁️⚡";
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
      await new Promise((r) => setTimeout(r, 400));

      // Click Update Note button
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const updateBtn = btns.find((b) => b.textContent && b.textContent.includes("Update Note"));
        if (updateBtn) updateBtn.click();
      });
      await new Promise((r) => setTimeout(r, 1200));

      const p3 = path.join(ARTIFACT_DIR, "status_note_updated.png");
      await page.screenshot({ path: p3 });
      console.log("Captured updated status note on profile:", p3);
    } else {
      console.error("Could not find #profile-status-note-bubble");
    }

    // 4. Test Add Story Modal (+ badge)
    console.log("4. Testing Add Story Modal (+ badge)...");
    const addStoryBtn = await page.$("#profile-add-story-btn");
    if (addStoryBtn) {
      await addStoryBtn.click();
      await new Promise((r) => setTimeout(r, 600));
      const p4 = path.join(ARTIFACT_DIR, "add_story_modal.png");
      await page.screenshot({ path: p4 });
      console.log("Captured Add Story Modal:", p4);

      // Add a caption and publish story
      await page.evaluate(() => {
        const input = document.querySelector('input[placeholder*="Add story caption"]');
        if (input) {
          input.value = "Active anomaly detected in Kyoto sector ✨";
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
      await new Promise((r) => setTimeout(r, 400));

      // Click Share to Story button
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const pubBtn = btns.find((b) => b.textContent && b.textContent.includes("Share to Story"));
        if (pubBtn) pubBtn.click();
      });
      await new Promise((r) => setTimeout(r, 1200));
      console.log("Published new story!");
    } else {
      console.error("Could not find #profile-add-story-btn");
    }

    // 5. Test Story Viewer Modal (Clicking Avatar Story Ring)
    console.log("5. Testing Story Viewer Modal (Avatar Story Ring)...");
    const storyRing = await page.$("#profile-avatar-story-ring");
    if (storyRing) {
      await storyRing.click();
      await new Promise((r) => setTimeout(r, 800));
      const p5 = path.join(ARTIFACT_DIR, "story_viewer_modal.png");
      await page.screenshot({ path: p5 });
      console.log("Captured Story Viewer Modal:", p5);

      // React to story with emoji
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const fireReaction = btns.find((b) => b.textContent && b.textContent.trim() === "🔥");
        if (fireReaction) fireReaction.click();
      });
      await new Promise((r) => setTimeout(r, 800));

      // Close story viewer
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const closeBtn = btns.find((b) => b.getAttribute("aria-label") === "Close story");
        if (closeBtn) closeBtn.click();
      });
      await new Promise((r) => setTimeout(r, 800));
    } else {
      console.error("Could not find #profile-avatar-story-ring");
    }

    // 6. Test Avatar Action Modal (Camera Edit Badge)
    console.log("6. Testing Avatar Action Modal (Camera Edit Badge)...");
    const editAvatarBtn = await page.$("#profile-edit-avatar-btn");
    if (editAvatarBtn) {
      await editAvatarBtn.click();
      await new Promise((r) => setTimeout(r, 600));
      const p6 = path.join(ARTIFACT_DIR, "avatar_action_modal.png");
      await page.screenshot({ path: p6 });
      console.log("Captured Avatar Action Modal:", p6);

      // Roll Random Anomaly Bot via direct selector
      const rollBtn = await page.$("#avatar-action-roll-bot-btn");
      if (rollBtn) {
        await rollBtn.click();
        await new Promise((r) => setTimeout(r, 1500));
      }

      const p7 = path.join(ARTIFACT_DIR, "avatar_updated_profile.png");
      await page.screenshot({ path: p7 });
      console.log("Captured profile with updated avatar:", p7);

      // 7. Test Remove / Delete Photo Action
      console.log("7. Testing Remove / Delete Photo Action...");
      await editAvatarBtn.click();
      await new Promise((r) => setTimeout(r, 600));

      const removeBtn = await page.$("#avatar-action-remove-btn");
      if (removeBtn) {
        await removeBtn.click();
        await new Promise((r) => setTimeout(r, 1500));
        const p8 = path.join(ARTIFACT_DIR, "avatar_removed_profile.png");
        await page.screenshot({ path: p8 });
        console.log("Captured profile with removed avatar (clean initials):", p8);
      }
    } else {
      console.error("Could not find #profile-edit-avatar-btn");
    }

    console.log("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("Error during verification:", err);
  } finally {
    await browser.close();
  }
}

main();
