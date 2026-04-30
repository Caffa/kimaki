# ASR Service for Kimaki

This directory contains the local ASR (Automatic Speech Recognition) service for Kimaki.
It uses NVIDIA's Parakeet TDT model accelerated by Apple's MLX framework for fast, accurate,
and private voice transcription on Apple Silicon devices.

## Features

- **Local Processing**: All audio is processed locally - nothing sent to cloud
- **Apple Silicon Optimized**: Uses MLX for M1/M2/M3/M4 acceleration
- **Fast**: ~0.4s transcription time, ~1.2s model load
- **Accurate**: NVIDIA Parakeet TDT 0.6B for high-quality English transcription

## Prerequisites

1. Apple Silicon Mac (M1/M2/M3/M4)
2. Python 3.12+
3. [uv](https://docs.astral.sh/uv/) package manager (recommended)

## Installation

Using uv (recommended):
```bash
cd asr-service
uv run --with parakeet-mlx --with mlx python asr_server.py
```

Or with pip:
```bash
pip install -r requirements.txt
python asr_server.py
```

## Running the Server

```bash
# Default: http://127.0.0.1:8765
uv run --with parakeet-mlx --with mlx python asr_server.py

# Custom port/host
ASR_PORT=9000 ASR_HOST=0.0.0.0 uv run --with parakeet-mlx --with mlx python asr_server.py

# Use a different model
PARAKEET_MODEL=mlx-community/parakeet-tdt_ctc-110m uv run --with parakeet-mlx python asr_server.py
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
  "parakeet_available": true,
  "model_loaded": true,
  "model_name": "mlx-community/parakeet-tdt-0.6b-v2"
}
```

### Transcribe Audio

```bash
# Send audio file for transcription
curl -X POST http://127.0.0.1:8765/transcribe \
  --data-binary @audio.wav \
  -H "Content-Type: audio/wav"
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

## Available Models

- `mlx-community/parakeet-tdt-0.6b-v2` (default) - Best quality English transcription
- `mlx-community/parakeet-tdt_ctc-110m` - Smaller, faster model

Set via `PARAKEET_MODEL` environment variable.

## Troubleshooting

### parakeet-mlx Not Found

```bash
pip install parakeet-mlx
# or
uv run --with parakeet-mlx python asr_server.py
```

### Model Download

The first run will download the model from HuggingFace (~1GB).
Subsequent runs use the cached model.

### Port Already in Use

```bash
# Check if ASR service is already running
curl http://127.0.0.1:8765/health

# Kill existing process
lsof -i :8765
kill <PID>
```

### Memory Issues

If you get memory errors, try a smaller model:
```bash
PARAKEET_MODEL=mlx-community/parakeet-tdt_ctc-110m python asr_server.py
```

## License

This ASR service is provided as-is for use with Kimaki.
NVIDIA Parakeet and related models have their own licenses.