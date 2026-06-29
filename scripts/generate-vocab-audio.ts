import COS from 'cos-nodejs-sdk-v5'
import { createHash, createHmac, randomUUID } from 'crypto'
import { createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs'
import { basename, join } from 'path'
import vm from 'vm'

type VocabItem = {
  id: number
  word: string
  phonetic?: string
  meaningCN?: string
}

type ManifestWord = {
  chapter: number
  id: number
  word: string
  key: string
  url: string
}

type Manifest = {
  version: string
  generatedAt: string | null
  baseUrl: string
  words: Record<string, ManifestWord>
}

const rootDir = process.cwd()
const vocabDir = join(rootDir, 'public', 'ielts-vocab')
const outputRoot = join(rootDir, 'generated-audio', 'ielts-vocab')
const manifestPath = join(vocabDir, 'audio-manifest.json')
const endpoint = 'tts.tencentcloudapi.com'
const service = 'tts'
const apiVersion = '2019-08-23'
const action = 'TextToVoice'

function loadEnvFile(path: string) {
  if (!existsSync(path)) return
  const content = readFileSync(path, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index < 0) continue
    const key = trimmed.slice(0, index).trim()
    const raw = trimmed.slice(index + 1).trim()
    const value = raw.replace(/^['"]|['"]$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile(join(rootDir, '.env'))
loadEnvFile(join(rootDir, '.env.local'))

function getArg(name: string) {
  const prefix = `--${name}=`
  const matched = process.argv.find((arg) => arg.startsWith(prefix))
  return matched ? matched.slice(prefix.length) : undefined
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`)
}

function getEnv(name: string, fallback = '') {
  return process.env[name] || fallback
}

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

function requireAnyEnv(names: string[]) {
  for (const name of names) {
    const value = process.env[name]
    if (value) return value
  }
  throw new Error(`Missing environment variable: ${names.join(' or ')}`)
}

function sha256Hex(value: string | Buffer) {
  return createHash('sha256').update(value).digest('hex')
}

function hmac(key: Buffer | string, value: string) {
  return createHmac('sha256', key).update(value).digest()
}

function hmacHex(key: Buffer | string, value: string) {
  return createHmac('sha256', key).update(value).digest('hex')
}

function normalizeWord(word: string) {
  return word
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function manifestKey(chapter: number, id: number) {
  return `c${chapter}:${id}`
}

function readChapter(filePath: string) {
  const match = basename(filePath).match(/^data-(\d+)\.js$/)
  if (!match) return null

  const context = { vocabulary: [] as VocabItem[] }
  vm.createContext(context)
  vm.runInContext(readFileSync(filePath, 'utf8'), context, { filename: filePath })

  return {
    chapter: Number(match[1]),
    words: context.vocabulary,
  }
}

function collectWords() {
  const chapterArg = getArg('chapter')
  const chapterFilter = chapterArg ? new Set(chapterArg.split(',').map((item) => Number(item.trim()))) : null
  const files = readdirSync(vocabDir)
    .filter((file) => /^data-\d+\.js$/.test(file))
    .sort((a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0]))

  const words: Array<VocabItem & { chapter: number }> = []
  for (const file of files) {
    const chapterData = readChapter(join(vocabDir, file))
    if (!chapterData) continue
    if (chapterFilter && !chapterFilter.has(chapterData.chapter)) continue
    for (const word of chapterData.words) {
      if (!word.word?.trim()) continue
      words.push({ ...word, chapter: chapterData.chapter })
    }
  }
  return words
}

function signTencentRequest(payload: string, timestamp: number) {
  const secretId = requireAnyEnv(['TENCENT_TTS_SECRET_ID', 'TENCENT_COS_SECRET_ID'])
  const secretKey = requireAnyEnv(['TENCENT_TTS_SECRET_KEY', 'TENCENT_COS_SECRET_KEY'])
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10)
  const algorithm = 'TC3-HMAC-SHA256'
  const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${endpoint}\nx-tc-action:${action.toLowerCase()}\n`
  const signedHeaders = 'content-type;host;x-tc-action'
  const canonicalRequest = [
    'POST',
    '/',
    '',
    canonicalHeaders,
    signedHeaders,
    sha256Hex(payload),
  ].join('\n')
  const credentialScope = `${date}/${service}/tc3_request`
  const stringToSign = [
    algorithm,
    String(timestamp),
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n')
  const secretDate = hmac(`TC3${secretKey}`, date)
  const secretService = hmac(secretDate, service)
  const secretSigning = hmac(secretService, 'tc3_request')
  const signature = hmacHex(secretSigning, stringToSign)

  return `${algorithm} Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
}

async function synthesizeMp3(text: string) {
  const timestamp = Math.floor(Date.now() / 1000)
  const payload = JSON.stringify({
    Text: text,
    SessionId: randomUUID(),
    ModelType: Number(getEnv('TENCENT_TTS_MODEL_TYPE', '1')),
    VoiceType: Number(getEnv('TENCENT_TTS_VOICE_TYPE', '101001')),
    Codec: 'mp3',
    Speed: Number(getEnv('TENCENT_TTS_SPEED', '0')),
    Volume: Number(getEnv('TENCENT_TTS_VOLUME', '0')),
    SampleRate: Number(getEnv('TENCENT_TTS_SAMPLE_RATE', '16000')),
  })

  const response = await fetch(`https://${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: signTencentRequest(payload, timestamp),
      'Content-Type': 'application/json; charset=utf-8',
      Host: endpoint,
      'X-TC-Action': action,
      'X-TC-Timestamp': String(timestamp),
      'X-TC-Version': apiVersion,
      'X-TC-Region': getEnv('TENCENT_TTS_REGION', 'ap-shanghai'),
    },
    body: payload,
  })

  const data = await response.json() as {
    Response?: { Audio?: string; Error?: { Code?: string; Message?: string }; RequestId?: string }
  }
  const error = data.Response?.Error
  if (!response.ok || error) {
    throw new Error(`${error?.Code || response.status}: ${error?.Message || response.statusText}`)
  }
  if (!data.Response?.Audio) throw new Error('TTS response missing Audio')
  return Buffer.from(data.Response.Audio, 'base64')
}

function createCosClient() {
  return new COS({
    SecretId: requireAnyEnv(['TENCENT_COS_SECRET_ID', 'TENCENT_TTS_SECRET_ID']),
    SecretKey: requireAnyEnv(['TENCENT_COS_SECRET_KEY', 'TENCENT_TTS_SECRET_KEY']),
  })
}

function uploadToCos(cos: COS, key: string, filePath: string) {
  return new Promise<void>((resolve, reject) => {
    cos.putObject(
      {
        Bucket: requireEnv('TENCENT_COS_BUCKET'),
        Region: requireEnv('TENCENT_COS_REGION'),
        Key: key,
        Body: createReadStream(filePath),
        ContentType: 'audio/mpeg',
        CacheControl: 'public, max-age=31536000, immutable',
      },
      (err) => {
        if (err) reject(err)
        else resolve()
      }
    )
  })
}

async function main() {
  const upload = hasFlag('upload')
  const overwrite = hasFlag('overwrite')
  const dryRun = hasFlag('dry-run')
  const writeManifest = !hasFlag('no-manifest')
  const version = getArg('version') || 'v1'
  const locale = getArg('locale') || 'en-us'
  const limit = Number(getArg('limit') || '0')
  const baseUrl = (getArg('base-url') || getEnv('VOCAB_AUDIO_BASE_URL')).replace(/\/$/, '')
  const delayMs = Number(getArg('delay-ms') || '180')
  const words = collectWords().slice(0, limit > 0 ? limit : undefined)
  const cos = upload ? createCosClient() : null
  const manifest: Manifest = {
    version,
    generatedAt: new Date().toISOString(),
    baseUrl,
    words: {},
  }

  if (!baseUrl) {
    console.warn('VOCAB_AUDIO_BASE_URL or --base-url is empty; manifest URLs will be relative to the key.')
  }

  mkdirSync(join(outputRoot, locale, version), { recursive: true })

  let generated = 0
  let skipped = 0
  let uploaded = 0

  for (const item of words) {
    const slug = normalizeWord(item.word)
    const fileName = `c${String(item.chapter).padStart(2, '0')}-${String(item.id).padStart(4, '0')}-${slug}.mp3`
    const cosKey = `ielts-vocab/${locale}/${version}/${fileName}`
    const localPath = join(outputRoot, locale, version, fileName)
    const url = baseUrl ? `${baseUrl}/${cosKey}` : cosKey

    manifest.words[manifestKey(item.chapter, item.id)] = {
      chapter: item.chapter,
      id: item.id,
      word: item.word,
      key: cosKey,
      url,
    }

    if (existsSync(localPath) && !overwrite) {
      skipped++
    } else if (!dryRun) {
      const audio = await synthesizeMp3(item.word)
      writeFileSync(localPath, audio)
      generated++
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }

    if (upload && cos && !dryRun) {
      await uploadToCos(cos, cosKey, localPath)
      uploaded++
    }

    console.log(`[${generated + skipped}/${words.length}] ${item.word} -> ${cosKey}`)
  }

  if (dryRun) {
    console.log('Dry run complete. Manifest was not written.')
  } else if (!writeManifest) {
    console.log('Manifest was not written because --no-manifest was set.')
  } else {
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
    console.log(`Manifest written: ${manifestPath}`)
  }
  console.log(`Done. generated=${generated}, skipped=${skipped}, uploaded=${uploaded}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
