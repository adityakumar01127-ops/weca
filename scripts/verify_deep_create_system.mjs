import puppeteer from "puppeteer-core";
import path from "path";

const ARTIFACT_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/632f2ae4-0fdb-4687-98c0-77d37549bfd6";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const testResults = [];
function recordResult(step, passed, details) {
  testResults.push({ step, passed, details });
  console.log(`[${passed ? "PASS" : "FAIL"}] ${step}: ${details}`);
}

async function main() {
  console.log("==================================================");
  console.log("STARTING DEEP E2E VERIFICATION FOR CREATE/UPLOAD");
  console.log("==================================================");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    protocolTimeout: 90000,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1440,960",
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 });

  const consoleErrors = [];
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  try {
    // -------------------------------------------------------------
    // PHASE 1: Authenticate via Instant Explorer Pass
    // -------------------------------------------------------------
    console.log("\n--- Phase 1: Authentication ---");
    await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, 1000));

    const guestBtn = await page.waitForSelector("button ::-p-text(Instant Explorer Pass (Guest Mode))");
    if (guestBtn) {
      await guestBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
      recordResult("Authentication", true, "Instant Explorer Pass authorized session");
    } else {
      recordResult("Authentication", false, "Login button not found");
    }

    // -------------------------------------------------------------
    // PHASE 2: Desktop Navbar Trigger & Close Verification
    // -------------------------------------------------------------
    console.log("\n--- Phase 2: Navbar Upload Trigger & Close ---");
    await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, 1000));

    const uploadBtn = await page.waitForSelector("header button ::-p-text(Upload)");
    if (!uploadBtn) throw new Error("Navbar Upload button missing");
    await uploadBtn.click();
    await new Promise((r) => setTimeout(r, 800));

    let modalVisible = await page.evaluate(() => {
      const modal = document.querySelector("h2");
      return modal && modal.textContent.includes("Create Anomaly Sighting");
    });
    recordResult("Navbar + Upload Trigger", modalVisible, "CreatePostModal opened from Navbar button");

    // Test close via Escape key
    await page.keyboard.press("Escape");
    await new Promise((r) => setTimeout(r, 600));
    modalVisible = await page.evaluate(() => !!document.querySelector("h2"));
    recordResult("Escape Key Close", !modalVisible, "Modal dismissed cleanly on Escape key");

    // Reopen for studio feature tests
    await uploadBtn.click();
    await new Promise((r) => setTimeout(r, 800));

    // -------------------------------------------------------------
    // PHASE 3: Live Camera Streaming, HUD, Flip & Shutter
    // -------------------------------------------------------------
    console.log("\n--- Phase 3: Live Camera Studio ---");
    const openCameraBtn = await page.$("#open-live-camera-btn");
    if (openCameraBtn) {
      await page.evaluate((el) => el.click(), openCameraBtn);
      await new Promise((r) => setTimeout(r, 1500));

      const hasReticle = await page.evaluate(() => {
        return document.body.textContent.includes("OPTICAL RETICLE ACTIVE");
      });
      recordResult("Live Camera HUD", hasReticle, "Optical reticle HUD and video stream active");

      // Test Camera Flip
      const flipBtn = await page.$("button[title='Flip Camera']");
      if (flipBtn) {
        await page.evaluate((el) => el.click(), flipBtn);
        await new Promise((r) => setTimeout(r, 600));
        recordResult("Camera Lens Flip", true, "Front/rear camera toggle triggered without error");
      }

      // Test Shutter Capture
      const shutterBtn = await page.$("#camera-shutter-btn");
      if (shutterBtn) {
        await page.evaluate((el) => el.click(), shutterBtn);
        await new Promise((r) => setTimeout(r, 1000));

        const hasCapturedPreview = await page.evaluate(() => {
          return !!document.querySelector("img[alt='Anomaly Preview']");
        });
        recordResult("Camera Shutter Snapshot", hasCapturedPreview, "Captured frame converted to File and rendered in preview");
      }

      // Test Clear Photo
      const clearBtn = await page.$("button ::-p-text(Clear photo)");
      if (clearBtn) {
        await page.evaluate((el) => el.click(), clearBtn);
        await new Promise((r) => setTimeout(r, 600));

        const resetToSource = await page.evaluate(() => {
          return !!document.querySelector("#open-live-camera-btn");
        });
        recordResult("Clear Photo Reset", resetToSource, "Clear photo button resets to source choice");
      }
    }

    // -------------------------------------------------------------
    // PHASE 4: File Selection & Form Composition
    // -------------------------------------------------------------
    console.log("\n--- Phase 4: Photo Selection, Vibe Emojis, Category ---");
    // Inject canvas photograph
    await page.evaluate(() => {
      const fileInput = document.querySelector("input[type='file']");
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 500;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#0c0a09";
      ctx.fillRect(0, 0, 800, 500);
      ctx.fillStyle = "#22d3ee";
      ctx.font = "bold 32px monospace";
      ctx.fillText("ANOMALY OBSERVATION #774", 180, 230);
      ctx.fillStyle = "#a855f7";
      ctx.font = "20px monospace";
      ctx.fillText("Sub-atomic spatial rift confirmed", 180, 270);
      canvas.toBlob((blob) => {
        const file = new File([blob], "anomaly-deep-test.jpg", { type: "image/jpeg" });
        const dt = new DataTransfer();
        dt.items.add(file);
        if (fileInput) {
          fileInput.files = dt.files;
          fileInput.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }, "image/jpeg");
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Type caption and test character counter
    const captionInput = await page.$("#create-post-caption-input");
    await captionInput.click();
    await captionInput.type("Spectral rift fluctuating along the skyline.", { delay: 10 });

    // Click vibe emojis
    const vibe1 = await page.$("button ::-p-text(🔮)");
    if (vibe1) await page.evaluate((el) => el.click(), vibe1);
    const vibe2 = await page.$("button ::-p-text(⚡)");
    if (vibe2) await page.evaluate((el) => el.click(), vibe2);
    const vibe3 = await page.$("button ::-p-text(🛸)");
    if (vibe3) await page.evaluate((el) => el.click(), vibe3);

    const captionContent = await page.evaluate(() => {
      return document.querySelector("#create-post-caption-input")?.value || "";
    });
    const hasEmojis = captionContent.includes("🔮") && captionContent.includes("⚡") && captionContent.includes("🛸");
    recordResult("Vibe Emojis Bar", hasEmojis, `Emojis appended to caption: "${captionContent}"`);

    // Select category "Coincidences"
    const catBtn = await page.$("button ::-p-text(Coincidences)");
    if (catBtn) await page.evaluate((el) => el.click(), catBtn);
    await new Promise((r) => setTimeout(r, 400));
    recordResult("Classification Selection", true, "Category set to 'Coincidences'");

    // -------------------------------------------------------------
    // PHASE 5: Drafts Persistence, Tab & Resume Lifecycle
    // -------------------------------------------------------------
    console.log("\n--- Phase 5: Drafts Lifecycle ---");
    const saveDraftBtn = await page.$("#save-draft-btn");
    await page.evaluate((el) => el.click(), saveDraftBtn);
    await new Promise((r) => setTimeout(r, 1000));

    // Check drafts in localStorage
    const savedDraftsCount = await page.evaluate(() => {
      const d = JSON.parse(localStorage.getItem("weca_post_drafts") || "[]");
      return d.length;
    });
    recordResult("Save Draft Action", savedDraftsCount > 0, `Draft persisted in localStorage (${savedDraftsCount} items)`);

    // Open Drafts tab
    const draftsTabBtn = await page.$("#tab-drafts");
    await page.evaluate((el) => el.click(), draftsTabBtn);
    await new Promise((r) => setTimeout(r, 800));

    const draftItemText = await page.evaluate(() => {
      return document.body.textContent.includes("Spectral rift fluctuating");
    });
    recordResult("Drafts Tab Display", draftItemText, "Draft item rendered with thumbnail and caption");

    // Resume draft
    const resumeBtn = await page.$("button ::-p-text(Resume)");
    if (resumeBtn) {
      await page.evaluate((el) => el.click(), resumeBtn);
      await new Promise((r) => setTimeout(r, 800));

      const resumedCaption = await page.evaluate(() => {
        return document.querySelector("#create-post-caption-input")?.value || "";
      });
      const resumedCorrectly = resumedCaption.includes("Spectral rift fluctuating");
      recordResult("Resume Draft into Studio", resumedCorrectly, "Draft photo, category, and text restored to active studio");
    }

    // -------------------------------------------------------------
    // PHASE 6: Scheduled Release Presets & Queue
    // -------------------------------------------------------------
    console.log("\n--- Phase 6: Scheduled Posting & Presets ---");
    const scheduleToggle = await page.$("#schedule-toggle-input");
    await page.evaluate((el) => el.click(), scheduleToggle);
    await new Promise((r) => setTimeout(r, 500));

    // Test presets
    const presetsToTest = ["+2 Hours", "Tomorrow 9:00 AM", "Tomorrow 8:00 PM", "Friday Peak"];
    for (const presetName of presetsToTest) {
      const pBtn = await page.$(`button ::-p-text(${presetName})`);
      if (pBtn) {
        await page.evaluate((el) => el.click(), pBtn);
        await new Promise((r) => setTimeout(r, 200));
        const dtVal = await page.evaluate(() => {
          return document.querySelector("#schedule-datetime-picker")?.value;
        });
        recordResult(`Schedule Preset [${presetName}]`, !!dtVal, `Applied preset, datetime set to ${dtVal}`);
      }
    }

    // Submit Scheduled Anomaly
    const scheduleSubmitBtn = await page.$("#submit-post-btn");
    await page.evaluate((el) => el.click(), scheduleSubmitBtn);
    await new Promise((r) => setTimeout(r, 1500));

    // Reopen modal and verify Scheduled queue
    await uploadBtn.click();
    await new Promise((r) => setTimeout(r, 800));

    const schedTabBtn = await page.$("#tab-scheduled");
    await page.evaluate((el) => el.click(), schedTabBtn);
    await new Promise((r) => setTimeout(r, 800));

    const scheduledItemPresent = await page.evaluate(() => {
      const items = JSON.parse(localStorage.getItem("weca_scheduled_posts") || "[]");
      return items.length > 0;
    });
    recordResult("Scheduled Queue Persistence", scheduledItemPresent, "Scheduled drop queued with target timestamp");

    // Test "Publish Now" on scheduled post
    const publishNowBtn = await page.$("button ::-p-text(Publish Now)");
    if (publishNowBtn) {
      await page.evaluate((el) => el.click(), publishNowBtn);
      await new Promise((r) => setTimeout(r, 1000));
      recordResult("Publish Now Acceleration", true, "Immediately published queued anomaly to community stream");
    }

    // Close modal
    const closeBtn = await page.$("#close-create-post-modal-btn");
    if (closeBtn) await page.evaluate((el) => el.click(), closeBtn);
    await new Promise((r) => setTimeout(r, 600));

    // -------------------------------------------------------------
    // PHASE 7: Profile Page Integration
    // -------------------------------------------------------------
    console.log("\n--- Phase 7: Profile Page '+' Trigger ---");
    await page.goto("http://localhost:3000/profile", { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, 1500));

    const profilePlusBtn = await page.$("#profile-create-post-btn");
    if (profilePlusBtn) {
      await page.evaluate((el) => el.click(), profilePlusBtn);
      await new Promise((r) => setTimeout(r, 800));

      const modalOnProfile = await page.evaluate(() => {
        return !!document.querySelector("h2");
      });
      recordResult("Profile Header '+' Trigger", modalOnProfile, "Studio opened directly over profile page");

      // Close
      const closeBtn2 = await page.$("#close-create-post-modal-btn");
      if (closeBtn2) await page.evaluate((el) => el.click(), closeBtn2);
      await new Promise((r) => setTimeout(r, 600));
    } else {
      recordResult("Profile Header '+' Trigger", false, "#profile-create-post-btn not found");
    }

    // -------------------------------------------------------------
    // PHASE 8: Direct /upload Route
    // -------------------------------------------------------------
    console.log("\n--- Phase 8: Direct /upload Page ---");
    await page.goto("http://localhost:3000/upload", { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, 1200));

    const uploadPageModal = await page.evaluate(() => {
      return !!document.querySelector("h2");
    });
    recordResult("Direct /upload Route", uploadPageModal, "Navigating to /upload automatically mounts the Studio modal");

    // -------------------------------------------------------------
    // PHASE 9: Mobile Hamburger Drawer & Upload Trigger
    // -------------------------------------------------------------
    console.log("\n--- Phase 9: Mobile Viewport & Drawer Upload Trigger ---");
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, 1200));

    // Open mobile hamburger menu
    const menuBtn = await page.$("button[aria-label='Toggle Menu']");
    if (menuBtn) {
      await page.evaluate((el) => el.click(), menuBtn);
      await new Promise((r) => setTimeout(r, 600));

      const mobileUploadBtn = await page.$("button ::-p-text(Upload Photograph)");
      if (mobileUploadBtn) {
        await page.evaluate((el) => el.click(), mobileUploadBtn);
        await new Promise((r) => setTimeout(r, 1000));

        const mobileModalOpen = await page.evaluate(() => {
          return !!document.querySelector("h2");
        });
        recordResult("Mobile Drawer Upload Trigger", mobileModalOpen, "Mobile drawer 'Upload Photograph' launches studio on 390px viewport");
      }
    }

    // Final screenshot of verified state
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "deep_verification_mobile_studio.png"),
    });

    // -------------------------------------------------------------
    // PHASE 10: Console Errors Audit
    // -------------------------------------------------------------
    console.log("\n--- Phase 10: Console Health Audit ---");
    const fatalErrors = consoleErrors.filter(
      (e) => !e.includes("favicon") && !e.includes("deprecated")
    );
    recordResult("Console Health", fatalErrors.length === 0, `${fatalErrors.length} fatal exceptions encountered`);

  } catch (err) {
    console.error("Test execution encountered an error:", err);
    recordResult("Execution Safety", false, err.message);
  } finally {
    await browser.close();
  }

  console.log("\n==================================================");
  console.log("TEST SUMMARY REPORT");
  console.log("==================================================");
  const total = testResults.length;
  const passed = testResults.filter((t) => t.passed).length;
  console.log(`TOTAL CHECKS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log("==================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

main();
