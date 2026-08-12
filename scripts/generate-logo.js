const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'public', 'images', '1.svg');
const outPath = path.join(__dirname, '..', 'functions', 'logo-base64.js');

const logoStr = fs.readFileSync(svgPath, 'utf-8').replace(/#000000|#000\b|black/gi, '#D4AF37');
const logoBase64 = `data:image/svg+xml;base64,${Buffer.from(logoStr).toString('base64')}`;

fs.writeFileSync(outPath, `export const logoBase64 = ${JSON.stringify(logoBase64)};\n`);
console.log(`Generated ${outPath} (${fs.statSync(outPath).size} bytes)`);
