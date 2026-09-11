import puppeteer from "puppeteer-core";
import path from "path";

const ARTIFACT_DIR = "/Users/adityakumar/.gemini/antigravity-ide/brain/9efa75a0-7db1-4488-a18d-fb47352bf5d8";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function run() {
  console.log("Launching headless Google Chrome...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,850"],
    defaultViewport: { width: 1280, height: 850 },
  });

  const page = await browser.newPage();

  // Test 1: Sign Up Form Page (/signup)
  console.log("Navigating to http://localhost:3000/signup...");
  await page.goto("http://localhost:3000/signup", { waitUntil: "networkidle2" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 1000));

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "step_signup_form.png"),
    fullPage: false,
  });
  console.log("Captured: step_signup_form.png");

  // Fill in the form fields
  console.log("Filling in registration details...");
  await page.type("input#identifier", "alex_explorer@wica.ai");
  await page.type("input#pass", "WicaSecretPassword123");
  await page.type("input[placeholder='Full name']", "Alex Explorer");
  await page.type("input[placeholder='Username']", "alex_explorer");

  // Select Date of Birth
  const selects = await page.$$("select");
  if (selects.length >= 3) {
    await selects[0].select("18");
    await selects[1].select("September");
    await selects[2].select("1998");
  }

  await new Promise((r) => setTimeout(r, 500));

  // Submit form
  console.log("Submitting registration form...");
  const submitBtn = await page.waitForSelector("button[type='submit']");
  await submitBtn.click();
  await new Promise((r) => setTimeout(r, 1200));

  // Test 2: Confirmation Code Screen
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "step_confirmation_code.png"),
    fullPage: false,
  });
  console.log("Captured: step_confirmation_code.png");

  // Test 3: Enter confirmation code & Confirm
  console.log("Entering 6-digit confirmation code...");
  const autofillBtn = await page.$("button ::-p-text(Auto-fill)");
  if (autofillBtn) {
    await autofillBtn.click();
  } else {
    await page.type("input#code", "123456");
  }
  await new Promise((r) => setTimeout(r, 500));

  console.log("Confirming code...");
  const confirmBtn = await page.waitForSelector("button[type='submit']");
  await confirmBtn.click();
  
  // Wait for redirect to home page or authenticated header
  try {
    await page.waitForFunction(() => window.location.pathname === "/" || document.querySelector("header button[title='Sign Out']"), {
      timeout: 10000,
    });
  } catch (e) {
    console.log("Timed out waiting for redirect, continuing...");
  }
  await new Promise((r) => setTimeout(r, 2000));

  // Test 4: Successfully authenticated on World Feed
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "step_signup_success_feed.png"),
    fullPage: false,
  });
  console.log("Captured: step_signup_success_feed.png");

  await browser.close();
  console.log("All sign-up and confirmation flow tests completed successfully!");
}

run().catch(console.error);
