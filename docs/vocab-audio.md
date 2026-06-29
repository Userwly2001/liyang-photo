## IELTS Vocab Audio

The vocab pages prefer pre-generated MP3 files from `public/ielts-vocab/audio-manifest.json`.
If an MP3 is missing or playback fails, the browser falls back to Web Speech API.

### Environment

Put these values in `.env.local` or export them in the shell:

```bash
TENCENT_TTS_SECRET_ID=your-secret-id
TENCENT_TTS_SECRET_KEY=your-secret-key
TENCENT_TTS_REGION=ap-shanghai
TENCENT_TTS_VOICE_TYPE=101001

TENCENT_COS_SECRET_ID=your-secret-id
TENCENT_COS_SECRET_KEY=your-secret-key
TENCENT_COS_BUCKET=your-bucket-1234567890
TENCENT_COS_REGION=ap-shanghai
VOCAB_AUDIO_BASE_URL=https://audio.leonwang.cc
```

If the same Tencent key can access both TTS and COS, `TENCENT_COS_SECRET_ID` and
`TENCENT_COS_SECRET_KEY` can also be used for TTS.

### Generate Locally

```bash
npm run vocab:audio -- --chapter=1 --limit=10
```

Generated MP3 files are written to:

```text
generated-audio/ielts-vocab/en-us/v1/
```

The script also writes:

```text
public/ielts-vocab/audio-manifest.json
```

### Generate And Upload To COS

```bash
npm run vocab:audio:upload -- --base-url=https://audio.leonwang.cc
```

COS object keys use this format:

```text
ielts-vocab/en-us/v1/c01-0001-atmosphere.mp3
```

The upload sets:

```text
Content-Type: audio/mpeg
Cache-Control: public, max-age=31536000, immutable
```

### Regenerate Existing Files

```bash
npm run vocab:audio:upload -- --overwrite --base-url=https://audio.leonwang.cc
```
