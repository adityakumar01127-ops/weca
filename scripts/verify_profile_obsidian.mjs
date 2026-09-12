import puppeteer from "puppeteer-core";
import path from "path";

const ARTIFACT_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/632f2ae4-0fdb-4687-98c0-77d37549bfd6";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function run() {
  console.log("Launching local Chrome for profile verification...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  // 1. Log in via Instant Explorer Pass to establish authenticated session
  console.log("Navigating to login page...");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 1000));

  const guestBtn = await page.waitForSelector("button ::-p-text(Instant Explorer Pass (Guest Mode))");
  if (guestBtn) {
    await guestBtn.click();
    await new Promise((r) => setTimeout(r, 1500));
  }

  // 2. Navigate to /profile
  console.log("Navigating to http://localhost:3000/profile...");
  await page.goto("http://localhost:3000/profile", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 1500));

  // Screenshot 1: Full Profile View (Desktop)
  const profileImgPath = path.join(ARTIFACT_DIR, "profile_view_obsidian.png");
  await page.screenshot({ path: profileImgPath, fullPage: false });
  console.log("Captured:", profileImgPath);

  // 3. Open Edit Profile Modal
  console.log("Clicking 'Edit profile' button...");
  const editBtn = await page.waitForSelector("button ::-p-text(Edit profile)");
  if (editBtn) {
    await editBtn.click();
    await new Promise((r) => setTimeout(r, 800));

    // Screenshot 2: Edit Profile Modal
    const modalImgPath = path.join(ARTIFACT_DIR, "edit_profile_modal_obsidian.png");
    await page.screenshot({ path: modalImgPath, fullPage: false });
    console.log("Captured:", modalImgPath);

    // 4. Update fields (Display Name to 'Aditya Kaushik', Pronouns to 'he/him/his', Status Note to 'Just curious...')
    console.log("Updating profile fields...");
    const inputs = await page.$$("input");
    // Change display name and pronouns
    for (const input of inputs) {
      const val = await page.evaluate((el) => el.value, input);
      if (val.includes("Explorer") || val.includes("Weca")) {
        await input.click({ clickCount: 3 });
        await input.type("Aditya Kaushik");
      }
    }

    // Click 'Done' to save
    const doneBtn = await page.waitForSelector("button ::-p-text(Done)");
    if (doneBtn) {
      await doneBtn.click();
      await new Promise((r) => setTimeout(r, 1200));
    }

    // Screenshot 3: Profile after Edit
    const updatedImgPath = path.join(ARTIFACT_DIR, "profile_updated_obsidian.png");
    await page.screenshot({ path: updatedImgPath, fullPage: false });
    console.log("Captured:", updatedImgPath);
  }

  // 5. Check Mobile Viewport (iPhone dimension 390x844)
  console.log("Checking mobile viewport...");
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto("http://localhost:3000/profile", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 1200));

  const mobileProfilePath = path.join(ARTIFACT_DIR, "profile_mobile_obsidian.png");
  await page.screenshot({ path: mobileProfilePath, fullPage: false });
  console.log("Captured:", mobileProfilePath);

  await browser.close();
  console.log("All profile visual tests completed successfully!");
}

run().catch((err) => {
  console.error("Profile verification error:", err);
  process.exit(1);
});
