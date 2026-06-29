import COS from 'cos-nodejs-sdk-v5';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Load .env.local
const envLines = readFileSync(join(rootDir, '.env.local'), 'utf8').split('\n');
for (const line of envLines) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const idx = t.indexOf('=');
  if (idx === -1) continue;
  const k = t.slice(0, idx);
  let v = t.slice(idx + 1);
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  process.env[k] = v;
}

const cos = new COS({
  SecretId: process.env.TENCENT_COS_SECRET_ID,
  SecretKey: process.env.TENCENT_COS_SECRET_KEY,
});

const Bucket = process.env.TENCENT_COS_BUCKET;
const Region = process.env.TENCENT_COS_REGION;
const manifestPath = join(rootDir, 'public/ielts-vocab/audio-manifest.json');
const reportPath = join(rootDir, 'generated-audio/ielts-vocab-signed-url-check.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const entries = Object.entries(manifest.words);

console.log(`Generating signed URL report for ${entries.length} files (expires in 10 minutes)...`);

let done = 0;
const report = {
  generatedAt: new Date().toISOString(),
  expiresIn: 600,
  urls: {},
};
for (const [, word] of entries) {
  const data = await cos.getObjectUrl({ Bucket, Region, Key: word.key, Expires: 600 });
  report.urls[word.key] = data.Url;
  done++;
  if (done % 500 === 0 || done === entries.length) {
    console.log(`  ${done}/${entries.length}`);
  }
}

mkdirSync(join(rootDir, 'generated-audio'), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Done. Report written without modifying manifest: ${reportPath}`);
