#!/usr/bin/env node
/*
  Usage:
    node scripts/import-from-xls.js "C:\\path\\to\\inventoryReport.xls" [--sheet Sheet1] [--dry]

  The script reads the first sheet by default, attempts to auto-map common column names
  to the backend expected product fields, builds a products array, and POSTs it to the API.
  Use --dry to preview without importing.
  
  Environment variable API_BASE_URL can be set to override the default API URL.
*/

const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

async function getFetch() {
  if (typeof fetch !== 'undefined') return fetch;
  try {
    const mod = await import('node-fetch');
    return mod.default;
  } catch (e) {
    throw new Error('Fetch API not available and node-fetch is not installed. Install with: npm i node-fetch');
  }
}

function parseArgs(argv) {
  const args = { file: null, sheet: null, dry: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!args.file && !a.startsWith('--')) {
      args.file = a;
      continue;
    }
    if (a === '--dry') args.dry = true;
    else if (a === '--sheet') args.sheet = argv[++i];
  }
  return args;
}

function normalize(header) {
  return String(header || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function buildHeaderMap(headers) {
  const map = {};
  const targetFields = {
    name: ['name', 'product', 'product name', 'title'],
    brand: ['brand', 'manufacturer'],
    price: ['price', 'mrp', 'cost', 'amount'],
    category: ['category', 'type'],
    gender: ['gender', 'segment'],
    model: ['model', 'model code', 'sku', 'code'],
    description: ['description', 'desc', 'details'],
    featured: ['featured', 'is featured', 'highlight', 'hot'],
    image_url: ['image url', 'image', 'primary image', 'img', 'image1'],
    image_url_2: ['image url 2', 'image2', 'img2', 'secondary image'],
    image_url_3: ['image url 3', 'image3', 'img3'],
  };

  const normalized = headers.map(h => normalize(h));
  for (const [field, candidates] of Object.entries(targetFields)) {
    const idx = normalized.findIndex(h => candidates.includes(h));
    if (idx !== -1) map[field] = headers[idx];
  }
  return map;
}

function rowValue(row, map, key) {
  const source = map[key];
  if (!source) return undefined;
  return row[source];
}

function toBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (value == null) return false;
  const s = String(value).trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'y';
}

function toNumber(value) {
  if (typeof value === 'number') return value;
  if (value == null) return 0;
  const num = Number(String(value).replace(/[^0-9.\-]/g, ''));
  return isNaN(num) ? 0 : num;
}

function buildProducts(jsonRows) {
  if (!jsonRows || jsonRows.length === 0) return { products: [], summary: { mapped: 0, skipped: 0 } };
  const headers = Object.keys(jsonRows[0]);
  const map = buildHeaderMap(headers);

  const products = [];
  let skipped = 0;
  jsonRows.forEach((row, idx) => {
    const name = rowValue(row, map, 'name') || row[headers[0]]; // fallback first col
    const brand = rowValue(row, map, 'brand');
    const price = toNumber(rowValue(row, map, 'price'));
    const category = rowValue(row, map, 'category');
    const gender = rowValue(row, map, 'gender');
    const model = rowValue(row, map, 'model');
    const description = rowValue(row, map, 'description');
    const featured = toBoolean(rowValue(row, map, 'featured'));
    const image_url = rowValue(row, map, 'image_url');
    const image_url_2 = rowValue(row, map, 'image_url_2');
    const image_url_3 = rowValue(row, map, 'image_url_3');

    // Required fields check (backend requires these)
    if (!name || !brand || !price || !category || !gender) {
      skipped++;
      return;
    }

    products.push({
      name: String(name).trim(),
      brand: String(brand).trim(),
      price,
      category: String(category).trim().toLowerCase(),
      gender: String(gender).trim().toLowerCase(),
      model: model ? String(model).trim() : '',
      description: description ? String(description).trim() : '',
      featured,
      image_url: image_url ? String(image_url).trim() : '',
      image_url_2: image_url_2 ? String(image_url_2).trim() : '',
      image_url_3: image_url_3 ? String(image_url_3).trim() : '',
    });
  });

  return { products, summary: { mapped: products.length, skipped } };
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.file) {
    console.error('Error: please provide path to XLS/XLSX file');
    process.exit(1);
  }
  const absPath = path.isAbsolute(args.file) ? args.file : path.resolve(process.cwd(), args.file);
  if (!fs.existsSync(absPath)) {
    console.error('File not found:', absPath);
    process.exit(1);
  }

  const workbook = XLSX.readFile(absPath);
  const sheetName = args.sheet || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    console.error('Sheet not found:', sheetName);
    process.exit(1);
  }

  const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const { products, summary } = buildProducts(json);

  console.log(`Parsed rows: ${json.length}`);
  console.log(`Ready to import: ${summary.mapped}, skipped (missing required fields): ${summary.skipped}`);

  if (products.length === 0) {
    console.error('No valid products to import.');
    process.exit(1);
  }

  if (args.dry) {
    console.log('Dry run - showing first 5 products:');
    console.log(products.slice(0, 5));
    process.exit(0);
  }

  const doFetch = await getFetch();
  const baseURL = process.env.API_BASE_URL || process.env.API_URL || 'http://localhost:3001/api';
  const url = `${baseURL}/products/bulk`;

  console.log('Importing to:', url);
  const res = await doFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ products }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('Import failed:', res.status, res.statusText, text);
    process.exit(1);
  }

  const result = await res.json();
  console.log('Import success:', result.message || 'Completed');
  console.log(JSON.stringify(result.results || result, null, 2));
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});


