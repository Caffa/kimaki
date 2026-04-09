# ASR Service for Kimaki

This directory contains the local ASR (Automatic Speech Recognition) service for Kimaki.
It uses NVIDIA's Parakeet model accelerated by Apple's MLX framework for fast, accurate,
and private voice transcription on Apple Silicon devices.

## Features

- **Local Processing**: All audio is processed locally - nothing sent to cloud
- **Apple Silicon Optimized**: Uses MLX for M1/M2/M3 acceleration
- **Fast**: ~10x faster than Whisper on Apple Silicon
- **Accurate**: NVIDIA Parakeet model for high-quality English transcription

## Prerequisites

1. Apple Silicon Mac (M1/M2/M3/M4)
2. Python 3.12+
3. Audio input files in WAV, MP3, or OGG format

## Installation

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Or install individually:
pip install mlx mlx-audio
pip install nemo-toolkit  # Optional, for alternative models
```

## Running the Server

```bash
# Default: http://127.0.0.1:8765
python asr_server.py

# Custom port/host
ASR_PORT=9000 ASR_HOST=0.0.0.0 python asr_server.py
```

## Endpoints

### Health Check

```bash
curl http://127.0.0.1:8765/health
```

Response:
```json
{
  "status": "healthy",
  "mlx_available": true,
  "model_loaded": true
}
```

### Transcribe Audio

```bash
# Send audio file for transcription
curl -X POST http://127.0.0.1:8765/transcribe \
  --data-binary @audio.ogg \
  -H "Content-Type: application/octet-stream"
```

Response:
```json
{
  "text": "Hello, this is my transcribed voice message.",
  "success": true
}
```

## Integration with Kimaki

Kimaki will automatically start this ASR service when:

1. Running on Apple Silicon (`darwin` + `arm64`)
2. `ASR_PROVIDER` is not set or set to `parakeet`
3. The ASR service is not already running

You can also set `ASR_SERVICE_PATH` to specify a custom location:

```bash
export ASR_SERVICE_PATH=/path/to/kimaki/asr-service
```

## Alternative Providers

If you don't have Apple Silicon or prefer cloud providers:

```bash
# OpenAI Whisper API
export ASR_PROVIDER=openai
export OPENAI_API_KEY=sk-...

# Google Gemini
export ASR_PROVIDER=gemini
export GEMINI_API_KEY=...

# vLLM (local GPU/CPU Whisper)
export ASR_PROVIDER=vllm
export VLLM_AUTO_START=true
```

## Troubleshooting

### MLX Not Found

```
pip install mlx mlx-audio
```

### Model Download

The first transcription may take longer as it downloads the Parakeet model.
Subsequent transcriptions will use the cached model.

### Port Already in Use

```bash
# Check if ASR service is already running
curl http://127.0.0.1:8765/health

# Kill existing process
lsof -i :8765
kill <PID>
```

## License

This ASR service is provided as-is for use with Kimaki.
NVIDIA Parakeet and related models have their own licenses.