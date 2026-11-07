import fs from "fs";

const dash = "src/pages/Dashboard.jsx";
const bodyPath = "src/pages/dashboard-body.txt";

let body = fs.readFileSync(bodyPath, "utf8");
body = body.replace(/<\/?motion\b/g, (t) => t.replace("motion", "div"));

let main = fs.readFileSync(dash, "utf8");
const start = main.indexOf('                <div className="dashboard-page poppins">');
const end = main.indexOf("\r\n            )}\r\n        </>", start);
if (start < 0 || end < 0) {
  console.error("markers", start, end);
  process.exit(1);
}
const out = main.slice(0, start) + body.trimEnd() + main.slice(end);
fs.writeFileSync(dash, out);
fs.unlinkSync(bodyPath);
console.log("patched");
