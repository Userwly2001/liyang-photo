import COS from 'cos-nodejs-sdk-v5'
import { readFileSync, existsSync, writeFileSync } from 'fs'
import { basename, join } from 'path'
import { loadEnvFile } from 'process'

loadEnvFile(join(import.meta.dirname, '..', '.env.local'))

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

const localRoot = join(import.meta.dirname, '..', 'generated-audio', 'ielts-vocab')
const manifestPath = join(import.meta.dirname, '..', 'public', 'ielts-vocab', 'audio-manifest.json')

const cos = new COS({
  SecretId: requireEnv('TENCENT_COS_SECRET_ID'),
  SecretKey: requireEnv('TENCENT_COS_SECRET_KEY'),
})

const Bucket = requireEnv('TENCENT_COS_BUCKET')
const Region = requireEnv('TENCENT_COS_REGION')
const baseUrl = `https://${Bucket}.cos.${Region}.myqcloud.com`

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const entries = Object.entries(manifest.words) as [string, any][]
console.log(`Starting upload: ${entries.length} files to ${Bucket}`)

let uploaded = 0
let failed = 0
const BATCH = 10

for (let i = 0; i < entries.length; i += BATCH) {
  const batch = entries.slice(i, i + BATCH)
  const results = await Promise.allSettled(
    batch.map(async ([key, word]: [string, any]) => {
      const localPath = join(localRoot, 'en-us', 'v1', basename(word.key))
      if (!existsSync(localPath)) {
        return { key, status: 'missing' }
      }
      await cos.putObject({
        Bucket,
        Region,
        Key: word.key,
        Body: readFileSync(localPath),
      })
      return { key, status: 'ok' }
    })
  )

  for (const r of results) {
    if (r.status === 'fulfilled') {
      if (r.value.status === 'ok') uploaded++
    } else {
      failed++
    }
  }

  const pct = Math.min(100, Math.round((i + BATCH) / entries.length * 100))
  process.stdout.write(`\rProgress: ${uploaded}/${entries.length} uploaded (${failed} failed) ${pct}%`)
}

// Keep browser playback on short-lived signed URLs from /api/vocab/audio.
for (const [, word] of Object.entries(manifest.words) as [string, any][]) {
  word.url = `/${word.key}`
}
manifest.generatedAt = new Date().toISOString()
manifest.baseUrl = ''

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

console.log(`\nDone: ${uploaded} uploaded, ${failed} failed`)
console.log(`Manifest kept on signed API playback. COS origin = ${baseUrl}`)
