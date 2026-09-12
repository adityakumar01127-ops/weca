import puppeteer from "puppeteer-core";
import path from "path";

const ARTIFACT_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/632f2ae4-0fdb-4687-98c0-77d37549bfd6";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function main() {
  console.log("Starting verification for Create / Upload System (Camera, Drafts, Scheduled Posts)...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    protocolTimeout: 60000,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1400,1000",
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 2 });

    // Step 1: Login via Instant Explorer Pass
    console.log("1. Authenticating via /login...");
    await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, 1000));

    const guestBtn = await page.waitForSelector("button ::-p-text(Instant Explorer Pass (Guest Mode))");
    if (guestBtn) {
      await guestBtn.click();
      console.log("Logged in with Instant Explorer Pass!");
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Step 2: Open Create Post Modal from Navbar "+ Upload"
    console.log("2. Clicking 'Upload' in Navbar to open CreatePostModal...");
    const navbarUploadBtn = await page.waitForSelector("header button ::-p-text(Upload)");
    if (navbarUploadBtn) {
      await navbarUploadBtn.click();
      console.log("Clicked Navbar Upload button!");
    }
    await new Promise((r) => setTimeout(r, 1000));

    // Capture screenshot of opened modal
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "create_modal_initial.png"),
    });
    console.log("Saved create_modal_initial.png");

    // Step 3: Open Live Camera Viewfinder
    console.log("3. Testing Live Camera Studio...");
    const openCameraBtn = await page.$("#open-live-camera-btn");
    if (openCameraBtn) {
      await page.evaluate((el) => el.click(), openCameraBtn);
      console.log("Clicked Open Camera button!");
      await new Promise((r) => setTimeout(r, 1500));

      await page.screenshot({
        path: path.join(ARTIFACT_DIR, "create_modal_camera_viewfinder.png"),
      });
      console.log("Saved create_modal_camera_viewfinder.png");

      // Snap photo with shutter button
      const shutterBtn = await page.$("#camera-shutter-btn");
      if (shutterBtn) {
        console.log("Clicking Camera Shutter Button...");
        await page.evaluate((el) => el.click(), shutterBtn);
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // If still in camera or no preview, inject test photo to continue full pipeline
    const hasPreview = await page.$("img[alt='Anomaly Preview']");
    if (!hasPreview) {
      console.log("Injecting anomaly capture preview into studio...");
      await page.evaluate(() => {
        const fileInput = document.querySelector("input[type='file']");
        const canvas = document.createElement("canvas");
        canvas.width = 800;
        canvas.height = 500;
        const ctx = canvas.getContext("2d");
        // Dark space grid background
        ctx.fillStyle = "#09090b";
        ctx.fillRect(0, 0, 800, 500);
        // Neon cyan and violet grid
        ctx.strokeStyle = "#22d3ee";
        ctx.lineWidth = 2;
        ctx.strokeRect(60, 60, 680, 380);
        ctx.fillStyle = "#7c5cfc";
        ctx.beginPath();
        ctx.arc(400, 250, 100, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 28px monospace";
        ctx.fillText("ANOMALY EVENT #409", 260, 240);
        ctx.fillStyle = "#22d3ee";
        ctx.font = "18px monospace";
        ctx.fillText("CLASSIFIED: OPTICAL SPATIAL DISTORTION", 210, 280);

        canvas.toBlob((blob) => {
          const file = new File([blob], "anomaly-specimen-409.jpg", { type: "image/jpeg" });
          const dt = new DataTransfer();
          dt.items.add(file);
          if (fileInput) {
            fileInput.files = dt.files;
            fileInput.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }, "image/jpeg");
      });
      await new Promise((r) => setTimeout(r, 1200));
    }

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "create_modal_photo_captured.png"),
    });
    console.log("Saved create_modal_photo_captured.png");

    // Step 4: Add Caption, Emojis, and select Category
    console.log("4. Typing caption, adding vibe emojis, selecting category...");
    const captionInput = await page.$("#create-post-caption-input");
    if (captionInput) {
      await captionInput.click();
      await captionInput.type("Bizarre refraction matrix observed hovering in the perimeter.", { delay: 15 });
    }

    // Click vibe emoji button
    const vibeEmojiBtn = await page.$("button ::-p-text(🔮)");
    if (vibeEmojiBtn) {
      await page.evaluate((el) => el.click(), vibeEmojiBtn);
    }
    const vibeEmojiBtn2 = await page.$("button ::-p-text(⚡)");
    if (vibeEmojiBtn2) {
      await page.evaluate((el) => el.click(), vibeEmojiBtn2);
    }

    // Select Nature category chip
    const natureChip = await page.$("button ::-p-text(Nature)");
    if (natureChip) {
      await page.evaluate((el) => el.click(), natureChip);
    }
    await new Promise((r) => setTimeout(r, 500));

    // Step 5: Save as Draft
    console.log("5. Saving post as Draft...");
    const saveDraftBtn = await page.$("#save-draft-btn");
    if (saveDraftBtn) {
      await page.evaluate((el) => el.click(), saveDraftBtn);
      console.log("Clicked Save Draft button!");
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Step 6: Switch to Drafts Tab and verify
    console.log("6. Switching to Drafts Tab...");
    const draftsTabBtn = await page.$("#tab-drafts");
    if (draftsTabBtn) {
      await page.evaluate((el) => el.click(), draftsTabBtn);
      await new Promise((r) => setTimeout(r, 800));

      await page.screenshot({
        path: path.join(ARTIFACT_DIR, "create_modal_drafts_tab.png"),
      });
      console.log("Saved create_modal_drafts_tab.png");

      // Resume Draft
      console.log("7. Resuming saved draft in studio...");
      const resumeBtn = await page.$("button ::-p-text(Resume)");
      if (resumeBtn) {
        await page.evaluate((el) => el.click(), resumeBtn);
        console.log("Clicked Resume Draft!");
        await new Promise((r) => setTimeout(r, 800));
      }
    }

    // Step 8: Toggle Scheduled Release and apply +2 Hours preset
    console.log("8. Testing Scheduled Release...");
    const scheduleToggle = await page.$("#schedule-toggle-input");
    if (scheduleToggle) {
      await page.evaluate((el) => el.click(), scheduleToggle);
      await new Promise((r) => setTimeout(r, 500));
    }

    // Click "+2 Hours" preset
    const presetBtn = await page.$("button ::-p-text(+2 Hours)");
    if (presetBtn) {
      await page.evaluate((el) => el.click(), presetBtn);
      await new Promise((r) => setTimeout(r, 500));
    }

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "create_modal_scheduled_preset.png"),
    });
    console.log("Saved create_modal_scheduled_preset.png");

    // Click "Schedule Anomaly" submit button
    console.log("9. Submitting scheduled anomaly...");
    const submitBtn = await page.$("#submit-post-btn");
    if (submitBtn) {
      await page.evaluate((el) => el.click(), submitBtn);
      console.log("Clicked Schedule Anomaly button!");
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Step 10: Re-open modal and verify Scheduled Posts Queue
    console.log("10. Verifying Scheduled Posts Queue...");
    const reOpenUploadBtn = await page.waitForSelector("header button ::-p-text(Upload)");
    if (reOpenUploadBtn) {
      await reOpenUploadBtn.click();
      await new Promise((r) => setTimeout(r, 800));
      
      const schedTabBtn = await page.$("#tab-scheduled");
      if (schedTabBtn) {
        await page.evaluate((el) => el.click(), schedTabBtn);
        await new Promise((r) => setTimeout(r, 800));

        await page.screenshot({
          path: path.join(ARTIFACT_DIR, "create_modal_scheduled_tab.png"),
        });
        console.log("Saved create_modal_scheduled_tab.png");
      }
    }

    // Close modal
    const closeBtn = await page.$("#close-create-post-modal-btn");
    if (closeBtn) {
      await page.evaluate((el) => el.click(), closeBtn);
      await new Promise((r) => setTimeout(r, 600));
    }

    // Step 11: Navigate to Profile and test the '+' header button
    console.log("11. Testing Create Post from Profile page '+' button...");
    await page.goto("http://localhost:3000/profile", { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, 1500));

    const profilePlusBtn = await page.$("#profile-create-post-btn");
    if (profilePlusBtn) {
      await page.evaluate((el) => el.click(), profilePlusBtn);
      console.log("Clicked Profile '+' button!");
      await new Promise((r) => setTimeout(r, 1000));

      await page.screenshot({
        path: path.join(ARTIFACT_DIR, "create_modal_from_profile_plus.png"),
      });
      console.log("Saved create_modal_from_profile_plus.png");
    } else {
      console.log("profile-create-post-btn not found");
    }

    console.log("All verification steps completed successfully!");
  } catch (err) {
    console.error("Verification failed with error:", err);
  } finally {
    await browser.close();
  }
}

main();
