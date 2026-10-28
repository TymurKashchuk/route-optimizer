import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const docsDir = path.resolve(__dirname, '../../docs');

if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

console.log('Target docs directory:', docsDir);

async function capture() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
  });

  try {
    const page = await browser.newPage();
    const url = 'http://localhost:5188';
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // Verify brand
    const brandTitle = await page.$eval('.brand-title', (el) => el.textContent?.trim());
    console.log('Page Brand Title:', brandTitle);
    if (brandTitle !== 'RouteWise') {
      throw new Error(`Expected brand title "RouteWise", but got "${brandTitle}". Aborting!`);
    }

    // Wait for Leaflet map to load tiles
    await new Promise((r) => setTimeout(r, 2500));

    // 1. Initial screen
    const initialPath = path.join(docsDir, 'screenshot-initial.png');
    await page.screenshot({ path: initialPath });
    console.log('Saved:', initialPath);

    // 2. Click "Спробувати приклад"
    console.log('Clicking demo route button (.btn-try-example)...');
    await page.waitForSelector('.btn-try-example', { timeout: 5000 });
    await page.click('.btn-try-example');
    await new Promise((r) => setTimeout(r, 1200));

    // 3. Click "Оптимізувати маршрут" (.btn-hero-cta)
    console.log('Clicking optimize button (.btn-hero-cta)...');
    await page.waitForSelector('.btn-hero-cta', { timeout: 5000 });
    await page.click('.btn-hero-cta');

    // Wait for route optimization response
    console.log('Waiting for route optimization response (.hero-metrics-card, .timeline-card-wrap)...');
    await page.waitForSelector('.hero-metrics-card, .timeline-card-wrap', {
      timeout: 20000,
    });
    // Wait an additional 3.5 seconds for Leaflet animations and polyline fitBounds
    await new Promise((r) => setTimeout(r, 3500));

    // 4. Route calculated (Light theme)
    const routeLightPath = path.join(docsDir, 'screenshot-route-light.png');
    await page.screenshot({ path: routeLightPath });
    console.log('Saved:', routeLightPath);

    // 5. Switch to Dark theme
    console.log('Switching to dark theme (.theme-toggle-btn)...');
    const themeBtn = await page.$('.theme-toggle-btn');
    if (themeBtn) {
      await themeBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
    }

    const routeDarkPath = path.join(docsDir, 'screenshot-route-dark.png');
    await page.screenshot({ path: routeDarkPath });
    console.log('Saved:', routeDarkPath);

    // 6. Mobile view
    console.log('Capturing mobile view...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await new Promise((r) => setTimeout(r, 1500));

    const mobilePath = path.join(docsDir, 'screenshot-mobile.png');
    await page.screenshot({ path: mobilePath });
    console.log('Saved:', mobilePath);

    console.log('All RouteWise screenshots captured successfully!');
  } finally {
    await browser.close();
  }
}

capture().catch((err) => {
  console.error('Error taking screenshots:', err);
  process.exit(1);
});
