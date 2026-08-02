const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 1400 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE: " + m.text()); });
  await page.goto("http://localhost:8123/paragliding-logbook.html");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "test/shots/01-empty.png" });
  // import IGC files
  const igcDir = path.join(__dirname, "igc");
  const files = ["Coniston_Old_Man.igc", "Blease_Fell.igc", "Annecy_Planfait.igc"].map((f) => path.join(igcDir, f));
  await page.setInputFiles("#fileInput", files);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "test/shots/02-logbook.png", fullPage: true });
  // search filter
  await page.fill("#fQ", "coniston");
  await page.waitForTimeout(300);
  const count = await page.textContent("#fCount");
  console.log("filter count:", count);
  await page.fill("#fQ", "");
  await page.waitForTimeout(300);
  // open a flight
  await page.click('#flightList .row');
  await page.waitForTimeout(3500); // let tiles load
  await page.screenshot({ path: "test/shots/03-flight.png", fullPage: true });
  // scrub the altitude chart
  const wrap = await page.$("#scrubWrap");
  if (wrap) {
    const box = await wrap.boundingBox();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.waitForTimeout(300);
    console.log("scrub readout:", (await page.textContent("#scrubOut")).trim());
    await page.screenshot({ path: "test/shots/04-scrub.png", clip: { x: box.x - 20, y: box.y - 80, width: Math.min(960, box.width + 40), height: box.height + 120 } });
  } else console.log("NO SCRUB WRAP");
  // records view
  await page.click('[data-act="nav-records"]');
  await page.waitForTimeout(600);
  await page.screenshot({ path: "test/shots/05-records.png", fullPage: true });
  // site page
  await page.click('[data-act="open-site"]');
  await page.waitForTimeout(600);
  await page.screenshot({ path: "test/shots/06-site.png", fullPage: true });
  // pilot log
  await page.click('[data-act="nav-pilot"]');
  await page.waitForTimeout(800);
  await page.screenshot({ path: "test/shots/07-pilot.png", fullPage: true });
  // settings + dark mode
  await page.click('[data-act="nav-settings"]');
  await page.waitForTimeout(400);
  await page.click('[data-act="set-mode"][data-mode="dark"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: "test/shots/08-settings-dark.png", fullPage: true });
  // dark flight view with map
  await page.click('[data-act="nav-logbook"]');
  await page.waitForTimeout(400);
  await page.click('#flightList .row');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "test/shots/09-flight-dark.png" });
  // csv export sanity: call function and inspect
  const csv = await page.evaluate(() => {
    let out = null; const orig = URL.createObjectURL;
    return new Promise(async (res) => {
      const head = ["date"]; // just run exportCSV logic indirectly
      try {
        const rows = state.flights.length;
        exportCSV();
        res("exportCSV ran, flights=" + rows);
      } catch (e) { res("exportCSV ERROR " + e.message); }
    });
  });
  console.log(csv);
  console.log("badges:", await page.evaluate(() => Object.keys(computeBadges()).join(",")));
  console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "NO PAGE ERRORS");
  await browser.close();
})();
