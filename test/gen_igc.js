// Generate synthetic-but-realistic IGC files for testing
const fs = require("fs");
function pad(n, w) { return String(n).padStart(w, "0"); }
function bRec(t, lat, lon, alt) {
  const hh = Math.floor(t / 3600) % 24, mm = Math.floor((t % 3600) / 60), ss = t % 60;
  const latH = lat >= 0 ? "N" : "S", lonH = lon >= 0 ? "E" : "W";
  const la = Math.abs(lat), lo = Math.abs(lon);
  const laD = Math.floor(la), laM = Math.round((la - laD) * 60000); // MMmmm
  const loD = Math.floor(lo), loM = Math.round((lo - loD) * 60000);
  const a = pad(Math.max(0, Math.round(alt)), 5);
  return "B" + pad(hh, 2) + pad(mm, 2) + pad(ss, 2) + pad(laD, 2) + pad(laM, 5) + latH + pad(loD, 3) + pad(loM, 5) + lonH + "A" + a + a;
}
function makeFlight({ date, start, lat0, lon0, alt0, durMin, thermals, drift, ghostMin }) {
  const L = ["AXCC001", "HFDTE" + date, "HFGTYGLIDERTYPE:Ozone Rush 5", "HFPLTPILOTINCHARGE:Mehdi", "HFFTYFRTYPE:FlySkyHy_iPhone"];
  let t = start, lat = lat0, lon = lon0, alt = alt0;
  // 2 min on the ground
  for (let i = 0; i < 60; i++) { L.push(bRec(t, lat, lon, alt)); t += 2; }
  // flight
  const steps = (durMin * 60) / 2;
  for (let i = 0; i < steps; i++) {
    const phase = (i / steps) * thermals * 2 * Math.PI;
    const vario = Math.sin(phase) * 2.2 - 0.35; // climbs and glides
    alt = Math.max(alt0 - 250, alt + vario * 2);
    const spd = 9.5 / 111320; // ~9.5 m/s in degrees
    lat += Math.cos(phase * 0.7) * spd * 2 * 0.4 + drift[0] * 2;
    lon += Math.sin(phase * 0.7) * spd * 2 * 0.7 + drift[1] * 2;
    L.push(bRec(t, lat, lon, alt));
    t += 2;
  }
  // descend to landing
  while (alt > alt0 - 280) { alt -= 5; lat += drift[0]; L.push(bRec(t, lat, lon, alt)); t += 2; }
  // ghost time on the ground after landing
  for (let i = 0; i < (ghostMin * 60) / 2; i++) { L.push(bRec(t, lat, lon, alt)); t += 2; }
  return L.join("\r\n") + "\r\n";
}
fs.mkdirSync(__dirname + "/igc", { recursive: true });
fs.writeFileSync(__dirname + "/igc/Coniston_Old_Man.igc", makeFlight({ date: "150625", start: 11 * 3600 + 20 * 60, lat0: 54.36991, lon0: -3.12005, alt0: 700, durMin: 55, thermals: 4, drift: [0.00001, 0.00004], ghostMin: 6 }));
fs.writeFileSync(__dirname + "/igc/Blease_Fell.igc", makeFlight({ date: "030525", start: 13 * 3600, lat0: 54.63012, lon0: -3.05502, alt0: 640, durMin: 32, thermals: 3, drift: [0.00002, -0.00002], ghostMin: 3 }));
fs.writeFileSync(__dirname + "/igc/Annecy_Planfait.igc", makeFlight({ date: "210724", start: 12 * 3600 + 40 * 60, lat0: 45.85602, lon0: 6.21503, alt0: 950, durMin: 78, thermals: 6, drift: [0.00003, 0.00005], ghostMin: 8 }));
console.log("generated", fs.readdirSync(__dirname + "/igc"));
