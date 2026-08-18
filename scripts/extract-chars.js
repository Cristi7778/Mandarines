#!/usr/bin/env node
/**
 * Extract every unique CJK character from lib/data/ and write to
 * scripts/chars.json.  train_recognizer.py reads this file and
 * unions it with its own broad supplement.
 *
 * Run:  node scripts/extract-chars.js
 */

const fs   = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'lib', 'data');
const CJK     = /[一-鿿㐀-䶿]/g;
const found   = new Set();

for (const file of fs.readdirSync(dataDir).filter(f => /\.(ts|js|json)$/.test(f))) {
  const src = fs.readFileSync(path.join(dataDir, file), 'utf8');
  for (const ch of src.match(CJK) ?? []) found.add(ch);
}

const chars = [...found].sort();
console.log(`Found ${chars.length} unique CJK characters in lib/data/`);

const out = path.join(__dirname, 'chars.json');
fs.writeFileSync(out, JSON.stringify(chars, null, 0), 'utf8');
console.log(`Written → ${out}`);
