const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 1200 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  await page.goto("http://localhost:8123/test-local.html");
  await page.waitForTimeout(1000);
  const igcDir = path.join(__dirname, "igc");
  await page.setInputFiles("#fileInput", ["Coniston_Old_Man.igc", "Blease_Fell.igc", "Annecy_Planfait.igc"].map((f) => path.join(igcDir, f)));
  await page.waitForTimeout(2200);
  // toasts + confetti fired?
  console.log("toasts seen:", await page.evaluate(() => document.querySelectorAll(".toast").length));
  await page.screenshot({ path: "test/shots/20-import-toasts.png" });
  // flight view: replay
  await page.click("#flightList .row");
  await page.waitForTimeout(1200);
  await page.click("#replayBtn");
  await page.waitForTimeout(1500);
  const btnTxt = await page.textContent("#replayBtn");
  const readout = (await page.textContent("#scrubOut")).trim();
  console.log("replay button:", JSON.stringify(btnTxt), "| readout during replay:", readout);
  await page.screenshot({ path: "test/shots/21-replay.png" });
  await page.click("#replayBtn"); // pause
  // compare flow
  await page.click('[data-act="compare"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: "test/shots/22-compare-chooser.png" });
  await page.click('[data-act="compare-pick"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: "test/shots/23-compare.png", fullPage: true });
  // keyboard: esc back
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  // records: sites map + wings
  await page.click('[data-act="nav-records"]');
  await page.waitForTimeout(1500);
  console.log("sites map markers:", await page.evaluate(() => document.querySelectorAll("#sitesMap path.leaflet-interactive").length));
  await page.screenshot({ path: "test/shots/24-records-wave2.png", fullPage: true });
  // wing serviced button
  await page.click('[data-act="wing-serviced"]');
  await page.waitForTimeout(300);
  // goal: set in settings then check flights view
  await page.click('[data-act="nav-settings"]');
  await page.waitForTimeout(300);
  await page.fill("#gHours", "50");
  await page.dispatchEvent("#gHours", "change");
  await page.fill("#gFlights", "40");
  await page.dispatchEvent("#gFlights", "change");
  await page.waitForTimeout(200);
  await page.click('[data-act="nav-logbook"]');
  await page.waitForTimeout(700);
  await page.screenshot({ path: "test/shots/25-goal-rings.png" });
  // arrows navigate flights
  await page.click("#flightList .row");
  await page.waitForTimeout(500);
  const site1 = await page.textContent("h2");
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(500);
  const site2 = await page.textContent("h2");
  console.log("arrow nav:", site1.trim(), "->", site2.trim());
  // print sheet builds
  await page.evaluate(() => { window.print = () => {}; printLogbook(); });
  console.log("print rows:", await page.evaluate(() => document.querySelectorAll("#printSheet tr").length));
  // weather attempted (will fail offline, should not error)
  console.log("weather cache:", await page.evaluate(() => JSON.stringify(state.weather)));
  console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "NO PAGE ERRORS");
  await browser.close();
})();
