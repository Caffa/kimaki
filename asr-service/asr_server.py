#!/usr/bin/env python3
"""
ASR Service - FastAPI wrapper for parakeet-mlx + whisper fallback
Provides HTTP API for speech-to-text transcription using NVIDIA Parakeet on Apple Silicon,
with an optional mlx-whisper fallback for Chinese and other languages when parakeet returns empty text.
"""

import os
import tempfile
import uuid
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile, Body
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Lazy import parakeet-mlx to allow service to start without model preloaded
parakeet_model: Optional[object] = None

# Lazy import mlx_whisper fallback. None means "not yet attempted"; False means import failed.
whisper_available: Optional[bool] = None

# MLX buffer cache cap (bytes). MLX caches freed Metal buffers indefinitely;
# with variable-length audio the cache grows unbounded (observed: 20.8 GB after 4 days).
MLX_CACHE_LIMIT = int(os.environ.get("ASR_MLX_CACHE_LIMIT", str(512 * 1024 * 1024)))

_mlx_core: Optional[object] = None

_cache_limit_applied: bool = False


def get_mlx_core():
    """Lazy import mlx.core; returns None if unavailable so callers can skip cache maintenance."""
    global _mlx_core
    if _mlx_core is None:
        try:
            import mlx.core as mx
            _mlx_core = mx
        except Exception as e:
            print(f"mlx.core unavailable, skipping cache maintenance: {e}")
            _mlx_core = False
    return _mlx_core or None


def apply_cache_limit() -> None:
    """Cap the MLX Metal buffer cache so a long-lived server cannot grow it unbounded."""
    global _cache_limit_applied
    mx = get_mlx_core()
    if mx is None:
        return
    try:
        setter = getattr(getattr(mx, "metal", mx), "set_cache_limit", None)
        if setter is not None:
            setter(MLX_CACHE_LIMIT)
            _cache_limit_applied = True
            print(f"MLX cache limit set to {MLX_CACHE_LIMIT // (1024 * 1024)} MB")
    except Exception as e:
        print(f"Failed to set MLX cache limit: {e}")


def clear_mlx_cache() -> None:
    """Release cached MLX Metal buffers after a transcription."""
    mx = get_mlx_core()
    if mx is None:
        return
    try:
        mx.clear_cache()
    except Exception as e:
        print(f"Failed to clear MLX cache: {e}")


app = FastAPI(
    title="Parakeet MLX ASR Service",
    description="Speech-to-text transcription using NVIDIA Parakeet on Apple Silicon with whisper fallback",
    version="1.1.0",
)


class TranscriptionResponse(BaseModel):
    """Response model for transcription."""
    text: str
    duration: Optional[float] = None
    language: Optional[str] = None


class HealthResponse(BaseModel):
    """Response model for health check."""
    status: str
    model_loaded: bool
    model_name: str
    fallback_model_name: Optional[str] = None


class TranscribeError(Exception):
    """Internal exception used during transcription fallback handling."""
    pass


def get_fallback_model_name() -> str:
    """Return the configured whisper fallback model name."""
    return os.environ.get("ASR_FALLBACK_MODEL", "mlx-community/whisper-large-v3-turbo")


def get_model():
    """Lazy load the parakeet-mlx model."""
    global parakeet_model
    if parakeet_model is None:
        try:
            from parakeet_mlx import from_pretrained
            
            model_name = os.environ.get("PARAKEET_MODEL", "mlx-community/parakeet-tdt-0.6b-v3")
            print(f"Loading parakeet-mlx model: {model_name}")
            parakeet_model = from_pretrained(model_name)
            print(f"Model loaded successfully")
        except Exception as e:
            print(f"Failed to load model: {e}")
            raise
    return parakeet_model


def load_whisper() -> Optional[object]:
    """Lazy import mlx_whisper; import failures are cached so we do not retry them, but model load/download failures during transcription are caught per-call and retried next time."""
    global whisper_available

    if whisper_available is False:
        return None

    try:
        import mlx_whisper
        whisper_available = True
        return mlx_whisper
    except Exception as e:
        print(f"Failed to load mlx_whisper fallback: {e}")
        whisper_available = False
        return None


def transcribe_with_parakeet(audio_path: str) -> tuple[str, Optional[float], Optional[str]]:
    """Transcribe with parakeet and return (text, duration, language)."""
    model = get_model()
    result = model.transcribe(audio_path)
    duration = result.sentences[0].end if result.sentences else None
    return result.text, duration, "en"


def transcribe_with_whisper(audio_path: str, language: Optional[str] = None) -> tuple[str, Optional[float], Optional[str]]:
    """Transcribe with mlx_whisper fallback and return (text, duration, detected_language)."""
    mlx_whisper = load_whisper()
    if mlx_whisper is None:
        raise TranscribeError("mlx_whisper fallback not available")

    model_name = get_fallback_model_name()
    print(f"Running whisper fallback: {model_name}")
    result = mlx_whisper.transcribe(audio_path, path_or_hf_repo=model_name)
    text = result.get("text", "") if isinstance(result, dict) else getattr(result, "text", "")
    text = text.strip()

    segments = result.get("segments", []) if isinstance(result, dict) else getattr(result, "segments", [])
    duration = None
    if segments:
        last_segment = segments[-1]
        if isinstance(last_segment, dict):
            duration = last_segment.get("end")
        else:
            duration = getattr(last_segment, "end", None)

    detected_language = result.get("language") if isinstance(result, dict) else getattr(result, "language", None)
    detected_language = detected_language or language
    return text, duration, detected_language


def run_transcription(
    audio_path: str,
    language: Optional[str] = None,
    force_fallback: bool = False,
) -> tuple[str, Optional[float], Optional[str]]:
    """Run transcription with optional parakeet -> whisper fallback when text is empty."""
    global _cache_limit_applied
    if not _cache_limit_applied:
        apply_cache_limit()

    try:
        if force_fallback:
            return transcribe_with_whisper(audio_path, language=language)

        text, duration, detected_language = transcribe_with_parakeet(audio_path)
        if not text.strip():
            print(f"Parakeet returned empty text; trying whisper fallback")
            try:
                text, duration, detected_language = transcribe_with_whisper(audio_path, language=language)
            except TranscribeError as e:
                print(f"Fallback unavailable, returning empty parakeet result: {e}")
            except Exception as e:
                print(f"Fallback transcription failed: {e}; returning empty parakeet result")

        return text, duration, detected_language
    finally:
        clear_mlx_cache()


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check if the service and model are healthy."""
    model = None
    try:
        model = get_model()
    except Exception:
        pass
    
    model_name = os.environ.get("PARAKEET_MODEL", "mlx-community/parakeet-tdt-0.6b-v3")
    fallback_name = None

    # Probe mlx_whisper availability without trying to load weights yet.
    try:
        import mlx_whisper as _  # noqa: F401
        fallback_name = get_fallback_model_name()
    except Exception:
        pass
    
    response = HealthResponse(
        status="healthy" if model else "degraded",
        model_loaded=model is not None,
        model_name=model_name,
        fallback_model_name=fallback_name,
    )
    
    if not model:
        return JSONResponse(status_code=503, content=response.model_dump())
    
    return response


@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    language: Optional[str] = None,
    force_fallback: bool = False,
):
    """
    Transcribe audio file to text.
    
    Args:
        file: Audio file (WAV, MP3, OGG, M4A, etc.)
        language: Optional language hint (e.g., "en")
        force_fallback: Skip parakeet and run whisper fallback directly
    
    Returns:
        JSON with transcription text, duration, and detected language
    """
    # Validate file type
    allowed_extensions = {".wav", ".mp3", ".ogg", ".m4a", ".flac", ".aac"}
    file_ext = Path(file.filename or "").suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_ext}. Allowed: {allowed_extensions}"
        )
    
    # Save uploaded file to temp location
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        text, duration, detected_language = run_transcription(
            tmp_path,
            language=language,
            force_fallback=force_fallback,
        )
        
        return TranscriptionResponse(
            text=text,
            duration=duration,
            language=detected_language or language or "en",
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {str(e)}"
        )
    finally:
        # Clean up temp file
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


@app.post("/transcribe/base64", response_model=TranscriptionResponse)
async def transcribe_audio_base64(
    audio_data: str = Body(..., description="Base64 encoded audio"),
    media_type: str = Body("audio/wav", description="MIME type of audio"),
    language: Optional[str] = Body(None, description="Language hint"),
    force_fallback: bool = Body(False, description="Skip parakeet and run whisper fallback directly"),
):
    """
    Transcribe base64-encoded audio to text.
    
    Args:
        audio_data: Base64-encoded audio data
        media_type: MIME type of the audio (default: audio/wav)
        language: Optional language hint
        force_fallback: Skip parakeet and run whisper fallback directly
    
    Returns:
        JSON with transcription text
    """
    import base64
    
    # Determine file extension from media type
    ext_map = {
        "audio/wav": ".wav",
        "audio/x-wav": ".wav",
        "audio/mp3": ".mp3",
        "audio/mpeg": ".mp3",
        "audio/ogg": ".ogg",
        "audio/opus": ".ogg",
        "audio/mp4": ".m4a",
        "audio/m4a": ".m4a",
        "audio/x-m4a": ".m4a",
        "audio/flac": ".flac",
        "audio/aac": ".aac",
    }
    file_ext = ext_map.get(media_type.lower(), ".wav")
    
    try:
        audio_bytes = base64.b64decode(audio_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 data: {e}")
    
    # Write to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name
    
    try:
        text, duration, detected_language = run_transcription(
            tmp_path,
            language=language,
            force_fallback=force_fallback,
        )
        
        return TranscriptionResponse(
            text=text,
            duration=duration,
            language=detected_language or language or "en",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.environ.get("ASR_PORT", "8765"))
    host = os.environ.get("ASR_HOST", "127.0.0.1")
    
    print(f"Starting ASR service on {host}:{port}")
    print(f"Model: {os.environ.get('PARAKEET_MODEL', 'mlx-community/parakeet-tdt-0.6b-v3')}")
    print(f"Fallback model: {get_fallback_model_name()}")
    
    apply_cache_limit()
    
    uvicorn.run(app, host=host, port=port)
