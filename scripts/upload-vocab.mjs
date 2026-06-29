import COS from 'cos-nodejs-sdk-v5';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const rootDir = dirname(fileURLToPath(import.meta.url));

// Load .env.local
for (const line of readFileSync(join(rootDir, '..', '.env.local'), 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const idx = t.indexOf('=');
  if (idx === -1) continue;
  let v = t.slice(idx + 1);
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  process.env[t.slice(0, idx)] = v;
}

const cos = new COS({
  SecretId: process.env.TENCENT_COS_SECRET_ID,
  SecretKey: process.env.TENCENT_COS_SECRET_KEY,
});

const Bucket = process.env.TENCENT_COS_BUCKET;
const Region = process.env.TENCENT_COS_REGION;
const localDir = join(rootDir, '..', 'generated-audio', 'ielts-vocab', 'en-us', 'v1');
const files = readdirSync(localDir).filter(f => f.endsWith('.mp3')).sort();

console.log(`Uploading ${files.length} files to cos://${Bucket}/${Region}/ielts-vocab/en-us/v1/`);

let uploaded = 0, failed = 0;
const BATCH = 5;

for (let i = 0; i < files.length; i += BATCH) {
  const batch = files.slice(i, i + BATCH);
  const results = await Promise.allSettled(
    batch.map(key => new Promise((resolve, reject) => {
      cos.putObject({
        Bucket, Region,
        Key: 'ielts-vocab/en-us/v1/' + key,
        Body: readFileSync(join(localDir, key)),
      }, (err) => err ? reject(err) : resolve(key));
    }))
  );

  for (const r of results) {
    if (r.status === 'fulfilled') uploaded++;
    else failed++;
  }

  const pct = Math.round(uploaded / files.length * 100);
  process.stdout.write(`\r${uploaded}/${files.length} (${failed} failed) ${pct}%`);
}

console.log(`\nDone. ${uploaded} uploaded, ${failed} failed`);
