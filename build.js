#!/usr/bin/env node
// Сборка: склеивает src/*.js (по алфавиту) + src/template.html -> index.html
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'src');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort();
const js = files.map(f => `// ===== ${f} =====\n` + fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const tpl = fs.readFileSync(path.join(dir, 'template.html'), 'utf8');
const out = tpl.split('/*__JS__*/').join(js);
fs.writeFileSync(path.join(__dirname, 'index.html'), out);
console.log(`index.html: ${files.length} модулей, ${(out.length / 1024).toFixed(1)} КБ`);
