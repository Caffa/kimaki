# Parakeet MLX ASR Service

Local speech-to-text service using NVIDIA Parakeet on Apple Silicon (MLX).

## Why Parakeet?

- **10x faster** than Whisper on Apple Silicon
- **Better accuracy** for English (6.32% WER vs 7.44%)
- **No hallucinations** on silence
- **100% local** - no cloud, no API keys
- **Free** - no per-minute costs

## Installation

The ASR service uses a Python 3.13 virtual environment (MLX has no wheels for
Python 3.14).  Kimaki's `asr-service-manager` creates the venv automatically on
first start using [`uv`](https://docs.astral.sh/uv/) (preferred) or the system
`python3.13`.

### Manual setup

```bash
cd asr-service

# Using uv (recommended — fast and handles Python version automatically)
uv venv --python 3.13 .venv
uv pip install -r requirements.txt --python .venv/bin/python

# Or using plain venv
python3.13 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

Requirements:
- Python 3.10–3.13 (3.14 is **not** supported — MLX lacks wheels)
- macOS with Apple Silicon (M1/M2/M3)
- ffmpeg (for audio format conversion)
- [`uv`](https://docs.astral.sh/uv/) (optional but recommended: `brew install uv`)

## Usage

### Start the service

```bash
# Using the venv (auto-created by kimaki on first run)
.venv/bin/python asr_server.py
```

The service runs on `http://127.0.0.1:8770` by default.

Environment variables:
- `ASR_PORT` - Port number (default: 8770)
- `ASR_HOST` - Host address (default: 127.0.0.1)
- `PARAKEET_MODEL` - Model to use (default: mlx-community/parakeet-tdt-0.6b-v3)
- `ASR_FALLBACK_MODEL` - Whisper fallback model (default: mlx-community/whisper-large-v3-turbo)
- `ASR_FALLBACK_LANGUAGES` - Languages whisper tries on fallback, best pass wins (default: `en,zh`; empty or `none` = one auto-detect pass)
- `ASR_PARAKEET_CONFIDENCE_THRESHOLD` - Mean parakeet sentence confidence below which whisper also runs (default: 0.8)

### Available models

- `mlx-community/parakeet-tdt-0.6b-v3` - English + multilingual (default)
- `mlx-community/parakeet-tdt-0.6b-v2` - English only
- `mlx-community/parakeet-ctc-0.6b-v2` - English only

## Fallback transcription (Chinese and more)

Parakeet is fast and accurate for English but can fail on Chinese audio — either
garbling it into fake English or returning empty text for real voice notes. The
service keeps parakeet as the primary model and automatically falls back to
`mlx-whisper` when parakeet errors, returns empty text, or returns text with
low mean sentence confidence (below `ASR_PARAKEET_CONFIDENCE_THRESHOLD`).
Whisper then runs once per language in `ASR_FALLBACK_LANGUAGES` (English and
Chinese by default), scores each pass by mean segment `avg_logprob`, and keeps
the best-scoring non-empty result — so Chinese voice notes transcribe instead
of coming back as parakeet's fake-English garbage.

- The fallback triggers on parakeet errors, empty text, or mean sentence
  confidence below the threshold (default 0.8). A whisper result only replaces
  parakeet's non-empty text when whisper returns non-empty text of its own.
- `ASR_FALLBACK_LANGUAGES` is comma-separated (e.g. `en,zh,ja`); an empty value
  or `none` runs a single auto-detect pass instead.
- An explicit `language` parameter on either endpoint (e.g. `?language=zh`) is
  honored as a preferred forced pass ahead of `ASR_FALLBACK_LANGUAGES`, so it
  wins ties.
- Mandarin (`zh*`) whisper passes send a simplified-Mandarin `initial_prompt`
  ("以下是普通话的句子。") so results come back in simplified characters.
- Use `force_fallback=1` (`/transcribe` query param or `force_fallback: true` in
  `/transcribe/base64`) to bypass parakeet and run only whisper — useful for
  testing the fallback path directly.
- The first whisper call downloads the model (~1.6 GB) to the local HuggingFace
  cache if it is not already present.
- If `mlx-whisper` fails to install or load, the service logs the error and
  continues in parakeet-only mode.

## API Endpoints

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_name": "mlx-community/parakeet-tdt-0.6b-v3",
  "fallback_model_name": "mlx-community/whisper-large-v3-turbo"
}
```

`fallback_model_name` is `null` when `mlx-whisper` is not installed.

### Transcribe (multipart)

```bash
POST /transcribe
Content-Type: multipart/form-data

file: <audio file>
language: "en" (optional)
force_fallback: true (optional)
```

### Transcribe (base64)

```bash
POST /transcribe/base64
Content-Type: application/json

{
  "audio_data": "<base64 encoded audio>",
  "media_type": "audio/wav",
  "language": "en" (optional),
  "force_fallback": true (optional)
}
```

Response:
```json
{
  "text": "Transcribed text here",
  "duration": 2.5,
  "language": "en"
}
```

## Integration with Kimaki

Set the environment variable to use parakeet:

```bash
# Use parakeet for voice transcription (no API key needed)
export ASR_PROVIDER=parakeet

# Or configure the service URL if running on a different host
export ASR_SERVICE_URL=http://localhost:8770

# Start kimaki
kimaki
```

Or configure in your project's environment:

```bash
# In your project's .env file
ASR_PROVIDER=parakeet
```

## Troubleshooting

### "Parakeet service is not running"

Make sure to start the ASR service before running kimaki:

```bash
cd asr-service
.venv/bin/python asr_server.py
```

### Model download

On first run, the parakeet model (~600MB) will be downloaded from HuggingFace. This may take a few minutes depending on your internet connection. The whisper fallback model (~1.6 GB) is downloaded the first time it is used.

### FFmpeg not found

Install ffmpeg:

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg
```
