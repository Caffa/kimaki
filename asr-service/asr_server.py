#!/usr/bin/env python3
"""
ASR Service - HTTP wrapper for parakeet-mlx
Provides HTTP API for speech-to-text transcription using NVIDIA Parakeet on Apple Silicon.

Usage:
    python asr_server.py

Environment Variables:
    ASR_PORT: Port to run the server on (default: 8765)
    ASR_HOST: Host to bind to (default: 127.0.0.1)
    PARAKEET_MODEL: Model to use (default: mlx-community/parakeet-tdt-0.6b-v2)
"""

import os
import sys
import json
import tempfile
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('asr-server')

# Default model
DEFAULT_MODEL = 'mlx-community/parakeet-tdt-0.6b-v2'

# Try to import parakeet-mlx
HAS_PARAKEET = False
try:
    import parakeet_mlx
    HAS_PARAKEET = True
except ImportError:
    logger.warning("parakeet-mlx not available. Install with: pip install parakeet-mlx")

# Global model reference
model = None
model_name = None

# Configuration
ASR_PORT = int(os.environ.get('ASR_PORT', 8765))
ASR_HOST = os.environ.get('ASR_HOST', '127.0.0.1')
PARAKEET_MODEL = os.environ.get('PARAKEET_MODEL', DEFAULT_MODEL)


def load_parakeet_model():
    """Load the Parakeet model for transcription."""
    global model, model_name
    
    if not HAS_PARAKEET:
        raise RuntimeError("parakeet-mlx is required. Install with: pip install parakeet-mlx")
    
    model_name = PARAKEET_MODEL
    logger.info(f"Loading Parakeet model: {model_name}")
    
    try:
        model = parakeet_mlx.from_pretrained(model_name)
        logger.info(f"Model loaded successfully: {type(model).__name__}")
        return True
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise


def transcribe_audio(audio_data: bytes, temp_suffix: str = '.ogg') -> str:
    """
    Transcribe audio data to text using Parakeet.
    
    Args:
        audio_data: Raw audio bytes (WAV, MP3, OGG, etc.)
        temp_suffix: File extension hint for temp file
    
    Returns:
        Transcribed text string
    """
    global model
    
    if model is None:
        raise RuntimeError("Model not loaded. Call load_parakeet_model() first.")
    
    # Detect format from audio_data header if possible
    if audio_data[:4] == b'RIFF':
        temp_suffix = '.wav'
    elif audio_data[:3] == b'Ogg':
        temp_suffix = '.ogg'
    elif audio_data[:3] == b'ID3' or audio_data[:2] == b'\xff\xfb':
        temp_suffix = '.mp3'
    
    # Save to temp file for processing
    with tempfile.NamedTemporaryFile(suffix=temp_suffix, delete=False) as f:
        f.write(audio_data)
        temp_path = f.name
    
    try:
        logger.info(f"Transcribing audio file: {temp_path}")
        
        # Run transcription using parakeet-mlx
        result = model.transcribe(temp_path)
        
        # result is an AlignedResult object with .text attribute
        transcription = result.text.strip()
        
        logger.info(f"Transcription complete: '{transcription[:100]}{'...' if len(transcription) > 100 else ''}'")
        return transcription
    
    finally:
        # Cleanup temp file
        Path(temp_path).unlink(missing_ok=True)


class ASRHandler(BaseHTTPRequestHandler):
    """HTTP request handler for ASR endpoints."""
    
    def log_message(self, format, *args):
        """Override to use our logger."""
        logger.info(format % args)
    
    def _send_json_response(self, data: dict, status: int = 200):
        """Send a JSON response."""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests."""
        if self.path == '/health':
            self._send_json_response({
                'status': 'healthy',
                'parakeet_available': HAS_PARAKEET,
                'model_loaded': model is not None,
                'model_name': model_name
            })
        else:
            self._send_json_response({'error': 'Not found'}, 404)
    
    def do_POST(self):
        """Handle POST requests."""
        if self.path == '/transcribe':
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._send_json_response({'error': 'No audio data provided'}, 400)
                return
            
            audio_data = self.rfile.read(content_length)
            
            try:
                transcription = transcribe_audio(audio_data)
                self._send_json_response({
                    'text': transcription,
                    'success': True
                })
            except Exception as e:
                logger.error(f"Transcription error: {e}")
                import traceback
                traceback.print_exc()
                self._send_json_response({
                    'error': str(e),
                    'success': False
                }, 500)
        else:
            self._send_json_response({'error': 'Not found'}, 404)


def main():
    """Start the ASR server."""
    if not HAS_PARAKEET:
        logger.error("parakeet-mlx is required. Install with: pip install parakeet-mlx")
        sys.exit(1)
    
    # Load model on startup
    try:
        load_parakeet_model()
    except Exception as e:
        logger.error(f"Failed to load model on startup: {e}")
        logger.info("Model will be loaded on first transcription request")
    
    server = HTTPServer((ASR_HOST, ASR_PORT), ASRHandler)
    logger.info(f"ASR server running on http://{ASR_HOST}:{ASR_PORT}")
    logger.info(f"Health check: http://{ASR_HOST}:{ASR_PORT}/health")
    logger.info(f"Transcribe endpoint: POST http://{ASR_HOST}:{ASR_PORT}/transcribe")
    logger.info(f"Model: {model_name or 'not loaded'}")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down ASR server...")
        server.shutdown()


if __name__ == '__main__':
    main()