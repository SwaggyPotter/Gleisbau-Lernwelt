const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 3 });
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message));

  for (let i = 0; i < 3; i++) {
    await page.goto('http://localhost:4200/', { waitUntil: 'networkidle' });
    await page.click('[routerlink="/zusatz/nivellierlatte"]');
    await page.waitForURL('**/zusatz/nivellierlatte');
    await page.waitForTimeout(500);
    const scope = page.locator('.scope-circle');
    await scope.screenshot({ path: `C:/Users/timsp/AppData/Local/Temp/claude/e--Gleisbau-Lernwelt/b4dfb71a-f4b6-45fc-80b7-e28156642ff5/scratchpad/v13-scope${i}.png` });
  }
  const rod = page.locator('.rod-wrap');
  await rod.screenshot({ path: `C:/Users/timsp/AppData/Local/Temp/claude/e--Gleisbau-Lernwelt/b4dfb71a-f4b6-45fc-80b7-e28156642ff5/scratchpad/v13-rod.png` });

  console.log('CONSOLE ERRORS:', JSON.stringify(errors, null, 2));
  await browser.close();
})();
