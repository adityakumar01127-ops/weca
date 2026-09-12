import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Weca Logo Design Iterations</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    body {
      background-color: #09090b;
      color: #fafafa;
      font-family: 'Plus Jakarta Sans', sans-serif;
      margin: 0;
      padding: 40px;
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 24px;
      color: #e4e4e7;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-bottom: 40px;
    }
    .card {
      background: #121215;
      border: 1px solid #27272a;
      border-radius: 16px;
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .card-title {
      font-size: 13px;
      font-family: 'JetBrains Mono', monospace;
      color: #a1a1aa;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .demo-row {
      display: flex;
      align-items: center;
      gap: 18px;
      padding: 12px 0;
      border-bottom: 1px solid #1f1f23;
    }
    .logo-container {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      user-select: none;
      transition: transform 0.2s;
    }
    .logo-container:hover {
      transform: scale(1.02);
    }
    .wordmark {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 900;
      letter-spacing: -0.04em;
      color: #ffffff;
      line-height: 1;
      display: inline-flex;
      align-items: baseline;
    }
    .dot {
      display: inline-block;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #22d3ee;
      box-shadow: 0 0 10px #22d3ee;
      margin-left: 1px;
    }
  </style>
</head>
<body>
  <h1>Weca Brand Identity System & Logo Candidates</h1>

  <div class="grid">
    <!-- CANDIDATE 1: Precision Curved Optical Iris & Singularity -->
    <div class="card">
      <div class="card-title">Candidate A: Curved Iris & Singularity Core</div>
      <div class="demo-row">
        <!-- 40px -->
        <div class="logo-container">
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="blade-v" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#8B5CF6"/>
                <stop offset="100%" stop-color="#6366F1"/>
              </linearGradient>
              <linearGradient id="blade-c" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#22D3EE"/>
                <stop offset="100%" stop-color="#0284C7"/>
              </linearGradient>
              <linearGradient id="blade-r" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FF385C"/>
                <stop offset="100%" stop-color="#E11D48"/>
              </linearGradient>
              <radialGradient id="singularity-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#FFFFFF"/>
                <stop offset="40%" stop-color="#22D3EE" stop-opacity="0.9"/>
                <stop offset="100%" stop-color="#09090B" stop-opacity="0"/>
              </radialGradient>
              <filter id="core-bloom" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="1" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
              </filter>
            </defs>
            
            <!-- Outer calibrated optical chassis ring -->
            <circle cx="24" cy="24" r="22" stroke="#27272A" stroke-width="1.5"/>
            <!-- Calibration Index Ticks at 0, 120, 240 deg -->
            <line x1="24" y1="2" x2="24" y2="4.5" stroke="#71717A" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="43.1" y1="35" x2="40.9" y2="33.7" stroke="#71717A" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="4.9" y1="35" x2="7.1" y2="33.7" stroke="#71717A" stroke-width="1.5" stroke-linecap="round"/>
            
            <!-- Three Interlocking Optical Aperture Blades -->
            <!-- Blade 1: Electric Violet (Top to Right) -->
            <path d="M 24 5.5 A 18.5 18.5 0 0 1 40 14.8 C 32 17.5, 26 21.5, 23 24.5 C 23.5 20, 23.8 11.5, 24 5.5 Z" fill="url(#blade-v)"/>
            
            <!-- Blade 2: Hot Crimson/Magenta (Right to Bottom-Left) -->
            <path d="M 40 14.8 A 18.5 18.5 0 0 1 24 42.5 C 23.5 35, 20 29.5, 16 26.5 C 21 24, 31 18.5, 40 14.8 Z" fill="url(#blade-r)"/>
            
            <!-- Blade 3: Neon Cyan (Bottom-Left to Top) -->
            <path d="M 24 42.5 A 18.5 18.5 0 0 1 8 14.8 C 16 17.5, 21.5 21, 24.5 24 C 20.5 28.5, 22.5 36, 24 42.5 Z" fill="url(#blade-c)"/>
            
            <!-- Dark Iris Core -->
            <circle cx="24" cy="24" r="5" fill="#09090B" stroke="#27272A" stroke-width="1"/>
            
            <!-- Optical Singularity (Center Star Flare) -->
            <circle cx="24" cy="24" r="3.5" fill="url(#singularity-glow)"/>
            <circle cx="24" cy="24" r="1.5" fill="#FFFFFF" filter="url(#core-bloom)"/>
            <line x1="24" y1="19.5" x2="24" y2="28.5" stroke="#FFFFFF" stroke-width="0.75" stroke-linecap="round" opacity="0.95"/>
            <line x1="19.5" y1="24" x2="28.5" y2="24" stroke="#FFFFFF" stroke-width="0.75" stroke-linecap="round" opacity="0.95"/>
          </svg>
          <span class="wordmark" style="font-size: 24px;">weca<span class="dot"></span></span>
        </div>
      </div>
      <div class="demo-row">
        <!-- 28px in Navbar -->
        <span style="font-size: 11px; font-family: monospace; color: #71717a; width: 60px;">Navbar (28px):</span>
        <div class="logo-container">
          <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="22" stroke="#27272A" stroke-width="1.5"/>
            <path d="M 24 5.5 A 18.5 18.5 0 0 1 40 14.8 C 32 17.5, 26 21.5, 23 24.5 C 23.5 20, 23.8 11.5, 24 5.5 Z" fill="url(#blade-v)"/>
            <path d="M 40 14.8 A 18.5 18.5 0 0 1 24 42.5 C 23.5 35, 20 29.5, 16 26.5 C 21 24, 31 18.5, 40 14.8 Z" fill="url(#blade-r)"/>
            <path d="M 24 42.5 A 18.5 18.5 0 0 1 8 14.8 C 16 17.5, 21.5 21, 24.5 24 C 20.5 28.5, 22.5 36, 24 42.5 Z" fill="url(#blade-c)"/>
            <circle cx="24" cy="24" r="4.8" fill="#09090B" stroke="#22D3EE" stroke-width="1"/>
            <circle cx="24" cy="24" r="1.8" fill="#FFFFFF"/>
          </svg>
          <span class="wordmark" style="font-size: 19px;">weca<span class="dot" style="width: 4px; height: 4px;"></span></span>
        </div>
      </div>
    </div>

    <!-- CANDIDATE 2: Dynamic Interlocking Vortex Blade (Hexagon Shutter) -->
    <div class="card">
      <div class="card-title">Candidate B: Hex-Prism Chromatic Shutter</div>
      <div class="demo-row">
        <div class="logo-container">
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="hex-v" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#A855F7"/>
                <stop offset="100%" stop-color="#6366F1"/>
              </linearGradient>
              <linearGradient id="hex-c" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#06B6D4"/>
                <stop offset="100%" stop-color="#3B82F6"/>
              </linearGradient>
              <linearGradient id="hex-p" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#FB7185"/>
                <stop offset="100%" stop-color="#E11D48"/>
              </linearGradient>
            </defs>
            <!-- Hexagonal outer calibration ring -->
            <polygon points="24,4 41.3,14 41.3,34 24,44 6.7,34 6.7,14" stroke="#3F3F46" stroke-width="1.5" fill="#121215"/>
            <!-- 3 Dynamic Prismatic Blades -->
            <path d="M 24 5 L 40.5 14.5 L 30 24 L 20 18 Z" fill="url(#hex-v)" opacity="0.95"/>
            <path d="M 40.5 15 L 40.5 33.5 L 24 30 L 25 19 Z" fill="url(#hex-p)" opacity="0.95"/>
            <path d="M 40.5 34 L 24 43.5 L 7.5 34 L 18 24 L 24 30 Z" fill="url(#hex-c)" opacity="0.95"/>
            <path d="M 7.5 34 L 7.5 14.5 L 24 5 L 20 18 L 18 24 Z" fill="url(#hex-v)" opacity="0.8"/>
            <!-- Central Aperture Glow -->
            <circle cx="24" cy="24" r="3.5" fill="#09090B" stroke="#FFFFFF" stroke-width="1.2"/>
            <circle cx="24" cy="24" r="1.5" fill="#22D3EE"/>
          </svg>
          <span class="wordmark" style="font-size: 24px;">weca<span class="dot"></span></span>
        </div>
      </div>
      <div class="demo-row">
        <span style="font-size: 11px; font-family: monospace; color: #71717a; width: 60px;">Navbar (28px):</span>
        <div class="logo-container">
          <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="24,4 41.3,14 41.3,34 24,44 6.7,34 6.7,14" stroke="#3F3F46" stroke-width="1.5" fill="#121215"/>
            <path d="M 24 5 L 40.5 14.5 L 30 24 L 20 18 Z" fill="#8B5CF6"/>
            <path d="M 40.5 15 L 40.5 33.5 L 24 30 L 25 19 Z" fill="#F43F5E"/>
            <path d="M 40.5 34 L 24 43.5 L 7.5 34 L 18 24 L 24 30 Z" fill="#06B6D4"/>
            <circle cx="24" cy="24" r="3.5" fill="#09090B" stroke="#FFFFFF" stroke-width="1.2"/>
            <circle cx="24" cy="24" r="1.5" fill="#22D3EE"/>
          </svg>
          <span class="wordmark" style="font-size: 19px;">weca<span class="dot" style="width: 4px; height: 4px;"></span></span>
        </div>
      </div>
    </div>

    <!-- CANDIDATE 3: Ultra-Refined Continuous Prismatic Ribbon Iris -->
    <div class="card">
      <div class="card-title">Candidate C: Continuous Prismatic Vortex</div>
      <div class="demo-row">
        <div class="logo-container">
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="prism-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#7C5CFC"/>
                <stop offset="35%" stop-color="#FF4D8D"/>
                <stop offset="70%" stop-color="#22D3EE"/>
                <stop offset="100%" stop-color="#10B981"/>
              </linearGradient>
              <radialGradient id="prism-core" cx="24" cy="24" r="10" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#FFFFFF"/>
                <stop offset="40%" stop-color="#22D3EE" stop-opacity="0.8"/>
                <stop offset="100%" stop-color="#09090B" stop-opacity="0"/>
              </radialGradient>
            </defs>
            <!-- Outer Glow ring -->
            <circle cx="24" cy="24" r="22" stroke="#27272A" stroke-width="1.5"/>
            <!-- 3 Arc aperture sectors -->
            <path d="M 24 4 A 20 20 0 0 1 41.3 14 L 32.5 19 A 10 10 0 0 0 24 14 Z" fill="#7C5CFC"/>
            <path d="M 41.3 14 A 20 20 0 0 1 41.3 34 L 32.5 29 A 10 10 0 0 0 32.5 19 Z" fill="#FF4D8D"/>
            <path d="M 41.3 34 A 20 20 0 0 1 24 44 L 24 34 A 10 10 0 0 0 32.5 29 Z" fill="#EC4899"/>
            <path d="M 24 44 A 20 20 0 0 1 6.7 34 L 15.5 29 A 10 10 0 0 0 24 34 Z" fill="#06B6D4"/>
            <path d="M 6.7 34 A 20 20 0 0 1 6.7 14 L 15.5 19 A 10 10 0 0 0 15.5 29 Z" fill="#22D3EE"/>
            <path d="M 6.7 14 A 20 20 0 0 1 24 4 L 24 14 A 10 10 0 0 0 15.5 19 Z" fill="#6366F1"/>
            
            <!-- Central Aperture Core -->
            <circle cx="24" cy="24" r="8" fill="#09090B"/>
            <circle cx="24" cy="24" r="5" fill="url(#prism-core)"/>
            <circle cx="24" cy="24" r="2" fill="#FFFFFF"/>
          </svg>
          <span class="wordmark" style="font-size: 24px;">weca<span class="dot"></span></span>
        </div>
      </div>
      <div class="demo-row">
        <span style="font-size: 11px; font-family: monospace; color: #71717a; width: 60px;">Navbar (28px):</span>
        <div class="logo-container">
          <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="22" stroke="#3F3F46" stroke-width="1.5"/>
            <path d="M 24 4 A 20 20 0 0 1 41.3 14 L 32.5 19 A 10 10 0 0 0 24 14 Z" fill="#7C5CFC"/>
            <path d="M 41.3 14 A 20 20 0 0 1 41.3 34 L 32.5 29 A 10 10 0 0 0 32.5 19 Z" fill="#FF4D8D"/>
            <path d="M 41.3 34 A 20 20 0 0 1 24 44 L 24 34 A 10 10 0 0 0 32.5 29 Z" fill="#EC4899"/>
            <path d="M 24 44 A 20 20 0 0 1 6.7 34 L 15.5 29 A 10 10 0 0 0 24 34 Z" fill="#06B6D4"/>
            <path d="M 6.7 34 A 20 20 0 0 1 6.7 14 L 15.5 19 A 10 10 0 0 0 15.5 29 Z" fill="#22D3EE"/>
            <path d="M 6.7 14 A 20 20 0 0 1 24 4 L 24 14 A 10 10 0 0 0 15.5 19 Z" fill="#6366F1"/>
            <circle cx="24" cy="24" r="7" fill="#09090B"/>
            <circle cx="24" cy="24" r="2.2" fill="#FFFFFF"/>
          </svg>
          <span class="wordmark" style="font-size: 19px;">weca<span class="dot" style="width: 4px; height: 4px;"></span></span>
        </div>
      </div>
    </div>
  </div>

  <!-- Big Scale Preview (64px) with Full Brand Header Simulation -->
  <div class="card" style="background: #09090b; border: 1px solid #18181b;">
    <div class="card-title">Live Topbar Simulation (Candidate A vs Candidate C)</div>
    
    <div style="background: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; margin-top: 12px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <svg width="30" height="30" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="21.5" stroke="#3F3F46" stroke-width="1.5" stroke-dasharray="3 3"/>
          <path d="M 24 5 A 19 19 0 0 1 40.5 14.5 C 33 17, 27 21, 23.5 24 C 23.8 20, 24 12, 24 5 Z" fill="#8B5CF6"/>
          <path d="M 40.5 14.5 A 19 19 0 0 1 24 43 C 24 35, 20.5 29, 17 26 C 21 24, 32 20, 40.5 14.5 Z" fill="#F43F5E"/>
          <path d="M 24 43 A 19 19 0 0 1 7.5 14.5 C 15 17, 20.5 21, 24 24 C 20 28, 22 36, 24 43 Z" fill="#22D3EE"/>
          <circle cx="24" cy="24" r="4.5" fill="#09090B" stroke="#22D3EE" stroke-width="1.2"/>
          <circle cx="24" cy="24" r="2" fill="#FFFFFF"/>
        </svg>
        <span class="wordmark" style="font-size: 20px;">weca<span class="dot"></span></span>
      </div>
      <div style="display: flex; gap: 16px; font-size: 13px; color: #a1a1aa;">
        <span style="color: #fff; font-weight: 600;">Feed</span>
        <span>Versus</span>
        <span>Leaderboard</span>
        <span>Wallet</span>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <button style="background: #7c5cfc; color: white; border: none; padding: 6px 14px; border-radius: 8px; font-weight: 600; font-size: 12px;">+ Upload</button>
      </div>
    </div>
  </div>
</body>
</html>
`;

  const htmlPath = path.resolve("scripts/logo_preview.html");
  fs.writeFileSync(htmlPath, htmlContent);

  await page.goto(`file://${htmlPath}`);
  await page.waitForNetworkIdle();

  const screenshotPath = path.resolve("/Users/adityakumar/.gemini/antigravity-ide/brain/632f2ae4-0fdb-4687-98c0-77d37549bfd6/logo_candidates_preview.png");
  await page.screenshot({ path: screenshotPath, fullPage: true });

  await browser.close();
  console.log("Screenshot saved to:", screenshotPath);
}

main().catch(console.error);
