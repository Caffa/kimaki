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

The service runs on `http://127.0.0.1:8765` by default.

Environment variables:
- `ASR_PORT` - Port number (default: 8765)
- `ASR_HOST` - Host address (default: 127.0.0.1)
- `PARAKEET_MODEL` - Model to use (default: mlx-community/parakeet-tdt-0.6b-v3)

### Available models

- `mlx-community/parakeet-tdt-0.6b-v3` - English + multilingual (default)
- `mlx-community/parakeet-tdt-0.6b-v2` - English only
- `mlx-community/parakeet-ctc-0.6b-v2` - English only

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
  "model_name": "mlx-community/parakeet-tdt-0.6b-v3"
}
```

### Transcribe (multipart)

```bash
POST /transcribe
Content-Type: multipart/form-data

file: <audio file>
language: "en" (optional)
```

### Transcribe (base64)

```bash
POST /transcribe/base64
Content-Type: application/json

{
  "audio_data": "<base64 encoded audio>",
  "media_type": "audio/wav",
  "language": "en" (optional)
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
export ASR_SERVICE_URL=http://localhost:8765

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

On first run, the model (~600MB) will be downloaded from HuggingFace. This may take a few minutes depending on your internet connection.

### FFmpeg not found

Install ffmpeg:

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg
```
