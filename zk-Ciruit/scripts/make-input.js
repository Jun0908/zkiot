// Convert data/sample.json to data/input.json for the circuit.
// We store numbers as strings to avoid JS integer precision issues.
const fs = require("fs");

const src = JSON.parse(fs.readFileSync("./data/sample.json", "utf8"));
const tScaled = Math.round(src.t * 100);

const input = { tScaled: String(tScaled) }; // strings recommended by docs
fs.writeFileSync("./data/input.json", JSON.stringify(input) + "\n");
console.log("Created data/input.json:", input);

