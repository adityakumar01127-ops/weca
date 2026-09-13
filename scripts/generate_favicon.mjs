import fs from "fs";
import path from "path";
import sharp from "sharp";

const ROOT_DIR = process.cwd();

/**
 * Returns pixel-tuned SVG string for the Weca Chromatic Aperture Emblem
 * @param {number} size - Target square dimension in pixels
 */
function getEmblemSvg(size) {
  if (size === 16) {
    // Specially tuned for 16x16 grid: bolder strokes, vivid colors, bright singularity
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="b16V" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#9333EA" />
          <stop offset="100%" stop-color="#6366F1" />
        </linearGradient>
        <linearGradient id="b16C" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#22D3EE" />
          <stop offset="100%" stop-color="#0284C7" />
        </linearGradient>
        <linearGradient id="b16R" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FF2A5F" />
          <stop offset="100%" stop-color="#E11D48" />
        </linearGradient>
      </defs>

      <!-- Solid Dark Base Circle (Camera Chassis) -->
      <circle cx="8" cy="8" r="7.5" fill="#09090B" stroke="#27272A" stroke-width="1" />

      <!-- Outer Calibrated Lens Rim Hint -->
      <circle cx="8" cy="8" r="6.8" stroke="#3F3F46" stroke-width="0.75" stroke-dasharray="2 1.2" />

      <!-- 3 Interlocking Chromatic Blades -->
      <path d="M 8 1.8 A 6.2 6.2 0 0 1 13.3 5 C 10.7 5.8, 8.7 7.2, 7.7 8.2 C 7.8 6.7, 7.9 3.8, 8 1.8 Z" fill="url(#b16V)" />
      <path d="M 13.3 5 A 6.2 6.2 0 0 1 8 14.2 C 7.8 11.7, 6.7 9.8, 5.3 8.8 C 7 8, 10.3 6.2, 13.3 5 Z" fill="url(#b16R)" />
      <path d="M 8 14.2 A 6.2 6.2 0 0 1 2.7 5 C 5.3 5.8, 7.2 7, 8.2 8 C 6.8 9.5, 7.5 12, 8 14.2 Z" fill="url(#b16C)" />

      <!-- Center Pupil -->
      <circle cx="8" cy="8" r="2.2" fill="#09090B" />
      
      <!-- Singularity Sparkle Core (Cyan Halo + White Flare) -->
      <circle cx="8" cy="8" r="1.5" fill="#22D3EE" />
      <circle cx="8" cy="8" r="0.8" fill="#FFFFFF" />
      
      <!-- Cross Flare Spikes -->
      <line x1="8" y1="6.5" x2="8" y2="9.5" stroke="#FFFFFF" stroke-width="0.6" stroke-linecap="round" />
      <line x1="6.5" y1="8" x2="9.5" y2="8" stroke="#FFFFFF" stroke-width="0.6" stroke-linecap="round" />
    </svg>`;
  }

  // General high-res SVG for 32, 48, 64, 128, 256, and SVG output
  const isSmall = size <= 32;
  const strokeW = isSmall ? "1.6" : "1.2";
  const notchW = isSmall ? "1.8" : "1.2";
  const flareW = isSmall ? "1.2" : "0.8";

  return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Electric Violet Gradient -->
      <linearGradient id="favBladeViolet" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#8B5CF6" />
        <stop offset="100%" stop-color="#6366F1" />
      </linearGradient>

      <!-- Neon Cyan Gradient -->
      <linearGradient id="favBladeCyan" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#22D3EE" />
        <stop offset="100%" stop-color="#0284C7" />
      </linearGradient>

      <!-- Chromatic Rose Gradient -->
      <linearGradient id="favBladeRose" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FF385C" />
        <stop offset="100%" stop-color="#E11D48" />
      </linearGradient>

      <!-- Central Singularity Radial Glow -->
      <radialGradient id="favCoreGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#FFFFFF" />
        <stop offset="40%" stop-color="#22D3EE" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#09090B" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- Solid Dark Optical Chassis (Circular Lens Barrel) -->
    <circle cx="24" cy="24" r="23" fill="#09090B" stroke="#27272A" stroke-width="1" />

    <!-- Outer Calibrated Lens Rim -->
    <circle cx="24" cy="24" r="21.5" stroke="#3F3F46" stroke-width="${strokeW}" stroke-dasharray="3.5 1.8" />

    <!-- Tri-Sector Calibration Alignment Notches (0°, 120°, 240°) -->
    <line x1="24" y1="2.5" x2="24" y2="4.5" stroke="#A1A1AA" stroke-width="${notchW}" stroke-linecap="round" />
    <line x1="42.5" y1="34.5" x2="40.8" y2="33.5" stroke="#A1A1AA" stroke-width="${notchW}" stroke-linecap="round" />
    <line x1="5.5" y1="34.5" x2="7.2" y2="33.5" stroke="#A1A1AA" stroke-width="${notchW}" stroke-linecap="round" />

    <!-- 3 Interlocking Chromatic Aperture Blades -->
    <!-- Blade 1: Electric Violet (Top Sector) -->
    <path d="M 24 5.5 A 18.5 18.5 0 0 1 40 14.8 C 32 17.5, 26 21.5, 23 24.5 C 23.5 20, 23.8 11.5, 24 5.5 Z" fill="url(#favBladeViolet)" />
    
    <!-- Blade 2: Chromatic Rose (Right Sector) -->
    <path d="M 40 14.8 A 18.5 18.5 0 0 1 24 42.5 C 23.5 35, 20 29.5, 16 26.5 C 21 24, 31 18.5, 40 14.8 Z" fill="url(#favBladeRose)" />
    
    <!-- Blade 3: Neon Cyan (Left Sector) -->
    <path d="M 24 42.5 A 18.5 18.5 0 0 1 8 14.8 C 16 17.5, 21.5 21, 24.5 24 C 20.5 28.5, 22.5 36, 24 42.5 Z" fill="url(#favBladeCyan)" />

    <!-- Inner Negative Space Pupil -->
    <circle cx="24" cy="24" r="5" fill="#09090B" stroke="#27272A" stroke-width="1" />
    
    <!-- Central Optical Singularity Core Flare -->
    <circle cx="24" cy="24" r="3.5" fill="url(#favCoreGlow)" />
    <circle cx="24" cy="24" r="1.5" fill="#FFFFFF" />

    <!-- Anamorphic Cross-Flare Spikes -->
    <line x1="24" y1="19.5" x2="24" y2="28.5" stroke="#FFFFFF" stroke-width="${flareW}" stroke-linecap="round" opacity="0.95" />
    <line x1="19.5" y1="24" x2="28.5" y2="24" stroke="#FFFFFF" stroke-width="${flareW}" stroke-linecap="round" opacity="0.95" />
  </svg>`;
}

/**
 * Builds a valid Microsoft Windows ICO binary containing multiple PNG streams
 * @param {Buffer[]} pngBuffers - Array of PNG encoded image buffers
 * @param {number[]} sizes - Corresponding square dimension of each image
 * @returns {Buffer} - Compliant binary .ico file
 */
function buildIcoBuffer(pngBuffers, sizes) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = headerSize + count * dirEntrySize;
  
  let currentOffset = dirSize;
  const entries = [];
  
  for (let i = 0; i < count; i++) {
    const size = sizes[i];
    const buf = pngBuffers[i];
    // 0 in ICO header means 256px
    const w = size === 256 ? 0 : size;
    const h = size === 256 ? 0 : size;
    
    const entry = Buffer.alloc(16);
    entry.writeUInt8(w, 0);                 // bWidth
    entry.writeUInt8(h, 1);                 // bHeight
    entry.writeUInt8(0, 2);                 // bColorCount (0 if >= 8bpp)
    entry.writeUInt8(0, 3);                 // bReserved (0)
    entry.writeUInt16LE(1, 4);              // wPlanes (1)
    entry.writeUInt16LE(32, 6);             // wBitCount (32 bpp RGBA)
    entry.writeUInt32LE(buf.length, 8);     // dwBytesInRes
    entry.writeUInt32LE(currentOffset, 12); // dwImageOffset
    
    entries.push(entry);
    currentOffset += buf.length;
  }
  
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);      // idReserved (must be 0)
  header.writeUInt16LE(1, 2);      // idType (1 for ICO)
  header.writeUInt16LE(count, 4);  // idCount (number of images)
  
  return Buffer.concat([header, ...entries, ...pngBuffers]);
}

async function main() {
  console.log("Generating Weca Multi-Resolution Favicon Suite...");

  const sizes = [16, 32, 48, 64, 128, 256];
  const pngBuffers = [];

  for (const s of sizes) {
    const svg = getEmblemSvg(s);
    const pngBuf = await sharp(Buffer.from(svg))
      .resize(s, s)
      .png({ compressionLevel: 9 })
      .toBuffer();
    pngBuffers.push(pngBuf);
    console.log(`  ✓ Rendered ${s}x${s} PNG stream (${pngBuf.length} bytes)`);
  }

  // Package into ICO
  const icoBuffer = buildIcoBuffer(pngBuffers, sizes);
  console.log(`  ✓ Built ICO binary (${icoBuffer.length} bytes, 6 resolutions)`);

  // 1. Write app/favicon.ico
  const appFaviconPath = path.join(ROOT_DIR, "app", "favicon.ico");
  fs.writeFileSync(appFaviconPath, icoBuffer);
  console.log(`  ✓ Written: ${appFaviconPath}`);

  // 2. Write public/favicon.ico
  const publicFaviconPath = path.join(ROOT_DIR, "public", "favicon.ico");
  fs.writeFileSync(publicFaviconPath, icoBuffer);
  console.log(`  ✓ Written: ${publicFaviconPath}`);

  // 3. Write public/weca-logo.svg with the solid dark circular lens barrel
  const svgContent = getEmblemSvg(48);
  const publicSvgPath = path.join(ROOT_DIR, "public", "weca-logo.svg");
  fs.writeFileSync(publicSvgPath, svgContent);
  console.log(`  ✓ Written: ${publicSvgPath}`);

  // 4. Also write public/weca-emblem.svg
  const publicEmblemPath = path.join(ROOT_DIR, "public", "weca-emblem.svg");
  fs.writeFileSync(publicEmblemPath, svgContent);
  console.log(`  ✓ Written: ${publicEmblemPath}`);

  console.log("\nFavicon suite generation completed successfully!");
}

main().catch((err) => {
  console.error("Error generating favicon:", err);
  process.exit(1);
});
