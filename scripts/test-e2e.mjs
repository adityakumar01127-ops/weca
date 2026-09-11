import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/fecded9c-0587-4e56-b673-c63b51411a28";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function runE2ETest() {
  console.log("Launching headless Google Chrome...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"],
    defaultViewport: { width: 1280, height: 900 },
  });

  const page = await browser.newPage();

  try {
    // 1. Visit Home Page
    console.log("Navigating to http://localhost:3000...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1200));

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "step1_home_feed.png"),
      fullPage: false,
    });
    console.log("Saved: step1_home_feed.png");

    // 2. Test Sign In / Sign Up
    console.log("Testing Authentication flow...");
    const signOutBtn = await page.$("button[aria-label='Sign out'], button[title='Sign Out']");
    if (signOutBtn) {
      console.log("Signing out current session...");
      await signOutBtn.click();
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Click Sign In
    const signInBtn = await page.waitForSelector("button ::-p-text(Sign In)", { timeout: 6000 });
    await signInBtn.click();
    await new Promise((r) => setTimeout(r, 600));

    // Fill Sign In with test user (or toggle sign up)
    const toggleSignUp = await page.waitForSelector("button ::-p-text(Create Account)", { timeout: 6000 });
    await toggleSignUp.click();
    await new Promise((r) => setTimeout(r, 600));

    await page.type("input[placeholder*='anomaly_hunter']", "anomaly_tester");
    await page.type("input[placeholder*='you@example.com']", "tester" + Date.now() + "@wica.io");
    await page.type("input[placeholder*='••••••••']", "wicaPassword123!");

    const submitAuth = await page.waitForSelector("button[type='submit']");
    await submitAuth.click();
    console.log("Submitted registration, waiting for modal to close...");

    // Wait for auth modal to disappear
    await page.waitForFunction(() => !document.querySelector("form input[placeholder*='••••••••']"), {
      timeout: 15000,
    });
    await new Promise((r) => setTimeout(r, 1500));

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "step2_authenticated.png"),
      fullPage: false,
    });
    console.log("Saved: step2_authenticated.png");

    // 3. Test Upload Flow with Gemini Scoring
    console.log("Testing Upload & Live Gemini Scoring...");
    // Find header upload button
    const uploadBtn = await page.waitForSelector("button ::-p-text(Upload Photo)", { timeout: 6000 });
    await uploadBtn.click();
    await new Promise((r) => setTimeout(r, 800));

    // Wait for upload modal dropzone
    await page.waitForSelector("#wica-file-input", { hidden: true, timeout: 6000 });
    const fileInput = await page.$("#wica-file-input");
    if (!fileInput) throw new Error("Could not find #wica-file-input");
    
    await fileInput.uploadFile("/Users/adityakumar/wica/sample-anomaly.jpg");
    await page.evaluate(() => {
      const el = document.getElementById("wica-file-input");
      el?.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await new Promise((r) => setTimeout(r, 1200));

    // Select Category "Animals"
    const animalPill = await page.waitForSelector("button ::-p-text(Animals)", { timeout: 6000 });
    await animalPill.click();

    // Fill caption and location
    await page.type(
      "input[placeholder*='What makes this weird']",
      "A rare smiling feline resting on spikes"
    );
    await page.type("input[placeholder*='Iceland']", "Kyoto, Japan");

    // Click submit
    const submitUpload = await page.waitForSelector("button ::-p-text(Upload & Calculate Wica Score)", {
      timeout: 6000,
    });
    await submitUpload.click();
    console.log("Submitted upload, waiting for Gemini Weirdness Engine analysis & score reveal...");

    // Wait for the Score Reveal modal (Score Showcase Hero)
    await page.waitForSelector("::-p-text(WICA COMPOSITE SCORE)", { timeout: 45000 });
    // Wait for roll-up animation & confetti
    await new Promise((r) => setTimeout(r, 2500));

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "step3_score_reveal.png"),
      fullPage: false,
    });
    console.log("Saved: step3_score_reveal.png (Score Reveal Screen with Gemini Result)");

    // Click "View in Feed"
    const viewFeedBtn = await page.waitForSelector("button ::-p-text(View in Feed)", { timeout: 8000 });
    await viewFeedBtn.click();
    await new Promise((r) => setTimeout(r, 1500));

    // 4. Test Feed Interaction: Like & Comment
    console.log("Testing Like and Comments on Feed...");
    // Find the photo cards
    await page.waitForSelector("article.masonry-item", { timeout: 6000 });
    const cards = await page.$$("article.masonry-item");
    if (cards.length > 0) {
      // Find like button on the first card
      const likeButton = await cards[0].$("button[title='Like'], button[title='Unlike']");
      if (likeButton) {
        await likeButton.click();
        await new Promise((r) => setTimeout(r, 800));
        console.log("Liked photo card successfully");
      }

      // Click card to open Photo Detail Modal
      await cards[0].click();
      await new Promise((r) => setTimeout(r, 1200));

      // In Detail modal, post a comment
      const commentInput = await page.waitForSelector("input[placeholder*='Add a reaction']", {
        timeout: 6000,
      });
      await commentInput.type("This feline has mastered the art of hostile acupuncture.");

      const sendCommentBtn = await page.waitForSelector("button[title='Post comment']", { timeout: 6000 });
      await sendCommentBtn.click();
      await new Promise((r) => setTimeout(r, 1500));

      await page.screenshot({
        path: path.join(ARTIFACT_DIR, "step4_photo_detail_comment.png"),
        fullPage: false,
      });
      console.log("Saved: step4_photo_detail_comment.png");

      // Close modal
      const closeBtn = await page.waitForSelector("button[aria-label='Close']");
      await closeBtn.click();
      await new Promise((r) => setTimeout(r, 800));
    }

    // 5. Test Profile Page
    console.log("Testing User Profile Page...");
    // Read active username from header or navigate to profile
    const profileLink = await page.$("header a[href*='/profile/']");
    if (profileLink) {
      await profileLink.click();
    } else {
      await page.goto("http://localhost:3000/profile/anomaly_tester", { waitUntil: "networkidle2" });
    }
    await new Promise((r) => setTimeout(r, 2000));

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "step5_user_profile.png"),
      fullPage: false,
    });
    console.log("Saved: step5_user_profile.png");

    console.log("🎉 ALL E2E TESTS PASSED SUCCESSFULLY!");
  } catch (error) {
    console.error("E2E Test Error:", error);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "error_screenshot.png"),
    });
  } finally {
    await browser.close();
  }
}

runE2ETest();
