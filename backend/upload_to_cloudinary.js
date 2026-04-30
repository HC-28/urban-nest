// ─────────────────────────────────────────────────────────────────────────────
// upload_to_cloudinary.js
// Urban Nest — Bulk-upload all local assets to Cloudinary
//
// USAGE:
//   1. Fill in your Cloudinary credentials in ../../.env (or .env in this dir)
//   2. Run: node upload_to_cloudinary.js
//   3. Wait for all uploads to finish (~391 files)
//   4. cloudinary_url_map.json will be created in this directory
//   5. Run: node generate_cloudinary_sql.js   (to produce the final SQL)
// ─────────────────────────────────────────────────────────────────────────────

const cloudinary = require('cloudinary').v2;
const fs        = require('fs');
const path      = require('path');

// ── Load .env from project root ───────────────────────────────────────────────
const envPath = path.join(__dirname, '../../.env');
if (!fs.existsSync(envPath)) {
  console.error('❌  .env not found at:', envPath);
  process.exit(1);
}
require('dotenv').config({ path: envPath });

// ── Cloudinary config ─────────────────────────────────────────────────────────
const CLOUD_NAME   = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY      = process.env.CLOUDINARY_API_KEY;
const API_SECRET   = process.env.CLOUDINARY_API_SECRET;
const CLOUD_FOLDER = process.env.CLOUDINARY_FOLDER || 'urban-nest';

if (!CLOUD_NAME || CLOUD_NAME === 'your_cloud_name_here') {
  console.error('❌  Set CLOUDINARY_CLOUD_NAME in your .env file first!');
  process.exit(1);
}
if (!API_KEY || API_KEY === 'your_api_key_here') {
  console.error('❌  Set CLOUDINARY_API_KEY in your .env file first!');
  process.exit(1);
}
if (!API_SECRET || API_SECRET === 'your_api_secret_here') {
  console.error('❌  Set CLOUDINARY_API_SECRET in your .env file first!');
  process.exit(1);
}

cloudinary.config({ cloud_name: CLOUD_NAME, api_key: API_KEY, api_secret: API_SECRET });

// ── Paths ─────────────────────────────────────────────────────────────────────
const ASSETS_ROOT  = path.join(__dirname, '../frontend/public/assets');
const URL_MAP_FILE = path.join(__dirname, 'cloudinary_url_map.json');
const SUBFOLDERS   = ['agents', 'logos', 'properties'];

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function uploadFile(filePath, subfolder) {
  const baseName = path.parse(filePath).name; // e.g. "prop_1_1"
  const publicId = `${CLOUD_FOLDER}/${subfolder}/${baseName}`;

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      public_id: publicId,
      use_filename: true,
      unique_filename: false,
      overwrite: true,
      resource_type: 'image',
    });
    return { key: baseName, url: result.secure_url, ok: true };
  } catch (err) {
    return { key: baseName, url: null, ok: false, error: err.message };
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀  Urban Nest — Cloudinary Bulk Uploader');
  console.log('─────────────────────────────────────────');
  console.log(`   Cloud  : ${CLOUD_NAME}`);
  console.log(`   Folder : ${CLOUD_FOLDER}`);
  console.log(`   Assets : ${ASSETS_ROOT}\n`);

  const urlMap = {};
  let totalOk   = 0;
  let totalFail = 0;

  for (const subfolder of SUBFOLDERS) {
    const folderPath = path.join(ASSETS_ROOT, subfolder);
    if (!fs.existsSync(folderPath)) {
      console.warn(`⚠️   Skipping missing folder: ${folderPath}`);
      continue;
    }

    const files = fs
      .readdirSync(folderPath)
      .filter((f) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
      .sort();

    console.log(`📁  [${subfolder}] — ${files.length} file(s)`);

    // Upload in small batches (5 at a time) to avoid rate limits
    const BATCH = 5;
    for (let i = 0; i < files.length; i += BATCH) {
      const batch = files.slice(i, i + BATCH);
      const results = await Promise.all(
        batch.map((f) => uploadFile(path.join(folderPath, f), subfolder))
      );

      for (const r of results) {
        if (r.ok) {
          urlMap[r.key] = r.url;
          totalOk++;
          process.stdout.write(`   ✅  ${r.key}\n`);
        } else {
          totalFail++;
          process.stdout.write(`   ❌  ${r.key} — ${r.error}\n`);
        }
      }

      // Small pause between batches to be nice to Cloudinary API
      if (i + BATCH < files.length) await sleep(200);
    }
    console.log();
  }

  // ── Save URL map ─────────────────────────────────────────────────────────
  fs.writeFileSync(URL_MAP_FILE, JSON.stringify(urlMap, null, 2), 'utf8');

  console.log('─────────────────────────────────────────');
  console.log(`✅  Uploaded : ${totalOk}`);
  if (totalFail > 0) console.log(`❌  Failed   : ${totalFail}`);
  console.log(`📄  URL map  : ${URL_MAP_FILE}`);
  console.log('\n👉  Next step: node generate_cloudinary_sql.js\n');
}

main().catch((err) => {
  console.error('\n💥  Fatal error:', err.message);
  process.exit(1);
});
